import { OrbState } from "./Orb";
import { WakeWordStatus } from "../hooks/useWakeWord";

interface TopBarProps {
  state: OrbState;
  onStopSpeech?: () => void;
  isSpeaking?: boolean;
  onClearHistory?: () => void;
  messageCount?: number;
  wakeWordStatus?: WakeWordStatus;
  onToggleWakeWord?: () => void;
  heatmapActive?: boolean;
  onToggleHeatmap?: () => void;
  neuralLogActive?: boolean;
  onToggleNeuralLog?: () => void;
}

const STATE_LABELS: Record<OrbState, string> = {
  idle: "SYSTEM BEREIT",
  listening: "HOEREN AKTIV",
  thinking: "VERARBEITUNG",
  speaking: "SPRACHAUSGABE",
};

const WAKE_LABELS: Record<WakeWordStatus, string> = {
  inactive: "WAKE AUS",
  listening: "HEY JARVIS",
  detected: "ERKANNT",
  unsupported: "N/A",
};

declare global {
  interface Window {
    electronAPI?: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
      isMaximized: () => Promise<boolean>;
      platform: string;
      isElectron: boolean;
    };
  }
}
const isElectron = !!window.electronAPI?.isElectron;

export function TopBar({
  state, onStopSpeech, isSpeaking,
  onClearHistory, messageCount = 0,
  wakeWordStatus = "inactive", onToggleWakeWord,
  heatmapActive = false, onToggleHeatmap,
  neuralLogActive = false, onToggleNeuralLog,
}: TopBarProps) {
  return (
    <div className={`jv-topbar ${isElectron ? "electron" : ""}`}>
      {!isElectron && <div className="jv-logo">J A R V I S</div>}
      {isElectron && <div style={{ flex: 1 }} />}

      <div className="jv-topbar-right">
        {isSpeaking && onStopSpeech && (
          <button className="jv-stop-btn" onClick={onStopSpeech}>
            <svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
            STOPP
          </button>
        )}

        {onToggleHeatmap && (
          <button
            className={`jv-icon-btn ${heatmapActive ? "active" : ""}`}
            onClick={onToggleHeatmap}
            title="Neural Heatmap"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="3" />
              <circle cx="12" cy="12" r="7" />
              <circle cx="12" cy="12" r="11" />
            </svg>
            <span>HEAT</span>
          </button>
        )}

        {onToggleNeuralLog && (
          <button
            className={`jv-icon-btn ${neuralLogActive ? "active" : ""}`}
            onClick={onToggleNeuralLog}
            title="Neural Log"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <span>LOG</span>
          </button>
        )}

        {wakeWordStatus !== "unsupported" && onToggleWakeWord && (
          <button className={`jv-wake-btn ${wakeWordStatus}`} onClick={onToggleWakeWord}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              {wakeWordStatus === "inactive" ? (
                <><rect x="9" y="3" width="6" height="12" rx="3" /><line x1="1" y1="1" x2="23" y2="23" /></>
              ) : (
                <><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><line x1="12" y1="18" x2="12" y2="22" /></>
              )}
            </svg>
            <span>{WAKE_LABELS[wakeWordStatus]}</span>
          </button>
        )}

        {messageCount > 0 && onClearHistory && (
          <button className="jv-clear-btn" onClick={onClearHistory} title="Verlauf loeschen">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6M9 6V4h6v2" />
            </svg>
          </button>
        )}

        <div className="jv-state">
          <span className="dot" />
          <span>{STATE_LABELS[state]}</span>
        </div>
      </div>
    </div>
  );
}
