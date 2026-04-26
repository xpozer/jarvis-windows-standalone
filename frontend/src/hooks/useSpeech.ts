import { useCallback, useEffect, useRef, useState } from "react";
import { JarvisSettings } from "./useSettings";

export type SpeechStatus = "idle" | "speaking" | "unavailable";

interface UseSpeechOptions {
  onStart?: () => void;
  onEnd?: () => void;
  settings?: Pick<JarvisSettings, "ttsEnabled" | "voiceName" | "ttsRate" | "ttsPitch" | "piperUrl">;
}

function stripMarkdown(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, "Code-Block.")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/^#{1,3}\s+/gm, "")
    .replace(/^[-*]\s+/gm, "")
    .replace(/^\d+\.\s+/gm, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .trim();
}

export function useSpeech({ onStart, onEnd, settings }: UseSpeechOptions = {}) {
  const [status, setStatus] = useState<SpeechStatus>("idle");
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Browser-Voice waehlen (nur fuer Fallback)
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setStatus("unavailable");
      return;
    }

    function pickVoice() {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;

      if (settings?.voiceName) {
        const explicit = voices.find((v) => v.name === settings.voiceName);
        if (explicit) { voiceRef.current = explicit; return; }
      }

      const deDE = voices.find((v) => v.lang === "de-DE");
      const deAny = voices.find((v) => v.lang.startsWith("de"));
      voiceRef.current = deDE ?? deAny ?? voices[0];
    }

    pickVoice();
    window.speechSynthesis.addEventListener("voiceschanged", pickVoice);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", pickVoice);
  }, [settings?.voiceName]);

  // Browser-TTS als Fallback
  const speakBrowser = useCallback((cleaned: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(cleaned);
    utterance.lang = "de-DE";
    utterance.rate = settings?.ttsRate ?? 1.05;
    utterance.pitch = settings?.ttsPitch ?? 0.95;
    utterance.volume = 1.0;
    if (voiceRef.current) utterance.voice = voiceRef.current;

    utterance.onstart = () => { setStatus("speaking"); onStart?.(); };
    utterance.onend   = () => { setStatus("idle");     onEnd?.(); };
    utterance.onerror = () => { setStatus("idle");     onEnd?.(); };

    window.speechSynthesis.speak(utterance);
  }, [settings?.ttsRate, settings?.ttsPitch, onStart, onEnd]);

  // Piper-TTS Primaerweg
  const speakPiper = useCallback(async (cleaned: string, piperUrl: string): Promise<boolean> => {
    // Bestehenden Request abbrechen falls laufend
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Piper-HTTP-Server erwartet text als JSON-Body oder als Query-Parameter
      // Wir nutzen POST mit JSON (robuster bei langen Texten)
      const res = await fetch(piperUrl.replace(/\/$/, "") + "/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: cleaned }),
        signal: controller.signal,
      });

      if (!res.ok) {
        console.warn("Piper-Server antwortet mit", res.status);
        return false;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      // Altes Audio stoppen falls da
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay  = () => { setStatus("speaking"); onStart?.(); };
      audio.onended = () => {
        setStatus("idle");
        URL.revokeObjectURL(url);
        onEnd?.();
      };
      audio.onerror = () => {
        setStatus("idle");
        URL.revokeObjectURL(url);
        onEnd?.();
      };

      await audio.play();
      return true;
    } catch (e) {
      if ((e as Error).name === "AbortError") return true; // Abbruch ist kein Fehler
      console.warn("Piper-Anfrage fehlgeschlagen:", e);
      return false;
    }
  }, [onStart, onEnd]);

  const speak = useCallback(async (text: string) => {
    if (settings?.ttsEnabled === false) return;

    const cleaned = stripMarkdown(text);
    if (!cleaned) return;

    const piperUrl = settings?.piperUrl?.trim();

    // Primaer: Piper probieren falls URL gesetzt
    if (piperUrl) {
      const ok = await speakPiper(cleaned, piperUrl);
      if (ok) return;
      console.info("Piper nicht erreichbar, nutze Browser-TTS");
    }

    // Fallback: Browser-TTS
    speakBrowser(cleaned);
  }, [settings?.ttsEnabled, settings?.piperUrl, speakPiper, speakBrowser]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    window.speechSynthesis?.cancel();
    setStatus("idle");
    onEnd?.();
  }, [onEnd]);

  return { speak, stop, status };
}
