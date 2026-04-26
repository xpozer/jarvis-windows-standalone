from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import Request, HTTPException, UploadFile, File
from services import _runtime as core


def api_notes(q: str = "", limit: int = 100):
    return core.api_notes(q=q, limit=limit)

async def api_add_note(req: Request):
    return await core.api_add_note(req=req)

def api_delete_note(note_id: str):
    return core.api_delete_note(note_id=note_id)

def api_tasks(done: Optional[bool] = None, q: str = ""):
    return core.api_tasks(done=done, q=q)

async def api_add_task(req: Request):
    return await core.api_add_task(req=req)

async def api_update_task(task_id: str, req: Request):
    return await core.api_update_task(task_id=task_id, req=req)

def api_delete_task(task_id: str):
    return core.api_delete_task(task_id=task_id)

def api_reminders():
    return core.api_reminders()

async def api_add_reminder(req: Request):
    return await core.api_add_reminder(req=req)
