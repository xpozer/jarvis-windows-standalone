import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

interface CheckItem {
  name: string;
  ok: boolean;
  detail?: string;
}

export function SelfCheckPage() {
  const [data, setData] = useState<{ ok?: boolean; version?: string; checks?: CheckItem[] } | null>(null);
  const [status, setStatus] = useState("Lade...");

  async function load() {
    try {
      const res = await fetch(`${API}/self-check`);
      setData(await res.json());
      setStatus("Aktuell");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="aufg-root">
      <div className="calc-title">SELF CHECK</div>
      <div className="set-hint" style={{ marginTop: -8 }}>Schneller Systemtest direkt aus dem Backend.</div>
      <button className="termin-parse-btn" onClick={load}>AKTUALISIEREN</button>
      <div className="set-hint">Status: {status} | Version: {data?.version ?? "unbekannt"}</div>

      {data && (
        <div className="aufg-section">
          <div className="sap-label">PRÜFPUNKTE</div>
          {(data.checks ?? []).map((c) => (
            <div key={c.name} className="aufg-item">
              <span className={`mem-badge ${c.ok ? "manual" : "auto"}`}>{c.ok ? "OK" : "!"}</span>
              <span className="aufg-text"><b>{c.name}</b><br/><small>{c.detail}</small></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
