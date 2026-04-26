import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

interface AutomationItem {
  id: string;
  kind: string;
  text: string;
  when?: string;
  recurrence?: string;
  status: string;
  created_at?: string;
}

interface WatchItem {
  id: string;
  name: string;
  folder_key: string;
  path: string;
  pattern?: string;
  enabled?: boolean;
}

export function AutomationPage() {
  const [items, setItems] = useState<AutomationItem[]>([]);
  const [due, setDue] = useState<AutomationItem[]>([]);
  const [watchers, setWatchers] = useState<WatchItem[]>([]);
  const [text, setText] = useState("");
  const [when, setWhen] = useState("");
  const [briefing, setBriefing] = useState("");
  const [status, setStatus] = useState("Bereit");
  const [watchName, setWatchName] = useState("Downloads");
  const [folderKey, setFolderKey] = useState("downloads");
  const [pattern, setPattern] = useState("");

  async function load() {
    try {
      const [aRes, dRes, wRes] = await Promise.all([
        fetch(`${API}/automation/list?status=open`),
        fetch(`${API}/automation/due`),
        fetch(`${API}/folder-watch/list`),
      ]);
      const a = await aRes.json();
      const d = await dRes.json();
      const w = await wRes.json();
      setItems(Array.isArray(a.automations) ? a.automations : []);
      setDue(Array.isArray(d.due) ? d.due : []);
      setWatchers(Array.isArray(w.watchers) ? w.watchers : []);
      setStatus("Aktuell");
    } catch (e) {
      setStatus(`Fehler: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function addAutomation() {
    if (!text.trim()) return;
    const res = await fetch(`${API}/automation/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, when, kind: "reminder" }),
    });
    const data = await res.json();
    setStatus(`Gespeichert: ${data.id}`);
    setText("");
    setWhen("");
    await load();
  }

  async function complete(id: string) {
    await fetch(`${API}/automation/complete/${encodeURIComponent(id)}`, { method: "POST" });
    await load();
  }

  async function getBriefing(kind: "tagesstart" | "feierabend") {
    const res = await fetch(`${API}/briefing/${kind}`);
    const data = await res.json();
    setBriefing(data.text || JSON.stringify(data, null, 2));
    setStatus(`${kind} erstellt`);
  }

  async function addWatch() {
    const res = await fetch(`${API}/folder-watch/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: watchName, folder_key: folderKey, pattern }),
    });
    const data = await res.json();
    setStatus(`Überwachung gespeichert: ${data.name}`);
    await load();
  }

  async function scanWatch() {
    setStatus("Scanne Ordner...");
    const res = await fetch(`${API}/folder-watch/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    setBriefing(JSON.stringify(data, null, 2));
    setStatus("Ordner Scan fertig");
    await load();
  }

  function copyBriefing() {
    navigator.clipboard?.writeText(briefing);
    setStatus("Kopiert");
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="aufg-root">
      <div className="calc-title">AUTOMATIONEN</div>
      <div className="set-hint" style={{ marginTop: -8 }}>
        Lokale Wiedervorlagen, Tagesstart, Feierabendbericht und Ordnerüberwachung.
      </div>
      <div className="set-hint">Status: {status}</div>

      <div className="aufg-section">
        <div className="sap-label">TAGESROUTINEN</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button className="termin-parse-btn" onClick={() => getBriefing("tagesstart")}>TAGESSTART</button>
          <button className="termin-parse-btn" onClick={() => getBriefing("feierabend")}>FEIERABEND</button>
          <button className="termin-parse-btn" onClick={load}>AKTUALISIEREN</button>
        </div>
      </div>

      <div className="aufg-section">
        <div className="sap-label">WIEDERVORLAGE ANLEGEN</div>
        <textarea className="sap-textarea" value={text} onChange={(e) => setText(e.target.value)} placeholder="Woran soll JARVIS dich erinnern?" rows={3} />
        <input className="sap-input" value={when} onChange={(e) => setWhen(e.target.value)} placeholder="Wann? z. B. 2026-04-26T09:00 oder Freitext" />
        <button className="termin-parse-btn" onClick={addAutomation}>SPEICHERN</button>
      </div>

      <div className="aufg-section">
        <div className="sap-label">FÄLLIGE WIEDERVORLAGEN</div>
        {due.length === 0 && <div className="set-hint">Aktuell nichts fällig.</div>}
        {due.map((a) => (
          <div className="aufg-item" key={a.id}>
            <span className="mem-badge auto">!</span>
            <span className="aufg-text"><b>{a.text}</b><br/><small>{a.when}</small></span>
            <button className="termin-parse-btn" onClick={() => complete(a.id)}>ERLEDIGT</button>
          </div>
        ))}
      </div>

      <div className="aufg-section">
        <div className="sap-label">OFFENE WIEDERVORLAGEN</div>
        {items.map((a) => (
          <div className="aufg-item" key={a.id}>
            <span className="mem-badge manual">{a.kind}</span>
            <span className="aufg-text"><b>{a.text}</b><br/><small>{a.when || "ohne festen Termin"} | {a.id}</small></span>
            <button className="termin-parse-btn" onClick={() => complete(a.id)}>ERLEDIGT</button>
          </div>
        ))}
      </div>

      <div className="aufg-section">
        <div className="sap-label">ORDNERÜBERWACHUNG</div>
        <input className="sap-input" value={watchName} onChange={(e) => setWatchName(e.target.value)} placeholder="Name" />
        <input className="sap-input" value={folderKey} onChange={(e) => setFolderKey(e.target.value)} placeholder="Freigegebener Ordner, z. B. downloads, desktop, documents, jarvis" />
        <input className="sap-input" value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="Filter optional, z. B. .log" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button className="termin-parse-btn" onClick={addWatch}>ÜBERWACHEN</button>
          <button className="termin-parse-btn" onClick={scanWatch}>SCAN STARTEN</button>
        </div>
        {watchers.map((w) => (
          <div className="aufg-item" key={w.id}>
            <span className="mem-badge manual">W</span>
            <span className="aufg-text"><b>{w.name}</b><br/><small>{w.path} | Filter: {w.pattern || "kein Filter"}</small></span>
          </div>
        ))}
      </div>

      {briefing && (
        <div className="sap-preview">
          <div className="sap-preview-header">
            <span className="sap-preview-label">AUSGABE</span>
            <button className="sap-copy-btn" onClick={copyBriefing}>KOPIEREN</button>
          </div>
          <pre className="sap-preview-text">{briefing}</pre>
        </div>
      )}
    </div>
  );
}
