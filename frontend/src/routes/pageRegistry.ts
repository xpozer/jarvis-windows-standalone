// frontend/src/routes/pageRegistry.ts
export type DashboardPageId =
  | "start"
  | "dialog"
  | "lifeos"
  | "knowledge"
  | "streams"
  | "automation"
  | "runtime"
  | "diagnostics"
  | "agents"
  | "memory"
  | "core"
  | "security"
  | "tools";

export type DashboardPage = {
  id: DashboardPageId;
  title: string;
  path: string;
  group: "main" | "system" | "workbench";
  description: string;
};

export const dashboardPages: DashboardPage[] = [
  { id: "start", title: "Start", path: "/stack/start", group: "main", description: "Kernstatus, Tageslage und wichtigste Aktionen." },
  { id: "dialog", title: "Dialog", path: "/stack/dialog", group: "main", description: "Chat, Voice und direkte JARVIS Interaktion." },
  { id: "lifeos", title: "LifeOS", path: "/stack/lifeos", group: "main", description: "Daily Briefing, Work Radar und persönliche Module." },
  { id: "knowledge", title: "Wissensbasis", path: "/stack/knowledge", group: "main", description: "Lokaler Knowledge Index, Dokumente und Suche." },
  { id: "streams", title: "Datenstroeme", path: "/stack/streams", group: "main", description: "Live Telemetrie, Events und Websocket Daten." },
  { id: "automation", title: "Aufgaben & Automationen", path: "/stack/automation", group: "main", description: "Tasks, Reminder, Quick Capture und Audit Log." },
  { id: "runtime", title: "JARVIS Runtime", path: "/stack/runtime", group: "system", description: "Lokale Runtime, Aktionen, Workflows und Status." },
  { id: "diagnostics", title: "Diagnose", path: "/stack/diagnostics", group: "system", description: "DiagCenter, Health Checks, Logs und Reparaturhinweise." },
  { id: "agents", title: "Agentennetz", path: "/stack/agents", group: "system", description: "Agent Registry, aktive Agenten und Risk Level." },
  { id: "memory", title: "Speicherbanken", path: "/stack/memory", group: "system", description: "Memory, Episoden, Fakten und lokale Speicherorte." },
  { id: "core", title: "Kernsysteme", path: "/stack/core", group: "system", description: "Backend, Tools, MCP Server und System Health." },
  { id: "security", title: "Sicherheitszentrale", path: "/stack/security", group: "system", description: "Freigaben, High Risk Aktionen und Audit Kontrolle." },
  { id: "tools", title: "Werkzeuge", path: "/stack/tools", group: "workbench", description: "Code Tools, Datenanalyse, Dateimanager, Websuche und API Konsole." },
];

export function findDashboardPage(path: string) {
  return dashboardPages.find((page) => page.path === path) ?? dashboardPages[0];
}
