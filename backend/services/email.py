from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import Request, HTTPException, UploadFile, File
from services import _runtime as core


def email_status():
    return core.email_status()

async def email_scan(req: Request):
    return await core.email_scan(req=req)

async def email_delete(req: Request):
    return await core.email_delete(req=req)
