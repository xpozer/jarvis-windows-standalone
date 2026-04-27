from __future__ import annotations

import json
import re
import sqlite3
import uuid
from typing import Any

from services.runtime.audit import audit
from services.runtime.db import connect, init_runtime, now_iso, row_to_dict


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
    with connect() as db:
        db.execute(
            """
            INSERT INTO memory_facts(id, fact_text, source_type, source_ref, confidence, importance, tags_json, created_at, updated_at)
            VALUES (:id, :fact_text, :source_type, :source_ref, :confidence, :importance, :tags_json, :created_at, :updated_at)
            """,
            item,
        )
    audit("memory", "memory.fact.created", text[:180], "low", {"fact_id": item["id"], "source_type": source_type})
    return {**item, "tags": tags or []}


def search_facts(q: str = "", limit: int = 10) -> list[dict[str, Any]]:
    init_runtime()
    limit = max(1, min(50, int(limit or 10)))
    query = (q or "").strip().lower()
    with connect() as db:
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
            return [row_to_dict(row) for _, row in scored[:limit]]
        rows = db.execute("SELECT * FROM memory_facts ORDER BY importance DESC, updated_at DESC LIMIT ?", (limit,)).fetchall()
        return [row_to_dict(row) for row in rows]


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
        signal = any(token in lower for token in ["ich ", "mein ", "meine ", "wir ", "jarvis", "projekt", "github", "repo", "ziel", "wichtig", "soll", "muss", "immer", "nie", "nutze", "arbeite"])
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
    with connect() as db:
        row = db.execute("SELECT * FROM memory_facts WHERE id=?", (fact_id,)).fetchone()
        if not row:
            return {"ok": False, "error": "not_found"}
        db.execute("DELETE FROM memory_facts WHERE id=?", (fact_id,))
    audit("memory", "memory.fact.deleted", fact_id, "medium", {"fact_id": fact_id})
    return {"ok": True, "deleted": fact_id}
