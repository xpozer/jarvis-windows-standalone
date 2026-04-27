from __future__ import annotations

from typing import Any

from services import usejarvis_runtime as rt
from services.actions.common import MAX_READ_BYTES
from services.actions.filesystem import list_dir, read_file
from services.actions.git_tools import git_branch, git_status
from services.actions.system_tools import process_list, system_info


def prepare_action(action_type: str, summary: str, payload: dict[str, Any] | None = None, risk: str | None = None) -> dict[str, Any]:
    action = rt.create_action_request(action_type=action_type, summary=summary, payload=payload or {}, risk=risk)
    return {"ok": True, "approval_required": action.get("status") == "pending_approval", "action": action}


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
    if tool_id == "filesystem.make_dir":
        return prepare_action("filesystem.make_dir", f"Ordner erstellen: {payload.get('path')}", payload, "high")
    if tool_id == "filesystem.write_text_file":
        return prepare_action("filesystem.write_text_file", f"Textdatei schreiben: {payload.get('path')}", payload, "high")
    if tool_id == "filesystem.copy_file":
        return prepare_action("filesystem.copy_file", f"Datei kopieren: {payload.get('source')} -> {payload.get('destination')}", payload, "high")
    if tool_id == "terminal.command":
        return prepare_action("terminal.command", str(payload.get("command") or "Terminal Befehl ausführen"), payload, "high")
    if tool_id == "filesystem.write_file":
        return prepare_action("filesystem.write_file", f"Datei schreiben: {payload.get('path')}", payload, "high")
    if tool_id == "filesystem.delete_file":
        return prepare_action("filesystem.delete_file", f"Datei löschen: {payload.get('path')}", payload, "critical")
    return {"ok": False, "error": "unknown_tool", "tool_id": tool_id}
