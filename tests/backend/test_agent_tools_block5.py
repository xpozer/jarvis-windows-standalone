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
    response = client.post("/tools/run", json={"tool_id": "file_search", "args": {"query": "jarvis", "limit": 2}})
    assert response.status_code == 200
    data = response.json()
    assert data.get("ok") is True
    assert data.get("tool_id") == "file_search"
    assert "result" in data


def test_tools_run_prepares_pending_action_for_risky_write(client):
    response = client.post("/tools/run", json={"tool_id": "text_file_write", "args": {"filename": "pytest.txt", "content": "hello"}})
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
