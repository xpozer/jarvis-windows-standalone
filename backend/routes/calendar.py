from __future__ import annotations

from fastapi import APIRouter

from services import calendar_service

router = APIRouter(prefix="/api/calendar", tags=["calendar"])


@router.get("/status")
def calendar_status():
    return calendar_service.provider_status()


@router.post("/connect/{provider}")
def calendar_connect(provider: str):
    return calendar_service.connect_provider(provider)


@router.post("/provider/{provider}")
def calendar_set_provider(provider: str):
    return calendar_service.save_provider(provider)


@router.get("/today")
def today_calendar(limit: int = 5):
    return calendar_service.today_events(limit=limit)


@router.get("/upcoming")
def upcoming_calendar(days: int = 7, limit: int = 8):
    return calendar_service.upcoming_events(days=days, limit=limit)
