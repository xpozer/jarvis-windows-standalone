from __future__ import annotations


def test_update_center_status_contains_safe_components(monkeypatch):
    from services import update_center

    def fake_run(args, cwd=None, timeout=8):
        command = " ".join(args)
        if args[:2] == ["git", "rev-parse"] and "--abbrev-ref" in args:
            return update_center.CommandResult(True, "main", "", 0)
        if args[:2] == ["git", "rev-parse"] and "--short" in args:
            return update_center.CommandResult(True, "abc1234", "", 0)
        if args[:2] == ["git", "status"]:
            return update_center.CommandResult(True, "", "", 0)
        if args[:2] == ["git", "remote"]:
            return update_center.CommandResult(True, "https://github.com/xpozer/jarvis-windows-standalone.git", "", 0)
        if args[:2] == ["python", "--version"]:
            return update_center.CommandResult(True, "Python 3.12.0", "", 0)
        if args[:2] == ["node", "--version"]:
            return update_center.CommandResult(True, "v22.0.0", "", 0)
        if args[:2] == ["npm", "--version"]:
            return update_center.CommandResult(True, "10.0.0", "", 0)
        if args[:2] == ["ollama", "--version"]:
            return update_center.CommandResult(True, "ollama version is 0.9.0", "", 0)
        return update_center.CommandResult(False, "", "nicht verfuegbar", 1)

    monkeypatch.setattr(update_center, "_run_command", fake_run)
    monkeypatch.setattr(update_center, "_ollama_tags", lambda: {"ok": True, "models": [{"name": "qwen3:8b"}]})

    status = update_center.status()

    assert status["ok"] is True
    assert status["auto_apply"] is False
    assert status["summary"]["total"] >= 5
    assert {"jarvis_core", "python_backend", "frontend", "ollama", "ollama_model", "windows_runtime"} <= set(status["components"])
    assert status["components"]["jarvis_core"]["safe_to_check"] is True
    assert status["components"]["jarvis_core"]["requires_confirmation"] is True
    assert status["components"]["ollama_model"]["status"] == "ok"


def test_update_center_route_is_read_only(client, monkeypatch):
    from services import update_center

    monkeypatch.setattr(update_center, "status", lambda refresh=False: {
        "ok": True,
        "checked_at": "2026-05-01T10:00:00",
        "auto_apply": False,
        "summary": {"ok": 1, "warn": 0, "error": 0, "unknown": 0, "total": 1},
        "components": {
            "jarvis_core": {
                "id": "jarvis_core",
                "name": "JARVIS Core",
                "status": "ok",
                "current": "abc1234",
                "latest": "",
                "update_available": False,
                "safe_to_check": True,
                "requires_confirmation": True,
                "details": {},
                "actions": [],
            }
        },
        "logs": [],
    })

    response = client.get("/api/updates/status")

    assert response.status_code == 200
    data = response.json()
    assert data["auto_apply"] is False
    assert data["components"]["jarvis_core"]["requires_confirmation"] is True
