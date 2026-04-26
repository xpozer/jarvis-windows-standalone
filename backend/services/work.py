from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import Request, HTTPException, UploadFile, File
from services import _runtime as core


async def api_work_template(req: Request):
    return await core.api_work_template(req=req)

async def api_work_calc(kind: str, req: Request):
    return await core.api_work_calc(kind=kind, req=req)

def api_vde(topic: str = ""):
    return core.api_vde(topic=topic)

def api_work_memory(q: str = "", category: str = ""):
    return core.api_work_memory(q=q, category=category)

async def api_work_memory_add(req: Request):
    return await core.api_work_memory_add(req=req)

def api_work_memory_delete(category: str, key: str):
    return core.api_work_memory_delete(category=category, key=key)

async def api_work_agent_generate(req: Request):
    return await core.api_work_agent_generate(req=req)

def api_work_agent_examples():
    return core.api_work_agent_examples()

def api_work_agent_logs(limit: int = 50):
    return core.api_work_agent_logs(limit=limit)

def api_work_agent_help():
    return core.api_work_agent_help()

def api_work_types():
    return core.api_work_types()

async def api_work_generate(req: Request):
    return await core.api_work_generate(req=req)

def api_work_example(kind: str):
    return core.api_work_example(kind=kind)
