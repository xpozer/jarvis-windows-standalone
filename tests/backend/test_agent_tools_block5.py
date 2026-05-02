"""
Tests fuer B7 Block 5: Agent- und Tool-Registry produktiv nutzbar machen.
"""


def test_agents_registry_exposes_productive_status_fields(client):
    response = client.get("/agents/registry")
    assert response.status_code == 200
    agents = response.json().get("agents")
    assert isinstance(agents, list)
    assert agents

    first = agents[0]
    for key in ("id", "name", "status", "last_action", "error_count", "capabilities", "tools"):
        assert key in first


def test_tools_run_alias_executes_registry_safe_file_search(client):
    response = client.post(
        "/tools/run", json={"tool_id": "file_search", "args": {"query": "jarvis", "limit": 2}}
    )
    assert response.status_code == 200
    data = response.json()
    assert data.get("ok") is True
    assert data.get("tool_id") == "file_search"
    assert "result" in data


def test_tools_run_prepares_pending_action_for_risky_write(client):
    response = client.post(
        "/tools/run",
        json={"tool_id": "text_file_write", "args": {"filename": "pytest.txt", "content": "hello"}},
    )
    assert response.status_code == 200
    data = response.json()
    assert data.get("ok") is True
    assert data.get("requires_confirmation") is True
    action = data.get("action")
    assert isinstance(action, dict)
    assert action.get("status") == "pending"
    assert action.get("type") == "write_text_file"


def test_tools_run_rejects_unknown_registry_tool(client):
    response = client.post("/tools/run", json={"tool_id": "does_not_exist", "args": {}})
    assert response.status_code == 404


def test_windows_tool_is_prepared_and_only_runs_after_confirmation(client, monkeypatch, tmp_path):
    from services import _runtime as core

    monkeypatch.setattr(core, "ACTIONS_FILE", tmp_path / "actions.json")

    def fail_if_called(name: str):
        raise AssertionError("Windows Tool darf ohne Bestaetigung nicht laufen")

    monkeypatch.setattr(core, "open_windows_app", fail_if_called)

    prepared = client.post("/tools/run", json={"tool_id": "open_app", "args": {"name": "notepad"}})
    assert prepared.status_code == 200
    action = prepared.json().get("action")
    assert prepared.json().get("requires_confirmation") is True
    assert action["type"] == "tool_run"
    assert action["status"] == "pending"

    monkeypatch.setattr(core, "open_windows_app", lambda name: {"ok": True, "app": name})

    confirmed = client.post("/actions/confirm", json={"action_id": action["id"]})
    assert confirmed.status_code == 200
    data = confirmed.json()
    assert data["ok"] is True
    assert data["action"]["status"] == "done"
    assert data["result"]["result"]["app"] == "notepad"


def test_pending_action_can_be_cancelled(client, tmp_path, monkeypatch):
    from services import _runtime as core

    monkeypatch.setattr(core, "ACTIONS_FILE", tmp_path / "actions.json")
    prepared = client.post(
        "/actions/prepare",
        json={"type": "write_text_file", "payload": {"path": "downloads/x.txt", "content": "x"}},
    )
    assert prepared.status_code == 200

    cancelled = client.post("/actions/cancel", json={"action_id": prepared.json()["id"]})
    assert cancelled.status_code == 200
    assert cancelled.json()["ok"] is True
    assert cancelled.json()["action"]["status"] == "cancelled"
