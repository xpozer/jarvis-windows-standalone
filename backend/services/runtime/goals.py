from __future__ import annotations

import uuid
from typing import Any

from services.runtime.audit import audit
from services.runtime.db import connect, init_runtime, now_iso, row_to_dict


def create_goal(goal_type: str, title: str, description: str | None = None, parent_id: str | None = None, due_date: str | None = None) -> dict[str, Any]:
    init_runtime()
    ts = now_iso()
    item = {"id": f"goal_{uuid.uuid4().hex}", "type": goal_type, "parent_id": parent_id, "title": title, "description": description, "score": 0.0, "target_score": 1.0, "status": "active", "due_date": due_date, "created_at": ts, "updated_at": ts}
    with connect() as db:
        db.execute("""
            INSERT INTO goals(id, type, parent_id, title, description, score, target_score, status, due_date, created_at, updated_at)
            VALUES (:id, :type, :parent_id, :title, :description, :score, :target_score, :status, :due_date, :created_at, :updated_at)
        """, item)
    audit("goal", "goal.created", title, "low", {"goal_id": item["id"]})
    return item


def list_goals(limit: int = 50) -> list[dict[str, Any]]:
    init_runtime()
    with connect() as db:
        rows = db.execute("SELECT * FROM goals ORDER BY created_at DESC LIMIT ?", (max(1, min(100, limit)),)).fetchall()
    return [row_to_dict(row) for row in rows]
