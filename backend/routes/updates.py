from __future__ import annotations

from fastapi import APIRouter

from services import update_center

router = APIRouter(prefix="/api/updates", tags=["updates"])


@router.get("/status")
def api_updates_status():
    return update_center.status(refresh=False)


@router.post("/check")
def api_updates_check():
    return update_center.status(refresh=True)


@router.get("/plan")
def api_updates_plan():
    return update_center.plan()
