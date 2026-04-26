"""
JARVIS Agent Registry
Definiert alle Agenten mit Rolle, Status, verfügbaren Tools und Risiko-Level.
Wird beim Start initialisiert und zur Laufzeit aktualisiert.
"""
from __future__ import annotations
import json
import threading
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

REGISTRY_FILE = Path(__file__).resolve().parent.parent / "data" / "agents.json"
_registry_lock = threading.Lock()

# Statische Agentendefinitionen — Grundwahrheit
AGENT_DEFINITIONS: list[dict] = [
    {
        "id":           "core",
        "name":         "Core Agent",
        "role":         "Versteht Nutzeranfragen, verteilt Aufgaben, entscheidet ob ein Tool gebraucht wird.",
        "icon":         "◈",
        "color":        "#00e5ff",
        "risk_level":   "low",
        "tools":        ["classify_intent", "route_to_agent", "build_messages"],
        "capabilities": ["routing", "intent_detection", "memory_access"],
    },
    {
        "id":           "sap",
        "name":         "Work Agent",
        "role":         "Erstellt SAP-Texte, E-Mails, LNW-Texte, VDE-Hinweise, FSM/CATS-Hinweise, Kosten- und Zeitberechnungen.",
        "icon":         "⬡",
        "color":        "#4ca8e8",
        "risk_level":   "low",
        "tools":        ["sap_offer", "mail_rewrite", "lnw_text", "fsm_cats_notice", "vde_offer_note", "work_template"],
        "capabilities": ["text_generation", "norm_reference", "cost_calculation"],
    },
    {
        "id":           "file",
        "name":         "File Agent",
        "role":         "Liest Dateien, analysiert Logs, erkennt Fehler, extrahiert Inhalte aus TXT, LOG, JSON, CSV, MD, DOCX und PDF.",
        "icon":         "▣",
        "color":        "#e8a04c",
        "risk_level":   "medium",
        "tools":        ["read_file", "analyze_log", "extract_pdf", "search_files", "index_document"],
        "capabilities": ["file_read", "log_analysis", "text_extraction", "error_detection"],
    },
    {
        "id":           "memory",
        "name":         "Memory Agent",
        "role":         "Speichert strukturiertes Wissen, findet relevante Informationen wieder. Unterscheidet Notiz, Arbeitswissen, Person, Projekt, Auftrag, Norm, Datei, Regel.",
        "icon":         "◉",
        "color":        "#c44ce8",
        "risk_level":   "low",
        "tools":        ["add_fact", "search_memory", "add_note", "search_notes", "upsert_work_memory", "search_work_memory"],
        "capabilities": ["memory_read", "memory_write", "knowledge_search"],
    },
    {
        "id":           "windows",
        "name":         "Windows Agent",
        "role":         "Öffnet Programme, Ordner und Webseiten — nur über Allowlist mit klarer Sicherheitslogik.",
        "icon":         "◫",
        "color":        "#4ce8a0",
        "risk_level":   "high",
        "tools":        ["open_app", "open_folder", "open_url"],
        "capabilities": ["app_control", "folder_access", "web_open"],
    },
    {
        "id":           "automation",
        "name":         "Automation Agent",
        "role":         "Verwaltet Wiedervorlagen, Tagesstart, Feierabendbericht, Ordnerüberwachung und geplante Checks.",
        "icon":         "◷",
        "color":        "#e8e84c",
        "risk_level":   "low",
        "tools":        ["add_automation", "list_automations", "due_automations", "build_briefing", "scan_folder_watch"],
        "capabilities": ["scheduling", "briefing", "folder_watch", "reminders"],
    },
    {
        "id":           "diagnostic",
        "name":         "Diagnostic Agent",
        "role":         "Analysiert Fehlerlogs, npm Build-Fehler, Backend-Fehler, Startprobleme, fehlende Ports, Python- und Node-Probleme.",
        "icon":         "◎",
        "color":        "#ff6680",
        "risk_level":   "low",
        "tools":        ["self_check", "analyze_log_file", "check_ports", "check_dependencies", "create_diagnostics_zip"],
        "capabilities": ["log_analysis", "dependency_check", "port_check", "error_classification"],
    },
    {
        "id":           "voice",
        "name":         "Voice Agent",
        "role":         "Verwaltet TTS, Voice Interface, Push-to-Talk, Wake-Word-Vorbereitung und Orb-Status-Events.",
        "icon":         "◐",
        "color":        "#a0e84c",
        "risk_level":   "medium",
        "tools":        ["tts_speak", "voice_settings", "piper_status", "mic_status"],
        "capabilities": ["tts", "voice_input", "orb_control"],
    },
    {
        "id":           "calendar",
        "name":         "Calendar Agent",
        "role":         "Termine, Fristen, Kalenderwochen, Wartungsintervalle, Prüffristen, Lernpläne.",
        "icon":         "◈",
        "color":        "#4ce8a0",
        "risk_level":   "low",
        "tools":        ["add_task", "list_tasks", "add_reminder", "due_automations"],
        "capabilities": ["scheduling", "deadline_tracking", "kw_calculation"],
    },
    {
        "id":           "research",
        "name":         "Research Agent",
        "role":         "Websuche, Normen nachschlagen, technische Fachfragen, IM-Prüfungsstoff.",
        "icon":         "◎",
        "color":        "#e8c44c",
        "risk_level":   "low",
        "tools":        ["web_search_open", "knowledge_search", "vde_snippet"],
        "capabilities": ["web_search", "norm_lookup", "knowledge_retrieval"],
    },
    {
        "id":           "exam",
        "name":         "Exam Agent",
        "role":         "IM-Prüfung: Fragen stellen, Antworten bewerten, Lernkarten, BwHa/MIKP/ZIB/NTG.",
        "icon":         "△",
        "color":        "#4ce8e8",
        "risk_level":   "low",
        "tools":        ["generate_question", "evaluate_answer", "create_flashcard"],
        "capabilities": ["quiz_generation", "answer_evaluation", "flashcard_creation"],
    },
    {
        "id":           "vde",
        "name":         "VDE Agent",
        "role":         "VDE/DGUV-Normen nachschlagen, Prüffristen, Normhierarchie.",
        "icon":         "◐",
        "color":        "#a0e84c",
        "risk_level":   "low",
        "tools":        ["vde_snippet", "knowledge_search"],
        "capabilities": ["norm_lookup", "prueffristen", "norm_hierarchy"],
    },
    {
        "id":           "general",
        "name":         "General Agent",
        "role":         "Gespräch, Analyse, Erklärungen, Berechnungen — alles was kein spezialisierter Agent übernimmt.",
        "icon":         "○",
        "color":        "#6ec4ff",
        "risk_level":   "low",
        "tools":        ["llm_chat"],
        "capabilities": ["conversation", "analysis", "calculation", "explanation"],
    },
]


def _load_registry() -> list[dict]:
    if not REGISTRY_FILE.exists():
        return []
    try:
        content = REGISTRY_FILE.read_text(encoding="utf-8")
        if not content.strip():
            return []
        return json.loads(content)
    except Exception:
        return []


def _save_registry(agents: list[dict]) -> None:
    REGISTRY_FILE.parent.mkdir(parents=True, exist_ok=True)
    tmp = REGISTRY_FILE.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(agents, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(REGISTRY_FILE)


def _init_registry_unlocked() -> list[dict]:
    """Initialisiert Registry aus Definitionen, bewahrt gespeicherten Status."""
    saved = {a["id"]: a for a in _load_registry()}
    agents = []
    for defn in AGENT_DEFINITIONS:
        agent = dict(defn)
        # Status aus gespeicherter Registry übernehmen
        if defn["id"] in saved:
            s = saved[defn["id"]]
            agent["status"]      = s.get("status", "idle")
            agent["last_action"] = s.get("last_action")
            agent["last_ts"]     = s.get("last_ts")
            agent["error_count"] = s.get("error_count", 0)
            agent["call_count"]  = s.get("call_count", 0)
        else:
            agent["status"]      = "idle"
            agent["last_action"] = None
            agent["last_ts"]     = None
            agent["error_count"] = 0
            agent["call_count"]  = 0
        agents.append(agent)
    _save_registry(agents)
    return agents


def init_registry() -> list[dict]:
    with _registry_lock:
        return _init_registry_unlocked()


def get_all() -> list[dict]:
    agents = _load_registry()
    if not agents:
        agents = init_registry()
    return agents


def get_agent(agent_id: str) -> Optional[dict]:
    return next((a for a in get_all() if a["id"] == agent_id), None)


def update_status(
    agent_id: str,
    status: str,
    last_action: Optional[str] = None,
    error: bool = False,
) -> Optional[dict]:
    with _registry_lock:
        agents = _load_registry()
        if not agents:
            agents = _init_registry_unlocked()
        for agent in agents:
            if agent["id"] == agent_id:
                agent["status"] = status
                if last_action:
                    agent["last_action"] = last_action
                    agent["last_ts"] = datetime.now().isoformat(timespec="seconds")
                if error:
                    agent["error_count"] = agent.get("error_count", 0) + 1
                agent["call_count"] = agent.get("call_count", 0) + 1
                _save_registry(agents)
                return agent
        return None


def reset_all_status() -> None:
    """Beim Backend-Start: alle Agenten auf idle setzen."""
    with _registry_lock:
        agents = _load_registry()
        if not agents:
            agents = _init_registry_unlocked()
        for agent in agents:
            if agent.get("status") not in ("idle", "disabled"):
                agent["status"] = "idle"
        _save_registry(agents)
