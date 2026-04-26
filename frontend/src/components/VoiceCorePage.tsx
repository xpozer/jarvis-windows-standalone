import { useEffect, useMemo, useState } from "react";

const API = "http://127.0.0.1:8000";

interface VoicePreset {
  id: string;
  name: string;
  rate: number;
  pitch: number;
  volume: number;
  description: string;
}

export function VoiceCorePage() {
  const [settings, setSettings] = useState<any>(null);
  const [presets, setPresets] = useState<VoicePreset[]>([]);
  const [piper, setPiper] = useState<any>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [status, setStatus] = useState("Lade Voice Core...");
  const [testText, setTestText] = useState("Guten Abend Julien. JARVIS Voice Core ist online.");
  const [speaking, setSpeaking] = useState(false);

  const selectedVoice = useMemo(() => {
    if (!settings?.selected_voice) return null;
    return voices.find((v) => v.name === settings.selected_voice) || null;
  }, [voices, settings]);

  function loadBrowserVoices() {
    if (!("speechSynthesis" in window)) {
      setStatus("Browser SpeechSynthesis ist nicht verfügbar.");
      return;
    }
    const list = window.speechSynthesis.getVoices();
    setVoices(list);
  }

  async function load() {
    try {
      const res = await fetch(`${API}/voice/core`);
      const data = await res.json();
      setSettings(data.settings || {});
      setPresets(Array.isArray(data.presets) ? data.presets : []);
      setPiper(data.piper || {});
      setTestText(data.settings?.test_text || testText);
      setStatus("Aktuell");
      loadBrowserVoices();
    } catch (e) {
      setStatus(`Fehler: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function save(next = settings) {
    const body = { ...next, test_text: testText };
    const res = await fetch(`${API}/voice/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSettings(await res.json());
    setStatus("Voice Einstellungen gespeichert");
  }

  async function applyPreset(id: string) {
    const res = await fetch(`${API}/voice/preset/${encodeURIComponent(id)}`, { method: "POST" });
    const data = await res.json();
    setSettings(data);
    setStatus(`Preset gesetzt: ${id}`);
  }

  async function preparePiper() {
    const res = await fetch(`${API}/voice/piper/prepare`, { method: "POST" });
    const data = await res.json();
    setPiper(data);
    setStatus("Piper Ordner vorbereitet");
  }

  function speak(text = testText) {
    if (!("speechSynthesis" in window)) {
      setStatus("Dieser Browser unterstützt SpeechSynthesis nicht.");
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text || "JARVIS Voice Test.");
    if (selectedVoice) utter.voice = selectedVoice;
    utter.rate = Number(settings?.rate ?? 0.92);
    utter.pitch = Number(settings?.pitch ?? 0.82);
    utter.volume = Number(settings?.volume ?? 1.0);
    utter.onstart = () => {
      setSpeaking(true);
      setStatus("Speaking...");
      window.dispatchEvent(new CustomEvent("jarvis-voice-state", { detail: { state: "speaking" } }));
    };
    utter.onend = () => {
      setSpeaking(false);
      setStatus("Fertig gesprochen");
      window.dispatchEvent(new CustomEvent("jarvis-voice-state", { detail: { state: "idle" } }));
    };
    utter.onerror = () => {
      setSpeaking(false);
      setStatus("Sprachausgabe Fehler");
      window.dispatchEvent(new CustomEvent("jarvis-voice-state", { detail: { state: "idle" } }));
    };
    window.speechSynthesis.speak(utter);
  }

  function stop() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setSpeaking(false);
    setStatus("Gestoppt");
  }

  function set(key: string, value: any) {
    setSettings({ ...(settings || {}), [key]: value });
  }

  useEffect(() => {
    load();
    if ("speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = loadBrowserVoices;
    }
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  return (
    <div className="aufg-root">
      <div className="calc-title">VOICE CORE</div>
      <div className="set-hint" style={{ marginTop: -8 }}>
        JARVIS kann Antworten kostenlos über Browser/Windows TTS vorlesen. Mikrofon und Wake Word bleiben deaktiviert.
      </div>
      <div className="set-hint">Status: {status}</div>

      <div className="aufg-section">
        <div className="sap-label">TEST</div>
        <textarea className="sap-textarea" value={testText} onChange={(e) => setTestText(e.target.value)} rows={4} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button className="termin-parse-btn" onClick={() => speak()}>TEST SPRECHEN</button>
          <button className="termin-parse-btn" onClick={stop}>STOP</button>
          <button className="termin-parse-btn" onClick={() => save()}>SPEICHERN</button>
        </div>
        <div className="set-hint">Speaking: {speaking ? "ja" : "nein"}</div>
      </div>

      <div className="aufg-section">
        <div className="sap-label">BROWSER STIMME</div>
        <select
          className="sap-input"
          value={settings?.selected_voice || ""}
          onChange={(e) => set("selected_voice", e.target.value)}
        >
          <option value="">Automatisch</option>
          {voices.map((v) => (
            <option key={`${v.name}-${v.lang}`} value={v.name}>{v.name} · {v.lang}</option>
          ))}
        </select>

        <div className="aufg-input-row">
          <input className="sap-input" type="number" step="0.01" min="0.5" max="2" value={settings?.rate ?? 0.92} onChange={(e) => set("rate", Number(e.target.value))} placeholder="Rate" />
          <input className="sap-input" type="number" step="0.01" min="0" max="2" value={settings?.pitch ?? 0.82} onChange={(e) => set("pitch", Number(e.target.value))} placeholder="Pitch" />
          <input className="sap-input" type="number" step="0.01" min="0" max="1" value={settings?.volume ?? 1} onChange={(e) => set("volume", Number(e.target.value))} placeholder="Volume" />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button className="termin-parse-btn" onClick={() => set("auto_speak", !settings?.auto_speak)}>
            AUTO SPEAK: {settings?.auto_speak ? "AN" : "AUS"}
          </button>
          <button className="termin-parse-btn" onClick={() => set("enabled", !settings?.enabled)}>
            VOICE: {settings?.enabled ? "AN" : "AUS"}
          </button>
        </div>
      </div>

      <div className="aufg-section">
        <div className="sap-label">JARVIS PRESETS</div>
        {presets.map((p) => (
          <div className="aufg-item" key={p.id}>
            <span className="mem-badge manual">V</span>
            <span className="aufg-text"><b>{p.name}</b><br/><small>{p.description} · Rate {p.rate} · Pitch {p.pitch}</small></span>
            <button className="termin-parse-btn" onClick={() => applyPreset(p.id)}>SETZEN</button>
          </div>
        ))}
      </div>

      <div className="aufg-section">
        <div className="sap-label">PIPER VORBEREITUNG</div>
        <div className="aufg-item">
          <span className={`mem-badge ${piper?.available ? "manual" : "auto"}`}>{piper?.available ? "OK" : "OFF"}</span>
          <span className="aufg-text"><b>{piper?.available ? "Piper gefunden" : "Piper nicht eingerichtet"}</b><br/><small>{piper?.dir}</small></span>
        </div>
        <button className="termin-parse-btn" onClick={preparePiper}>PIPER ORDNER VORBEREITEN</button>
        <div className="set-hint">
          Piper ist optional. Voice Core funktioniert bereits kostenlos über Browser/Windows TTS.
        </div>
      </div>
    </div>
  );
}
