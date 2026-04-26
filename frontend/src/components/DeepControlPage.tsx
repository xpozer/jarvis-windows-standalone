import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

export function DeepControlPage() {
  const [status, setStatus] = useState("Bereit");
  const [report, setReport] = useState<any>(null);
  const [matrix, setMatrix] = useState<any>(null);
  const [repair, setRepair] = useState<any>(null);
  const [contextPack, setContextPack] = useState<any>(null);
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState<any>(null);

  async function runDeepCheck() {
    setStatus("Deep Check läuft...");
    const res = await fetch(`${API}/deep/status`);
    const data = await res.json();
    setReport(data);
    setStatus(`Deep Check fertig: ${data.summary?.failed ?? 0} Befunde`);
  }

  async function loadMatrix() {
    setStatus("Lade Agent Tool Matrix...");
    const res = await fetch(`${API}/agents/matrix`);
    const data = await res.json();
    setMatrix(data);
    setStatus(`Matrix geladen: ${data.summary?.agents ?? 0} Agenten, ${data.summary?.tools ?? 0} Tools`);
  }

  async function createRepairPlan() {
    setStatus("Erstelle Repair Plan...");
    const res = await fetch(`${API}/deep/repair-plan`, { method: "POST" });
    const data = await res.json();
    setRepair(data);
    setStatus(`Repair Plan: ${data.summary?.steps ?? 0} Schritte`);
  }

  async function createContextPack() {
    setStatus("Erstelle Context Pack...");
    const res = await fetch(`${API}/deep/context-pack`);
    const data = await res.json();
    setContextPack(data);
    setStatus(`Context Pack erstellt: ${data.path}`);
  }

  async function askKnowledge() {
    if (!query.trim()) return;
    setStatus("Suche lokale Antwortbasis...");
    const res = await fetch(`${API}/knowledge/answer?q=${encodeURIComponent(query)}&limit=6`);
    const data = await res.json();
    setAnswer(data);
    setStatus(`Lokale Quellen: ${data.total ?? 0}`);
  }

  function copy(data: any) {
    navigator.clipboard?.writeText(typeof data === "string" ? data : JSON.stringify(data, null, 2));
    setStatus("Kopiert");
  }

  useEffect(() => {
    runDeepCheck();
    loadMatrix();
  }, []);

  const failedChecks = report?.checks?.filter((c: any) => !c.ok) || [];

  return (
    <div className="aufg-root">
      <div className="calc-title">DEEP CONTROL</div>
      <div className="set-hint" style={{ marginTop: -8 }}>
        Echte Systemtiefe: Deep Check, Agent Tool Matrix, Repair Plan, Context Pack und lokale Antwortbasis.
      </div>
      <div className="set-hint">Status: {status}</div>

      <div className="aufg-section">
        <div className="sap-label">HAUPTAKTIONEN</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button className="termin-parse-btn" onClick={runDeepCheck}>DEEP CHECK</button>
          <button className="termin-parse-btn" onClick={loadMatrix}>AGENT MATRIX</button>
          <button className="termin-parse-btn" onClick={createRepairPlan}>REPAIR PLAN</button>
          <button className="termin-parse-btn" onClick={createContextPack}>CONTEXT PACK</button>
        </div>
      </div>

      {report && (
        <div className="aufg-section">
          <div className="sap-label">DEEP CHECK BEFUNDE</div>
          <div className="aufg-item">
            <span className={`mem-badge ${report.ok ? "manual" : "auto"}`}>{report.ok ? "OK" : "!"}</span>
            <span className="aufg-text">
              <b>{report.version}</b><br />
              <small>{report.summary?.failed ?? 0} fehlgeschlagen · critical {report.summary?.critical ?? 0} · high {report.summary?.high ?? 0}</small>
            </span>
            <button className="termin-parse-btn" onClick={() => copy(report)}>KOPIEREN</button>
          </div>

          {failedChecks.length === 0 && <div className="set-hint">Keine relevanten Befunde.</div>}
          {failedChecks.map((c: any, idx: number) => (
            <div className="aufg-item" key={`${c.name}-${idx}`}>
              <span className="mem-badge auto">{c.severity}</span>
              <span className="aufg-text">
                <b>{c.name}</b><br />
                <small>{c.detail}</small><br />
                <small>Fix: {c.fix || "kein Fix hinterlegt"}</small>
              </span>
            </div>
          ))}
        </div>
      )}

      {matrix && (
        <div className="aufg-section">
          <div className="sap-label">AGENT TOOL MATRIX</div>
          <div className="aufg-item">
            <span className="mem-badge manual">M</span>
            <span className="aufg-text">
              <b>{matrix.summary?.agents} Agenten · {matrix.summary?.tools} Tools</b><br />
              <small>Nicht registrierte Tool Referenzen: {matrix.summary?.unregistered_tool_refs}</small>
            </span>
            <button className="termin-parse-btn" onClick={() => copy(matrix)}>KOPIEREN</button>
          </div>
          {(matrix.matrix || []).map((row: any) => (
            <div className="aufg-item" key={row.agent_id}>
              <span className="mem-badge manual">{row.risk_level}</span>
              <span className="aufg-text">
                <b>{row.agent}</b><br />
                <small>{row.tools_registered}/{row.tools_total} Tools registriert · Status {row.status}</small>
              </span>
            </div>
          ))}
        </div>
      )}

      {repair && (
        <div className="sap-preview">
          <div className="sap-preview-header">
            <span className="sap-preview-label">REPAIR PLAN</span>
            <button className="sap-copy-btn" onClick={() => copy(repair)}>KOPIEREN</button>
          </div>
          <pre className="sap-preview-text">{JSON.stringify(repair, null, 2)}</pre>
        </div>
      )}

      {contextPack && (
        <div className="aufg-section">
          <div className="sap-label">CONTEXT PACK</div>
          <div className="aufg-item">
            <span className="mem-badge manual">ZIP</span>
            <span className="aufg-text"><b>{contextPack.path}</b><br /><small>{contextPack.size_kb} KB</small></span>
            <button className="termin-parse-btn" onClick={() => copy(contextPack)}>KOPIEREN</button>
          </div>
        </div>
      )}

      <div className="aufg-section">
        <div className="sap-label">LOKALE ANTWORTBASIS</div>
        <div className="aufg-input-row">
          <input
            className="sap-input aufg-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && askKnowledge()}
            placeholder="Frage an lokalen Wissensindex..."
          />
          <button className="termin-parse-btn" onClick={askKnowledge}>SUCHEN</button>
        </div>
      </div>

      {answer && (
        <div className="sap-preview">
          <div className="sap-preview-header">
            <span className="sap-preview-label">LOKALE ANTWORT</span>
            <button className="sap-copy-btn" onClick={() => copy(answer.answer)}>KOPIEREN</button>
          </div>
          <pre className="sap-preview-text">{answer.answer}</pre>
        </div>
      )}
    </div>
  );
}
