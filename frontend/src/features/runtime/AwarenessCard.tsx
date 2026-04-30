import type { AwarenessLoopState, AwarenessSnapshot } from "./runtimeTypes";
import { pct, prettyDate } from "./runtimeFormat";

type Props = {
  awareness: AwarenessSnapshot | null;
  loop: AwarenessLoopState | null;
  awarenessInterval: number;
  loopBusy: boolean;
  onAwarenessIntervalChange: (value: number) => void;
  onStartLoop: () => void;
  onStopLoop: () => void;
};

export function AwarenessCard({ awareness, loop, awarenessInterval, loopBusy, onAwarenessIntervalChange, onStartLoop, onStopLoop }: Props) {
  return (
    <section className="runtime-control-card runtime-awareness-card">
      <div className="runtime-control-card-title"><h2>Awareness</h2><span>{loop?.enabled ? "Loop aktiv" : "lokaler Snapshot"}</span></div>
      <div className="runtime-awareness-live">
        <b>{awareness?.active_window?.process_name || "Noch kein Snapshot"}</b>
        <span>{awareness?.active_window?.window_title || "Klicke Awareness erfassen oder starte den Loop, um aktives Fenster und Kontext lokal zu erfassen."}</span>
        <em>{awareness?.activity?.category || "idle"} / Vertrauen {pct(awareness?.activity?.confidence)}</em>
      </div>
      <div className="runtime-awareness-loop">
        <input type="number" min={3} max={120} value={awarenessInterval} onChange={(e) => onAwarenessIntervalChange(Number(e.target.value || 10))} />
        <button onClick={() => void onStartLoop()}>{loopBusy ? "..." : "LOOP STARTEN"}</button>
        <button onClick={() => void onStopLoop()}>{loopBusy ? "..." : "STOPPEN"}</button>
      </div>
      <div className="runtime-awareness-meta">
        <div><span>Loop</span><b>{loop?.enabled ? "an" : "aus"}</b></div>
        <div><span>Erfassungen</span><b>{loop?.captures ?? 0}</b></div>
        <div><span>Zuletzt</span><b>{prettyDate(loop?.last_capture_at) || "n/a"}</b></div>
        <div><span>OCR</span><b>{awareness?.privacy?.ocr_enabled ? "an" : "aus"}</b></div>
      </div>
    </section>
  );
}
