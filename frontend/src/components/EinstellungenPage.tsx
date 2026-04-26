import { useState, useEffect } from "react";
import { JarvisSettings } from "../hooks/useSettings";
import { JARVIS_SYSTEM_PROMPT } from "../config/systemPrompt";

interface EinstellungenPageProps {
  settings: JarvisSettings;
  onUpdate: <K extends keyof JarvisSettings>(key: K, value: JarvisSettings[K]) => void;
  onReset: () => void;
}

interface VoiceOption {
  name: string;
  lang: string;
}

function loadVoices(): VoiceOption[] {
  return window.speechSynthesis
    ?.getVoices()
    .map((v) => ({ name: v.name, lang: v.lang })) ?? [];
}

export function EinstellungenPage({ settings, onUpdate, onReset }: EinstellungenPageProps) {
  const [voices, setVoices] = useState<VoiceOption[]>(loadVoices);
  const [apiStatus, setApiStatus] = useState<"idle" | "ok" | "error">("idle");
  const [promptReset, setPromptReset] = useState(false);

  useEffect(() => {
    const update = () => setVoices(loadVoices());
    window.speechSynthesis?.addEventListener("voiceschanged", update);
    update();
    return () => window.speechSynthesis?.removeEventListener("voiceschanged", update);
  }, []);

  async function testConnection() {
    setApiStatus("idle");
    try {
      const res = await fetch(`${settings.apiUrl}/v1/models`, { signal: AbortSignal.timeout(3000) });
      setApiStatus(res.ok ? "ok" : "error");
    } catch {
      setApiStatus("error");
    }
  }

  function handlePromptReset() {
    onUpdate("systemPrompt", JARVIS_SYSTEM_PROMPT);
    setPromptReset(true);
    setTimeout(() => setPromptReset(false), 2000);
  }

  const deVoices = voices.filter((v) => v.lang.startsWith("de"));
  const otherVoices = voices.filter((v) => !v.lang.startsWith("de"));

  return (
    <div className="set-root">
      <div className="calc-title">EINSTELLUNGEN</div>

      {/* ── Backend ── */}
      <div className="set-section">
        <div className="set-section-title">BACKEND</div>

        <div className="set-field">
          <label className="set-label">API-URL</label>
          <div className="set-input-row">
            <input
              className="sap-input"
              value={settings.apiUrl}
              onChange={(e) => onUpdate("apiUrl", e.target.value)}
              placeholder="http://127.0.0.1:8000"
            />
            <button
              className={`set-test-btn ${apiStatus}`}
              onClick={testConnection}
              title="Verbindung testen"
            >
              {apiStatus === "ok" ? "ONLINE ✓" : apiStatus === "error" ? "FEHLER ✗" : "TESTEN"}
            </button>
          </div>
        </div>

        <div className="set-field">
          <label className="set-label">Modell</label>
          <input
            className="sap-input"
            value={settings.model}
            onChange={(e) => onUpdate("model", e.target.value)}
            placeholder="z.B. qwen3.5:4b, llama3.2, mistral"
          />
          <div className="set-hint">Muss vom Backend unterstützt werden. Sofort aktiv.</div>
        </div>
      </div>

      {/* ── System-Prompt ── */}
      <div className="set-section">
        <div className="set-section-title-row">
          <span className="set-section-title">SYSTEM-PROMPT</span>
          <button
            className={`set-reset-small ${promptReset ? "done" : ""}`}
            onClick={handlePromptReset}
          >
            {promptReset ? "ZURÜCKGESETZT ✓" : "AUF STANDARD"}
          </button>
        </div>
        <textarea
          className="set-prompt-textarea"
          value={settings.systemPrompt}
          onChange={(e) => onUpdate("systemPrompt", e.target.value)}
          rows={10}
          spellCheck={false}
        />
        <div className="set-hint">
          Wird bei jedem API-Call als erstes Message-Element gesendet. Sofort aktiv.
        </div>
      </div>

      {/* ── Sprachausgabe ── */}
      <div className="set-section">
        <div className="set-section-title">SPRACHAUSGABE (TTS)</div>

        <div className="set-field">
          <div className="set-toggle-row">
            <label className="set-label">Aktiviert</label>
            <button
              className={`set-toggle ${settings.ttsEnabled ? "on" : "off"}`}
              onClick={() => onUpdate("ttsEnabled", !settings.ttsEnabled)}
            >
              {settings.ttsEnabled ? "AN" : "AUS"}
            </button>
          </div>
        </div>

        {settings.ttsEnabled && (
          <>
            <div className="set-field">
              <label className="set-label">Piper-Server (lokale Neural-TTS)</label>
              <input
                type="text"
                className="sap-input"
                value={settings.piperUrl}
                onChange={(e) => onUpdate("piperUrl", e.target.value)}
                placeholder="http://127.0.0.1:5002 (leer = aus)"
              />
              <div className="set-hint">
                Wenn erreichbar, wird Piper bevorzugt (Thorsten-Stimme).
                Sonst faellt die Ausgabe auf den Browser-Sprachsynthesizer zurueck.
              </div>
            </div>

            <div className="set-field">
              <label className="set-label">Browser-Stimme (Fallback)</label>
              <select
                className="sap-input sap-select"
                value={settings.voiceName}
                onChange={(e) => onUpdate("voiceName", e.target.value)}
              >
                <option value="">Automatisch (bevorzugt de-DE)</option>
                {deVoices.length > 0 && (
                  <optgroup label="Deutsch">
                    {deVoices.map((v) => (
                      <option key={v.name} value={v.name}>{v.name}</option>
                    ))}
                  </optgroup>
                )}
                {otherVoices.length > 0 && (
                  <optgroup label="Andere">
                    {otherVoices.map((v) => (
                      <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div className="set-field">
              <label className="set-label">Geschwindigkeit — {settings.ttsRate.toFixed(2)}x</label>
              <input
                type="range" className="set-slider"
                min="0.5" max="2.0" step="0.05"
                value={settings.ttsRate}
                onChange={(e) => onUpdate("ttsRate", parseFloat(e.target.value))}
              />
              <div className="set-slider-labels"><span>0.5×</span><span>1.0×</span><span>2.0×</span></div>
            </div>

            <div className="set-field">
              <label className="set-label">Tonhöhe — {settings.ttsPitch.toFixed(2)}</label>
              <input
                type="range" className="set-slider"
                min="0.5" max="1.5" step="0.05"
                value={settings.ttsPitch}
                onChange={(e) => onUpdate("ttsPitch", parseFloat(e.target.value))}
              />
              <div className="set-slider-labels"><span>tief</span><span>normal</span><span>hoch</span></div>
            </div>

            <button className="set-preview-btn" onClick={() => {
              const u = new SpeechSynthesisUtterance("JARVIS online. Systeme bereit.");
              u.lang = "de-DE";
              u.rate = settings.ttsRate;
              u.pitch = settings.ttsPitch;
              if (settings.voiceName) {
                const v = window.speechSynthesis.getVoices().find((v) => v.name === settings.voiceName);
                if (v) u.voice = v;
              }
              window.speechSynthesis.cancel();
              window.speechSynthesis.speak(u);
            }}>
              VORSCHAU ABSPIELEN
            </button>
          </>
        )}
      </div>

      {/* ── Reset ── */}
      <div className="set-section">
        <div className="set-section-title">ZURÜCKSETZEN</div>
        <button className="set-reset-btn" onClick={onReset}>
          Alle Einstellungen auf Standard zurücksetzen
        </button>
      </div>
    </div>
  );
}
