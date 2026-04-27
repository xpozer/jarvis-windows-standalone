import { useEffect, useMemo, useState } from "react";
import { ActionEngineCard } from "../features/runtime/ActionEngineCard";
import { AuthorityGateCard } from "../features/runtime/AuthorityGateCard";
import { AwarenessCard } from "../features/runtime/AwarenessCard";
import { GoalsCard } from "../features/runtime/GoalsCard";
import { MemoryCard } from "../features/runtime/MemoryCard";
import { SidecarsCard } from "../features/runtime/SidecarsCard";
import { WorkflowsCard } from "../features/runtime/WorkflowsCard";
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
import { safeCount } from "../features/runtime/runtimeFormat";
import type {
  ActionRequest,
  AwarenessLoopState,
  AwarenessSnapshot,
  RuntimePanelData,
  Workflow,
} from "../features/runtime/runtimeTypes";
import "./runtime-control-panel.css";

type Props = { onSend: (message: string) => void };

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
  const [mkdirPath, setMkdirPath] = useState("data/jarvis-test-folder");
  const [writePath, setWritePath] = useState("data/jarvis-test-folder/test.txt");
  const [writeContent, setWriteContent] = useState("Hallo von JARVIS Action Engine Level 2.");
  const [copySource, setCopySource] = useState("data/jarvis-test-folder/test.txt");
  const [copyDestination, setCopyDestination] = useState("data/jarvis-test-folder/test-copy.txt");
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

  async function runAction(toolId: string, payload: Record<string, unknown> = {}) {
    setActionBusy(true);
    setError("");
    try {
      const result = await runRuntimeAction(toolId, payload);
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
        <MemoryCard facts={data.facts} factText={factText} onFactTextChange={setFactText} onAddFact={addFact} />
        <AwarenessCard awareness={awareness} loop={loop} awarenessInterval={awarenessInterval} loopBusy={loopBusy} onAwarenessIntervalChange={setAwarenessInterval} onStartLoop={startAwarenessLoop} onStopLoop={stopAwarenessLoop} />
        <ActionEngineCard
          actionBusy={actionBusy}
          actionPath={actionPath}
          actionUrl={actionUrl}
          mkdirPath={mkdirPath}
          writePath={writePath}
          writeContent={writeContent}
          copySource={copySource}
          copyDestination={copyDestination}
          actionResult={actionResult}
          onActionPathChange={setActionPath}
          onActionUrlChange={setActionUrl}
          onMkdirPathChange={setMkdirPath}
          onWritePathChange={setWritePath}
          onWriteContentChange={setWriteContent}
          onCopySourceChange={setCopySource}
          onCopyDestinationChange={setCopyDestination}
          onRunAction={runAction}
        />
        <AuthorityGateCard actions={data.actions} onApprove={approve} onExecute={executeAction} />
        <GoalsCard goals={data.goals} goalTitle={goalTitle} onGoalTitleChange={setGoalTitle} onAddGoal={addGoal} />
        <WorkflowsCard workflows={data.workflows} workflowName={workflowName} onWorkflowNameChange={setWorkflowName} onCreateDemoWorkflow={createDemoWorkflow} onRunWorkflow={runWorkflow} />
        <SidecarsCard sidecars={data.sidecars} sidecarName={sidecarName} onSidecarNameChange={setSidecarName} onRegisterSidecar={registerSidecar} />
      </div>
    </section>
  );
}
