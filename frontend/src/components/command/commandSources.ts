// frontend/src/components/command/commandSources.ts
import type { CommandPaletteItem } from "./CommandPalette";

export type CommandSourceContext = {
  pages: Array<{
    id: string;
    title: string;
    path: string;
    group: string;
    description: string;
    onSelect: () => void;
  }>;
};

export function buildCommandPaletteItems(context: CommandSourceContext): CommandPaletteItem[] {
  return [
    ...buildPageItems(context),
    ...buildToolItems(),
    ...buildQuickActionItems(),
    ...buildAkteItems(),
    ...buildReminderItems(),
    ...buildMailItems(),
    ...buildSettingsItems(),
    ...buildThemeItems(),
  ];
}

function buildPageItems(context: CommandSourceContext): CommandPaletteItem[] {
  return context.pages.map((page) => ({
    id: `page-${page.id}`,
    title: page.title,
    subtitle: page.description,
    group: "Pages",
    hint: page.path,
    keywords: [page.id, page.group, page.path],
    onSelect: page.onSelect,
  }));
}

function buildToolItems(): CommandPaletteItem[] {
  return [
    {
      id: "tool-diagcenter",
      title: "DiagCenter öffnen",
      subtitle: "Health, Ports, Logs und Reparaturhinweise prüfen",
      group: "Tools",
      hint: "tool",
      keywords: ["diagnose", "health", "logs", "repair", "ports"],
    },
    {
      id: "tool-quickcapture",
      title: "Quick Capture Inbox",
      subtitle: "Schnelle Notizen, Reminder und Aufgaben sichten",
      group: "Tools",
      hint: "tool",
      keywords: ["quick capture", "inbox", "notes", "tasks"],
    },
    {
      id: "tool-auditlog",
      title: "Automation Audit Log",
      subtitle: "Letzte Automationen und Risk Level prüfen",
      group: "Tools",
      hint: "tool",
      keywords: ["audit", "risk", "automation", "security"],
    },
  ];
}

function buildQuickActionItems(): CommandPaletteItem[] {
  return [
    {
      id: "action-reminder",
      title: "Neuer Reminder",
      subtitle: "Reminder im lokalen System vorbereiten",
      group: "Quick Actions",
      hint: "action",
      keywords: ["reminder", "erinnerung", "quick capture", "morgen"],
    },
    {
      id: "action-banf",
      title: "BANF vorbereiten",
      subtitle: "Beschaffungsidee als BANF Draft ablegen",
      group: "Quick Actions",
      hint: "action",
      keywords: ["banf", "material", "sap", "lieferant"],
    },
    {
      id: "action-mail",
      title: "Mail Entwurf",
      subtitle: "Mail Vorlage für Rückfrage oder Erinnerung",
      group: "Quick Actions",
      hint: "action",
      keywords: ["mail", "outlook", "draft", "antwort"],
    },
  ];
}

function buildAkteItems(): CommandPaletteItem[] {
  return [
    {
      id: "akte-personen",
      title: "Personen Akten durchsuchen",
      subtitle: "Personen, offene Punkte und letzte Interaktionen",
      group: "Akten",
      hint: "@",
      keywords: ["person", "akte", "kontakt", "offene punkte"],
    },
    {
      id: "akte-anlagen",
      title: "Anlagen Akten durchsuchen",
      subtitle: "Anlagen, Räume, Tickets, SAP Aufträge und Notizen",
      group: "Akten",
      hint: "@",
      keywords: ["anlage", "akte", "fsm", "sap", "raum"],
    },
  ];
}

function buildReminderItems(): CommandPaletteItem[] {
  return [
    {
      id: "reminder-upcoming",
      title: "Nächste Reminder anzeigen",
      subtitle: "Offene Erinnerungen und fällige Punkte",
      group: "Reminder",
      hint: "soon",
      keywords: ["reminder", "fällig", "deadline", "erinnerung"],
    },
  ];
}

function buildMailItems(): CommandPaletteItem[] {
  return [
    {
      id: "mail-important-unread",
      title: "Wichtige ungelesene Mails",
      subtitle: "Mail Triage Inbox und hohe Priorität",
      group: "Mails",
      hint: "mail",
      keywords: ["mail", "outlook", "ungelesen", "wichtig", "triage"],
    },
  ];
}

function buildSettingsItems(): CommandPaletteItem[] {
  return [
    {
      id: "setting-reduced-motion",
      title: "Reduced Motion prüfen",
      subtitle: "Animationsarme Darstellung respektieren",
      group: "Settings",
      hint: "a11y",
      keywords: ["motion", "accessibility", "bewegung", "barrierefreiheit"],
    },
    {
      id: "setting-performance-budget",
      title: "Performance Budget prüfen",
      subtitle: "Stack Preview gegen Budget laufen lassen",
      group: "Settings",
      hint: "perf",
      keywords: ["performance", "budget", "bundle", "lighthouse"],
    },
  ];
}

function buildThemeItems(): CommandPaletteItem[] {
  return [
    {
      id: "theme-scifi",
      title: "Theme Sci Fi",
      subtitle: "Bestehende JARVIS Optik",
      group: "Themes",
      hint: "theme",
      keywords: ["theme", "sci fi", "jarvis", "blue"],
    },
    {
      id: "theme-wireframe",
      title: "Theme Wireframe",
      subtitle: "Schematic Mode mit klaren Linien",
      group: "Themes",
      hint: "theme",
      keywords: ["theme", "wireframe", "schematic", "mono"],
    },
    {
      id: "theme-ultron",
      title: "Theme Ultron",
      subtitle: "Roter Hochkontrast Modus als späterer Ausbau",
      group: "Themes",
      hint: "theme",
      keywords: ["theme", "ultron", "red"],
    },
  ];
}
