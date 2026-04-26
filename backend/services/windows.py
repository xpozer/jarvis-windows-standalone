from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import Request, HTTPException, UploadFile, File
from services import _runtime as core


def api_windows_apps():
    return core.api_windows_apps()

async def api_open_app(req: Request):
    return await core.api_open_app(req=req)

async def api_open_folder(req: Request):
    return await core.api_open_folder(req=req)

def api_search_files(q: str, limit: int = 25):
    return core.api_search_files(q=q, limit=limit)
