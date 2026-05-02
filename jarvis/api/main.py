"""Minimal FastAPI app for JARVIS Windows Standalone."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Literal
from uuid import uuid4

from fastapi import FastAPI
from pydantic import BaseModel, Field

from jarvis import __version__

AuditStatus = Literal["ok", "error", "waiting", "blocked", "started"]
AuditRisk = Literal["low", "medium", "high"]


class AutomationAuditEvent(BaseModel):
    """Eingabe fuer einen Automation Audit Log Eintrag."""

    task: str = Field(min_length=1, max_length=120)
    source: str = Field(default="manual", min_length=1, max_length=80)
    status: AuditStatus = "ok"
    result: str = Field(default="", max_length=500)
    requires_confirmation: bool = False
    risk: AuditRisk = "low"
    target: str = Field(default="", max_length=240)


class AutomationAuditEntry(AutomationAuditEvent):
    """Gespeicherter Automation Audit Log Eintrag."""

    id: str
    created_at: str


def _audit_log_path() -> Path:
    """Gibt den lokalen Audit Log Pfad zurueck."""
    root = Path(__file__).resolve().parents[2]
    return root / "audit" / "automation-audit.jsonl"


def _read_audit_entries(limit: int = 50) -> list[dict[str, object]]:
    """Liest die letzten Audit Eintraege als JSONL."""
    path = _audit_log_path()
    if not path.exists():
        return []

    lines = path.read_text(encoding="utf-8").splitlines()
    entries: list[dict[str, object]] = []
    for line in lines[-limit:]:
        if not line.strip():
            continue
        try:
            item = json.loads(line)
        except json.JSONDecodeError:
            entries.append({"status": "error", "result": "invalid audit log line"})
            continue
        if isinstance(item, dict):
            entries.append(item)
    return entries


def _append_audit_entry(event: AutomationAuditEvent) -> AutomationAuditEntry:
    """Schreibt einen Automation Audit Log Eintrag lokal auf die Platte."""
    entry = AutomationAuditEntry(
        id=str(uuid4()),
        created_at=datetime.now(UTC).isoformat(),
        **event.model_dump(),
    )
    path = _audit_log_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(entry.model_dump(), ensure_ascii=False) + "\n")
    return entry


def create_app() -> FastAPI:
    """Erstellt die lokale FastAPI App.

    Die App ist bewusst klein gehalten. Sie dient als stabiler Einstiegspunkt
    fuer OpenAPI, Health Checks und spaetere WorkAgent Endpunkte.
    """
    app = FastAPI(
        title="JARVIS Local API",
        version=__version__,
        description="Local first API for JARVIS Windows Standalone",
    )

    @app.get("/health", tags=["system"])
    def health() -> dict[str, str]:
        """Einfacher Health Check fuer Installer, CI und DiagCenter."""
        return {"status": "ok", "version": __version__}

    @app.get("/automation/audit", tags=["automation"])
    def automation_audit(limit: int = 50) -> dict[str, object]:
        """Liest die letzten Automation Audit Log Eintraege."""
        safe_limit = max(1, min(limit, 200))
        entries = _read_audit_entries(limit=safe_limit)
        return {
            "status": "ok",
            "count": len(entries),
            "entries": entries,
        }

    @app.post("/automation/audit", tags=["automation"])
    def create_automation_audit_event(event: AutomationAuditEvent) -> dict[str, object]:
        """Schreibt einen neuen Automation Audit Log Eintrag."""
        entry = _append_audit_entry(event)
        return {
            "status": "ok",
            "entry": entry.model_dump(),
        }

    return app


app = create_app()


def main() -> None:
    """Startet die API lokal ueber Uvicorn."""
    import uvicorn

    uvicorn.run("jarvis.api.main:app", host="127.0.0.1", port=8000, reload=False)
