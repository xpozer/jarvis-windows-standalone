"""
JARVIS Audit Log
Speichert alle relevanten Aktionen mit Zeitpunkt, Agent, Tool, Risiko und Ergebnis.
"""
from __future__ import annotations
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional, Any

AUDIT_FILE = Path(__file__).resolve().parent.parent / "data" / "audit_log.json"
MAX_ENTRIES = 2000


def _load() -> list:
    if not AUDIT_FILE.exists():
        return []
    try:
        content = AUDIT_FILE.read_text(encoding="utf-8")
        if not content.strip():
            return []
        return json.loads(content)
    except Exception:
        return []


def _save(entries: list) -> None:
    AUDIT_FILE.parent.mkdir(parents=True, exist_ok=True)
    tmp = AUDIT_FILE.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(entries[-MAX_ENTRIES:], ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(AUDIT_FILE)


def log_action(
    action: str,
    agent: str = "system",
    tool: Optional[str] = None,
    risk_level: str = "low",
    requires_confirmation: bool = False,
    confirmed: Optional[bool] = None,
    result: Optional[str] = None,
    error: Optional[str] = None,
    ui_page: Optional[str] = None,
    details: Optional[dict] = None,
) -> dict:
    entry = {
        "id":                   str(uuid.uuid4())[:8],
        "ts":                   datetime.now().isoformat(timespec="seconds"),
        "action":               action,
        "agent":                agent,
        "tool":                 tool,
        "risk_level":           risk_level,
        "requires_confirmation": requires_confirmation,
        "confirmed":            confirmed,
        "result":               result,
        "error":                error,
        "ui_page":              ui_page,
        "details":              details or {},
    }
    entries = _load()
    entries.append(entry)
    _save(entries)
    return entry


def get_entries(
    limit: int = 200,
    agent: Optional[str] = None,
    risk_level: Optional[str] = None,
    has_error: Optional[bool] = None,
) -> list:
    entries = _load()
    if agent:
        entries = [e for e in entries if e.get("agent") == agent]
    if risk_level:
        entries = [e for e in entries if e.get("risk_level") == risk_level]
    if has_error is True:
        entries = [e for e in entries if e.get("error")]
    elif has_error is False:
        entries = [e for e in entries if not e.get("error")]
    return list(reversed(entries))[:limit]


def get_stats() -> dict:
    entries = _load()
    total = len(entries)
    errors = sum(1 for e in entries if e.get("error"))
    by_agent: dict[str, int] = {}
    by_risk: dict[str, int] = {}
    for e in entries:
        a = e.get("agent", "unknown")
        r = e.get("risk_level", "low")
        by_agent[a] = by_agent.get(a, 0) + 1
        by_risk[r] = by_risk.get(r, 0) + 1
    return {
        "total": total,
        "errors": errors,
        "by_agent": by_agent,
        "by_risk": by_risk,
        "last_entry": entries[-1] if entries else None,
    }
