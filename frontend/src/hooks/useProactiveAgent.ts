// JARVIS Proaktiver Agent
// Analysiert Awareness-Daten und macht Vorschlaege wenn sinnvoll
// Regelbasiert, kein LLM-Call noetig fuer einfache Trigger

import { useEffect, useRef, useCallback } from "react";
import { DesktopContext } from "./useAwareness";

interface ProactiveConfig {
  awareness: DesktopContext | null;
  awarenessOnline: boolean;
  enabled: boolean;
  onSuggestion: (text: string) => void;
}

interface ProactiveRule {
  id: string;
  check: (ctx: DesktopContext, session: SessionState) => string | null;
  cooldownMinutes: number;
}

interface SessionState {
  currentApp: string;
  appStartTime: number;
  minutesInApp: number;
  lastCategory: string;
  categoryChanges: number;
}

const RULES: ProactiveRule[] = [
  {
    id: "sap_long_session",
    cooldownMinutes: 30,
    check: (ctx, session) => {
      if (ctx.category === "sap" && session.minutesInApp > 15) {
        return "Du bist seit " + Math.round(session.minutesInApp) + " Minuten im SAP. Brauchst du Hilfe mit einem Auftragstext oder einer Meldung?";
      }
      return null;
    },
  },
  {
    id: "pdf_vde_open",
    cooldownMinutes: 60,
    check: (ctx) => {
      if (ctx.category === "pdf" && ctx.hints?.includes("norm_reference")) {
        return "Du hast ein Dokument mit Norm-Referenz offen. Soll ich die relevanten VDE-Prueffristen oder Anwendungsbereiche zusammenfassen?";
      }
      return null;
    },
  },
  {
    id: "sap_transaction",
    cooldownMinutes: 20,
    check: (ctx) => {
      if (ctx.hints?.includes("sap_transaction")) {
        const match = ctx.windowTitle?.match(/IW\d{2}|VA\d{2}|ME\d{2}|MM\d{2}|CO\d{2}/);
        if (match) {
          return `SAP-Transaktion ${match[0]} erkannt. Brauchst du Hilfe damit?`;
        }
      }
      return null;
    },
  },
  {
    id: "email_long_session",
    cooldownMinutes: 45,
    check: (ctx, session) => {
      if (ctx.category === "email" && session.minutesInApp > 10) {
        return "Du bist schon eine Weile in Outlook. Soll ich die Inbox auf Spam scannen?";
      }
      return null;
    },
  },
  {
    id: "inspection_doc",
    cooldownMinutes: 60,
    check: (ctx) => {
      if (ctx.hints?.includes("inspection")) {
        return "Pruefbezogenes Dokument erkannt. Soll ich Prueffristen nach DGUV V3 nachschlagen oder einen Pruefbericht-Entwurf erstellen?";
      }
      return null;
    },
  },
  {
    id: "idle_reminder",
    cooldownMinutes: 120,
    check: (ctx, session) => {
      if (ctx.category === "other" && session.minutesInApp > 5 && session.categoryChanges > 3) {
        return "Du wechselst haeufig zwischen Apps. Brauchst du Hilfe bei einer bestimmten Aufgabe?";
      }
      return null;
    },
  },
];

export function useProactiveAgent({ awareness, awarenessOnline, enabled, onSuggestion }: ProactiveConfig) {
  const sessionRef = useRef<SessionState>({
    currentApp: "", appStartTime: Date.now(),
    minutesInApp: 0, lastCategory: "", categoryChanges: 0,
  });
  const cooldowns = useRef<Record<string, number>>({});
  const lastCheck = useRef(0);

  const checkRules = useCallback(() => {
    if (!awareness || !awarenessOnline || !enabled) return;
    const now = Date.now();

    // Max alle 15 Sekunden pruefen
    if (now - lastCheck.current < 15000) return;
    lastCheck.current = now;

    const session = sessionRef.current;

    // Session-State updaten
    if (awareness.app !== session.currentApp) {
      session.currentApp = awareness.app;
      session.appStartTime = now;
      session.categoryChanges++;
    }
    session.minutesInApp = (now - session.appStartTime) / 60000;
    if (awareness.category !== session.lastCategory) {
      session.lastCategory = awareness.category;
    }

    // Regeln durchgehen
    for (const rule of RULES) {
      const lastFired = cooldowns.current[rule.id] || 0;
      if (now - lastFired < rule.cooldownMinutes * 60000) continue;

      const suggestion = rule.check(awareness, session);
      if (suggestion) {
        cooldowns.current[rule.id] = now;
        onSuggestion(suggestion);
        return; // Nur eine Suggestion pro Check
      }
    }
  }, [awareness, awarenessOnline, enabled, onSuggestion]);

  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(checkRules, 15000);
    return () => clearInterval(interval);
  }, [checkRules, enabled]);
}
