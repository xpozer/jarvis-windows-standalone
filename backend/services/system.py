from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import Request, HTTPException, UploadFile, File
from services import _runtime as core
from services import usejarvis_runtime


def api_self_check():
    data = core.api_self_check()
    if isinstance(data, dict):
        data["usejarvis_runtime"] = usejarvis_runtime.runtime_status()
    return data

def api_diagnostics_package():
    data = core.api_diagnostics_package()
    if isinstance(data, dict):
        data["usejarvis_runtime"] = usejarvis_runtime.runtime_status()
    return data

def api_b4_deep_status():
    data = core.api_b4_deep_status()
    if isinstance(data, dict):
        data["usejarvis_runtime"] = usejarvis_runtime.runtime_status()
        data["awareness"] = usejarvis_runtime.current_awareness()
    return data

def api_b4_repair_plan_get():
    return core.api_b4_repair_plan_get()

def api_b4_repair_plan_post():
    return core.api_b4_repair_plan_post()

def api_b4_context_pack():
    data = core.api_b4_context_pack()
    if isinstance(data, dict):
        data["memory_context"] = usejarvis_runtime.search_facts("jarvis", limit=10)
        data["runtime"] = usejarvis_runtime.runtime_status()
    return data

def api_diagnostic_deps():
    return core.api_diagnostic_deps()

def api_diagnostic_deep():
    data = core.api_diagnostic_deep()
    if isinstance(data, dict):
        data["runtime"] = usejarvis_runtime.runtime_status()
    return data

async def api_diagnostic_analyze_text(req: Request):
    return await core.api_diagnostic_analyze_text(req=req)

def api_diagnostic_analyze_log(log_name: str):
    return core.api_diagnostic_analyze_log(log_name=log_name)

def api_diagnostic_ports():
    return core.api_diagnostic_ports()

def api_diagnostic_logs_list():
    return core.api_diagnostic_logs_list()

def health():
    data = core.health()
    if isinstance(data, dict):
        data["runtime"] = usejarvis_runtime.runtime_status()
    return data

def debug_logs(lines: int = 200):
    return core.debug_logs(lines=lines)

def api_system_status():
    data = core.api_system_status()
    if isinstance(data, dict):
        data["usejarvis_runtime"] = usejarvis_runtime.runtime_status()
    return data

def api_agent_status():
    data = core.api_agent_status()
    if isinstance(data, dict):
        data["runtime_agents"] = usejarvis_runtime.agents()
    return data

def awareness_current():
    runtime_awareness = usejarvis_runtime.current_awareness()
    legacy = core.awareness_current()
    return {"ok": True, "legacy": legacy, "runtime": runtime_awareness}

def api_app_version():
    data = core.api_app_version()
    if isinstance(data, dict):
        data["runtime"] = "usejarvis-local-core"
    return data

def api_security_permissions():
    data = core.api_security_permissions()
    if isinstance(data, dict):
        data["authority_gating"] = {
            "enabled": True,
            "pending": [item for item in usejarvis_runtime.list_action_requests(limit=100) if item.get("status") == "pending_approval"],
            "risk_levels": ["low", "medium", "high", "critical"],
        }
    return data

async def api_security_permissions_save(req: Request):
    return await core.api_security_permissions_save(req=req)

def api_ui_settings():
    return core.api_ui_settings()

async def api_ui_settings_save(req: Request):
    return await core.api_ui_settings_save(req=req)

def api_dashboard():
    data = core.api_dashboard()
    if isinstance(data, dict):
        data["runtime"] = usejarvis_runtime.runtime_status()
        data["awareness"] = usejarvis_runtime.current_awareness()
        data["pending_actions"] = [item for item in usejarvis_runtime.list_action_requests(limit=100) if item.get("status") == "pending_approval"]
        data["goals"] = usejarvis_runtime.list_goals(limit=12)
    return data

def api_web_search_open(q: str):
    return core.api_web_search_open(q=q)

def managed_agents():
    data = core.managed_agents()
    return {"ok": True, "legacy": data, "runtime_agents": usejarvis_runtime.agents()}

async def create_agent(req: Request):
    return await core.create_agent(req=req)

def agent_messages(agent_id: str):
    return core.agent_messages(agent_id=agent_id)

async def post_agent_message(agent_id: str, req: Request):
    return await core.post_agent_message(agent_id=agent_id, req=req)

def delete_agent(agent_id: str):
    return core.delete_agent(agent_id=agent_id)
