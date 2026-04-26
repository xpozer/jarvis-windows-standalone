from __future__ import annotations

import os
import platform
import subprocess
import webbrowser
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from config import BASE_DIR, DATA_DIR, UPLOAD_DIR
from services import usejarvis_runtime as rt

SAFE_ROOTS = [BASE_DIR, DATA_DIR, UPLOAD_DIR, Path.home()]
MAX_READ_BYTES = 512_000


def _run(cmd: list[str], cwd: Path | None = None, timeout: int = 8) -> tuple[int, str, str]:
    try:
        proc = subprocess.run(cmd, cwd=str(cwd) if cwd else None, capture_output=True, text=True, timeout=timeout, shell=False)
        return proc.returncode, proc.stdout or "", proc.stderr or ""
    except Exception as exc:
        return 1, "", str(exc)


def _resolve_path(raw: str | None, default: Path | None = None) -> Path:
    if not raw:
        return (default or BASE_DIR).resolve()
    candidate = Path(raw).expanduser()
    if not candidate.is_absolute():
        candidate = (BASE_DIR / candidate).resolve()
    else:
        candidate = candidate.resolve()
    return candidate


def _is_safe_path(path: Path) -> bool:
    try:
        resolved = path.resolve()
        for root in SAFE_ROOTS:
            try:
                resolved.relative_to(root.resolve())
                return True
            except ValueError:
                continue
    except Exception:
        return False
    return False


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


def list_dir(path: str | None = None, limit: int = 80) -> dict[str, Any]:
    target = _resolve_path(path, BASE_DIR)
    if not _is_safe_path(target):
        return {"ok": False, "error": "path_not_allowed", "path": str(target)}
    if not target.exists() or not target.is_dir():
        return {"ok": False, "error": "not_a_directory", "path": str(target)}
    items = []
    for child in sorted(target.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower()))[: max(1, min(500, limit))]:
        try:
            stat = child.stat()
            items.append({"name": child.name, "path": str(child), "type": "dir" if child.is_dir() else "file", "size": stat.st_size, "modified": stat.st_mtime})
        except Exception:
            items.append({"name": child.name, "path": str(child), "type": "unknown"})
    rt.audit("action", "action.filesystem.list_dir", str(target), "low", {"count": len(items)})
    return {"ok": True, "path": str(target), "items": items, "count": len(items)}


def read_file(path: str, max_bytes: int = MAX_READ_BYTES) -> dict[str, Any]:
    target = _resolve_path(path, BASE_DIR)
    if not _is_safe_path(target):
        return {"ok": False, "error": "path_not_allowed", "path": str(target)}
    if not target.exists() or not target.is_file():
        return {"ok": False, "error": "not_a_file", "path": str(target)}
    size = target.stat().st_size
    if size > max(1024, min(MAX_READ_BYTES, int(max_bytes or MAX_READ_BYTES))):
        return {"ok": False, "error": "file_too_large", "path": str(target), "size": size, "max_bytes": max_bytes}
    try:
        content = target.read_text(encoding="utf-8", errors="replace")
    except Exception as exc:
        return {"ok": False, "error": "read_failed", "detail": str(exc), "path": str(target)}
    rt.audit("action", "action.filesystem.read_file", str(target), "low", {"size": size})
    return {"ok": True, "path": str(target), "size": size, "content": content}


def git_status(path: str | None = None) -> dict[str, Any]:
    target = _resolve_path(path, BASE_DIR)
    if target.is_file():
        target = target.parent
    if not _is_safe_path(target):
        return {"ok": False, "error": "path_not_allowed", "path": str(target)}
    code, out, err = _run(["git", "status", "--short", "--branch"], cwd=target, timeout=8)
    rt.audit("action", "action.git.status", str(target), "low", {"returncode": code})
    return {"ok": code == 0, "path": str(target), "returncode": code, "stdout": out, "stderr": err}


def git_branch(path: str | None = None) -> dict[str, Any]:
    target = _resolve_path(path, BASE_DIR)
    if target.is_file():
        target = target.parent
    if not _is_safe_path(target):
        return {"ok": False, "error": "path_not_allowed", "path": str(target)}
    code_branch, branch, err_branch = _run(["git", "branch", "--show-current"], cwd=target, timeout=5)
    code_log, log, err_log = _run(["git", "log", "--oneline", "-5"], cwd=target, timeout=5)
    rt.audit("action", "action.git.branch", str(target), "low", {"returncode": code_branch})
    return {"ok": code_branch == 0, "path": str(target), "branch": branch.strip(), "recent_commits": log.splitlines(), "stderr": err_branch or err_log}


def system_info() -> dict[str, Any]:
    data = {
        "ok": True,
        "platform": platform.platform(),
        "system": platform.system(),
        "release": platform.release(),
        "machine": platform.machine(),
        "node": platform.node(),
        "python": platform.python_version(),
        "cwd": os.getcwd(),
        "base_dir": str(BASE_DIR),
        "data_dir": str(DATA_DIR),
    }
    rt.audit("action", "action.system.info", "System Info gelesen", "low", {})
    return data


def process_list(limit: int = 50) -> dict[str, Any]:
    if platform.system().lower() != "windows":
        return {"ok": False, "error": "windows_only_first", "processes": []}
    code, out, err = _run(["tasklist", "/FO", "CSV", "/NH"], timeout=6)
    processes = []
    if code == 0:
        for line in out.splitlines()[: max(1, min(200, limit))]:
            parts = [p.strip('"') for p in line.strip().split('","')]
            if len(parts) >= 2:
                processes.append({"image": parts[0], "pid": parts[1], "session": parts[2] if len(parts) > 2 else None, "memory": parts[-1]})
    rt.audit("action", "action.process.list", "Prozessliste gelesen", "low", {"count": len(processes)})
    return {"ok": code == 0, "returncode": code, "processes": processes, "stderr": err}


def prepare_action(action_type: str, summary: str, payload: dict[str, Any] | None = None, risk: str | None = None) -> dict[str, Any]:
    action = rt.create_action_request(action_type=action_type, summary=summary, payload=payload or {}, risk=risk)
    return {"ok": True, "approval_required": action.get("status") == "pending_approval", "action": action}


def _validate_url(url: str) -> tuple[bool, str]:
    clean = (url or "").strip()
    parsed = urlparse(clean)
    if parsed.scheme not in {"http", "https"}:
        return False, "Nur http und https URLs sind erlaubt."
    if not parsed.netloc:
        return False, "URL enthält keinen Host."
    return True, clean


def execute_approved_action(action_id: str) -> dict[str, Any]:
    action = rt.get_action_request(action_id)
    if not action:
        return {"ok": False, "error": "not_found"}
    if action.get("status") != "approved":
        return {"ok": False, "error": "not_approved", "status": action.get("status")}

    action_type = str(action.get("action_type") or "")
    payload = action.get("payload") if isinstance(action.get("payload"), dict) else {}

    try:
        if action_type == "browser.open_url":
            ok, value = _validate_url(str(payload.get("url") or ""))
            if not ok:
                result = {"ok": False, "error": value}
                rt.mark_action_executed(action_id, result, status="execution_failed")
                return result
            opened = webbrowser.open(value, new=2, autoraise=True)
            result = {"ok": bool(opened), "action_type": action_type, "url": value, "opened": bool(opened)}
            rt.mark_action_executed(action_id, result, status="executed" if opened else "execution_failed")
            return result

        result = {"ok": False, "error": "executor_not_implemented", "action_type": action_type}
        rt.mark_action_executed(action_id, result, status="execution_failed")
        return result
    except Exception as exc:
        result = {"ok": False, "error": "execution_exception", "detail": str(exc), "action_type": action_type}
        rt.mark_action_executed(action_id, result, status="execution_failed")
        return result


def run_tool(tool_id: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
    payload = payload or {}
    if tool_id == "filesystem.list_dir":
        return list_dir(payload.get("path"), int(payload.get("limit") or 80))
    if tool_id == "filesystem.read_file":
        return read_file(str(payload.get("path") or ""), int(payload.get("max_bytes") or MAX_READ_BYTES))
    if tool_id == "git.status":
        return git_status(payload.get("path"))
    if tool_id == "git.branch":
        return git_branch(payload.get("path"))
    if tool_id == "system.info":
        return system_info()
    if tool_id == "process.list":
        return process_list(int(payload.get("limit") or 50))
    if tool_id == "browser.open_url":
        return prepare_action("browser.open_url", f"URL öffnen: {payload.get('url')}", payload, "medium")
    if tool_id == "terminal.command":
        return prepare_action("terminal.command", str(payload.get("command") or "Terminal Befehl ausführen"), payload, "high")
    if tool_id == "filesystem.write_file":
        return prepare_action("filesystem.write_file", f"Datei schreiben: {payload.get('path')}", payload, "high")
    if tool_id == "filesystem.delete_file":
        return prepare_action("filesystem.delete_file", f"Datei löschen: {payload.get('path')}", payload, "critical")
    return {"ok": False, "error": "unknown_tool", "tool_id": tool_id}
