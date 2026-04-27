from __future__ import annotations

from typing import Any

from services.runtime.db import DB_PATH, connect, init_runtime
from services.runtime.registry import agents, workflow_node_registry


def runtime_status() -> dict[str, Any]:
    init_runtime()
    with connect() as db:
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
