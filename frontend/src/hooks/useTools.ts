// Tool-System für JARVIS
// Erkennt Intents vor dem API-Call und führt sie aus

export interface ToolResult {
  tool: string;
  content: string; // wird als System-Context in den API-Call eingefügt
}

// ── Datum / Zeit / KW ─────────────────────────────────────────────────────────
function getKW(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function toolDateTime(): ToolResult {
  const now = new Date();
  const content = `Aktuelle Zeit: ${now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr\nAktuelles Datum: ${now.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}\nKalenderwoche: ${getKW(now)}\nJahr: ${now.getFullYear()}`;
  return { tool: "datetime", content };
}

// ── Wetter via Open-Meteo ─────────────────────────────────────────────────────
function wetterCode(code: number): string {
  if (code === 0) return "klarer Himmel";
  if (code <= 2) return "überwiegend klar";
  if (code === 3) return "bedeckt";
  if ([45, 48].includes(code)) return "neblig";
  if ([51, 53, 55].includes(code)) return "Nieselregen";
  if ([61, 63, 65].includes(code)) return "Regen";
  if ([71, 73, 75].includes(code)) return "Schnee";
  if ([80, 81, 82].includes(code)) return "Schauer";
  if (code >= 95) return "Gewitter";
  return "wechselhaft";
}

async function toolWetter(city: string): Promise<ToolResult> {
  try {
    // Geocoding
    const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=de`);
    const geoData = await geoRes.json();
    const loc = geoData?.results?.[0];
    if (!loc) return { tool: "weather", content: `Ort "${city}" nicht gefunden.` };

    const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,weathercode,windspeed_10m,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=Europe%2FBerlin&forecast_days=3`);
    const w = await weatherRes.json();

    const cur = w.current;
    const lines = [
      `Wetter in ${loc.name} (${new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })} Uhr):`,
      `Aktuell: ${Math.round(cur.temperature_2m)}°C, ${wetterCode(cur.weathercode)}, Wind ${Math.round(cur.windspeed_10m)} km/h, Luftfeuchtigkeit ${cur.relative_humidity_2m}%`,
    ];

    if (w.daily) {
      const days = w.daily;
      for (let i = 0; i < Math.min(3, days.time.length); i++) {
        const date = new Date(days.time[i]);
        const dayName = i === 0 ? "Heute" : i === 1 ? "Morgen" : date.toLocaleDateString("de-DE", { weekday: "long" });
        lines.push(`${dayName}: ${Math.round(days.temperature_2m_min[i])}–${Math.round(days.temperature_2m_max[i])}°C, ${wetterCode(days.weathercode[i])}`);
      }
    }

    return { tool: "weather", content: lines.join("\n") };
  } catch {
    return { tool: "weather", content: "Wetterdaten konnten nicht abgerufen werden." };
  }
}

// ── Websuche via DuckDuckGo Instant Answer API ────────────────────────────────
async function toolSearch(query: string): Promise<ToolResult> {
  try {
    const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
    const data = await res.json();

    const lines: string[] = [`Suchergebnisse für: "${query}"`];

    if (data.AbstractText) {
      lines.push(`\n${data.AbstractText}`);
      if (data.AbstractURL) lines.push(`Quelle: ${data.AbstractURL}`);
    }

    if (data.RelatedTopics?.length > 0) {
      const topics = data.RelatedTopics
        .filter((t: { Text?: string }) => t.Text)
        .slice(0, 4)
        .map((t: { Text: string }) => `- ${t.Text}`);
      if (topics.length > 0) lines.push(`\nVerwandte Themen:\n${topics.join("\n")}`);
    }

    if (data.Answer) lines.push(`\nDirekte Antwort: ${data.Answer}`);

    if (lines.length === 1) {
      lines.push("Keine direkten Ergebnisse gefunden. Bitte präziser formulieren oder eine Suchmaschine verwenden.");
    }

    return { tool: "search", content: lines.join("\n") };
  } catch {
    return { tool: "search", content: `Suche nach "${query}" fehlgeschlagen.` };
  }
}

// ── Intent-Erkennung ──────────────────────────────────────────────────────────
interface DetectedIntent {
  type: "datetime" | "weather" | "search" | null;
  param?: string;
}

export function detectIntent(text: string): DetectedIntent {
  const lower = text.toLowerCase().trim();

  // Datum / Zeit
  if (
    /\b(wie spät|uhrzeit|welche(r)? (tag|datum|wochentag)|was ist heute|welche kw|kalenderwoche|welche woche)\b/.test(lower)
  ) {
    return { type: "datetime" };
  }

  // Wetter
  const wetterMatch = lower.match(/\b(wetter|temperatur|wie warm|wie kalt|regnet|sonnig|wind)\b.*?(?:in|für|bei)?\s+([a-züöäß][a-züöäß\s\-]{2,20})?/);
  if (wetterMatch) {
    const city = wetterMatch[2]?.trim() || "Leverkusen";
    return { type: "weather", param: city };
  }
  if (/\b(wetter|temperatur|wie warm|wie kalt|regnet es|sonnig)\b/.test(lower)) {
    return { type: "weather", param: "Leverkusen" };
  }

  // Suche
  const searchMatch = lower.match(/^(such|suche|such mir|google|finde|was ist|wer ist|was sind|wann|wo ist)\s+(.+)/);
  if (searchMatch) {
    return { type: "search", param: searchMatch[2] };
  }

  return { type: null };
}

// ── Haupt-Export ──────────────────────────────────────────────────────────────
export async function executeTool(intent: DetectedIntent): Promise<ToolResult | null> {
  if (!intent.type) return null;
  if (intent.type === "datetime") return toolDateTime();
  if (intent.type === "weather") return await toolWetter(intent.param ?? "Leverkusen");
  if (intent.type === "search") return await toolSearch(intent.param ?? "");
  return null;
}
