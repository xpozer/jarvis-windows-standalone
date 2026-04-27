from __future__ import annotations

import json
import os
from datetime import date, datetime, timedelta
from typing import Any

from config import DATA_DIR

CALENDAR_FILE = DATA_DIR / "calendar_events.json"
CALENDAR_SETTINGS_FILE = DATA_DIR / "calendar_settings.json"

PROVIDERS = {
    "local": {
        "id": "local",
        "label": "Lokale JSON Termine",
        "connectable": True,
        "connected": True,
        "description": "Fallback über data/calendar_events.json",
    },
    "google": {
        "id": "google",
        "label": "Google Kalender",
        "connectable": True,
        "connected": bool(os.environ.get("JARVIS_GOOGLE_CALENDAR_TOKEN")),
        "description": "Vorbereitet für OAuth oder Token basierte Google Kalender Anbindung.",
    },
    "outlook": {
        "id": "outlook",
        "label": "Outlook / Microsoft 365",
        "connectable": True,
        "connected": bool(os.environ.get("JARVIS_OUTLOOK_CALENDAR_TOKEN")),
        "description": "Vorbereitet für Microsoft Graph Kalender Anbindung.",
    },
}


def _read_json_file(path, fallback):
    if not path.exists():
        return fallback
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return fallback


def _write_json_file(path, data: Any) -> None:
    DATA_DIR.mkdir(exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def get_settings() -> dict[str, Any]:
    settings = _read_json_file(CALENDAR_SETTINGS_FILE, {})
    provider = str(settings.get("provider") or "local").lower()
    if provider not in PROVIDERS:
        provider = "local"
    return {
        "provider": provider,
        "updated_at": settings.get("updated_at"),
    }


def save_provider(provider: str) -> dict[str, Any]:
    clean = provider.lower().strip()
    if clean not in PROVIDERS:
        return {"ok": False, "error": "unknown_provider", "provider": provider}
    data = {"provider": clean, "updated_at": datetime.now().isoformat()}
    _write_json_file(CALENDAR_SETTINGS_FILE, data)
    return {"ok": True, **data}


def provider_status() -> dict[str, Any]:
    settings = get_settings()
    providers = []
    for provider in PROVIDERS.values():
        item = dict(provider)
        item["active"] = item["id"] == settings["provider"]
        providers.append(item)
    return {
        "ok": True,
        "active_provider": settings["provider"],
        "providers": providers,
        "settings_file": str(CALENDAR_SETTINGS_FILE),
        "local_file": str(CALENDAR_FILE),
    }


def connect_provider(provider: str) -> dict[str, Any]:
    clean = provider.lower().strip()
    if clean not in PROVIDERS:
        return {"ok": False, "error": "unknown_provider", "provider": provider}
    if clean == "local":
        save_provider("local")
        return {"ok": True, "provider": "local", "connected": True, "message": "Lokaler Kalender ist aktiv."}
    env_key = "JARVIS_GOOGLE_CALENDAR_TOKEN" if clean == "google" else "JARVIS_OUTLOOK_CALENDAR_TOKEN"
    if os.environ.get(env_key):
        save_provider(clean)
        return {"ok": True, "provider": clean, "connected": True, "message": f"{PROVIDERS[clean]['label']} ist über Umgebungsvariable vorbereitet."}
    return {
        "ok": False,
        "provider": clean,
        "connected": False,
        "needs_setup": True,
        "message": f"{PROVIDERS[clean]['label']} ist vorbereitet, aber noch kein Token gesetzt.",
        "env_key": env_key,
    }


def _read_local_events() -> list[dict[str, Any]]:
    raw = _read_json_file(CALENDAR_FILE, [])
    if isinstance(raw, list):
        return [item for item in raw if isinstance(item, dict)]
    if isinstance(raw, dict) and isinstance(raw.get("events"), list):
        return [item for item in raw["events"] if isinstance(item, dict)]
    return []


def _read_provider_events() -> tuple[str, list[dict[str, Any]], dict[str, Any]]:
    settings = get_settings()
    provider = settings["provider"]
    if provider == "google" and not os.environ.get("JARVIS_GOOGLE_CALENDAR_TOKEN"):
        return "local", _read_local_events(), {"fallback_reason": "google_not_connected"}
    if provider == "outlook" and not os.environ.get("JARVIS_OUTLOOK_CALENDAR_TOKEN"):
        return "local", _read_local_events(), {"fallback_reason": "outlook_not_connected"}
    if provider in {"google", "outlook"}:
        # Real provider sync will be connected here. Local fallback keeps the UI functional.
        return provider, _read_local_events(), {"connector_ready": True, "sync": "not_implemented_yet"}
    return "local", _read_local_events(), {}


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


def _normalize_event(item: dict[str, Any], source: str) -> dict[str, Any]:
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
        "source": item.get("source") or source,
        "all_day": is_all_day,
    }


def _sort_key(item: dict[str, Any]) -> tuple[int, str]:
    start = _parse_dt(item.get("start") or item.get("start_time") or item.get("datetime"))
    if start:
        return (0, start.isoformat())
    return (1, str(item.get("title") or item.get("summary") or ""))


def today_events(limit: int = 5) -> dict[str, Any]:
    today = date.today()
    source, raw_events, meta = _read_provider_events()
    events = [item for item in raw_events if _event_date(item) == today]
    events.sort(key=_sort_key)
    normalized = [_normalize_event(item, source) for item in events[: max(1, min(12, limit))]]
    return {
        "ok": True,
        "date": today.isoformat(),
        "source": source,
        "active_provider": get_settings()["provider"],
        "calendar_file": str(CALENDAR_FILE),
        "events": normalized,
        "count": len(normalized),
        "empty_message": "Keine Termine für heute gefunden.",
        **meta,
    }


def upcoming_events(days: int = 7, limit: int = 8) -> dict[str, Any]:
    start_day = date.today()
    end_day = start_day + timedelta(days=max(1, min(31, days)))
    source, raw_events, meta = _read_provider_events()
    events = []
    for item in raw_events:
        item_day = _event_date(item)
        if item_day and start_day <= item_day <= end_day:
            events.append(item)
    events.sort(key=_sort_key)
    normalized = [_normalize_event(item, source) for item in events[: max(1, min(20, limit))]]
    return {
        "ok": True,
        "from": start_day.isoformat(),
        "to": end_day.isoformat(),
        "source": source,
        "active_provider": get_settings()["provider"],
        "calendar_file": str(CALENDAR_FILE),
        "events": normalized,
        "count": len(normalized),
        "empty_message": "Keine anstehenden Termine gefunden.",
        **meta,
    }
