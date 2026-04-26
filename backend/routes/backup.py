from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Request, HTTPException, UploadFile, File


from services import backup as backup_service

router = APIRouter()

@router.get("/backup/list")
def api_backup_list():
    return backup_service.api_backup_list()

@router.post("/backup/create")
async def api_backup_create(req: Request):
    return await backup_service.api_backup_create(req=req)

@router.post("/backup/restore")
async def api_backup_restore(req: Request):
    return await backup_service.api_backup_restore(req=req)

@router.get("/update/status")
def api_update_status():
    return backup_service.api_update_status()

@router.post("/update/prepare")
async def api_update_prepare(req: Request):
    return await backup_service.api_update_prepare(req=req)


from services import product_update as product_update_service

@router.get("/update/manifest")
def api_update_manifest():
    return product_update_service.package_manifest()

@router.get("/update/staged")
def api_update_staged():
    return product_update_service.list_staged_updates()

@router.post("/update/stage-upload")
async def api_update_stage_upload(file: UploadFile = File(...)):
    return await product_update_service.stage_update_upload(file=file)

@router.post("/update/plan")
async def api_update_plan(req: Request):
    body = await req.json()
    return product_update_service.prepare_update_plan(
        target_version=str(body.get("target_version") or ""),
        source=str(body.get("source") or "manual"),
    )

@router.get("/update/rollback-candidates")
def api_update_rollback_candidates():
    return product_update_service.rollback_candidates()

@router.get("/update/github/config")
def api_update_github_config():
    return product_update_service.github_update_config()

@router.get("/update/github/check")
def api_update_github_check():
    return product_update_service.check_github_release_update()

@router.post("/update/github/stage")
async def api_update_github_stage(req: Request):
    body = await req.json()
    return product_update_service.stage_github_release_update(
        asset_name=str(body.get("asset_name") or ""),
    )
