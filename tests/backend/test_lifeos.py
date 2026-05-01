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


def test_lifeos_learning_focus_prioritizes_weak_due_topics(monkeypatch, tmp_path):
    from services import lifeos

    private_file = tmp_path / "lifeos.json"
    example_file = tmp_path / "lifeos.example.json"
    private_file.write_text(json.dumps({
        "daily_briefing": {"today_important": ["Arbeit klaeren"], "energy_percent": 70},
        "learning_radar": {
            "subjects": [
                {
                    "id": "aevo_methodik",
                    "subject": "AEVO",
                    "topic": "Unterweisungsmethoden",
                    "confidence": 2,
                    "last_review": "2026-04-20",
                    "next_review": "2026-05-01",
                    "error_rate": 0.38,
                    "open_cards": 14,
                },
                {
                    "id": "vde_basis",
                    "subject": "Meister",
                    "topic": "VDE Grundlagen",
                    "confidence": 5,
                    "last_review": "2026-04-30",
                    "next_review": "2026-05-20",
                    "error_rate": 0.04,
                    "open_cards": 2,
                },
            ]
        },
    }), encoding="utf-8")

    monkeypatch.setattr(lifeos, "LIFEOS_PRIVATE_FILE", private_file)
    monkeypatch.setattr(lifeos, "LIFEOS_EXAMPLE_FILE", example_file)

    result = lifeos.briefing()

    focus = result["learning_focus"]
    assert focus["topic"] == "Unterweisungsmethoden"
    assert focus["subject"] == "AEVO"
    assert focus["confidence"] == 2
    assert focus["priority_score"] > 0
    assert "Unterweisungsmethoden" in focus["recommendation"]


def test_lifeos_work_radar_20_summarizes_status_risk_and_categories(monkeypatch, tmp_path):
    from services import lifeos

    private_file = tmp_path / "lifeos.json"
    example_file = tmp_path / "lifeos.example.json"
    private_file.write_text(json.dumps({
        "daily_briefing": {"today_important": ["Work Radar pruefen"], "energy_percent": 75},
        "work_radar": {
            "items": [
                {"id": "sap_auftrag", "title": "SAP Auftrag pruefen", "status": "blocked", "risk": "critical", "deadline": "2026-05-01", "next_step": "Bestellwert klaeren"},
                {"id": "fsm_buchung", "title": "FSM Buchung nachziehen", "status": "waiting", "risk": "medium", "deadline": "2026-05-03", "next_step": "Nachweis suchen"},
                {"id": "lnw_check", "title": "LNW unterschreiben lassen", "status": "open", "risk": "high", "deadline": "2026-05-02", "next_step": "Kundenfreigabe holen"},
            ]
        },
    }), encoding="utf-8")

    monkeypatch.setattr(lifeos, "LIFEOS_PRIVATE_FILE", private_file)
    monkeypatch.setattr(lifeos, "LIFEOS_EXAMPLE_FILE", example_file)

    result = lifeos.briefing()
    radar = result["work_radar"]

    assert radar["count"] == 3
    assert radar["risk_summary"]["critical"] == 1
    assert radar["status_summary"]["blocked"] == 1
    assert radar["attention_count"] >= 2
    assert radar["next_work_action"] == "Bestellwert klaeren"
    assert radar["items"][0]["category"] == "SAP"
    assert radar["categories"][0]["name"] == "SAP"


def test_lifeos_routes_expose_briefing_and_installer_check(client):
    briefing = client.get("/api/lifeos/briefing")
    installer = client.get("/api/lifeos/installer-check")

    assert briefing.status_code == 200
    assert "top_tasks" in briefing.json()
    assert "learning_focus" in briefing.json()
    assert installer.status_code == 200
    assert installer.json()["checks"]["private_config_ignored"]["ok"] is True


def test_first_setup_runs_lifeos_config_setup():
    from pathlib import Path

    root = Path(__file__).resolve().parents[2]
    script = (root / "FIRST_SETUP.ps1").read_text(encoding="utf-8")

    assert "setup-lifeos-config.ps1" in script
    assert "LifeOS private Konfiguration" in script
