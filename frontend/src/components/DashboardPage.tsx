import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

export function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [status, setStatus] = useState("Lade...");

  async function load() {
    try {
      const res = await fetch(`${API}/dashboard`);
      setData(await res.json());
      setStatus("Aktuell");
    } catch (e) {
      setStatus(`Fehler: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="aufg-root">
      <div className="calc-title">DASHBOARD</div>
      <div className="set-hint" style={{ marginTop: -8 }}>Arbeitsübersicht, fällige Punkte und Systemzustand.</div>
      <button className="termin-parse-btn" onClick={load}>AKTUALISIEREN</button>
      <div className="set-hint">Status: {status} | Version: {data?.version || "unbekannt"}</div>

      {data && (
        <>
          <div className="aufg-section">
            <div className="sap-label">SYSTEM</div>
            <div className="aufg-item"><span className="mem-badge manual">S</span><span className="aufg-text">Ollama: {data.status?.ollama ? "online" : "offline"} | Modell: {data.status?.model_default}</span></div>
          </div>

          <div className="aufg-section">
            <div className="sap-label">FÄLLIG</div>
            {(data.due || []).length === 0 && <div className="set-hint">Keine fälligen Wiedervorlagen.</div>}
            {(data.due || []).map((d: any) => (
              <div className="aufg-item" key={d.id}><span className="mem-badge auto">!</span><span className="aufg-text">{d.text}<br/><small>{d.when}</small></span></div>
            ))}
          </div>

          <div className="aufg-section">
            <div className="sap-label">AUFGABEN</div>
            {(data.tasks || []).map((t: any) => (
              <div className="aufg-item" key={t.id}><span className="mem-badge manual">T</span><span className="aufg-text">{t.text}</span></div>
            ))}
          </div>

          <div className="aufg-section">
            <div className="sap-label">LETZTE DATEIEN</div>
            {(data.files || []).map((f: any) => (
              <div className="aufg-item" key={f.id}><span className="mem-badge manual">F</span><span className="aufg-text">{f.name}<br/><small>{f.imported_at}</small></span></div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
