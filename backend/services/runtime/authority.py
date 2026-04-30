from __future__ import annotations

import json
import uuid
from typing import Any

from services.runtime.audit import audit
from services.runtime.db import connect, init_runtime, now_iso, row_to_dict


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
    with connect() as db:
        db.execute("""
            INSERT INTO action_requests(id, action_type, summary, risk, status, payload_json, created_at, updated_at, approved_at, rejected_at, executed_at, result_json)
            VALUES (:id, :action_type, :summary, :risk, :status, :payload_json, :created_at, :updated_at, :approved_at, :rejected_at, :executed_at, :result_json)
        """, item)
    audit("authority", "action.requested", summary, final_risk, {"action_id": item["id"], "status": status})
    return {**item, "payload": payload or {}, "result": {}}


def get_action_request(action_id: str) -> dict[str, Any] | None:
    init_runtime()
    with connect() as db:
        row = db.execute("SELECT * FROM action_requests WHERE id=?", (action_id,)).fetchone()
    return row_to_dict(row) if row else None


def list_action_requests(limit: int = 25) -> list[dict[str, Any]]:
    init_runtime()
    with connect() as db:
        rows = db.execute("SELECT * FROM action_requests ORDER BY created_at DESC LIMIT ?", (max(1, min(100, limit)),)).fetchall()
    return [row_to_dict(row) for row in rows]


def approve_action(action_id: str, approve: bool = True) -> dict[str, Any]:
    init_runtime()
    ts = now_iso()
    status = "approved" if approve else "rejected"
    with connect() as db:
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
    with connect() as db:
        row = db.execute("SELECT * FROM action_requests WHERE id=?", (action_id,)).fetchone()
        if not row:
            return {"ok": False, "error": "not_found"}
        db.execute("UPDATE action_requests SET status=?, updated_at=?, executed_at=?, result_json=? WHERE id=?", (final_status, ts, ts, json.dumps(result or {}, ensure_ascii=False), action_id))
    audit("authority", f"action.{final_status}", action_id, "medium", {"action_id": action_id, "result": result})
    return {"ok": True, "action_id": action_id, "status": final_status, "result": result}
