import type { BootPhase } from "./types";

export function BootOverlay({ phase, progress }: { phase: BootPhase; progress: number }) {
  return (
    <div className="jarvis-boot-overlay">
      <div className="boot-phase-readout">
        <span>{phase.label}</span>
        <b>{Math.round(progress)}%</b>
        <small>{phase.subtitle}</small>
        <div className="boot-phase-progress"><i style={{ width: `${progress}%` }} /></div>
      </div>
      <button
        className="boot-skip-button"
        type="button"
        onClick={() => window.dispatchEvent(new CustomEvent("jarvis:skipBoot"))}
      >
        SKIP BOOT
      </button>
    </div>
  );
}
