from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import Request, HTTPException, UploadFile, File
from services import _runtime as core


def api_backup_list():
    return core.api_backup_list()

async def api_backup_create(req: Request):
    return await core.api_backup_create(req=req)

async def api_backup_restore(req: Request):
    return await core.api_backup_restore(req=req)

def api_update_status():
    return core.api_update_status()

async def api_update_prepare(req: Request):
    return await core.api_update_prepare(req=req)
