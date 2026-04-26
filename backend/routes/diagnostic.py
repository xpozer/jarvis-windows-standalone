from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Request, HTTPException, UploadFile, File


from services import system as system_service

router = APIRouter()

@router.get("/self-check")
def api_self_check():
    return system_service.api_self_check()

@router.get("/diagnostics/package")
def api_diagnostics_package():
    return system_service.api_diagnostics_package()

@router.get("/deep/status")
def api_b4_deep_status():
    return system_service.api_b4_deep_status()

@router.get("/deep/repair-plan")
def api_b4_repair_plan_get():
    return system_service.api_b4_repair_plan_get()

@router.post("/deep/repair-plan")
def api_b4_repair_plan_post():
    return system_service.api_b4_repair_plan_post()

@router.get("/deep/context-pack")
def api_b4_context_pack():
    return system_service.api_b4_context_pack()

@router.get("/diagnostic/dependencies")
def api_diagnostic_deps():
    return system_service.api_diagnostic_deps()

@router.get("/diagnostic/deep-check")
def api_diagnostic_deep():
    return system_service.api_diagnostic_deep()

@router.post("/diagnostic/analyze-text")
async def api_diagnostic_analyze_text(req: Request):
    return await system_service.api_diagnostic_analyze_text(req=req)

@router.get("/diagnostic/analyze-log/{log_name}")
def api_diagnostic_analyze_log(log_name: str):
    return system_service.api_diagnostic_analyze_log(log_name=log_name)

@router.get("/diagnostic/ports")
def api_diagnostic_ports():
    return system_service.api_diagnostic_ports()

@router.get("/diagnostic/logs/list")
def api_diagnostic_logs_list():
    return system_service.api_diagnostic_logs_list()
