from __future__ import annotations

import json
import os
import urllib.parse
import urllib.request
from datetime import date, datetime
from typing import Any

from services import calendar_service
from services import notes as notes_service

DEFAULT_EXAM_TOPICS = [
    {"title": "IM BQ Wiederholung", "detail": "Offene Prüfungsthemen prüfen und 30 Minuten gezielt wiederholen.", "priority": "hoch"},
    {"title": "NTG / BWL / ZIB", "detail": "Ein Thema auswählen, eine Aufgabe rechnen, Ergebnis kurz notieren.", "priority": "mittel"},
]


def _safe_tasks(limit: int = 6) -> list[dict[str, Any]]:
    try:
        raw = notes_service.api_tasks(done=False, q="")
    except Exception:
        return []
    if isinstance(raw, dict):
        items = raw.get("tasks") or raw.get("items") or raw.get("data") or []
    elif isinstance(raw, list):
        items = raw
    else:
        items = []
    out = []
    for item in items[:limit]:
        if not isinstance(item, dict):
            continue
        title = str(item.get("title") or item.get("text") or item.get("task") or "Aufgabe").strip()
        if not title:
            continue
        out.append({
            "id": str(item.get("id") or item.get("task_id") or title),
            "title": title,
            "due": item.get("due") or item.get("due_date") or item.get("date") or "",
            "priority": item.get("priority") or item.get("level") or "offen",
        })
    return out


def _exam_topics(limit: int = 4) -> list[dict[str, Any]]:
    try:
        notes = notes_service.api_notes(q="prüfung exam bq ntg bwl zib meister", limit=20)
    except Exception:
        notes = []
    if isinstance(notes, dict):
        items = notes.get("notes") or notes.get("items") or notes.get("data") or []
    elif isinstance(notes, list):
        items = notes
    else:
        items = []
    topics = []
    for item in items:
        if not isinstance(item, dict):
            continue
        text = str(item.get("text") or item.get("title") or item.get("content") or "").strip()
        lower = text.lower()
        if not any(token in lower for token in ["prüfung", "bq", "ntg", "bwl", "zib", "meister", "aevo"]):
            continue
        topics.append({"title": text[:80], "detail": text[:180], "priority": "mittel"})
        if len(topics) >= limit:
            break
    if topics:
        return topics
    return DEFAULT_EXAM_TOPICS[:limit]


def _weather_telemetry() -> dict[str, Any]:
    city = os.environ.get("JARVIS_WEATHER_CITY", "Leverkusen")
    lat = os.environ.get("JARVIS_WEATHER_LAT", "51.0459")
    lon = os.environ.get("JARVIS_WEATHER_LON", "7.0192")
    url = "https://api.open-meteo.com/v1/forecast?" + urllib.parse.urlencode({
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m",
        "timezone": "Europe/Berlin",
    })
    try:
        with urllib.request.urlopen(url, timeout=4) as response:
            data = json.loads(response.read().decode("utf-8", errors="replace"))
        current = data.get("current") or {}
        return {
            "ok": True,
            "source": "open-meteo",
            "location": city,
            "temperature_c": current.get("temperature_2m"),
            "humidity_percent": current.get("relative_humidity_2m"),
            "precipitation_mm": current.get("precipitation"),
            "wind_kmh": current.get("wind_speed_10m"),
            "label": "Wetter Telemetrie live",
        }
    except Exception as exc:
        return {
            "ok": False,
            "source": "open-meteo",
            "location": city,
            "temperature_c": None,
            "humidity_percent": None,
            "precipitation_mm": None,
            "wind_kmh": None,
            "label": "Wetter Telemetrie nicht erreichbar",
            "error": str(exc),
        }


def day_start() -> dict[str, Any]:
    today = date.today().isoformat()
    tasks = _safe_tasks()
    topics = _exam_topics()
    calendar = calendar_service.today_events(limit=4)
    weather = _weather_telemetry()
    important = []
    if tasks:
        important.append(f"{len(tasks)} offene Aufgabe(n) aus dem letzten Stand")
    if calendar.get("count", 0):
        important.append(f"{calendar.get('count')} Termin(e) heute")
    if topics:
        important.append("Prüfungsthemen für kurze Wiederholung vorhanden")
    if not important:
        important.append("Keine kritischen Punkte erkannt")
    return {
        "ok": True,
        "mode": "day_start",
        "date": today,
        "generated_at": datetime.now().isoformat(timespec="seconds"),
        "headline": "Start in den Tag",
        "important": important[:5],
        "tasks": tasks,
        "exam_topics": topics,
        "calendar": calendar,
        "weather": weather,
    }
