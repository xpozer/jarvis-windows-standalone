from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Request, HTTPException, UploadFile, File


from services import files as files_service
from services import work as work_service

router = APIRouter()

@router.post("/work/template")
async def api_work_template(req: Request):
    return await work_service.api_work_template(req=req)

@router.post("/work/calc/{kind}")
async def api_work_calc(kind: str, req: Request):
    return await work_service.api_work_calc(kind=kind, req=req)

@router.get("/work/vde")
def api_vde(topic: str = ""):
    return work_service.api_vde(topic=topic)

@router.get("/work/memory")
def api_work_memory(q: str = "", category: str = ""):
    return work_service.api_work_memory(q=q, category=category)

@router.post("/work/memory")
async def api_work_memory_add(req: Request):
    return await work_service.api_work_memory_add(req=req)

@router.delete("/work/memory/{category}/{key}")
def api_work_memory_delete(category: str, key: str):
    return work_service.api_work_memory_delete(category=category, key=key)

@router.post("/files/import")
async def api_file_import(file: UploadFile = File(...)):
    return await files_service.api_file_import(file=file)

@router.get("/files")
def api_files(q: str = ""):
    return files_service.api_files(q=q)

@router.get("/files/{file_id}")
def api_file_get(file_id: str):
    return files_service.api_file_get(file_id=file_id)

@router.post("/work-agent/generate")
async def api_work_agent_generate(req: Request):
    return await work_service.api_work_agent_generate(req=req)

@router.get("/work-agent/examples")
def api_work_agent_examples():
    return work_service.api_work_agent_examples()

@router.get("/work-agent/logs")
def api_work_agent_logs(limit: int = 50):
    return work_service.api_work_agent_logs(limit=limit)

@router.get("/work-agent/help")
def api_work_agent_help():
    return work_service.api_work_agent_help()

@router.post("/documents/index-text")
async def api_documents_index_text(req: Request):
    return await files_service.api_documents_index_text(req=req)

@router.post("/documents/analyze")
async def api_documents_analyze(req: Request):
    return await files_service.api_documents_analyze(req=req)

@router.get("/documents/search")
def api_documents_search(q: str = "", limit: int = 20):
    return files_service.api_documents_search(q=q, limit=limit)

@router.get("/work/types")
def api_work_types():
    return work_service.api_work_types()

@router.post("/work/generate")
async def api_work_generate(req: Request):
    return await work_service.api_work_generate(req=req)

@router.get("/work/examples/{kind}")
def api_work_example(kind: str):
    return work_service.api_work_example(kind=kind)
