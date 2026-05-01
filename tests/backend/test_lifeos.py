from __future__ import annotations

import json


def test_lifeos_briefing_generates_top_three_and_work_items(monkeypatch, tmp_path):
    from services import lifeos

    private_file = tmp_path / "lifeos.json"
    example_file = tmp_path / "lifeos.example.json"
    private_file.write_text(json.dumps({
        "daily_briefing": {
            "day_mode": "FOCUSED",
            "focus_minutes": 90,
            "open_loops": 5,
            "energy_percent": 78,
            "today_important": [
                "Kunden Rueckfrage klaeren",
                "LNW pruefen",
                "Lernblock einplanen",
                "Ablage sortieren",
            ],
        },
        "work_radar": {
            "items": [
                {"title": "SAP Auftrag", "status": "open", "risk": "high", "deadline": "2026-05-01", "next_step": "Rueckfrage senden"},
                {"title": "FSM Buchung", "status": "waiting", "risk": "medium", "deadline": "2026-05-03", "next_step": "Nachweis pruefen"},
            ]
        },
    }), encoding="utf-8")

    monkeypatch.setattr(lifeos, "LIFEOS_PRIVATE_FILE", private_file)
    monkeypatch.setattr(lifeos, "LIFEOS_EXAMPLE_FILE", example_file)

    result = lifeos.briefing()

    assert result["ok"] is True
    assert result["source"]["mode"] == "private"
    assert len(result["top_tasks"]) == 3
    assert result["top_tasks"][0]["title"] == "SAP Auftrag"
    assert result["work_radar"]["items"][0]["risk"] == "high"
    assert "Tageslage" in result["summary"]
    assert result["next_best_action"]


def test_lifeos_status_falls_back_to_example(monkeypatch, tmp_path):
    from services import lifeos

    private_file = tmp_path / "missing.json"
    example_file = tmp_path / "lifeos.example.json"
    example_file.write_text(json.dumps({"version": "test", "daily_briefing": {"today_important": ["Test"]}}), encoding="utf-8")
    monkeypatch.setattr(lifeos, "LIFEOS_PRIVATE_FILE", private_file)
    monkeypatch.setattr(lifeos, "LIFEOS_EXAMPLE_FILE", example_file)

    status = lifeos.status()

    assert status["ok"] is True
    assert status["source"]["mode"] == "example"
    assert status["config_exists"]["private"] is False
    assert status["config_exists"]["example"] is True


def test_lifeos_routes_expose_briefing_and_installer_check(client):
    briefing = client.get("/api/lifeos/briefing")
    installer = client.get("/api/lifeos/installer-check")

    assert briefing.status_code == 200
    assert "top_tasks" in briefing.json()
    assert installer.status_code == 200
    assert installer.json()["checks"]["private_config_ignored"]["ok"] is True


def test_first_setup_runs_lifeos_config_setup():
    from pathlib import Path

    root = Path(__file__).resolve().parents[2]
    script = (root / "FIRST_SETUP.ps1").read_text(encoding="utf-8")

    assert "setup-lifeos-config.ps1" in script
    assert "LifeOS private Konfiguration" in script
