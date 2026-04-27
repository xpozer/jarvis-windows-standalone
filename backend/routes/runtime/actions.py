from __future__ import annotations

from fastapi import APIRouter, HTTPException

from routes.runtime_models import ActionIn, ActionToolIn
from services import action_engine
from services import usejarvis_runtime as rt

router = APIRouter()


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


@router.post("/actions/{action_id}/execute")
def action_execute(action_id: str):
    result = action_engine.execute_approved_action(action_id)
    if result.get("error") == "not_found":
        raise HTTPException(status_code=404, detail="Action not found")
    if result.get("error") == "not_approved":
        raise HTTPException(status_code=409, detail=f"Action is not approved. Current status: {result.get('status')}")
    return result


@router.get("/action-engine/tools")
def action_engine_tools():
    return action_engine.tool_registry()


@router.post("/action-engine/run")
def action_engine_run(req: ActionToolIn):
    return action_engine.run_tool(req.tool_id, req.payload)


@router.get("/action-engine/files")
def action_engine_files(path: str = "", limit: int = 80):
    return action_engine.list_dir(path or None, limit=limit)


@router.get("/action-engine/file")
def action_engine_file(path: str, max_bytes: int = 512000):
    return action_engine.read_file(path, max_bytes=max_bytes)


@router.get("/action-engine/git/status")
def action_engine_git_status(path: str = ""):
    return action_engine.git_status(path or None)


@router.get("/action-engine/git/branch")
def action_engine_git_branch(path: str = ""):
    return action_engine.git_branch(path or None)


@router.get("/action-engine/system/info")
def action_engine_system_info():
    return action_engine.system_info()


@router.get("/action-engine/processes")
def action_engine_processes(limit: int = 50):
    return action_engine.process_list(limit=limit)
