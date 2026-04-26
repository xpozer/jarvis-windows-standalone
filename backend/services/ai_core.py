from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import Request, HTTPException, UploadFile, File
from services import _runtime as core


def list_orch_agents():
    return core.list_orch_agents()

def orchestrate_run(req: OrchReq):
    return core.orchestrate_run(req=req)

def api_b4_agents_matrix():
    return core.api_b4_agents_matrix()

def api_agents_registry():
    return core.api_agents_registry()

def api_agent_get(agent_id: str):
    return core.api_agent_get(agent_id=agent_id)

async def api_agent_status_update(agent_id: str, req: Request):
    return await core.api_agent_status_update(agent_id=agent_id, req=req)

def api_agents_reset():
    return core.api_agents_reset()

def models():
    return core.models()

async def chat_completions(req: Request):
    return await core.chat_completions(req=req)

def memory_stats():
    return core.memory_stats()

async def memory_search(req: Request):
    return await core.memory_search(req=req)

async def memory_index(req: Request):
    return await core.memory_index(req=req)
