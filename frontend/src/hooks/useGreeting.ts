import { useEffect, useRef } from "react";
import { ChatMessage } from "../components/ChatLayer";

// Leverkusen Koordinaten
const LAT = 51.0459;
const LON = 6.9926;

// WMO Wettercodes → lesbare Beschreibung
function wetterCode(code: number): string {
  if (code === 0) return "klarer Himmel";
  if (code === 1) return "überwiegend klar";
  if (code === 2) return "teilweise bewölkt";
  if (code === 3) return "bedeckt";
  if ([45, 48].includes(code)) return "neblig";
  if ([51, 53, 55].includes(code)) return "Nieselregen";
  if ([61, 63, 65].includes(code)) return "Regen";
  if ([71, 73, 75].includes(code)) return "Schneefall";
  if ([80, 81, 82].includes(code)) return "Regenschauer";
  if ([95, 96, 99].includes(code)) return "Gewitter";
  return "wechselhaft";
}

function getKW(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getTageszeit(hour: number): "morgen" | "mittag" | "nachmittag" | "abend" | "nacht" {
  if (hour >= 5 && hour < 11) return "morgen";
  if (hour >= 11 && hour < 14) return "mittag";
  if (hour >= 14 && hour < 18) return "nachmittag";
  if (hour >= 18 && hour < 22) return "abend";
  return "nacht";
}

function getGreetingLine(tageszeit: ReturnType<typeof getTageszeit>, name = "Julien"): string {
  const greetings = {
    morgen: [
      `Guten Morgen, ${name}. Ein neuer Tag, neue Möglichkeiten.`,
      `Morgen, ${name}. Zeit loszulegen.`,
      `Guten Morgen, ${name}. Der Tag gehört dir.`,
    ],
    mittag: [
      `Mittagszeit, ${name}.`,
      `Hallo, ${name}. Der Tag läuft.`,
      `${name}. Kurze Pause gefällig?`,
    ],
    nachmittag: [
      `Guten Nachmittag, ${name}.`,
      `Nachmittag, ${name}. Was steht noch an?`,
      `${name}. Ruhig und fokussiert durch den Rest des Tages.`,
    ],
    abend: [
      `Guten Abend, ${name}. Wie war der Tag?`,
      `Abend, ${name}. Zeit zum Runterkommen.`,
      `Hey ${name}. Feierabend-Modus aktiviert.`,
    ],
    nacht: [
      `Noch wach, ${name}?`,
      `${name}. Spät dran heute.`,
      `Nacht, ${name}. Kurz checken und dann Ruhe.`,
    ],
  };
  const options = greetings[tageszeit];
  return options[Math.floor(Math.random() * options.length)];
}

function loadTodos(): string[] {
  try {
    const raw = localStorage.getItem("jarvis_todos");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((t: unknown) => typeof t === "string" && t.trim());
  } catch {
    return [];
  }
}

async function fetchWetter(): Promise<string> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,weathercode,windspeed_10m&timezone=Europe%2FBerlin`;
    const res = await fetch(url);
    if (!res.ok) return "";
    const data = await res.json();
    const temp = Math.round(data.current.temperature_2m);
    const code = data.current.weathercode;
    const wind = Math.round(data.current.windspeed_10m);
    return `${temp}°C, ${wetterCode(code)}, Wind ${wind} km/h`;
  } catch {
    return "";
  }
}

export function useGreeting(addMessage: (msg: ChatMessage) => void) {
  const hasFiredRef = useRef(false);

  useEffect(() => {
    if (hasFiredRef.current) return;
    hasFiredRef.current = true;

    async function buildGreeting() {
      const now = new Date();
      const hour = now.getHours();
      const tageszeit = getTageszeit(hour);

      const datumStr = now.toLocaleDateString("de-DE", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric",
      });
      const zeitStr = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
      const kw = getKW(now);

      const greeting = getGreetingLine(tageszeit);
      const wetter = await fetchWetter();
      const todos = loadTodos();

      const lines: string[] = [];
      lines.push(greeting);
      lines.push("");
      lines.push(`${datumStr} — ${zeitStr} Uhr — KW ${kw}`);

      if (wetter) {
        lines.push(`Leverkusen: ${wetter}`);
      }

      if (todos.length > 0) {
        lines.push("");
        lines.push(`Offene Aufgaben (${todos.length}):`);
        todos.slice(0, 5).forEach((t) => lines.push(`- ${t}`));
        if (todos.length > 5) lines.push(`… und ${todos.length - 5} weitere`);
      }

      addMessage({
        role: "assistant",
        content: lines.join("\n"),
        timestamp: Date.now(),
      });
    }

    buildGreeting();
  }, [addMessage]);
}
