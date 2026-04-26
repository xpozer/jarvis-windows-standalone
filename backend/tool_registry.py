"""
JARVIS Tool Registry
Jedes Tool hat id, name, description, category, risk_level,
requires_confirmation, input_schema, output_schema, enabled, last_used, error_count.
"""
from __future__ import annotations
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional, Any

TOOLS_FILE = Path(__file__).resolve().parent.parent / "data" / "tools.json"

TOOL_DEFINITIONS: list[dict] = [
    # ── Datei-Tools ──────────────────────────────────────────────────
    {
        "id": "file_search",
        "name": "Datei suchen",
        "description": "Sucht nach Dateien im erlaubten Verzeichnis anhand Name oder Typ.",
        "category": "file",
        "risk_level": "low",
        "requires_confirmation": False,
        "input_schema":  {"query": "str", "limit": "int"},
        "output_schema": {"files": "list[dict]"},
        "enabled": True,
    },
    {
        "id": "file_analyze",
        "name": "Datei analysieren",
        "description": "Liest und analysiert eine Datei (TXT, LOG, JSON, CSV, MD, DOCX, PDF).",
        "category": "file",
        "risk_level": "low",
        "requires_confirmation": False,
        "input_schema":  {"filepath": "str"},
        "output_schema": {"content": "str", "summary": "str", "findings": "list"},
        "enabled": True,
    },
    {
        "id": "text_file_write",
        "name": "Textdatei schreiben",
        "description": "Schreibt Inhalt in eine Textdatei im erlaubten Ausgabeordner.",
        "category": "file",
        "risk_level": "high",
        "requires_confirmation": True,
        "input_schema":  {"filename": "str", "content": "str"},
        "output_schema": {"path": "str", "ok": "bool"},
        "enabled": True,
    },
    # ── Windows-Tools ────────────────────────────────────────────────
    {
        "id": "open_folder",
        "name": "Ordner öffnen",
        "description": "Öffnet einen Ordner im Explorer — nur Ordner aus der Allowlist.",
        "category": "windows",
        "risk_level": "medium",
        "requires_confirmation": False,
        "input_schema":  {"name": "str"},
        "output_schema": {"opened": "str", "ok": "bool"},
        "enabled": True,
    },
    {
        "id": "open_app",
        "name": "App öffnen",
        "description": "Öffnet ein Programm — nur Apps aus der Allowlist.",
        "category": "windows",
        "risk_level": "medium",
        "requires_confirmation": False,
        "input_schema":  {"name": "str"},
        "output_schema": {"app": "str", "ok": "bool"},
        "enabled": True,
    },
    {
        "id": "web_search_open",
        "name": "Websuche öffnen",
        "description": "Öffnet eine Websuche im Browser.",
        "category": "windows",
        "risk_level": "low",
        "requires_confirmation": False,
        "input_schema":  {"query": "str"},
        "output_schema": {"url": "str"},
        "enabled": True,
    },
    # ── System-Tools ─────────────────────────────────────────────────
    {
        "id": "backup_create",
        "name": "Backup erstellen",
        "description": "Erstellt ein Backup aller data/ und logs/ Dateien.",
        "category": "system",
        "risk_level": "low",
        "requires_confirmation": False,
        "input_schema":  {"label": "str"},
        "output_schema": {"path": "str", "size": "int"},
        "enabled": True,
    },
    {
        "id": "diagnostics_zip",
        "name": "Diagnose ZIP erstellen",
        "description": "Erstellt ein ZIP mit allen Logs und Diagnosedaten.",
        "category": "system",
        "risk_level": "low",
        "requires_confirmation": False,
        "input_schema":  {},
        "output_schema": {"path": "str"},
        "enabled": True,
    },
    {
        "id": "knowledge_rebuild",
        "name": "Wissensindex neu aufbauen",
        "description": "Liest alle indexierten Dokumente und baut den Suchindex neu.",
        "category": "knowledge",
        "risk_level": "low",
        "requires_confirmation": False,
        "input_schema":  {},
        "output_schema": {"chunks": "int", "files": "int"},
        "enabled": True,
    },
    {
        "id": "knowledge_search",
        "name": "Lokale Wissenssuche",
        "description": "Sucht im lokalen Wissensindex nach relevanten Chunks.",
        "category": "knowledge",
        "risk_level": "low",
        "requires_confirmation": False,
        "input_schema":  {"query": "str", "limit": "int"},
        "output_schema": {"results": "list[dict]"},
        "enabled": True,
    },
    # ── Work-Tools ───────────────────────────────────────────────────
    {
        "id": "sap_text_generate",
        "name": "SAP Text erzeugen",
        "description": "Erzeugt SAP Kurztext oder Langtext für Auftrag oder Angebot.",
        "category": "work",
        "risk_level": "low",
        "requires_confirmation": False,
        "input_schema":  {"kind": "str", "data": "dict"},
        "output_schema": {"text": "str"},
        "enabled": True,
    },
    {
        "id": "mail_text_generate",
        "name": "Mail Text erzeugen",
        "description": "Erzeugt einen E-Mail-Text (locker, klar, Kunde, intern).",
        "category": "work",
        "risk_level": "low",
        "requires_confirmation": False,
        "input_schema":  {"kind": "str", "data": "dict"},
        "output_schema": {"text": "str"},
        "enabled": True,
    },
    {
        "id": "lnw_text_generate",
        "name": "LNW Text erzeugen",
        "description": "Erzeugt einen Leistungsnachweis-Text.",
        "category": "work",
        "risk_level": "low",
        "requires_confirmation": False,
        "input_schema":  {"data": "dict"},
        "output_schema": {"text": "str"},
        "enabled": True,
    },
    {
        "id": "fsm_cats_generate",
        "name": "FSM/CATS Hinweis erzeugen",
        "description": "Erzeugt einen FSM-Buchungshinweis oder CATS-Warnhinweis.",
        "category": "work",
        "risk_level": "low",
        "requires_confirmation": False,
        "input_schema":  {"kind": "str", "data": "dict"},
        "output_schema": {"text": "str"},
        "enabled": True,
    },
    {
        "id": "vde_hint_generate",
        "name": "VDE Hinweis erzeugen",
        "description": "Erzeugt einen VDE/DGUV-Hinweis für SAP oder Dokumente.",
        "category": "work",
        "risk_level": "low",
        "requires_confirmation": False,
        "input_schema":  {"norm": "str", "context": "str"},
        "output_schema": {"text": "str"},
        "enabled": True,
    },
    # ── Briefing-Tools ───────────────────────────────────────────────
    {
        "id": "briefing_tagesstart",
        "name": "Tagesstart Briefing erzeugen",
        "description": "Erstellt das Tagesstart-Briefing mit offenen Aufgaben und Wiedervorlagen.",
        "category": "automation",
        "risk_level": "low",
        "requires_confirmation": False,
        "input_schema":  {},
        "output_schema": {"briefing": "str"},
        "enabled": True,
    },
    {
        "id": "briefing_feierabend",
        "name": "Feierabendbericht erzeugen",
        "description": "Erstellt den Feierabendbericht mit erledigten Aufgaben und offenen Punkten.",
        "category": "automation",
        "risk_level": "low",
        "requires_confirmation": False,
        "input_schema":  {},
        "output_schema": {"report": "str"},
        "enabled": True,
    },
    # ── Voice-Tools ──────────────────────────────────────────────────
    {
        "id": "voice_test_speak",
        "name": "Voice Test sprechen",
        "description": "Lässt JARVIS einen Testtext sprechen um TTS zu prüfen.",
        "category": "voice",
        "risk_level": "low",
        "requires_confirmation": False,
        "input_schema":  {"text": "str"},
        "output_schema": {"ok": "bool"},
        "enabled": True,
    },
    {
        "id": "mic_status_check",
        "name": "Mikrofon Status prüfen",
        "description": "Prüft ob das Mikrofon verfügbar und aktiviert ist.",
        "category": "voice",
        "risk_level": "low",
        "requires_confirmation": False,
        "input_schema":  {},
        "output_schema": {"available": "bool", "enabled": "bool"},
        "enabled": True,
    },
]


def _load() -> list[dict]:
    if not TOOLS_FILE.exists():
        return []
    try:
        content = TOOLS_FILE.read_text(encoding="utf-8")
        if not content.strip():
            return []
        return json.loads(content)
    except Exception:
        return []


def _save(tools: list[dict]) -> None:
    TOOLS_FILE.parent.mkdir(parents=True, exist_ok=True)
    tmp = TOOLS_FILE.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(tools, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(TOOLS_FILE)


def init_tools() -> list[dict]:
    """Initialisiert Tool-Registry aus Definitionen, bewahrt gespeicherten Status."""
    saved = {t["id"]: t for t in _load()}
    tools = []
    for defn in TOOL_DEFINITIONS:
        tool = dict(defn)
        if defn["id"] in saved:
            s = saved[defn["id"]]
            tool["enabled"]    = s.get("enabled", True)
            tool["last_used"]  = s.get("last_used")
            tool["error_count"] = s.get("error_count", 0)
            tool["call_count"] = s.get("call_count", 0)
        else:
            tool["last_used"]   = None
            tool["error_count"] = 0
            tool["call_count"]  = 0
        tools.append(tool)
    _save(tools)
    return tools


def get_all() -> list[dict]:
    tools = _load()
    if not tools:
        tools = init_tools()
    return tools


def get_tool(tool_id: str) -> Optional[dict]:
    return next((t for t in get_all() if t["id"] == tool_id), None)


def record_use(tool_id: str, error: bool = False) -> Optional[dict]:
    tools = get_all()
    for tool in tools:
        if tool["id"] == tool_id:
            tool["last_used"] = datetime.now().isoformat(timespec="seconds")
            tool["call_count"] = tool.get("call_count", 0) + 1
            if error:
                tool["error_count"] = tool.get("error_count", 0) + 1
            _save(tools)
            return tool
    return None


def set_enabled(tool_id: str, enabled: bool) -> Optional[dict]:
    tools = get_all()
    for tool in tools:
        if tool["id"] == tool_id:
            tool["enabled"] = enabled
            _save(tools)
            return tool
    return None


def get_by_category(category: str) -> list[dict]:
    return [t for t in get_all() if t.get("category") == category]


def get_requiring_confirmation() -> list[dict]:
    return [t for t in get_all() if t.get("requires_confirmation") and t.get("enabled")]
