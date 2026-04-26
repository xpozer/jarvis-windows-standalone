from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Request, HTTPException, UploadFile, File


from services import system as system_service

router = APIRouter()

@router.get("/health")
def health():
    return system_service.health()

@router.get("/debug/logs")
def debug_logs(lines: int = 200):
    return system_service.debug_logs(lines=lines)

@router.get("/system/status")
def api_system_status():
    return system_service.api_system_status()

@router.get("/agent/status")
def api_agent_status():
    return system_service.api_agent_status()

@router.get("/awareness/current")
def awareness_current():
    return system_service.awareness_current()

@router.get("/app/version")
def api_app_version():
    return system_service.api_app_version()

@router.get("/security/permissions")
def api_security_permissions():
    return system_service.api_security_permissions()

@router.post("/security/permissions")
async def api_security_permissions_save(req: Request):
    return await system_service.api_security_permissions_save(req=req)

@router.get("/ui/settings")
def api_ui_settings():
    return system_service.api_ui_settings()

@router.post("/ui/settings")
async def api_ui_settings_save(req: Request):
    return await system_service.api_ui_settings_save(req=req)

@router.get("/dashboard")
def api_dashboard():
    return system_service.api_dashboard()

@router.get("/web/search/open")
def api_web_search_open(q: str):
    return system_service.api_web_search_open(q=q)

@router.get("/v1/managed-agents")
def managed_agents():
    return system_service.managed_agents()

@router.post("/v1/managed-agents")
async def create_agent(req: Request):
    return await system_service.create_agent(req=req)

@router.get("/v1/managed-agents/{agent_id}/messages")
def agent_messages(agent_id: str):
    return system_service.agent_messages(agent_id=agent_id)

@router.post("/v1/managed-agents/{agent_id}/messages")
async def post_agent_message(agent_id: str, req: Request):
    return await system_service.post_agent_message(agent_id=agent_id, req=req)

@router.delete("/v1/managed-agents/{agent_id}")
def delete_agent(agent_id: str):
    return system_service.delete_agent(agent_id=agent_id)
