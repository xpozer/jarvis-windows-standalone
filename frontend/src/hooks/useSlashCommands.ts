export interface SlashCommand {
  trigger: string;
  label: string;
  description: string;
  action: "navigate" | "message" | "skill";
  target?: string;
  template?: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  {
    trigger: "/termin",
    label: "/termin",
    description: "Zur Terminplanung wechseln",
    action: "navigate",
    target: "Termine",
  },
  {
    trigger: "/calc",
    label: "/calc",
    description: "Zum Elektro-Rechner wechseln",
    action: "navigate",
    target: "Rechner",
  },
  {
    trigger: "/sap",
    label: "/sap",
    description: "SAP Werkzeuge oeffnen",
    action: "navigate",
    target: "SAP Werkzeuge",
  },
  {
    trigger: "/leitung",
    label: "/leitung",
    description: "Leitungsberechnung starten",
    action: "navigate",
    target: "Rechner",
  },
  {
    trigger: "/email",
    label: "/email",
    description: "Email-Agent oeffnen",
    action: "navigate",
    target: "Email",
  },
  {
    trigger: "/clear",
    label: "/clear",
    description: "Gespraechsverlauf loeschen",
    action: "message",
    template: "__CLEAR__",
  },
  {
    trigger: "/hilfe",
    label: "/hilfe",
    description: "Verfuegbare Befehle anzeigen",
    action: "message",
    template: "__HELP__",
  },
  // ── Skill-Commands ──────────────────────────────────────
  {
    trigger: "/skill list",
    label: "/skill list",
    description: "Alle Skills auflisten",
    action: "skill",
    template: "__SKILL_LIST__",
  },
  {
    trigger: "/skill create",
    label: "/skill create [Name]",
    description: "Neuen Skill erstellen",
    action: "skill",
    template: "__SKILL_CREATE__",
  },
  {
    trigger: "/skill delete",
    label: "/skill delete [Name]",
    description: "Skill loeschen",
    action: "skill",
    template: "__SKILL_DELETE__",
  },
  {
    trigger: "/skill save",
    label: "/skill save",
    description: "Skill aus aktuellem Gespraech erstellen",
    action: "skill",
    template: "__SKILL_SAVE__",
  },
  {
    trigger: "/skill reload",
    label: "/skill reload",
    description: "Skills neu laden",
    action: "skill",
    template: "__SKILL_RELOAD__",
  },
];

export function getMatchingCommands(input: string): SlashCommand[] {
  if (!input.startsWith("/")) return [];
  const lower = input.toLowerCase();
  return SLASH_COMMANDS.filter((cmd) =>
    cmd.trigger.startsWith(lower)
  );
}

export function getHelpText(): string {
  return (
    "Verfuegbare Befehle:\n\n" +
    SLASH_COMMANDS.map((cmd) => `${cmd.trigger} \u2014 ${cmd.description}`).join("\n")
  );
}

// ── Skill-Command Handler ────────────────────────────────────────
export async function handleSkillCommand(
  command: string,
  apiUrl: string,
  chatHistory: Array<{role: string; content: string}>,
): Promise<string> {
  const parts = command.trim().split(/\s+/);
  const action = parts[1]?.toLowerCase();
  const rest = parts.slice(2).join(" ");

  try {
    switch (action) {
      case "list": {
        const res = await fetch(`${apiUrl}/skills/list`);
        const data = await res.json();
        const skills = data.skills || [];
        if (skills.length === 0) return "Keine Skills installiert.";
        return "Installierte Skills:\n\n" + skills.map((s: any) =>
          `\u25B8 ${s.name} (${s.agent})\n  ${s.description}${s.trigger ? `\n  Trigger: ${s.trigger}` : ""}`
        ).join("\n\n");
      }

      case "create": {
        if (!rest) return "Benutzung: /skill create [Name]\nBeispiel: /skill create Motorschutz berechnen";
        // Erstellt einen leeren Skill den der Nutzer dann befuellt
        const res = await fetch(`${apiUrl}/skills/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: rest,
            description: `Skill: ${rest}`,
            agent: "all",
            trigger: rest.toLowerCase().replace(/\s+/g, "|"),
            instructions: `# ${rest}\n\nAnweisungen hier ergaenzen.`,
          }),
        });
        const data = await res.json();
        if (data.ok) return `Skill "${rest}" erstellt.\nPfad: ${data.path}\n\nBearbeite die SKILL.md um Anweisungen hinzuzufuegen.`;
        return `Fehler: ${data.error || "Unbekannt"}`;
      }

      case "delete": {
        if (!rest) return "Benutzung: /skill delete [Name]";
        const res = await fetch(`${apiUrl}/skills/${encodeURIComponent(rest)}`, { method: "DELETE" });
        const data = await res.json();
        if (data.ok) return `Skill "${rest}" geloescht.`;
        return `Fehler: ${data.error || "Skill nicht gefunden"}`;
      }

      case "save": {
        // Auto-Learn: JARVIS analysiert den Chat und erstellt einen Skill
        if (chatHistory.length < 2) return "Zu wenig Gespraechsverlauf fuer einen Skill.";
        // Die letzten 6 Nachrichten nehmen
        const relevant = chatHistory.slice(-6).map(m => `${m.role}: ${m.content}`).join("\n");
        const res = await fetch(`${apiUrl}/orchestrate/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_input: `Analysiere diesen Gespraechsverlauf und erstelle einen JARVIS-Skill daraus. Extrahiere das Kernwissen als wiederverwendbare Anweisung. Antworte NUR mit diesem JSON-Format (kein anderer Text):
{"name":"...","description":"...","agent":"all","trigger":"keyword1|keyword2","instructions":"# Titel\\n\\nAnweisungen..."}

Gespraech:
${relevant}`,
            api_url: apiUrl,
          }),
        });

        if (!res.ok) return "Skill-Extraktion fehlgeschlagen.";

        // SSE parsen
        const text = await res.text();
        let fullContent = "";
        for (const line of text.split("\n")) {
          if (!line.startsWith("data:")) continue;
          const raw = line.slice(5).trim();
          if (raw === "[DONE]") break;
          try {
            const evt = JSON.parse(raw);
            if (evt.event === "delta" && evt.content) fullContent += evt.content;
          } catch {}
        }

        // JSON aus Antwort extrahieren
        let skillData: any;
        try {
          const jsonMatch = fullContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) skillData = JSON.parse(jsonMatch[0]);
        } catch {}

        if (!skillData?.name) return "Konnte keinen Skill aus dem Gespraech extrahieren.\n\nRohdaten: " + fullContent.slice(0, 200);

        // Skill erstellen
        const createRes = await fetch(`${apiUrl}/skills/create`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(skillData),
        });
        const createData = await createRes.json();
        if (createData.ok) return `Skill "${skillData.name}" aus Gespraech erstellt!\n\nBeschreibung: ${skillData.description}\nTrigger: ${skillData.trigger}`;
        return `Skill-Erstellung fehlgeschlagen: ${createData.error || "Unbekannt"}`;
      }

      case "reload": {
        const res = await fetch(`${apiUrl}/skills/reload`, { method: "POST" });
        const data = await res.json();
        if (data.ok) return `Skills neu geladen. ${data.count} Skills verfuegbar.`;
        return "Reload fehlgeschlagen.";
      }

      default:
        return "Skill-Befehle:\n/skill list  \u2014 Alle Skills anzeigen\n/skill create [Name] \u2014 Neuen Skill erstellen\n/skill delete [Name] \u2014 Skill loeschen\n/skill save \u2014 Skill aus Gespraech lernen\n/skill reload \u2014 Skills neu laden";
    }
  } catch (e) {
    return `Skill-Befehl fehlgeschlagen: ${e instanceof Error ? e.message : "Verbindungsfehler"}`;
  }
}
