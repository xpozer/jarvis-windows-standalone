from __future__ import annotations

import json
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import Any

from config import DATA_DIR
from services import usejarvis_runtime as rt

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


def init_workflow_runtime() -> None:
    rt.init_runtime()
    with _connect() as db:
        db.executescript(
            """
            CREATE TABLE IF NOT EXISTS workflows (
              id TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              description TEXT,
              enabled INTEGER NOT NULL DEFAULT 1,
              trigger_json TEXT NOT NULL DEFAULT '{}',
              nodes_json TEXT NOT NULL DEFAULT '[]',
              edges_json TEXT NOT NULL DEFAULT '[]',
              authority_policy TEXT NOT NULL DEFAULT 'high_requires_approval',
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS workflow_runs (
              id TEXT PRIMARY KEY,
              workflow_id TEXT NOT NULL,
              status TEXT NOT NULL,
              started_at TEXT NOT NULL,
              finished_at TEXT,
              result_json TEXT NOT NULL DEFAULT '{}',
              error TEXT,
              FOREIGN KEY(workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS sidecars (
              id TEXT PRIMARY KEY,
              machine_id TEXT NOT NULL UNIQUE,
              name TEXT NOT NULL,
              status TEXT NOT NULL,
              capabilities_json TEXT NOT NULL DEFAULT '[]',
              token_hint TEXT,
              last_seen_at TEXT NOT NULL,
              created_at TEXT NOT NULL,
              updated_at TEXT NOT NULL
            );
            """
        )


def _json_load(value: str, fallback: Any) -> Any:
    try:
        return json.loads(value or "")
    except Exception:
        return fallback


def _row(row: sqlite3.Row) -> dict[str, Any]:
    out = dict(row)
    for key, fallback in {
        "trigger_json": {},
        "nodes_json": [],
        "edges_json": [],
        "result_json": {},
        "capabilities_json": [],
    }.items():
        if key in out:
            out[key.replace("_json", "")] = _json_load(out.pop(key), fallback)
    if "enabled" in out:
        out["enabled"] = bool(out["enabled"])
    return out


def create_workflow(name: str, description: str | None = None, trigger: dict[str, Any] | None = None, nodes: list[dict[str, Any]] | None = None, edges: list[dict[str, Any]] | None = None, authority_policy: str = "high_requires_approval") -> dict[str, Any]:
    init_workflow_runtime()
    ts = now_iso()
    item = {
        "id": f"workflow_{uuid.uuid4().hex}",
        "name": name.strip(),
        "description": description,
        "enabled": 1,
        "trigger_json": json.dumps(trigger or {"type": "manual"}, ensure_ascii=False),
        "nodes_json": json.dumps(nodes or [], ensure_ascii=False),
        "edges_json": json.dumps(edges or [], ensure_ascii=False),
        "authority_policy": authority_policy,
        "created_at": ts,
        "updated_at": ts,
    }
    if not item["name"]:
        raise ValueError("Workflow Name darf nicht leer sein")
    with _connect() as db:
        db.execute(
            """
            INSERT INTO workflows(id, name, description, enabled, trigger_json, nodes_json, edges_json, authority_policy, created_at, updated_at)
            VALUES (:id, :name, :description, :enabled, :trigger_json, :nodes_json, :edges_json, :authority_policy, :created_at, :updated_at)
            """,
            item,
        )
    rt.audit("workflow", "workflow.created", item["name"], "low", {"workflow_id": item["id"]})
    return get_workflow(item["id"]) or {}


def list_workflows(limit: int = 50) -> list[dict[str, Any]]:
    init_workflow_runtime()
    with _connect() as db:
        rows = db.execute("SELECT * FROM workflows ORDER BY created_at DESC LIMIT ?", (max(1, min(100, limit)),)).fetchall()
    return [_row(row) for row in rows]


def get_workflow(workflow_id: str) -> dict[str, Any] | None:
    init_workflow_runtime()
    with _connect() as db:
        row = db.execute("SELECT * FROM workflows WHERE id=?", (workflow_id,)).fetchone()
    return _row(row) if row else None


def set_workflow_enabled(workflow_id: str, enabled: bool) -> dict[str, Any]:
    init_workflow_runtime()
    ts = now_iso()
    with _connect() as db:
        row = db.execute("SELECT id FROM workflows WHERE id=?", (workflow_id,)).fetchone()
        if not row:
            return {"ok": False, "error": "not_found"}
        db.execute("UPDATE workflows SET enabled=?, updated_at=? WHERE id=?", (1 if enabled else 0, ts, workflow_id))
    rt.audit("workflow", "workflow.enabled_changed", workflow_id, "low", {"enabled": enabled})
    return {"ok": True, "workflow_id": workflow_id, "enabled": enabled}


def _execute_node(node: dict[str, Any], context: dict[str, Any]) -> dict[str, Any]:
    node_type = str(node.get("type") or node.get("node_type") or "unknown")
    node_id = str(node.get("id") or f"node_{uuid.uuid4().hex[:8]}")
    config = node.get("config") if isinstance(node.get("config"), dict) else {}

    if node_type == "memory_write":
        fact_text = str(config.get("fact") or config.get("text") or node.get("text") or "").strip()
        if fact_text:
            fact = rt.add_fact(fact_text, source_type="workflow", source_ref=node_id, confidence=0.72, importance=int(config.get("importance") or 3), tags=["workflow"])
            return {"node_id": node_id, "type": node_type, "status": "ok", "fact_id": fact.get("id")}
        return {"node_id": node_id, "type": node_type, "status": "skipped", "reason": "empty_fact"}

    if node_type == "goal_update":
        title = str(config.get("title") or node.get("title") or "Workflow Ziel").strip()
        goal = rt.create_goal("task", title, description=str(config.get("description") or "Aus Workflow erzeugt"))
        return {"node_id": node_id, "type": node_type, "status": "ok", "goal_id": goal.get("id")}

    if node_type in {"shell_command", "file_write", "git_commit", "github_pull_request", "email_draft", "desktop_click", "browser_click"}:
        action = rt.create_action_request(node_type, f"Workflow Node {node_type} wartet auf Freigabe", payload={"node": node, "context": context})
        return {"node_id": node_id, "type": node_type, "status": "approval_required", "action_id": action.get("id"), "risk": action.get("risk")}

    if node_type in {"notification", "agent_task", "delay", "if_else", "switch", "template_render"}:
        return {"node_id": node_id, "type": node_type, "status": "prepared", "note": "Node ist registriert, echte Ausführung folgt in späterer Runtime Phase."}

    return {"node_id": node_id, "type": node_type, "status": "unknown_node", "self_heal": "Node wurde protokolliert und übersprungen."}


def run_workflow(workflow_id: str, input_payload: dict[str, Any] | None = None) -> dict[str, Any]:
    init_workflow_runtime()
    workflow = get_workflow(workflow_id)
    if not workflow:
        return {"ok": False, "error": "not_found"}
    if not workflow.get("enabled"):
        return {"ok": False, "error": "disabled"}

    run_id = f"run_{uuid.uuid4().hex}"
    started = now_iso()
    context = {"input": input_payload or {}, "workflow_id": workflow_id, "run_id": run_id}
    results: list[dict[str, Any]] = []
    status = "success"
    error_text = None

    with _connect() as db:
        db.execute(
            "INSERT INTO workflow_runs(id, workflow_id, status, started_at, result_json) VALUES (?, ?, ?, ?, ?)",
            (run_id, workflow_id, "running", started, "{}"),
        )

    try:
        for node in workflow.get("nodes", []):
            try:
                result = _execute_node(node, context)
                results.append(result)
                if result.get("status") == "approval_required":
                    status = "waiting_for_approval"
            except Exception as exc:
                status = "self_healed"
                results.append({"node_id": node.get("id"), "status": "self_healed", "error": str(exc), "strategy": "skip_and_continue"})
    except Exception as exc:
        status = "failed"
        error_text = str(exc)

    finished = now_iso()
    result_payload = {"workflow": workflow, "results": results, "input": input_payload or {}}
    with _connect() as db:
        db.execute(
            "UPDATE workflow_runs SET status=?, finished_at=?, result_json=?, error=? WHERE id=?",
            (status, finished, json.dumps(result_payload, ensure_ascii=False), error_text, run_id),
        )
    rt.audit("workflow", "workflow.run", workflow.get("name", workflow_id), "medium" if status == "waiting_for_approval" else "low", {"workflow_id": workflow_id, "run_id": run_id, "status": status})
    return {"ok": status != "failed", "run_id": run_id, "status": status, "results": results, "error": error_text}


def list_workflow_runs(workflow_id: str | None = None, limit: int = 50) -> list[dict[str, Any]]:
    init_workflow_runtime()
    with _connect() as db:
        if workflow_id:
            rows = db.execute("SELECT * FROM workflow_runs WHERE workflow_id=? ORDER BY started_at DESC LIMIT ?", (workflow_id, max(1, min(100, limit)))).fetchall()
        else:
            rows = db.execute("SELECT * FROM workflow_runs ORDER BY started_at DESC LIMIT ?", (max(1, min(100, limit)),)).fetchall()
    return [_row(row) for row in rows]


def register_sidecar(machine_id: str, name: str, capabilities: list[str] | None = None, token_hint: str | None = None) -> dict[str, Any]:
    init_workflow_runtime()
    ts = now_iso()
    capabilities = capabilities or []
    sidecar_id = f"sidecar_{uuid.uuid4().hex}"
    with _connect() as db:
        existing = db.execute("SELECT * FROM sidecars WHERE machine_id=?", (machine_id,)).fetchone()
        if existing:
            db.execute(
                "UPDATE sidecars SET name=?, status='online', capabilities_json=?, token_hint=?, last_seen_at=?, updated_at=? WHERE machine_id=?",
                (name, json.dumps(capabilities, ensure_ascii=False), token_hint, ts, ts, machine_id),
            )
            row = db.execute("SELECT * FROM sidecars WHERE machine_id=?", (machine_id,)).fetchone()
        else:
            db.execute(
                "INSERT INTO sidecars(id, machine_id, name, status, capabilities_json, token_hint, last_seen_at, created_at, updated_at) VALUES (?, ?, ?, 'online', ?, ?, ?, ?, ?)",
                (sidecar_id, machine_id, name, json.dumps(capabilities, ensure_ascii=False), token_hint, ts, ts, ts),
            )
            row = db.execute("SELECT * FROM sidecars WHERE id=?", (sidecar_id,)).fetchone()
    rt.audit("sidecar", "sidecar.registered", name, "medium", {"machine_id": machine_id, "capabilities": capabilities})
    return _row(row)


def heartbeat_sidecar(machine_id: str) -> dict[str, Any]:
    init_workflow_runtime()
    ts = now_iso()
    with _connect() as db:
        row = db.execute("SELECT * FROM sidecars WHERE machine_id=?", (machine_id,)).fetchone()
        if not row:
            return {"ok": False, "error": "not_found"}
        db.execute("UPDATE sidecars SET status='online', last_seen_at=?, updated_at=? WHERE machine_id=?", (ts, ts, machine_id))
        row = db.execute("SELECT * FROM sidecars WHERE machine_id=?", (machine_id,)).fetchone()
    return {"ok": True, "sidecar": _row(row)}


def list_sidecars(limit: int = 50) -> list[dict[str, Any]]:
    init_workflow_runtime()
    with _connect() as db:
        rows = db.execute("SELECT * FROM sidecars ORDER BY last_seen_at DESC LIMIT ?", (max(1, min(100, limit)),)).fetchall()
    return [_row(row) for row in rows]


def workflow_runtime_status() -> dict[str, Any]:
    init_workflow_runtime()
    with _connect() as db:
        workflows = db.execute("SELECT COUNT(*) AS c FROM workflows").fetchone()["c"]
        runs = db.execute("SELECT COUNT(*) AS c FROM workflow_runs").fetchone()["c"]
        sidecars = db.execute("SELECT COUNT(*) AS c FROM sidecars").fetchone()["c"]
    return {
        "ok": True,
        "workflows": workflows,
        "runs": runs,
        "sidecars": sidecars,
        "nodes": rt.workflow_node_registry(),
        "self_healing": "basic_skip_and_continue",
        "authority_gating": "connected",
    }
