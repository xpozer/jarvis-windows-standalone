from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Request, HTTPException, UploadFile, File


from services import tools as tools_service

router = APIRouter()

@router.get("/tools/registry")
def api_tools_registry():
    return tools_service.api_tools_registry()

@router.post("/tools/execute")
async def api_tools_execute(req: Request):
    return await tools_service.api_tools_execute(req=req)

@router.get("/actions/pending")
def api_actions_pending():
    return tools_service.api_actions_pending()

@router.post("/actions/confirm/{action_id}")
def api_actions_confirm(action_id: str):
    return tools_service.api_actions_confirm(action_id=action_id)

@router.post("/actions/prepare")
async def api_actions_prepare(req: Request):
    return await tools_service.api_actions_prepare(req=req)

@router.get("/tools/registry/full")
def api_tools_registry_full():
    return tools_service.api_tools_registry_full()

@router.get("/tools/registry/full/{tool_id}")
def api_tool_get(tool_id: str):
    return tools_service.api_tool_get(tool_id=tool_id)

@router.get("/tools/registry/full/category/{category}")
def api_tools_by_category(category: str):
    return tools_service.api_tools_by_category(category=category)

@router.patch("/tools/registry/full/{tool_id}/enabled")
async def api_tool_set_enabled(tool_id: str, req: Request):
    return await tools_service.api_tool_set_enabled(tool_id=tool_id, req=req)
