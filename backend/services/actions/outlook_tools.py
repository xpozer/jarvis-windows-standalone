from __future__ import annotations

import json
import os
import urllib.request
from datetime import datetime
from typing import Any

GRAPH_BASE = "https://graph.microsoft.com/v1.0"


def _token() -> str | None:
    return os.environ.get("JARVIS_OUTLOOK_TOKEN") or os.environ.get("JARVIS_OUTLOOK_CALENDAR_TOKEN")


def outlook_status() -> dict[str, Any]:
    return {
        "ok": True,
        "provider": "outlook",
        "connected": bool(_token()),
        "token_env": "JARVIS_OUTLOOK_TOKEN or JARVIS_OUTLOOK_CALENDAR_TOKEN",
        "capabilities": ["email.send", "calendar.create_event"],
    }


def _graph_request(method: str, path: str, payload: dict[str, Any]) -> dict[str, Any]:
    token = _token()
    if not token:
        return {
            "ok": False,
            "error": "outlook_not_connected",
            "message": "Outlook Token fehlt. Setze JARVIS_OUTLOOK_TOKEN oder JARVIS_OUTLOOK_CALENDAR_TOKEN.",
        }
    body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        f"{GRAPH_BASE}{path}",
        data=body,
        method=method,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            "Accept": "application/json",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as response:
            raw = response.read().decode("utf-8", errors="replace")
            data = json.loads(raw) if raw else {}
            return {"ok": 200 <= response.status < 300, "status": response.status, "data": data}
    except Exception as exc:
        return {"ok": False, "error": "graph_request_failed", "detail": str(exc)}


def _recipient(email: str) -> dict[str, Any]:
    return {"emailAddress": {"address": email.strip()}}


def send_email(to: str, subject: str, body: str, cc: str = "", save_to_sent_items: bool = True) -> dict[str, Any]:
    recipients = [item.strip() for item in str(to or "").replace(";", ",").split(",") if item.strip()]
    cc_recipients = [item.strip() for item in str(cc or "").replace(";", ",").split(",") if item.strip()]
    if not recipients:
        return {"ok": False, "error": "missing_recipient"}
    if not subject.strip():
        return {"ok": False, "error": "missing_subject"}
    payload = {
        "message": {
            "subject": subject,
            "body": {"contentType": "Text", "content": body or ""},
            "toRecipients": [_recipient(item) for item in recipients],
            "ccRecipients": [_recipient(item) for item in cc_recipients],
        },
        "saveToSentItems": save_to_sent_items,
    }
    result = _graph_request("POST", "/me/sendMail", payload)
    return {**result, "action": "outlook.email.send", "to": recipients, "cc": cc_recipients, "subject": subject}


def _normalize_datetime(value: str) -> str:
    clean = str(value or "").strip()
    if not clean:
        return ""
    try:
        return datetime.fromisoformat(clean.replace("Z", "+00:00")).replace(tzinfo=None).isoformat(timespec="seconds")
    except Exception:
        return clean


def create_calendar_event(subject: str, start: str, end: str, body: str = "", location: str = "", attendees: str = "", timezone: str = "Europe/Berlin") -> dict[str, Any]:
    if not subject.strip():
        return {"ok": False, "error": "missing_subject"}
    start_value = _normalize_datetime(start)
    end_value = _normalize_datetime(end)
    if not start_value or not end_value:
        return {"ok": False, "error": "missing_start_or_end"}
    attendee_list = [item.strip() for item in str(attendees or "").replace(";", ",").split(",") if item.strip()]
    payload = {
        "subject": subject,
        "body": {"contentType": "Text", "content": body or ""},
        "start": {"dateTime": start_value, "timeZone": timezone},
        "end": {"dateTime": end_value, "timeZone": timezone},
        "location": {"displayName": location or ""},
        "attendees": [{"emailAddress": {"address": item}, "type": "required"} for item in attendee_list],
    }
    result = _graph_request("POST", "/me/events", payload)
    return {**result, "action": "outlook.calendar.create_event", "subject": subject, "start": start_value, "end": end_value, "attendees": attendee_list}
