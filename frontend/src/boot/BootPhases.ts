import type { BootPhase } from "./types";

export const LONG_BOOT_PHASES: BootPhase[] = [
  { id: "wake", label: "SYSTEM WAKE", subtitle: "Cold start and signal noise", durationMs: 950, progress: 8 },
  { id: "hud", label: "HUD BOOT", subtitle: "Frame, scanners and diagnostics", durationMs: 1250, progress: 21 },
  { id: "mapReveal", label: "MAP REVEAL", subtitle: "Global topology projection", durationMs: 1400, progress: 36 },
  { id: "networkIgnition", label: "NETWORK IGNITION", subtitle: "Routes and packet streams", durationMs: 1700, progress: 55 },
  { id: "globalConvergence", label: "GLOBAL CONVERGENCE", subtitle: "Worldwide traffic convergence", durationMs: 2350, progress: 78 },
  { id: "germanyLock", label: "GERMANY LOCK", subtitle: "Location acquired and node locked", durationMs: 1700, progress: 92 },
  { id: "transfer", label: "INTERFACE TRANSFER", subtitle: "Handing over to dashboard", durationMs: 1050, progress: 100 },
];

export const COMPACT_BOOT_PHASES: BootPhase[] = [
  { id: "hud", label: "HUD BOOT", subtitle: "Frame online", durationMs: 500, progress: 20 },
  { id: "mapReveal", label: "MAP REVEAL", subtitle: "Global topology", durationMs: 650, progress: 40 },
  { id: "globalConvergence", label: "GLOBAL CONVERGENCE", subtitle: "Traffic active", durationMs: 900, progress: 72 },
  { id: "germanyLock", label: "GERMANY LOCK", subtitle: "Node locked", durationMs: 800, progress: 92 },
  { id: "transfer", label: "INTERFACE TRANSFER", subtitle: "Dashboard handoff", durationMs: 500, progress: 100 },
];

export function getBootPhases(compact = false): BootPhase[] {
  return compact ? COMPACT_BOOT_PHASES : LONG_BOOT_PHASES;
}
