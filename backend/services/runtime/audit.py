from __future__ import annotations

import json
import uuid
from typing import Any

from services.runtime.db import connect, init_runtime, now_iso


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
    with connect() as db:
        db.execute(
            "INSERT INTO audit_events(id, actor, event_type, risk, summary, payload_json, created_at) VALUES (:id, :actor, :event_type, :risk, :summary, :payload_json, :created_at)",
            item,
        )
    return {**item, "payload": payload or {}}
