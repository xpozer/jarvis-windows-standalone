from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import Request, HTTPException, UploadFile, File
from services import _runtime as core


def api_automation_list(status: str = ""):
    return core.api_automation_list(status=status)

async def api_automation_add(req: Request):
    return await core.api_automation_add(req=req)

def api_automation_due():
    return core.api_automation_due()

def api_automation_complete(automation_id: str):
    return core.api_automation_complete(automation_id=automation_id)

def api_automation_delete(automation_id: str):
    return core.api_automation_delete(automation_id=automation_id)

def api_briefing(kind: str):
    return core.api_briefing(kind=kind)

def api_briefing_history(limit: int = 20):
    return core.api_briefing_history(limit=limit)

def api_folder_watch_list():
    return core.api_folder_watch_list()

async def api_folder_watch_add(req: Request):
    return await core.api_folder_watch_add(req=req)

async def api_folder_watch_scan(req: Request):
    return await core.api_folder_watch_scan(req=req)

def api_folder_watch_delete(watch_id: str):
    return core.api_folder_watch_delete(watch_id=watch_id)
