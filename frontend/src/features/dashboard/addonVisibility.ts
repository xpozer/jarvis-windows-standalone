// frontend/src/features/dashboard/addonVisibility.ts
export type AddonVisibilityItem = {
  id: string;
  nav: string;
  label: string;
  group: "assist" | "system" | "tools";
  description: string;
  defaultVisible: boolean;
};

export type AddonVisibilityPreset = {
  id: "minimal" | "standard" | "all";
  label: string;
  description: string;
  addonIds: string[];
};

export const ADDON_VISIBILITY_STORAGE_KEY = "jarvis_visible_addons";
export const ADDON_VISIBILITY_EVENT = "jarvis:addon-visibility-changed";

export const addonVisibilityItems: AddonVisibilityItem[] = [
  { id: "lifeos", nav: "LifeOS", label: "LifeOS", group: "assist", description: "Daily Briefing, Tageslage und persoenliche Assistenzmodule.", defaultVisible: true },
  { id: "knowledge", nav: "Wissensbasis", label: "Wissensbasis", group: "assist", description: "Lokale Suche, Dokumente und Knowledge Index.", defaultVisible: true },
  { id: "streams", nav: "Datenstroeme", label: "Datenstroeme", group: "system", description: "Live Daten, Events und technische Streams.", defaultVisible: true },
  { id: "automation", nav: "Aufgaben & Automationen", label: "Aufgaben", group: "assist", description: "Tasks, Notizen, Reminder und Automation Audit.", defaultVisible: true },
  { id: "runtime", nav: "JARVIS Runtime", label: "Runtime", group: "system", description: "Lokale Runtime, Workflows und Steuerung.", defaultVisible: true },
  { id: "diagnostics", nav: "Diagnose", label: "Diagnose", group: "system", description: "DiagCenter, Health Checks und Fehlersuche.", defaultVisible: true },
  { id: "agents", nav: "Agentennetz", label: "Agentennetz", group: "system", description: "Agent Registry und aktive Agenten.", defaultVisible: true },
  { id: "memory", nav: "Speicherbanken", label: "Speicher", group: "system", description: "Memory, Episoden und lokale Speicherorte.", defaultVisible: true },
  { id: "core", nav: "Kernsysteme", label: "Kernsysteme", group: "system", description: "Backend, MCP Server und technische Basis.", defaultVisible: true },
  { id: "security", nav: "Sicherheitszentrale", label: "Sicherheit", group: "system", description: "Risk Level, Freigaben und Audit Kontrolle.", defaultVisible: true },
  { id: "code", nav: "Code-Werkzeuge", label: "Code Tools", group: "tools", description: "Code Analyse und Entwicklerwerkzeuge.", defaultVisible: true },
  { id: "analysis", nav: "Datenanalyse", label: "Datenanalyse", group: "tools", description: "Auswertungen, Tabellen und Analysefunktionen.", defaultVisible: true },
  { id: "files", nav: "Dateimanager", label: "Dateimanager", group: "tools", description: "Lokale Dateien und Dokumentenarbeit.", defaultVisible: true },
  { id: "web", nav: "Websuche", label: "Websuche", group: "tools", description: "Recherche und Webantworten.", defaultVisible: true },
  { id: "api", nav: "API-Konsole", label: "API Konsole", group: "tools", description: "API Endpunkte und technische Pruefung.", defaultVisible: true }
];

export const addonVisibilityPresets: AddonVisibilityPreset[] = [
  {
    id: "minimal",
    label: "Minimal",
    description: "Nur Alltag, Dialog und direkte Assistenz. Gut fuer ruhige Arbeitsphasen.",
    addonIds: ["lifeos", "knowledge", "automation", "diagnostics"]
  },
  {
    id: "standard",
    label: "Standard",
    description: "Ausgewogene Ansicht fuer normale Nutzung ohne Werkzeug Ueberladung.",
    addonIds: ["lifeos", "knowledge", "streams", "automation", "runtime", "diagnostics", "agents", "memory", "security", "web"]
  },
  {
    id: "all",
    label: "Alles sichtbar",
    description: "Alle Addons anzeigen, wenn du bewusst tief im System arbeitest.",
    addonIds: addonVisibilityItems.map((item) => item.id)
  }
];

export function defaultVisibleAddonIds() {
  const standard = addonVisibilityPresets.find((preset) => preset.id === "standard");
  return standard ? standard.addonIds : addonVisibilityItems.filter((item) => item.defaultVisible).map((item) => item.id);
}

export function loadVisibleAddonIds() {
  try {
    const raw = localStorage.getItem(ADDON_VISIBILITY_STORAGE_KEY);
    if (!raw) return defaultVisibleAddonIds();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultVisibleAddonIds();
    const known = new Set(addonVisibilityItems.map((item) => item.id));
    return parsed.filter((item): item is string => typeof item === "string" && known.has(item));
  } catch {
    return defaultVisibleAddonIds();
  }
}

export function saveVisibleAddonIds(ids: string[]) {
  const known = new Set(addonVisibilityItems.map((item) => item.id));
  const clean = Array.from(new Set(ids.filter((id) => known.has(id))));
  localStorage.setItem(ADDON_VISIBILITY_STORAGE_KEY, JSON.stringify(clean));
  window.dispatchEvent(new CustomEvent(ADDON_VISIBILITY_EVENT, { detail: clean }));
  return clean;
}

export function applyAddonVisibilityPreset(presetId: AddonVisibilityPreset["id"]) {
  const preset = addonVisibilityPresets.find((item) => item.id === presetId);
  return saveVisibleAddonIds(preset?.addonIds || defaultVisibleAddonIds());
}

export function findAddonByNav(nav: string) {
  return addonVisibilityItems.find((item) => item.nav === nav);
}
