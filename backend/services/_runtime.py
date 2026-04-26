from __future__ import annotations

import asyncio
import json
import os
import socket
import subprocess
import sys
import time
import uuid
import platform
import shutil
import zipfile
import ctypes
from ctypes import wintypes
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib import request, error

from fastapi import FastAPI, Request, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse, FileResponse
from pydantic import BaseModel
from fastapi.staticfiles import StaticFiles
from skill_system import get_skill_manager
import audit_log as audit
import work_agent as work_gen
import knowledge as knowledge_mod
import agent_registry
import tool_registry

from config import *
from utils import log, read_json, write_json

def http_json(url: str, payload: Optional[dict] = None, timeout: int = 60) -> Any:
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    req = request.Request(url, data=data, headers={"Content-Type": "application/json"}, method="POST" if payload is not None else "GET")
    with request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def ollama_online() -> bool:
    try:
        http_json(OLLAMA_BASE.rstrip("/") + "/api/tags", timeout=3)
        return True
    except Exception:
        return False


def classify_agent(text: str) -> tuple[str, str, float]:
    t = text.lower()
    rules = [
        ("email", ["mail", "outlook", "inbox", "spam", "e-mail", "email"], "Outlook oder E-Mail Anfrage"),
        ("sap", ["sap", "auftrag", "meldung", "lnw", "leistungsnachweis", "angebotstext", "abrechnung"], "SAP oder kaufmännischer Arbeitskontext"),
        ("calendar", ["termin", "kalender", "frist", "kw", "datum", "plan", "wartung"], "Termin oder Planungsanfrage"),
        ("vde", ["vde", "dguv", "norm", "0100", "0105", "prüfung", "pruefung"], "Normen oder Prüfungskontext"),
        ("exam", ["ihk", "industriemeister", "aevo", "prüfung", "pruefung", "karteikarte", "quiz"], "Prüfungsvorbereitung"),
        ("file", ["anhang:", "dateiinhalt", "pdf", "dokument", "bild analysieren"], "Datei oder Dokumentanalyse"),
        ("memory", ["erinner", "weißt du", "weisst du", "gespeichert", "memory"], "Gedächtnis Anfrage"),
        ("research", ["recherch", "such", "google", "aktuell", "news"], "Recherche Anfrage"),
        ("diagnostic", ["fehlerlog", "diagnose", "npm err", "traceback", "syntaxerror", "modulenotfound", "importerror", "build fehler", "port belegt", "abhängigkeit", "dependency", "deep check", "self check"], "Diagnose oder Fehleranalyse"),
    ]
    for agent, keys, reason in rules:
        if any(k in t for k in keys):
            return agent, reason, 0.86
    return "general", "Allgemeine Anfrage", 0.62


def system_prompt_for(agent: str) -> str:
    base = """Du bist JARVIS, Juliens lokaler Windows Assistent. Antworte auf Deutsch, klar, direkt und praxisnah. Keine KI-Floskeln. Wenn es um Elektro, SAP, VDE, Planung oder IHK geht, antworte fachlich und arbeitsnah. Wenn Informationen fehlen, sag genau was fehlt."""
    extra = {
        "sap": "Fokus: SAP PM, Meldungen, Aufträge, Leistungsnachweise, Angebote, Stunden, saubere Formulierungen.",
        "vde": "Fokus: VDE/DGUV Einordnung. Keine erfundenen Normzitate. Unsicherheit klar markieren.",
        "exam": "Fokus: IHK Industriemeister und AEVO. Prüfungsnah erklären und bei Übungsfragen Lösungen nicht sofort verraten.",
        "file": "Fokus: Dateiinhalt auswerten, strukturieren, Fehler und Kernaussagen herausarbeiten.",
        "email": "Fokus: natürliche Mails und Outlook Arbeit. Kurz, menschlich, ohne übertriebene Perfektion.",
        "calendar": "Fokus: Termine, Planung, Fristen, KW und Tagesstruktur.",
        "research": "Fokus: Recherche. Ohne Internet nur klar sagen, dass lokal keine Websuche möglich ist.",
        "memory": "Fokus: gespeicherte Fakten aus dem Kontext nutzen, aber nichts erfinden.",
        "general": "Fokus: normale Assistenz, technische Analyse, Erklärungen und Problemlösung.",
        "diagnostic": "Fokus: Fehleranalyse, Log-Auswertung, Build-Fehler, Python/Node-Probleme. Konkrete Fix-Vorschläge nennen. Zeilen und Dateien benennen wo möglich.",
    }
    return base + "\n" + extra.get(agent, "")


def build_messages(user_input: str, history: list, memory_facts: list, agent: str) -> list:
    system_content = system_prompt_for(agent)
    try:
        skill_context = get_skill_manager().get_skill_context(agent, user_input)
        if skill_context:
            system_content += "\n\n" + skill_context
    except Exception as e:
        log("WARN", "Skill-Kontext konnte nicht geladen werden", error=str(e))
    msgs = [{"role": "system", "content": system_content}]
    if memory_facts:
        msgs.append({"role": "system", "content": "Gespeicherte Fakten:\n" + "\n".join(map(str, memory_facts[:50]))})
    for m in (history or [])[-8:]:
        role = m.get("role", "user") if isinstance(m, dict) else "user"
        content = m.get("content", "") if isinstance(m, dict) else str(m)
        if role in ("user", "assistant", "system") and content:
            msgs.append({"role": role, "content": content})
    msgs.append({"role": "user", "content": user_input})
    return msgs



def normalize_backend_text(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value
    if isinstance(value, (int, float, bool)):
        return str(value)
    if isinstance(value, list):
        return "\n".join(filter(None, (normalize_backend_text(v) for v in value)))
    if isinstance(value, dict):
        for key in ("content", "response", "text", "message", "answer", "output", "result", "delta", "value"):
            if key in value and value[key] is not value:
                normalized = normalize_backend_text(value[key])
                if normalized.strip():
                    return normalized
        return json.dumps(value, ensure_ascii=False, indent=2)
    return str(value)


# ─────────────────────────────────────────────────────────────────────────────
# Package 1 + 2: lokale JARVIS Funktionen und Windows Tools
# ─────────────────────────────────────────────────────────────────────────────

def now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def ensure_list_file(path: Path) -> list:
    data = read_json(path, [])
    return data if isinstance(data, list) else []


def add_note(text: str, tags: Optional[list[str]] = None) -> dict:
    notes = ensure_list_file(NOTES_FILE)
    item = {"id": str(uuid.uuid4()), "text": text.strip(), "tags": tags or [], "created_at": now_iso(), "updated_at": now_iso()}
    notes.insert(0, item)
    write_json(NOTES_FILE, notes)
    return item


def add_task(text: str, due: Optional[str] = None) -> dict:
    tasks = ensure_list_file(TASKS_FILE)
    item = {"id": str(uuid.uuid4()), "text": text.strip(), "done": False, "due": due, "created_at": now_iso(), "updated_at": now_iso()}
    tasks.insert(0, item)
    write_json(TASKS_FILE, tasks)
    return item


def search_items(items: list, query: str, limit: int = 20) -> list:
    q = (query or "").lower().strip()
    if not q:
        return items[:limit]
    out = []
    for item in items:
        blob = json.dumps(item, ensure_ascii=False).lower() if isinstance(item, dict) else str(item).lower()
        if q in blob:
            out.append(item)
    return out[:limit]


def format_tasks(tasks: list, title: str = "Aufgaben") -> str:
    if not tasks:
        return f"{title}: keine Treffer."
    lines = [f"{title}:"]
    for i, t in enumerate(tasks, 1):
        mark = "✓" if t.get("done") else "offen"
        due = f" | Fällig: {t.get('due')}" if t.get("due") else ""
        lines.append(f"{i}. [{mark}] {t.get('text','')}{due}")
    return "\n".join(lines)


def format_notes(notes: list, title: str = "Notizen") -> str:
    if not notes:
        return f"{title}: keine Treffer."
    lines = [f"{title}:"]
    for i, n in enumerate(notes, 1):
        lines.append(f"{i}. {n.get('text','')} ({n.get('created_at','')})")
    return "\n".join(lines)


def windows_memory_info() -> dict:
    if os.name == "nt":
        class MEMORYSTATUSEX(ctypes.Structure):
            _fields_ = [
                ("dwLength", wintypes.DWORD),
                ("dwMemoryLoad", wintypes.DWORD),
                ("ullTotalPhys", ctypes.c_ulonglong),
                ("ullAvailPhys", ctypes.c_ulonglong),
                ("ullTotalPageFile", ctypes.c_ulonglong),
                ("ullAvailPageFile", ctypes.c_ulonglong),
                ("ullTotalVirtual", ctypes.c_ulonglong),
                ("ullAvailVirtual", ctypes.c_ulonglong),
                ("ullAvailExtendedVirtual", ctypes.c_ulonglong),
            ]
        mem = MEMORYSTATUSEX()
        mem.dwLength = ctypes.sizeof(MEMORYSTATUSEX)
        try:
            ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(mem))
            return {"total_gb": round(mem.ullTotalPhys / (1024**3), 2), "available_gb": round(mem.ullAvailPhys / (1024**3), 2), "used_percent": int(mem.dwMemoryLoad)}
        except Exception as e:
            return {"error": str(e)}
    try:
        pages = os.sysconf("SC_PHYS_PAGES")
        page_size = os.sysconf("SC_PAGE_SIZE")
        total = pages * page_size
        return {"total_gb": round(total / (1024**3), 2)}
    except Exception:
        return {"status": "unbekannt"}


def system_status_payload() -> dict:
    total, used, free = shutil.disk_usage(str(BASE_DIR.anchor or BASE_DIR))
    return {
        "status": "online",
        "time": now_iso(),
        "platform": platform.platform(),
        "python": sys.version.split()[0],
        "cwd": str(BASE_DIR),
        "ollama": ollama_online(),
        "model_default": DEFAULT_MODEL,
        "disk": {"total_gb": round(total/(1024**3), 2), "used_gb": round(used/(1024**3), 2), "free_gb": round(free/(1024**3), 2)},
        "memory": windows_memory_info(),
        "data": {"notes": len(ensure_list_file(NOTES_FILE)), "tasks": len(ensure_list_file(TASKS_FILE)), "reminders": len(ensure_list_file(REMINDERS_FILE)), "files": len(ensure_list_file(FILE_INDEX_FILE)), "work_memory": len(search_work_memory())},
    }


APP_ALLOWLIST = {
    "notepad": ["notepad.exe"],
    "editor": ["notepad.exe"],
    "rechner": ["calc.exe"],
    "calculator": ["calc.exe"],
    "calc": ["calc.exe"],
    "explorer": ["explorer.exe"],
    "outlook": ["outlook.exe"],
    "chrome": ["chrome.exe"],
    "edge": ["msedge.exe"],
    "cmd": ["cmd.exe"],
    "powershell": ["powershell.exe"],
}

FOLDER_ALLOWLIST = {
    "downloads": Path.home() / "Downloads",
    "download": Path.home() / "Downloads",
    "desktop": Path.home() / "Desktop",
    "schreibtisch": Path.home() / "Desktop",
    "dokumente": Path.home() / "Documents",
    "documents": Path.home() / "Documents",
    "jarvis": BASE_DIR,
    "projekt": BASE_DIR,
    "projekte": BASE_DIR,
}


def open_windows_app(name: str) -> dict:
    key = (name or "").lower().strip()
    cmd = APP_ALLOWLIST.get(key)
    if not cmd:
        return {"ok": False, "error": f"App nicht freigegeben: {name}", "available": sorted(APP_ALLOWLIST.keys())}
    try:
        subprocess.Popen(cmd, shell=False)
        log("INFO", "windows app opened", app=key)
        return {"ok": True, "app": key, "command": cmd}
    except Exception as e:
        log("ERROR", "windows app open failed", app=key, error=str(e))
        return {"ok": False, "app": key, "error": str(e)}


def open_folder(name: str) -> dict:
    key = (name or "").lower().strip()
    path = FOLDER_ALLOWLIST.get(key)
    if not path:
        return {"ok": False, "error": f"Ordner nicht freigegeben: {name}", "available": sorted(FOLDER_ALLOWLIST.keys())}
    try:
        path.mkdir(parents=True, exist_ok=True)
        if os.name == "nt":
            subprocess.Popen(["explorer.exe", str(path)], shell=False)
        else:
            subprocess.Popen(["xdg-open", str(path)], shell=False)
        log("INFO", "folder opened", folder=key, path=str(path))
        return {"ok": True, "folder": key, "path": str(path)}
    except Exception as e:
        log("ERROR", "folder open failed", folder=key, error=str(e))
        return {"ok": False, "folder": key, "error": str(e)}


def safe_search_roots() -> list[Path]:
    roots = [BASE_DIR, Path.home() / "Downloads", Path.home() / "Desktop", Path.home() / "Documents"]
    return [r for r in roots if r.exists()]


def search_files(query: str, limit: int = 25) -> list[dict]:
    q = (query or "").lower().strip().strip('"')
    if len(q) < 2:
        return []
    hits: list[dict] = []
    ignored = {"node_modules", ".venv", "dist", ".git", "__pycache__"}
    for root in safe_search_roots():
        try:
            for dirpath, dirnames, filenames in os.walk(root):
                dirnames[:] = [d for d in dirnames if d not in ignored and not d.startswith(".")]
                for fn in filenames:
                    if q in fn.lower():
                        p = Path(dirpath) / fn
                        try:
                            hits.append({"name": fn, "path": str(p), "size_kb": round(p.stat().st_size/1024, 1), "modified": datetime.fromtimestamp(p.stat().st_mtime).isoformat(timespec="seconds")})
                        except Exception:
                            hits.append({"name": fn, "path": str(p)})
                        if len(hits) >= limit:
                            return hits
        except Exception as e:
            log("WARN", "file search root skipped", root=str(root), error=str(e))
    return hits


# ─────────────────────────────────────────────────────────────────────────────
# v9: Arbeitsmodus, strukturierter Memory, Datei-Import, Diagnose
# ─────────────────────────────────────────────────────────────────────────────
def to_float_de(value: Any) -> float:
    if value is None:
        return 0.0
    txt = str(value).strip().replace("€", "").replace(" ", "").replace(".", "").replace(",", ".")
    try:
        return float(txt)
    except Exception:
        return 0.0


def money(value: float) -> str:
    return f"{value:,.2f} €".replace(",", "X").replace(".", ",").replace("X", ".")


def work_template(kind: str, data: dict) -> str:
    # v11 nutzt den erweiterten Work Agent, bleibt aber kompatibel zur alten Route.
    return work_agent_generate(kind, data)["text"]


def calc_payload(kind: str, body: dict) -> dict:
    kind = (kind or "").lower().strip()
    rate = to_float_de(body.get("rate", 93.5)) or 93.5
    if kind in ("hours", "stunden", "kosten"):
        hours = to_float_de(body.get("hours") or body.get("stunden"))
        total = hours * rate
        return {"kind": kind, "hours": hours, "rate": rate, "total": total, "text": f"{hours:g} Stunden × {money(rate)} = {money(total)}"}
    if kind in ("sockets", "steckdosen", "pruefung", "prüfung"):
        count = int(to_float_de(body.get("count") or body.get("anzahl")))
        minutes = to_float_de(body.get("minutes_per_item") or body.get("minuten") or 5) or 5
        hours = (count * minutes) / 60.0
        total = hours * rate
        per_hour = 60 / minutes if minutes else 0
        return {"kind": kind, "count": count, "minutes_per_item": minutes, "items_per_hour": per_hour, "hours": hours, "rate": rate, "total": total, "text": f"{count} Stück × {minutes:g} Minuten = {hours:.2f} Stunden. Bei {money(rate)}/h sind das {money(total)}."}
    if kind in ("decimal", "industriezeit", "time"):
        minutes = to_float_de(body.get("minutes") or body.get("minuten"))
        hours = to_float_de(body.get("hours") or body.get("stunden"))
        total_minutes = hours * 60 + minutes
        decimal = total_minutes / 60.0
        return {"kind": kind, "decimal_hours": decimal, "minutes_total": total_minutes, "text": f"{int(hours)}:{int(minutes):02d} h = {decimal:.2f} Industriezeit."}
    return {"kind": kind, "error": "Unbekannte Berechnung. Verfügbar: hours, sockets, decimal."}


def upsert_work_memory(category: str, key: str, value: Any, meta: Optional[dict] = None) -> dict:
    store = read_json(WORK_MEMORY_FILE, {})
    if not isinstance(store, dict): store = {}
    category = (category or "allgemein").strip().lower()
    key = (key or "Eintrag").strip()
    store.setdefault(category, {})
    item = {"key": key, "value": value, "meta": meta or {}, "updated_at": now_iso()}
    store[category][key] = item
    write_json(WORK_MEMORY_FILE, store)
    return item


def search_work_memory(query: str = "", category: str = "") -> list[dict]:
    store = read_json(WORK_MEMORY_FILE, {})
    if not isinstance(store, dict): return []
    q = (query or "").lower().strip(); cat_filter = (category or "").lower().strip()
    hits = []
    for cat, entries in store.items():
        if cat_filter and cat_filter != cat: continue
        if not isinstance(entries, dict): continue
        for key, item in entries.items():
            blob = json.dumps(item, ensure_ascii=False).lower()
            if not q or q in blob or q in key.lower() or q in cat.lower():
                out = dict(item); out["category"] = cat; hits.append(out)
    return hits[:100]


def extract_text_from_upload(filename: str, raw: bytes) -> str:
    suffix = Path(filename).suffix.lower()
    if suffix in (".txt", ".log", ".csv", ".json", ".md", ".ps1", ".bat", ".py", ".ts", ".tsx", ".js", ".css", ".html"):
        for enc in ("utf-8", "utf-8-sig", "cp1252", "latin-1"):
            try: return raw.decode(enc)
            except Exception: pass
    if suffix == ".docx":
        return extract_text_from_docx(raw)
    if suffix == ".pdf":
        return extract_text_from_pdf_best_effort(raw)
    return f"[Datei {filename} wurde gespeichert, automatische Textextraktion für {suffix or 'diesen Typ'} ist noch nicht aktiv.]"


def summarize_text_basic(text: str, max_lines: int = 18) -> str:
    lines = [l.strip() for l in text.replace("\r", "").split("\n") if l.strip()]
    errors = [l for l in lines if any(k in l.lower() for k in ("error", "fehler", "failed", "exception", "traceback", "cannot", "nicht gefunden", "warning", "warn"))]
    out = [f"Zeilen: {len(lines)} | Zeichen: {len(text)}"]
    out.append("Auffällige Zeilen:" if errors else "Erste relevante Zeilen:")
    out.extend((errors or lines)[:max_lines])
    return "\n".join(out)


def self_check_payload() -> dict:
    checks = []
    def add(name: str, ok: bool, detail: str = ""):
        checks.append({"name": name, "ok": bool(ok), "detail": detail})
    add("Python", True, sys.version.split()[0])
    add("Backend Port", True, "FastAPI aktiv")
    add("Ollama", ollama_online(), OLLAMA_BASE)
    add("Frontend Build", FRONTEND_INDEX.exists(), str(FRONTEND_INDEX))
    add("diagnose.html", (FRONTEND_DIST/"diagnose.html").exists() or FRONTEND_DIAG.exists(), "Diagnose Seite vorhanden")
    add("Logs schreibbar", LOG_DIR.exists(), str(LOG_DIR))
    add("Datenordner", DATA_DIR.exists(), str(DATA_DIR))
    add("Tool Registry", bool(ensure_tool_registry()), str(TOOL_REGISTRY_FILE))
    add("Actions Speicher", ACTIONS_FILE.parent.exists(), str(ACTIONS_FILE))
    add("Work Agent", True, str(WORK_LOG_FILE))
    add("Automationen", True, str(AUTOMATIONS_FILE))
    add("Folder Watch", True, str(FOLDER_WATCH_FILE))
    add("Backup Ordner", BACKUP_DIR.exists(), str(BACKUP_DIR))
    add("Security Center", True, str(PERMISSIONS_FILE))
    add("Knowledge Index", True, str(KNOWLEDGE_INDEX_FILE))
    add("UI Settings", True, str(SETTINGS_FILE))
    add("Voice Core", True, str(VOICE_SETTINGS_FILE))
    add("Piper Vorbereitung", True, str(PIPER_DIR))
    add("Voice Interface", True, str(VOICE_RUNTIME_FILE))
    add("Standalone Paket", (BASE_DIR / "JARVIS_INSTALL_CONFIG.json").exists(), str(BASE_DIR / "JARVIS_INSTALL_CONFIG.json"))
    return {"version": "B4.0.0", "time": now_iso(), "ok": all(c["ok"] for c in checks), "checks": checks}


def vde_snippet(topic: str = "") -> dict:
    topic_l = (topic or "").lower()
    snippets = {
        "dguv": "DGUV V3: Prüfungen elektrischer Anlagen und Betriebsmittel müssen geeignet dokumentiert werden. Für genaue Fristen und Prüfumfang zählt die Gefährdungsbeurteilung und die konkrete Anlage.",
        "0100-600": "DIN VDE 0100-600: Erstprüfung elektrischer Anlagen vor Inbetriebnahme. Typische Bestandteile sind Besichtigen, Erproben und Messen.",
        "0105-100": "DIN VDE 0105-100: Betrieb elektrischer Anlagen. Relevant für wiederkehrende Prüfungen, Arbeiten im Betrieb und organisatorische Regeln.",
        "angebot": "Normhinweis im Angebot nur verwenden, wenn er fachlich zum Leistungsumfang passt. Formulierung: soweit zutreffend unter Berücksichtigung der einschlägigen DIN VDE Bestimmungen.",
    }
    for k, v in snippets.items():
        if k in topic_l: return {"topic": k, "text": v}
    return {"topic": "uebersicht", "snippets": snippets}






# ─────────────────────────────────────────────────────────────────────────────
# v15 System Maturity: Backup, Restore, Security Center, Update Vorbereitung,
# Diagnose ZIP, lokaler Wissensindex, UI Optionen, Voice/Dashboard Vorbereitung
# ─────────────────────────────────────────────────────────────────────────────
def app_version() -> str:
    return "B4.0.0"

def default_permissions() -> dict:
    return {
        "allowed_apps": sorted(APP_ALLOWLIST.keys()),
        "allowed_folders": sorted(FOLDER_ALLOWLIST.keys()),
        "blocked_actions": ["delete_file", "move_file_unconfirmed", "shell_free_command"],
        "confirm_required": ["copy_file", "write_text_file", "open_web_search", "folder_watch_scan"],
        "notes": "JARVIS nutzt nur freigegebene Apps, Ordner und lokale Daten aus diesem Paket."
    }

def load_permissions() -> dict:
    data = read_json(PERMISSIONS_FILE, None)
    if not isinstance(data, dict):
        data = default_permissions()
        write_json(PERMISSIONS_FILE, data)
    return data

def save_permissions(data: dict) -> dict:
    current = load_permissions()
    merged = {**current, **{k:v for k,v in data.items() if k in {"allowed_apps","allowed_folders","blocked_actions","confirm_required","notes"}}}
    write_json(PERMISSIONS_FILE, merged)
    return merged

def create_backup(label: str = "") -> dict:
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_label = re.sub(r"[^A-Za-z0-9_.-]+", "_", label.strip())[:50] if label else "manual"
    backup_path = BACKUP_DIR / f"jarvis_backup_{ts}_{safe_label}.zip"
    include_dirs = [DATA_DIR, LOG_DIR]
    manifest = {
        "version": app_version(),
        "created_at": now_iso(),
        "label": label or "manual",
        "base_dir": str(BASE_DIR),
        "included": [str(p.relative_to(BASE_DIR)) for p in include_dirs if p.exists()],
    }
    with zipfile.ZipFile(backup_path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("manifest.json", json.dumps(manifest, ensure_ascii=False, indent=2))
        for folder in include_dirs:
            if not folder.exists():
                continue
            for p in folder.rglob("*"):
                if p.is_file():
                    z.write(p, p.relative_to(BASE_DIR))
    return {"ok": True, "path": str(backup_path), "manifest": manifest, "size_kb": round(backup_path.stat().st_size / 1024, 1)}

def list_backups() -> list[dict]:
    items = []
    for p in sorted(BACKUP_DIR.glob("jarvis_backup_*.zip"), key=lambda x: x.stat().st_mtime, reverse=True):
        items.append({
            "name": p.name,
            "path": str(p),
            "size_kb": round(p.stat().st_size / 1024, 1),
            "modified": datetime.fromtimestamp(p.stat().st_mtime).isoformat(timespec="seconds"),
        })
    return items

def restore_backup(name: str) -> dict:
    # Sicherheitsregel: Restore nur aus lokalem Backup Ordner, keine fremden Pfade.
    candidate = BACKUP_DIR / Path(name).name
    if not candidate.exists() or not candidate.is_file():
        raise HTTPException(404, "Backup nicht gefunden")
    pre = create_backup("pre_restore")
    restored = []
    with zipfile.ZipFile(candidate, "r") as z:
        for member in z.namelist():
            if member == "manifest.json" or member.endswith("/"):
                continue
            target = (BASE_DIR / member).resolve()
            # Nur data und logs wiederherstellen
            if not (str(target).lower().startswith(str(DATA_DIR.resolve()).lower()) or str(target).lower().startswith(str(LOG_DIR.resolve()).lower())):
                continue
            target.parent.mkdir(parents=True, exist_ok=True)
            with z.open(member) as src, open(target, "wb") as dst:
                shutil.copyfileobj(src, dst)
            restored.append(member)
    return {"ok": True, "restored": restored, "pre_restore_backup": pre}

def create_diagnostics_zip() -> dict:
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    diag_path = DIAG_DIR / f"jarvis_diagnostics_{ts}.zip"
    manifest = {
        "version": app_version(),
        "created_at": now_iso(),
        "platform": platform.platform(),
        "python": sys.version,
        "base_dir": str(BASE_DIR),
        "self_check": self_check_payload() if "self_check_payload" in globals() else {},
    }
    with zipfile.ZipFile(diag_path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("manifest.json", json.dumps(manifest, ensure_ascii=False, indent=2))
        for folder in [LOG_DIR, DATA_DIR]:
            if not folder.exists():
                continue
            for p in folder.rglob("*"):
                if p.is_file():
                    # keine Upload Dateien komplett in Diagnose, nur JSON/Logs/kleine Dateien
                    if p.stat().st_size > 2_000_000:
                        continue
                    z.write(p, p.relative_to(BASE_DIR))
        for name in ["README_START.txt", "JARVIS_INSTALL_CONFIG.json"]:
            p = BASE_DIR / name
            if p.exists():
                z.write(p, p.relative_to(BASE_DIR))
    return {"ok": True, "path": str(diag_path), "size_kb": round(diag_path.stat().st_size / 1024, 1)}

def update_state() -> dict:
    data = read_json(UPDATE_STATE_FILE, {})
    if not isinstance(data, dict):
        data = {}
    return {
        "current_version": app_version(),
        "last_check": data.get("last_check"),
        "last_result": data.get("last_result"),
        "update_mode": "manual_zip",
        "message": "Update Vorbereitung aktiv. Automatisches Online Update ist aus Sicherheitsgründen nicht aktiv, bis eine geprüfte Quelle definiert ist."
    }

def prepare_update(version: str = "", source: str = "") -> dict:
    backup = create_backup("pre_update")
    state = {
        "current_version": app_version(),
        "target_version": version or "unbekannt",
        "source": source or "manual",
        "last_check": now_iso(),
        "last_result": "prepared",
        "backup": backup,
        "instructions": [
            "Neue ZIP in einen separaten Ordner entpacken.",
            "INSTALL_JARVIS.bat oder REINSTALL_CLEAN.bat ausführen.",
            "Daten aus Backup bei Bedarf über Restore zurückspielen.",
        ],
    }
    write_json(UPDATE_STATE_FILE, state)
    return state

def ui_settings_default() -> dict:
    return {
        "theme": "future_hud",
        "orb_quality": "high",
        "animation_level": "normal",
        "compact_mode": False,
        "show_red_thought_impulses": True,
        "show_hover_growth": True,
        "dashboard_start_page": "Dialog",
    }

def load_ui_settings() -> dict:
    data = read_json(SETTINGS_FILE, None)
    if not isinstance(data, dict):
        data = ui_settings_default()
        write_json(SETTINGS_FILE, data)
    return data

def save_ui_settings(data: dict) -> dict:
    current = load_ui_settings()
    allowed = set(ui_settings_default().keys())
    for k, v in data.items():
        if k in allowed:
            current[k] = v
    write_json(SETTINGS_FILE, current)
    return current

def chunk_text(text: str, size: int = 1200, overlap: int = 120) -> list[str]:
    text = (text or "").replace("\r", "")
    if not text.strip():
        return []
    chunks = []
    i = 0
    while i < len(text):
        chunk = text[i:i+size].strip()
        if chunk:
            chunks.append(chunk)
        i += max(1, size - overlap)
        if len(chunks) >= 500:
            break
    return chunks

def rebuild_knowledge_index() -> dict:
    docs = ensure_list_file(FILE_INDEX_FILE)
    notes = ensure_list_file(NOTES_FILE)
    work = read_json(WORK_MEMORY_FILE, {})
    records = []
    for d in docs:
        text = str(d.get("text_preview") or d.get("summary") or "")
        for idx, ch in enumerate(chunk_text(text)):
            records.append({"id": str(uuid.uuid4()), "source": "file", "source_id": d.get("id"), "title": d.get("name"), "chunk": idx, "text": ch})
    for n in notes:
        records.append({"id": str(uuid.uuid4()), "source": "note", "source_id": n.get("id"), "title": "Notiz", "chunk": 0, "text": str(n.get("text") or "")})
    if isinstance(work, dict):
        for cat, entries in work.items():
            if isinstance(entries, dict):
                for key, item in entries.items():
                    records.append({"id": str(uuid.uuid4()), "source": "work_memory", "source_id": key, "title": f"{cat}/{key}", "chunk": 0, "text": json.dumps(item, ensure_ascii=False)})
    write_json(KNOWLEDGE_INDEX_FILE, records)
    return {"ok": True, "chunks": len(records), "updated_at": now_iso()}

def search_knowledge(query: str, limit: int = 10) -> dict:
    q = (query or "").lower().strip()
    if not q:
        return {"query": query, "results": []}
    records = read_json(KNOWLEDGE_INDEX_FILE, [])
    if not isinstance(records, list) or not records:
        rebuild_knowledge_index()
        records = read_json(KNOWLEDGE_INDEX_FILE, [])
    terms = [t for t in re.findall(r"[a-zA-ZÄÖÜäöüß0-9_-]{2,}", q)]
    scored = []
    for r in records:
        txt = str(r.get("text") or "")
        low = txt.lower()
        score = sum(low.count(t) for t in terms)
        if q in low:
            score += 5
        if score > 0:
            out = dict(r)
            out["score"] = score
            out["preview"] = txt[:600]
            scored.append(out)
    scored.sort(key=lambda x: x.get("score", 0), reverse=True)
    return {"query": query, "results": scored[:limit]}

def voice_settings_default() -> dict:
    return {
        "enabled": True,
        "auto_speak": False,
        "wake_word": "jarvis",
        "selected_voice": "",
        "rate": 0.92,
        "pitch": 0.82,
        "volume": 1.0,
        "test_text": "Guten Abend Julien. JARVIS Voice Core ist online.",
        "speech_to_text": "browser_web_speech_optional",
        "text_to_speech": "browser_speech_synthesis",
        "microphone_enabled": False,
        "push_to_talk_enabled": True,
        "wake_word_enabled": False,
        "wake_word_runtime": False,
        "continuous_listening": False,
        "language": "de-DE",
        "send_transcript_to_chat": True,
        "piper_enabled": False,
        "piper_voice": "",
        "piper_path": str(PIPER_DIR),
        "notes": "Voice Core spricht über Browser oder Windows TTS. Mikrofon ist standardmäßig deaktiviert und nur über das Interface aktivierbar."
    }

def load_voice_settings() -> dict:
    data = read_json(VOICE_SETTINGS_FILE, None)
    if not isinstance(data, dict):
        data = voice_settings_default()
        write_json(VOICE_SETTINGS_FILE, data)
    return data

def save_voice_settings(data: dict) -> dict:
    current = load_voice_settings()
    for k in voice_settings_default().keys():
        if k in data:
            current[k] = data[k]
    write_json(VOICE_SETTINGS_FILE, current)
    return current


def voice_presets_default() -> list[dict]:
    return [
        {
            "id": "jarvis_calm",
            "name": "JARVIS Calm",
            "rate": 0.92,
            "pitch": 0.82,
            "volume": 1.0,
            "description": "Ruhig, tiefer, technisch und nicht hektisch."
        },
        {
            "id": "jarvis_clear",
            "name": "JARVIS Clear",
            "rate": 1.0,
            "pitch": 0.9,
            "volume": 1.0,
            "description": "Klar und etwas natürlicher."
        },
        {
            "id": "jarvis_deep",
            "name": "JARVIS Deep",
            "rate": 0.86,
            "pitch": 0.72,
            "volume": 1.0,
            "description": "Tiefer und filmischer, je nach Browser Stimme."
        },
        {
            "id": "fast_operator",
            "name": "Fast Operator",
            "rate": 1.14,
            "pitch": 0.95,
            "volume": 1.0,
            "description": "Schneller System Operator Modus."
        },
    ]

def load_voice_presets() -> list[dict]:
    data = read_json(VOICE_PRESETS_FILE, None)
    if not isinstance(data, list) or not data:
        data = voice_presets_default()
        write_json(VOICE_PRESETS_FILE, data)
    return data

def apply_voice_preset(preset_id: str) -> dict:
    presets = load_voice_presets()
    match = next((p for p in presets if p.get("id") == preset_id), None)
    if not match:
        raise HTTPException(404, "Voice Preset nicht gefunden")
    settings = load_voice_settings()
    for key in ["rate", "pitch", "volume"]:
        if key in match:
            settings[key] = match[key]
    settings["active_preset"] = preset_id
    write_json(VOICE_SETTINGS_FILE, settings)
    return settings

def piper_status() -> dict:
    exe_candidates = [
        PIPER_DIR / "piper.exe",
        PIPER_DIR / "piper" / "piper.exe",
        PIPER_DIR / "piper",
    ]
    exe = next((p for p in exe_candidates if p.exists()), None)
    voices = []
    if PIPER_VOICES_DIR.exists():
        for p in PIPER_VOICES_DIR.glob("*.onnx"):
            voices.append({
                "name": p.stem,
                "path": str(p),
                "config": str(p.with_suffix(p.suffix + ".json")) if p.with_suffix(p.suffix + ".json").exists() else "",
            })
    return {
        "available": exe is not None,
        "exe": str(exe) if exe else "",
        "dir": str(PIPER_DIR),
        "voices_dir": str(PIPER_VOICES_DIR),
        "voices": voices,
        "message": "Piper ist optional. Lege piper.exe und Stimmen in den piper Ordner, dann kann der lokale Pfad später genutzt werden."
    }

def prepare_piper_layout() -> dict:
    PIPER_DIR.mkdir(exist_ok=True)
    PIPER_VOICES_DIR.mkdir(exist_ok=True)
    readme = PIPER_DIR / "README_PIPER.txt"
    if not readme.exists():
        readme.write_text(
            "Optionaler Piper TTS Ordner.\\n"
            "Hier kann später piper.exe abgelegt werden.\\n"
            "Stimmen kommen in piper/voices als .onnx plus passende .json Datei.\\n"
            "JARVIS Voice Core funktioniert auch ohne Piper über Browser/Windows TTS.\\n",
            encoding="utf-8"
        )
    return piper_status()


def voice_runtime_default() -> dict:
    return {
        "microphone_permission": "unknown",
        "listening": False,
        "last_transcript": "",
        "last_event": "",
        "last_updated": now_iso(),
    }

def load_voice_runtime() -> dict:
    data = read_json(VOICE_RUNTIME_FILE, None)
    if not isinstance(data, dict):
        data = voice_runtime_default()
        write_json(VOICE_RUNTIME_FILE, data)
    return data

def save_voice_runtime(data: dict) -> dict:
    current = load_voice_runtime()
    for k in ["microphone_permission", "listening", "last_transcript", "last_event"]:
        if k in data:
            current[k] = data[k]
    current["last_updated"] = now_iso()
    write_json(VOICE_RUNTIME_FILE, current)
    return current

def voice_core_payload() -> dict:
    return {
        "settings": load_voice_settings(),
        "presets": load_voice_presets(),
        "piper": piper_status(),
        "runtime": load_voice_runtime(),
        "security": {
            "microphone_default": False,
            "wake_word_default": False,
            "note": "Mikrofon und Wake Word sind nur aktiv, wenn sie bewusst im Interface eingeschaltet werden."
        }
    }

def dashboard_payload() -> dict:
    tasks = [t for t in ensure_list_file(TASKS_FILE) if not t.get("done")][:8]
    due = due_automations() if "due_automations" in globals() else []
    notes = ensure_list_file(NOTES_FILE)[:5]
    files = ensure_list_file(FILE_INDEX_FILE)[:5]
    status = system_status_payload()
    return {
        "version": app_version(),
        "status": status,
        "tasks": tasks,
        "due": due[:8],
        "notes": notes,
        "files": files,
        "ui": load_ui_settings(),
        "voice": load_voice_settings(),
        "updated_at": now_iso(),
    }


# ─────────────────────────────────────────────────────────────────────────────
# v12 Automation & Daily Operations: lokale Wiedervorlagen, Tagesstart,
# Feierabendbericht, Folder Watch und erweiterte Datei Analyse.
# ─────────────────────────────────────────────────────────────────────────────
def parse_when_text(when: str) -> str:
    # bewusst einfach gehalten: ISO oder freier Text. ISO wird sortierbar genutzt.
    raw = (when or "").strip()
    if not raw:
        return ""
    try:
        # akzeptiert yyyy-mm-dd oder yyyy-mm-ddTHH:MM
        if len(raw) == 10:
            return datetime.fromisoformat(raw).replace(hour=9, minute=0, second=0, microsecond=0).isoformat(timespec="minutes")
        return datetime.fromisoformat(raw).isoformat(timespec="minutes")
    except Exception:
        return raw

def add_automation(text: str, when: str = "", kind: str = "reminder", recurrence: str = "") -> dict:
    if not text.strip():
        raise HTTPException(400, "Text fehlt")
    autos = ensure_list_file(AUTOMATIONS_FILE)
    item = {
        "id": str(uuid.uuid4()),
        "kind": kind or "reminder",
        "text": text.strip(),
        "when": parse_when_text(when),
        "recurrence": recurrence or "",
        "status": "open",
        "created_at": now_iso(),
        "last_triggered": None,
    }
    autos.insert(0, item)
    write_json(AUTOMATIONS_FILE, autos)
    return item

def list_automations(status: str = "") -> list[dict]:
    autos = ensure_list_file(AUTOMATIONS_FILE)
    if status:
        autos = [a for a in autos if str(a.get("status")) == status]
    return autos

def due_automations() -> list[dict]:
    now = datetime.now().isoformat(timespec="minutes")
    due = []
    for a in ensure_list_file(AUTOMATIONS_FILE):
        if a.get("status") != "open":
            continue
        when = str(a.get("when") or "")
        # Freitext bleibt offen, ISO wird fällig
        if when and re.match(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}", when) and when <= now:
            due.append(a)
    return due

def complete_automation(auto_id: str) -> dict:
    autos = ensure_list_file(AUTOMATIONS_FILE)
    for a in autos:
        if a.get("id") == auto_id:
            a["status"] = "done"
            a["completed_at"] = now_iso()
            write_json(AUTOMATIONS_FILE, autos)
            return a
    raise HTTPException(404, "Automation nicht gefunden")

def build_briefing(kind: str = "tagesstart") -> dict:
    tasks = [t for t in ensure_list_file(TASKS_FILE) if not t.get("done")]
    notes = ensure_list_file(NOTES_FILE)[:5]
    reminders = [r for r in ensure_list_file(REMINDERS_FILE) if not r.get("done")]
    autos_due = due_automations()
    status = system_status_payload()
    kind_l = (kind or "tagesstart").lower()
    if kind_l in ("feierabend", "abend", "abschluss"):
        title = "Feierabend Bericht"
        intro = "Kurzer Abschluss für heute:"
    else:
        title = "Tagesstart Briefing"
        intro = "Guter Start in den Tag. Hier ist der aktuelle Überblick:"
    lines = [title, "", intro, ""]
    lines.append(f"System: Backend {status.get('status')} | Ollama {'online' if status.get('ollama') else 'offline'}")
    lines.append(f"Offene Aufgaben: {len(tasks)}")
    for t in tasks[:8]:
        lines.append(f"- {t.get('text')}")
    if autos_due:
        lines.append("")
        lines.append(f"Fällige Wiedervorlagen: {len(autos_due)}")
        for a in autos_due[:8]:
            lines.append(f"- {a.get('text')} ({a.get('when')})")
    if reminders:
        lines.append("")
        lines.append(f"Erinnerungen: {len(reminders)}")
        for r in reminders[:5]:
            lines.append(f"- {r.get('text')} ({r.get('when')})")
    if notes:
        lines.append("")
        lines.append("Letzte Notizen:")
        for n in notes:
            lines.append(f"- {n.get('text')}")
    text = "\n".join(lines)
    hist = ensure_list_file(BRIEFING_FILE)
    item = {"id": str(uuid.uuid4()), "kind": kind_l, "text": text, "created_at": now_iso()}
    hist.insert(0, item)
    write_json(BRIEFING_FILE, hist[:200])
    return item

def add_folder_watch(name: str, folder_key: str = "downloads", pattern: str = "") -> dict:
    folder_key_l = (folder_key or "downloads").lower().strip()
    path = FOLDER_ALLOWLIST.get(folder_key_l) or SAFE_WRITE_ROOTS.get(folder_key_l)
    if not path:
        raise HTTPException(400, f"Ordner nicht freigegeben: {folder_key}")
    item = {
        "id": str(uuid.uuid4()),
        "name": name or folder_key_l,
        "folder_key": folder_key_l,
        "path": str(path),
        "pattern": pattern or "",
        "enabled": True,
        "created_at": now_iso(),
    }
    watchers = ensure_list_file(FOLDER_WATCH_FILE)
    watchers.insert(0, item)
    write_json(FOLDER_WATCH_FILE, watchers)
    return item

def scan_folder_watch(watch_id: str = "") -> dict:
    watchers = ensure_list_file(FOLDER_WATCH_FILE)
    state = read_json(FOLDER_WATCH_STATE_FILE, {})
    if not isinstance(state, dict):
        state = {}
    results = []
    ignored_dirs = {"node_modules", ".git", ".venv", "dist", "__pycache__"}
    for w in watchers:
        if watch_id and w.get("id") != watch_id:
            continue
        if not w.get("enabled", True):
            continue
        root = Path(str(w.get("path") or ""))
        if not root.exists():
            results.append({"watch": w, "error": "Pfad existiert nicht"})
            continue
        seen = set(state.get(w["id"], []))
        current = set()
        new_files = []
        pattern = str(w.get("pattern") or "").lower().strip()
        try:
            for dirpath, dirnames, filenames in os.walk(root):
                dirnames[:] = [d for d in dirnames if d not in ignored_dirs and not d.startswith(".")]
                # begrenzen, damit es nicht ausufert
                if len(current) > 1000:
                    break
                for fn in filenames:
                    if pattern and pattern not in fn.lower():
                        continue
                    p = Path(dirpath) / fn
                    try:
                        sig = str(p) + "|" + str(int(p.stat().st_mtime))
                    except Exception:
                        sig = str(p)
                    current.add(sig)
                    if sig not in seen:
                        new_files.append({
                            "name": fn,
                            "path": str(p),
                            "size_kb": round(p.stat().st_size / 1024, 1) if p.exists() else None,
                            "modified": datetime.fromtimestamp(p.stat().st_mtime).isoformat(timespec="seconds") if p.exists() else None,
                        })
                    if len(new_files) >= 50:
                        break
                if len(new_files) >= 50:
                    break
            state[w["id"]] = sorted(current)
            results.append({"watch": w, "new_files": new_files, "count": len(new_files)})
        except Exception as e:
            results.append({"watch": w, "error": str(e)})
    write_json(FOLDER_WATCH_STATE_FILE, state)
    return {"results": results, "scanned_at": now_iso()}

def extract_text_from_docx(raw: bytes) -> str:
    try:
        import zipfile as _zip
        import xml.etree.ElementTree as ET
        from io import BytesIO
        with _zip.ZipFile(BytesIO(raw)) as z:
            xml = z.read("word/document.xml")
        root_xml = ET.fromstring(xml)
        ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
        texts = [t.text or "" for t in root_xml.findall(".//w:t", ns)]
        return "\n".join([t for t in texts if t.strip()])
    except Exception as e:
        return f"[DOCX Textextraktion fehlgeschlagen: {e}]"

def extract_text_from_pdf_best_effort(raw: bytes) -> str:
    try:
        import pypdf
        from io import BytesIO
        reader = pypdf.PdfReader(BytesIO(raw))
        pages = []
        for p in reader.pages[:50]:
            pages.append(p.extract_text() or "")
        return "\n\n".join(pages).strip() or "[PDF enthält keinen extrahierbaren Text.]"
    except Exception as e:
        return f"[PDF Textextraktion benötigt pypdf oder ist fehlgeschlagen: {e}]"


# ─────────────────────────────────────────────────────────────────────────────
# v11 Work Agent: Arbeitsnahe Generatoren für SAP, Mail, VDE, LNW, FSM/CATS
# ─────────────────────────────────────────────────────────────────────────────
def normalize_list(value: Any) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(x).strip() for x in value if str(x).strip()]
    return [x.strip() for x in str(value).replace(";", ",").split(",") if x.strip()]

def human_join(items: list[str]) -> str:
    return ", ".join([x for x in items if x])

def save_work_log(kind: str, payload: dict, result: str) -> dict:
    logs = ensure_list_file(WORK_LOG_FILE)
    item = {
        "id": str(uuid.uuid4()),
        "kind": kind,
        "payload": payload,
        "result": result,
        "created_at": now_iso(),
    }
    logs.insert(0, item)
    write_json(WORK_LOG_FILE, logs[:500])
    return item

def sap_offer_advanced(data: dict) -> str:
    scope = str(data.get("scope") or data.get("leistung") or "").strip()
    location = str(data.get("location") or data.get("ort") or "E41").strip()
    norms = normalize_list(data.get("norms") or data.get("normen"))
    mode = str(data.get("mode") or data.get("art") or "Aufwandsangebot").strip()
    extra = str(data.get("extra") or data.get("hinweis") or "").strip()
    include_testing = bool(data.get("include_testing", True))
    lines = []
    lines.append(f"{mode}: Durchführung der beschriebenen Elektroarbeiten im Bereich {location}.")
    if scope:
        lines.append(f"Leistungsumfang: {scope}.")
    lines.append("Die Ausführung erfolgt nach vorheriger Abstimmung mit dem Betreiber beziehungsweise dem zuständigen Ansprechpartner vor Ort.")
    if include_testing:
        if norms:
            lines.append("Die erforderlichen Prüfungen und Kontrollen erfolgen, soweit für den Leistungsumfang zutreffend, unter Berücksichtigung von " + human_join(norms) + ".")
        else:
            lines.append("Die erforderlichen Prüfungen und Kontrollen erfolgen, soweit für den Leistungsumfang zutreffend, nach den einschlägigen elektrotechnischen Regeln.")
    if extra:
        lines.append(extra)
    lines.append("Abrechnung nach tatsächlich angefallenem Aufwand und bestätigtem Leistungsnachweis.")
    return "\n".join(lines)

def mail_rewrite_advanced(data: dict) -> str:
    tone = str(data.get("tone") or "locker-professionell").lower()
    content = str(data.get("content") or data.get("scope") or data.get("text") or "").strip()
    recipient = str(data.get("recipient") or "").strip()
    greeting = f"Hallo {recipient}," if recipient else "Hallo zusammen,"
    if not content:
        content = "ich wollte euch kurz den aktuellen Stand mitteilen."
    closing = "Viele Grüße"
    if "streng" in tone or "klar" in tone:
        body = content
    elif "locker" in tone:
        body = content
    else:
        body = content
    return f"{greeting}\n\n{body}\n\n{closing}"

def lnw_text_advanced(data: dict) -> str:
    scope = str(data.get("scope") or data.get("leistung") or "").strip()
    location = str(data.get("location") or data.get("ort") or "").strip()
    result = str(data.get("result") or data.get("ergebnis") or "").strip()
    norms = normalize_list(data.get("norms") or data.get("normen"))
    lines = []
    if scope:
        lines.append(f"Ausgeführte Arbeiten: {scope}")
    if location:
        lines.append(f"Ort/Anlage: {location}")
    if result:
        lines.append(f"Ergebnis/Hinweis: {result}")
    if norms:
        lines.append("Prüfbezug, soweit zutreffend: " + human_join(norms))
    if not lines:
        lines.append("Ausgeführte Arbeiten gemäß Abstimmung vor Ort.")
    return "\n".join(lines)

def fsm_cats_notice_advanced(data: dict) -> str:
    target = str(data.get("target") or "zusammen").strip()
    return (
        f"Hallo {target},\n\n"
        "wenn ein Auftrag über FSM eingestellt wurde, bucht die Stunden bitte vollständig über FSM. "
        "Bitte nicht parallel oder anteilig über CATS buchen, weil die Stunden sonst nicht sauber auf dem digitalen Leistungsnachweis erscheinen.\n\n"
        "Wenn etwas unklar ist, bitte vorher kurz melden. Dann können wir es direkt sauber klären und vermeiden später unnötige Nacharbeit.\n\n"
        "Viele Grüße"
    )

def vde_offer_note(data: dict) -> str:
    topic = str(data.get("topic") or data.get("norm") or "").lower()
    base = vde_snippet(topic)
    if "text" in base:
        note = base["text"]
    else:
        note = "Normhinweise bitte nur verwenden, wenn sie fachlich zum Leistungsumfang passen."
    return (
        note + "\n\n"
        "Mögliche Angebotsformulierung:\n"
        "Die Arbeiten erfolgen, soweit für den beschriebenen Leistungsumfang zutreffend, unter Berücksichtigung der einschlägigen DIN VDE Bestimmungen. "
        "Der konkrete Prüfumfang richtet sich nach Ausführung, Anlagenzustand und Abstimmung vor Ort."
    )

def work_agent_generate(kind: str, data: dict) -> dict:
    kind_l = (kind or "").lower().strip()
    if kind_l in ("sap", "angebot", "sap_angebot", "angebotstext"):
        text = sap_offer_advanced(data)
    elif kind_l in ("mail", "email", "e-mail", "rewrite"):
        text = mail_rewrite_advanced(data)
    elif kind_l in ("lnw", "leistungsnachweis"):
        text = lnw_text_advanced(data)
    elif kind_l in ("fsm", "cats", "fsm_cats"):
        text = fsm_cats_notice_advanced(data)
    elif kind_l in ("vde", "norm", "normhinweis"):
        text = vde_offer_note(data)
    else:
        raise HTTPException(400, "Unbekannter Work Agent Typ. Verfügbar: sap, mail, lnw, fsm, vde")
    log_item = save_work_log(kind_l, data, text)
    return {"kind": kind_l, "text": text, "log_id": log_item["id"]}

def work_agent_examples() -> dict:
    return {
        "sap": {
            "kind": "sap",
            "scope": "Austausch alter Wannenleuchten gegen neue LED Leuchten inklusive Zusatzarbeiten nach Kundenwunsch",
            "location": "E41",
            "norms": ["DIN VDE 0100-600", "DGUV V3"],
        },
        "mail": {
            "kind": "mail",
            "content": "Bitte die FSM Stunden nicht anteilig in CATS buchen, da diese sonst nicht im LNW auftauchen.",
            "tone": "locker-professionell",
        },
        "lnw": {
            "kind": "lnw",
            "scope": "Prüfung und Instandsetzung der Beleuchtung",
            "location": "E41",
            "result": "Anlage nach Abschluss der Arbeiten geprüft",
        },
        "vde": {"kind": "vde", "topic": "0100-600"},
    }

def work_agent_help() -> str:
    return (
        "Work Agent Befehle:\n"
        "- sap text: LED Umbau E41 mit Prüfung nach DIN VDE 0100-600\n"
        "- mail text: Bitte FSM Stunden nicht in CATS buchen\n"
        "- lnw text: Beleuchtung geprüft und instandgesetzt\n"
        "- vde hinweis 0100-600\n"
        "- fsm cats hinweis\n"
        "- rechne 320 steckdosen bei 5 minuten\n"
        "- was kosten 18,5 stunden bei 93,50 euro"
    )

# ─────────────────────────────────────────────────────────────────────────────
# v10 Tech Core: sichere Computer Control, Dokumenten Agent, Tool Registry
# inspiriert von Open Interpreter, AnythingLLM und MCP, aber ohne fremden Code.
# ─────────────────────────────────────────────────────────────────────────────
SAFE_WRITE_ROOTS = {
    "downloads": Path.home() / "Downloads",
    "desktop": Path.home() / "Desktop",
    "documents": Path.home() / "Documents",
    "jarvis": BASE_DIR,
}

DEFAULT_TOOL_REGISTRY = [
    {"name": "windows.open_app", "category": "windows", "risk": "low", "description": "Startet eine freigegebene Windows App aus der Allowlist."},
    {"name": "windows.open_folder", "category": "windows", "risk": "low", "description": "Öffnet einen freigegebenen Ordner aus der Allowlist."},
    {"name": "windows.search_files", "category": "windows", "risk": "read", "description": "Sucht Dateien in freigegebenen Suchpfaden."},
    {"name": "files.import", "category": "documents", "risk": "read", "description": "Importiert TXT, LOG, CSV, JSON, MD und Code Dateien in den lokalen Index."},
    {"name": "documents.analyze", "category": "documents", "risk": "read", "description": "Analysiert importierte Dokumente und Logs."},
    {"name": "memory.index", "category": "memory", "risk": "write", "description": "Speichert Wissen lokal im JSON Memory."},
    {"name": "web.open_search", "category": "browser", "risk": "low", "description": "Öffnet eine Websuche im Standardbrowser."},
    {"name": "actions.prepare", "category": "safety", "risk": "confirm", "description": "Bereitet riskantere Aktionen nur zur Bestätigung vor."},
]

def ensure_tool_registry() -> list[dict]:
    tools = read_json(TOOL_REGISTRY_FILE, None)
    if not isinstance(tools, list) or not tools:
        tools = DEFAULT_TOOL_REGISTRY
        write_json(TOOL_REGISTRY_FILE, tools)
    return tools

def safe_relative_path(path_text: str) -> Optional[Path]:
    if not path_text:
        return None
    p = Path(path_text).expanduser()
    try:
        if p.is_absolute():
            resolved = p.resolve()
        else:
            resolved = (BASE_DIR / p).resolve()
        allowed = [r.resolve() for r in SAFE_WRITE_ROOTS.values() if r.exists() or r.parent.exists()]
        if any(str(resolved).lower().startswith(str(root).lower()) for root in allowed):
            return resolved
    except Exception:
        return None
    return None

def create_pending_action(action_type: str, payload: dict, risk: str = "confirm") -> dict:
    actions = ensure_list_file(ACTIONS_FILE)
    item = {
        "id": str(uuid.uuid4()),
        "type": action_type,
        "risk": risk,
        "payload": payload,
        "status": "pending",
        "created_at": now_iso(),
        "message": "Diese Aktion wurde vorbereitet und benötigt Bestätigung."
    }
    actions.insert(0, item)
    write_json(ACTIONS_FILE, actions)
    return item

def execute_pending_action(action_id: str) -> dict:
    actions = ensure_list_file(ACTIONS_FILE)
    for item in actions:
        if item.get("id") == action_id:
            if item.get("status") != "pending":
                return {"ok": False, "error": "Aktion ist nicht mehr offen.", "action": item}
            action_type = item.get("type")
            payload = item.get("payload") or {}
            try:
                if action_type == "copy_file":
                    src = Path(str(payload.get("src", ""))).expanduser()
                    dst = safe_relative_path(str(payload.get("dst", "")))
                    if not src.exists() or not src.is_file():
                        raise ValueError("Quelle existiert nicht oder ist keine Datei.")
                    if dst is None:
                        raise ValueError("Ziel liegt nicht in einem freigegebenen Pfad.")
                    dst.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(src, dst)
                    item["status"] = "done"; item["executed_at"] = now_iso()
                    write_json(ACTIONS_FILE, actions)
                    return {"ok": True, "message": f"Datei kopiert nach {dst}", "action": item}
                if action_type == "write_text_file":
                    dst = safe_relative_path(str(payload.get("path", "")))
                    if dst is None:
                        raise ValueError("Ziel liegt nicht in einem freigegebenen Pfad.")
                    dst.parent.mkdir(parents=True, exist_ok=True)
                    dst.write_text(str(payload.get("content", "")), encoding="utf-8")
                    item["status"] = "done"; item["executed_at"] = now_iso()
                    write_json(ACTIONS_FILE, actions)
                    return {"ok": True, "message": f"Datei geschrieben: {dst}", "action": item}
                raise ValueError(f"Unbekannter Aktionstyp: {action_type}")
            except Exception as e:
                item["status"] = "error"; item["error"] = str(e); item["executed_at"] = now_iso()
                write_json(ACTIONS_FILE, actions)
                return {"ok": False, "error": str(e), "action": item}
    raise HTTPException(404, "Aktion nicht gefunden")

def open_web_search(query: str) -> dict:
    q = (query or "").strip()
    if not q:
        return {"ok": False, "error": "Suchbegriff fehlt"}
    from urllib.parse import quote_plus
    url = "https://www.google.com/search?q=" + quote_plus(q)
    try:
        if os.name == "nt":
            subprocess.Popen(["cmd", "/c", "start", "", url], shell=False)
        else:
            subprocess.Popen(["xdg-open", url], shell=False)
        searches = ensure_list_file(WEB_SEARCH_FILE)
        item = {"id": str(uuid.uuid4()), "query": q, "url": url, "created_at": now_iso()}
        searches.insert(0, item); write_json(WEB_SEARCH_FILE, searches)
        return {"ok": True, "query": q, "url": url}
    except Exception as e:
        return {"ok": False, "error": str(e), "query": q, "url": url}

def analyze_text_advanced(text: str) -> dict:
    text = text or ""
    lines = [l.rstrip() for l in text.replace("\r", "").split("\n")]
    nonempty = [l for l in lines if l.strip()]
    lower_lines = [l.lower() for l in nonempty]
    error_keys = ("error", "fehler", "failed", "exception", "traceback", "cannot", "nicht gefunden", "warning", "warn", "abbruch", "denied")
    errors = [nonempty[i] for i,l in enumerate(lower_lines) if any(k in l for k in error_keys)]
    paths = re.findall(r"[A-Za-z]:\\[^\n\r\t\"<>|]+|/[A-Za-z0-9_\-./]+", text)
    emails = re.findall(r"[\w.\-+]+@[\w.\-]+\.\w+", text)
    words = re.findall(r"[A-Za-zÄÖÜäöüß0-9_\\-]{3,}", text.lower())
    stop = {"und","oder","der","die","das","ein","eine","mit","für","von","auf","ist","nicht","this","that","the","and","error","warn","warning"}
    freq: dict[str,int] = {}
    for w in words:
        if w not in stop:
            freq[w] = freq.get(w,0)+1
    top_words = sorted(freq.items(), key=lambda x: x[1], reverse=True)[:12]
    summary = [
        f"Zeilen: {len(lines)} | Nicht leer: {len(nonempty)} | Zeichen: {len(text)}",
        f"Auffällige Zeilen: {len(errors)}",
    ]
    if errors:
        summary.append("Top Auffälligkeiten:")
        summary.extend(errors[:10])
    else:
        summary.append("Keine klaren Fehlerzeilen gefunden. Erste relevante Zeilen:")
        summary.extend(nonempty[:10])
    return {
        "lines": len(lines),
        "nonempty_lines": len(nonempty),
        "chars": len(text),
        "errors": errors[:80],
        "paths": paths[:40],
        "emails": sorted(set(emails))[:40],
        "top_terms": [{"term": k, "count": v} for k,v in top_words],
        "summary": "\n".join(summary)
    }

def analyze_imported_file(file_id: str) -> dict:
    for item in ensure_list_file(FILE_INDEX_FILE):
        if item.get("id") == file_id:
            analysis = analyze_text_advanced(item.get("text_preview", ""))
            item["analysis"] = analysis
            index = ensure_list_file(FILE_INDEX_FILE)
            for i, old in enumerate(index):
                if old.get("id") == file_id:
                    index[i] = item
                    break
            write_json(FILE_INDEX_FILE, index)
            return {"file": item, "analysis": analysis}
    raise HTTPException(404, "Datei nicht gefunden")

def index_document_text(name: str, text: str, source: str = "manual") -> dict:
    item = {
        "id": str(uuid.uuid4()),
        "name": name or "Dokument",
        "source": source,
        "size": len(text.encode("utf-8")),
        "imported_at": now_iso(),
        "text_preview": text[:12000],
        "summary": summarize_text_basic(text),
        "analysis": analyze_text_advanced(text),
    }
    index = ensure_list_file(FILE_INDEX_FILE)
    index.insert(0, item)
    write_json(FILE_INDEX_FILE, index)
    return item

def tech_core_help() -> str:
    return (
        "Tech Core Befehle:\n"
        "- suche Datei start.log\n"
        "- google suche VDE 0100-600\n"
        "- analysiere letzte datei\n"
        "- zeig tools\n"
        "- offene aktionen\n"
        "- schreibe datei downloads/test.txt: Inhalt\n"
        "Riskante Schreibaktionen werden nur vorbereitet und müssen bestätigt werden."
    )

def try_local_command(user_input: str) -> Optional[str]:
    text = user_input.strip()
    low = text.lower().strip()

    # B4 Deep Realization Kurzbefehle
    if low in ("deep check", "tiefer check", "system tiefencheck"):
        return json.dumps(b4_deep_check(), ensure_ascii=False, indent=2)
    if low in ("repair plan", "reparatur plan", "repair vorschlag"):
        return json.dumps(b4_repair_plan(), ensure_ascii=False, indent=2)
    if low in ("agent matrix", "agenten matrix"):
        return json.dumps(b4_agent_tool_matrix(), ensure_ascii=False, indent=2)
    if low.startswith("lokale antwort ") or low.startswith("wissen antwort "):
        q = text.split(" ", 2)[-1] if len(text.split(" ", 2)) >= 3 else ""
        return b4_knowledge_answer(q)["answer"]

    # v17 Voice Interface Kurzbefehle
    if low in ("mikrofon status", "voice interface", "voice interface status"):
        vc = voice_core_payload()
        s = vc["settings"]; r = vc["runtime"]
        return (
            "Voice Interface:\n"
            f"- Mikrofon im Interface: {s.get('microphone_enabled')}\n"
            f"- Push to Talk: {s.get('push_to_talk_enabled')}\n"
            f"- Wake Word vorbereitet: {s.get('wake_word_enabled')}\n"
            f"- Aktuell Listening: {r.get('listening')}\n"
            f"- Sprache: {s.get('language')}\n"
            "Hinweis: Browser Mikrofonfreigabe bleibt zusätzlich erforderlich."
        )
    if low in ("mikrofon aus", "voice mikrofon aus"):
        return json.dumps(api_voice_microphone_disable(), ensure_ascii=False, indent=2)
    if low in ("mikrofon an", "voice mikrofon an"):
        return json.dumps(api_voice_microphone_enable(), ensure_ascii=False, indent=2)

    # v16 Voice Core Kurzbefehle
    if low in ("voice core", "voice status", "stimme status"):
        vc = voice_core_payload()
        s = vc["settings"]
        return (
            "Voice Core:\n"
            f"- TTS: {s.get('text_to_speech')}\n"
            f"- Auto Speak: {s.get('auto_speak')}\n"
            f"- Rate: {s.get('rate')} | Pitch: {s.get('pitch')} | Volume: {s.get('volume')}\n"
            f"- Piper: {'verfügbar' if vc['piper'].get('available') else 'nicht eingerichtet'}\n"
            "- Mikrofon: deaktiviert"
        )
    if low in ("piper vorbereiten", "prepare piper"):
        return "Piper vorbereitet:\n" + json.dumps(prepare_piper_layout(), ensure_ascii=False, indent=2)
    if low.startswith("voice preset "):
        pid = text.split(" ", 2)[-1].strip()
        return "Voice Preset gesetzt:\n" + json.dumps(apply_voice_preset(pid), ensure_ascii=False, indent=2)

    # v15 Systemreife Kurzbefehle
    if low in ("backup erstellen", "sicherung erstellen"):
        return "Backup erstellt:\n" + json.dumps(create_backup("chat"), ensure_ascii=False, indent=2)
    if low in ("backups", "backup liste", "sicherungen"):
        items = list_backups()
        if not items:
            return "Keine Backups gefunden."
        return "Backups:\n" + "\n".join(f"- {b['name']} | {b['size_kb']} KB | {b['modified']}" for b in items[:20])
    if low in ("diagnose zip", "diagnose paket", "diagnose erstellen"):
        return "Diagnose Paket erstellt:\n" + json.dumps(create_diagnostics_zip(), ensure_ascii=False, indent=2)
    if low in ("update vorbereiten", "prepare update"):
        return "Update vorbereitet:\n" + json.dumps(prepare_update("manual", "chat"), ensure_ascii=False, indent=2)
    if low.startswith("wissen suche ") or low.startswith("suche wissen "):
        q = text.split(" ", 2)[-1] if len(text.split(" ", 2)) >= 3 else ""
        res = search_knowledge(q, 8)
        if not res["results"]:
            return "Keine Treffer im lokalen Wissensindex."
        return "Lokale Wissenstreffer:\n" + "\n".join(f"- {r.get('title')} [{r.get('source')}] Score {r.get('score')}: {r.get('preview','')[:180]}" for r in res["results"])
    if low in ("wissen neu aufbauen", "knowledge rebuild"):
        return "Wissensindex neu aufgebaut:\n" + json.dumps(rebuild_knowledge_index(), ensure_ascii=False, indent=2)
    if low in ("dashboard", "start dashboard"):
        d = dashboard_payload()
        return (
            f"Dashboard:\n"
            f"Version: {d['version']}\n"
            f"Offene Aufgaben: {len(d['tasks'])}\n"
            f"Fällige Wiedervorlagen: {len(d['due'])}\n"
            f"Letzte Notizen: {len(d['notes'])}\n"
            f"Ollama: {'online' if d['status'].get('ollama') else 'offline'}"
        )

    # v12 Automationen und Tagesroutinen
    if low in ("tagesstart", "morgen briefing", "tages briefing", "daily briefing"):
        return build_briefing("tagesstart")["text"]
    if low in ("feierabend", "feierabend bericht", "abschlussbericht"):
        return build_briefing("feierabend")["text"]
    if low.startswith("wiedervorlage:") or low.startswith("erinnerung:"):
        content = text.split(":", 1)[1].strip()
        when = ""
        # simples Format: wiedervorlage: Text | 2026-04-26 09:00
        if "|" in content:
            content, when = [x.strip() for x in content.split("|", 1)]
        item = add_automation(content, when, "reminder")
        return f"Wiedervorlage gespeichert: {item['text']}" + (f" | {item['when']}" if item.get("when") else "")
    if low in ("wiedervorlagen", "zeige wiedervorlagen", "automationen"):
        autos = list_automations("open")
        if not autos:
            return "Keine offenen Wiedervorlagen."
        return "Offene Wiedervorlagen:\n" + "\n".join(f"- {a.get('text')} | {a.get('when') or 'ohne Termin'} | {a.get('id')}" for a in autos[:20])
    if low in ("ordner scan", "folder scan", "ordner überwachen scan"):
        res = scan_folder_watch()
        lines = ["Ordner Scan:"]
        for r in res["results"]:
            w = r.get("watch", {})
            lines.append(f"- {w.get('name')}: {r.get('count', 0)} neue Dateien")
            for f in r.get("new_files", [])[:5]:
                lines.append(f"  • {f.get('name')}")
        return "\n".join(lines)

    # v11 Work Agent Kurzbefehle
    if low in ("work agent", "work agent hilfe", "hilfe arbeit", "arbeit hilfe"):
        return work_agent_help()
    if low.startswith("sap text:") or low.startswith("sap angebot:") or low.startswith("angebotstext:"):
        content = text.split(":", 1)[1].strip()
        return work_agent_generate("sap", {"scope": content, "location": "E41", "norms": ["DIN VDE 0100-600", "DGUV V3"]})["text"]
    if low.startswith("mail text:") or low.startswith("email text:") or low.startswith("mail:"):
        content = text.split(":", 1)[1].strip()
        return work_agent_generate("mail", {"content": content})["text"]
    if low.startswith("lnw text:") or low.startswith("leistungsnachweis:"):
        content = text.split(":", 1)[1].strip()
        return work_agent_generate("lnw", {"scope": content})["text"]
    if low.startswith("vde hinweis"):
        topic = text.split(" ", 2)[-1] if len(text.split(" ", 2)) >= 3 else ""
        return work_agent_generate("vde", {"topic": topic})["text"]
    if "fsm cats hinweis" in low or "fsm/cats hinweis" in low:
        return work_agent_generate("fsm", {})["text"]

    # v10 Tech Core Kurzbefehle
    if low in ("tech core", "tech core hilfe", "zeig tech core", "hilfe tech"):
        return tech_core_help()
    if low in ("zeig tools", "tools", "tool registry", "tool register"):
        tools = ensure_tool_registry()
        return "Tool Registry:\n" + "\n".join(f"- {t['name']} ({t['risk']}): {t['description']}" for t in tools)
    if low.startswith("google suche ") or low.startswith("websuche ") or low.startswith("suche web "):
        q = text.split(" ", 2)[-1] if len(text.split(" ", 2)) >= 3 else ""
        res = open_web_search(q)
        return f"Websuche geöffnet: {res.get('url')}" if res.get("ok") else f"Websuche fehlgeschlagen: {res.get('error')}"
    if low in ("offene aktionen", "pending actions", "aktionen offen"):
        actions = [a for a in ensure_list_file(ACTIONS_FILE) if a.get("status") == "pending"]
        if not actions:
            return "Keine offenen Bestätigungsaktionen."
        return "Offene Aktionen:\n" + "\n".join(f"- {a['id']} | {a['type']} | {a.get('message')}" for a in actions[:20])
    if low.startswith("bestätige aktion ") or low.startswith("bestaetige aktion ") or low.startswith("confirm action "):
        action_id = text.split()[-1].strip()
        res = execute_pending_action(action_id)
        return res.get("message") or res.get("error") or json.dumps(res, ensure_ascii=False)
    if low.startswith("schreibe datei "):
        # Format: schreibe datei downloads/test.txt: Inhalt
        payload = text[len("schreibe datei "):].strip()
        if ":" not in payload:
            return "Format: schreibe datei downloads/test.txt: Inhalt"
        path_text, content = payload.split(":", 1)
        action = create_pending_action("write_text_file", {"path": path_text.strip(), "content": content.strip()}, "confirm")
        return f"Datei Schreiben vorbereitet. Bestätigen mit: bestätige aktion {action['id']}"
    if low in ("analysiere letzte datei", "letzte datei analysieren"):
        files = ensure_list_file(FILE_INDEX_FILE)
        if not files:
            return "Es ist noch keine Datei importiert."
        res = analyze_imported_file(files[0]["id"])
        return "Analyse der letzten Datei:\n" + res["analysis"]["summary"]

    # Aufgaben
    for prefix in ("erstelle aufgabe:", "aufgabe:", "todo:", "neue aufgabe:"):
        if low.startswith(prefix):
            content = text[len(prefix):].strip()
            if not content:
                return "Sag mir bitte den Aufgabentext."
            item = add_task(content)
            return f"Aufgabe gespeichert: {item['text']}"
    if any(x in low for x in ("zeig offene aufgaben", "zeige offene aufgaben", "offene aufgaben", "meine aufgaben")):
        tasks = [t for t in ensure_list_file(TASKS_FILE) if not t.get("done")]
        return format_tasks(tasks, "Offene Aufgaben")

    # Notizen
    for prefix in ("notiz:", "notiz speichern:", "speichere notiz:", "neue notiz:"):
        if low.startswith(prefix):
            content = text[len(prefix):].strip()
            if not content:
                return "Sag mir bitte den Notiztext."
            item = add_note(content)
            return f"Notiz gespeichert: {item['text']}"
    if low.startswith("suche notiz") or low.startswith("such notiz"):
        q = text.split(" ", 2)[-1] if len(text.split(" ", 2)) >= 3 else ""
        return format_notes(search_items(ensure_list_file(NOTES_FILE), q), "Notiz Treffer")
    if "zeige notizen" in low or low == "notizen":
        return format_notes(ensure_list_file(NOTES_FILE)[:20], "Letzte Notizen")

    # System
    if any(x in low for x in ("systemstatus", "system status", "backend diagnose", "diagnose backend", "status anzeigen")):
        st = system_status_payload()
        return (
            f"Systemstatus:\n"
            f"Backend: {st['status']}\n"
            f"Ollama: {'online' if st['ollama'] else 'offline'}\n"
            f"Modell: {st['model_default']}\n"
            f"Python: {st['python']}\n"
            f"Speicher: {st['memory']}\n"
            f"Datenträger frei: {st['disk']['free_gb']} GB\n"
            f"Notizen: {st['data']['notes']} | Aufgaben: {st['data']['tasks']}"
        )

    # Windows Apps und Ordner
    if low.startswith("öffne ") or low.startswith("oeffne ") or low.startswith("starte "):
        target = low.replace("öffne ", "", 1).replace("oeffne ", "", 1).replace("starte ", "", 1).strip()
        target = target.replace("den ordner", "").replace("ordner", "").strip()
        if target in FOLDER_ALLOWLIST:
            res = open_folder(target)
            return f"Ordner geöffnet: {res.get('path')}" if res.get("ok") else f"Konnte Ordner nicht öffnen: {res.get('error')}"
        if target in APP_ALLOWLIST:
            res = open_windows_app(target)
            return f"Programm gestartet: {target}" if res.get("ok") else f"Konnte Programm nicht starten: {res.get('error')}"
        return f"Dafür habe ich noch keine sichere Freigabe: {target}. Freigegeben sind Apps: {', '.join(sorted(APP_ALLOWLIST.keys()))}. Ordner: {', '.join(sorted(FOLDER_ALLOWLIST.keys()))}."

    if low.startswith("suche datei") or low.startswith("such datei") or low.startswith("finde datei"):
        parts = text.split(" ", 2)
        q = parts[2] if len(parts) > 2 else ""
        hits = search_files(q)
        if not hits:
            return f"Keine Datei Treffer für: {q}"
        lines = [f"Datei Treffer für '{q}':"]
        for i, h in enumerate(hits[:15], 1):
            lines.append(f"{i}. {h.get('name')}\n   {h.get('path')}")
        return "\n".join(lines)


    # v9 Arbeitsmodus Kurzbefehle
    if low.startswith("sap text:") or low.startswith("sap angebot:") or low.startswith("angebot:"):
        content = text.split(":", 1)[1].strip() if ":" in text else text
        return work_template("sap", {"scope": content, "norms": ["DIN VDE 0100-600", "DGUV V3"]})
    if low.startswith("mail:") or low.startswith("email:"):
        content = text.split(":", 1)[1].strip() if ":" in text else text
        return work_template("mail", {"scope": content})
    if "steckdosen" in low and any(ch.isdigit() for ch in low):
        import re
        nums = re.findall(r"\d+(?:[\.,]\d+)?", low)
        if nums:
            res = calc_payload("sockets", {"count": nums[0], "minutes_per_item": nums[1] if len(nums) > 1 else 5})
            return res.get("text")
    if ("stunden" in low or "std" in low) and "93" in low:
        import re
        nums = re.findall(r"\d+(?:[\.,]\d+)?", low)
        if nums:
            res = calc_payload("hours", {"hours": nums[0], "rate": nums[1] if len(nums) > 1 else 93.5})
            return res.get("text")
    if low.startswith("arbeitswissen:") or low.startswith("merke arbeit:"):
        content = text.split(":", 1)[1].strip() if ":" in text else ""
        if not content:
            return "Sag mir bitte, was ich im Arbeitswissen speichern soll."
        item = upsert_work_memory("allgemein", content[:80], content)
        return f"Arbeitswissen gespeichert: {item['key']}"
    if low.startswith("suche arbeitswissen") or low.startswith("arbeitswissen suchen"):
        q = text.split(" ", 2)[-1] if len(text.split(" ", 2)) >= 3 else ""
        hits = search_work_memory(q)
        if not hits:
            return "Keine Treffer im Arbeitswissen."
        return "Arbeitswissen Treffer:\n" + "\n".join(f"- [{h.get('category')}] {h.get('key')}: {h.get('value')}" for h in hits[:15])

    return None

def sse(data: dict) -> str:
    return "data: " + json.dumps(data, ensure_ascii=False) + "\n\n"
async def on_startup():
    # Agent-Status auf sauber setzen — falls Backend mitten im Streaming gecrasht ist
    write_json(AGENT_STATUS_FILE, {
        "active": None, "phase": "idle", "last_agent": None,
        "updated_at": now_iso(), "note": "Backend neu gestartet"
    })
    # Agent Registry und Tool Registry initialisieren
    try:
        agent_registry.reset_all_status()
        agent_registry.init_registry()
        tool_registry.init_tools()
        log("INFO", "Agent Registry und Tool Registry initialisiert")
    except Exception as e:
        log("WARN", "Registry-Init fehlgeschlagen", error=str(e))
    # Startup ins Audit Log schreiben
    try:
        audit.log_action("backend_startup", agent="system", result="ok")
    except Exception:
        pass
    log("INFO", "JARVIS Backend gestartet", version=app_version())
async def log_requests(req: Request, call_next):
    start = time.time()
    try:
        resp = await call_next(req)
        log("INFO", "request", method=req.method, path=req.url.path, status=resp.status_code, ms=round((time.time()-start)*1000))
        return resp
    except Exception as e:
        log("ERROR", "request failed", method=req.method, path=req.url.path, error=str(e))
        raise
def root():
    if FRONTEND_INDEX.exists():
        return FileResponse(FRONTEND_INDEX)
    return {"name":"JARVIS Windows Standalone", "status":"online", "docs":"/docs", "health":"/health", "hint":"Frontend Build fehlt. Bitte FIRST_SETUP.bat ausfuehren."}
def frontend_diagnose():
    if FRONTEND_DIST.joinpath("diagnose.html").exists():
        return FileResponse(FRONTEND_DIST / "diagnose.html")
    if FRONTEND_DIAG.exists():
        return FileResponse(FRONTEND_DIAG)
    return {"status":"diagnose.html fehlt"}
def health():
    agent_status = read_json(AGENT_STATUS_FILE, {"active": None, "phase": "idle"})
    # Letzten Fehler aus dem Log holen
    last_error = None
    try:
        if LOG_FILE.exists():
            lines = LOG_FILE.read_text(encoding="utf-8", errors="replace").splitlines()
            for line in reversed(lines[-200:]):
                if "[ERROR]" in line:
                    last_error = line.strip()
                    break
    except Exception:
        pass
    return {
        "status": "online",
        "ollama": ollama_online(),
        "ollama_base": OLLAMA_BASE,
        "model_default": DEFAULT_MODEL,
        "agent_active": agent_status.get("active"),
        "agent_phase": agent_status.get("phase", "idle"),
        "last_error": last_error,
        "time": datetime.now().isoformat(timespec="seconds"),
    }
def debug_logs(lines: int = 200):
    if not LOG_FILE.exists(): return {"lines": []}
    data = LOG_FILE.read_text(encoding="utf-8", errors="replace").splitlines()[-max(1,min(lines,1000)):]
    return {"file": str(LOG_FILE), "lines": data}
def models():
    try:
        data = http_json(OLLAMA_BASE.rstrip("/") + "/api/tags", timeout=5)
        names = [m.get("name") for m in data.get("models", []) if m.get("name")]
        return {"object":"list", "data":[{"id":n,"object":"model"} for n in names], "models": names}
    except Exception as e:
        log("WARN", "models fallback", error=str(e))
        return {"object":"list", "data":[{"id":DEFAULT_MODEL,"object":"model"}], "models":[DEFAULT_MODEL], "warning": str(e)}
async def chat_completions(req: Request):
    payload = await req.json()
    log("INFO", "proxy chat", model=payload.get("model"), stream=payload.get("stream"))
    if payload.get("stream"):
        def gen():
            try:
                data = json.dumps(payload).encode("utf-8")
                r = request.Request(OLLAMA_OPENAI, data=data, headers={"Content-Type":"application/json"}, method="POST")
                with request.urlopen(r, timeout=120) as resp:
                    for line in resp:
                        yield line
            except Exception as e:
                yield ("data: " + json.dumps({"choices":[{"delta":{"content":f"[Ollama Fehler: {e}]"},"finish_reason":"stop"}]}, ensure_ascii=False) + "\n\n").encode("utf-8")
                yield b"data: [DONE]\n\n"
        return StreamingResponse(gen(), media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
    try:
        return JSONResponse(http_json(OLLAMA_OPENAI, payload, timeout=120))
    except Exception as e:
        log("ERROR", "ollama request failed", error=str(e))
        raise HTTPException(503, f"Ollama nicht erreichbar: {e}")

class OrchReq(BaseModel):
    user_input: str
    api_url: str = "http://127.0.0.1:8000"
    model: str = DEFAULT_MODEL
    memory_facts: list = []
    history: list = []
def list_orch_agents():
    return {a:{"name":a,"description":system_prompt_for(a)} for a in ["sap","calendar","research","memory","email","general","file","exam","vde"]}
def orchestrate_run(req: OrchReq):
    def gen():
        local_result = try_local_command(req.user_input)
        agent, reason, conf = classify_agent(req.user_input)
        if local_result is not None:
            agent = "general"
            reason = "Lokales Windows/Memory Tool"
            conf = 1.0
            write_json(AGENT_STATUS_FILE, {"active": agent, "phase": "local_tool", "reason": reason, "confidence": conf, "updated_at": now_iso()})
            yield sse({"event":"routing", "agent":agent, "reason":reason, "confidence":conf})
            yield sse({"event":"thinking", "agent":agent, "message":"Lokales Tool wird ausgeführt..."})
            yield sse({"event":"delta", "agent":agent, "content":local_result, "response":local_result})
            write_json(AGENT_STATUS_FILE, {"active": None, "phase": "done", "last_agent": agent, "updated_at": now_iso()})
            yield sse({"event":"done", "agent":agent, "response":local_result, "content":"", "tool_log":["Lokales Tool abgeschlossen", "Kein LLM Request notwendig"]})
            yield "data: [DONE]\n\n"
            return
        full_response = ""
        write_json(AGENT_STATUS_FILE, {"active": agent, "phase": "llm", "reason": reason, "confidence": conf, "updated_at": now_iso()})
        yield sse({"event":"routing", "agent":agent, "reason":reason, "confidence":conf})
        yield sse({"event":"thinking", "agent":agent, "message":f"{agent.upper()} Agent verarbeitet..."})
        messages = build_messages(req.user_input, req.history, req.memory_facts, agent)
        payload = {"model": req.model or DEFAULT_MODEL, "messages": messages, "stream": True, "temperature": 0.35}
        try:
            data = json.dumps(payload).encode("utf-8")
            r = request.Request(OLLAMA_OPENAI, data=data, headers={"Content-Type":"application/json"}, method="POST")
            with request.urlopen(r, timeout=180) as resp:
                for raw_line in resp:
                    line = raw_line.decode("utf-8", errors="ignore").strip()
                    if not line.startswith("data:"): continue
                    raw = line[5:].strip()
                    if raw == "[DONE]": break
                    try:
                        obj = json.loads(raw)
                        delta = normalize_backend_text(obj.get("choices", [{}])[0].get("delta", {}).get("content", ""))
                        if delta:
                            full_response += delta
                            yield sse({"event":"delta", "agent":agent, "content":delta, "response":delta})
                    except Exception:
                        continue
            write_json(AGENT_STATUS_FILE, {"active": None, "phase": "done", "last_agent": agent, "updated_at": now_iso()})
            yield sse({"event":"done", "agent":agent, "response":full_response, "content":"", "tool_log":[f"{agent} abgeschlossen", "Windows Standalone Backend"]})
            yield "data: [DONE]\n\n"
        except Exception as e:
            log("ERROR", "orchestrator failed", error=str(e))
            yield sse({"event":"error", "message": f"Ollama/Backend Fehler: {e}"})
            yield "data: [DONE]\n\n"
    return StreamingResponse(gen(), media_type="text/event-stream", headers={"Cache-Control":"no-cache", "X-Accel-Buffering":"no"})



# ── Package 1: Notizen, Aufgaben, Erinnerungen, Diagnose ─────────────
def api_notes(q: str = "", limit: int = 100):
    return {"notes": search_items(ensure_list_file(NOTES_FILE), q, min(max(limit, 1), 500))}
async def api_add_note(req: Request):
    body = await req.json()
    text = (body.get("text") or body.get("content") or "").strip()
    if not text:
        raise HTTPException(400, "Notiztext fehlt")
    return add_note(text, body.get("tags") if isinstance(body.get("tags"), list) else [])
def api_delete_note(note_id: str):
    notes = ensure_list_file(NOTES_FILE)
    new = [n for n in notes if n.get("id") != note_id]
    write_json(NOTES_FILE, new)
    return {"deleted": len(notes)-len(new)}
def api_tasks(done: Optional[bool] = None, q: str = ""):
    tasks = ensure_list_file(TASKS_FILE)
    if done is not None:
        tasks = [t for t in tasks if bool(t.get("done")) is done]
    return {"tasks": search_items(tasks, q, 500)}
async def api_add_task(req: Request):
    body = await req.json()
    text = (body.get("text") or body.get("content") or "").strip()
    if not text:
        raise HTTPException(400, "Aufgabentext fehlt")
    return add_task(text, body.get("due"))
async def api_update_task(task_id: str, req: Request):
    body = await req.json()
    tasks = ensure_list_file(TASKS_FILE)
    for t in tasks:
        if t.get("id") == task_id:
            if "done" in body: t["done"] = bool(body["done"])
            if "text" in body and str(body["text"]).strip(): t["text"] = str(body["text"]).strip()
            if "due" in body: t["due"] = body.get("due")
            t["updated_at"] = now_iso()
            write_json(TASKS_FILE, tasks)
            return t
    raise HTTPException(404, "Aufgabe nicht gefunden")
def api_delete_task(task_id: str):
    tasks = ensure_list_file(TASKS_FILE)
    new = [t for t in tasks if t.get("id") != task_id]
    write_json(TASKS_FILE, new)
    return {"deleted": len(tasks)-len(new)}
def api_reminders():
    return {"reminders": ensure_list_file(REMINDERS_FILE)}
async def api_add_reminder(req: Request):
    body = await req.json()
    text = (body.get("text") or "").strip()
    when = (body.get("when") or "").strip()
    if not text or not when:
        raise HTTPException(400, "Text und when sind erforderlich")
    reminders = ensure_list_file(REMINDERS_FILE)
    item = {"id": str(uuid.uuid4()), "text": text, "when": when, "done": False, "created_at": now_iso()}
    reminders.insert(0, item)
    write_json(REMINDERS_FILE, reminders)
    return item
def api_system_status():
    return system_status_payload()

# ── Package 2: sichere Windows Tools ────────────────────────────────
def api_windows_apps():
    return {"apps": sorted(APP_ALLOWLIST.keys()), "folders": sorted(FOLDER_ALLOWLIST.keys())}
async def api_open_app(req: Request):
    body = await req.json()
    name = body.get("name") or body.get("app") or ""
    return open_windows_app(str(name))
async def api_open_folder(req: Request):
    body = await req.json()
    name = body.get("name") or body.get("folder") or ""
    return open_folder(str(name))
def api_search_files(q: str, limit: int = 25):
    return {"query": q, "results": search_files(q, min(max(limit, 1), 100))}



# ── v9 Arbeitsmodus, Dateien, strukturierter Memory, Self Check ───────────────
async def api_work_template(req: Request):
    body = await req.json()
    return {"text": work_template(str(body.get("kind") or "sap"), body), "kind": body.get("kind") or "sap"}
async def api_work_calc(kind: str, req: Request):
    body = await req.json()
    return calc_payload(kind, body)
def api_vde(topic: str = ""):
    return vde_snippet(topic)
def api_work_memory(q: str = "", category: str = ""):
    return {"items": search_work_memory(q, category)}
async def api_work_memory_add(req: Request):
    body = await req.json()
    category = str(body.get("category") or "allgemein")
    key = str(body.get("key") or body.get("title") or "Eintrag")
    value = body.get("value") if "value" in body else body.get("text", "")
    return upsert_work_memory(category, key, value, {"source": "ui"})
def api_work_memory_delete(category: str, key: str):
    store = read_json(WORK_MEMORY_FILE, {})
    if isinstance(store, dict) and category in store and isinstance(store[category], dict) and key in store[category]:
        del store[category][key]
        write_json(WORK_MEMORY_FILE, store)
        return {"deleted": 1}
    return {"deleted": 0}
async def api_file_import(file: UploadFile = File(...)):
    raw = await file.read()
    uploads = DATA_DIR / "uploads"
    uploads.mkdir(exist_ok=True)
    safe_name = "".join(ch for ch in (file.filename or "upload.bin") if ch.isalnum() or ch in (".", "_", "-", " ")).strip() or "upload.bin"
    target = uploads / f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{safe_name}"
    target.write_bytes(raw)
    text = extract_text_from_upload(safe_name, raw)
    item = {"id": str(uuid.uuid4()), "name": safe_name, "path": str(target), "size": len(raw), "imported_at": now_iso(), "text_preview": text[:12000], "summary": summarize_text_basic(text)}
    index = ensure_list_file(FILE_INDEX_FILE)
    index.insert(0, item)
    write_json(FILE_INDEX_FILE, index)
    return item
def api_files(q: str = ""):
    return {"files": search_items(ensure_list_file(FILE_INDEX_FILE), q, 100)}
def api_file_get(file_id: str):
    for item in ensure_list_file(FILE_INDEX_FILE):
        if item.get("id") == file_id:
            return item
    raise HTTPException(404, "Datei nicht gefunden")
def api_self_check():
    return self_check_payload()
def api_agent_status():
    return read_json(AGENT_STATUS_FILE, {"active": None, "last": [], "version": "9.0.0"})
def awareness_current():
    return {"app":"Windows", "category":"system", "windowTitle":"JARVIS Windows Standalone", "hints":["Standalone Backend aktiv", "Ollama " + ("online" if ollama_online() else "offline")], "timestamp": datetime.now().isoformat(timespec="seconds")}
def email_status():
    # Sicherer Default: kein Outlook Zugriff ohne explizite PowerShell Aktion.
    return {"status":"offline", "message":"Outlook Scan ist im Standalone Backend aus Sicherheitsgründen deaktiviert, bis du ihn bewusst aktivierst."}
async def email_scan(req: Request):
    async def gen():
        yield sse({"event":"start", "message":"Outlook Scan deaktiviert"})
        yield sse({"event":"result", "total_scanned":0, "spam":[], "legitimate":[], "unknown":[], "threshold":0.75})
        yield "data: [DONE]\n\n"
    return StreamingResponse(gen(), media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
async def email_delete(req: Request):
    return {"count":0, "message":"Löschen ist im Standalone Backend deaktiviert."}








# ─────────────────────────────────────────────────────────────────────────────
# B4 Deep Realization: echte Tiefe statt Prompt Ablage
# Agentenmatrix, Deep Check, Repair Plan, lokaler Knowledge Answer Builder,
# Kontextpaket und Sicherheitsbewertung.
# ─────────────────────────────────────────────────────────────────────────────
def b4_version() -> str:
    return "B4_REALIZED_DEPTH"

def _cmd_version(cmd: list[str], timeout: int = 5) -> dict:
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, shell=False)
        out = (proc.stdout or proc.stderr or "").strip()
        return {"ok": proc.returncode == 0, "cmd": " ".join(cmd), "output": out[:500], "code": proc.returncode}
    except Exception as e:
        return {"ok": False, "cmd": " ".join(cmd), "error": str(e)}

def _port_check(port: int, host: str = "127.0.0.1") -> dict:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(0.5)
    try:
        result = sock.connect_ex((host, port))
        return {"port": port, "host": host, "open": result == 0}
    finally:
        try: sock.close()
        except Exception: pass

def _active_api_routes() -> list[dict]:
    text = (BASE_DIR / "backend" / "main.py").read_text(encoding="utf-8", errors="ignore")
    lines = [line for line in text.splitlines() if not line.strip().startswith("#")]
    clean = "\n".join(lines)
    routes = []
    for m in re.finditer(r'@app\.(get|post|delete|put|patch)\("([^"]+)"\)', clean):
        routes.append({"method": m.group(1).upper(), "path": m.group(2)})
    return routes

def _route_duplicates() -> list[dict]:
    routes = _active_api_routes()
    seen: dict[tuple[str,str], int] = {}
    for r in routes:
        key = (r["method"], r["path"])
        seen[key] = seen.get(key, 0) + 1
    return [{"method": k[0], "path": k[1], "count": v} for k, v in seen.items() if v > 1]

def _frontend_import_check() -> dict:
    src = BASE_DIR / "frontend" / "src"
    missing = []
    if not src.exists():
        return {"ok": False, "missing": [{"file": "frontend/src", "import": "folder missing"}]}
    for f in list(src.rglob("*.tsx")) + list(src.rglob("*.ts")):
        text = f.read_text(encoding="utf-8", errors="ignore")
        for m in re.finditer(r'import\s+(?:[^"\']+\s+from\s+)?["\'](\./[^"\']+)["\']', text):
            imp = m.group(1)
            base = f.parent / imp
            candidates = [base, base.with_suffix(".tsx"), base.with_suffix(".ts"), base.with_suffix(".js"), base / "index.tsx", base / "index.ts"]
            if not any(c.exists() for c in candidates):
                missing.append({"file": str(f.relative_to(BASE_DIR)), "import": imp})
    return {"ok": not missing, "missing": missing}

def _old_reference_check() -> dict:
    patterns = ["C:\\\\Projekte", "old_frontend", "jarvis_old", "legacy_frontend"]
    hits = []
    for p in BASE_DIR.rglob("*"):
        if not p.is_file():
            continue
        if any(part in {"node_modules", ".venv", "__pycache__", ".git"} for part in p.parts):
            continue
        if p.suffix.lower() not in {".py", ".ps1", ".bat", ".json", ".ts", ".tsx", ".js", ".css", ".html", ".txt", ".md"}:
            continue
        try:
            text = p.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        for pat in patterns:
            if pat in text:
                hits.append({"file": str(p.relative_to(BASE_DIR)), "pattern": pat})
                break
    return {"ok": not hits, "hits": hits[:200]}

def _json_file_health() -> dict:
    files = [
        MEMORY_FILE, NOTES_FILE, TASKS_FILE, REMINDERS_FILE, WORK_MEMORY_FILE, FILE_INDEX_FILE,
        AGENT_STATUS_FILE, TOOL_REGISTRY_FILE, ACTIONS_FILE, AUTOMATIONS_FILE, FOLDER_WATCH_FILE,
        PERMISSIONS_FILE, KNOWLEDGE_INDEX_FILE, VOICE_SETTINGS_FILE, VOICE_RUNTIME_FILE,
        AUDIT_LOG_FILE, AGENT_REGISTRY_FILE, DIAGNOSTICS_FILE
    ]
    results = []
    for p in files:
        if not p.exists():
            results.append({"file": str(p.relative_to(BASE_DIR)), "exists": False, "ok": True, "detail": "wird bei Bedarf erzeugt"})
            continue
        try:
            content = p.read_text(encoding="utf-8")
            if content.strip():
                json.loads(content)
            results.append({"file": str(p.relative_to(BASE_DIR)), "exists": True, "ok": True, "size": p.stat().st_size})
        except Exception as e:
            results.append({"file": str(p.relative_to(BASE_DIR)), "exists": True, "ok": False, "error": str(e), "size": p.stat().st_size})
    return {"ok": all(r["ok"] for r in results), "files": results}

def b4_agent_tool_matrix() -> dict:
    try:
        agents = agent_registry.get_all()
    except Exception:
        agents = []
    try:
        tools = tool_registry.get_all()
    except Exception:
        tools = ensure_tool_registry()
    tool_by_id = {str(t.get("id") or t.get("name")): t for t in tools}
    matrix = []
    for a in agents:
        tool_names = a.get("tools", []) or []
        resolved = []
        for name in tool_names:
            t = tool_by_id.get(str(name)) or next((x for x in tools if str(x.get("name")).lower() == str(name).lower()), None)
            resolved.append({
                "id": name,
                "registered": bool(t),
                "risk_level": (t or {}).get("risk_level", a.get("risk_level", "unknown")),
                "requires_confirmation": bool((t or {}).get("requires_confirmation", False)),
            })
        matrix.append({
            "agent_id": a.get("id"),
            "agent": a.get("name"),
            "role": a.get("role"),
            "status": a.get("status", "idle"),
            "risk_level": a.get("risk_level"),
            "tools_total": len(tool_names),
            "tools_registered": sum(1 for x in resolved if x["registered"]),
            "tools": resolved,
        })
    return {
        "version": b4_version(),
        "agents": agents,
        "tools": tools,
        "matrix": matrix,
        "summary": {
            "agents": len(agents),
            "tools": len(tools),
            "unregistered_tool_refs": sum(1 for row in matrix for t in row["tools"] if not t["registered"]),
        }
    }

def b4_deep_check() -> dict:
    checks = []
    def add(name: str, ok: bool, severity: str, detail: str = "", fix: str = "", data: Any = None):
        checks.append({
            "name": name,
            "ok": bool(ok),
            "severity": severity if not ok else "info",
            "detail": detail,
            "fix": fix,
            "data": data,
        })
    python_v = _cmd_version([sys.executable, "--version"])
    node_v = _cmd_version(["node", "--version"])
    npm_v = _cmd_version(["npm", "--version"])
    add("Python verfügbar", python_v.get("ok", False), "critical", python_v.get("output") or python_v.get("error",""), "Python 3 installieren oder PATH prüfen", python_v)
    add("Node verfügbar", node_v.get("ok", False), "critical", node_v.get("output") or node_v.get("error",""), "Node.js installieren oder PATH prüfen", node_v)
    add("npm verfügbar", npm_v.get("ok", False), "high", npm_v.get("output") or npm_v.get("error",""), "npm über Node.js Installation reparieren", npm_v)
    add("Backend Port 8000 offen", _port_check(8000)["open"], "medium", "Port 8000 sollte beim laufenden Backend offen sein", "START_JARVIS ausführen oder Backend Log prüfen", _port_check(8000))
    add("Frontend Port 5173 offen", _port_check(5173)["open"], "low", "Nur im Dev Modus offen. Bei Production Build nicht zwingend.", "Frontend Dev Server starten, falls gewünscht", _port_check(5173))
    add("Ollama erreichbar", ollama_online(), "medium", OLLAMA_BASE, "Ollama starten oder installieren")
    add("Frontend package.json vorhanden", (BASE_DIR/"frontend/package.json").exists(), "high", "package.json im Frontend", "Paketstruktur prüfen")
    add("Backend requirements vorhanden", (BASE_DIR/"backend/requirements.txt").exists(), "high", "requirements.txt im Backend", "Paketstruktur prüfen")
    imp = _frontend_import_check()
    add("Frontend Imports", imp["ok"], "high", f"{len(imp['missing'])} fehlende Imports", "fehlende Komponenten/Dateien ergänzen", imp)
    dups = _route_duplicates()
    add("API Route Duplikate", len(dups) == 0, "medium", f"{len(dups)} Duplikate", "doppelte Routen konsolidieren", dups)
    old = _old_reference_check()
    add("Legacy Pfade", old["ok"], "high", f"{len(old['hits'])} Treffer", "alte Pfade entfernen", old)
    json_health = _json_file_health()
    add("Lokale JSON Daten", json_health["ok"], "medium", "JSON Daten lesbar", "defekte JSON über corrupt_backups prüfen", json_health)
    matrix = b4_agent_tool_matrix()
    add("Agent Tool Matrix", matrix["summary"]["unregistered_tool_refs"] == 0, "medium", f"{matrix['summary']['unregistered_tool_refs']} nicht registrierte Tool Referenzen", "Tool Registry ergänzen oder Agent Definition korrigieren", matrix["summary"])
    report = {
        "version": b4_version(),
        "created_at": now_iso(),
        "ok": all(c["ok"] for c in checks if c["severity"] in {"critical", "high", "medium"}),
        "checks": checks,
        "summary": {
            "total": len(checks),
            "failed": sum(1 for c in checks if not c["ok"]),
            "critical": sum(1 for c in checks if not c["ok"] and c["severity"] == "critical"),
            "high": sum(1 for c in checks if not c["ok"] and c["severity"] == "high"),
            "medium": sum(1 for c in checks if not c["ok"] and c["severity"] == "medium"),
        }
    }
    write_json(DEEP_REPORT_FILE, report)
    try:
        audit.log_action("deep_check", agent="diagnostic", tool="b4_deep_check", risk_level="low", result=f"{report['summary']['failed']} Befunde")
    except Exception:
        pass
    return report

def b4_repair_plan() -> dict:
    report = b4_deep_check()
    steps = []
    for c in report["checks"]:
        if c["ok"]:
            continue
        steps.append({
            "id": str(uuid.uuid4())[:8],
            "check": c["name"],
            "severity": c["severity"],
            "problem": c["detail"],
            "fix": c["fix"],
            "risk": "manual_review",
            "auto_execute": False,
            "reason": "Repair Plan führt bewusst keine riskanten Änderungen automatisch aus."
        })
    plan = {
        "version": b4_version(),
        "created_at": now_iso(),
        "steps": steps,
        "summary": {"steps": len(steps), "critical": sum(1 for s in steps if s["severity"] == "critical")},
    }
    write_json(REPAIR_PLAN_FILE, plan)
    try:
        audit.log_action("repair_plan_created", agent="diagnostic", tool="b4_repair_plan", risk_level="low", result=f"{len(steps)} Schritte")
    except Exception:
        pass
    return plan

def b4_context_pack() -> dict:
    report = b4_deep_check()
    matrix = b4_agent_tool_matrix()
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    out = CONTEXT_PACK_DIR / f"jarvis_context_pack_{ts}.zip"
    manifest = {
        "version": b4_version(),
        "created_at": now_iso(),
        "purpose": "Kompaktes Paket für Fehlersuche und Weiterentwicklung",
        "contains": ["deep_report.json", "agent_tool_matrix.json", "repair_plan.json", "selected_logs"],
    }
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("manifest.json", json.dumps(manifest, ensure_ascii=False, indent=2))
        z.writestr("deep_report.json", json.dumps(report, ensure_ascii=False, indent=2))
        z.writestr("agent_tool_matrix.json", json.dumps(matrix, ensure_ascii=False, indent=2))
        z.writestr("repair_plan.json", json.dumps(b4_repair_plan(), ensure_ascii=False, indent=2))
        for p in [LOG_FILE, START_LOG, BACKEND_PID_FILE, FRONTEND_PID_FILE]:
            try:
                if p.exists() and p.is_file() and p.stat().st_size < 2_000_000:
                    z.write(p, p.relative_to(BASE_DIR))
            except Exception:
                pass
        for rel in ["backend/main.py", "frontend/package.json", "JARVIS_INSTALL_CONFIG.json", "README_START.txt"]:
            p = BASE_DIR / rel
            if p.exists():
                z.write(p, p.relative_to(BASE_DIR))
    try:
        audit.log_action("context_pack_created", agent="diagnostic", tool="b4_context_pack", risk_level="low", result=str(out))
    except Exception:
        pass
    return {"ok": True, "path": str(out), "size_kb": round(out.stat().st_size/1024, 1), "manifest": manifest}

def b4_knowledge_answer(query: str, limit: int = 6, category: str = "") -> dict:
    q = (query or "").strip()
    if not q:
        raise HTTPException(400, "Query fehlt")
    try:
        result = knowledge_mod.search(q, limit=min(max(limit, 1), 20), category=category or None)
        hits = result.get("results", [])
        summary = knowledge_mod.summarize_results(hits, q) if hasattr(knowledge_mod, "summarize_results") else ""
    except Exception:
        result = search_knowledge(q, limit)
        hits = result.get("results", [])
        summary = ""
    lines = []
    if hits:
        lines.append(f"Lokale Antwortbasis für: {q}")
        for i, h in enumerate(hits[:limit], 1):
            title = h.get("title") or h.get("name") or h.get("source") or "Quelle"
            cat = h.get("category") or h.get("source_type") or h.get("source") or "lokal"
            preview = (h.get("preview") or h.get("text") or "")[:280].replace("\n", " ")
            lines.append(f"{i}. {title} [{cat}]: {preview}")
    else:
        lines.append("Keine lokale Wissensquelle gefunden.")
    answer = "\n".join(lines)
    payload = {"query": q, "answer": answer, "summary": summary, "sources": hits[:limit], "total": len(hits)}
    try:
        audit.log_action("knowledge_answer", agent="memory", tool="b4_knowledge_answer", risk_level="low", result=f"{len(hits)} Treffer")
    except Exception:
        pass
    return payload


# ── v17 Voice Interface Control API ─────────────────────────────────────────
def api_voice_runtime():
    return load_voice_runtime()
async def api_voice_runtime_save(req: Request):
    body = await req.json()
    return save_voice_runtime(body)
def api_voice_microphone_enable():
    settings = load_voice_settings()
    settings["microphone_enabled"] = True
    write_json(VOICE_SETTINGS_FILE, settings)
    runtime = save_voice_runtime({"last_event": "microphone_enabled"})
    return {"settings": settings, "runtime": runtime, "message": "Mikrofon im Interface aktiviert. Browser Freigabe ist zusätzlich erforderlich."}
def api_voice_microphone_disable():
    settings = load_voice_settings()
    settings["microphone_enabled"] = False
    settings["wake_word_runtime"] = False
    settings["continuous_listening"] = False
    write_json(VOICE_SETTINGS_FILE, settings)
    runtime = save_voice_runtime({"listening": False, "last_event": "microphone_disabled"})
    return {"settings": settings, "runtime": runtime, "message": "Mikrofon deaktiviert."}
async def api_voice_transcript(req: Request):
    body = await req.json()
    text = str(body.get("text") or body.get("transcript") or "").strip()
    runtime = save_voice_runtime({"last_transcript": text, "last_event": "transcript"})
    # nicht automatisch an Ollama senden. Nur speichern/anzeigen.
    return {"ok": True, "text": text, "runtime": runtime, "message": "Transkript gespeichert."}


# ── v16 Voice Core API ──────────────────────────────────────────────────────
def api_voice_core():
    return voice_core_payload()
def api_voice_presets():
    return {"presets": load_voice_presets()}
def api_voice_apply_preset(preset_id: str):
    return apply_voice_preset(preset_id)
def api_voice_piper_status():
    return piper_status()
def api_voice_piper_prepare():
    return prepare_piper_layout()


# ── v15 System Maturity API ─────────────────────────────────────────────────
def api_app_version():
    return {"version": app_version(), "base_dir": str(BASE_DIR)}
def api_backup_list():
    return {"backups": list_backups()}
async def api_backup_create(req: Request):
    try:
        body = await req.json()
    except Exception:
        body = {}
    return create_backup(str(body.get("label") or "manual"))
async def api_backup_restore(req: Request):
    body = await req.json()
    return restore_backup(str(body.get("name") or body.get("backup") or ""))
def api_diagnostics_package():
    return create_diagnostics_zip()
def api_security_permissions():
    return load_permissions()
async def api_security_permissions_save(req: Request):
    body = await req.json()
    return save_permissions(body)
def api_update_status():
    return update_state()
async def api_update_prepare(req: Request):
    body = await req.json()
    return prepare_update(str(body.get("version") or ""), str(body.get("source") or ""))
def api_ui_settings():
    return load_ui_settings()
async def api_ui_settings_save(req: Request):
    body = await req.json()
    return save_ui_settings(body)

# [DEPRECATED - Block 3 übernimmt diese Routen weiter unten]
# @app.post("/knowledge/rebuild") -> siehe Block 3
# @app.get("/knowledge/search") -> siehe Block 3
def api_voice_settings():
    return load_voice_settings()
async def api_voice_settings_save(req: Request):
    body = await req.json()
    return save_voice_settings(body)
def api_dashboard():
    return dashboard_payload()


# ── v12 Automation & Daily Operations API ───────────────────────────────────
def api_automation_list(status: str = ""):
    return {"automations": list_automations(status)}
async def api_automation_add(req: Request):
    body = await req.json()
    return add_automation(
        str(body.get("text") or ""),
        str(body.get("when") or ""),
        str(body.get("kind") or "reminder"),
        str(body.get("recurrence") or ""),
    )
def api_automation_due():
    return {"due": due_automations(), "time": now_iso()}
def api_automation_complete(automation_id: str):
    return complete_automation(automation_id)
def api_automation_delete(automation_id: str):
    autos = ensure_list_file(AUTOMATIONS_FILE)
    new = [a for a in autos if a.get("id") != automation_id]
    write_json(AUTOMATIONS_FILE, new)
    return {"deleted": len(autos)-len(new)}
def api_briefing(kind: str):
    return build_briefing(kind)
def api_briefing_history(limit: int = 20):
    return {"items": ensure_list_file(BRIEFING_FILE)[:min(max(limit, 1), 100)]}
def api_folder_watch_list():
    return {"watchers": ensure_list_file(FOLDER_WATCH_FILE)}
async def api_folder_watch_add(req: Request):
    body = await req.json()
    return add_folder_watch(str(body.get("name") or ""), str(body.get("folder_key") or "downloads"), str(body.get("pattern") or ""))
async def api_folder_watch_scan(req: Request):
    try:
        body = await req.json()
    except Exception:
        body = {}
    return scan_folder_watch(str(body.get("watch_id") or ""))
def api_folder_watch_delete(watch_id: str):
    watchers = ensure_list_file(FOLDER_WATCH_FILE)
    new = [w for w in watchers if w.get("id") != watch_id]
    write_json(FOLDER_WATCH_FILE, new)
    return {"deleted": len(watchers)-len(new)}


# ── v11 Work Agent API ───────────────────────────────────────────────────────
async def api_work_agent_generate(req: Request):
    body = await req.json()
    kind = str(body.get("kind") or body.get("type") or "sap")
    return work_agent_generate(kind, body)
def api_work_agent_examples():
    return work_agent_examples()
def api_work_agent_logs(limit: int = 50):
    return {"logs": ensure_list_file(WORK_LOG_FILE)[:min(max(limit, 1), 200)]}
def api_work_agent_help():
    return {"text": work_agent_help(), "examples": work_agent_examples()}


# ── v10 Tech Core API ────────────────────────────────────────────────────────
def api_tools_registry():
    return {"version": "B4.0.0", "tools": ensure_tool_registry()}
async def api_tools_execute(req: Request):
    body = await req.json()
    name = str(body.get("name") or body.get("tool") or "").strip()
    args = body.get("args") if isinstance(body.get("args"), dict) else {}
    if name == "windows.open_app":
        return open_windows_app(str(args.get("name") or args.get("app") or ""))
    if name == "windows.open_folder":
        return open_folder(str(args.get("name") or args.get("folder") or ""))
    if name == "windows.search_files":
        return {"results": search_files(str(args.get("query") or args.get("q") or ""), int(args.get("limit", 25)))}
    if name == "web.open_search":
        return open_web_search(str(args.get("query") or args.get("q") or ""))
    if name == "memory.index":
        mem = read_json(MEMORY_FILE, [])
        content = args.get("content") or args.get("text") or json.dumps(args, ensure_ascii=False)
        item = {"id": str(uuid.uuid4()), "content": content, "created_at": datetime.now().isoformat(timespec="seconds")}
        mem.append(item)
        write_json(MEMORY_FILE, mem)
        return {"ok": True, "id": item["id"]}
    raise HTTPException(400, f"Tool nicht freigegeben oder unbekannt: {name}")
def api_actions_pending():
    return {"actions": [a for a in ensure_list_file(ACTIONS_FILE) if a.get("status") == "pending"]}
def api_actions_confirm(action_id: str):
    return execute_pending_action(action_id)
async def api_actions_prepare(req: Request):
    body = await req.json()
    action_type = str(body.get("type") or "")
    payload = body.get("payload") if isinstance(body.get("payload"), dict) else {}
    if action_type not in {"copy_file", "write_text_file"}:
        raise HTTPException(400, "Nur copy_file und write_text_file sind freigegeben.")
    return create_pending_action(action_type, payload, "confirm")
async def api_documents_index_text(req: Request):
    body = await req.json()
    text = str(body.get("text") or "")
    name = str(body.get("name") or "Text")
    if not text.strip():
        raise HTTPException(400, "Text fehlt")
    return index_document_text(name, text, "api")
async def api_documents_analyze(req: Request):
    body = await req.json()
    if body.get("file_id"):
        return analyze_imported_file(str(body.get("file_id")))
    text = str(body.get("text") or "")
    if not text.strip():
        raise HTTPException(400, "Text oder file_id fehlt")
    return {"analysis": analyze_text_advanced(text)}
def api_documents_search(q: str = "", limit: int = 20):
    docs = ensure_list_file(FILE_INDEX_FILE)
    ql = (q or "").lower().strip()
    hits = []
    for d in docs:
        blob = json.dumps(d, ensure_ascii=False).lower()
        if not ql or ql in blob:
            hits.append(d)
        if len(hits) >= limit:
            break
    return {"query": q, "documents": hits}
def api_web_search_open(q: str):
    return open_web_search(q)


# Managed agents, local JSON only
def managed_agents():
    return {"agents": read_json(AGENTS_FILE, [])}
async def create_agent(req: Request):
    body = await req.json()
    agents = read_json(AGENTS_FILE, [])
    item = {"id": str(uuid.uuid4()), "name": body.get("name","Agent"), "agent_type": body.get("agent_type","simple"), "status":"idle", "created_at": datetime.now().isoformat(timespec="seconds"), "messages": []}
    agents.append(item)
    write_json(AGENTS_FILE, agents)
    out = dict(item); out.pop("messages", None)
    return out
def agent_messages(agent_id: str):
    for a in read_json(AGENTS_FILE, []):
        if a.get("id") == agent_id:
            return {"messages": a.get("messages", [])}
    raise HTTPException(404, "Agent nicht gefunden")
async def post_agent_message(agent_id: str, req: Request):
    body = await req.json()
    agents = read_json(AGENTS_FILE, [])
    for a in agents:
        if a.get("id") == agent_id:
            msg = {"id": str(uuid.uuid4()), "role":"user", "content": body.get("content",""), "created_at": datetime.now().isoformat(timespec="seconds")}
            a.setdefault("messages", []).append(msg)
            write_json(AGENTS_FILE, agents)
            return msg
    raise HTTPException(404, "Agent nicht gefunden")
def delete_agent(agent_id: str):
    agents = read_json(AGENTS_FILE, [])
    new = [a for a in agents if a.get("id") != agent_id]
    write_json(AGENTS_FILE, new)
    return {"deleted": len(agents)-len(new)}
def memory_stats():
    mem = read_json(MEMORY_FILE, [])
    return {"entries": len(mem), "backend":"json-local"}
async def memory_search(req: Request):
    body = await req.json()
    q = (body.get("query") or "").lower()
    mem = read_json(MEMORY_FILE, [])
    hits = []
    for item in mem:
        content = item.get("content", "") if isinstance(item, dict) else str(item)
        if not q or q in content.lower(): hits.append({"content":content, "score":1.0, "metadata": item if isinstance(item, dict) else {}})
    return {"results": hits[:20]}
async def memory_index(req: Request):
    body = await req.json()
    mem = read_json(MEMORY_FILE, [])
    item = {"id": str(uuid.uuid4()), "content": body.get("content") or body.get("text") or json.dumps(body, ensure_ascii=False), "created_at": datetime.now().isoformat(timespec="seconds")}
    mem.append(item); write_json(MEMORY_FILE, mem)
    return {"ok": True, "id": item["id"]}
def skills_list():
    return {"skills": read_json(SKILLS_FILE, [])}
async def skills_create(req: Request):
    body = await req.json()
    skills = read_json(SKILLS_FILE, [])
    item = {"id": str(uuid.uuid4()), "name": body.get("name","Skill"), "content": body.get("content", ""), "created_at": datetime.now().isoformat(timespec="seconds")}
    skills.append(item); write_json(SKILLS_FILE, skills)
    return item
def skills_delete(name: str):
    skills = read_json(SKILLS_FILE, [])
    new = [s for s in skills if s.get("name") != name and s.get("id") != name]
    write_json(SKILLS_FILE, new)
    return {"deleted": len(skills)-len(new)}
def skills_reload():
    return {"ok": True, "message":"Skills neu geladen"}


# ── B4 Deep Realization API ─────────────────────────────────────────────────
def api_b4_deep_status():
    return b4_deep_check()
def api_b4_repair_plan_get():
    return b4_repair_plan()
def api_b4_repair_plan_post():
    return b4_repair_plan()
def api_b4_context_pack():
    return b4_context_pack()
def api_b4_agents_matrix():
    return b4_agent_tool_matrix()
def api_b4_knowledge_answer(q: str = "", limit: int = 6, category: str = ""):
    return b4_knowledge_answer(q, limit, category)


def spa_fallback(full_path: str):
    # API Routen werden oben vorher gematcht. Alles andere geht an das Frontend.
    if full_path.startswith(("api/", "v1/", "orchestrate/", "awareness/", "email/", "skills/", "debug/", "notes/", "tasks/", "reminders/", "system/", "windows/", "tools/", "actions/", "documents/", "web/", "work-agent/", "automation/", "briefing/", "folder-watch/", "backup/", "diagnostics/", "security/", "update/", "ui/", "knowledge/", "voice/", "dashboard", "app/", "health", "docs", "openapi.json", "agents/", "audit/", "diagnostic/", "work/")):
        raise HTTPException(404, "Not Found")
    candidate = FRONTEND_DIST / full_path
    if candidate.exists() and candidate.is_file():
        return FileResponse(candidate)
    if FRONTEND_INDEX.exists():
        return FileResponse(FRONTEND_INDEX)
    return {"name":"JARVIS Windows Standalone", "status":"backend online", "frontend":"build fehlt", "hint":"FIRST_SETUP.bat ausfuehren"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=False)


# ══════════════════════════════════════════════════════════════════════════════
# BLOCK 1 — Agent Registry, Tool Registry, Audit Log
# ══════════════════════════════════════════════════════════════════════════════

# ── Agent Registry ────────────────────────────────────────────────────────────
def api_agents_registry():
    return {"agents": agent_registry.get_all()}
def api_agent_get(agent_id: str):
    a = agent_registry.get_agent(agent_id)
    if not a:
        raise HTTPException(404, f"Agent '{agent_id}' nicht gefunden")
    return a
async def api_agent_status_update(agent_id: str, req: Request):
    body = await req.json()
    a = agent_registry.update_status(
        agent_id,
        status=body.get("status", "idle"),
        last_action=body.get("last_action"),
        error=body.get("error", False),
    )
    if not a:
        raise HTTPException(404, f"Agent '{agent_id}' nicht gefunden")
    audit.log_action(
        f"agent_status_update:{body.get('status')}",
        agent=agent_id,
        risk_level="low",
    )
    return a
def api_agents_reset():
    agent_registry.reset_all_status()
    return {"ok": True, "message": "Alle Agenten auf idle gesetzt"}

# ── Tool Registry ─────────────────────────────────────────────────────────────
def api_tools_registry_full():
    return {"tools": tool_registry.get_all()}
def api_tool_get(tool_id: str):
    t = tool_registry.get_tool(tool_id)
    if not t:
        raise HTTPException(404, f"Tool '{tool_id}' nicht gefunden")
    return t
def api_tools_by_category(category: str):
    return {"tools": tool_registry.get_by_category(category)}
async def api_tool_set_enabled(tool_id: str, req: Request):
    body = await req.json()
    enabled = bool(body.get("enabled", True))
    t = tool_registry.set_enabled(tool_id, enabled)
    if not t:
        raise HTTPException(404, f"Tool '{tool_id}' nicht gefunden")
    audit.log_action(
        f"tool_{'enabled' if enabled else 'disabled'}:{tool_id}",
        agent="system",
        tool=tool_id,
        risk_level="low",
    )
    return t

# ── Audit Log ─────────────────────────────────────────────────────────────────
def api_audit_log(
    limit: int = 200,
    agent: str = "",
    risk_level: str = "",
    has_error: str = "",
):
    has_error_bool = None
    if has_error == "true":
        has_error_bool = True
    elif has_error == "false":
        has_error_bool = False
    entries = audit.get_entries(
        limit=min(max(limit, 1), 1000),
        agent=agent or None,
        risk_level=risk_level or None,
        has_error=has_error_bool,
    )
    return {"entries": entries, "count": len(entries)}
def api_audit_stats():
    return audit.get_stats()
async def api_audit_log_write(req: Request):
    body = await req.json()
    entry = audit.log_action(
        action=body.get("action", "manual"),
        agent=body.get("agent", "ui"),
        tool=body.get("tool"),
        risk_level=body.get("risk_level", "low"),
        requires_confirmation=body.get("requires_confirmation", False),
        confirmed=body.get("confirmed"),
        result=body.get("result"),
        error=body.get("error"),
        ui_page=body.get("ui_page"),
        details=body.get("details"),
    )
    return entry



# ══════════════════════════════════════════════════════════════════════════════
# BLOCK 2 — Diagnostic Agent API, Tool Registry erweitert
# ══════════════════════════════════════════════════════════════════════════════

from agents.diagnostic_agent import (
    check_dependencies, deep_check, analyze_log_file, analyze_log_text, check_port
)
def api_diagnostic_deps():
    deps = check_dependencies()
    return {
        "checks": deps,
        "ok": all(d["ok"] for d in deps),
        "failures": [d for d in deps if not d["ok"]],
    }
def api_diagnostic_deep():
    result = deep_check()
    audit.log_action("diagnostic_deep_check", agent="diagnostic", risk_level="low",
                     result=result.get("summary"))
    return result
async def api_diagnostic_analyze_text(req: Request):
    body = await req.json()
    text   = body.get("text", "")
    source = body.get("source", "Nutzer-Input")
    if not text.strip():
        raise HTTPException(400, "text fehlt")
    findings = analyze_log_text(text, source=source)
    return {
        "findings": findings,
        "summary": f"{len(findings)} Befunde" if findings else "Keine Probleme erkannt",
        "critical": sum(1 for f in findings if f["severity"] == "critical"),
        "high":     sum(1 for f in findings if f["severity"] == "high"),
    }
def api_diagnostic_analyze_log(log_name: str):
    safe_name = Path(log_name).name  # Pfad-Traversal verhindern
    log_path  = LOG_DIR / safe_name
    result    = analyze_log_file(log_path)
    return result
def api_diagnostic_ports():
    ports = [8000, 11434, 5173, 3000]
    return {"ports": [check_port(p) for p in ports]}
def api_diagnostic_logs_list():
    if not LOG_DIR.exists():
        return {"logs": []}
    logs = []
    for f in sorted(LOG_DIR.glob("*.log"), key=lambda x: x.stat().st_mtime, reverse=True)[:20]:
        logs.append({
            "name":     f.name,
            "size_kb":  round(f.stat().st_size / 1024, 1),
            "modified": datetime.fromtimestamp(f.stat().st_mtime).isoformat(timespec="seconds"),
        })
    return {"logs": logs}



# ══════════════════════════════════════════════════════════════════════════════
# BLOCK 3 — Work Agent erweitert, Knowledge Index vertieft
# ══════════════════════════════════════════════════════════════════════════════

# ── Work Agent Routen ─────────────────────────────────────────────────────────
def api_work_types():
    return {"types": work_gen.list_types()}
async def api_work_generate(req: Request):
    body = await req.json()
    kind = body.get("kind", "")
    data = body.get("data", {})
    if not kind:
        raise HTTPException(400, "kind fehlt")
    result = work_gen.generate(kind, data)
    if result["ok"]:
        # Audit + Work Log
        audit.log_action(f"work_generate:{kind}", agent="sap", tool="work_generate",
                         risk_level="low", result=result["text"][:80])
        save_work_log(kind, data, result["text"])
    return result
def api_work_example(kind: str):
    examples = {
        "sap_kurztext":        {"leistung": "LED-Umbau Bürobeleuchtung", "ort": "E41 Halle 3", "art": "Instandhaltung"},
        "sap_langtext":        {"leistung": "Austausch Steckdosengehäuse", "ort": "E41", "gebaeude": "Halle 5", "auftrag": "4711", "normen": ["DIN VDE 0100-600"], "pruefung": True},
        "aufwandsangebot":     {"leistung": "Erneuerung Beleuchtungsanlage", "ort": "E41", "normen": ["DIN VDE 0100-600", "DIN VDE 0105-100"], "pruefung": True},
        "lnw":                 {"leistung": "Prüfung ortsveränderlicher Betriebsmittel", "ort": "E41 Werkstatt", "ergebnis": "Alle Geräte bestanden", "normen": ["DGUV V3"]},
        "vde_hinweis":         {"norm": "DIN VDE 0100-600", "kontext": "Erstprüfung nach Umbau"},
        "dguv_hinweis":        {"anlage": "Ortsveränderliche Betriebsmittel", "ort": "E41", "frist": "1 Jahr"},
        "mail":                {"empfaenger": "Team", "inhalt": "Der Auftrag 4711 ist abgeschlossen.", "ton": "locker"},
        "maengeltext":         {"mangel": "Fehlende Abdeckung an Steckdose", "ort": "E41 Büro 12", "schwere": "mittel"},
        "kostenuebersicht":    {"leistung": "LED-Umbau", "stunden": 8, "stundensatz": 85, "material": 320},
        "zeitberechnung":      {"einheit": "Steckdosen", "anzahl": 24, "zeit_pro": 15, "aufschlag": 20},
        "stundensatz":         {"jahresgehalt": 48000, "zuschlaege": 25, "produktiv_h": 1600, "gemeinkosten": 30, "gewinn": 10},
    }
    ex = examples.get(kind)
    if not ex:
        return {"kind": kind, "example": {}, "hint": "Kein Beispiel vorhanden"}
    return {"kind": kind, "example": ex, "preview": work_gen.generate(kind, ex).get("text", "")}

# ── Knowledge Routen ──────────────────────────────────────────────────────────
def api_knowledge_stats():
    return knowledge_mod.get_stats()
def api_knowledge_documents():
    return {"documents": knowledge_mod.list_documents()}
async def api_knowledge_import(req: Request):
    body = await req.json()
    text     = (body.get("text") or "").strip()
    title    = (body.get("title") or "Unbekannt").strip()
    category = body.get("category")
    filename = body.get("filename")
    if not text:
        raise HTTPException(400, "text fehlt")
    result = knowledge_mod.import_text(text, title, category, "manual", filename)
    audit.log_action("knowledge_import", agent="memory", tool="knowledge_import",
                     risk_level="low", result=f"{result.get('chunks')} Chunks: {title}")
    return result
def api_knowledge_search(q: str = "", limit: int = 10, category: str = ""):
    if not q:
        return {"query": "", "results": [], "total": 0}
    result = knowledge_mod.search(q, limit=min(limit, 50), category=category or None)
    # Zusammenfassung anhängen
    result["summary"] = knowledge_mod.summarize_results(result["results"], q)
    return result
def api_knowledge_delete(doc_id: str):
    result = knowledge_mod.delete_document(doc_id)
    audit.log_action(f"knowledge_delete:{doc_id}", agent="memory", risk_level="medium")
    return result
def api_knowledge_rebuild():
    notes      = ensure_list_file(NOTES_FILE)
    file_index = ensure_list_file(FILE_INDEX_FILE)
    work_mem   = read_json(WORK_MEMORY_FILE, {})
    result = knowledge_mod.rebuild_from_notes_and_files(notes, file_index, work_mem)
    audit.log_action("knowledge_rebuild", agent="memory", tool="knowledge_rebuild",
                     risk_level="low", result=f"{result.get('chunks')} Chunks")
    return result
def api_knowledge_categories():
    return {"categories": knowledge_mod.CATEGORIES}

