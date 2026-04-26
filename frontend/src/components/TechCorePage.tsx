import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

interface ToolInfo {
  name: string;
  category: string;
  risk: string;
  description: string;
}

interface PendingAction {
  id: string;
  type: string;
  risk: string;
  status: string;
  message?: string;
  payload?: Record<string, unknown>;
  created_at?: string;
}

export function TechCorePage() {
  const [tools, setTools] = useState<ToolInfo[]>([]);
  const [actions, setActions] = useState<PendingAction[]>([]);
  const [status, setStatus] = useState("Bereit");
  const [search, setSearch] = useState("");
  const [docText, setDocText] = useState("");
  const [analysis, setAnalysis] = useState("");

  async function load() {
    try {
      const [tRes, aRes] = await Promise.all([
        fetch(`${API}/tools/registry`),
        fetch(`${API}/actions/pending`),
      ]);
      const t = await tRes.json();
      const a = await aRes.json();
      setTools(Array.isArray(t.tools) ? t.tools : []);
      setActions(Array.isArray(a.actions) ? a.actions : []);
      setStatus("Aktuell");
    } catch (e) {
      setStatus(`Fehler: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function openSearch() {
    if (!search.trim()) return;
    const res = await fetch(`${API}/web/search/open?q=${encodeURIComponent(search.trim())}`);
    const data = await res.json();
    setStatus(data.ok ? `Websuche geöffnet: ${search}` : `Fehler: ${data.error}`);
  }

  async function analyzeText() {
    if (!docText.trim()) return;
    setStatus("Analysiere Text...");
    const res = await fetch(`${API}/documents/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: docText }),
    });
    const data = await res.json();
    setAnalysis(data.analysis?.summary || JSON.stringify(data, null, 2));
    setStatus("Analyse fertig");
  }

  async function prepareFile() {
    const res = await fetch(`${API}/actions/prepare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "write_text_file",
        payload: {
          path: "downloads/jarvis_test.txt",
          content: "JARVIS Testdatei aus Tech Core"
        }
      }),
    });
    const data = await res.json();
    setStatus(`Aktion vorbereitet: ${data.id}`);
    await load();
  }

  async function confirm(id: string) {
    const res = await fetch(`${API}/actions/confirm/${encodeURIComponent(id)}`, { method: "POST" });
    const data = await res.json();
    setStatus(data.ok ? data.message : `Fehler: ${data.error}`);
    await load();
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="aufg-root">
      <div className="calc-title">TECH CORE</div>
      <div className="set-hint" style={{ marginTop: -8 }}>
        Sichere Computer Control, Tool Registry und Dokumenten Analyse. Inspiriert von Computer Agents, aber mit Allowlist und Bestätigung.
      </div>
      <div className="set-hint">Status: {status}</div>

      <div className="aufg-section">
        <div className="sap-label">TOOL REGISTRY</div>
        {tools.map((t) => (
          <div className="aufg-item" key={t.name}>
            <span className="mem-badge manual">{t.risk}</span>
            <span className="aufg-text"><b>{t.name}</b><br/><small>{t.category} | {t.description}</small></span>
          </div>
        ))}
      </div>

      <div className="aufg-section">
        <div className="sap-label">WEB SUCHE ÖFFNEN</div>
        <div className="aufg-input-row">
          <input className="sap-input aufg-input" value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === "Enter" && openSearch()} placeholder="Suchbegriff..." />
          <button className="termin-parse-btn" onClick={openSearch}>ÖFFNEN</button>
        </div>
      </div>

      <div className="aufg-section">
        <div className="sap-label">TEXT / LOG ANALYSIEREN</div>
        <textarea className="sap-textarea" value={docText} onChange={(e) => setDocText(e.target.value)} placeholder="Log, Text oder Fehlermeldung hier einfügen..." />
        <button className="termin-parse-btn" onClick={analyzeText}>ANALYSIEREN</button>
      </div>

      {analysis && (
        <div className="sap-preview">
          <div className="sap-preview-header">
            <span className="sap-preview-label">ANALYSE</span>
            <button className="sap-copy-btn" onClick={() => navigator.clipboard?.writeText(analysis)}>KOPIEREN</button>
          </div>
          <pre className="sap-preview-text">{analysis}</pre>
        </div>
      )}

      <div className="aufg-section">
        <div className="sap-label">SICHERE AKTIONEN</div>
        <button className="termin-parse-btn" onClick={prepareFile}>TESTDATEI VORBEREITEN</button>
        {actions.length === 0 && <div className="set-hint">Keine offenen Aktionen.</div>}
        {actions.map((a) => (
          <div className="aufg-item" key={a.id}>
            <span className="mem-badge auto">!</span>
            <span className="aufg-text"><b>{a.type}</b><br/><small>{a.id} | {a.status}</small></span>
            <button className="termin-parse-btn" onClick={() => confirm(a.id)}>BESTÄTIGEN</button>
          </div>
        ))}
      </div>
    </div>
  );
}
