from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from typing import Any

from config import DATA_DIR

DB_PATH = DATA_DIR / "jarvis_runtime.db"


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def connect() -> sqlite3.Connection:
    DATA_DIR.mkdir(exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def init_runtime() -> None:
    with connect() as db:
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
              rejected_at TEXT,
              executed_at TEXT,
              result_json TEXT NOT NULL DEFAULT '{}'
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
        existing_cols = {row[1] for row in db.execute("PRAGMA table_info(action_requests)").fetchall()}
        if "executed_at" not in existing_cols:
            db.execute("ALTER TABLE action_requests ADD COLUMN executed_at TEXT")
        if "result_json" not in existing_cols:
            db.execute("ALTER TABLE action_requests ADD COLUMN result_json TEXT NOT NULL DEFAULT '{}'")


def row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    out = dict(row)
    for key in ("tags_json", "payload_json", "aliases_json", "metadata_json", "result_json"):
        if key in out:
            target = key.replace("_json", "")
            try:
                out[target] = json.loads(out[key] or ("[]" if key in {"tags_json", "aliases_json"} else "{}"))
            except Exception:
                out[target] = [] if key in {"tags_json", "aliases_json"} else {}
            del out[key]
    return out
