from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Request, HTTPException, UploadFile, File


from services import skills as skills_service

router = APIRouter()

@router.get("/skills/list")
def skills_list():
    return skills_service.skills_list()

@router.post("/skills/create")
async def skills_create(req: Request):
    return await skills_service.skills_create(req=req)

@router.delete("/skills/{name}")
def skills_delete(name: str):
    return skills_service.skills_delete(name=name)

@router.post("/skills/reload")
def skills_reload():
    return skills_service.skills_reload()
