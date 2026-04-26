from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import Request, HTTPException, UploadFile, File
from services import _runtime as core


def api_tools_registry():
    return core.api_tools_registry()

async def api_tools_execute(req: Request):
    return await core.api_tools_execute(req=req)

async def api_tools_run(req: Request):
    return await core.api_tools_run(req=req)

def api_actions_pending():
    return core.api_actions_pending()

def api_actions_confirm(action_id: str):
    return core.api_actions_confirm(action_id=action_id)

def api_actions_cancel(action_id: str):
    return core.api_actions_cancel(action_id=action_id)

async def api_actions_prepare(req: Request):
    return await core.api_actions_prepare(req=req)

def api_tools_registry_full():
    return core.api_tools_registry_full()

def api_tool_get(tool_id: str):
    return core.api_tool_get(tool_id=tool_id)

def api_tools_by_category(category: str):
    return core.api_tools_by_category(category=category)

async def api_tool_set_enabled(tool_id: str, req: Request):
    return await core.api_tool_set_enabled(tool_id=tool_id, req=req)
