from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import Request, HTTPException, UploadFile, File
from services import _runtime as core


def api_audit_log(
limit: int = 200,
agent: str = "",
risk_level: str = "",
has_error: str = "",
):
    return core.api_audit_log(limit=limit, agent=agent, risk_level=risk_level, has_error=has_error)

def api_audit_stats():
    return core.api_audit_stats()

async def api_audit_log_write(req: Request):
    return await core.api_audit_log_write(req=req)
