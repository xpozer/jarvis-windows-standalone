from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
LOG_DIR = BASE_DIR / "logs"
DATA_DIR = BASE_DIR / "data"
LOG_DIR.mkdir(exist_ok=True)
DATA_DIR.mkdir(exist_ok=True)


def _load_env_file() -> None:
    env_file = BASE_DIR / ".env"
    if not env_file.exists():
        return
    for raw_line in env_file.read_text(encoding="utf-8", errors="replace").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = value


_load_env_file()

LOG_FILE = LOG_DIR / "backend.log"
START_LOG = LOG_DIR / "startup.log"
BACKEND_PID_FILE = LOG_DIR / "backend.pid"
FRONTEND_PID_FILE = LOG_DIR / "frontend.pid"

AGENTS_FILE = DATA_DIR / "managed_agents.json"
MEMORY_FILE = DATA_DIR / "memory.json"
SKILLS_FILE = DATA_DIR / "skills.json"
NOTES_FILE = DATA_DIR / "notes.json"
TASKS_FILE = DATA_DIR / "tasks.json"
REMINDERS_FILE = DATA_DIR / "reminders.json"
WORK_MEMORY_FILE = DATA_DIR / "work_memory.json"
FILE_INDEX_FILE = DATA_DIR / "file_index.json"
AGENT_STATUS_FILE = DATA_DIR / "agent_status.json"
TOOL_REGISTRY_FILE = DATA_DIR / "tool_registry.json"
ACTIONS_FILE = DATA_DIR / "pending_actions.json"
DOC_INDEX_FILE = DATA_DIR / "doc_index.json"
WEB_SEARCH_FILE = DATA_DIR / "web_searches.json"
WORK_TEMPLATES_FILE = DATA_DIR / "work_templates.json"
WORK_LOG_FILE = DATA_DIR / "work_log.json"
AUTOMATIONS_FILE = DATA_DIR / "automations.json"
FOLDER_WATCH_FILE = DATA_DIR / "folder_watch.json"
FOLDER_WATCH_STATE_FILE = DATA_DIR / "folder_watch_state.json"
BRIEFING_FILE = DATA_DIR / "briefing_history.json"
SETTINGS_FILE = DATA_DIR / "settings.json"
PERMISSIONS_FILE = DATA_DIR / "permissions.json"
KNOWLEDGE_INDEX_FILE = DATA_DIR / "knowledge_index.json"
UPDATE_STATE_FILE = DATA_DIR / "update_state.json"
VOICE_SETTINGS_FILE = DATA_DIR / "voice_settings.json"
VOICE_PRESETS_FILE = DATA_DIR / "voice_presets.json"
VOICE_RUNTIME_FILE = DATA_DIR / "voice_runtime.json"
DASHBOARD_STATE_FILE = DATA_DIR / "dashboard_state.json"
AUDIT_LOG_FILE = DATA_DIR / "audit_log.json"
AGENT_REGISTRY_FILE = DATA_DIR / "agents.json"
FILES_FILE = DATA_DIR / "files.json"
DIAGNOSTICS_FILE = DATA_DIR / "diagnostics.json"
DEEP_REPORT_FILE = DATA_DIR / "deep_system_report.json"
REPAIR_PLAN_FILE = DATA_DIR / "repair_plan.json"

BACKUP_DIR = BASE_DIR / "backups"
DIAG_DIR = BASE_DIR / "diagnostics"
CONTEXT_PACK_DIR = BASE_DIR / "context_packs"
CORRUPT_BACKUP_DIR = DATA_DIR / "corrupt_backups"
PIPER_DIR = BASE_DIR / "piper"
PIPER_VOICES_DIR = PIPER_DIR / "voices"
PIPER_OUT_DIR = DATA_DIR / "voice_output"

for _dir in (BACKUP_DIR, DIAG_DIR, CONTEXT_PACK_DIR, CORRUPT_BACKUP_DIR, PIPER_OUT_DIR):
    _dir.mkdir(exist_ok=True)

FRONTEND_DIR = BASE_DIR / "frontend"
FRONTEND_DIST = FRONTEND_DIR / "dist"
FRONTEND_INDEX = FRONTEND_DIST / "index.html"
FRONTEND_ASSETS = FRONTEND_DIST / "assets"
FRONTEND_DIAG = FRONTEND_DIR / "diagnose.html"

OLLAMA_BASE = os.environ.get("JARVIS_OLLAMA_BASE", "http://127.0.0.1:11434")
OLLAMA_OPENAI = OLLAMA_BASE.rstrip("/") + "/v1/chat/completions"
DEFAULT_MODEL = os.environ.get("JARVIS_MODEL", "qwen3:8b")
JARVIS_PROVIDER = os.environ.get("JARVIS_PROVIDER", "ollama").strip().lower() or "ollama"
JARVIS_FALLBACK = [
    item.strip().lower()
    for item in os.environ.get("JARVIS_FALLBACK", "").split(",")
    if item.strip()
]

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY") or None
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY") or None
GROQ_API_KEY = os.environ.get("GROQ_API_KEY") or None
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY") or None
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY") or None

PROVIDER_CONFIG: dict[str, dict[str, str | None]] = {
    "ollama": {
        "base_url": OLLAMA_OPENAI,
        "api_key": None,
        "auth_header": "none",
    },
    "anthropic": {
        "base_url": "https://api.anthropic.com/v1/messages",
        "api_key": ANTHROPIC_API_KEY,
        "auth_header": "x-api-key",
    },
    "openai": {
        "base_url": "https://api.openai.com/v1/chat/completions",
        "api_key": OPENAI_API_KEY,
        "auth_header": "bearer",
    },
    "groq": {
        "base_url": "https://api.groq.com/openai/v1/chat/completions",
        "api_key": GROQ_API_KEY,
        "auth_header": "bearer",
    },
    "gemini": {
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
        "api_key": GEMINI_API_KEY,
        "auth_header": "bearer",
    },
    "openrouter": {
        "base_url": "https://openrouter.ai/api/v1/chat/completions",
        "api_key": OPENROUTER_API_KEY,
        "auth_header": "bearer",
    },
}

# B5 Productization
APP_VERSION = "B6.5.1"
EXPORT_DIR = BASE_DIR / "exports"
UPDATE_DIR = BASE_DIR / "updates"
UPDATE_STAGING_DIR = UPDATE_DIR / "staging"
UPDATE_MANIFEST_FILE = DATA_DIR / "update_manifest.json"
UPDATE_PLAN_FILE = DATA_DIR / "update_plan.json"
INSTALL_STATE_FILE = DATA_DIR / "install_state.json"

for _dir in (EXPORT_DIR, UPDATE_DIR, UPDATE_STAGING_DIR):
    _dir.mkdir(exist_ok=True)
