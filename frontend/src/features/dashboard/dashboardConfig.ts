export type ModuleStatus = "idle" | "loading" | "ok" | "error";

export type EndpointCard = {
  title: string;
  description: string;
  method?: "GET" | "POST";
  endpoint: string;
  body?: unknown;
};

export type DashboardModuleConfig = {
  title: string;
  subtitle: string;
  folder: string;
  endpoints: EndpointCard[];
  prompts: string[];
  searchMode?: "knowledge" | "research";
};

export type ResultState = Record<string, { status: ModuleStatus; data?: unknown; error?: string }>;

export const moduleMap: Record<string, DashboardModuleConfig> = {
  Home: {
    folder: "Command Center",
    title: "Home Overview",
    subtitle: "Zentrale Übersicht. Hier bleiben nur die wichtigsten Statuspunkte sichtbar.",
    endpoints: [
      { title: "Chat Health", description: "Prüft, ob Ollama und das lokale Modell erreichbar sind.", endpoint: "/api/chat/health" },
      { title: "Runtime Status", description: "Lokaler JARVIS Runtime Kern mit Memory, Actions und Workflows.", endpoint: "/api/runtime/status" },
      { title: "System Metrics", description: "Live Werte für CPU, RAM, Temperatur und Netzwerk.", endpoint: "/system/metrics" },
      { title: "Self Check", description: "Backend Selbsttest und wichtige Runtime Informationen.", endpoint: "/self-check" },
    ],
    prompts: ["Fasse mir den aktuellen Systemstatus kurz zusammen", "Welche Module sind gerade einsatzbereit?"],
  },
  "Knowledge Base": {
    folder: "Knowledge",
    title: "Knowledge Base",
    subtitle: "Dokumente, Kategorien, lokale Suche und Antworten aus dem Wissensspeicher.",
    searchMode: "knowledge",
    endpoints: [
      { title: "Knowledge Stats", description: "Indexgröße, Dokumentanzahl und Status.", endpoint: "/knowledge/stats" },
      { title: "Runtime Memory", description: "Persistente Fakten aus der lokalen Runtime.", endpoint: "/api/runtime/memory/facts?limit=12" },
      { title: "Documents", description: "Zeigt importierte Dokumente und Quellen.", endpoint: "/knowledge/documents" },
      { title: "Categories", description: "Zeigt vorhandene Wissenskategorien.", endpoint: "/knowledge/categories" },
      { title: "Uploaded Files", description: "Dateien, die über die UI hochgeladen wurden.", endpoint: "/api/files" },
    ],
    prompts: ["Suche in der Knowledge Base nach JARVIS Setup", "Importiere die letzten Uploads in die Knowledge Base"],
  },
  "Data Streams": {
    folder: "Telemetry",
    title: "Data Streams",
    subtitle: "Live Telemetrie, Systemwerte und tiefer Backend Status.",
    endpoints: [
      { title: "Live Metrics", description: "Aktuelle CPU, RAM, Temperatur und Netzwerkdaten.", endpoint: "/system/metrics" },
      { title: "Runtime Awareness", description: "Aktueller Awareness Kontext der lokalen Runtime.", endpoint: "/api/runtime/awareness/current" },
      { title: "Deep Status", description: "Tiefer Backend Zustand und interne Diagnosewerte.", endpoint: "/deep/status" },
      { title: "Context Pack", description: "Gesammelter Kontext für Diagnose und Reparatur.", endpoint: "/deep/context-pack" },
    ],
    prompts: ["Analysiere die aktuellen Systemdaten", "Gibt es Auffälligkeiten in den Live Daten?"],
  },
  "Tasks & Automation": {
    folder: "Organizer",
    title: "Tasks & Automation",
    subtitle: "Notizen, Aufgaben, Erinnerungen, Automationen und Folder Watcher.",
    endpoints: [
      { title: "Notes", description: "Lokale Notizen abrufen.", endpoint: "/notes" },
      { title: "Tasks", description: "Aufgaben abrufen.", endpoint: "/tasks" },
      { title: "Runtime Goals", description: "OKR Ziele aus der lokalen Runtime.", endpoint: "/api/runtime/goals" },
      { title: "Runtime Workflows", description: "Gespeicherte Runtime Workflows.", endpoint: "/api/runtime/workflows" },
      { title: "Reminders", description: "Erinnerungen abrufen.", endpoint: "/reminders" },
      { title: "Automations", description: "Automationen und geplante Abläufe anzeigen.", endpoint: "/automation/list" },
      { title: "Folder Watch", description: "Überwachte Ordner anzeigen.", endpoint: "/folder-watch/list" },
    ],
    prompts: ["Erstelle mir eine Aufgabe", "Zeig mir meine offenen Aufgaben", "Welche Erinnerungen sind fällig?"],
  },
  Diagnostics: {
    folder: "System",
    title: "Diagnostics",
    subtitle: "Selbsttest, Ports, Logs, Dependencies und Reparaturplan.",
    endpoints: [
      { title: "Self Check", description: "Gesamter Backend Selbsttest.", endpoint: "/self-check" },
      { title: "Runtime Status", description: "Status der lokalen JARVIS Runtime.", endpoint: "/api/runtime/status" },
      { title: "Dependencies", description: "Prüft Python Pakete, Node und wichtige Abhängigkeiten.", endpoint: "/diagnostic/dependencies" },
      { title: "Ports", description: "Prüft relevante Ports wie 8000 und 11434.", endpoint: "/diagnostic/ports" },
      { title: "Logs", description: "Verfügbare Backend Logs anzeigen.", endpoint: "/diagnostic/logs/list" },
      { title: "Repair Plan", description: "Automatisch erzeugter Reparaturplan.", endpoint: "/deep/repair-plan" },
    ],
    prompts: ["Starte eine Systemdiagnose", "Erstelle mir einen Reparaturplan für JARVIS"],
  },
  "Neural Network": {
    folder: "AI Core",
    title: "Neural Network",
    subtitle: "LLM Zustand, Orchestrator Agents und Modell Verbindung.",
    endpoints: [
      { title: "LLM Health", description: "Prüft Ollama und das konfigurierte Modell.", endpoint: "/api/chat/health" },
      { title: "Runtime Agents", description: "Spezialisierte Agentenrollen der lokalen Runtime.", endpoint: "/api/runtime/orchestration/agents" },
      { title: "Orchestrator Agents", description: "Liste der verfügbaren Orchestrator Agents.", endpoint: "/orchestrate/agents" },
      { title: "Agent Matrix", description: "Matrix der Agent Fähigkeiten.", endpoint: "/agents/matrix" },
      { title: "Agent Registry", description: "Registrierte Agenten und Statusdaten.", endpoint: "/agents/registry" },
    ],
    prompts: ["Welcher Agent ist für Web Research zuständig?", "Prüfe den LLM Zustand"],
  },
  "Memory Banks": {
    folder: "Memory",
    title: "Memory Banks",
    subtitle: "Knowledge Speicher, Runtime Memory, Upload Index und lokale Datenquellen.",
    endpoints: [
      { title: "Runtime Memory Facts", description: "Persistente Fakten aus SQLite Runtime Memory.", endpoint: "/api/runtime/memory/facts?limit=20" },
      { title: "Runtime Search", description: "Leere Suche über Runtime Memory als Funktionscheck.", endpoint: "/api/runtime/memory/search?q=jarvis&limit=10" },
      { title: "Knowledge Stats", description: "Speicherstatus der Knowledge Base.", endpoint: "/knowledge/stats" },
      { title: "Knowledge Categories", description: "Kategorien im Speicher.", endpoint: "/knowledge/categories" },
      { title: "Uploaded Files", description: "Datei Index aus Uploads.", endpoint: "/api/files" },
    ],
    prompts: ["Was liegt aktuell im Memory?", "Fasse meine letzten Uploads zusammen"],
  },
  "Core Systems": {
    folder: "Core",
    title: "Core Systems",
    subtitle: "Backend, Runtime, Agents, Tools und Systemmetriken.",
    endpoints: [
      { title: "Runtime Status", description: "UseJARVIS ähnlicher lokaler Runtime Kern.", endpoint: "/api/runtime/status" },
      { title: "Self Check", description: "Kernprüfung des Systems.", endpoint: "/self-check" },
      { title: "Tools Registry", description: "Registrierte Tools.", endpoint: "/tools/registry" },
      { title: "Agent Registry", description: "Agentenstatus und Registry.", endpoint: "/agents/registry" },
      { title: "Metrics", description: "Live Systemmetriken.", endpoint: "/system/metrics" },
    ],
    prompts: ["Prüfe alle Core Systeme", "Welche Core Module sind noch nicht verbunden?"],
  },
  "Security Center": {
    folder: "Security",
    title: "Security Center",
    subtitle: "Status, Authority Gate, Audit, offene Aktionen und sichere Tool Ausführung.",
    endpoints: [
      { title: "Runtime Actions", description: "Alle Runtime Action Requests mit Risiko und Status.", endpoint: "/api/runtime/actions?limit=20" },
      { title: "Pending Actions", description: "Aktionen, die auf Bestätigung warten.", endpoint: "/actions/pending" },
      { title: "Security Permissions", description: "Berechtigungen inklusive Authority Gate Status.", endpoint: "/security/permissions" },
      { title: "Diagnostics Package", description: "Diagnosepaket für Sicherheitsprüfung.", endpoint: "/diagnostics/package" },
      { title: "Ports", description: "Offene und relevante Ports prüfen.", endpoint: "/diagnostic/ports" },
    ],
    prompts: ["Prüfe den Sicherheitsstatus", "Welche Aktionen warten auf Bestätigung?"],
  },
  "Code Interpreter": {
    folder: "Tools",
    title: "Code Interpreter",
    subtitle: "Tool Registry, Tool Kategorien und Code bezogene Aktionen.",
    endpoints: [
      { title: "Tools Full", description: "Alle registrierten Tools vollständig anzeigen.", endpoint: "/tools/registry/full" },
      { title: "Tool Registry", description: "Kurzübersicht der Tools.", endpoint: "/tools/registry" },
      { title: "Code Tools", description: "Tools der Kategorie code, falls vorhanden.", endpoint: "/tools/registry/full/category/code" },
    ],
    prompts: ["Hilf mir beim Code Debugging", "Welche Code Tools sind verfügbar?"],
  },
  "Data Analyzer": {
    folder: "Tools",
    title: "Data Analyzer",
    subtitle: "Analysefunktionen, Dateianalyse und lokale Datenabfrage.",
    endpoints: [
      { title: "Uploaded Files", description: "Dateien, die analysiert werden können.", endpoint: "/api/files" },
      { title: "Analysis Tools", description: "Tools der Kategorie analysis, falls vorhanden.", endpoint: "/tools/registry/full/category/analysis" },
      { title: "Knowledge Search", description: "Leere Suchprobe gegen Knowledge Search.", endpoint: "/knowledge/search?q=&limit=5" },
    ],
    prompts: ["Analysiere die letzte hochgeladene Datei", "Zeig mir Auffälligkeiten in den Daten"],
  },
  "File Manager": {
    folder: "Files",
    title: "File Manager",
    subtitle: "Upload Index, Dateisuche und Windows Ordnerzugriff.",
    endpoints: [
      { title: "Uploaded Files", description: "JARVIS Upload Index.", endpoint: "/api/files" },
      { title: "Windows Apps", description: "Windows App Index als Funktionstest.", endpoint: "/windows/apps" },
      { title: "Search Files", description: "Beispielsuche nach JARVIS Dateien.", endpoint: "/windows/search-files?q=jarvis&limit=10" },
    ],
    prompts: ["Zeig mir die letzten Dateien", "Suche nach JARVIS Dateien"],
  },
  "Web Search": {
    folder: "Research",
    title: "Web Search",
    subtitle: "Reparierter Research Agent mit HTML Suche und Ollama Zusammenfassung.",
    searchMode: "research",
    endpoints: [
      { title: "Research Health", description: "Testet den neuen Research Endpoint mit einer kurzen Suche.", endpoint: "/api/research/search?q=FastAPI%20Windows%20Ollama&limit=3" },
      { title: "Research Answer", description: "Sucht Web Treffer und lässt Ollama zusammenfassen.", endpoint: "/api/research/answer?q=Ollama%20qwen3%208b%20FastAPI&limit=4" },
      { title: "Agent Registry", description: "Prüft, ob ein Research Agent registriert ist.", endpoint: "/agents/registry" },
      { title: "Tool Registry", description: "Prüft, ob Web oder Search Tools registriert sind.", endpoint: "/tools/registry/full" },
    ],
    prompts: ["Recherchiere aktuelle Infos zu Ollama qwen3", "Suche im Web nach FastAPI Windows Service"],
  },
  "API Console": {
    folder: "Developer",
    title: "API Console",
    subtitle: "Direkter Überblick über Backend Routen, Tools und Systemchecks.",
    endpoints: [
      { title: "Runtime Status", description: "Lokale Runtime API Übersicht.", endpoint: "/api/runtime/status" },
      { title: "Runtime Workflow Nodes", description: "Workflow Node Registry.", endpoint: "/api/runtime/workflows/nodes" },
      { title: "OpenAPI", description: "FastAPI OpenAPI Spezifikation.", endpoint: "/openapi.json" },
      { title: "Tools Registry", description: "Registrierte Tools.", endpoint: "/tools/registry" },
      { title: "Agents Registry", description: "Registrierte Agents.", endpoint: "/agents/registry" },
      { title: "Chat Health", description: "LLM Gesundheitscheck.", endpoint: "/api/chat/health" },
    ],
    prompts: ["Welche API Endpoints sind verfügbar?", "Prüfe die Backend API"],
  },
};

export const agentToolsModules = new Set(["Neural Network", "Core Systems", "Code Interpreter", "Data Analyzer", "API Console"]);
