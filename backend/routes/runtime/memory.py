from __future__ import annotations

from fastapi import APIRouter, HTTPException

from routes.runtime_models import ExtractIn, FactIn
from services import usejarvis_runtime as rt

router = APIRouter()


@router.get("/memory/facts")
def memory_facts(limit: int = 25):
    return {"ok": True, "facts": rt.list_facts(limit=limit)}


@router.get("/memory/search")
def memory_search(q: str = "", limit: int = 10):
    return {"ok": True, "query": q, "facts": rt.search_facts(q=q, limit=limit)}


@router.post("/memory/facts")
def memory_add_fact(req: FactIn):
    try:
        return {"ok": True, "fact": rt.add_fact(req.fact_text, req.source_type, req.source_ref, req.confidence, req.importance, req.tags)}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/memory/extract")
def memory_extract(req: ExtractIn):
    return {"ok": True, "facts": rt.extract_facts_from_text(req.text, source_ref=req.source_ref)}


@router.delete("/memory/facts/{fact_id}")
def memory_delete_fact(fact_id: str):
    result = rt.delete_fact(fact_id)
    if not result.get("ok"):
        raise HTTPException(status_code=404, detail="Fact not found")
    return result
