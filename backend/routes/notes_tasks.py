from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Request, HTTPException, UploadFile, File


from services import automation as automation_service
from services import notes as notes_service

router = APIRouter()

@router.get("/notes")
def api_notes(q: str = "", limit: int = 100):
    return notes_service.api_notes(q=q, limit=limit)

@router.post("/notes")
async def api_add_note(req: Request):
    return await notes_service.api_add_note(req=req)

@router.delete("/notes/{note_id}")
def api_delete_note(note_id: str):
    return notes_service.api_delete_note(note_id=note_id)

@router.get("/tasks")
def api_tasks(done: Optional[bool] = None, q: str = ""):
    return notes_service.api_tasks(done=done, q=q)

@router.post("/tasks")
async def api_add_task(req: Request):
    return await notes_service.api_add_task(req=req)

@router.patch("/tasks/{task_id}")
async def api_update_task(task_id: str, req: Request):
    return await notes_service.api_update_task(task_id=task_id, req=req)

@router.delete("/tasks/{task_id}")
def api_delete_task(task_id: str):
    return notes_service.api_delete_task(task_id=task_id)

@router.get("/reminders")
def api_reminders():
    return notes_service.api_reminders()

@router.post("/reminders")
async def api_add_reminder(req: Request):
    return await notes_service.api_add_reminder(req=req)

@router.get("/automation/list")
def api_automation_list(status: str = ""):
    return automation_service.api_automation_list(status=status)

@router.post("/automation/add")
async def api_automation_add(req: Request):
    return await automation_service.api_automation_add(req=req)

@router.get("/automation/due")
def api_automation_due():
    return automation_service.api_automation_due()

@router.post("/automation/complete/{automation_id}")
def api_automation_complete(automation_id: str):
    return automation_service.api_automation_complete(automation_id=automation_id)

@router.delete("/automation/{automation_id}")
def api_automation_delete(automation_id: str):
    return automation_service.api_automation_delete(automation_id=automation_id)

@router.get("/briefing/{kind}")
def api_briefing(kind: str):
    return automation_service.api_briefing(kind=kind)

@router.get("/briefing/history")
def api_briefing_history(limit: int = 20):
    return automation_service.api_briefing_history(limit=limit)

@router.get("/folder-watch/list")
def api_folder_watch_list():
    return automation_service.api_folder_watch_list()

@router.post("/folder-watch/add")
async def api_folder_watch_add(req: Request):
    return await automation_service.api_folder_watch_add(req=req)

@router.post("/folder-watch/scan")
async def api_folder_watch_scan(req: Request):
    return await automation_service.api_folder_watch_scan(req=req)

@router.delete("/folder-watch/{watch_id}")
def api_folder_watch_delete(watch_id: str):
    return automation_service.api_folder_watch_delete(watch_id=watch_id)
