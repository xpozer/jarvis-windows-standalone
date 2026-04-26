import { useEffect, useMemo, useState } from "react";
import {
  addRuntimeFact,
  addRuntimeGoal,
  approveRuntimeAction,
  captureRuntimeAwareness,
  createDemoRuntimeWorkflow,
  executeRuntimeAction,
  loadRuntimePanelData,
  registerRuntimeSidecar,
  runRuntimeAction,
  runRuntimeWorkflow,
  startRuntimeAwarenessLoop,
  stopRuntimeAwarenessLoop,
} from "../features/runtime/runtimeApi";
import type {
  ActionRequest,
  AwarenessLoopState,
  AwarenessSnapshot,
  RuntimePanelData,
  Workflow,
} from "../features/runtime/runtimeTypes";
import "./runtime-control-panel.css";

type Props = { onSend: (message: string) => void };

function safeCount(value: unknown) {
  return typeof value === "number" ? value : 0;
}

function prettyDate(value?: string | null) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function pct(value?: number) {
  return typeof value === "number" ? `${Math.round(value * 100)}%` : "n/a";
}

function pretty(value: unknown) {
  if (value === undefined || value === null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function RuntimeControlPanel({ onSend }: Props) {
  const [data, setData] = useState<RuntimePanelData>({ facts: [], actions: [], goals: [], workflows: [], sidecars: [] });
  const [awareness, setAwareness] = useState<AwarenessSnapshot | null>(null);
  const [loop, setLoop] = useState<AwarenessLoopState | null>(null);
  const [loading, setLoading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [loopBusy, setLoopBusy] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [error, setError] = useState("");
  const [factText, setFactText] = useState("");
  const [goalTitle, setGoalTitle] = useState("");
  const [workflowName, setWorkflowName] = useState("Morning Review Demo");
  const [sidecarName, setSidecarName] = useState("Julien Windows PC");
  const [awarenessInterval, setAwarenessInterval] = useState(10);
  const [actionPath, setActionPath] = useState("");
  const [actionUrl, setActionUrl] = useState("https://github.com/xpozer/jarvis-windows-standalone");
  const [actionResult, setActionResult] = useState<unknown>(null);

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const result = await loadRuntimePanelData();
      setData(result.data);
      const payload = result.awarenessStatus.current?.current?.payload || result.data.status?.awareness_runtime?.current?.current?.payload || null;
      const loopState = result.awarenessStatus.loop || result.data.status?.awareness_runtime?.loop || null;
      if (payload) setAwareness(payload);
      if (loopState) {
        setLoop(loopState);
        if (typeof loopState.interval_seconds === "number") setAwarenessInterval(loopState.interval_seconds);
      }
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

  async function runAction(tool_id: string, payload: Record<string, unknown> = {}) {
    setActionBusy(true);
    setError("");
    try {
      const result = await runRuntimeAction(tool_id, payload);
      setActionResult(result);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionBusy(false);
    }
  }

  async function executeAction(action: ActionRequest) {
    setActionBusy(true);
    setError("");
    try {
      const result = await executeRuntimeAction(action.id);
      setActionResult(result);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionBusy(false);
    }
  }

  async function captureAwareness() {
    setCapturing(true);
    setError("");
    try {
      const snapshot = await captureRuntimeAwareness();
      setAwareness(snapshot);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setCapturing(false);
    }
  }

  async function startAwarenessLoop() {
    setLoopBusy(true);
    setError("");
    try {
      const result = await startRuntimeAwarenessLoop(awarenessInterval);
      setLoop(result.loop);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoopBusy(false);
    }
  }

  async function stopAwarenessLoop() {
    setLoopBusy(true);
    setError("");
    try {
      const result = await stopRuntimeAwarenessLoop();
      setLoop(result.loop);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoopBusy(false);
    }
  }

  async function addFact() {
    const clean = factText.trim();
    if (!clean) return;
    await addRuntimeFact(clean);
    setFactText("");
    await refresh();
  }

  async function addGoal() {
    const clean = goalTitle.trim();
    if (!clean) return;
    await addRuntimeGoal(clean);
    setGoalTitle("");
    await refresh();
  }

  async function createDemoWorkflow() {
    const clean = workflowName.trim() || "Runtime Demo Workflow";
    await createDemoRuntimeWorkflow(clean);
    await refresh();
  }

  async function runWorkflow(workflow: Workflow) {
    await runRuntimeWorkflow(workflow.id);
    await refresh();
  }

  async function registerSidecar() {
    await registerRuntimeSidecar(sidecarName);
    await refresh();
  }

  async function approve(action: ActionRequest, approveAction: boolean) {
    await approveRuntimeAction(action.id, approveAction);
    await refresh();
  }

  const cards = useMemo(() => {
    const status = data.status;
    return [
      { label: "Memory", value: safeCount(status?.primitives?.memory?.facts), sub: "Fakten" },
      { label: "Awareness", value: safeCount(status?.primitives?.awareness?.events), sub: loop?.enabled ? "Loop aktiv" : "Events" },
      { label: "Actions", value: safeCount(status?.primitives?.action?.pending_approval), sub: "offen" },
      { label: "Agents", value: safeCount(status?.primitives?.orchestration?.agents), sub: "Rollen" },
      { label: "Workflows", value: safeCount(status?.workflow_runtime?.workflows), sub: "gespeichert" },
      { label: "Sidecars", value: safeCount(status?.workflow_runtime?.sidecars), sub: "Maschinen" },
    ];
  }, [data.status, loop?.enabled]);

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
          <button onClick={() => void captureAwareness()}>{capturing ? "CAPTURING" : "CAPTURE AWARENESS"}</button>
          <button onClick={() => void refresh()}>{loading ? "LÄDT" : "REFRESH"}</button>
        </div>
      </div>

      {error && <div className="runtime-control-error">{error}</div>}

      <div className="runtime-control-stat-grid">
        {cards.map((card) => <div className="runtime-control-stat" key={card.label}><span>{card.label}</span><b>{card.value}</b><em>{card.sub}</em></div>)}
      </div>

      <div className="runtime-control-grid runtime-control-grid-awareness">
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

        <section className="runtime-control-card runtime-awareness-card">
          <div className="runtime-control-card-title"><h2>Awareness</h2><span>{loop?.enabled ? "loop active" : "local snapshot"}</span></div>
          <div className="runtime-awareness-live">
            <b>{awareness?.active_window?.process_name || "Noch kein Snapshot"}</b>
            <span>{awareness?.active_window?.window_title || "Klicke Capture Awareness oder starte den Loop, um aktives Fenster und Kontext lokal zu erfassen."}</span>
            <em>{awareness?.activity?.category || "idle"} · confidence {pct(awareness?.activity?.confidence)}</em>
          </div>
          <div className="runtime-awareness-loop">
            <input type="number" min={3} max={120} value={awarenessInterval} onChange={(e) => setAwarenessInterval(Number(e.target.value || 10))} />
            <button onClick={() => void startAwarenessLoop()}>{loopBusy ? "..." : "START LOOP"}</button>
            <button onClick={() => void stopAwarenessLoop()}>{loopBusy ? "..." : "STOP"}</button>
          </div>
          <div className="runtime-awareness-meta">
            <div><span>Loop</span><b>{loop?.enabled ? "on" : "off"}</b></div>
            <div><span>Captures</span><b>{loop?.captures ?? 0}</b></div>
            <div><span>Last</span><b>{prettyDate(loop?.last_capture_at) || "n/a"}</b></div>
            <div><span>OCR</span><b>{awareness?.privacy?.ocr_enabled ? "on" : "off"}</b></div>
          </div>
        </section>

        <section className="runtime-control-card runtime-action-card">
          <div className="runtime-control-card-title"><h2>Action Engine</h2><span>level 1 safe tools</span></div>
          <div className="runtime-action-toolbar">
            <button onClick={() => void runAction("system.info")}>{actionBusy ? "..." : "SYSTEM"}</button>
            <button onClick={() => void runAction("git.status")}>GIT STATUS</button>
            <button onClick={() => void runAction("git.branch")}>BRANCH</button>
            <button onClick={() => void runAction("process.list", { limit: 25 })}>PROCESSES</button>
          </div>
          <div className="runtime-control-form runtime-action-path">
            <input value={actionPath} onChange={(e) => setActionPath(e.target.value)} placeholder="Pfad optional, leer = Projektordner" />
            <button onClick={() => void runAction("filesystem.list_dir", { path: actionPath || undefined, limit: 60 })}>LIST</button>
          </div>
          <div className="runtime-control-form runtime-action-path">
            <input value={actionUrl} onChange={(e) => setActionUrl(e.target.value)} placeholder="URL für Browser Action" />
            <button onClick={() => void runAction("browser.open_url", { url: actionUrl })}>PREPARE URL</button>
          </div>
          <pre className="runtime-action-result">{actionResult ? pretty(actionResult) : "Noch kein Action Ergebnis."}</pre>
        </section>

        <section className="runtime-control-card">
          <div className="runtime-control-card-title"><h2>Authority Gate</h2><span>pending actions</span></div>
          <div className="runtime-control-list compact">
            {data.actions.map((action) => <article key={action.id} className={`risk-${action.risk}`}><b>{action.action_type}</b><span>{action.summary}</span><em>{action.risk} · {action.status}</em>{action.status === "pending_approval" && <div className="runtime-control-row-actions"><button onClick={() => void approve(action, true)}>APPROVE</button><button onClick={() => void approve(action, false)}>REJECT</button></div>}{action.status === "approved" && <div className="runtime-control-row-actions"><button onClick={() => void executeAction(action)}>EXECUTE</button></div>}</article>)}
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
