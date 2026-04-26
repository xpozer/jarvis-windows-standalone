import { useEffect, useMemo, useState } from "react";
import "./agent-tools.css";

type Mode = "agents" | "core" | "tools" | "api";

type Agent = {
  id: string;
  name: string;
  role?: string;
  status?: string;
  last_action?: string | null;
  last_ts?: string | null;
  error_count?: number;
  call_count?: number;
  risk_level?: string;
  tools?: string[];
  capabilities?: string[];
};

type Tool = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  risk_level?: string;
  requires_confirmation?: boolean;
  input_schema?: Record<string, string>;
  enabled?: boolean;
  last_used?: string | null;
  error_count?: number;
  call_count?: number;
};

type Props = {
  activeNav: string;
  onSend: (message: string) => void;
};

type LoadState = "idle" | "loading" | "ok" | "error";

const modeByNav: Record<string, Mode> = {
  Agentennetz: "agents",
  Kernsysteme: "core",
  "Code-Werkzeuge": "tools",
  Datenanalyse: "tools",
  "API-Konsole": "api",
};

function pretty(value: unknown) {
  if (value === undefined) return "";
  if (typeof value === "string") return value;
  try { return JSON.stringify(value, null, 2); } catch { return String(value); }
}

async function requestJson(url: string, options?: RequestInit) {
  const response = await fetch(url, { cache: "no-store", ...options });
  const text = await response.text();
  let data: unknown = text;
  try { data = text ? JSON.parse(text) : {}; } catch {}
  if (!response.ok) {
    const detail = data && typeof data === "object" && "detail" in data ? String((data as { detail: unknown }).detail) : text || `HTTP ${response.status}`;
    throw new Error(detail);
  }
  return data;
}

function listFrom<T>(data: unknown, keys: string[]): T[] {
  if (Array.isArray(data)) return data as T[];
  if (!data || typeof data !== "object") return [];
  const obj = data as Record<string, unknown>;
  for (const key of keys) {
    if (Array.isArray(obj[key])) return obj[key] as T[];
  }
  return [];
}

function statusClass(value?: string) {
  const v = (value || "unknown").toLowerCase();
  if (["ok", "online", "idle", "ready", "done"].includes(v)) return "ok";
  if (["warn", "warning", "busy", "loading", "running"].includes(v)) return "warn";
  if (["error", "failed", "offline"].includes(v)) return "error";
  return "unknown";
}

function riskClass(tool?: Pick<Tool, "risk_level" | "requires_confirmation">) {
  if (tool?.requires_confirmation) return "risk";
  const risk = (tool?.risk_level || "unknown").toLowerCase();
  if (risk === "high") return "risk";
  if (risk === "medium") return "warn";
  if (risk === "low") return "ok";
  return "unknown";
}

function defaultsFor(tool: Tool) {
  const schema = tool.input_schema || {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema)) {
    const lower = `${key} ${value}`.toLowerCase();
    if (key === "query" || key === "q") out[key] = "jarvis";
    else if (key === "limit") out[key] = 5;
    else if (key === "filename") out[key] = "jarvis-output.txt";
    else if (key === "content") out[key] = "Text aus JARVIS";
    else if (key === "label") out[key] = "manual";
    else if (lower.includes("int")) out[key] = 1;
    else if (lower.includes("dict")) out[key] = {};
    else out[key] = "";
  }
  return out;
}

function navTitle(mode: Mode) {
  if (mode === "agents") return ["KI Kern", "Agentennetz"];
  if (mode === "core") return ["Kern", "Agenten & Werkzeuge"];
  if (mode === "api") return ["Entwicklung", "API-Konsole"];
  return ["Werkzeuge", "Werkzeugverzeichnis"];
}

export function AgentToolsPanel({ activeNav, onSend }: Props) {
  const mode = modeByNav[activeNav] || "tools";
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [matrix, setMatrix] = useState<unknown>(null);
  const [orchestrators, setOrchestrators] = useState<unknown>(null);
  const [pending, setPending] = useState<unknown[]>([]);
  const [status, setStatus] = useState<LoadState>("idle");
  const [error, setError] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [selectedTool, setSelectedTool] = useState<string>("");
  const [category, setCategory] = useState("alle");
  const [argsText, setArgsText] = useState("{}");
  const [riskAccepted, setRiskAccepted] = useState(false);
  const [result, setResult] = useState<unknown>(null);

  const [folder, title] = navTitle(mode);
  const selectedAgentData = agents.find((agent) => agent.id === selectedAgent) || agents[0];
  const selectedToolData = tools.find((tool) => tool.id === selectedTool) || tools[0];
  const categories = useMemo(() => ["alle", ...Array.from(new Set(tools.map((tool) => tool.category || "sonstige"))).sort()], [tools]);
  const visibleTools = useMemo(() => {
    const filtered = category === "alle" ? tools : tools.filter((tool) => (tool.category || "sonstige") === category);
    if (activeNav === "Datenanalyse") return filtered.filter((tool) => ["file", "knowledge"].includes(tool.category || ""));
    if (activeNav === "Code-Werkzeuge") return filtered.filter((tool) => ["file", "system", "knowledge", "work", "automation"].includes(tool.category || ""));
    return filtered;
  }, [activeNav, category, tools]);
  const riskySelected = Boolean(selectedToolData && (selectedToolData.requires_confirmation || selectedToolData.risk_level === "high"));

  async function loadAll() {
    setStatus("loading");
    setError("");
    try {
      const [agentsData, toolsData, matrixData, orchData, pendingData] = await Promise.all([
        requestJson("/agents/registry"),
        requestJson("/tools/registry/full"),
        requestJson("/agents/matrix"),
        requestJson("/orchestrate/agents"),
        requestJson("/actions/pending"),
      ]);
      const nextAgents = listFrom<Agent>(agentsData, ["agents", "items", "results"]);
      const nextTools = listFrom<Tool>(toolsData, ["tools", "items", "results"]);
      setAgents(nextAgents);
      setTools(nextTools);
      setMatrix(matrixData);
      setOrchestrators(orchData);
      setPending(listFrom(pendingData, ["actions", "items", "results"]));
      if (!selectedAgent && nextAgents[0]) setSelectedAgent(nextAgents[0].id);
      if (!selectedTool && nextTools[0]) {
        setSelectedTool(nextTools[0].id);
        setArgsText(pretty(defaultsFor(nextTools[0])));
      }
      setStatus("ok");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  useEffect(() => {
    void loadAll();
  }, [activeNav]);

  useEffect(() => {
    if (selectedToolData) {
      setArgsText(pretty(defaultsFor(selectedToolData)));
      setRiskAccepted(false);
    }
  }, [selectedTool]);

  async function testAgent(agent: Agent) {
    setResult({ status: "Teste", agent: agent.id });
    const data = await requestJson(`/agents/registry/${encodeURIComponent(agent.id)}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "idle", last_action: "UI Test", error: false }),
    });
    setResult(data);
    await loadAll();
  }

  async function runTool() {
    if (!selectedToolData) return;
    let args: Record<string, unknown> = {};
    try {
      args = argsText.trim() ? JSON.parse(argsText) : {};
    } catch {
      setResult({ ok: false, error: "Parameter sind kein gueltiges JSON." });
      return;
    }
    if (riskySelected && !riskAccepted) {
      setResult({ ok: false, error: "Riskante Werkzeuge brauchen zuerst die sichtbare Bestaetigung." });
      return;
    }
    setResult({ status: "Laeuft", tool_id: selectedToolData.id });
    const data = await requestJson("/tools/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tool_id: selectedToolData.id, args }),
    });
    setResult(data);
    setRiskAccepted(false);
    await loadAll();
  }

  const showAgents = mode === "agents" || mode === "core";
  const showTools = mode === "tools" || mode === "core" || mode === "api";

  return (
    <section className="jv-agent-tools-shell">
      <div className="jv-agent-tools-header">
        <div>
          <small>{folder}</small>
          <h1>{title}</h1>
          <p>Agenten, Faehigkeiten, Werkzeugverzeichnis und sichere Ausfuehrung als produktive Arbeitsflaeche.</p>
        </div>
        <div className="jv-agent-tools-actions">
          <button onClick={loadAll}>{status === "loading" ? "LAEDT" : "AKTUALISIEREN"}</button>
          <button onClick={() => onSend("Pruefe Agentenverzeichnis und Werkzeugverzeichnis")}>CHAT PRUEFUNG</button>
        </div>
      </div>

      {error && <div className="jv-at-error">{error}</div>}

      <div className="jv-at-summary">
        <div><b>{agents.length}</b><span>Agenten</span></div>
        <div><b>{tools.length}</b><span>Werkzeuge</span></div>
        <div><b>{tools.filter((tool) => tool.requires_confirmation || tool.risk_level === "high").length}</b><span>riskant</span></div>
        <div><b>{pending.length}</b><span>offen</span></div>
      </div>

      <div className={`jv-at-grid ${showAgents && showTools ? "" : "single"}`}>
        {showAgents && (
          <section className="jv-at-card">
            <div className="jv-at-title"><h2>Agentenstatus</h2><span>{agents.length}</span></div>
            <div className="jv-at-list">
              {agents.map((agent) => (
                <button key={agent.id} className={`jv-agent-row ${statusClass(agent.status)} ${selectedAgentData?.id === agent.id ? "active" : ""}`} onClick={() => setSelectedAgent(agent.id)}>
                  <div><b>{agent.name}</b><span>{agent.id} · {agent.risk_level || "unbekannt"}</span></div>
                  <em>{agent.status || "unbekannt"}</em>
                  <p>{agent.last_action || agent.role || "Keine letzte Aktion."}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {showTools && (
          <section className="jv-at-card">
            <div className="jv-at-title">
              <h2>Werkzeugverzeichnis</h2>
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </div>
            <div className="jv-at-list">
              {visibleTools.map((tool) => (
                <button key={tool.id} className={`jv-tool-row ${riskClass(tool)} ${selectedToolData?.id === tool.id ? "active" : ""}`} onClick={() => setSelectedTool(tool.id)}>
                  <div><b>{tool.name}</b><span>{tool.id} · {tool.category || "sonstige"}</span></div>
                  <em>{tool.requires_confirmation ? "bestaetigen" : tool.risk_level || "sicher"}</em>
                  <p>{tool.description || "Keine Beschreibung."}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="jv-at-card jv-at-detail">
          <div className="jv-at-title"><h2>{showAgents ? "Agentendetails" : "Verzeichnisdetails"}</h2><span>Diagnose</span></div>
          {selectedAgentData && showAgents && (
            <div className="jv-at-agent-detail">
              <div className="jv-at-headline"><b>{selectedAgentData.name}</b><em className={statusClass(selectedAgentData.status)}>{selectedAgentData.status || "unbekannt"}</em></div>
              <p>{selectedAgentData.role}</p>
              <div className="jv-at-chips">
                {(selectedAgentData.capabilities || []).map((capability) => <span key={capability}>{capability}</span>)}
              </div>
              <div className="jv-at-buttons">
                <button onClick={() => void testAgent(selectedAgentData)}>TESTEN</button>
                <button onClick={() => onSend(`Nutze ${selectedAgentData.name}: ${selectedAgentData.role || ""}`)}>CHAT</button>
              </div>
            </div>
          )}

          {selectedToolData && showTools && (
            <div className="jv-at-tool-detail">
              <div className="jv-at-headline"><b>{selectedToolData.name}</b><em className={riskClass(selectedToolData)}>{selectedToolData.requires_confirmation ? "bestaetigen" : selectedToolData.risk_level || "unbekannt"}</em></div>
              <p>{selectedToolData.description}</p>
              <textarea value={argsText} onChange={(event) => setArgsText(event.target.value)} spellCheck={false} />
              {riskySelected && (
                <label className="jv-at-confirm">
                  <input type="checkbox" checked={riskAccepted} onChange={(event) => setRiskAccepted(event.target.checked)} />
                  Riskante Aktion bewusst nur vorbereiten.
                </label>
              )}
              <div className="jv-at-buttons">
                <button disabled={riskySelected && !riskAccepted} onClick={() => void runTool()}>{riskySelected ? "VORBEREITEN" : "AUSFUEHREN"}</button>
                <button onClick={() => onSend(`Erklaere mir das Werkzeug ${selectedToolData.name}`)}>CHAT</button>
              </div>
            </div>
          )}
        </section>

        <section className="jv-at-card jv-at-result">
          <div className="jv-at-title"><h2>Aktuelles Ergebnis</h2><span>{status}</span></div>
          <pre>{pretty(result || (mode === "api" ? { matrix, orchestrators, pending } : { selectedAgentData, selectedToolData }))}</pre>
        </section>
      </div>
    </section>
  );
}
