from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Request, HTTPException, UploadFile, File


from services import knowledge as knowledge_service

router = APIRouter()

@router.get("/knowledge/answer")
def api_b4_knowledge_answer(q: str = "", limit: int = 6, category: str = ""):
    return knowledge_service.api_b4_knowledge_answer(q=q, limit=limit, category=category)

@router.get("/knowledge/stats")
def api_knowledge_stats():
    return knowledge_service.api_knowledge_stats()

@router.get("/knowledge/documents")
def api_knowledge_documents():
    return knowledge_service.api_knowledge_documents()

@router.post("/knowledge/import")
async def api_knowledge_import(req: Request):
    return await knowledge_service.api_knowledge_import(req=req)

@router.get("/knowledge/search")
def api_knowledge_search(q: str = "", limit: int = 10, category: str = ""):
    return knowledge_service.api_knowledge_search(q=q, limit=limit, category=category)

@router.delete("/knowledge/documents/{doc_id}")
def api_knowledge_delete(doc_id: str):
    return knowledge_service.api_knowledge_delete(doc_id=doc_id)

@router.post("/knowledge/rebuild")
def api_knowledge_rebuild():
    return knowledge_service.api_knowledge_rebuild()

@router.get("/knowledge/categories")
def api_knowledge_categories():
    return knowledge_service.api_knowledge_categories()
