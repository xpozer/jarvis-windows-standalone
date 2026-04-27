from __future__ import annotations

import json
from datetime import date, datetime, timedelta
from typing import Any

from fastapi import APIRouter

from config import DATA_DIR

router = APIRouter(prefix="/api/calendar", tags=["calendar"])
CALENDAR_FILE = DATA_DIR / "calendar_events.json"


def _read_events() -> list[dict[str, Any]]:
    if not CALENDAR_FILE.exists():
        return []
    try:
        raw = json.loads(CALENDAR_FILE.read_text(encoding="utf-8"))
    except Exception:
        return []
    if isinstance(raw, list):
        return [item for item in raw if isinstance(item, dict)]
    if isinstance(raw, dict) and isinstance(raw.get("events"), list):
        return [item for item in raw["events"] if isinstance(item, dict)]
    return []


def _parse_dt(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value.strip():
        return None
    clean = value.strip().replace("Z", "+00:00")
    try:
        parsed = datetime.fromisoformat(clean)
        if parsed.tzinfo is not None:
            parsed = parsed.astimezone().replace(tzinfo=None)
        return parsed
    except Exception:
        return None


def _event_date(item: dict[str, Any]) -> date | None:
    start = _parse_dt(item.get("start") or item.get("start_time") or item.get("datetime"))
    if start:
        return start.date()
    raw_date = item.get("date")
    if isinstance(raw_date, str):
        try:
            return date.fromisoformat(raw_date[:10])
        except Exception:
            return None
    return None


def _normalize_event(item: dict[str, Any]) -> dict[str, Any]:
    start = _parse_dt(item.get("start") or item.get("start_time") or item.get("datetime"))
    end = _parse_dt(item.get("end") or item.get("end_time"))
    is_all_day = bool(item.get("all_day")) or (not start and bool(item.get("date")))
    if is_all_day:
        time_label = "Ganztägig"
    elif start and end:
        time_label = f"{start.strftime('%H:%M')} bis {end.strftime('%H:%M')}"
    elif start:
        time_label = start.strftime("%H:%M")
    else:
        time_label = "Ohne Uhrzeit"
    title = str(item.get("title") or item.get("summary") or "Termin").strip() or "Termin"
    return {
        "id": str(item.get("id") or f"event_{abs(hash(json.dumps(item, ensure_ascii=False, sort_keys=True))) }"),
        "title": title,
        "time": time_label,
        "start": start.isoformat() if start else None,
        "end": end.isoformat() if end else None,
        "location": item.get("location") or "",
        "description": item.get("description") or "",
        "source": item.get("source") or "local",
        "all_day": is_all_day,
    }


def _sort_key(item: dict[str, Any]) -> tuple[int, str]:
    start = _parse_dt(item.get("start") or item.get("start_time") or item.get("datetime"))
    if start:
        return (0, start.isoformat())
    return (1, str(item.get("title") or item.get("summary") or ""))


@router.get("/today")
def today_calendar(limit: int = 5):
    today = date.today()
    events = [item for item in _read_events() if _event_date(item) == today]
    events.sort(key=_sort_key)
    normalized = [_normalize_event(item) for item in events[: max(1, min(12, limit))]]
    return {
        "ok": True,
        "date": today.isoformat(),
        "source": "local_json",
        "calendar_file": str(CALENDAR_FILE),
        "events": normalized,
        "count": len(normalized),
        "empty_message": "Keine Termine für heute gefunden.",
    }


@router.get("/upcoming")
def upcoming_calendar(days: int = 7, limit: int = 8):
    start_day = date.today()
    end_day = start_day + timedelta(days=max(1, min(31, days)))
    events = []
    for item in _read_events():
        item_day = _event_date(item)
        if item_day and start_day <= item_day <= end_day:
            events.append(item)
    events.sort(key=_sort_key)
    normalized = [_normalize_event(item) for item in events[: max(1, min(20, limit))]]
    return {
        "ok": True,
        "from": start_day.isoformat(),
        "to": end_day.isoformat(),
        "source": "local_json",
        "calendar_file": str(CALENDAR_FILE),
        "events": normalized,
        "count": len(normalized),
        "empty_message": "Keine anstehenden Termine gefunden.",
    }
