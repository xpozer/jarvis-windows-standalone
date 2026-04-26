import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

export function SystemCenterPage() {
  const [status, setStatus] = useState("Bereit");
  const [version, setVersion] = useState<any>(null);
  const [backups, setBackups] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any>(null);
  const [update, setUpdate] = useState<any>(null);
  const [diag, setDiag] = useState<any>(null);

  async function load() {
    try {
      const [v, b, p, u] = await Promise.all([
        fetch(`${API}/app/version`),
        fetch(`${API}/backup/list`),
        fetch(`${API}/security/permissions`),
        fetch(`${API}/update/status`),
      ]);
      setVersion(await v.json());
      const bd = await b.json();
      setBackups(Array.isArray(bd.backups) ? bd.backups : []);
      setPermissions(await p.json());
      setUpdate(await u.json());
      setStatus("Aktuell");
    } catch (e) {
      setStatus(`Fehler: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function createBackup() {
    setStatus("Erstelle Backup...");
    const res = await fetch(`${API}/backup/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: "ui" }),
    });
    const data = await res.json();
    setStatus(`Backup erstellt: ${data.path}`);
    await load();
  }

  async function createDiag() {
    setStatus("Erstelle Diagnose ZIP...");
    const res = await fetch(`${API}/diagnostics/package`);
    const data = await res.json();
    setDiag(data);
    setStatus(`Diagnose erstellt: ${data.path}`);
  }

  async function prepareUpdate() {
    setStatus("Bereite Update vor...");
    const res = await fetch(`${API}/update/prepare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ version: "manual", source: "ui" }),
    });
    const data = await res.json();
    setUpdate(data);
    setStatus("Update vorbereitet");
    await load();
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="aufg-root">
      <div className="calc-title">SYSTEM CENTER</div>
      <div className="set-hint" style={{ marginTop: -8 }}>
        Backup, Restore Vorbereitung, Update Vorbereitung, Rechtezentrum und Diagnose Paket.
      </div>
      <div className="set-hint">Status: {status}</div>

      <div className="aufg-section">
        <div className="sap-label">AKTIONEN</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button className="termin-parse-btn" onClick={createBackup}>BACKUP ERSTELLEN</button>
          <button className="termin-parse-btn" onClick={createDiag}>DIAGNOSE ZIP</button>
          <button className="termin-parse-btn" onClick={prepareUpdate}>UPDATE VORBEREITEN</button>
          <button className="termin-parse-btn" onClick={load}>AKTUALISIEREN</button>
        </div>
      </div>

      <div className="aufg-section">
        <div className="sap-label">VERSION</div>
        <div className="aufg-item">
          <span className="mem-badge manual">V</span>
          <span className="aufg-text">{version?.version || "unbekannt"}<br/><small>{version?.base_dir}</small></span>
        </div>
      </div>

      <div className="aufg-section">
        <div className="sap-label">BACKUPS</div>
        {backups.length === 0 && <div className="set-hint">Noch keine Backups vorhanden.</div>}
        {backups.map((b) => (
          <div className="aufg-item" key={b.name}>
            <span className="mem-badge manual">B</span>
            <span className="aufg-text"><b>{b.name}</b><br/><small>{b.size_kb} KB | {b.modified}</small></span>
          </div>
        ))}
      </div>

      <div className="aufg-section">
        <div className="sap-label">RECHTEZENTRALE</div>
        <div className="aufg-item">
          <span className="mem-badge manual">A</span>
          <span className="aufg-text"><b>Apps</b><br/><small>{(permissions?.allowed_apps || []).join(", ")}</small></span>
        </div>
        <div className="aufg-item">
          <span className="mem-badge manual">O</span>
          <span className="aufg-text"><b>Ordner</b><br/><small>{(permissions?.allowed_folders || []).join(", ")}</small></span>
        </div>
        <div className="aufg-item">
          <span className="mem-badge auto">!</span>
          <span className="aufg-text"><b>Bestätigung erforderlich</b><br/><small>{(permissions?.confirm_required || []).join(", ")}</small></span>
        </div>
      </div>

      {(diag || update) && (
        <div className="sap-preview">
          <div className="sap-preview-header">
            <span className="sap-preview-label">AUSGABE</span>
            <button className="sap-copy-btn" onClick={() => navigator.clipboard?.writeText(JSON.stringify(diag || update, null, 2))}>KOPIEREN</button>
          </div>
          <pre className="sap-preview-text">{JSON.stringify(diag || update, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
