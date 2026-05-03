import { useCallback, useEffect, useRef, useState } from "react";
import { Orb, type OrbEventSignal, type OrbState } from "./Orb";
import { useCommandBus, type BusCommand } from "../hooks/useCommandBus";
import "../styles/iron-man.css";

export interface IronManShellProps {
  orbState: OrbState;
  orbSignal: OrbEventSignal | null;
  typingActivity: number;
  thinking: boolean;
  onSwitchToClassic: () => void;
  onSubmit?: (command: BusCommand) => void | Promise<void>;
}

export function IronManShell({
  orbState,
  orbSignal,
  typingActivity,
  thinking,
  onSwitchToClassic,
  onSubmit,
}: IronManShellProps) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const bus = useCommandBus(async (command) => {
    if (onSubmit) await onSubmit(command);
  });

  const submit = useCallback(async () => {
    const value = input.trim();
    if (!value) return;
    setInput("");
    await bus.dispatch(value, "text");
  }, [input, bus]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        // F1 hat noch keine Modals — ESC blurrt nur den Input.
        inputRef.current?.blur();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const lastCommand = bus.history[bus.history.length - 1];

  return (
    <div className="iron-man-shell" role="application" aria-label="JARVIS Iron Man Shell">
      <button
        type="button"
        className="iron-man-mode-toggle"
        onClick={onSwitchToClassic}
        title="Zurueck zum klassischen Layout"
      >
        Classic
      </button>

      <div className="iron-man-corner tl" aria-label="System">
        <span className="iron-man-corner-label">SYSTEM</span>
        <span>F3 — Telemetrie folgt</span>
      </div>
      <div className="iron-man-corner tr" aria-label="Netzwerk">
        <span className="iron-man-corner-label">NETZ &middot; ZEIT</span>
        <span>F3 — Live-Kanal folgt</span>
      </div>
      <div className="iron-man-corner bl" aria-label="Audit-Stream">
        <span className="iron-man-corner-label">AUDIT</span>
        <span>F3 — Stream folgt</span>
      </div>
      <div className="iron-man-corner br" aria-label="Tools und Risiko">
        <span className="iron-man-corner-label">TOOLS &middot; RISK</span>
        <span>F3 — Live-Kanal folgt</span>
      </div>

      <div className="iron-man-orb-area">
        <div className="iron-man-orb-frame">
          <Orb
            state={orbState}
            typingActivity={typingActivity}
            heatmapActive={thinking || orbState === "speaking"}
            eventSignal={orbSignal}
          />
        </div>
      </div>

      <div className="iron-man-input-area">
        <div className="iron-man-input-frame">
          <input
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void submit();
            }}
            placeholder="Befehl oder /slash eingeben..."
            spellCheck={false}
            autoFocus
          />
          <div className="iron-man-input-meta">
            <span>{lastCommand ? `Letzter: ${lastCommand.raw}` : "Strg+K fokussiert"}</span>
            <span>F4 — Slash-Autocomplete folgt</span>
          </div>
        </div>
      </div>
    </div>
  );
}
