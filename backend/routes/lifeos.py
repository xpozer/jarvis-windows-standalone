from __future__ import annotations

from fastapi import APIRouter

from services import lifeos

router = APIRouter(prefix="/api/lifeos", tags=["lifeos"])


@router.get("/status")
def api_lifeos_status():
    return lifeos.status()


@router.get("/briefing")
def api_lifeos_briefing():
    return lifeos.briefing()


@router.post("/briefing/regenerate")
def api_lifeos_briefing_regenerate():
    return lifeos.briefing()


@router.get("/installer-check")
def api_lifeos_installer_check():
    return lifeos.installer_check()
