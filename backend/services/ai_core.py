from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import Request, HTTPException, UploadFile, File
from services import _runtime as core
from services import usejarvis_runtime


def list_orch_agents():
    legacy = core.list_orch_agents()
    runtime_agents = usejarvis_runtime.agents()
    return {"ok": True, "legacy": legacy, "runtime_agents": runtime_agents, "count": len(runtime_agents)}

def orchestrate_run(req: OrchReq):
    return core.orchestrate_run(req=req)

def api_b4_agents_matrix():
    legacy = core.api_b4_agents_matrix()
    return {"ok": True, "legacy": legacy, "runtime_agents": usejarvis_runtime.agents(), "authority": "primary_agent_controls_critical_actions"}

def api_agents_registry():
    legacy = core.api_agents_registry()
    agents = legacy.get("agents") if isinstance(legacy, dict) else []
    return {"ok": True, "agents": agents or [], "legacy": legacy, "runtime_agents": usejarvis_runtime.agents(), "runtime": usejarvis_runtime.runtime_status()}

def api_agent_get(agent_id: str):
    for agent in usejarvis_runtime.agents():
        if agent["id"] == agent_id:
            return {"ok": True, "agent": agent}
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
    legacy = core.memory_stats()
    return {"ok": True, "legacy": legacy, "runtime": usejarvis_runtime.runtime_status()["primitives"]["memory"]}

async def memory_search(req: Request):
    body = await req.json()
    q = str(body.get("q") or body.get("query") or body.get("text") or "")
    limit = int(body.get("limit") or 10)
    return {"ok": True, "facts": usejarvis_runtime.search_facts(q=q, limit=limit)}

async def memory_index(req: Request):
    body = await req.json()
    text = str(body.get("text") or body.get("content") or body.get("fact") or "").strip()
    if text:
        fact = usejarvis_runtime.add_fact(text, source_type="api_index", source_ref=str(body.get("source") or "v1_memory_index"), confidence=0.75, importance=int(body.get("importance") or 3), tags=["api"])
        return {"ok": True, "fact": fact}
    return await core.memory_index(req=req)
