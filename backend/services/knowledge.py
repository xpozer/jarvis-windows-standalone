from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import Request, HTTPException, UploadFile, File
from services import _runtime as core
from services import usejarvis_runtime


def api_b4_knowledge_answer(q: str = "", limit: int = 6, category: str = ""):
    legacy = core.api_b4_knowledge_answer(q=q, limit=limit, category=category)
    runtime_facts = usejarvis_runtime.search_facts(q=q, limit=limit)
    return {
        "ok": True,
        "legacy": legacy,
        "runtime_memory": runtime_facts,
        "answer_hint": "Runtime Memory Fakten werden zusätzlich zur Knowledge Base bereitgestellt.",
    }

def api_knowledge_stats():
    legacy = core.api_knowledge_stats()
    runtime = usejarvis_runtime.runtime_status()
    return {
        "ok": True,
        "legacy": legacy,
        "runtime_memory": runtime["primitives"]["memory"],
        "runtime_database": runtime["database"],
        "authority_gating": runtime["authority_gating"],
    }

def api_knowledge_documents():
    return core.api_knowledge_documents()

async def api_knowledge_import(req: Request):
    return await core.api_knowledge_import(req=req)

def api_knowledge_search(q: str = "", limit: int = 10, category: str = ""):
    legacy = core.api_knowledge_search(q=q, limit=limit, category=category)
    runtime_facts = usejarvis_runtime.search_facts(q=q, limit=limit)
    return {
        "ok": True,
        "query": q,
        "category": category,
        "legacy": legacy,
        "runtime_facts": runtime_facts,
        "runtime_count": len(runtime_facts),
    }

def api_knowledge_delete(doc_id: str):
    if doc_id.startswith("fact_"):
        return usejarvis_runtime.delete_fact(doc_id)
    return core.api_knowledge_delete(doc_id=doc_id)

def api_knowledge_rebuild():
    legacy = core.api_knowledge_rebuild()
    usejarvis_runtime.audit("knowledge", "knowledge.rebuild", "Knowledge rebuild requested", "low", {})
    return {"ok": True, "legacy": legacy, "runtime": usejarvis_runtime.runtime_status()["primitives"]["memory"]}

def api_knowledge_categories():
    legacy = core.api_knowledge_categories()
    return {
        "ok": True,
        "legacy": legacy,
        "runtime_categories": ["auto", "chat", "manual", "api", "project", "preference", "decision"],
    }
