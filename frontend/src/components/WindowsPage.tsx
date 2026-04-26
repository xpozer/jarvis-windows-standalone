import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

interface FileHit { name: string; path: string; size_kb?: number; modified?: string; }

export function WindowsPage() {
  const [apps, setApps] = useState<string[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [status, setStatus] = useState("Bereit");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<FileHit[]>([]);

  async function load() {
    try {
      const res = await fetch(`${API}/windows/apps`);
      const data = await res.json();
      setApps(Array.isArray(data.apps) ? data.apps : []);
      setFolders(Array.isArray(data.folders) ? data.folders : []);
    } catch (e) {
      setStatus(`Fehler: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function openApp(name: string) {
    setStatus(`Starte ${name}...`);
    const res = await fetch(`${API}/windows/open-app`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const data = await res.json();
    setStatus(data.ok ? `Gestartet: ${name}` : `Fehler: ${data.error}`);
  }

  async function openFolder(name: string) {
    setStatus(`Öffne ${name}...`);
    const res = await fetch(`${API}/windows/open-folder`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    const data = await res.json();
    setStatus(data.ok ? `Geöffnet: ${data.path}` : `Fehler: ${data.error}`);
  }

  async function search() {
    if (!query.trim()) return;
    setStatus("Suche Dateien...");
    const res = await fetch(`${API}/windows/search-files?q=${encodeURIComponent(query.trim())}&limit=30`);
    const data = await res.json();
    setHits(Array.isArray(data.results) ? data.results : []);
    setStatus(`Dateisuche fertig: ${(data.results || []).length} Treffer`);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="aufg-root">
      <div className="calc-title">WINDOWS TOOLS</div>
      <div className="set-hint" style={{ marginTop: -8 }}>
        Sichere Windows Funktionen. Es werden nur freigegebene Apps und Ordner geöffnet.
      </div>
      <div className="set-hint">Status: {status}</div>

      <div className="aufg-section">
        <div className="sap-label">PROGRAMME STARTEN</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {apps.map((a) => <button key={a} className="termin-parse-btn" onClick={() => openApp(a)}>{a}</button>)}
        </div>
      </div>

      <div className="aufg-section">
        <div className="sap-label">ORDNER ÖFFNEN</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {folders.map((f) => <button key={f} className="termin-parse-btn" onClick={() => openFolder(f)}>{f}</button>)}
        </div>
      </div>

      <div className="aufg-section">
        <div className="sap-label">DATEIEN SUCHEN</div>
        <div className="aufg-input-row">
          <input className="sap-input aufg-input" value={query} onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()} placeholder="Dateiname oder Teil davon..." />
          <button className="termin-parse-btn" onClick={search}>SUCHEN</button>
        </div>
        {hits.map((h, i) => (
          <div key={`${h.path}-${i}`} className="aufg-item">
            <span className="mem-badge auto">F</span>
            <span className="aufg-text">{h.name}<br/><small>{h.path}</small></span>
          </div>
        ))}
      </div>
    </div>
  );
}
