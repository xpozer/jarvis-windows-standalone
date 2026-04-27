export type BootPhaseId =
  | "wake"
  | "hud"
  | "mapReveal"
  | "networkIgnition"
  | "globalConvergence"
  | "germanyLock"
  | "transfer";

export type BootPhase = {
  id: BootPhaseId;
  label: string;
  subtitle: string;
  durationMs: number;
  progress: number;
};

export type BootSequenceProps = {
  compact?: boolean;
  onComplete?: () => void;
};

export type GlobalNetworkSceneProps = {
  phase: BootPhaseId;
  progress: number;
};
