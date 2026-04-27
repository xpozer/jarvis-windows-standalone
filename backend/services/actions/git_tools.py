from __future__ import annotations

from typing import Any

from config import BASE_DIR
from services import usejarvis_runtime as rt
from services.actions.common import is_safe_path, resolve_path, run_process


def git_status(path: str | None = None) -> dict[str, Any]:
    target = resolve_path(path, BASE_DIR)
    if target.is_file():
        target = target.parent
    if not is_safe_path(target):
        return {"ok": False, "error": "path_not_allowed", "path": str(target)}
    code, out, err = run_process(["git", "status", "--short", "--branch"], cwd=target, timeout=8)
    rt.audit("action", "action.git.status", str(target), "low", {"returncode": code})
    return {"ok": code == 0, "path": str(target), "returncode": code, "stdout": out, "stderr": err}


def git_branch(path: str | None = None) -> dict[str, Any]:
    target = resolve_path(path, BASE_DIR)
    if target.is_file():
        target = target.parent
    if not is_safe_path(target):
        return {"ok": False, "error": "path_not_allowed", "path": str(target)}
    code_branch, branch, err_branch = run_process(["git", "branch", "--show-current"], cwd=target, timeout=5)
    _, log, err_log = run_process(["git", "log", "--oneline", "-5"], cwd=target, timeout=5)
    rt.audit("action", "action.git.branch", str(target), "low", {"returncode": code_branch})
    return {"ok": code_branch == 0, "path": str(target), "branch": branch.strip(), "recent_commits": log.splitlines(), "stderr": err_branch or err_log}
