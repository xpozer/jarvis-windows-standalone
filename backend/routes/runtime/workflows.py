from __future__ import annotations

from fastapi import APIRouter, HTTPException

from routes.runtime_models import WorkflowEnabledIn, WorkflowIn, WorkflowRunIn
from services import usejarvis_runtime as rt
from services import usejarvis_workflow as wf

router = APIRouter()


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
