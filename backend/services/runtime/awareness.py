from __future__ import annotations

import json
import uuid
from typing import Any

from services.runtime.db import connect, init_runtime, now_iso, row_to_dict


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
    with connect() as db:
        db.execute("INSERT INTO awareness_events(id, event_type, app_name, window_title, summary, payload_json, created_at) VALUES (:id, :event_type, :app_name, :window_title, :summary, :payload_json, :created_at)", item)
    return {**item, "payload": payload or {}}


def current_awareness() -> dict[str, Any]:
    init_runtime()
    with connect() as db:
        row = db.execute("SELECT * FROM awareness_events ORDER BY created_at DESC LIMIT 1").fetchone()
    if not row:
        return {"ok": True, "status": "idle", "summary": "Noch kein Awareness Ereignis vorhanden.", "privacy": "local_first", "paused": False}
    return {"ok": True, "status": "active", "current": row_to_dict(row), "privacy": "local_first", "paused": False}
