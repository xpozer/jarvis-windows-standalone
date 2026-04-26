import { useEffect, useState } from "react";

interface NoteItem {
  id: string;
  text: string;
  created_at?: string;
  updated_at?: string;
  tags?: string[];
}

const API = "http://127.0.0.1:8000";

export function NotizenPage() {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Bereit");

  async function load(q = query) {
    try {
      const url = `${API}/notes${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      setNotes(Array.isArray(data.notes) ? data.notes : []);
      setStatus("Geladen");
    } catch (e) {
      setStatus(`Fehler beim Laden: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function add() {
    const text = input.trim();
    if (!text) return;
    try {
      const res = await fetch(`${API}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setInput("");
      setStatus("Notiz gespeichert");
      await load("");
    } catch (e) {
      setStatus(`Fehler beim Speichern: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function remove(id: string) {
    try {
      await fetch(`${API}/notes/${encodeURIComponent(id)}`, { method: "DELETE" });
      setStatus("Notiz gelöscht");
      await load();
    } catch (e) {
      setStatus(`Fehler beim Löschen: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  useEffect(() => { load(""); }, []);

  return (
    <div className="aufg-root">
      <div className="calc-title">NOTIZEN</div>
      <div className="set-hint" style={{ marginTop: -8 }}>
        Lokale Notizen aus dem Standalone Backend. Per Chat geht auch: <b>Notiz: ...</b>
      </div>

      <div className="aufg-input-row">
        <input className="sap-input aufg-input" value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Neue Notiz eingeben..." />
        <button className="termin-parse-btn" onClick={add}>SPEICHERN</button>
      </div>

      <div className="aufg-input-row">
        <input className="sap-input aufg-input" value={query} onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()} placeholder="Notizen durchsuchen..." />
        <button className="termin-parse-btn" onClick={() => load()}>SUCHEN</button>
      </div>

      <div className="set-hint">Status: {status} | Treffer: {notes.length}</div>

      {notes.length > 0 ? (
        <div className="aufg-section">
          <div className="sap-label">LOKALE NOTIZEN</div>
          {notes.map((n) => (
            <div key={n.id} className="aufg-item">
              <span className="mem-badge manual">N</span>
              <span className="aufg-text">{n.text}<br/><small>{n.created_at}</small></span>
              <button className="sap-remove-btn" onClick={() => remove(n.id)}>✕</button>
            </div>
          ))}
        </div>
      ) : (
        <div className="jv-content-placeholder" style={{ flex: 1 }}>
          <div className="jv-placeholder-hint">Keine Notizen gefunden.</div>
        </div>
      )}
    </div>
  );
}
