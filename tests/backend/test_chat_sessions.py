from __future__ import annotations


def test_chat_persists_session_and_returns_metadata(client, monkeypatch, tmp_path):
    from routes import local_chat

    monkeypatch.setattr(local_chat, "CHAT_SESSIONS_FILE", tmp_path / "chat_sessions.json")
    monkeypatch.setattr(local_chat, "call_llm", lambda messages, model, temperature, stream=False: "Hallo, ich bin bereit.")
    monkeypatch.setattr(local_chat.usejarvis_runtime, "memory_context", lambda user_text, limit=6: [])
    monkeypatch.setattr(local_chat.usejarvis_runtime, "extract_facts_from_text", lambda text, source_ref="": [])
    monkeypatch.setattr(local_chat.usejarvis_runtime, "audit", lambda *args, **kwargs: None)

    response = client.post("/api/chat", json={"message": "test", "history": []})

    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True
    assert data["response"] == "Hallo, ich bin bereit."
    assert data["session_id"]
    assert data["meta"]["provider"] == local_chat.JARVIS_PROVIDER
    assert data["meta"]["model"]
    assert data["meta"]["duration_ms"] >= 0

    sessions = client.get("/api/chat/sessions").json()["sessions"]
    assert len(sessions) == 1
    assert sessions[0]["id"] == data["session_id"]
    assert sessions[0]["title"] == "test"

    detail = client.get(f"/api/chat/sessions/{data['session_id']}").json()
    assert [item["role"] for item in detail["messages"]] == ["operator", "jarvis"]
    assert detail["messages"][1]["meta"]["provider"] == local_chat.JARVIS_PROVIDER


def test_chat_session_can_be_renamed_and_deleted(client, monkeypatch, tmp_path):
    from routes import local_chat

    monkeypatch.setattr(local_chat, "CHAT_SESSIONS_FILE", tmp_path / "chat_sessions.json")
    monkeypatch.setattr(local_chat, "call_llm", lambda messages, model, temperature, stream=False: "Antwort")
    monkeypatch.setattr(local_chat.usejarvis_runtime, "memory_context", lambda user_text, limit=6: [])
    monkeypatch.setattr(local_chat.usejarvis_runtime, "extract_facts_from_text", lambda text, source_ref="": [])
    monkeypatch.setattr(local_chat.usejarvis_runtime, "audit", lambda *args, **kwargs: None)

    session_id = client.post("/api/chat", json={"message": "alter titel"}).json()["session_id"]

    renamed = client.patch(f"/api/chat/sessions/{session_id}", json={"title": "Neuer Chat Titel"})
    assert renamed.status_code == 200
    assert renamed.json()["session"]["title"] == "Neuer Chat Titel"

    deleted = client.delete(f"/api/chat/sessions/{session_id}")
    assert deleted.status_code == 200
    assert deleted.json()["ok"] is True
    assert client.get("/api/chat/sessions").json()["sessions"] == []


def test_chat_stream_emits_deltas_and_persists_session(client, monkeypatch, tmp_path):
    from routes import local_chat

    monkeypatch.setattr(local_chat, "CHAT_SESSIONS_FILE", tmp_path / "chat_sessions.json")
    monkeypatch.setattr(local_chat, "call_llm", lambda messages, model, temperature, stream=False: iter(["Hallo", " Welt"]))
    monkeypatch.setattr(local_chat.usejarvis_runtime, "memory_context", lambda user_text, limit=6: [])
    monkeypatch.setattr(local_chat.usejarvis_runtime, "extract_facts_from_text", lambda text, source_ref="": [])
    monkeypatch.setattr(local_chat.usejarvis_runtime, "audit", lambda *args, **kwargs: None)

    with client.stream("POST", "/api/chat/stream", json={"message": "stream test"}) as response:
        body = "".join(response.iter_text())

    assert response.status_code == 200
    assert "event: meta" in body
    assert "event: phase" in body
    assert "Kontext" in body
    assert "Agent" in body
    assert "Antwort" in body
    assert "event: delta" in body
    assert "Hallo" in body
    assert " Welt" in body
    assert "event: done" in body

    sessions = client.get("/api/chat/sessions").json()["sessions"]
    assert len(sessions) == 1
    detail = client.get(f"/api/chat/sessions/{sessions[0]['id']}").json()
    assert detail["messages"][1]["text"] == "Hallo Welt"
