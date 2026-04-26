import { useEffect, useRef, useCallback, useState } from "react";

// Wake Word Erkennung via Web Speech API continuous mode
// Lauscht dauerhaft im Hintergrund auf "Hey JARVIS"
// Wenn erkannt → onWakeWord() Callback

export type WakeWordStatus = "inactive" | "listening" | "detected" | "unsupported";

interface WakeWordRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface WakeWordRecognitionErrorEvent extends Event {
  error: string;
}

interface WakeWordRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: WakeWordRecognitionEvent) => void) | null;
  onerror: ((event: WakeWordRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
}

type WakeWordRecognitionConstructor = new () => WakeWordRecognition;

type WakeWordWindow = Window & {
  SpeechRecognition?: WakeWordRecognitionConstructor;
  webkitSpeechRecognition?: WakeWordRecognitionConstructor;
};

interface UseWakeWordOptions {
  onWakeWord: () => void;
  enabled?: boolean;
  wakePhrase?: string;
}

export function useWakeWord({
  onWakeWord,
  enabled = true,
  wakePhrase = "hey jarvis",
}: UseWakeWordOptions) {
  const [status, setStatus] = useState<WakeWordStatus>("inactive");
  const recognitionRef = useRef<WakeWordRecognition | null>(null);
  const enabledRef = useRef(enabled);
  const cooldownRef = useRef(false);
  const restartTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { enabledRef.current = enabled; }, [enabled]);

  const stop = useCallback(() => {
    if (restartTimerRef.current) clearTimeout(restartTimerRef.current);
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    setStatus("inactive");
  }, []);

  const start = useCallback(() => {
    const browserWindow = window as WakeWordWindow;
    const SR = browserWindow.SpeechRecognition ?? browserWindow.webkitSpeechRecognition;
    if (!SR) { setStatus("unsupported"); return; }

    const rec = new SR();
    rec.lang = "de-DE";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 3;

    rec.onstart = () => setStatus("listening");

    rec.onresult = (e: WakeWordRecognitionEvent) => {
      if (cooldownRef.current) return;

      for (let i = e.resultIndex; i < e.results.length; i++) {
        for (let j = 0; j < e.results[i].length; j++) {
          const transcript = e.results[i][j].transcript.toLowerCase().trim();
          const normalizedWakePhrase = wakePhrase.toLowerCase().trim();

          if (
            transcript.includes(normalizedWakePhrase) ||
            transcript.includes("hey jarvis") ||
            transcript.includes("hey jarvi") ||
            transcript.includes("hey jarbus") ||
            transcript.includes("he jarvis") ||
            transcript.includes("hey chavis") ||
            (transcript.includes("jarvis") && transcript.startsWith("hey"))
          ) {
            cooldownRef.current = true;
            setStatus("detected");

            setTimeout(() => {
              onWakeWord();
              setTimeout(() => {
                cooldownRef.current = false;
                if (enabledRef.current) setStatus("listening");
              }, 3000);
            }, 200);

            return;
          }
        }
      }
    };

    rec.onerror = (e: WakeWordRecognitionErrorEvent) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setStatus("unsupported");
        return;
      }
      if (enabledRef.current && e.error !== "aborted") {
        restartTimerRef.current = setTimeout(() => {
          if (enabledRef.current) start();
        }, 1500);
      }
    };

    rec.onend = () => {
      if (enabledRef.current && !cooldownRef.current) {
        restartTimerRef.current = setTimeout(() => {
          if (enabledRef.current) start();
        }, 500);
      }
    };

    recognitionRef.current = rec;
    try { rec.start(); } catch { /* already running */ }
  }, [onWakeWord, wakePhrase]);

  useEffect(() => {
    if (enabled) {
      start();
    } else {
      stop();
    }
    return stop;
  }, [enabled, start, stop]);

  return { status, stop, restart: start };
}
