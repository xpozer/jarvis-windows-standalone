from __future__ import annotations

import webbrowser
from typing import Any
from urllib.parse import urlparse

from services import usejarvis_runtime as rt
from services.actions.filesystem import copy_file, make_dir, write_text_file


def validate_url(url: str) -> tuple[bool, str]:
    clean = (url or "").strip()
    parsed = urlparse(clean)
    if parsed.scheme not in {"http", "https"}:
        return False, "Nur http und https URLs sind erlaubt."
    if not parsed.netloc:
        return False, "URL enthält keinen Host."
    return True, clean


def _finish(action_id: str, result: dict[str, Any]) -> dict[str, Any]:
    rt.mark_action_executed(action_id, result, status="executed" if result.get("ok") else "execution_failed")
    return result


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
            ok, value = validate_url(str(payload.get("url") or ""))
            if not ok:
                return _finish(action_id, {"ok": False, "error": value})
            opened = webbrowser.open(value, new=2, autoraise=True)
            return _finish(action_id, {"ok": bool(opened), "action_type": action_type, "url": value, "opened": bool(opened)})

        if action_type == "filesystem.make_dir":
            return _finish(action_id, make_dir(str(payload.get("path") or "")))

        if action_type == "filesystem.write_text_file":
            return _finish(action_id, write_text_file(str(payload.get("path") or ""), str(payload.get("content") or ""), bool(payload.get("overwrite") or False)))

        if action_type == "filesystem.copy_file":
            return _finish(action_id, copy_file(str(payload.get("source") or ""), str(payload.get("destination") or ""), bool(payload.get("overwrite") or False)))

        return _finish(action_id, {"ok": False, "error": "executor_not_implemented", "action_type": action_type})
    except Exception as exc:
        return _finish(action_id, {"ok": False, "error": "execution_exception", "detail": str(exc), "action_type": action_type})
