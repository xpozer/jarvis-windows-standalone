from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import Request, HTTPException, UploadFile, File
from services import _runtime as core
from services import awareness_runtime
from services import usejarvis_runtime


def api_self_check():
    data = core.api_self_check()
    if isinstance(data, dict):
        data["usejarvis_runtime"] = usejarvis_runtime.runtime_status()
        data["awareness_runtime"] = awareness_runtime.awareness_status()
    return data

def api_diagnostics_package():
    data = core.api_diagnostics_package()
    if isinstance(data, dict):
        data["usejarvis_runtime"] = usejarvis_runtime.runtime_status()
        data["awareness_runtime"] = awareness_runtime.awareness_status()
    return data

def api_b4_deep_status():
    data = core.api_b4_deep_status()
    if isinstance(data, dict):
        data["usejarvis_runtime"] = usejarvis_runtime.runtime_status()
        data["awareness"] = awareness_runtime.awareness_status()
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
        data["awareness_snapshot"] = awareness_runtime.capture_snapshot(write_event=False)
    return data

def api_diagnostic_deps():
    return core.api_diagnostic_deps()

def api_diagnostic_deep():
    data = core.api_diagnostic_deep()
    if isinstance(data, dict):
        data["runtime"] = usejarvis_runtime.runtime_status()
        data["awareness_runtime"] = awareness_runtime.awareness_status()
    return data

def api_diagnostic_center():
    sections: Dict[str, Any] = {}
    checks: List[Dict[str, Any]] = []

    def capture(name: str, label: str, fn):
        try:
            data = fn()
            sections[name] = data
            ok = True
            if isinstance(data, dict):
                if data.get("ok") is False or data.get("status") in ("error", "failed", "offline"):
                    ok = False
            checks.append({"name": label, "ok": ok})
        except Exception as exc:
            sections[name] = {"ok": False, "error": str(exc)}
            checks.append({"name": label, "ok": False, "error": str(exc)})

    capture("health", "Backend Health", health)
    capture("self_check", "Self Check", api_self_check)
    capture("dependencies", "Dependencies", api_diagnostic_deps)
    capture("ports", "Ports", api_diagnostic_ports)
    capture("logs", "Logs", api_diagnostic_logs_list)
    capture("system_status", "System Status", api_system_status)

    runtime = usejarvis_runtime.runtime_status()
    awareness = awareness_runtime.awareness_status()
    sections["usejarvis_runtime"] = runtime
    sections["awareness_runtime"] = awareness
    checks.append({"name": "UseJARVIS Runtime", "ok": isinstance(runtime, dict)})
    checks.append({"name": "Awareness Runtime", "ok": isinstance(awareness, dict)})

    failed = [item for item in checks if not item.get("ok")]
    return {
        "ok": len(failed) == 0,
        "status": "ok" if not failed else "attention",
        "summary": {
            "checks_total": len(checks),
            "checks_ok": len(checks) - len(failed),
            "checks_failed": len(failed),
            "failed": failed,
        },
        "checks": checks,
        "sections": sections,
    }

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
        data["awareness_runtime"] = awareness_runtime.awareness_status()
    return data

def debug_logs(lines: int = 200):
    return core.debug_logs(lines=lines)

def api_system_status():
    data = core.api_system_status()
    if isinstance(data, dict):
        data["usejarvis_runtime"] = usejarvis_runtime.runtime_status()
        data["awareness_runtime"] = awareness_runtime.awareness_status()
    return data

def api_agent_status():
    data = core.api_agent_status()
    if isinstance(data, dict):
        data["runtime_agents"] = usejarvis_runtime.agents()
    return data

def awareness_current():
    runtime_awareness = awareness_runtime.awareness_status()
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
        data["awareness"] = awareness_runtime.awareness_status()
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
