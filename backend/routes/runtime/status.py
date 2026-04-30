from __future__ import annotations

from fastapi import APIRouter

from services import action_engine
from services import awareness_runtime
from services import usejarvis_runtime as rt
from services import usejarvis_workflow as wf

router = APIRouter()


@router.get("/status")
def status():
    data = rt.runtime_status()
    data["workflow_runtime"] = wf.workflow_runtime_status()
    data["awareness_runtime"] = awareness_runtime.awareness_status()
    data["action_engine"] = action_engine.tool_registry()
    return data


@router.get("/orchestration/agents")
def orchestration_agents():
    return {"ok": True, "agents": rt.agents()}
