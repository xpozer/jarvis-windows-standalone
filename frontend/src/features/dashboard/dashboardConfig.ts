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
  Start: {
    folder: "Kommandozentrale",
    title: "Startuebersicht",
    subtitle: "Zentrale Uebersicht. Hier bleiben nur die wichtigsten Statuspunkte sichtbar.",
    endpoints: [
      { title: "Health", description: "Prueft die lokale FastAPI Basis.", endpoint: "/health" },
      { title: "Chat Zustand", description: "Prueft Provider, Modell und Runtime.", endpoint: "/api/chat/health" },
      { title: "Runtime Status", description: "Lokaler JARVIS Runtime Kern mit Gedächtnis, Aktionen und Abläufen.", endpoint: "/api/runtime/status" },
      { title: "Systemwerte", description: "Live Werte fuer CPU, RAM, Temperatur und Netzwerk.", endpoint: "/system/metrics" },
      { title: "Automation Audit", description: "Letzte lokale Automation Audit Eintraege.", endpoint: "/automation/audit?limit=5" },
    ],
    prompts: ["Fasse mir den aktuellen Systemstatus kurz zusammen", "Welche Module sind gerade einsatzbereit?"],
  },
  Wissensbasis: {
    folder: "Wissen",
    title: "Wissensbasis",
    subtitle: "Dokumente, Kategorien, lokale Suche und Antworten aus dem Wissensspeicher.",
    searchMode: "knowledge",
    endpoints: [
      { title: "Wissensstatus", description: "Indexgroesse, Dokumentanzahl und Status.", endpoint: "/knowledge/stats" },
      { title: "Runtime Gedächtnis", description: "Persistente Fakten aus der lokalen Runtime.", endpoint: "/api/runtime/memory/facts?limit=12" },
      { title: "Dokumente", description: "Zeigt importierte Dokumente und Quellen.", endpoint: "/knowledge/documents" },
      { title: "Kategorien", description: "Zeigt vorhandene Wissenskategorien.", endpoint: "/knowledge/categories" },
      { title: "Hochladungen", description: "Dateien, die ueber die UI hochgeladen wurden.", endpoint: "/api/files" },
    ],
    prompts: ["Suche in der Wissensbasis nach JARVIS Setup", "Importiere die letzten Hochladungen in die Wissensbasis"],
  },
  Datenstroeme: {
    folder: "Telemetrie",
    title: "Datenstroeme",
    subtitle: "Live Telemetrie, Systemwerte und tiefer Backend Status.",
    endpoints: [
      { title: "Live Werte", description: "Aktuelle CPU, RAM, Temperatur und Netzwerkdaten.", endpoint: "/system/metrics" },
      { title: "Runtime Awareness", description: "Aktueller Awareness Kontext der lokalen Runtime.", endpoint: "/api/runtime/awareness/current" },
      { title: "Tiefenstatus", description: "Tiefer Backend Zustand und interne Diagnosewerte.", endpoint: "/deep/status" },
      { title: "Kontextpaket", description: "Gesammelter Kontext fuer Diagnose und Reparatur.", endpoint: "/deep/context-pack" },
    ],
    prompts: ["Analysiere die aktuellen Systemdaten", "Gibt es Auffaelligkeiten in den Live Daten?"],
  },
  "Aufgaben & Automationen": {
    folder: "Automation Cluster",
    title: "Aufgaben & Automationen",
    subtitle: "Notizen, Aufgaben, Erinnerungen, Automationen und Audit Log in einem Cluster.",
    endpoints: [
      { title: "Notizen", description: "Lokale Notizen abrufen.", endpoint: "/notes" },
      { title: "Aufgaben", description: "Aufgaben abrufen.", endpoint: "/tasks" },
      { title: "Automation Audit", description: "Letzte Audit Log Eintraege fuer ausgefuehrte oder vorbereitete Automationen.", endpoint: "/automation/audit?limit=12" },
      { title: "Runtime Aktionen", description: "Runtime Aktionen mit Risiko und Status.", endpoint: "/api/runtime/actions?limit=20" },
      { title: "Runtime Ziele", description: "OKR Ziele aus der lokalen Runtime.", endpoint: "/api/runtime/goals" },
      { title: "Runtime Abläufe", description: "Gespeicherte Runtime Abläufe.", endpoint: "/api/runtime/workflows" },
      { title: "Erinnerungen", description: "Erinnerungen abrufen.", endpoint: "/reminders" },
      { title: "Automationen", description: "Automationen und geplante Ablaeufe anzeigen.", endpoint: "/automation/list" },
      { title: "Ordnerueberwachung", description: "Ueberwachte Ordner anzeigen.", endpoint: "/folder-watch/list" },
    ],
    prompts: ["Erstelle mir eine Aufgabe", "Zeig mir meine offenen Aufgaben", "Fasse die letzten Automation Audit Log Einträge zusammen"],
  },
  "JARVIS Runtime": {
    folder: "Runtime",
    title: "JARVIS Runtime",
    subtitle: "Lokaler Runtime Kern fuer Gedächtnis, Aktionen, Awareness, Ziele und Abläufe.",
    endpoints: [
      { title: "Runtime Status", description: "Gesamtzustand der lokalen Runtime.", endpoint: "/api/runtime/status" },
      { title: "Aktionen", description: "Runtime Aktionen mit Risiko und Status.", endpoint: "/api/runtime/actions?limit=20" },
      { title: "Automation Audit", description: "Lokaler Audit Log fuer Automationen.", endpoint: "/automation/audit?limit=10" },
      { title: "Gedächtnis Fakten", description: "Persistente Runtime Fakten.", endpoint: "/api/runtime/memory/facts?limit=20" },
      { title: "Abläufe", description: "Gespeicherte Runtime Abläufe.", endpoint: "/api/runtime/workflows" },
    ],
    prompts: ["Pruefe die JARVIS Runtime", "Welche Aktionen warten in der Runtime?"],
  },
  Diagnose: {
    folder: "System",
    title: "Diagnose",
    subtitle: "Selbsttest, Ports, Logs, Abhaengigkeiten und Reparaturplan.",
    endpoints: [
      { title: "Health", description: "FastAPI Health Check.", endpoint: "/health" },
      { title: "Selbstpruefung", description: "Gesamter Backend Selbsttest.", endpoint: "/self-check" },
      { title: "Runtime Status", description: "Status der lokalen JARVIS Runtime.", endpoint: "/api/runtime/status" },
      { title: "Automation Audit", description: "Prueft, ob der neue Audit Log erreichbar ist.", endpoint: "/automation/audit?limit=5" },
      { title: "Abhaengigkeiten", description: "Prueft Python Pakete, Node und wichtige Abhaengigkeiten.", endpoint: "/diagnostic/dependencies" },
      { title: "Ports", description: "Prueft relevante Ports wie 8000 und 11434.", endpoint: "/diagnostic/ports" },
      { title: "Logs", description: "Verfuegbare Backend Logs anzeigen.", endpoint: "/diagnostic/logs/list" },
      { title: "Reparaturplan", description: "Automatisch erzeugter Reparaturplan.", endpoint: "/deep/repair-plan" },
    ],
    prompts: ["Starte eine Systemdiagnose", "Erstelle mir einen Reparaturplan fuer JARVIS"],
  },
  Agentennetz: {
    folder: "KI Kern",
    title: "Agentennetz",
    subtitle: "LLM Zustand, Orchestrator Agenten und Modellverbindung.",
    endpoints: [
      { title: "LLM Zustand", description: "Prueft Provider und konfiguriertes Modell.", endpoint: "/api/chat/health" },
      { title: "Runtime Agenten", description: "Spezialisierte Agentenrollen der lokalen Runtime.", endpoint: "/api/runtime/orchestration/agents" },
      { title: "Orchestrator Agenten", description: "Liste der verfuegbaren Orchestrator Agenten.", endpoint: "/orchestrate/agents" },
      { title: "Agentenmatrix", description: "Matrix der Agentenfaehigkeiten.", endpoint: "/agents/matrix" },
      { title: "Agentenverzeichnis", description: "Registrierte Agenten und Statusdaten.", endpoint: "/agents/registry" },
    ],
    prompts: ["Welcher Agent ist fuer Web Recherche zustaendig?", "Pruefe den LLM Zustand"],
  },
  Speicherbanken: {
    folder: "Speicher",
    title: "Speicherbanken",
    subtitle: "Wissensspeicher, Runtime Gedächtnis, Upload Index und lokale Datenquellen.",
    endpoints: [
      { title: "Runtime Fakten", description: "Persistente Fakten aus SQLite Runtime Gedächtnis.", endpoint: "/api/runtime/memory/facts?limit=20" },
      { title: "Runtime Suche", description: "Suche ueber Runtime Gedächtnis als Funktionscheck.", endpoint: "/api/runtime/memory/search?q=jarvis&limit=10" },
      { title: "Wissensstatus", description: "Speicherstatus der Wissensbasis.", endpoint: "/knowledge/stats" },
      { title: "Wissenskategorien", description: "Kategorien im Speicher.", endpoint: "/knowledge/categories" },
      { title: "Hochladungen", description: "Datei Index aus hochgeladenen Dateien.", endpoint: "/api/files" },
    ],
    prompts: ["Was liegt aktuell im Speicher?", "Fasse meine letzten Hochladungen zusammen"],
  },
  Kernsysteme: {
    folder: "Kern",
    title: "Kernsysteme",
    subtitle: "Backend, Runtime, Agenten, Werkzeuge und Systemmetriken.",
    endpoints: [
      { title: "Health", description: "FastAPI Health Check.", endpoint: "/health" },
      { title: "Runtime Status", description: "Lokaler Runtime Kern.", endpoint: "/api/runtime/status" },
      { title: "Selbstpruefung", description: "Kernpruefung des Systems.", endpoint: "/self-check" },
      { title: "Werkzeugverzeichnis", description: "Registrierte Werkzeuge.", endpoint: "/tools/registry" },
      { title: "Agentenverzeichnis", description: "Agentenstatus und Verzeichnis.", endpoint: "/agents/registry" },
      { title: "Systemwerte", description: "Live Systemmetriken.", endpoint: "/system/metrics" },
    ],
    prompts: ["Pruefe alle Kernsysteme", "Welche Kernmodule sind noch nicht verbunden?"],
  },
  Sicherheitszentrale: {
    folder: "Sicherheit",
    title: "Sicherheitszentrale",
    subtitle: "Status, Freigabezentrale, Audit, offene Aktionen und sichere Werkzeugausfuehrung.",
    endpoints: [
      { title: "Automation Audit", description: "Audit Log fuer Automationen und Sicherheitspruefung.", endpoint: "/automation/audit?limit=20" },
      { title: "Runtime Aktionen", description: "Alle Runtime Action Requests mit Risiko und Status.", endpoint: "/api/runtime/actions?limit=20" },
      { title: "Offene Aktionen", description: "Aktionen, die auf Bestaetigung warten.", endpoint: "/actions/pending" },
      { title: "Berechtigungen", description: "Berechtigungen inklusive Freigabestatus.", endpoint: "/security/permissions" },
      { title: "Diagnosepaket", description: "Diagnosepaket fuer Sicherheitspruefung.", endpoint: "/diagnostics/package" },
      { title: "Ports", description: "Offene und relevante Ports pruefen.", endpoint: "/diagnostic/ports" },
    ],
    prompts: ["Pruefe den Sicherheitsstatus", "Welche Aktionen warten auf Bestaetigung?"],
  },
  "Code-Werkzeuge": {
    folder: "Werkzeuge",
    title: "Code-Werkzeuge",
    subtitle: "Werkzeugverzeichnis, Kategorien und codebezogene Aktionen.",
    endpoints: [
      { title: "Alle Werkzeuge", description: "Alle registrierten Werkzeuge vollstaendig anzeigen.", endpoint: "/tools/registry/full" },
      { title: "Werkzeugverzeichnis", description: "Kurzuebersicht der Werkzeuge.", endpoint: "/tools/registry" },
      { title: "Code Werkzeuge", description: "Werkzeuge der Kategorie code, falls vorhanden.", endpoint: "/tools/registry/full/category/code" },
    ],
    prompts: ["Hilf mir beim Code Debugging", "Welche Code Werkzeuge sind verfuegbar?"],
  },
  Datenanalyse: {
    folder: "Werkzeuge",
    title: "Datenanalyse",
    subtitle: "Analysefunktionen, Dateianalyse und lokale Datenabfrage.",
    endpoints: [
      { title: "Hochladungen", description: "Dateien, die analysiert werden koennen.", endpoint: "/api/files" },
      { title: "Analysewerkzeuge", description: "Werkzeuge der Kategorie analysis, falls vorhanden.", endpoint: "/tools/registry/full/category/analysis" },
      { title: "Wissenssuche", description: "Leere Suchprobe gegen die Wissenssuche.", endpoint: "/knowledge/search?q=&limit=5" },
    ],
    prompts: ["Analysiere die letzte hochgeladene Datei", "Zeig mir Auffaelligkeiten in den Daten"],
  },
  Dateimanager: {
    folder: "Dateien",
    title: "Dateimanager",
    subtitle: "Hochladungen, Dateisuche und Windows Ordnerzugriff.",
    endpoints: [
      { title: "Hochladungen", description: "JARVIS Datei Index.", endpoint: "/api/files" },
      { title: "Windows Apps", description: "Windows App Index als Funktionstest.", endpoint: "/windows/apps" },
      { title: "Dateisuche", description: "Beispielsuche nach JARVIS Dateien.", endpoint: "/windows/search-files?q=jarvis&limit=10" },
    ],
    prompts: ["Zeig mir die letzten Dateien", "Suche nach JARVIS Dateien"],
  },
  Websuche: {
    folder: "Recherche",
    title: "Websuche",
    subtitle: "Reparierter Recherche Agent mit HTML Suche und Provider Zusammenfassung.",
    searchMode: "research",
    endpoints: [
      { title: "Recherche Zustand", description: "Testet den Recherche Endpunkt mit einer kurzen Suche.", endpoint: "/api/research/search?q=FastAPI%20Windows%20Ollama&limit=3" },
      { title: "Recherche Antwort", description: "Sucht Web Treffer und laesst JARVIS zusammenfassen.", endpoint: "/api/research/answer?q=Ollama%20qwen3%208b%20FastAPI&limit=4" },
      { title: "Agentenverzeichnis", description: "Prueft, ob ein Recherche Agent registriert ist.", endpoint: "/agents/registry" },
      { title: "Werkzeugverzeichnis", description: "Prueft, ob Web- oder Suchwerkzeuge registriert sind.", endpoint: "/tools/registry/full" },
    ],
    prompts: ["Recherchiere aktuelle Infos zu Ollama qwen3", "Suche im Web nach FastAPI Windows Service"],
  },
  "API-Konsole": {
    folder: "Entwicklung",
    title: "API-Konsole",
    subtitle: "Direkter Ueberblick ueber Backend Routen, Werkzeuge und Systemchecks.",
    endpoints: [
      { title: "Health", description: "FastAPI Health Check.", endpoint: "/health" },
      { title: "Automation Audit", description: "OpenAPI sichtbarer Audit Log Endpunkt.", endpoint: "/automation/audit?limit=5" },
      { title: "Runtime Status", description: "Lokale Runtime API Uebersicht.", endpoint: "/api/runtime/status" },
      { title: "Ablauf Knoten", description: "Ablaufknoten Verzeichnis.", endpoint: "/api/runtime/workflows/nodes" },
      { title: "OpenAPI", description: "FastAPI OpenAPI Spezifikation.", endpoint: "/openapi.json" },
      { title: "Werkzeugverzeichnis", description: "Registrierte Werkzeuge.", endpoint: "/tools/registry" },
      { title: "Agentenverzeichnis", description: "Registrierte Agenten.", endpoint: "/agents/registry" },
      { title: "Chat Zustand", description: "LLM Gesundheitscheck.", endpoint: "/api/chat/health" },
    ],
    prompts: ["Welche API Endpunkte sind verfuegbar?", "Pruefe die Backend API"],
  },
};

export const agentToolsModules = new Set(["Agentennetz", "Kernsysteme", "Code-Werkzeuge", "Datenanalyse", "API-Konsole"]);
