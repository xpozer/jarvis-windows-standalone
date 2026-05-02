from __future__ import annotations

from fastapi import APIRouter, Request

from services import ai_core as ai_core_service
from services._runtime import OrchReq

router = APIRouter()

@router.get("/orchestrate/agents")
def list_orch_agents():
    return ai_core_service.list_orch_agents()

@router.post("/orchestrate/run")
def orchestrate_run(req: OrchReq):
    return ai_core_service.orchestrate_run(req=req)

@router.get("/agents/matrix")
def api_b4_agents_matrix():
    return ai_core_service.api_b4_agents_matrix()

@router.get("/agents/registry")
def api_agents_registry():
    return ai_core_service.api_agents_registry()

@router.get("/agents/registry/{agent_id}")
def api_agent_get(agent_id: str):
    return ai_core_service.api_agent_get(agent_id=agent_id)

@router.post("/agents/registry/{agent_id}/status")
async def api_agent_status_update(agent_id: str, req: Request):
    return await ai_core_service.api_agent_status_update(agent_id=agent_id, req=req)

@router.post("/agents/registry/reset")
def api_agents_reset():
    return ai_core_service.api_agents_reset()
