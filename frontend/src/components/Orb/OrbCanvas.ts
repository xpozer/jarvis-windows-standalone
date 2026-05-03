import type { OrbState } from "../../core/types";
import {
  ORB_STATE_PARAMS,
  interpolateVisualParams,
  rgbToCss,
  type OrbVisualParams,
} from "./OrbStates";

type Particle = {
  baseRadius: number;
  radius: number;
  angle: number;
  speed: number;
  size: number;
  alpha: number;
  layer: number;
  wobble: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function createParticle(maxRadius: number): Particle {
  const layer = Math.random();
  const baseRadius = Math.sqrt(Math.random()) * maxRadius;
  return {
    baseRadius,
    radius: baseRadius,
    angle: Math.random() * Math.PI * 2,
    speed: 0.15 + Math.random() * 0.55,
    size: 0.8 + Math.random() * 1.9,
    alpha: 0.32 + Math.random() * 0.58,
    layer,
    wobble: Math.random() * Math.PI * 2,
  };
}

export class OrbCanvas {
  private ctx: CanvasRenderingContext2D;
  private particles: Particle[] = [];
  private width = 0;
  private height = 0;
  private dpr = 1;
  private centerX = 0;
  private centerY = 0;
  private baseRadius = 100;
  private currentState: OrbState = "idle";
  private audioLevel = 0;
  private currentVisualParams: OrbVisualParams = { ...ORB_STATE_PARAMS.idle };
  private transitionFrom: OrbVisualParams = { ...ORB_STATE_PARAMS.idle };
  private targetVisualParams: OrbVisualParams = { ...ORB_STATE_PARAMS.idle };
  private transitionStartTime = 0;
  private transitionDuration = 600;
  private rotation = 0;
  private disposed = false;
  private particleTarget = 200;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) {
      throw new Error("Orb canvas context could not be created.");
    }
    this.ctx = ctx;
  }

  setState(state: OrbState, transitionMs = 600) {
    if (this.currentState === state) return;
    this.currentState = state;
    this.transitionFrom = { ...this.currentVisualParams };
    this.targetVisualParams = { ...ORB_STATE_PARAMS[state] };
    this.transitionStartTime = performance.now();
    this.transitionDuration = Math.max(1, transitionMs);
  }

  setAudioLevel(level: number) {
    this.audioLevel = clamp(level, 0, 1);
  }

  resize(width: number, height: number, dpr: number) {
    this.width = Math.max(1, Math.floor(width));
    this.height = Math.max(1, Math.floor(height));
    this.dpr = Math.max(1, dpr);
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    this.baseRadius = Math.min(this.width, this.height) * 0.38;
    this.particleTarget = this.width < 420 ? 80 : 200;
    this.rebuildParticles();
  }

  render(timestamp: number) {
    if (this.disposed || document.hidden) return;
    this.updateTransition(timestamp);
    this.updateParticles(timestamp);
    this.draw(timestamp);
  }

  dispose() {
    this.disposed = true;
    this.particles = [];
    this.ctx.clearRect(0, 0, this.width, this.height);
  }

  private updateTransition(timestamp: number) {
    const progress = clamp((timestamp - this.transitionStartTime) / this.transitionDuration, 0, 1);
    this.currentVisualParams = interpolateVisualParams(
      this.transitionFrom,
      this.targetVisualParams,
      progress,
    );
  }

  private rebuildParticles() {
    this.particles = Array.from({ length: this.particleTarget }, () => createParticle(this.baseRadius));
  }

  private updateParticles(timestamp: number) {
    const params = this.currentVisualParams;
    const seconds = timestamp / 1000;
    const audio = this.currentState === "listening" || this.currentState === "speaking" ? this.audioLevel : 0;
    const pulse = this.getPulse(timestamp, params.pulseCycleMs);
    const rotationSpeed = params.pausedRotation ? 0 : (Math.PI * 2) / Math.max(1, params.rotationSeconds);
    this.rotation += rotationSpeed / 60;

    for (const particle of this.particles) {
      const densityRadius = this.baseRadius * (1.08 - params.centerPull * params.density);
      const targetRadius = particle.baseRadius * (densityRadius / this.baseRadius);
      const outward = params.outwardPulse * (pulse + audio * 0.7) * this.baseRadius * 0.12;
      const jitter = params.jitter * this.baseRadius * (Math.random() - 0.5);
      particle.radius += (targetRadius + outward + jitter - particle.radius) * 0.08;
      particle.angle += (particle.speed * params.orbitSpeed) / 60;
      particle.wobble += 0.018 + particle.layer * 0.012 + seconds * 0.0001;
    }
  }

  private draw(timestamp: number) {
    const ctx = this.ctx;
    const params = this.currentVisualParams;
    const pulse = this.getPulse(timestamp, params.pulseCycleMs);
    const audio = this.currentState === "listening" || this.currentState === "speaking" ? this.audioLevel : 0;
    const glow = params.glow + audio * 0.45;
    const coreRadius = this.baseRadius * (0.36 + pulse * 0.035 + audio * 0.04);

    ctx.clearRect(0, 0, this.width, this.height);

    const halo = ctx.createRadialGradient(this.centerX, this.centerY, 0, this.centerX, this.centerY, this.baseRadius * 1.42);
    halo.addColorStop(0, rgbToCss(params.color, 0.24 * glow));
    halo.addColorStop(0.34, rgbToCss(params.accentColor, 0.12 * glow));
    halo.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, this.baseRadius * 1.42, 0, Math.PI * 2);
    ctx.fill();

    this.drawRings(ctx, params, pulse, glow);
    this.drawParticles(ctx, params, timestamp, glow);
    this.drawCore(ctx, params, coreRadius, glow);
  }

  private drawRings(ctx: CanvasRenderingContext2D, params: OrbVisualParams, pulse: number, glow: number) {
    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    ctx.rotate(this.rotation);
    ctx.strokeStyle = rgbToCss(params.color, 0.34 + glow * 0.1);
    ctx.lineWidth = 1;
    ctx.shadowColor = rgbToCss(params.color, 0.7);
    ctx.shadowBlur = 18 * glow;

    for (let i = 0; i < 3; i += 1) {
      ctx.beginPath();
      const r = this.baseRadius * (0.46 + i * 0.19 + pulse * 0.014);
      ctx.ellipse(0, 0, r, r * (0.68 + i * 0.06), i * 0.74, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }

  private drawParticles(ctx: CanvasRenderingContext2D, params: OrbVisualParams, timestamp: number, glow: number) {
    ctx.save();
    ctx.translate(this.centerX, this.centerY);
    ctx.rotate(this.rotation * 0.45);
    ctx.globalCompositeOperation = "lighter";

    for (const particle of this.particles) {
      const wobble = Math.sin(timestamp * 0.0015 + particle.wobble) * this.baseRadius * 0.025;
      const x = Math.cos(particle.angle) * (particle.radius + wobble);
      const y = Math.sin(particle.angle) * (particle.radius * (0.72 + particle.layer * 0.16) + wobble);
      const accentMix = particle.layer > 0.72;
      ctx.fillStyle = rgbToCss(accentMix ? params.accentColor : params.color, particle.alpha * (0.38 + glow * 0.18));
      ctx.shadowColor = rgbToCss(accentMix ? params.accentColor : params.color, 0.85);
      ctx.shadowBlur = 8 * glow;
      ctx.beginPath();
      ctx.arc(x, y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  private drawCore(ctx: CanvasRenderingContext2D, params: OrbVisualParams, coreRadius: number, glow: number) {
    const core = ctx.createRadialGradient(this.centerX, this.centerY, 0, this.centerX, this.centerY, coreRadius);
    core.addColorStop(0, "rgba(255,255,255,0.9)");
    core.addColorStop(0.25, rgbToCss(params.color, 0.72));
    core.addColorStop(0.72, rgbToCss(params.accentColor, 0.22));
    core.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = core;
    ctx.shadowColor = rgbToCss(params.color, 0.9);
    ctx.shadowBlur = 26 * glow;
    ctx.beginPath();
    ctx.arc(this.centerX, this.centerY, coreRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  private getPulse(timestamp: number, cycleMs: number) {
    const cycle = Math.max(120, cycleMs);
    return (Math.sin((timestamp / cycle) * Math.PI * 2) + 1) / 2;
  }
}
