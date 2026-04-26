import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

export function UIOptionsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [status, setStatus] = useState("Lade...");

  async function load() {
    const res = await fetch(`${API}/ui/settings`);
    setSettings(await res.json());
    setStatus("Aktuell");
  }

  async function save(next = settings) {
    const res = await fetch(`${API}/ui/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setSettings(await res.json());
    setStatus("Gespeichert");
  }

  useEffect(() => { load(); }, []);

  function set(key: string, value: any) {
    setSettings({ ...settings, [key]: value });
  }

  return (
    <div className="aufg-root">
      <div className="calc-title">UI OPTIONEN</div>
      <div className="set-hint" style={{ marginTop: -8 }}>Design Presets, Orb Qualität und Animationen vorbereiten.</div>
      <div className="set-hint">Status: {status}</div>

      {settings && (
        <div className="aufg-section">
          <div className="sap-label">DARSTELLUNG</div>
          <input className="sap-input" value={settings.theme || ""} onChange={(e) => set("theme", e.target.value)} placeholder="theme" />
          <input className="sap-input" value={settings.orb_quality || ""} onChange={(e) => set("orb_quality", e.target.value)} placeholder="orb_quality: low, medium, high" />
          <input className="sap-input" value={settings.animation_level || ""} onChange={(e) => set("animation_level", e.target.value)} placeholder="animation_level" />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <button className="termin-parse-btn" onClick={() => set("compact_mode", !settings.compact_mode)}>COMPACT: {settings.compact_mode ? "AN" : "AUS"}</button>
            <button className="termin-parse-btn" onClick={() => set("show_red_thought_impulses", !settings.show_red_thought_impulses)}>ROTE IMPULSE: {settings.show_red_thought_impulses ? "AN" : "AUS"}</button>
            <button className="termin-parse-btn" onClick={() => set("show_hover_growth", !settings.show_hover_growth)}>HOVER: {settings.show_hover_growth ? "AN" : "AUS"}</button>
            <button className="termin-parse-btn" onClick={() => save()}>SPEICHERN</button>
          </div>
        </div>
      )}
    </div>
  );
}
