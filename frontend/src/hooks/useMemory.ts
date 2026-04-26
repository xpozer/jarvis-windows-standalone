import { useState, useCallback, useRef } from "react";

const STORAGE_KEY = "jarvis_memory";
const MAX_FACTS = 80;

export interface MemoryFact {
  id: number;
  text: string;
  source: "auto" | "explicit";
  created: number;
}

function load(): MemoryFact[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch { return []; }
}

function save(facts: MemoryFact[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(facts.slice(-MAX_FACTS)));
  } catch { /* ignore */ }
}

export function useMemory(apiUrl: string, model: string) {
  const [facts, setFacts] = useState<MemoryFact[]>(load);
  const extractingRef = useRef(false);

  const addFact = useCallback((text: string, source: "auto" | "explicit" = "explicit") => {
    setFacts((prev) => {
      // Duplikat-Check (grob)
      if (prev.some((f) => f.text.toLowerCase() === text.toLowerCase())) return prev;
      const next = [...prev, { id: Date.now(), text: text.trim(), source, created: Date.now() }];
      save(next);
      return next;
    });
  }, []);

  const removeFact = useCallback((id: number) => {
    setFacts((prev) => {
      const next = prev.filter((f) => f.id !== id);
      save(next);
      return next;
    });
  }, []);

  const clearFacts = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setFacts([]);
  }, []);

  // Baut den Memory-Block für den System-Prompt
  function getMemoryBlock(): string {
    if (facts.length === 0) return "";
    return `\n\nWas du über Julien weißt (Langzeitgedächtnis):\n${facts.map((f) => `- ${f.text}`).join("\n")}`;
  }

  // Explizite Befehle: "Merk dir ...", "Vergiss ..."
  function parseExplicitCommand(text: string): { action: "add" | "clear" | null; fact?: string } {
    const lower = text.toLowerCase().trim();
    if (lower.startsWith("merk dir") || lower.startsWith("merke dir") || lower.startsWith("speicher")) {
      const fact = text.replace(/^(merk dir|merke dir|speicher(e)?)\s+/i, "").trim();
      return { action: "add", fact };
    }
    if (lower.includes("vergiss alles") || lower.includes("lösch das gedächtnis")) {
      return { action: "clear" };
    }
    return { action: null };
  }

  // Nach Antwort: zweiter API-Call extrahiert Fakten automatisch
  async function autoExtract(userText: string, assistantText: string) {
    if (extractingRef.current) return;
    extractingRef.current = true;

    try {
      const prompt = `Analysiere diesen Dialog und extrahiere NUR neue, dauerhaft relevante Fakten über den Nutzer (Name, Beruf, Präferenzen, wichtige Zahlen, persönliche Daten). Keine temporären Infos, keine allgemeinen Aussagen.

Nutzer: "${userText}"
Assistent: "${assistantText}"

Antworte NUR mit einer JSON-Liste von Strings, max. 3 Fakten. Wenn keine relevanten Fakten: leeres Array [].
Beispiel: ["Arbeitet bei Bayer in Leverkusen", "Hat Tochter namens Lisa"]
Keine anderen Zeichen, kein Markdown.`;

      const res = await fetch(`${apiUrl}/v1/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          stream: false,
          max_tokens: 200,
        }),
      });

      if (!res.ok) return;
      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content ?? "[]";

      // JSON parsen — robust gegen Markdown-Wrapping
      const cleaned = content.replace(/```json|```/g, "").trim();
      const extracted: string[] = JSON.parse(cleaned);
      if (Array.isArray(extracted)) {
        extracted.forEach((f) => { if (typeof f === "string" && f.trim()) addFact(f, "auto"); });
      }
    } catch { /* Extraktion schlägt still fehl */ }
    finally { extractingRef.current = false; }
  }

  return { facts, addFact, removeFact, clearFacts, getMemoryBlock, parseExplicitCommand, autoExtract };
}
