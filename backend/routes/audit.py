from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Request, HTTPException, UploadFile, File


from services import audit as audit_service

router = APIRouter()

@router.get("/audit/log")
def api_audit_log(
limit: int = 200,
agent: str = "",
risk_level: str = "",
has_error: str = "",
):
    return audit_service.api_audit_log(limit=limit, agent=agent, risk_level=risk_level, has_error=has_error)

@router.get("/audit/stats")
def api_audit_stats():
    return audit_service.api_audit_stats()

@router.post("/audit/log")
async def api_audit_log_write(req: Request):
    return await audit_service.api_audit_log_write(req=req)
