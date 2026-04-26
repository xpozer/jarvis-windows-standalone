import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

export function VoicePage() {
  const [settings, setSettings] = useState<any>(null);
  const [status, setStatus] = useState("Lade...");

  async function load() {
    const res = await fetch(`${API}/voice/settings`);
    setSettings(await res.json());
    setStatus("Aktuell");
  }

  async function save(next: any) {
    const res = await fetch(`${API}/voice/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setSettings(await res.json());
    setStatus("Gespeichert");
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="aufg-root">
      <div className="calc-title">VOICE LAB</div>
      <div className="set-hint" style={{ marginTop: -8 }}>
        Sprachmodus vorbereitet. Standardmäßig deaktiviert, damit nichts ungefragt zuhört.
      </div>
      <div className="set-hint">Status: {status}</div>

      {settings && (
        <div className="aufg-section">
          <div className="sap-label">EINSTELLUNGEN</div>
          <div className="aufg-item">
            <span className="mem-badge manual">V</span>
            <span className="aufg-text">Aktiv: {settings.enabled ? "ja" : "nein"}<br/><small>Wake Word: {settings.wake_word}</small></span>
          </div>
          <input className="sap-input" value={settings.wake_word || ""} onChange={(e) => setSettings({ ...settings, wake_word: e.target.value })} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="termin-parse-btn" onClick={() => save({ ...settings, enabled: false })}>DEAKTIVIEREN</button>
            <button className="termin-parse-btn" onClick={() => save(settings)}>SPEICHERN</button>
          </div>
          <div className="set-hint">
            Aktivieren des echten Mikrofons kommt erst später gezielt dazu. Hier ist nur die sichere Vorbereitung drin.
          </div>
        </div>
      )}
    </div>
  );
}
