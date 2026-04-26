import { useEffect, useRef, useState } from "react";

const API = "http://127.0.0.1:8000";

type RecognitionType = any;

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export function VoiceInterfacePage() {
  const [settings, setSettings] = useState<any>(null);
  const [runtime, setRuntime] = useState<any>(null);
  const [status, setStatus] = useState("Lade Voice Interface...");
  const [available, setAvailable] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [wakeLog, setWakeLog] = useState<string[]>([]);
  const recognitionRef = useRef<RecognitionType | null>(null);
  const wakeRunningRef = useRef(false);

  const Recognition = typeof window !== "undefined"
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;

  async function load() {
    try {
      setAvailable(Boolean(Recognition));
      const res = await fetch(`${API}/voice/core`);
      const data = await res.json();
      setSettings(data.settings || {});
      setRuntime(data.runtime || {});
      setStatus("Aktuell");
    } catch (e) {
      setStatus(`Fehler: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function saveSettings(next: any) {
    const res = await fetch(`${API}/voice/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    const data = await res.json();
    setSettings(data);
    setStatus("Gespeichert");
  }

  async function enableMic() {
    const res = await fetch(`${API}/voice/microphone/enable`, { method: "POST" });
    const data = await res.json();
    setSettings(data.settings);
    setRuntime(data.runtime);
    setStatus(data.message || "Mikrofon im Interface aktiviert");
  }

  async function disableMic() {
    stopListening();
    wakeRunningRef.current = false;
    const res = await fetch(`${API}/voice/microphone/disable`, { method: "POST" });
    const data = await res.json();
    setSettings(data.settings);
    setRuntime(data.runtime);
    setStatus(data.message || "Mikrofon deaktiviert");
  }

  async function saveRuntime(partial: any) {
    try {
      const res = await fetch(`${API}/voice/runtime`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
      setRuntime(await res.json());
    } catch {}
  }

  async function saveTranscript(text: string) {
    try {
      await fetch(`${API}/voice/transcript`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
    } catch {}
  }

  function buildRecognition(mode: "single" | "wake") {
    if (!Recognition) return null;
    const rec = new Recognition();
    rec.lang = settings?.language || "de-DE";
    rec.continuous = mode === "wake";
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setListening(true);
      setStatus(mode === "wake" ? "Wake Word Modus hört zu..." : "Push to Talk hört zu...");
      saveRuntime({ listening: true, microphone_permission: "granted", last_event: mode === "wake" ? "wake_listening" : "push_to_talk" });
      window.dispatchEvent(new CustomEvent("jarvis-voice-state", { detail: { state: "listening" } }));
    };

    rec.onerror = (event: any) => {
      setListening(false);
      const msg = event?.error ? `SpeechRecognition Fehler: ${event.error}` : "SpeechRecognition Fehler";
      setStatus(msg);
      saveRuntime({ listening: false, microphone_permission: event?.error === "not-allowed" ? "denied" : "unknown", last_event: msg });
      window.dispatchEvent(new CustomEvent("jarvis-voice-state", { detail: { state: "idle" } }));
    };

    rec.onend = () => {
      setListening(false);
      saveRuntime({ listening: false, last_event: mode === "wake" ? "wake_stopped" : "push_to_talk_done" });
      window.dispatchEvent(new CustomEvent("jarvis-voice-state", { detail: { state: "idle" } }));
      if (mode === "wake" && wakeRunningRef.current && settings?.microphone_enabled) {
        setTimeout(() => {
          try { recognitionRef.current?.start(); } catch {}
        }, 350);
      }
    };

    rec.onresult = (event: any) => {
      let finalText = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const piece = event.results[i][0]?.transcript || "";
        if (event.results[i].isFinal) finalText += piece;
        else interim += piece;
      }
      const combined = (finalText || interim).trim();
      if (combined) setTranscript(combined);

      if (finalText.trim()) {
        const clean = finalText.trim();
        saveTranscript(clean);

        if (mode === "wake") {
          const wake = String(settings?.wake_word || "jarvis").toLowerCase();
          const low = clean.toLowerCase();
          setWakeLog((old) => [`${new Date().toLocaleTimeString("de-DE")} · ${clean}`, ...old].slice(0, 8));
          if (low.includes(wake)) {
            setStatus(`Wake Word erkannt: ${settings?.wake_word || "Jarvis"}`);
            window.dispatchEvent(new CustomEvent("jarvis-wake-word", { detail: { transcript: clean } }));
          }
        } else {
          setStatus(`Erkannt: ${clean}`);
          window.dispatchEvent(new CustomEvent("jarvis-transcript", { detail: { transcript: clean } }));
        }
      }
    };

    return rec;
  }

  function startPushToTalk() {
    if (!settings?.microphone_enabled) {
      setStatus("Bitte Mikrofon erst im Interface aktivieren.");
      return;
    }
    if (!Recognition) {
      setStatus("SpeechRecognition ist in diesem Browser nicht verfügbar.");
      return;
    }
    stopListening();
    wakeRunningRef.current = false;
    const rec = buildRecognition("single");
    recognitionRef.current = rec;
    try { rec?.start(); } catch (e) { setStatus(String(e)); }
  }

  function startWakeWord() {
    if (!settings?.microphone_enabled) {
      setStatus("Bitte Mikrofon erst im Interface aktivieren.");
      return;
    }
    if (!settings?.wake_word_enabled) {
      setStatus("Wake Word ist vorbereitet, aber noch nicht aktiviert.");
      return;
    }
    if (!Recognition) {
      setStatus("SpeechRecognition ist in diesem Browser nicht verfügbar.");
      return;
    }
    stopListening();
    wakeRunningRef.current = true;
    const rec = buildRecognition("wake");
    recognitionRef.current = rec;
    try { rec?.start(); } catch (e) { setStatus(String(e)); }
  }

  function stopListening() {
    wakeRunningRef.current = false;
    try { recognitionRef.current?.stop(); } catch {}
    try { recognitionRef.current?.abort(); } catch {}
    recognitionRef.current = null;
    setListening(false);
    saveRuntime({ listening: false, last_event: "manual_stop" });
    window.dispatchEvent(new CustomEvent("jarvis-voice-state", { detail: { state: "idle" } }));
  }

  function toggleWakeEnabled() {
    const next = { ...settings, wake_word_enabled: !settings?.wake_word_enabled };
    saveSettings(next);
  }

  function togglePushToTalk() {
    const next = { ...settings, push_to_talk_enabled: !settings?.push_to_talk_enabled };
    saveSettings(next);
  }

  useEffect(() => {
    load();
    return () => stopListening();
  }, []);

  return (
    <div className="aufg-root">
      <div className="calc-title">VOICE INTERFACE</div>
      <div className="set-hint" style={{ marginTop: -8 }}>
        Mikrofonsteuerung über UI. Standardmäßig aus. Browser Freigabe bleibt Pflicht.
      </div>
      <div className="set-hint">Status: {status}</div>

      <div className="aufg-section">
        <div className="sap-label">SICHERHEIT</div>
        <div className="aufg-item">
          <span className={`mem-badge ${settings?.microphone_enabled ? "auto" : "manual"}`}>{settings?.microphone_enabled ? "AN" : "AUS"}</span>
          <span className="aufg-text"><b>Mikrofon Interface</b><br/><small>{settings?.microphone_enabled ? "bewusst aktiviert" : "deaktiviert"}</small></span>
        </div>
        <div className="aufg-item">
          <span className={`mem-badge ${listening ? "auto" : "manual"}`}>{listening ? "LIVE" : "STOP"}</span>
          <span className="aufg-text"><b>Listening Status</b><br/><small>{listening ? "JARVIS hört gerade über den Browser" : "JARVIS hört nicht zu"}</small></span>
        </div>
        <div className="aufg-item">
          <span className={`mem-badge ${available ? "manual" : "auto"}`}>{available ? "OK" : "NO"}</span>
          <span className="aufg-text"><b>Browser SpeechRecognition</b><br/><small>{available ? "verfügbar" : "nicht verfügbar"}</small></span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button className="termin-parse-btn" onClick={enableMic}>MIKROFON AKTIVIEREN</button>
          <button className="termin-parse-btn" onClick={disableMic}>MIKROFON AUS</button>
          <button className="termin-parse-btn" onClick={stopListening}>STOP LISTENING</button>
        </div>
      </div>

      <div className="aufg-section">
        <div className="sap-label">PUSH TO TALK</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button className="termin-parse-btn" onClick={togglePushToTalk}>PUSH TO TALK: {settings?.push_to_talk_enabled ? "AN" : "AUS"}</button>
          <button className="termin-parse-btn" onClick={startPushToTalk} disabled={!settings?.push_to_talk_enabled}>SPRECHEN</button>
        </div>
        <div className="set-hint">Erkannter Text wird gespeichert und als Event bereitgestellt.</div>
      </div>

      <div className="aufg-section">
        <div className="sap-label">WAKE WORD VORBEREITUNG</div>
        <input className="sap-input" value={settings?.wake_word || "jarvis"} onChange={(e) => setSettings({ ...settings, wake_word: e.target.value })} placeholder="Wake Word" />
        <input className="sap-input" value={settings?.language || "de-DE"} onChange={(e) => setSettings({ ...settings, language: e.target.value })} placeholder="Sprache, z. B. de-DE" />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button className="termin-parse-btn" onClick={() => saveSettings(settings)}>SPEICHERN</button>
          <button className="termin-parse-btn" onClick={toggleWakeEnabled}>WAKE WORD: {settings?.wake_word_enabled ? "AN" : "AUS"}</button>
          <button className="termin-parse-btn" onClick={startWakeWord}>WAKE TEST STARTEN</button>
        </div>
        <div className="set-hint">Wake Word läuft nur, wenn Mikrofon aktiv ist und du den Test bewusst startest.</div>
      </div>

      <div className="aufg-section">
        <div className="sap-label">TRANSKRIPT</div>
        <textarea className="sap-textarea" value={transcript} onChange={(e) => setTranscript(e.target.value)} rows={4} />
        <button className="termin-parse-btn" onClick={() => navigator.clipboard?.writeText(transcript)}>KOPIEREN</button>
      </div>

      <div className="aufg-section">
        <div className="sap-label">WAKE LOG</div>
        {wakeLog.length === 0 && <div className="set-hint">Noch keine Wake Word Treffer.</div>}
        {wakeLog.map((entry, idx) => (
          <div className="aufg-item" key={idx}>
            <span className="mem-badge manual">W</span>
            <span className="aufg-text">{entry}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
