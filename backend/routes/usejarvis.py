from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services import usejarvis_runtime as rt
from services import usejarvis_workflow as wf

router = APIRouter(prefix="/api/runtime", tags=["usejarvis-runtime"])


class FactIn(BaseModel):
    fact_text: str = Field(min_length=1)
    source_type: str = "manual"
    source_ref: str | None = None
    confidence: float = 0.8
    importance: int = 3
    tags: list[str] = Field(default_factory=list)


class ExtractIn(BaseModel):
    text: str = Field(min_length=1)
    source_ref: str = "manual"


class AwarenessIn(BaseModel):
    event_type: str = Field(min_length=1)
    app_name: str | None = None
    window_title: str | None = None
    summary: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)


class ActionIn(BaseModel):
    action_type: str = Field(min_length=1)
    summary: str = Field(min_length=1)
    risk: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)


class GoalIn(BaseModel):
    type: str = "objective"
    title: str = Field(min_length=1)
    description: str | None = None
    parent_id: str | None = None
    due_date: str | None = None


class WorkflowIn(BaseModel):
    name: str = Field(min_length=1)
    description: str | None = None
    trigger: dict[str, Any] = Field(default_factory=lambda: {"type": "manual"})
    nodes: list[dict[str, Any]] = Field(default_factory=list)
    edges: list[dict[str, Any]] = Field(default_factory=list)
    authority_policy: str = "high_requires_approval"


class WorkflowRunIn(BaseModel):
    input: dict[str, Any] = Field(default_factory=dict)


class WorkflowEnabledIn(BaseModel):
    enabled: bool


class SidecarIn(BaseModel):
    machine_id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    capabilities: list[str] = Field(default_factory=list)
    token_hint: str | None = None


@router.get("/status")
def status():
    data = rt.runtime_status()
    data["workflow_runtime"] = wf.workflow_runtime_status()
    return data


@router.get("/memory/facts")
def memory_facts(limit: int = 25):
    return {"ok": True, "facts": rt.list_facts(limit=limit)}


@router.get("/memory/search")
def memory_search(q: str = "", limit: int = 10):
    return {"ok": True, "query": q, "facts": rt.search_facts(q=q, limit=limit)}


@router.post("/memory/facts")
def memory_add_fact(req: FactIn):
    try:
        return {"ok": True, "fact": rt.add_fact(req.fact_text, req.source_type, req.source_ref, req.confidence, req.importance, req.tags)}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/memory/extract")
def memory_extract(req: ExtractIn):
    return {"ok": True, "facts": rt.extract_facts_from_text(req.text, source_ref=req.source_ref)}


@router.delete("/memory/facts/{fact_id}")
def memory_delete_fact(fact_id: str):
    result = rt.delete_fact(fact_id)
    if not result.get("ok"):
        raise HTTPException(status_code=404, detail="Fact not found")
    return result


@router.get("/awareness/current")
def awareness_current():
    return rt.current_awareness()


@router.post("/awareness/events")
def awareness_event(req: AwarenessIn):
    return {"ok": True, "event": rt.set_awareness_event(req.event_type, req.app_name, req.window_title, req.summary, req.payload)}


@router.get("/actions")
def actions(limit: int = 25):
    return {"ok": True, "actions": rt.list_action_requests(limit=limit)}


@router.post("/actions")
def action_create(req: ActionIn):
    return {"ok": True, "action": rt.create_action_request(req.action_type, req.summary, req.payload, req.risk)}


@router.post("/actions/{action_id}/approve")
def action_approve(action_id: str):
    result = rt.approve_action(action_id, approve=True)
    if not result.get("ok"):
        raise HTTPException(status_code=404, detail="Action not found")
    return result


@router.post("/actions/{action_id}/reject")
def action_reject(action_id: str):
    result = rt.approve_action(action_id, approve=False)
    if not result.get("ok"):
        raise HTTPException(status_code=404, detail="Action not found")
    return result


@router.get("/goals")
def goals(limit: int = 50):
    return {"ok": True, "goals": rt.list_goals(limit=limit)}


@router.post("/goals")
def goal_create(req: GoalIn):
    return {"ok": True, "goal": rt.create_goal(req.type, req.title, req.description, req.parent_id, req.due_date)}


@router.get("/orchestration/agents")
def orchestration_agents():
    return {"ok": True, "agents": rt.agents()}


@router.get("/workflows/nodes")
def workflow_nodes():
    return rt.workflow_node_registry()


@router.get("/workflows")
def workflows(limit: int = 50):
    return {"ok": True, "workflows": wf.list_workflows(limit=limit)}


@router.post("/workflows")
def workflow_create(req: WorkflowIn):
    try:
        return {"ok": True, "workflow": wf.create_workflow(req.name, req.description, req.trigger, req.nodes, req.edges, req.authority_policy)}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/workflows/runs")
def workflow_runs(limit: int = 50):
    return {"ok": True, "runs": wf.list_workflow_runs(limit=limit)}


@router.get("/workflows/{workflow_id}")
def workflow_get(workflow_id: str):
    item = wf.get_workflow(workflow_id)
    if not item:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return {"ok": True, "workflow": item}


@router.post("/workflows/{workflow_id}/run")
def workflow_run(workflow_id: str, req: WorkflowRunIn = WorkflowRunIn()):
    result = wf.run_workflow(workflow_id, input_payload=req.input)
    if not result.get("ok") and result.get("error") == "not_found":
        raise HTTPException(status_code=404, detail="Workflow not found")
    return result


@router.post("/workflows/{workflow_id}/enabled")
def workflow_enabled(workflow_id: str, req: WorkflowEnabledIn):
    result = wf.set_workflow_enabled(workflow_id, req.enabled)
    if not result.get("ok"):
        raise HTTPException(status_code=404, detail="Workflow not found")
    return result


@router.get("/sidecars")
def sidecars(limit: int = 50):
    return {"ok": True, "sidecars": wf.list_sidecars(limit=limit)}


@router.post("/sidecars/register")
def sidecar_register(req: SidecarIn):
    return {"ok": True, "sidecar": wf.register_sidecar(req.machine_id, req.name, req.capabilities, req.token_hint)}


@router.post("/sidecars/{machine_id}/heartbeat")
def sidecar_heartbeat(machine_id: str):
    result = wf.heartbeat_sidecar(machine_id)
    if not result.get("ok"):
        raise HTTPException(status_code=404, detail="Sidecar not found")
    return result
