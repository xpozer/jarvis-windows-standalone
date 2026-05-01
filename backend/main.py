from __future__ import annotations

import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

import audit_log as audit
import agent_registry
import tool_registry

from config import (
    AGENT_STATUS_FILE,
    FRONTEND_ASSETS,
    FRONTEND_DIAG,
    FRONTEND_DIST,
    FRONTEND_INDEX,
    FRONTEND_PUBLIC,
)
from utils import log, read_json, write_json

from routes.chat import router as chat_router
from routes.local_chat import router as local_chat_router
from routes.files import router as files_router
from routes.research import router as research_router
from routes.notes_tasks import router as notes_tasks_router
from routes.work import router as work_router
from routes.windows import router as windows_router
from routes.voice import router as voice_router
from routes.backup import router as backup_router
from routes.knowledge import router as knowledge_router
from routes.agents import router as agents_router
from routes.tools import router as tools_router
from routes.audit import router as audit_router
from routes.diagnostic import router as diagnostic_router
from routes.skills import router as skills_router
from routes.system import router as system_router
from routes.email import router as email_router
from routes.export import router as export_router
from routes.metrics import router as metrics_router
from routes.calendar import router as calendar_router
from routes.day_start import router as day_start_router
from routes.usejarvis import router as usejarvis_router
from routes.updates import router as updates_router
from routes.lifeos import router as lifeos_router

from services import _runtime as core
from services import usejarvis_runtime
from services import usejarvis_workflow

classify_agent = core.classify_agent
ollama_online = core.ollama_online


@asynccontextmanager
async def lifespan(app: FastAPI):
    await on_startup()
    yield


app = FastAPI(title="JARVIS Windows Standalone API", version=core.app_version(), lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173", "file://"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def on_startup():
    write_json(AGENT_STATUS_FILE, {
        "active": None,
        "phase": "idle",
        "last_agent": None,
        "updated_at": core.now_iso(),
        "note": "Backend neu gestartet",
    })
    try:
        agent_registry.reset_all_status()
        agent_registry.init_registry()
        tool_registry.init_tools()
        log("INFO", "Agent Registry und Tool Registry initialisiert")
    except Exception as e:
        log("WARN", "Registry-Init fehlgeschlagen", error=str(e))
    try:
        usejarvis_runtime.init_runtime()
        usejarvis_workflow.init_workflow_runtime()
        usejarvis_runtime.audit("system", "runtime.startup", "UseJARVIS Runtime und Workflow Runtime initialisiert", "low", {"version": core.app_version()})
        log("INFO", "UseJARVIS Runtime und Workflow Runtime initialisiert")
    except Exception as e:
        log("WARN", "UseJARVIS Runtime Init fehlgeschlagen", error=str(e))
    try:
        audit.log_action("backend_startup", agent="system", result="ok")
    except Exception:
        pass
    log("INFO", "JARVIS Backend gestartet", version=core.app_version())


@app.middleware("http")
async def log_requests(req: Request, call_next):
    start = time.time()
    try:
        resp = await call_next(req)
        log(
            "INFO",
            "request",
            method=req.method,
            path=req.url.path,
            status=resp.status_code,
            ms=round((time.time() - start) * 1000),
        )
        return resp
    except Exception as e:
        log("ERROR", "request failed", method=req.method, path=req.url.path, error=str(e))
        raise


app.include_router(chat_router)
app.include_router(local_chat_router)
app.include_router(files_router)
app.include_router(research_router)
app.include_router(notes_tasks_router)
app.include_router(work_router)
app.include_router(windows_router)
app.include_router(voice_router)
app.include_router(backup_router)
app.include_router(knowledge_router)
app.include_router(agents_router)
app.include_router(tools_router)
app.include_router(audit_router)
app.include_router(diagnostic_router)
app.include_router(skills_router)
app.include_router(system_router)
app.include_router(email_router)
app.include_router(export_router)
app.include_router(metrics_router)
app.include_router(calendar_router)
app.include_router(day_start_router)
app.include_router(usejarvis_router)
app.include_router(updates_router)
app.include_router(lifeos_router)


@app.get("/", include_in_schema=False)
def root():
    if FRONTEND_INDEX.exists():
        return FileResponse(FRONTEND_INDEX)
    return {
        "name": "JARVIS Windows Standalone",
        "status": "online",
        "docs": "/docs",
        "health": "/health",
        "runtime": "/api/runtime/status",
        "workflows": "/api/runtime/workflows",
        "sidecars": "/api/runtime/sidecars",
        "hint": "Frontend Build fehlt. Bitte FIRST_SETUP.bat ausfuehren.",
    }


@app.get("/diagnose.html", include_in_schema=False)
def frontend_diagnose():
    if FRONTEND_DIST.joinpath("diagnose.html").exists():
        return FileResponse(FRONTEND_DIST / "diagnose.html")
    if FRONTEND_DIAG.exists():
        return FileResponse(FRONTEND_DIAG)
    return {"status": "diagnose.html fehlt"}


if FRONTEND_ASSETS.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_ASSETS)), name="frontend-assets")


@app.get("/{full_path:path}", include_in_schema=False)
def spa_fallback(full_path: str):
    if full_path.startswith((
        "api/", "v1/", "orchestrate/", "awareness/", "email/", "skills/", "debug/",
        "notes/", "tasks/", "reminders/", "system/", "windows/", "tools/", "actions/",
        "documents/", "web/", "work-agent/", "automation/", "briefing/", "folder-watch/",
        "backup/", "diagnostics/", "security/", "update/", "ui/", "knowledge/", "voice/",
        "dashboard", "app/", "health", "docs", "openapi.json", "agents/", "audit/",
        "diagnostic/", "work/", "deep/", "self-check", "export/",
    )):
        raise HTTPException(404, "Not Found")
    candidate = FRONTEND_DIST / full_path
    if candidate.exists() and candidate.is_file():
        return FileResponse(candidate)
    public_candidate = FRONTEND_PUBLIC / full_path
    if public_candidate.exists() and public_candidate.is_file():
        return FileResponse(public_candidate)
    if FRONTEND_INDEX.exists():
        return FileResponse(FRONTEND_INDEX)
    return {
        "name": "JARVIS Windows Standalone",
        "status": "online",
        "missing": "frontend/dist/index.html",
    }
