import type {
  ActionRequest,
  AwarenessLoopState,
  AwarenessSnapshot,
  AwarenessStatus,
  Fact,
  Goal,
  RuntimePanelData,
  RuntimeStatus,
  Sidecar,
  Workflow,
} from "./runtimeTypes";

export async function runtimeApi<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers || {}),
    },
  });
  const text = await response.text();
  let data: unknown = text;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    // Keep raw text if the endpoint returns plain text.
  }
  if (!response.ok) {
    throw new Error(typeof data === "string" ? data : JSON.stringify(data));
  }
  return data as T;
}

export async function loadRuntimePanelData(): Promise<{
  data: RuntimePanelData;
  awarenessStatus: AwarenessStatus;
}> {
  const [status, facts, actions, goals, workflows, sidecars, awarenessStatus] = await Promise.all([
    runtimeApi<RuntimeStatus>("/api/runtime/status"),
    runtimeApi<{ facts: Fact[] }>("/api/runtime/memory/facts?limit=12"),
    runtimeApi<{ actions: ActionRequest[] }>("/api/runtime/actions?limit=12"),
    runtimeApi<{ goals: Goal[] }>("/api/runtime/goals?limit=12"),
    runtimeApi<{ workflows: Workflow[] }>("/api/runtime/workflows?limit=12"),
    runtimeApi<{ sidecars: Sidecar[] }>("/api/runtime/sidecars?limit=12"),
    runtimeApi<AwarenessStatus>("/api/runtime/awareness/current"),
  ]);

  return {
    data: {
      status,
      facts: facts.facts || [],
      actions: actions.actions || [],
      goals: goals.goals || [],
      workflows: workflows.workflows || [],
      sidecars: sidecars.sidecars || [],
    },
    awarenessStatus,
  };
}

export function addRuntimeFact(factText: string) {
  return runtimeApi("/api/runtime/memory/facts", {
    method: "POST",
    body: JSON.stringify({
      fact_text: factText,
      source_type: "ui",
      importance: 4,
      tags: ["ui"],
    }),
  });
}

export function addRuntimeGoal(title: string) {
  return runtimeApi("/api/runtime/goals", {
    method: "POST",
    body: JSON.stringify({
      type: "objective",
      title,
      description: "Über das JARVIS Runtime Panel erstellt",
    }),
  });
}

export function captureRuntimeAwareness(): Promise<AwarenessSnapshot> {
  return runtimeApi<AwarenessSnapshot>("/api/runtime/awareness/capture", { method: "POST" });
}

export function startRuntimeAwarenessLoop(intervalSeconds: number): Promise<{ loop: AwarenessLoopState }> {
  return runtimeApi<{ loop: AwarenessLoopState }>("/api/runtime/awareness/loop/start", {
    method: "POST",
    body: JSON.stringify({ interval_seconds: intervalSeconds }),
  });
}

export function stopRuntimeAwarenessLoop(): Promise<{ loop: AwarenessLoopState }> {
  return runtimeApi<{ loop: AwarenessLoopState }>("/api/runtime/awareness/loop/stop", { method: "POST" });
}

export function runRuntimeAction(tool_id: string, payload: Record<string, unknown> = {}) {
  return runtimeApi<unknown>("/api/runtime/action-engine/run", {
    method: "POST",
    body: JSON.stringify({ tool_id, payload }),
  });
}

export function executeRuntimeAction(actionId: string) {
  return runtimeApi<unknown>(`/api/runtime/actions/${actionId}/execute`, { method: "POST" });
}

export function approveRuntimeAction(actionId: string, approve: boolean) {
  return runtimeApi(`/api/runtime/actions/${actionId}/${approve ? "approve" : "reject"}`, { method: "POST" });
}

export function createDemoRuntimeWorkflow(name: string) {
  return runtimeApi("/api/runtime/workflows", {
    method: "POST",
    body: JSON.stringify({
      name,
      description: "Demo Workflow mit Memory Write und Goal Update",
      trigger: { type: "manual" },
      nodes: [
        { id: "memory_1", type: "memory_write", config: { fact: `Workflow ${name} wurde erfolgreich aus dem Runtime Panel erstellt.`, importance: 3 } },
        { id: "goal_1", type: "goal_update", config: { title: `Review ${name}` } },
      ],
      edges: [],
      authority_policy: "high_requires_approval",
    }),
  });
}

export function runRuntimeWorkflow(workflowId: string) {
  return runtimeApi(`/api/runtime/workflows/${workflowId}/run`, {
    method: "POST",
    body: JSON.stringify({ input: { source: "runtime_panel" } }),
  });
}

export function registerRuntimeSidecar(name: string) {
  const machineId = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "local-windows-pc";
  return runtimeApi("/api/runtime/sidecars/register", {
    method: "POST",
    body: JSON.stringify({
      machine_id: machineId,
      name: name || "Local Windows PC",
      capabilities: ["terminal", "filesystem", "browser", "desktop", "screenshot", "clipboard"],
      token_hint: "local-dev",
    }),
  });
}
