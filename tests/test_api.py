from fastapi.testclient import TestClient

from jarvis.api import main as api_main
from jarvis.api.main import create_app


def test_health_endpoint_returns_ok() -> None:
    client = TestClient(create_app())

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"
    assert response.json()["version"] == "6.5.1"


def test_automation_audit_log_roundtrip(tmp_path, monkeypatch) -> None:
    audit_file = tmp_path / "automation-audit.jsonl"
    monkeypatch.setattr(api_main, "_audit_log_path", lambda: audit_file)
    client = TestClient(create_app())

    empty_response = client.get("/automation/audit")
    assert empty_response.status_code == 200
    assert empty_response.json()["count"] == 0

    create_response = client.post(
        "/automation/audit",
        json={
            "task": "Daily LifeOS Scan",
            "source": "LifeOS",
            "status": "ok",
            "result": "Briefing aktualisiert",
            "requires_confirmation": False,
            "risk": "low",
            "target": "config/lifeos.json",
        },
    )

    assert create_response.status_code == 200
    created = create_response.json()["entry"]
    assert created["task"] == "Daily LifeOS Scan"
    assert created["source"] == "LifeOS"
    assert created["status"] == "ok"
    assert created["id"]
    assert created["created_at"]

    list_response = client.get("/automation/audit")
    assert list_response.status_code == 200
    body = list_response.json()
    assert body["count"] == 1
    assert body["entries"][0]["task"] == "Daily LifeOS Scan"
