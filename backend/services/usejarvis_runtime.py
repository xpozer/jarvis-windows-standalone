from __future__ import annotations

import json
import re
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from config import DATA_DIR

DB_PATH = DATA_DIR / "jarvis_runtime.db"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _connect() -> sqlite3.Connection:
    DATA_DIR.mkdir(exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_runtime() -> None:
    with _connect() as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS memory_facts (
              id TEXT PRIMARY KEY,
              fact_text TEXT NOT NULL,
              source_type TEXT NOT NULL,
              source_ref TEXT,
              confidence REAL NOT NULL DEFAULT 0.8,
              importance INTEGER NOT NULL DEFAULT 3,
              tags_json TEXT NOT NULL DEFAULT '[]',
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS memory_entities (
              id TEXT PRIMARY KEY,
              entity_type TEXT NOT NULL,
              canonical_name TEXT NOT NULL,
              aliases_json TEXT NOT NULL DEFAULT '[]',
              metadata_json TEXT NOT NULL DEFAULT '{}',
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS memory_relationships (
              id TEXT PRIMARY KEY,
              source_entity_id TEXT NOT NULL,
              relationship_type TEXT NOT NULL,
              target_entity_id TEXT NOT NULL,
              confidence REAL NOT NULL DEFAULT 0.8,
              evidence_fact_id TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS awareness_events (
              id TEXT PRIMARY KEY,
              event_type TEXT NOT NULL,
              app_name TEXT,
              window_title TEXT,
              summary TEXT,
              payload_json TEXT NOT NULL DEFAULT '{}',
              created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS action_requests (
              id TEXT PRIMARY KEY,
              action_type TEXT NOT NULL,
              summary TEXT NOT NULL,
              risk TEXT NOT NULL,
              status TEXT NOT NULL,
              payload_json TEXT NOT NULL DEFAULT '{}',
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL,
              approved_at TEXT,
              rejected_at TEXT
            );

            CREATE TABLE IF NOT EXISTS goals (
              id TEXT PRIMARY KEY,
              type TEXT NOT NULL,
              parent_id TEXT,
              title TEXT NOT NULL,
              description TEXT,
              score REAL NOT NULL DEFAULT 0,
              target_score REAL NOT NULL DEFAULT 1,
              status TEXT NOT NULL DEFAULT 'active',
              due_date TEXT,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS audit_events (
              id TEXT PRIMARY KEY,
              actor TEXT NOT NULL,
              event_type TEXT NOT NULL,
              risk TEXT NOT NULL DEFAULT 'low',
              summary TEXT NOT NULL,
              payload_json TEXT NOT NULL DEFAULT '{}',
              created_at TEXT NOT NULL
            );
            """
        )


def _row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    out = dict(row)
    for key in ("tags_json", "payload_json", "aliases_json", "metadata_json"):
        if key in out:
            target = key.replace("_json", "")
            try:
                out[target] = json.loads(out[key] or ("[]" if key in {"tags_json", "aliases_json"} else "{}"))
            except Exception:
                out[target] = [] if key in {"tags_json", "aliases_json"} else {}
            del out[key]
    return out


def audit(actor: str, event_type: str, summary: str, risk: str = "low", payload: dict[str, Any] | None = None) -> dict[str, Any]:
    init_runtime()
    item = {
        "id": f"audit_{uuid.uuid4().hex}",
        "actor": actor,
        "event_type": event_type,
        "risk": risk,
        "summary": summary,
        "payload_json": json.dumps(payload or {}, ensure_ascii=False),
        "created_at": now_iso(),
    }
    with _connect() as db:
        db.execute(
            "INSERT INTO audit_events(id, actor, event_type, risk, summary, payload_json, created_at) VALUES (:id, :actor, :event_type, :risk, :summary, :payload_json, :created_at)",
            item,
        )
    return {**item, "payload": payload or {}}


def add_fact(fact_text: str, source_type: str = "manual", source_ref: str | None = None, confidence: float = 0.8, importance: int = 3, tags: list[str] | None = None) -> dict[str, Any]:
    init_runtime()
    text = fact_text.strip()
    if not text:
        raise ValueError("fact_text darf nicht leer sein")
    ts = now_iso()
    item = {
        "id": f"fact_{uuid.uuid4().hex}",
        "fact_text": text,
        "source_type": source_type,
        "source_ref": source_ref,
        "confidence": max(0.0, min(1.0, float(confidence))),
        "importance": max(1, min(5, int(importance))),
        "tags_json": json.dumps(tags or [], ensure_ascii=False),
        "created_at": ts,
        "updated_at": ts,
    }
    with _connect() as db:
        db.execute(
            """
            INSERT INTO memory_facts(id, fact_text, source_type, source_ref, confidence, importance, tags_json, created_at, updated_at)
            VALUES (:id, :fact_text, :source_type, :source_ref, :confidence, :importance, :tags_json, :created_at, :updated_at)
            """,
            item,
        )
    audit("memory", "memory.fact.created", text[:180], "low", {"fact_id": item["id"], "source_type": source_type})
    return _row_to_dict(sqlite3.Row) if False else {**item, "tags": tags or []}


def search_facts(q: str = "", limit: int = 10) -> list[dict[str, Any]]:
    init_runtime()
    limit = max(1, min(50, int(limit or 10)))
    query = (q or "").strip().lower()
    with _connect() as db:
        if query:
            terms = [t for t in re.split(r"\s+", query) if len(t) >= 2][:8]
            rows = db.execute("SELECT * FROM memory_facts ORDER BY importance DESC, updated_at DESC LIMIT 250").fetchall()
            scored: list[tuple[int, sqlite3.Row]] = []
            for row in rows:
                text = str(row["fact_text"]).lower()
                score = sum(1 for term in terms if term in text)
                if query in text:
                    score += 4
                if score > 0:
                    scored.append((score + int(row["importance"]), row))
            scored.sort(key=lambda item: item[0], reverse=True)
            return [_row_to_dict(row) for _, row in scored[:limit]]
        rows = db.execute("SELECT * FROM memory_facts ORDER BY importance DESC, updated_at DESC LIMIT ?", (limit,)).fetchall()
        return [_row_to_dict(row) for row in rows]


def extract_facts_from_text(text: str, source_ref: str = "chat") -> list[dict[str, Any]]:
    clean = (text or "").strip()
    if not clean or len(clean) < 12:
        return []

    candidates: list[str] = []
    for sentence in re.split(r"(?<=[.!?])\s+|\n+", clean):
        s = sentence.strip(" -•\t")
        if len(s) < 20 or len(s) > 260:
            continue
        lower = s.lower()
        signal = any(token in lower for token in [
            "ich ", "mein ", "meine ", "wir ", "jarvis", "projekt", "github", "repo", "ziel", "wichtig", "soll", "muss", "immer", "nie", "nutze", "arbeite"
        ])
        if signal:
            candidates.append(s)

    facts: list[dict[str, Any]] = []
    for sentence in candidates[:5]:
        try:
            facts.append(add_fact(sentence, source_type="chat_extraction", source_ref=source_ref, confidence=0.62, importance=3, tags=["auto", "chat"]))
        except Exception:
            continue
    return facts


def memory_context(query: str, limit: int = 5) -> list[str]:
    return [item["fact_text"] for item in search_facts(query, limit=limit)]


def list_facts(limit: int = 25) -> list[dict[str, Any]]:
    return search_facts("", limit=limit)


def delete_fact(fact_id: str) -> dict[str, Any]:
    init_runtime()
    with _connect() as db:
        row = db.execute("SELECT * FROM memory_facts WHERE id=?", (fact_id,)).fetchone()
        if not row:
            return {"ok": False, "error": "not_found"}
        db.execute("DELETE FROM memory_facts WHERE id=?", (fact_id,))
    audit("memory", "memory.fact.deleted", fact_id, "medium", {"fact_id": fact_id})
    return {"ok": True, "deleted": fact_id}


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
        db.execute(
            "INSERT INTO awareness_events(id, event_type, app_name, window_title, summary, payload_json, created_at) VALUES (:id, :event_type, :app_name, :window_title, :summary, :payload_json, :created_at)",
            item,
        )
    return {**item, "payload": payload or {}}


def current_awareness() -> dict[str, Any]:
    init_runtime()
    with _connect() as db:
        row = db.execute("SELECT * FROM awareness_events ORDER BY created_at DESC LIMIT 1").fetchone()
    if not row:
        return {
            "ok": True,
            "status": "idle",
            "summary": "Noch kein Awareness Ereignis vorhanden.",
            "privacy": "local_first",
            "paused": False,
        }
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
    }
    with _connect() as db:
        db.execute(
            """
            INSERT INTO action_requests(id, action_type, summary, risk, status, payload_json, created_at, updated_at, approved_at, rejected_at)
            VALUES (:id, :action_type, :summary, :risk, :status, :payload_json, :created_at, :updated_at, :approved_at, :rejected_at)
            """,
            item,
        )
    audit("authority", "action.requested", summary, final_risk, {"action_id": item["id"], "status": status})
    return {**item, "payload": payload or {}}


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
        db.execute(
            "UPDATE action_requests SET status=?, updated_at=?, approved_at=?, rejected_at=? WHERE id=?",
            (status, ts, ts if approve else None, None if approve else ts, action_id),
        )
    audit("authority", f"action.{status}", action_id, str(row["risk"]), {"action_id": action_id})
    return {"ok": True, "action_id": action_id, "status": status}


def create_goal(goal_type: str, title: str, description: str | None = None, parent_id: str | None = None, due_date: str | None = None) -> dict[str, Any]:
    init_runtime()
    ts = now_iso()
    item = {
        "id": f"goal_{uuid.uuid4().hex}",
        "type": goal_type,
        "parent_id": parent_id,
        "title": title,
        "description": description,
        "score": 0.0,
        "target_score": 1.0,
        "status": "active",
        "due_date": due_date,
        "created_at": ts,
        "updated_at": ts,
    }
    with _connect() as db:
        db.execute(
            """
            INSERT INTO goals(id, type, parent_id, title, description, score, target_score, status, due_date, created_at, updated_at)
            VALUES (:id, :type, :parent_id, :title, :description, :score, :target_score, :status, :due_date, :created_at, :updated_at)
            """,
            item,
        )
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
    roles = [
        ("primary", "Primary Agent", "Nutzerkontakt, Kontext, Freigaben"),
        ("researcher", "Researcher", "Recherche, Quellen, Vergleich"),
        ("coder", "Coder", "Code Analyse, Patches, Tests"),
        ("reviewer", "Reviewer", "Prüfung von Qualität und Risiko"),
        ("planner", "Planner", "Ziele, Reihenfolge, Tagesplanung"),
        ("writer", "Writer", "Doku, Texte, Spezifikationen"),
        ("analyst", "Analyst", "Datenanalyse und Metriken"),
        ("sysadmin", "Sysadmin", "Windows, Dienste, Logs"),
        ("devops", "DevOps", "Git, Builds, Releases"),
        ("security", "Security", "Secrets, Rechte, Freigaben"),
        ("designer", "Designer", "UI und visuelle Systeme"),
        ("data_engineer", "Data Engineer", "Speicher, Vektoren, ETL"),
    ]
    return [{"id": rid, "name": name, "description": desc, "authority": "prepare_only" if rid != "primary" else "approval_owner"} for rid, name, desc in roles]


def runtime_status() -> dict[str, Any]:
    init_runtime()
    with _connect() as db:
        facts = db.execute("SELECT COUNT(*) AS c FROM memory_facts").fetchone()["c"]
        actions = db.execute("SELECT COUNT(*) AS c FROM action_requests").fetchone()["c"]
        pending = db.execute("SELECT COUNT(*) AS c FROM action_requests WHERE status='pending_approval'").fetchone()["c"]
        goals_count = db.execute("SELECT COUNT(*) AS c FROM goals").fetchone()["c"]
        awareness_count = db.execute("SELECT COUNT(*) AS c FROM awareness_events").fetchone()["c"]
    return {
        "ok": True,
        "runtime": "jarvis-local-usejarvis-core",
        "database": str(DB_PATH),
        "primitives": {
            "memory": {"status": "active", "facts": facts},
            "awareness": {"status": "active", "events": awareness_count},
            "action": {"status": "active", "requests": actions, "pending_approval": pending},
            "orchestration": {"status": "defined", "agents": len(agents())},
        },
        "goals": goals_count,
        "workflow_nodes": workflow_node_registry()["count"],
        "authority_gating": "enabled",
        "local_first": True,
    }
