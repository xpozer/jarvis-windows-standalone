import { create } from "zustand";
import type { OrbState } from "../core/types";

type OrbStore = {
  state: OrbState;
  audioLevel: number;
  intensity: number;
  setState: (state: OrbState) => void;
  setAudioLevel: (level: number) => void;
  setIntensity: (intensity: number) => void;
};

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

let errorResetTimer: number | undefined;

export const useOrbStore = create<OrbStore>((set) => ({
  state: "idle",
  audioLevel: 0,
  intensity: 0.6,
  setState: (state) => {
    if (errorResetTimer) {
      window.clearTimeout(errorResetTimer);
      errorResetTimer = undefined;
    }
    set({ state });
    if (state === "error") {
      errorResetTimer = window.setTimeout(() => set({ state: "idle" }), 3000);
    }
  },
  setAudioLevel: (level) => set({ audioLevel: clamp01(level) }),
  setIntensity: (intensity) => set({ intensity: clamp01(intensity) }),
}));
