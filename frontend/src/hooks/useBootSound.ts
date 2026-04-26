import { useEffect, useRef } from "react";

// JARVIS Boot-Sound — vollständig synthetisch via Web Audio API
// Ablauf: kurzer Sweep-Aufbau → präziser Ton → elektronisches Ausklingen
export function useBootSound() {
  const hasFiredRef = useRef(false);

  useEffect(() => {
    if (hasFiredRef.current) return;
    hasFiredRef.current = true;

    // Kleines Delay damit der Browser bereit ist
    const timer = setTimeout(() => {
      playBootSound();
    }, 400);

    return () => clearTimeout(timer);
  }, []);
}

function playBootSound() {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    const master = ctx.createGain();
    master.gain.setValueAtTime(0, ctx.currentTime);
    master.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.05);
    master.gain.setValueAtTime(0.18, ctx.currentTime + 1.1);
    master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.6);
    master.connect(ctx.destination);

    // ── Phase 1: Schneller Frequenz-Sweep (0.0 – 0.25s) ──────────────────
    // Klingt wie ein System das hochfährt
    const sweep = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    sweep.type = "sawtooth";
    sweep.frequency.setValueAtTime(80, ctx.currentTime);
    sweep.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.22);
    sweepGain.gain.setValueAtTime(0.4, ctx.currentTime);
    sweepGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
    sweep.connect(sweepGain);
    sweepGain.connect(master);
    sweep.start(ctx.currentTime);
    sweep.stop(ctx.currentTime + 0.25);

    // ── Phase 2: Präziser Hauptton (0.20 – 0.70s) ────────────────────────
    // Sauberer Sinus — der "System bereit" Ton
    const main = ctx.createOscillator();
    const mainGain = ctx.createGain();
    main.type = "sine";
    main.frequency.setValueAtTime(880, ctx.currentTime + 0.20);
    main.frequency.linearRampToValueAtTime(1047, ctx.currentTime + 0.35);
    mainGain.gain.setValueAtTime(0, ctx.currentTime + 0.20);
    mainGain.gain.linearRampToValueAtTime(0.6, ctx.currentTime + 0.28);
    mainGain.gain.setValueAtTime(0.6, ctx.currentTime + 0.55);
    mainGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.75);
    main.connect(mainGain);
    mainGain.connect(master);
    main.start(ctx.currentTime + 0.20);
    main.stop(ctx.currentTime + 0.75);

    // ── Phase 3: Elektronischer Oberton (0.30 – 0.65s) ───────────────────
    // Subtiler Square-Wave gibt dem Ton den Sci-Fi Charakter
    const upper = ctx.createOscillator();
    const upperGain = ctx.createGain();
    upper.type = "square";
    upper.frequency.setValueAtTime(2093, ctx.currentTime + 0.30);
    upperGain.gain.setValueAtTime(0, ctx.currentTime + 0.30);
    upperGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.40);
    upperGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.65);
    upper.connect(upperGain);
    upperGain.connect(master);
    upper.start(ctx.currentTime + 0.30);
    upper.stop(ctx.currentTime + 0.65);

    // ── Phase 4: Ausklingen-Ping (0.65 – 1.4s) ───────────────────────────
    // Kurzer hoher Ton der sauber ausklingt — "online"
    const ping = ctx.createOscillator();
    const pingGain = ctx.createGain();
    ping.type = "sine";
    ping.frequency.setValueAtTime(1760, ctx.currentTime + 0.65);
    ping.frequency.linearRampToValueAtTime(1320, ctx.currentTime + 1.1);
    pingGain.gain.setValueAtTime(0, ctx.currentTime + 0.65);
    pingGain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.70);
    pingGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);
    ping.connect(pingGain);
    pingGain.connect(master);
    ping.start(ctx.currentTime + 0.65);
    ping.stop(ctx.currentTime + 1.4);

    // ── Subfrequenz: leichter Tiefton-Rumble (0.0 – 0.5s) ────────────────
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = "sine";
    sub.frequency.setValueAtTime(55, ctx.currentTime);
    sub.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.5);
    subGain.gain.setValueAtTime(0.3, ctx.currentTime);
    subGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
    sub.connect(subGain);
    subGain.connect(master);
    sub.start(ctx.currentTime);
    sub.stop(ctx.currentTime + 0.5);

    // Context nach Ablauf schließen
    setTimeout(() => ctx.close(), 2000);
  } catch {
    // Web Audio nicht verfügbar — still ignorieren
  }
}
