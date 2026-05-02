from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from services import _runtime as runtime  # noqa: E402


def test_pending_action_writes_automation_audit(monkeypatch, tmp_path) -> None:
    audit_events: list[dict] = []
    monkeypatch.setattr(runtime, "ACTIONS_FILE", tmp_path / "actions.json")
    monkeypatch.setattr(
        runtime.audit,
        "log_action",
        lambda action, **kwargs: audit_events.append({"action": action, **kwargs}),
    )

    action = runtime.create_pending_action(
        "write_text_file", {"path": "downloads/test.txt", "content": "ok"}, "confirm"
    )

    assert action["status"] == "pending"
    assert audit_events
    assert audit_events[0]["action"] == "action_prepare:write_text_file"
    assert audit_events[0]["agent"] == "automation"
    assert audit_events[0]["requires_confirmation"] is True


def test_automation_audit_endpoint_shape(monkeypatch) -> None:
    monkeypatch.setattr(runtime, "_runtime_automation_audit_entries", lambda limit: [])
    monkeypatch.setattr(
        runtime.audit,
        "get_entries",
        lambda limit=1000: [
            {
                "id": "a1",
                "ts": "2026-05-02T12:00:00",
                "action": "action_prepare:tool_run",
                "agent": "automation",
                "tool": "open_app",
                "risk_level": "confirm",
                "requires_confirmation": True,
                "confirmed": False,
                "result": "action_1",
                "details": {"action_id": "action_1"},
            }
        ],
    )

    body = runtime.api_automation_audit(limit=10)

    assert body["status"] == "ok"
    assert body["count"] == 1
    entry = body["entries"][0]
    assert entry["task"] == "action_prepare:tool_run"
    assert entry["source"] == "automation"
    assert entry["status"] == "waiting"
    assert entry["risk"] == "medium"
