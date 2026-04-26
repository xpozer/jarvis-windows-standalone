import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

export function SystemPage() {
  const [status, setStatus] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [message, setMessage] = useState("Lade...");

  async function load() {
    try {
      const [sRes, lRes] = await Promise.all([
        fetch(`${API}/system/status`),
        fetch(`${API}/debug/logs?lines=80`),
      ]);
      setStatus(await sRes.json());
      const l = await lRes.json();
      setLogs(Array.isArray(l.lines) ? l.lines : []);
      setMessage("Aktuell");
    } catch (e) {
      setMessage(`Fehler: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="aufg-root">
      <div className="calc-title">SYSTEMSTATUS</div>
      <div className="set-hint" style={{ marginTop: -8 }}>Backend Diagnose, Speicher und lokale Daten.</div>
      <button className="termin-parse-btn" onClick={load}>AKTUALISIEREN</button>
      <div className="set-hint">Status: {message}</div>

      {status && (
        <div className="aufg-section">
          <div className="sap-label">BACKEND</div>
          <div className="aufg-item"><span className="aufg-text">Status: {status.status}</span></div>
          <div className="aufg-item"><span className="aufg-text">Ollama: {status.ollama ? "online" : "offline"}</span></div>
          <div className="aufg-item"><span className="aufg-text">Modell: {status.model_default}</span></div>
          <div className="aufg-item"><span className="aufg-text">Python: {status.python}</span></div>
          <div className="aufg-item"><span className="aufg-text">Datenträger frei: {status.disk?.free_gb} GB</span></div>
          <div className="aufg-item"><span className="aufg-text">Daten: {status.data?.notes} Notizen, {status.data?.tasks} Aufgaben</span></div>
        </div>
      )}

      <div className="aufg-section">
        <div className="sap-label">LETZTE BACKEND LOGS</div>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 11, opacity: .85, maxHeight: 320, overflow: "auto" }}>
          {logs.join("\n")}
        </pre>
      </div>
    </div>
  );
}
