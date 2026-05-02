import { useEffect, useMemo, useState } from "react";
import "./organizer-panel.css";

type Note = {
  id: string;
  text: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
};

type Task = {
  id: string;
  text: string;
  done?: boolean;
  due?: string | null;
  created_at?: string;
  updated_at?: string;
};

type Reminder = {
  id?: string;
  text?: string;
  title?: string;
  due?: string;
  created_at?: string;
};

type AuditEntry = {
  id?: string;
  task?: string;
  source?: string;
  status?: string;
  result?: string;
  requires_confirmation?: boolean;
  risk?: "low" | "medium" | "high";
  target?: string;
  created_at?: string;
};

type Props = {
  onSend: (message: string) => void;
};

function normalizeList<T>(data: unknown, keys: string[]): T[] {
  if (Array.isArray(data)) return data as T[];
  if (!data || typeof data !== "object") return [];
  const obj = data as Record<string, unknown>;
  for (const key of keys) {
    if (Array.isArray(obj[key])) return obj[key] as T[];
  }
  return [];
}

function formatDate(value?: string | null) {
  if (!value) return "ohne Datum";
  return value.replace("T", " ").slice(0, 16);
}

async function requestJson(url: string, options?: RequestInit) {
  const response = await fetch(url, options);
  const text = await response.text();
  let data: unknown = text;
  try { data = text ? JSON.parse(text) : {}; } catch {}
  if (!response.ok) {
    const detail = data && typeof data === "object" && "detail" in data ? String((data as { detail: unknown }).detail) : text || `HTTP ${response.status}`;
    throw new Error(detail);
  }
  return data;
}

export function OrganizerPanel({ onSend }: Props) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([]);
  const [noteText, setNoteText] = useState("");
  const [taskText, setTaskText] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const openTasks = useMemo(() => tasks.filter((task) => !task.done), [tasks]);
  const doneTasks = useMemo(() => tasks.filter((task) => task.done), [tasks]);
  const waitingAudit = useMemo(() => auditEntries.filter((entry) => entry.status === "waiting" || entry.requires_confirmation), [auditEntries]);
  const highRiskAudit = useMemo(() => auditEntries.filter((entry) => entry.risk === "high"), [auditEntries]);

  async function loadAll() {
    setBusy(true);
    setError("");
    try {
      const [notesData, tasksData, remindersData, auditData] = await Promise.all([
        requestJson(`/notes?q=${encodeURIComponent(filter)}&limit=100`),
        requestJson(`/tasks?q=${encodeURIComponent(filter)}`),
        requestJson("/reminders"),
        requestJson("/automation/audit?limit=12"),
      ]);
      setNotes(normalizeList<Note>(notesData, ["notes", "items", "results"]));
      setTasks(normalizeList<Task>(tasksData, ["tasks", "items", "results"]));
      setReminders(normalizeList<Reminder>(remindersData, ["reminders", "items", "results"]));
      setAuditEntries(normalizeList<AuditEntry>(auditData, ["entries", "audit", "items", "results"]));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  async function addNote() {
    const text = noteText.trim();
    if (!text) return;
    setBusy(true);
    setError("");
    try {
      await requestJson("/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      setNoteText("");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  async function addTask() {
    const text = taskText.trim();
    if (!text) return;
    setBusy(true);
    setError("");
    try {
      await requestJson("/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, due: taskDue || null }),
      });
      setTaskText("");
      setTaskDue("");
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  async function toggleTask(task: Task) {
    setBusy(true);
    setError("");
    try {
      await requestJson(`/tasks/${encodeURIComponent(task.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !task.done }),
      });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  async function deleteTask(task: Task) {
    setBusy(true);
    setError("");
    try {
      await requestJson(`/tasks/${encodeURIComponent(task.id)}`, { method: "DELETE" });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  async function deleteNote(note: Note) {
    setBusy(true);
    setError("");
    try {
      await requestJson(`/notes/${encodeURIComponent(note.id)}`, { method: "DELETE" });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  }

  return (
    <section className="jv-organizer-shell">
      <div className="jv-organizer-header">
        <div>
          <small>Automation Cluster</small>
          <h1>Aufgaben & Automationen</h1>
          <p>Aufgaben, Notizen, Erinnerungen und Audit Log als zusammenhängendes Cluster.</p>
        </div>
        <div className="jv-organizer-actions">
          <input value={filter} onChange={(e) => setFilter(e.target.value)} onKeyDown={(e) => e.key === "Enter" && loadAll()} placeholder="Suchen..." />
          <button disabled={busy} onClick={loadAll}>{busy ? "LÄDT" : "AKTUALISIEREN"}</button>
        </div>
      </div>

      {error && <div className="jv-organizer-error">{error}</div>}

      <div className="jv-organizer-grid">
        <section className="jv-organizer-card jv-task-card">
          <div className="jv-organizer-title"><h2>Offene Aufgaben</h2><span>{openTasks.length} offen</span></div>
          <div className="jv-create-row">
            <input value={taskText} onChange={(e) => setTaskText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTask()} placeholder="Neue Aufgabe..." />
            <input className="jv-date-input" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} placeholder="Fällig z.B. morgen" />
            <button disabled={busy} onClick={addTask}>ANLEGEN</button>
          </div>
          <div className="jv-item-list">
            {openTasks.length === 0 && <div className="jv-empty">Keine offenen Aufgaben.</div>}
            {openTasks.map((task) => (
              <article className="jv-organizer-item" key={task.id}>
                <button className="jv-check" onClick={() => toggleTask(task)}>○</button>
                <div><b>{task.text}</b><span>Fällig: {formatDate(task.due)} · Erstellt: {formatDate(task.created_at)}</span></div>
                <button onClick={() => onSend(`Hilf mir mit dieser Aufgabe: ${task.text}`)}>CHAT</button>
                <button onClick={() => deleteTask(task)}>LÖSCHEN</button>
              </article>
            ))}
          </div>
        </section>

        <section className="jv-organizer-card">
          <div className="jv-organizer-title"><h2>Notizen</h2><span>{notes.length} Einträge</span></div>
          <div className="jv-note-compose">
            <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Neue Notiz..." />
            <button disabled={busy} onClick={addNote}>NOTIZ SPEICHERN</button>
          </div>
          <div className="jv-item-list compact">
            {notes.length === 0 && <div className="jv-empty">Keine Notizen gefunden.</div>}
            {notes.map((note) => (
              <article className="jv-organizer-item note" key={note.id}>
                <div><b>{note.text}</b><span>{formatDate(note.created_at)}</span></div>
                <button onClick={() => onSend(`Fasse diese Notiz zusammen: ${note.text}`)}>CHAT</button>
                <button onClick={() => deleteNote(note)}>LÖSCHEN</button>
              </article>
            ))}
          </div>
        </section>

        <section className="jv-organizer-card">
          <div className="jv-organizer-title"><h2>Erinnerungen</h2><span>{reminders.length} aktiv</span></div>
          <div className="jv-item-list compact">
            {reminders.length === 0 && <div className="jv-empty">Keine Erinnerungen vorhanden.</div>}
            {reminders.map((reminder, index) => (
              <article className="jv-organizer-item note" key={reminder.id || index}>
                <div><b>{reminder.text || reminder.title || "Erinnerung"}</b><span>{formatDate(reminder.due || reminder.created_at)}</span></div>
                <button onClick={() => onSend(`Was ist bei dieser Erinnerung zu tun: ${reminder.text || reminder.title || "Erinnerung"}`)}>CHAT</button>
              </article>
            ))}
          </div>
        </section>

        <section className="jv-organizer-card jv-summary-card">
          <div className="jv-organizer-title"><h2>Audit Log</h2><span>{auditEntries.length} Einträge</span></div>
          <div className="jv-organizer-stats compact-stats">
            <div><b>{openTasks.length}</b><span>offen</span></div>
            <div><b>{waitingAudit.length}</b><span>warten</span></div>
            <div><b>{highRiskAudit.length}</b><span>high risk</span></div>
            <div><b>{auditEntries.length}</b><span>audit</span></div>
          </div>
          <div className="jv-audit-list">
            {auditEntries.length === 0 && <div className="jv-empty">Noch keine Audit Einträge.</div>}
            {auditEntries.map((entry, index) => (
              <article className={`jv-audit-entry risk-${entry.risk || "low"}`} key={entry.id || index}>
                <div className="jv-audit-entry-head">
                  <b>{entry.task || "Automation"}</b>
                  <span>{entry.status || "unknown"}</span>
                </div>
                <p>{entry.result || "Kein Ergebnis hinterlegt."}</p>
                <small>{entry.source || "manual"} · {entry.target || "kein Ziel"} · {formatDate(entry.created_at)}</small>
              </article>
            ))}
          </div>
          <button className="jv-wide-btn" onClick={() => onSend("Fasse die letzten Automation Audit Log Einträge zusammen")}>AUDIT ZUSAMMENFASSEN</button>
        </section>
      </div>
    </section>
  );
}
