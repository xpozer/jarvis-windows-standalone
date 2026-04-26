from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Request, HTTPException, UploadFile, File


from services import email as email_service

router = APIRouter()

@router.get("/email/status")
def email_status():
    return email_service.email_status()

@router.post("/email/scan")
async def email_scan(req: Request):
    return await email_service.email_scan(req=req)

@router.post("/email/delete")
async def email_delete(req: Request):
    return await email_service.email_delete(req=req)
