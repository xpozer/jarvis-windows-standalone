from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import Request, HTTPException, UploadFile, File
from services import _runtime as core


def skills_list():
    return core.skills_list()

async def skills_create(req: Request):
    return await core.skills_create(req=req)

def skills_delete(name: str):
    return core.skills_delete(name=name)

def skills_reload():
    return core.skills_reload()
