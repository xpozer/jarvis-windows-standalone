from __future__ import annotations

import json
import subprocess
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

from config import BASE_DIR, DEFAULT_MODEL, FRONTEND_DIR, JARVIS_PROVIDER, OLLAMA_BASE
from utils import log


@dataclass(frozen=True)
class CommandResult:
    ok: bool
    stdout: str
    stderr: str
    returncode: int


def _now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def _run_command(args: list[str], cwd: Path | None = None, timeout: int = 8) -> CommandResult:
    try:
        completed = subprocess.run(
            args,
            cwd=str(cwd or BASE_DIR),
            capture_output=True,
            text=True,
            timeout=timeout,
            shell=False,
        )
        return CommandResult(
            completed.returncode == 0,
            (completed.stdout or "").strip(),
            (completed.stderr or "").strip(),
            completed.returncode,
        )
    except FileNotFoundError as exc:
        return CommandResult(False, "", f"{args[0]} nicht gefunden: {exc}", 127)
    except subprocess.TimeoutExpired as exc:
        return CommandResult(False, exc.stdout or "", f"Timeout nach {timeout}s", 124)
    except Exception as exc:
        return CommandResult(False, "", str(exc), 1)


def _component(
    component_id: str,
    name: str,
    *,
    status: str,
    current: str = "",
    latest: str = "",
    update_available: bool = False,
    details: dict[str, Any] | None = None,
    actions: list[dict[str, Any]] | None = None,
) -> dict[str, Any]:
    return {
        "id": component_id,
        "name": name,
        "status": status,
        "current": current,
        "latest": latest,
        "update_available": update_available,
        "safe_to_check": True,
        "requires_confirmation": True,
        "details": details or {},
        "actions": actions or [],
    }


def _action(action_id: str, label: str, command: str, *, risk: str = "medium") -> dict[str, Any]:
    return {
        "id": action_id,
        "label": label,
        "risk": risk,
        "requires_confirmation": True,
        "auto_execute": False,
        "command": command,
    }


def _git_component(logs: list[str]) -> dict[str, Any]:
    branch = _run_command(["git", "rev-parse", "--abbrev-ref", "HEAD"])
    commit = _run_command(["git", "rev-parse", "--short", "HEAD"])
    full_commit = _run_command(["git", "rev-parse", "HEAD"])
    remote = _run_command(["git", "remote", "get-url", "origin"])
    dirty = _run_command(["git", "status", "--porcelain"])

    latest = ""
    update_available = False
    remote_error = ""
    if branch.ok and remote.ok:
        remote_head = _run_command(["git", "ls-remote", "origin", f"refs/heads/{branch.stdout}"], timeout=12)
        if remote_head.ok and remote_head.stdout:
            latest = remote_head.stdout.split()[0][:7]
            update_available = bool(full_commit.ok and latest and not full_commit.stdout.startswith(latest))
        else:
            remote_error = remote_head.stderr or remote_head.stdout
            logs.append("GitHub Remote konnte nicht vollstaendig geprueft werden.")

    has_local_changes = bool(dirty.ok and dirty.stdout)
    state = "warn" if update_available or has_local_changes else "ok"
    if not branch.ok or not commit.ok:
        state = "unknown"

    return _component(
        "jarvis_core",
        "JARVIS Core",
        status=state,
        current=commit.stdout if commit.ok else "",
        latest=latest,
        update_available=update_available,
        details={
            "branch": branch.stdout if branch.ok else "",
            "remote": remote.stdout if remote.ok else "",
            "local_changes": has_local_changes,
            "remote_error": remote_error,
        },
        actions=[
            _action("jarvis_core_pull", "Projekt aktualisieren", "git pull"),
            _action("jarvis_core_setup", "Setup erneut ausfuehren", ".\\FIRST_SETUP.bat"),
        ],
    )


def _python_component() -> dict[str, Any]:
    version = _run_command(["python", "--version"])
    pip = _run_command(["python", "-m", "pip", "--version"])
    pyproject = BASE_DIR / "pyproject.toml"
    return _component(
        "python_backend",
        "Python Backend",
        status="ok" if version.ok and pip.ok and pyproject.exists() else "warn",
        current=version.stdout or sys.version.split()[0],
        details={
            "pip": pip.stdout if pip.ok else pip.stderr,
            "pyproject": str(pyproject),
            "venv": str(Path(sys.prefix)),
        },
        actions=[
            _action("python_setup", "Python Abhaengigkeiten aktualisieren", ".\\FIRST_SETUP.bat", risk="medium"),
        ],
    )


def _read_package_json() -> dict[str, Any]:
    package_file = FRONTEND_DIR / "package.json"
    try:
        return json.loads(package_file.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _frontend_component() -> dict[str, Any]:
    node = _run_command(["node", "--version"], cwd=FRONTEND_DIR)
    npm = _run_command(["npm", "--version"], cwd=FRONTEND_DIR)
    pkg = _read_package_json()
    deps = len(pkg.get("dependencies") or {}) + len(pkg.get("devDependencies") or {})
    return _component(
        "frontend",
        "Frontend",
        status="ok" if node.ok and npm.ok and pkg else "warn",
        current=str(pkg.get("version") or ""),
        details={
            "node": node.stdout if node.ok else node.stderr,
            "npm": npm.stdout if npm.ok else npm.stderr,
            "dependencies": deps,
            "package": str(FRONTEND_DIR / "package.json"),
        },
        actions=[
            _action("frontend_install", "Frontend Abhaengigkeiten aktualisieren", "cd frontend && npm install", risk="medium"),
            _action("frontend_build", "Frontend neu bauen", "cd frontend && npm run build", risk="low"),
        ],
    )


def _ollama_tags() -> dict[str, Any]:
    url = OLLAMA_BASE.rstrip("/") + "/api/tags"
    req = urllib.request.Request(url, headers={"User-Agent": "JARVIS-Update-Center"})
    try:
        with urllib.request.urlopen(req, timeout=4) as resp:
            data = json.loads(resp.read().decode("utf-8", errors="replace"))
        return {"ok": True, "models": data.get("models") if isinstance(data, dict) else []}
    except urllib.error.URLError as exc:
        return {"ok": False, "models": [], "error": str(exc.reason)}
    except Exception as exc:
        return {"ok": False, "models": [], "error": str(exc)}


def _ollama_components() -> tuple[dict[str, Any], dict[str, Any]]:
    version = _run_command(["ollama", "--version"])
    tags = _ollama_tags()
    model_names = [str(item.get("name") or item.get("model") or "") for item in tags.get("models", []) if isinstance(item, dict)]
    model_present = DEFAULT_MODEL in model_names

    ollama = _component(
        "ollama",
        "Ollama Runtime",
        status="ok" if version.ok and tags.get("ok") else "warn",
        current=version.stdout,
        details={
            "base_url": OLLAMA_BASE,
            "provider": JARVIS_PROVIDER,
            "api_ok": bool(tags.get("ok")),
            "error": tags.get("error", ""),
        },
        actions=[
            _action("ollama_update", "Ollama manuell aktualisieren", "winget upgrade Ollama.Ollama", risk="high"),
        ],
    )
    model = _component(
        "ollama_model",
        f"Modell {DEFAULT_MODEL}",
        status="ok" if model_present else "warn",
        current=DEFAULT_MODEL if model_present else "",
        latest=DEFAULT_MODEL,
        update_available=not model_present,
        details={"installed_models": model_names[:20]},
        actions=[
            _action("ollama_pull_model", "Modell installieren/aktualisieren", f"ollama pull {DEFAULT_MODEL}", risk="medium"),
        ],
    )
    return ollama, model


def _runtime_component() -> dict[str, Any]:
    checks = {
        "git": _run_command(["git", "--version"]),
        "python": _run_command(["python", "--version"]),
        "node": _run_command(["node", "--version"]),
        "npm": _run_command(["npm", "--version"]),
        "ollama": _run_command(["ollama", "--version"]),
    }
    missing = [name for name, result in checks.items() if not result.ok]
    return _component(
        "windows_runtime",
        "Windows Runtime",
        status="warn" if missing else "ok",
        current="Windows",
        details={name: result.stdout if result.ok else result.stderr for name, result in checks.items()},
        actions=[
            _action("runtime_repair", "Runtime reparieren", ".\\REPAIR.bat", risk="high"),
        ],
    )


def status(refresh: bool = False) -> dict[str, Any]:
    logs: list[str] = []
    components: dict[str, dict[str, Any]] = {}
    for component in [
        _git_component(logs),
        _python_component(),
        _frontend_component(),
        *_ollama_components(),
        _runtime_component(),
    ]:
        components[component["id"]] = component

    summary = {"ok": 0, "warn": 0, "error": 0, "unknown": 0, "total": len(components)}
    for item in components.values():
        state = str(item.get("status") or "unknown")
        summary[state if state in summary else "unknown"] += 1

    payload = {
        "ok": summary["error"] == 0,
        "checked_at": _now_iso(),
        "refresh": refresh,
        "auto_apply": False,
        "policy": "Automatisch wird nur geprueft. Updates werden erst nach klarer Bestaetigung ausgefuehrt.",
        "summary": summary,
        "components": components,
        "logs": logs,
    }
    log("INFO", "Update Center Status geprueft", summary=summary)
    return payload


def plan() -> dict[str, Any]:
    current = status(refresh=False)
    actions: list[dict[str, Any]] = []
    for component in current["components"].values():
        actions.extend(component.get("actions") or [])
    return {
        "ok": True,
        "auto_apply": False,
        "requires_confirmation": True,
        "message": "Update Aktionen sind vorbereitet, werden aber nicht blind ausgefuehrt.",
        "actions": actions,
    }
