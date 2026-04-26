from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import Request, HTTPException, UploadFile, File
from services import _runtime as core


async def api_file_import(file: UploadFile = File(...)):
    return await core.api_file_import(file=file)

def api_files(q: str = ""):
    return core.api_files(q=q)

def api_file_get(file_id: str):
    return core.api_file_get(file_id=file_id)

async def api_documents_index_text(req: Request):
    return await core.api_documents_index_text(req=req)

async def api_documents_analyze(req: Request):
    return await core.api_documents_analyze(req=req)

def api_documents_search(q: str = "", limit: int = 20):
    return core.api_documents_search(q=q, limit=limit)
