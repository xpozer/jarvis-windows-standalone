from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Request, HTTPException, UploadFile, File


from services import ai_core as ai_core_service

router = APIRouter()

@router.get("/v1/models")
def models():
    return ai_core_service.models()

@router.post("/v1/chat/completions")
async def chat_completions(req: Request):
    return await ai_core_service.chat_completions(req=req)

@router.get("/v1/memory/stats")
def memory_stats():
    return ai_core_service.memory_stats()

@router.post("/v1/memory/search")
async def memory_search(req: Request):
    return await ai_core_service.memory_search(req=req)

@router.post("/v1/memory/index")
async def memory_index(req: Request):
    return await ai_core_service.memory_index(req=req)
