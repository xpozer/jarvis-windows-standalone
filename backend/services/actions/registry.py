from __future__ import annotations

from typing import Any

from services.actions.common import SAFE_ROOTS


def tool_registry() -> dict[str, Any]:
    tools = [
        {"id": "filesystem.list_dir", "name": "List Directory", "risk": "low", "description": "Listet Dateien und Ordner innerhalb erlaubter lokaler Pfade."},
        {"id": "filesystem.read_file", "name": "Read File", "risk": "low", "description": "Liest Textdateien bis 512 KB innerhalb erlaubter lokaler Pfade."},
        {"id": "git.status", "name": "Git Status", "risk": "low", "description": "Liest Git Status im Repository."},
        {"id": "git.branch", "name": "Git Branch", "risk": "low", "description": "Liest aktuellen Branch und letzte Commits."},
        {"id": "system.info", "name": "System Info", "risk": "low", "description": "Liest OS, Host, Arbeitsverzeichnis und Python Umgebung."},
        {"id": "process.list", "name": "Process List", "risk": "low", "description": "Listet laufende Prozesse über tasklist auf Windows."},
        {"id": "browser.open_url", "name": "Open URL", "risk": "medium", "description": "Bereitet das Öffnen einer URL vor. Nach Freigabe wird sie im Standardbrowser geöffnet."},
        {"id": "terminal.command", "name": "Terminal Command", "risk": "high", "description": "Terminal Befehle werden nur als Freigabeanforderung vorbereitet."},
        {"id": "filesystem.write_file", "name": "Write File", "risk": "high", "description": "Datei schreiben benötigt Freigabe."},
        {"id": "filesystem.delete_file", "name": "Delete File", "risk": "critical", "description": "Datei löschen benötigt immer Freigabe."},
    ]
    return {"ok": True, "level": 1, "tools": tools, "safe_roots": [str(p) for p in SAFE_ROOTS], "authority_gating": "enabled"}
