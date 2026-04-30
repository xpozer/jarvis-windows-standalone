from __future__ import annotations

from fastapi import APIRouter

from services import day_start_service

router = APIRouter(prefix="/api/day-start", tags=["day-start"])


@router.get("")
def get_day_start():
    return day_start_service.day_start()
