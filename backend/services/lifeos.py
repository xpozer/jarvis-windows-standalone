from __future__ import annotations

import json
from datetime import date, datetime
from pathlib import Path
from typing import Any

from config import BASE_DIR, LIFEOS_EXAMPLE_FILE, LIFEOS_PRIVATE_FILE
from utils import log


FALLBACK_CONFIG: dict[str, Any] = {
    "version": "fallback",
    "mode": "local-first",
    "daily_briefing": {
        "day_mode": "FOCUSED",
        "priority_count": 3,
        "focus_minutes": 60,
        "open_loops": 0,
        "energy_percent": 70,
        "today_important": ["JARVIS LifeOS konfigurieren"],
        "next_best_action": "LifeOS private Konfiguration pruefen und Tagesfokus festlegen.",
    },
    "work_radar": {"items": []},
    "learning_radar": {"subjects": []},
    "life_modules": [],
    "timeline": [],
}


def _now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def _read_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))


def _load_config() -> tuple[dict[str, Any], dict[str, Any]]:
    candidates = [
        ("private", LIFEOS_PRIVATE_FILE),
        ("example", LIFEOS_EXAMPLE_FILE),
    ]
    for mode, path in candidates:
        if not path.exists():
            continue
        try:
            data = _read_json(path)
            if isinstance(data, dict):
                return data, {"mode": mode, "path": str(path), "loaded": True, "error": ""}
        except Exception as exc:
            log("WARN", "LifeOS Konfiguration konnte nicht geladen werden", path=str(path), error=str(exc))
            return FALLBACK_CONFIG, {"mode": "fallback", "path": str(path), "loaded": False, "error": str(exc)}
    return FALLBACK_CONFIG, {"mode": "fallback", "path": "", "loaded": True, "error": "Keine LifeOS Konfiguration gefunden"}


def _risk_weight(value: str) -> int:
    return {"critical": 5, "high": 4, "medium": 3, "low": 2, "none": 1}.get(value.lower(), 2)


def _status_weight(value: str) -> int:
    return {"blocked": 5, "attention": 4, "open": 4, "check": 3, "waiting": 3, "ready": 2, "stable": 1, "done": 0}.get(value.lower(), 2)


def _date_weight(value: str) -> int:
    if not value:
        return 0
    try:
        days = (date.fromisoformat(value[:10]) - date.today()).days
    except Exception:
        return 0
    if days < 0:
        return 5
    if days == 0:
        return 4
    if days <= 2:
        return 3
    if days <= 7:
        return 2
    return 1


def _due_state(value: str) -> str:
    if not value:
        return "open"
    try:
        days = (date.fromisoformat(value[:10]) - date.today()).days
    except Exception:
        return "open"
    if days < 0:
        return "overdue"
    if days == 0:
        return "today"
    if days <= 2:
        return "soon"
    return "later"


def _work_category(item: dict[str, Any]) -> str:
    raw = str(item.get("category") or "").strip()
    if raw:
        return raw.upper()
    probe = " ".join(str(item.get(key) or "") for key in ("id", "title", "note")).lower()
    if "sap" in probe:
        return "SAP"
    if "fsm" in probe:
        return "FSM"
    if "lnw" in probe or "leistungsnachweis" in probe:
        return "LNW"
    if "mail" in probe or "rueckfrage" in probe or "rückfrage" in probe or "kunde" in probe:
        return "MAIL"
    if "angebot" in probe or "bestellwert" in probe:
        return "ANGEBOT"
    if "vde" in probe or "dguv" in probe:
        return "RECHERCHE"
    if "abrechnung" in probe or "billing" in probe:
        return "ABRECHNUNG"
    return "ALLGEMEIN"


def _legacy_work_items(work_radar: dict[str, Any]) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for key, value in work_radar.items():
        if key == "items" or not isinstance(value, dict):
            continue
        title = str(value.get("title") or key.replace("_", " ").title())
        status_value = str(value.get("status") or "open")
        risk = "high" if status_value in {"attention", "blocked"} else "medium" if status_value in {"check", "waiting"} else "low"
        items.append({
            "id": key,
            "title": title,
            "status": status_value,
            "risk": risk,
            "deadline": str(value.get("deadline") or ""),
            "next_step": str(value.get("next_step") or value.get("note") or "Status pruefen"),
            "score_percent": value.get("score_percent"),
            "note": value.get("note", ""),
        })
    return items


def _work_items(config: dict[str, Any]) -> list[dict[str, Any]]:
    work_radar = config.get("work_radar") if isinstance(config.get("work_radar"), dict) else {}
    raw_items = work_radar.get("items")
    if isinstance(raw_items, list):
        items = [item for item in raw_items if isinstance(item, dict)]
    else:
        items = _legacy_work_items(work_radar)

    normalized: list[dict[str, Any]] = []
    for idx, item in enumerate(items):
        status_value = str(item.get("status") or "open")
        risk = str(item.get("risk") or ("high" if status_value in {"blocked", "attention"} else "medium"))
        deadline = str(item.get("deadline") or "")
        priority_score = _risk_weight(risk) * 10 + _status_weight(status_value) * 8 + _date_weight(deadline) * 6
        normalized.append({
            "id": str(item.get("id") or f"work_{idx + 1}"),
            "title": str(item.get("title") or item.get("name") or "Arbeitsthema"),
            "category": _work_category(item),
            "status": status_value,
            "risk": risk,
            "deadline": deadline,
            "due_state": _due_state(deadline),
            "next_step": str(item.get("next_step") or item.get("note") or "Naechsten Schritt klaeren"),
            "score_percent": item.get("score_percent"),
            "note": str(item.get("note") or ""),
            "priority_score": priority_score,
        })
    normalized.sort(key=lambda item: int(item.get("priority_score") or 0), reverse=True)
    return normalized


def _count_by(items: list[dict[str, Any]], key: str) -> dict[str, int]:
    counts: dict[str, int] = {}
    for item in items:
        value = str(item.get(key) or "unknown").lower()
        counts[value] = counts.get(value, 0) + 1
    return counts


def _work_radar_summary(items: list[dict[str, Any]]) -> dict[str, Any]:
    categories: dict[str, dict[str, Any]] = {}
    attention_status = {"blocked", "attention", "open", "check"}
    for item in items:
        category = str(item.get("category") or "ALLGEMEIN")
        bucket = categories.setdefault(category, {"name": category, "count": 0, "critical": 0, "open": 0})
        bucket["count"] += 1
        if item.get("risk") in {"critical", "high"}:
            bucket["critical"] += 1
        if item.get("status") in attention_status:
            bucket["open"] += 1

    next_item = next((item for item in items if item.get("status") != "done"), None)
    category_list = sorted(categories.values(), key=lambda item: (int(item["critical"]), int(item["open"]), int(item["count"])), reverse=True)
    return {
        "items": items,
        "count": len(items),
        "risk_summary": _count_by(items, "risk"),
        "status_summary": _count_by(items, "status"),
        "due_summary": _count_by(items, "due_state"),
        "attention_count": len([item for item in items if item.get("status") in attention_status or item.get("risk") in {"critical", "high"}]),
        "overdue_count": len([item for item in items if item.get("due_state") == "overdue"]),
        "next_work_action": str(next_item.get("next_step") or next_item.get("title")) if next_item else "",
        "categories": category_list,
    }


def _top_tasks(config: dict[str, Any], items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    tasks: list[dict[str, Any]] = []
    for item in items:
        if item.get("status") == "done":
            continue
        tasks.append({
            "title": item["title"],
            "source": "work_radar",
            "risk": item["risk"],
            "status": item["status"],
            "next_step": item["next_step"],
            "priority_score": item["priority_score"],
        })

    daily = config.get("daily_briefing") if isinstance(config.get("daily_briefing"), dict) else {}
    for idx, title in enumerate(daily.get("today_important") or []):
        if not isinstance(title, str) or not title.strip():
            continue
        tasks.append({
            "title": title.strip(),
            "source": "daily_briefing",
            "risk": "medium",
            "status": "open",
            "next_step": title.strip(),
            "priority_score": 45 - idx,
        })
    tasks.sort(key=lambda item: int(item.get("priority_score") or 0), reverse=True)
    return tasks[:3]


def _learning_subjects(config: dict[str, Any]) -> list[dict[str, Any]]:
    radar = config.get("learning_radar") if isinstance(config.get("learning_radar"), dict) else {}
    raw_subjects = radar.get("subjects")
    subjects = [item for item in raw_subjects if isinstance(item, dict)] if isinstance(raw_subjects, list) else []
    normalized: list[dict[str, Any]] = []
    for idx, item in enumerate(subjects):
        confidence = int(item.get("confidence") or item.get("confidence_level") or 3)
        confidence = max(1, min(5, confidence))
        error_rate = float(item.get("error_rate") or 0)
        open_cards = int(item.get("open_cards") or 0)
        next_review = str(item.get("next_review") or "")
        priority_score = (6 - confidence) * 12 + min(25, int(error_rate * 50)) + min(15, open_cards) + _date_weight(next_review) * 5
        normalized.append({
            "id": str(item.get("id") or f"learning_{idx + 1}"),
            "subject": str(item.get("subject") or "Lernen"),
            "topic": str(item.get("topic") or item.get("title") or "Lernthema"),
            "confidence": confidence,
            "last_review": str(item.get("last_review") or ""),
            "next_review": next_review,
            "error_rate": error_rate,
            "open_cards": open_cards,
            "priority_score": priority_score,
        })
    normalized.sort(key=lambda item: int(item.get("priority_score") or 0), reverse=True)
    return normalized


def _learning_focus(config: dict[str, Any]) -> dict[str, Any]:
    subjects = _learning_subjects(config)
    if not subjects:
        return {
            "ok": False,
            "topic": "",
            "subject": "",
            "recommendation": "Noch kein Lernfokus hinterlegt. Ergaenze learning_radar.subjects in config/lifeos.json.",
            "subjects": [],
        }
    focus = dict(subjects[0])
    focus["ok"] = True
    focus["recommendation"] = (
        f"Heute {focus['topic']} aus {focus['subject']} wiederholen. "
        f"Starte mit {max(5, min(25, int(focus.get('open_cards') or 0) or 10))} Karten oder 25 Minuten Fokuszeit."
    )
    focus["subjects"] = subjects
    return focus


def _summary(daily: dict[str, Any], top_tasks: list[dict[str, Any]], work_items: list[dict[str, Any]]) -> str:
    energy = int(daily.get("energy_percent") or 0)
    loops = int(daily.get("open_loops") or 0)
    focus = int(daily.get("focus_minutes") or 0)
    attention = len([item for item in work_items if item.get("status") in {"attention", "blocked", "open", "check"}])
    energy_text = "gute Energie" if energy >= 75 else "solide Energie" if energy >= 55 else "niedrige Energie"
    first = top_tasks[0]["title"] if top_tasks else "den wichtigsten offenen Punkt klaeren"
    return f"Tageslage: {energy_text}, {loops} offene Schleifen und {focus} Minuten Fokuszeit. {attention} Arbeitsthemen brauchen Aufmerksamkeit. Starte mit: {first}."


def status() -> dict[str, Any]:
    config, source = _load_config()
    return {
        "ok": True,
        "checked_at": _now_iso(),
        "source": source,
        "config_exists": {
            "private": LIFEOS_PRIVATE_FILE.exists(),
            "example": LIFEOS_EXAMPLE_FILE.exists(),
        },
        "version": config.get("version"),
        "mode": config.get("mode", "local-first"),
    }


def briefing() -> dict[str, Any]:
    config, source = _load_config()
    daily = config.get("daily_briefing") if isinstance(config.get("daily_briefing"), dict) else {}
    items = _work_items(config)
    top_tasks = _top_tasks(config, items)
    learning_focus = _learning_focus(config)
    summary = str(daily.get("summary") or "").strip() or _summary(daily, top_tasks, items)
    next_action = str(daily.get("next_best_action") or "").strip()
    if not next_action and top_tasks:
        next_action = str(top_tasks[0].get("next_step") or top_tasks[0].get("title"))

    return {
        "ok": True,
        "generated_at": _now_iso(),
        "source": source,
        "daily_briefing": daily,
        "summary": summary,
        "top_tasks": top_tasks,
        "next_best_action": next_action,
        "work_radar": _work_radar_summary(items),
        "learning_focus": learning_focus,
        "life_modules": config.get("life_modules") if isinstance(config.get("life_modules"), list) else [],
        "timeline": config.get("timeline") if isinstance(config.get("timeline"), list) else [],
    }


def installer_check() -> dict[str, Any]:
    gitignore = BASE_DIR / ".gitignore"
    setup_script = BASE_DIR / "scripts" / "maintenance" / "setup-lifeos-config.ps1"
    first_setup = BASE_DIR / "FIRST_SETUP.ps1"
    gitignore_text = gitignore.read_text(encoding="utf-8", errors="replace") if gitignore.exists() else ""
    first_setup_text = first_setup.read_text(encoding="utf-8", errors="replace") if first_setup.exists() else ""
    checks = {
        "example_config": {"ok": LIFEOS_EXAMPLE_FILE.exists(), "path": str(LIFEOS_EXAMPLE_FILE)},
        "private_config_ignored": {"ok": "config/lifeos.json" in gitignore_text, "path": str(gitignore)},
        "setup_script": {"ok": setup_script.exists(), "path": str(setup_script)},
        "first_setup_hook": {"ok": "setup-lifeos-config.ps1" in first_setup_text, "path": str(first_setup)},
        "no_force_default": {"ok": "-Force" not in first_setup_text.split("setup-lifeos-config.ps1")[-1][:80] if "setup-lifeos-config.ps1" in first_setup_text else False},
    }
    return {
        "ok": all(item["ok"] for item in checks.values()),
        "checked_at": _now_iso(),
        "checks": checks,
        "recommendation": "FIRST_SETUP bereitet LifeOS lokal vor und ueberschreibt private Daten nicht.",
    }
