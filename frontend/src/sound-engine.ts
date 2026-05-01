export type SoundEvent =
  | "agent_route"
  | "memory_hit"
  | "memory_scan"
  | "provider_contact"
  | "speech_start"
  | "done"
  | "error_pulse"
  | "listening"
  | "ui_toggle";

type OscillatorKind = OscillatorType;
type AudioContextConstructor = new () => AudioContext;

class JarvisSoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private enabled = false;
  private volume = 0.22;
  private mode = "idle";
  private unlocked = false;
  private thinkingOsc: OscillatorNode | null = null;
  private thinkingGain: GainNode | null = null;

  configure(enabled: boolean, volume: number) {
    this.enabled = enabled;
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.master) this.master.gain.value = this.volume;
    if (!enabled) {
      this.unlocked = false;
      this.stopThinking();
    }
  }

  async unlock() {
    if (!this.enabled) return false;
    if (!this.ctx) this.createContext();
    try {
      if (this.ctx?.state === "suspended") await this.ctx.resume();
      this.unlocked = this.ctx?.state === "running";
      return this.unlocked;
    } catch {
      this.unlocked = false;
      return false;
    }
  }

  isUnlocked() {
    return this.unlocked && this.ctx?.state === "running";
  }

  setMode(mode: string) {
    if (mode === this.mode) return;
    this.mode = mode;
    if (!this.enabled || !this.isUnlocked()) return;
    if (mode === "thinking") this.startThinking();
    else this.stopThinking();
    if (mode === "listening") this.play("listening");
  }

  play(event: SoundEvent | string) {
    if (!this.enabled || !this.isUnlocked()) return;
    switch (event) {
      case "agent_route":
        this.beep(620, 0.045, 0.08, "square");
        this.beep(930, 0.08, 0.05, "sine", 0.04);
        break;
      case "memory_hit":
        this.beep(1180, 0.08, 0.07, "triangle");
        this.beep(1640, 0.08, 0.05, "sine", 0.06);
        break;
      case "memory_scan":
        this.beep(520, 0.035, 0.045, "sine");
        break;
      case "provider_contact":
        this.sweep(360, 760, 0.16, 0.055);
        break;
      case "speech_start":
        this.sweep(440, 980, 0.22, 0.075);
        break;
      case "done":
        this.beep(740, 0.07, 0.055, "sine");
        this.beep(1110, 0.08, 0.045, "sine", 0.075);
        break;
      case "error_pulse":
        this.beep(160, 0.14, 0.12, "sawtooth");
        this.beep(95, 0.18, 0.09, "square", 0.08);
        break;
      case "listening":
        this.beep(880, 0.05, 0.045, "triangle");
        break;
      case "ui_toggle":
        this.beep(680, 0.05, 0.055, "sine");
        break;
      default:
        this.beep(540, 0.04, 0.04, "sine");
        break;
    }
  }

  private createContext() {
    const win = window as Window & { webkitAudioContext?: AudioContextConstructor };
    const AudioCtor = window.AudioContext || win.webkitAudioContext;
    if (!AudioCtor) return;
    this.ctx = new AudioCtor();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(this.ctx.destination);
  }

  private beep(frequency: number, duration: number, gainValue: number, type: OscillatorKind = "sine", delay = 0) {
    if (!this.ctx || !this.master || !this.isUnlocked()) return;
    const start = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  private sweep(from: number, to: number, duration: number, gainValue: number) {
    if (!this.ctx || !this.master || !this.isUnlocked()) return;
    const start = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(from, start);
    osc.frequency.exponentialRampToValueAtTime(to, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  private startThinking() {
    if (!this.ctx || !this.master || !this.isUnlocked() || this.thinkingOsc) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 74;
    gain.gain.value = 0.0001;
    osc.connect(gain);
    gain.connect(this.master);
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.025, this.ctx.currentTime + 0.25);
    this.thinkingOsc = osc;
    this.thinkingGain = gain;
  }

  private stopThinking() {
    if (!this.ctx || !this.thinkingOsc || !this.thinkingGain) return;
    const osc = this.thinkingOsc;
    const gain = this.thinkingGain;
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.18);
    osc.stop(this.ctx.currentTime + 0.22);
    this.thinkingOsc = null;
    this.thinkingGain = null;
  }
}

export const jarvisSound = new JarvisSoundEngine();
