import type { OrbState } from "../../core/types";

export type Rgb = { r: number; g: number; b: number };

export type OrbVisualParams = {
  color: Rgb;
  accentColor: Rgb;
  glow: number;
  pulseCycleMs: number;
  rotationSeconds: number;
  density: number;
  centerPull: number;
  orbitSpeed: number;
  outwardPulse: number;
  jitter: number;
  pausedRotation: boolean;
};

export const ORB_STATE_PARAMS: Record<OrbState, OrbVisualParams> = {
  idle: {
    color: hexToRgb("#00d4ff"),
    accentColor: hexToRgb("#00d4ff"),
    glow: 0.6,
    pulseCycleMs: 2000,
    rotationSeconds: 60,
    density: 1,
    centerPull: 0.06,
    orbitSpeed: 0.12,
    outwardPulse: 0.04,
    jitter: 0,
    pausedRotation: false,
  },
  listening: {
    color: hexToRgb("#c9f7ff"),
    accentColor: hexToRgb("#00d4ff"),
    glow: 0.9,
    pulseCycleMs: 1100,
    rotationSeconds: 30,
    density: 1.15,
    centerPull: 0.18,
    orbitSpeed: 0.18,
    outwardPulse: 0.08,
    jitter: 0.01,
    pausedRotation: false,
  },
  thinking: {
    color: hexToRgb("#00d4ff"),
    accentColor: hexToRgb("#b400ff"),
    glow: 0.9,
    pulseCycleMs: 800,
    rotationSeconds: 15,
    density: 1.22,
    centerPull: 0.1,
    orbitSpeed: 0.42,
    outwardPulse: 0.06,
    jitter: 0.025,
    pausedRotation: false,
  },
  speaking: {
    color: hexToRgb("#00d4ff"),
    accentColor: hexToRgb("#ffcc00"),
    glow: 1.0,
    pulseCycleMs: 1200,
    rotationSeconds: 20,
    density: 1.08,
    centerPull: 0.04,
    orbitSpeed: 0.25,
    outwardPulse: 0.22,
    jitter: 0.012,
    pausedRotation: false,
  },
  error: {
    color: hexToRgb("#ff3333"),
    accentColor: hexToRgb("#ff3333"),
    glow: 1.4,
    pulseCycleMs: 500,
    rotationSeconds: 999999,
    density: 0.9,
    centerPull: 0.02,
    orbitSpeed: 0,
    outwardPulse: 0.02,
    jitter: 0.12,
    pausedRotation: true,
  },
};

export function hexToRgb(hex: string): Rgb {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
}

export function rgbToCss(rgb: Rgb, alpha = 1) {
  return `rgba(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)}, ${alpha})`;
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function lerpRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return {
    r: lerp(a.r, b.r, t),
    g: lerp(a.g, b.g, t),
    b: lerp(a.b, b.b, t),
  };
}

export function easeInOut(t: number) {
  const clamped = Math.max(0, Math.min(1, t));
  return clamped < 0.5 ? 2 * clamped * clamped : 1 - Math.pow(-2 * clamped + 2, 2) / 2;
}

export function interpolateVisualParams(from: OrbVisualParams, to: OrbVisualParams, t: number): OrbVisualParams {
  const e = easeInOut(t);
  return {
    color: lerpRgb(from.color, to.color, e),
    accentColor: lerpRgb(from.accentColor, to.accentColor, e),
    glow: lerp(from.glow, to.glow, e),
    pulseCycleMs: lerp(from.pulseCycleMs, to.pulseCycleMs, e),
    rotationSeconds: lerp(from.rotationSeconds, to.rotationSeconds, e),
    density: lerp(from.density, to.density, e),
    centerPull: lerp(from.centerPull, to.centerPull, e),
    orbitSpeed: lerp(from.orbitSpeed, to.orbitSpeed, e),
    outwardPulse: lerp(from.outwardPulse, to.outwardPulse, e),
    jitter: lerp(from.jitter, to.jitter, e),
    pausedRotation: e >= 0.5 ? to.pausedRotation : from.pausedRotation,
  };
}
