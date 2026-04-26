from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Request, HTTPException, UploadFile, File


from services import windows as windows_service

router = APIRouter()

@router.get("/windows/apps")
def api_windows_apps():
    return windows_service.api_windows_apps()

@router.post("/windows/open-app")
async def api_open_app(req: Request):
    return await windows_service.api_open_app(req=req)

@router.post("/windows/open-folder")
async def api_open_folder(req: Request):
    return await windows_service.api_open_folder(req=req)

@router.get("/windows/search-files")
def api_search_files(q: str, limit: int = 25):
    return windows_service.api_search_files(q=q, limit=limit)
