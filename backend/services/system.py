from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import Request, HTTPException, UploadFile, File
from services import _runtime as core


def api_self_check():
    return core.api_self_check()

def api_diagnostics_package():
    return core.api_diagnostics_package()

def api_b4_deep_status():
    return core.api_b4_deep_status()

def api_b4_repair_plan_get():
    return core.api_b4_repair_plan_get()

def api_b4_repair_plan_post():
    return core.api_b4_repair_plan_post()

def api_b4_context_pack():
    return core.api_b4_context_pack()

def api_diagnostic_deps():
    return core.api_diagnostic_deps()

def api_diagnostic_deep():
    return core.api_diagnostic_deep()

async def api_diagnostic_analyze_text(req: Request):
    return await core.api_diagnostic_analyze_text(req=req)

def api_diagnostic_analyze_log(log_name: str):
    return core.api_diagnostic_analyze_log(log_name=log_name)

def api_diagnostic_ports():
    return core.api_diagnostic_ports()

def api_diagnostic_logs_list():
    return core.api_diagnostic_logs_list()

def health():
    return core.health()

def debug_logs(lines: int = 200):
    return core.debug_logs(lines=lines)

def api_system_status():
    return core.api_system_status()

def api_agent_status():
    return core.api_agent_status()

def awareness_current():
    return core.awareness_current()

def api_app_version():
    return core.api_app_version()

def api_security_permissions():
    return core.api_security_permissions()

async def api_security_permissions_save(req: Request):
    return await core.api_security_permissions_save(req=req)

def api_ui_settings():
    return core.api_ui_settings()

async def api_ui_settings_save(req: Request):
    return await core.api_ui_settings_save(req=req)

def api_dashboard():
    return core.api_dashboard()

def api_web_search_open(q: str):
    return core.api_web_search_open(q=q)

def managed_agents():
    return core.managed_agents()

async def create_agent(req: Request):
    return await core.create_agent(req=req)

def agent_messages(agent_id: str):
    return core.agent_messages(agent_id=agent_id)

async def post_agent_message(agent_id: str, req: Request):
    return await core.post_agent_message(agent_id=agent_id, req=req)

def delete_agent(agent_id: str):
    return core.delete_agent(agent_id=agent_id)
