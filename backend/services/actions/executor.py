from __future__ import annotations

import webbrowser
from typing import Any
from urllib.parse import urlparse

from services import usejarvis_runtime as rt


def validate_url(url: str) -> tuple[bool, str]:
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
            ok, value = validate_url(str(payload.get("url") or ""))
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
