import { useEffect, useMemo, useState } from "react";
import { AgentToolsPanel } from "./AgentToolsPanel";
import { OrganizerPanel } from "./OrganizerPanel";
import "./dashboard-modules.css";

type ModuleStatus = "idle" | "loading" | "ok" | "error";

type EndpointCard = {
  title: string;
  description: string;
  method?: "GET" | "POST";
  endpoint: string;
  body?: unknown;
};

type Props = {
  activeNav: string;
  onSend: (message: string) => void;
};

type ResultState = Record<string, { status: ModuleStatus; data?: unknown; error?: string }>;

type ModuleConfig = {
  title: string;
  subtitle: string;
  folder: string;
  endpoints: EndpointCard[];
  prompts: string[];
  searchMode?: "knowledge" | "research";
};

const moduleMap: Record<string, ModuleConfig> = {
  Start: {
    folder: "Kommandozentrale",
    title: "Startuebersicht",
    subtitle: "Zentrale Uebersicht. Hier bleiben nur die wichtigsten Statuspunkte sichtbar.",
    endpoints: [
      { title: "Chat Zustand", description: "Prueft, ob Ollama und das lokale Modell erreichbar sind.", endpoint: "/api/chat/health" },
      { title: "Systemwerte", description: "Aktuelle Werte fuer CPU, RAM, Temperatur und Netzwerk.", endpoint: "/system/metrics" },
      { title: "Selbstpruefung", description: "Backend Selbsttest und wichtige Runtime Informationen.", endpoint: "/self-check" },
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
      { title: "Dokumente", description: "Zeigt importierte Dokumente und Quellen.", endpoint: "/knowledge/documents" },
      { title: "Kategorien", description: "Zeigt vorhandene Wissenskategorien.", endpoint: "/knowledge/categories" },
      { title: "Hochladungen", description: "Dateien, die ueber die UI hochgeladen wurden.", endpoint: "/api/files" },
    ],
    prompts: ["Suche in der Wissensbasis nach JARVIS Setup", "Importiere die letzten Hochladungen in die Wissensbasis"],
  },
  Datenstroeme: {
    folder: "Telemetrie",
    title: "Datenstroeme",
    subtitle: "Aktuelle Telemetrie, Systemwerte und tiefer Backend Status.",
    endpoints: [
      { title: "Aktuelle Werte", description: "Aktuelle CPU, RAM, Temperatur und Netzwerkdaten.", endpoint: "/system/metrics" },
      { title: "Tiefenstatus", description: "Tiefer Backend Zustand und interne Diagnosewerte.", endpoint: "/deep/status" },
      { title: "Kontextpaket", description: "Gesammelter Kontext fuer Diagnose und Reparatur.", endpoint: "/deep/context-pack" },
    ],
    prompts: ["Analysiere die aktuellen Systemdaten", "Gibt es Auffaelligkeiten in den aktuellen Daten?"],
  },
  "Aufgaben & Automationen": {
    folder: "Organisation",
    title: "Aufgaben & Automationen",
    subtitle: "Notizen, Aufgaben, Erinnerungen, Automationen und Ordnerueberwachung.",
    endpoints: [
      { title: "Notizen", description: "Lokale Notizen abrufen.", endpoint: "/notes" },
      { title: "Aufgaben", description: "Aufgaben abrufen.", endpoint: "/tasks" },
      { title: "Erinnerungen", description: "Erinnerungen abrufen.", endpoint: "/reminders" },
      { title: "Automationen", description: "Automationen und geplante Ablaeufe anzeigen.", endpoint: "/automation/list" },
      { title: "Ordnerueberwachung", description: "Ueberwachte Ordner anzeigen.", endpoint: "/folder-watch/list" },
    ],
    prompts: ["Erstelle mir eine Aufgabe", "Zeig mir meine offenen Aufgaben", "Welche Erinnerungen sind faellig?"],
  },
  Diagnose: {
    folder: "System",
    title: "Diagnose",
    subtitle: "Selbsttest, Ports, Logs, Abhaengigkeiten und Reparaturplan.",
    endpoints: [
      { title: "Selbstpruefung", description: "Gesamter Backend Selbsttest.", endpoint: "/self-check" },
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
      { title: "LLM Zustand", description: "Prueft Ollama und das konfigurierte Modell.", endpoint: "/api/chat/health" },
      { title: "Orchestrator Agenten", description: "Liste der verfuegbaren Orchestrator Agenten.", endpoint: "/orchestrate/agents" },
      { title: "Agentenmatrix", description: "Matrix der Agentenfaehigkeiten.", endpoint: "/agents/matrix" },
      { title: "Agentenverzeichnis", description: "Registrierte Agenten und Statusdaten.", endpoint: "/agents/registry" },
    ],
    prompts: ["Welcher Agent ist fuer Websuche zustaendig?", "Pruefe den LLM Zustand"],
  },
  Speicherbanken: {
    folder: "Speicher",
    title: "Speicherbanken",
    subtitle: "Wissensspeicher, Datei Index und lokale Datenquellen.",
    endpoints: [
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
      { title: "Selbstpruefung", description: "Kernpruefung des Systems.", endpoint: "/self-check" },
      { title: "Werkzeugverzeichnis", description: "Registrierte Werkzeuge.", endpoint: "/tools/registry" },
      { title: "Agentenverzeichnis", description: "Agentenstatus und Verzeichnis.", endpoint: "/agents/registry" },
      { title: "Systemwerte", description: "Aktuelle Systemmetriken.", endpoint: "/system/metrics" },
    ],
    prompts: ["Pruefe alle Kernsysteme", "Welche Kernmodule sind noch nicht verbunden?"],
  },
  Sicherheitszentrale: {
    folder: "Sicherheit",
    title: "Sicherheitszentrale",
    subtitle: "Status, Audit, offene Aktionen und sichere Werkzeugausfuehrung.",
    endpoints: [
      { title: "Offene Aktionen", description: "Aktionen, die auf Bestaetigung warten.", endpoint: "/actions/pending" },
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
    subtitle: "Datei Index, Dateisuche und Windows Ordnerzugriff.",
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
    subtitle: "Reparierter Recherche Agent mit HTML Suche und Ollama Zusammenfassung.",
    searchMode: "research",
    endpoints: [
      { title: "Recherche Zustand", description: "Testet den Recherche Endpunkt mit einer kurzen Suche.", endpoint: "/api/research/search?q=FastAPI%20Windows%20Ollama&limit=3" },
      { title: "Recherche Antwort", description: "Sucht Web Treffer und laesst Ollama zusammenfassen.", endpoint: "/api/research/answer?q=Ollama%20qwen3%208b%20FastAPI&limit=4" },
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
      { title: "OpenAPI", description: "FastAPI OpenAPI Spezifikation.", endpoint: "/openapi.json" },
      { title: "Werkzeugverzeichnis", description: "Registrierte Werkzeuge.", endpoint: "/tools/registry" },
      { title: "Agentenverzeichnis", description: "Registrierte Agenten.", endpoint: "/agents/registry" },
      { title: "Chat Zustand", description: "LLM Gesundheitscheck.", endpoint: "/api/chat/health" },
    ],
    prompts: ["Welche API Endpunkte sind verfuegbar?", "Pruefe die Backend API"],
  },
};

const agentToolsModules = new Set(["Agentennetz", "Kernsysteme", "Code-Werkzeuge", "Datenanalyse", "API-Konsole"]);

function pretty(value: unknown) {
  if (value === undefined) return "";
  if (typeof value === "string") return value;
  try { return JSON.stringify(value, null, 2); } catch { return String(value); }
}

function countHint(data: unknown) {
  if (Array.isArray(data)) return `${data.length} Eintraege`;
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    for (const key of ["items", "files", "documents", "agents", "tools", "tasks", "notes", "reminders", "categories", "results"]) {
      if (Array.isArray(obj[key])) return `${(obj[key] as unknown[]).length} Eintraege`;
    }
    return `${Object.keys(obj).length} Felder`;
  }
  return "Antwort erhalten";
}

export function DashboardModules({ activeNav, onSend }: Props) {
  const module = moduleMap[activeNav];
  const [results, setResults] = useState<ResultState>({});
  const [query, setQuery] = useState("");

  const visible = Boolean(module) && activeNav !== "Dialog";

  useEffect(() => {
    if (!visible || !module || activeNav === "Aufgaben & Automationen") return;
    setResults({});
    module.endpoints.slice(0, 2).forEach((endpoint) => void runEndpoint(endpoint));
  }, [activeNav]);

  async function runEndpoint(card: EndpointCard) {
    setResults((prev) => ({ ...prev, [card.title]: { status: "loading" } }));
    try {
      const response = await fetch(card.endpoint, {
        method: card.method || "GET",
        headers: card.method === "POST" ? { "Content-Type": "application/json" } : undefined,
        body: card.method === "POST" ? JSON.stringify(card.body || {}) : undefined,
      });
      const text = await response.text();
      let data: unknown = text;
      try { data = text ? JSON.parse(text) : {}; } catch {}
      if (!response.ok) throw new Error(typeof data === "string" ? data : pretty(data));
      setResults((prev) => ({ ...prev, [card.title]: { status: "ok", data } }));
    } catch (error) {
      setResults((prev) => ({ ...prev, [card.title]: { status: "error", error: error instanceof Error ? error.message : String(error) } }));
    }
  }

  async function runSearch() {
    const q = query.trim();
    if (!q || !module) return;
    const isResearch = module.searchMode === "research";
    const endpoint: EndpointCard = isResearch
      ? { title: `Recherche: ${q}`, description: "Web Recherche mit Zusammenfassung", endpoint: `/api/research/answer?q=${encodeURIComponent(q)}&limit=6` }
      : { title: `Suche: ${q}`, description: "Wissenssuche", endpoint: `/knowledge/search?q=${encodeURIComponent(q)}&limit=8` };
    await runEndpoint(endpoint);
  }

  const primaryData = useMemo(() => {
    const ok = Object.values(results).find((item) => item.status === "ok");
    return ok?.data;
  }, [results]);

  if (!visible || !module) return null;

  if (activeNav === "Aufgaben & Automationen") {
    return <OrganizerPanel onSend={onSend} />;
  }

  if (agentToolsModules.has(activeNav)) {
    return <AgentToolsPanel activeNav={activeNav} onSend={onSend} />;
  }

  return (
    <section className="jv-module-shell">
      <div className="jv-module-header">
        <div>
          <small>{module.folder}</small>
          <h1>{module.title}</h1>
          <p>{module.subtitle}</p>
        </div>
        <button onClick={() => module.endpoints.forEach((endpoint) => void runEndpoint(endpoint))}>ALLE PRUEFEN</button>
      </div>

      <div className="jv-module-grid">
        <div className="jv-module-card jv-module-card-wide">
          <div className="jv-module-card-title">
            <h2>Funktionsordner</h2>
            <span>{module.endpoints.length} Endpunkte</span>
          </div>
          <div className="jv-folder-strip">
            {module.endpoints.map((endpoint) => {
              const result = results[endpoint.title];
              return (
                <button key={endpoint.title} className={`jv-folder ${result?.status || "idle"}`} onClick={() => void runEndpoint(endpoint)}>
                  <b>{endpoint.title}</b>
                  <span>{endpoint.description}</span>
                  <em>{result?.status === "ok" ? countHint(result.data) : result?.status === "error" ? "Fehler" : result?.status === "loading" ? "Laedt" : endpoint.endpoint}</em>
                </button>
              );
            })}
          </div>
        </div>

        <div className="jv-module-card">
          <div className="jv-module-card-title"><h2>Direktbefehle</h2><span>Chat</span></div>
          <div className="jv-prompt-list">
            {module.prompts.map((prompt) => <button key={prompt} onClick={() => onSend(prompt)}>{prompt}</button>)}
          </div>
          <div className="jv-module-search">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={module.searchMode === "research" ? "Websuche..." : "Wissenssuche..."} onKeyDown={(e) => e.key === "Enter" && runSearch()} />
            <button onClick={runSearch}>{module.searchMode === "research" ? "RECHERCHE" : "SUCHEN"}</button>
          </div>
        </div>

        <div className="jv-module-card jv-module-result">
          <div className="jv-module-card-title"><h2>Aktuelles Ergebnis</h2><span>{Object.values(results).filter((x) => x.status === "ok").length} OK</span></div>
          <pre>{pretty(primaryData || results)}</pre>
        </div>
      </div>
    </section>
  );
}
