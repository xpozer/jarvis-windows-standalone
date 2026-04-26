// JARVIS Daily Briefing
// Morgens automatisch: KW, Datum, Outlook-Mails, naechste Termine
// Triggert einmal pro Session beim ersten Laden

import { useEffect, useRef } from "react";

interface BriefingConfig {
  apiUrl: string;
  enabled: boolean;
  onBriefing: (text: string) => void;
  onOrbState: (state: "idle" | "thinking") => void;
}

function getDateBlock(): string {
  const now = new Date();
  const days = ["Sonntag","Montag","Dienstag","Mittwoch","Donnerstag","Freitag","Samstag"];
  const months = ["Januar","Februar","Maerz","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember"];
  const day = days[now.getDay()];
  const kw = getKW(now);
  const q = Math.floor(now.getMonth() / 3) + 1;
  return `${day}, ${now.getDate()}. ${months[now.getMonth()]} ${now.getFullYear()} | KW ${kw} | Q${q}`;
}

function getKW(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 6)  return "Guten Morgen";
  if (h < 12) return "Guten Morgen";
  if (h < 17) return "Guten Tag";
  if (h < 21) return "Guten Abend";
  return "Gute Nacht";
}

async function fetchOutlookStatus(apiUrl: string): Promise<string> {
  try {
    const res = await fetch(`${apiUrl}/email/status`, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return "";
    const data = await res.json();
    if (data.status !== "online") return "Outlook: offline";
    // Kurzer Scan
    const scanRes = await fetch(`${apiUrl}/email/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ max_mails: 10, spam_threshold: 0.75, api_url: apiUrl }),
      signal: AbortSignal.timeout(15000),
    });
    if (!scanRes.ok) return "Outlook: Scan fehlgeschlagen";
    // SSE parsen
    const text = await scanRes.text();
    const lines = text.split("\n").filter(l => l.startsWith("data:"));
    for (const line of lines) {
      const raw = line.slice(5).trim();
      if (raw === "[DONE]") continue;
      try {
        const evt = JSON.parse(raw);
        if (evt.event === "result") {
          const spam = evt.spam?.length ?? 0;
          const total = evt.total_scanned ?? 0;
          const legit = evt.legitimate?.length ?? 0;
          if (total === 0) return "Inbox: leer";
          let result = `${total} Mails gescannt`;
          if (spam > 0) result += `, ${spam} Spam-Kandidaten`;
          if (legit > 0) result += `, ${legit} legitim`;
          return result;
        }
      } catch { /* skip */ }
    }
    return "";
  } catch {
    return "";
  }
}

export function useDailyBriefing({ apiUrl, enabled, onBriefing, onOrbState }: BriefingConfig) {
  const hasRun = useRef(false);

  useEffect(() => {
    if (!enabled || hasRun.current) return;
    hasRun.current = true;

    const KEY = "jarvis_last_briefing";
    const today = new Date().toDateString();
    const lastBriefing = localStorage.getItem(KEY);
    if (lastBriefing === today) return; // Schon heute gelaufen

    // Kurz warten bis die UI steht
    const timer = setTimeout(async () => {
      onOrbState("thinking");

      const greeting = getTimeGreeting();
      const dateBlock = getDateBlock();
      const parts: string[] = [
        `${greeting}, Julien.`,
        "",
        dateBlock,
      ];

      // Outlook Status
      const outlookInfo = await fetchOutlookStatus(apiUrl);
      if (outlookInfo) {
        parts.push("");
        parts.push(outlookInfo);
      }

      parts.push("");
      parts.push("Was steht heute an?");

      onBriefing(parts.join("\n"));
      onOrbState("idle");

      try { localStorage.setItem(KEY, today); } catch { /* ignore */ }
    }, 2500);

    return () => clearTimeout(timer);
  }, [enabled, apiUrl, onBriefing, onOrbState]);
}
