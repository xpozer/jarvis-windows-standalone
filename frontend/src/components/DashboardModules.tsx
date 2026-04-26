import { useEffect, useMemo, useState } from "react";
import { AgentToolsPanel } from "./AgentToolsPanel";
import { OrganizerPanel } from "./OrganizerPanel";
import { RuntimeControlPanel } from "./RuntimeControlPanel";
import { agentToolsModules, moduleMap } from "../features/dashboard/dashboardConfig";
import type { EndpointCard, ResultState } from "../features/dashboard/dashboardConfig";
import "./dashboard-modules.css";

type Props = {
  activeNav: string;
  onSend: (message: string) => void;
};

function pretty(value: unknown) {
  if (value === undefined) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function countHint(data: unknown) {
  if (Array.isArray(data)) return `${data.length} Einträge`;
  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;
    for (const key of ["items", "files", "documents", "agents", "tools", "tasks", "notes", "reminders", "categories", "results", "facts", "actions", "goals", "workflows", "sidecars", "runtime_agents"]) {
      if (Array.isArray(obj[key])) return `${(obj[key] as unknown[]).length} Einträge`;
    }
    return `${Object.keys(obj).length} Felder`;
  }
  return "Antwort erhalten";
}

export function DashboardModules({ activeNav, onSend }: Props) {
  const module = moduleMap[activeNav];
  const [results, setResults] = useState<ResultState>({});
  const [query, setQuery] = useState("");

  const visible = Boolean(module) && activeNav !== "Conversations";

  useEffect(() => {
    if (!visible || !module || activeNav === "Tasks & Automation" || activeNav === "JARVIS Runtime") return;
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
      ? { title: `Research: ${q}`, description: "Web Research mit Zusammenfassung", endpoint: `/api/research/answer?q=${encodeURIComponent(q)}&limit=6` }
      : { title: `Suche: ${q}`, description: "Knowledge Suche", endpoint: `/knowledge/search?q=${encodeURIComponent(q)}&limit=8` };
    await runEndpoint(endpoint);
  }

  const primaryData = useMemo(() => {
    const ok = Object.values(results).find((item) => item.status === "ok");
    return ok?.data;
  }, [results]);

  if (activeNav === "JARVIS Runtime") {
    return <RuntimeControlPanel onSend={onSend} />;
  }

  if (!visible || !module) return null;

  if (activeNav === "Tasks & Automation") {
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
        <button onClick={() => module.endpoints.forEach((endpoint) => void runEndpoint(endpoint))}>ALLE PRÜFEN</button>
      </div>

      <div className="jv-module-grid">
        <div className="jv-module-card jv-module-card-wide">
          <div className="jv-module-card-title">
            <h2>Funktionsordner</h2>
            <span>{module.endpoints.length} Endpoints</span>
          </div>
          <div className="jv-folder-strip">
            {module.endpoints.map((endpoint) => {
              const result = results[endpoint.title];
              return (
                <button key={endpoint.title} className={`jv-folder ${result?.status || "idle"}`} onClick={() => void runEndpoint(endpoint)}>
                  <b>{endpoint.title}</b>
                  <span>{endpoint.description}</span>
                  <em>{result?.status === "ok" ? countHint(result.data) : result?.status === "error" ? "Fehler" : result?.status === "loading" ? "Lädt" : endpoint.endpoint}</em>
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
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={module.searchMode === "research" ? "Web Research..." : "Knowledge Suche..."} onKeyDown={(e) => e.key === "Enter" && runSearch()} />
            <button onClick={runSearch}>{module.searchMode === "research" ? "RESEARCH" : "SUCHEN"}</button>
          </div>
        </div>

        <div className="jv-module-card jv-module-result">
          <div className="jv-module-card-title"><h2>Live Ergebnis</h2><span>{Object.values(results).filter((x) => x.status === "ok").length} OK</span></div>
          <pre>{pretty(primaryData || results)}</pre>
        </div>
      </div>
    </section>
  );
}
