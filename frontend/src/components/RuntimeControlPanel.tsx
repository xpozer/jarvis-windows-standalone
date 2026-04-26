import { useEffect, useMemo, useState } from "react";
import "./runtime-control-panel.css";

type RuntimeStatus = {
  ok?: boolean;
  primitives?: Record<string, { status?: string; facts?: number; events?: number; requests?: number; pending_approval?: number; agents?: number }>;
  workflow_runtime?: { workflows?: number; runs?: number; sidecars?: number; self_healing?: string; authority_gating?: string; nodes?: { count?: number } };
  goals?: number;
  workflow_nodes?: number;
  authority_gating?: string;
  local_first?: boolean;
};

type Fact = { id: string; fact_text: string; source_type?: string; importance?: number; confidence?: number; created_at?: string; tags?: string[] };
type ActionRequest = { id: string; action_type: string; summary: string; risk: string; status: string; created_at?: string };
type Goal = { id: string; type: string; title: string; status: string; score?: number; due_date?: string | null };
type Workflow = { id: string; name: string; description?: string; enabled?: boolean; trigger?: unknown; nodes?: unknown[]; authority_policy?: string };
type Sidecar = { id: string; machine_id: string; name: string; status: string; capabilities?: string[]; last_seen_at?: string };

type PanelData = {
  status?: RuntimeStatus;
  facts: Fact[];
  actions: ActionRequest[];
  goals: Goal[];
  workflows: Workflow[];
  sidecars: Sidecar[];
};

type Props = {
  onSend: (message: string) => void;
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
  });
  const text = await response.text();
  let data: unknown = text;
  try { data = text ? JSON.parse(text) : {}; } catch {}
  if (!response.ok) throw new Error(typeof data === "string" ? data : JSON.stringify(data));
  return data as T;
}

function safeCount(value: unknown) {
  return typeof value === "number" ? value : 0;
}

function prettyDate(value?: string) {
  if (!value) return "";
  try { return new Date(value).toLocaleString(); } catch { return value; }
}

export function RuntimeControlPanel({ onSend }: Props) {
  const [data, setData] = useState<PanelData>({ facts: [], actions: [], goals: [], workflows: [], sidecars: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [factText, setFactText] = useState("");
  const [goalTitle, setGoalTitle] = useState("");
  const [workflowName, setWorkflowName] = useState("Morning Review Demo");
  const [sidecarName, setSidecarName] = useState("Julien Windows PC");

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const [status, facts, actions, goals, workflows, sidecars] = await Promise.all([
        api<RuntimeStatus>("/api/runtime/status"),
        api<{ facts: Fact[] }>("/api/runtime/memory/facts?limit=12"),
        api<{ actions: ActionRequest[] }>("/api/runtime/actions?limit=12"),
        api<{ goals: Goal[] }>("/api/runtime/goals?limit=12"),
        api<{ workflows: Workflow[] }>("/api/runtime/workflows?limit=12"),
        api<{ sidecars: Sidecar[] }>("/api/runtime/sidecars?limit=12"),
      ]);
      setData({ status, facts: facts.facts || [], actions: actions.actions || [], goals: goals.goals || [], workflows: workflows.workflows || [], sidecars: sidecars.sidecars || [] });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), 6000);
    return () => window.clearInterval(id);
  }, []);

  async function addFact() {
    const clean = factText.trim();
    if (!clean) return;
    await api("/api/runtime/memory/facts", { method: "POST", body: JSON.stringify({ fact_text: clean, source_type: "ui", importance: 4, tags: ["ui"] }) });
    setFactText("");
    await refresh();
  }

  async function addGoal() {
    const clean = goalTitle.trim();
    if (!clean) return;
    await api("/api/runtime/goals", { method: "POST", body: JSON.stringify({ type: "objective", title: clean, description: "Über das JARVIS Runtime Panel erstellt" }) });
    setGoalTitle("");
    await refresh();
  }

  async function createDemoWorkflow() {
    const clean = workflowName.trim() || "Runtime Demo Workflow";
    await api("/api/runtime/workflows", {
      method: "POST",
      body: JSON.stringify({
        name: clean,
        description: "Demo Workflow mit Memory Write und Goal Update",
        trigger: { type: "manual" },
        nodes: [
          { id: "memory_1", type: "memory_write", config: { fact: `Workflow ${clean} wurde erfolgreich aus dem Runtime Panel erstellt.`, importance: 3 } },
          { id: "goal_1", type: "goal_update", config: { title: `Review ${clean}` } },
        ],
        edges: [],
        authority_policy: "high_requires_approval",
      }),
    });
    await refresh();
  }

  async function runWorkflow(workflow: Workflow) {
    await api(`/api/runtime/workflows/${workflow.id}/run`, { method: "POST", body: JSON.stringify({ input: { source: "runtime_panel" } }) });
    await refresh();
  }

  async function registerSidecar() {
    const machineId = sidecarName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "local-windows-pc";
    await api("/api/runtime/sidecars/register", {
      method: "POST",
      body: JSON.stringify({ machine_id: machineId, name: sidecarName || "Local Windows PC", capabilities: ["terminal", "filesystem", "browser", "desktop", "screenshot", "clipboard"], token_hint: "local-dev" }),
    });
    await refresh();
  }

  async function approve(action: ActionRequest, approveAction: boolean) {
    await api(`/api/runtime/actions/${action.id}/${approveAction ? "approve" : "reject"}`, { method: "POST" });
    await refresh();
  }

  const cards = useMemo(() => {
    const status = data.status;
    return [
      { label: "Memory", value: safeCount(status?.primitives?.memory?.facts), sub: "Fakten" },
      { label: "Awareness", value: safeCount(status?.primitives?.awareness?.events), sub: "Events" },
      { label: "Actions", value: safeCount(status?.primitives?.action?.pending_approval), sub: "offen" },
      { label: "Agents", value: safeCount(status?.primitives?.orchestration?.agents), sub: "Rollen" },
      { label: "Workflows", value: safeCount(status?.workflow_runtime?.workflows), sub: "gespeichert" },
      { label: "Sidecars", value: safeCount(status?.workflow_runtime?.sidecars), sub: "Maschinen" },
    ];
  }, [data.status]);

  return (
    <section className="runtime-control-shell">
      <div className="runtime-control-header">
        <div>
          <small>LOCAL USEJARVIS CORE</small>
          <h1>JARVIS Runtime</h1>
          <p>Memory, Awareness, Actions, Orchestration, Workflows, Goals und Sidecars als lokale Kontrollzentrale.</p>
        </div>
        <div className="runtime-control-actions">
          <button onClick={() => onSend("Fasse mir den aktuellen JARVIS Runtime Status zusammen")}>ASK JARVIS</button>
          <button onClick={() => void refresh()}>{loading ? "LÄDT" : "REFRESH"}</button>
        </div>
      </div>

      {error && <div className="runtime-control-error">{error}</div>}

      <div className="runtime-control-stat-grid">
        {cards.map((card) => <div className="runtime-control-stat" key={card.label}><span>{card.label}</span><b>{card.value}</b><em>{card.sub}</em></div>)}
      </div>

      <div className="runtime-control-grid">
        <section className="runtime-control-card runtime-control-card-tall">
          <div className="runtime-control-card-title"><h2>Memory</h2><span>semantic facts</span></div>
          <div className="runtime-control-form">
            <input value={factText} onChange={(e) => setFactText(e.target.value)} placeholder="Fakt speichern, z.B. JARVIS soll lokal first bleiben" onKeyDown={(e) => e.key === "Enter" && addFact()} />
            <button onClick={() => void addFact()}>SAVE</button>
          </div>
          <div className="runtime-control-list">
            {data.facts.map((fact) => <article key={fact.id}><b>{fact.fact_text}</b><span>{fact.source_type} · importance {fact.importance ?? 0} · {prettyDate(fact.created_at)}</span></article>)}
            {!data.facts.length && <p className="runtime-control-empty">Noch keine Fakten gespeichert.</p>}
          </div>
        </section>

        <section className="runtime-control-card">
          <div className="runtime-control-card-title"><h2>Authority Gate</h2><span>pending actions</span></div>
          <div className="runtime-control-list compact">
            {data.actions.map((action) => <article key={action.id} className={`risk-${action.risk}`}><b>{action.action_type}</b><span>{action.summary}</span><em>{action.risk} · {action.status}</em>{action.status === "pending_approval" && <div className="runtime-control-row-actions"><button onClick={() => void approve(action, true)}>APPROVE</button><button onClick={() => void approve(action, false)}>REJECT</button></div>}</article>)}
            {!data.actions.length && <p className="runtime-control-empty">Keine Actions vorhanden.</p>}
          </div>
        </section>

        <section className="runtime-control-card">
          <div className="runtime-control-card-title"><h2>Goals</h2><span>okr basis</span></div>
          <div className="runtime-control-form">
            <input value={goalTitle} onChange={(e) => setGoalTitle(e.target.value)} placeholder="Objective anlegen" onKeyDown={(e) => e.key === "Enter" && addGoal()} />
            <button onClick={() => void addGoal()}>ADD</button>
          </div>
          <div className="runtime-control-list compact">
            {data.goals.map((goal) => <article key={goal.id}><b>{goal.title}</b><span>{goal.type} · {goal.status}</span></article>)}
            {!data.goals.length && <p className="runtime-control-empty">Noch keine Goals.</p>}
          </div>
        </section>

        <section className="runtime-control-card runtime-control-card-wide">
          <div className="runtime-control-card-title"><h2>Workflows</h2><span>self healing runner</span></div>
          <div className="runtime-control-form">
            <input value={workflowName} onChange={(e) => setWorkflowName(e.target.value)} placeholder="Workflow Name" />
            <button onClick={() => void createDemoWorkflow()}>CREATE DEMO</button>
          </div>
          <div className="runtime-control-list workflow-list">
            {data.workflows.map((workflow) => <article key={workflow.id}><b>{workflow.name}</b><span>{workflow.description || "Kein Beschreibungstext"}</span><em>{workflow.enabled ? "enabled" : "disabled"} · {workflow.authority_policy}</em><div className="runtime-control-row-actions"><button onClick={() => void runWorkflow(workflow)}>RUN</button></div></article>)}
            {!data.workflows.length && <p className="runtime-control-empty">Noch keine Workflows. Erstelle einen Demo Workflow.</p>}
          </div>
        </section>

        <section className="runtime-control-card">
          <div className="runtime-control-card-title"><h2>Sidecars</h2><span>multi machine</span></div>
          <div className="runtime-control-form">
            <input value={sidecarName} onChange={(e) => setSidecarName(e.target.value)} placeholder="Maschinenname" />
            <button onClick={() => void registerSidecar()}>REGISTER</button>
          </div>
          <div className="runtime-control-list compact">
            {data.sidecars.map((sidecar) => <article key={sidecar.id}><b>{sidecar.name}</b><span>{sidecar.machine_id} · {sidecar.status}</span><em>{(sidecar.capabilities || []).join(", ")}</em></article>)}
            {!data.sidecars.length && <p className="runtime-control-empty">Noch keine Sidecars registriert.</p>}
          </div>
        </section>
      </div>
    </section>
  );
}
