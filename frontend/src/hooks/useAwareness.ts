// JARVIS Awareness Hook
// Pollt den Desktop-Kontext und stellt ihn der UI zur Verfuegung

import { useState, useEffect, useRef } from "react";

export interface DesktopContext {
  app: string;
  category: string;
  windowTitle: string;
  hints: string[];
  timestamp: string;
  error?: string;
}

export function useAwareness(apiUrl: string, enabled: boolean = true) {
  const [context, setContext] = useState<DesktopContext | null>(null);
  const [online, setOnline] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!enabled) {
      setOnline(false);
      return;
    }

    const poll = async () => {
      try {
        const res = await fetch(`${apiUrl}/awareness/current`, {
          signal: AbortSignal.timeout(3000),
        });
        if (!res.ok) { setOnline(false); return; }
        const data = await res.json();
        if (data.error) { setOnline(false); return; }
        setContext(data);
        setOnline(true);
      } catch {
        setOnline(false);
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 7000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [apiUrl, enabled]);

  return { context, online };
}
