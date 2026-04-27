from __future__ import annotations

import json
import uuid
from typing import Any

from services.runtime.audit import audit
from services.runtime.db import DB_PATH, connect as _connect, init_runtime, now_iso, row_to_dict as _row_to_dict
from services.runtime.memory import add_fact, delete_fact, extract_facts_from_text, list_facts, memory_context, search_facts


def set_awareness_event(event_type: str, app_name: str | None = None, window_title: str | None = None, summary: str | None = None, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    init_runtime()
    item = {
        "id": f"aware_{uuid.uuid4().hex}",
        "event_type": event_type,
        "app_name": app_name,
        "window_title": window_title,
        "summary": summary,
        "payload_json": json.dumps(payload or {}, ensure_ascii=False),
        "created_at": now_iso(),
    }
    with _connect() as db:
        db.execute("INSERT INTO awareness_events(id, event_type, app_name, window_title, summary, payload_json, created_at) VALUES (:id, :event_type, :app_name, :window_title, :summary, :payload_json, :created_at)", item)
    return {**item, "payload": payload or {}}


def current_awareness() -> dict[str, Any]:
    init_runtime()
    with _connect() as db:
        row = db.execute("SELECT * FROM awareness_events ORDER BY created_at DESC LIMIT 1").fetchone()
    if not row:
        return {"ok": True, "status": "idle", "summary": "Noch kein Awareness Ereignis vorhanden.", "privacy": "local_first", "paused": False}
    return {"ok": True, "status": "active", "current": _row_to_dict(row), "privacy": "local_first", "paused": False}


def classify_risk(action_type: str, payload: dict[str, Any] | None = None) -> str:
    text = f"{action_type} {json.dumps(payload or {}, ensure_ascii=False)}".lower()
    if any(x in text for x in ["delete", "remove", "send", "push", "deploy", "payment", "buy", "purchase", "secret", "password", "token"]):
        return "critical"
    if any(x in text for x in ["write", "update", "commit", "create", "move", "copy", "email"]):
        return "high"
    if any(x in text for x in ["draft", "run", "shell", "browser", "desktop"]):
        return "medium"
    return "low"


def create_action_request(action_type: str, summary: str, payload: dict[str, Any] | None = None, risk: str | None = None) -> dict[str, Any]:
    init_runtime()
    final_risk = (risk or classify_risk(action_type, payload)).lower()
    status = "pending_approval" if final_risk in {"high", "critical"} else "approved"
    ts = now_iso()
    item = {
        "id": f"action_{uuid.uuid4().hex}",
        "action_type": action_type,
        "summary": summary,
        "risk": final_risk,
        "status": status,
        "payload_json": json.dumps(payload or {}, ensure_ascii=False),
        "created_at": ts,
        "updated_at": ts,
        "approved_at": ts if status == "approved" else None,
        "rejected_at": None,
        "executed_at": None,
        "result_json": json.dumps({}, ensure_ascii=False),
    }
    with _connect() as db:
        db.execute("""
            INSERT INTO action_requests(id, action_type, summary, risk, status, payload_json, created_at, updated_at, approved_at, rejected_at, executed_at, result_json)
            VALUES (:id, :action_type, :summary, :risk, :status, :payload_json, :created_at, :updated_at, :approved_at, :rejected_at, :executed_at, :result_json)
        """, item)
    audit("authority", "action.requested", summary, final_risk, {"action_id": item["id"], "status": status})
    return {**item, "payload": payload or {}, "result": {}}


def get_action_request(action_id: str) -> dict[str, Any] | None:
    init_runtime()
    with _connect() as db:
        row = db.execute("SELECT * FROM action_requests WHERE id=?", (action_id,)).fetchone()
    return _row_to_dict(row) if row else None


def list_action_requests(limit: int = 25) -> list[dict[str, Any]]:
    init_runtime()
    with _connect() as db:
        rows = db.execute("SELECT * FROM action_requests ORDER BY created_at DESC LIMIT ?", (max(1, min(100, limit)),)).fetchall()
    return [_row_to_dict(row) for row in rows]


def approve_action(action_id: str, approve: bool = True) -> dict[str, Any]:
    init_runtime()
    ts = now_iso()
    status = "approved" if approve else "rejected"
    with _connect() as db:
        row = db.execute("SELECT * FROM action_requests WHERE id=?", (action_id,)).fetchone()
        if not row:
            return {"ok": False, "error": "not_found"}
        db.execute("UPDATE action_requests SET status=?, updated_at=?, approved_at=?, rejected_at=? WHERE id=?", (status, ts, ts if approve else None, None if approve else ts, action_id))
    audit("authority", f"action.{status}", action_id, str(row["risk"]), {"action_id": action_id})
    return {"ok": True, "action_id": action_id, "status": status}


def mark_action_executed(action_id: str, result: dict[str, Any], status: str = "executed") -> dict[str, Any]:
    init_runtime()
    ts = now_iso()
    final_status = status if status in {"executed", "execution_failed"} else "executed"
    with _connect() as db:
        row = db.execute("SELECT * FROM action_requests WHERE id=?", (action_id,)).fetchone()
        if not row:
            return {"ok": False, "error": "not_found"}
        db.execute("UPDATE action_requests SET status=?, updated_at=?, executed_at=?, result_json=? WHERE id=?", (final_status, ts, ts, json.dumps(result or {}, ensure_ascii=False), action_id))
    audit("authority", f"action.{final_status}", action_id, "medium", {"action_id": action_id, "result": result})
    return {"ok": True, "action_id": action_id, "status": final_status, "result": result}


def create_goal(goal_type: str, title: str, description: str | None = None, parent_id: str | None = None, due_date: str | None = None) -> dict[str, Any]:
    init_runtime()
    ts = now_iso()
    item = {"id": f"goal_{uuid.uuid4().hex}", "type": goal_type, "parent_id": parent_id, "title": title, "description": description, "score": 0.0, "target_score": 1.0, "status": "active", "due_date": due_date, "created_at": ts, "updated_at": ts}
    with _connect() as db:
        db.execute("""
            INSERT INTO goals(id, type, parent_id, title, description, score, target_score, status, due_date, created_at, updated_at)
            VALUES (:id, :type, :parent_id, :title, :description, :score, :target_score, :status, :due_date, :created_at, :updated_at)
        """, item)
    audit("goal", "goal.created", title, "low", {"goal_id": item["id"]})
    return item


def list_goals(limit: int = 50) -> list[dict[str, Any]]:
    init_runtime()
    with _connect() as db:
        rows = db.execute("SELECT * FROM goals ORDER BY created_at DESC LIMIT ?", (max(1, min(100, limit)),)).fetchall()
    return [_row_to_dict(row) for row in rows]


def workflow_node_registry() -> dict[str, Any]:
    triggers = ["manual", "cron", "interval", "webhook", "file_changed", "folder_changed", "screen_event", "app_opened", "app_closed", "clipboard_changed", "process_started", "process_stopped", "git_commit", "git_push", "email_received", "calendar_event", "goal_behind_schedule"]
    actions = ["agent_task", "browser_navigate", "browser_click", "browser_extract", "desktop_click", "desktop_type", "shell_command", "file_read", "file_write", "file_copy", "file_move", "git_status", "git_commit", "github_issue", "github_pull_request", "notification", "email_draft", "calendar_create", "memory_write", "goal_update"]
    logic = ["if_else", "switch", "loop", "delay", "wait_until", "merge", "race", "variable_set", "variable_get", "template_render", "json_parse", "regex_extract", "map", "filter", "aggregate"]
    errors = ["retry", "fallback", "error_handler", "compensate", "ask_user", "escalate_authority", "self_heal"]
    return {"ok": True, "count": len(triggers) + len(actions) + len(logic) + len(errors), "triggers": triggers, "actions": actions, "logic": logic, "error_handling": errors}


def agents() -> list[dict[str, Any]]:
    roles = [("primary", "Primary Agent", "Nutzerkontakt, Kontext, Freigaben"), ("researcher", "Researcher", "Recherche, Quellen, Vergleich"), ("coder", "Coder", "Code Analyse, Patches, Tests"), ("reviewer", "Reviewer", "Prüfung von Qualität und Risiko"), ("planner", "Planner", "Ziele, Reihenfolge, Tagesplanung"), ("writer", "Writer", "Doku, Texte, Spezifikationen"), ("analyst", "Analyst", "Datenanalyse und Metriken"), ("sysadmin", "Sysadmin", "Windows, Dienste, Logs"), ("devops", "DevOps", "Git, Builds, Releases"), ("security", "Security", "Secrets, Rechte, Freigaben"), ("designer", "Designer", "UI und visuelle Systeme"), ("data_engineer", "Data Engineer", "Speicher, Vektoren, ETL")]
    return [{"id": rid, "name": name, "description": desc, "authority": "prepare_only" if rid != "primary" else "approval_owner"} for rid, name, desc in roles]


def runtime_status() -> dict[str, Any]:
    init_runtime()
    with _connect() as db:
        facts = db.execute("SELECT COUNT(*) AS c FROM memory_facts").fetchone()["c"]
        actions = db.execute("SELECT COUNT(*) AS c FROM action_requests").fetchone()["c"]
        pending = db.execute("SELECT COUNT(*) AS c FROM action_requests WHERE status='pending_approval'").fetchone()["c"]
        approved = db.execute("SELECT COUNT(*) AS c FROM action_requests WHERE status='approved'").fetchone()["c"]
        executed = db.execute("SELECT COUNT(*) AS c FROM action_requests WHERE status='executed'").fetchone()["c"]
        goals_count = db.execute("SELECT COUNT(*) AS c FROM goals").fetchone()["c"]
        awareness_count = db.execute("SELECT COUNT(*) AS c FROM awareness_events").fetchone()["c"]
    return {
        "ok": True,
        "runtime": "jarvis-local-usejarvis-core",
        "database": str(DB_PATH),
        "primitives": {
            "memory": {"status": "active", "facts": facts},
            "awareness": {"status": "active", "events": awareness_count},
            "action": {"status": "active", "requests": actions, "pending_approval": pending, "approved": approved, "executed": executed},
            "orchestration": {"status": "defined", "agents": len(agents())},
        },
        "goals": goals_count,
        "workflow_nodes": workflow_node_registry()["count"],
        "authority_gating": "enabled",
        "local_first": True,
    }
