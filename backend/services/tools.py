from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import Request, HTTPException, UploadFile, File
from services import _runtime as core
from services import usejarvis_runtime


def api_tools_registry():
    data = core.api_tools_registry()
    if isinstance(data, dict):
        data.setdefault("runtime", usejarvis_runtime.runtime_status())
    return data

async def api_tools_execute(req: Request):
    return await core.api_tools_execute(req=req)

async def api_tools_run(req: Request):
    body = await req.json()
    action_type = str(body.get("tool") or body.get("tool_id") or body.get("action_type") or "tool.run")
    summary = str(body.get("summary") or body.get("input") or body.get("command") or action_type)[:220]
    risk = usejarvis_runtime.classify_risk(action_type, body)
    if risk in {"high", "critical"}:
        action = usejarvis_runtime.create_action_request(action_type=action_type, summary=summary, payload=body, risk=risk)
        return {"ok": False, "approval_required": True, "action": action, "message": "Diese Aktion benötigt eine Freigabe im Authority Gate."}
    return await core.api_tools_run(req=req)

def api_actions_pending():
    legacy = core.api_actions_pending()
    runtime_actions = [item for item in usejarvis_runtime.list_action_requests(limit=100) if item.get("status") == "pending_approval"]
    return {
        "ok": True,
        "legacy": legacy,
        "runtime_pending": runtime_actions,
        "count": len(runtime_actions),
        "authority_gating": "enabled",
    }

def api_actions_confirm(action_id: str):
    runtime_result = usejarvis_runtime.approve_action(action_id=action_id, approve=True)
    if runtime_result.get("ok"):
        return runtime_result
    return core.api_actions_confirm(action_id=action_id)

async def api_actions_prepare(req: Request):
    body = await req.json()
    action_type = str(body.get("action_type") or body.get("tool") or body.get("tool_id") or "manual.action")
    summary = str(body.get("summary") or body.get("description") or action_type)[:240]
    action = usejarvis_runtime.create_action_request(action_type=action_type, summary=summary, payload=body, risk=body.get("risk"))
    return {"ok": True, "action": action}

def api_tools_registry_full():
    data = core.api_tools_registry_full()
    if isinstance(data, dict):
        data.setdefault("runtime", usejarvis_runtime.runtime_status())
        data.setdefault("workflow_nodes", usejarvis_runtime.workflow_node_registry())
    return data

def api_tool_get(tool_id: str):
    return core.api_tool_get(tool_id=tool_id)

def api_tools_by_category(category: str):
    if category.lower() in {"workflow", "workflows", "automation"}:
        return usejarvis_runtime.workflow_node_registry()
    return core.api_tools_by_category(category=category)

async def api_tool_set_enabled(tool_id: str, req: Request):
    return await core.api_tool_set_enabled(tool_id=tool_id, req=req)
