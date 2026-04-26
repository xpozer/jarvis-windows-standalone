from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import Request, HTTPException, UploadFile, File
from services import _runtime as core


def api_b4_knowledge_answer(q: str = "", limit: int = 6, category: str = ""):
    return core.api_b4_knowledge_answer(q=q, limit=limit, category=category)

def api_knowledge_stats():
    return core.api_knowledge_stats()

def api_knowledge_documents():
    return core.api_knowledge_documents()

async def api_knowledge_import(req: Request):
    return await core.api_knowledge_import(req=req)

def api_knowledge_search(q: str = "", limit: int = 10, category: str = ""):
    return core.api_knowledge_search(q=q, limit=limit, category=category)

def api_knowledge_delete(doc_id: str):
    return core.api_knowledge_delete(doc_id=doc_id)

def api_knowledge_rebuild():
    return core.api_knowledge_rebuild()

def api_knowledge_categories():
    return core.api_knowledge_categories()
