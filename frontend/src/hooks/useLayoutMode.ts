import { useEffect, useState } from "react";

export type LayoutMode = "classic" | "iron-man";

const STORAGE_KEY = "jarvis.layoutMode";

function detectInitialMode(): LayoutMode {
  if (typeof window === "undefined") return "classic";
  const params = new URLSearchParams(window.location.search);
  if (params.has("iron")) {
    const v = params.get("iron");
    if (v === null || v === "1" || v === "true") return "iron-man";
    if (v === "0" || v === "false") return "classic";
  }
  if (params.has("classic")) {
    const v = params.get("classic");
    if (v === null || v === "1" || v === "true") return "classic";
  }
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "iron-man" || stored === "classic") return stored;
  } catch {
    // LocalStorage kann blockiert sein, dann silent fallback.
  }
  return "classic";
}

export function useLayoutMode(): {
  mode: LayoutMode;
  setMode: (mode: LayoutMode) => void;
  toggle: () => void;
} {
  const [mode, setModeState] = useState<LayoutMode>(detectInitialMode);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  }, [mode]);

  return {
    mode,
    setMode: setModeState,
    toggle: () => setModeState((prev) => (prev === "classic" ? "iron-man" : "classic")),
  };
}
