import { useEffect, useMemo, useState } from "react";
import { getBootPhases } from "./BootPhases";
import { BootOverlay } from "./BootOverlay";
import { GlobalNetworkScene } from "./GlobalNetworkScene";
import type { BootSequenceProps } from "./types";
import "./boot.css";

export function BootSequence({ compact = false, onComplete }: BootSequenceProps) {
  const phases = useMemo(() => getBootPhases(compact), [compact]);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [phaseElapsed, setPhaseElapsed] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const phase = phases[phaseIndex];

  useEffect(() => {
    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      setPhaseElapsed(elapsed);
      if (elapsed >= phase.durationMs) {
        if (phaseIndex >= phases.length - 1) {
          setLeaving(true);
          window.setTimeout(() => onComplete?.(), 520);
          return;
        }
        setPhaseIndex((current) => current + 1);
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onComplete, phase.durationMs, phaseIndex, phases.length]);

  useEffect(() => {
    const skip = () => {
      setLeaving(true);
      window.setTimeout(() => onComplete?.(), 260);
    };
    window.addEventListener("jarvis:skipBoot", skip);
    return () => window.removeEventListener("jarvis:skipBoot", skip);
  }, [onComplete]);

  const phaseRatio = Math.min(1, phaseElapsed / phase.durationMs);
  const previousProgress = phaseIndex === 0 ? 0 : phases[phaseIndex - 1].progress;
  const progress = previousProgress + (phase.progress - previousProgress) * phaseRatio;

  return (
    <div className={`jarvis-boot-sequence ${leaving ? "leaving" : ""}`} data-phase={phase.id}>
      <GlobalNetworkScene phase={phase.id} progress={progress} />
      <BootOverlay phase={phase} progress={progress} />
    </div>
  );
}
