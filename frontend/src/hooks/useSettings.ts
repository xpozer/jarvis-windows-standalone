import { useState, useEffect, useCallback } from "react";
import { JARVIS_SYSTEM_PROMPT } from "../config/systemPrompt";

const STORAGE_KEY = "jarvis_settings";

export interface JarvisSettings {
  model: string;
  apiUrl: string;
  systemPrompt: string;
  voiceName: string; // leer = automatisch (nur Browser-TTS)
  ttsEnabled: boolean;
  ttsRate: number;
  ttsPitch: number;
  piperUrl: string;   // leer = Piper aus, sonst z.B. "http://127.0.0.1:5002"
}

const DEFAULTS: JarvisSettings = {
  model: "qwen3:8b",
  apiUrl: "http://127.0.0.1:8000",
  systemPrompt: JARVIS_SYSTEM_PROMPT,
  voiceName: "",
  ttsEnabled: false,
  ttsRate: 1.05,
  ttsPitch: 0.95,
  piperUrl: "",
};

function load(): JarvisSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return DEFAULTS;
  }
}

function save(s: JarvisSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch { /* ignore */ }
}

export function useSettings() {
  const [settings, setSettings] = useState<JarvisSettings>(load);

  const update = useCallback(<K extends keyof JarvisSettings>(key: K, value: JarvisSettings[K]) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      save(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    save(DEFAULTS);
    setSettings(DEFAULTS);
  }, []);

  return { settings, update, reset };
}
