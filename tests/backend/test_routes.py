"""
Tests fuer die wichtigsten API-Routen
Kein Ollama noetig, nur JSON-Endpunkte.
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "backend"))


class TestHealthRoutes:
    def test_health(self, client):
        r = client.get("/health")
        assert r.status_code == 200
        data = r.json()
        assert "status" in data or "ok" in data or "version" in data

    def test_system_status(self, client):
        r = client.get("/system/status")
        assert r.status_code == 200


class TestNotesRoutes:
    def test_notes_liste_leer(self, client):
        r = client.get("/notes")
        assert r.status_code == 200
        assert "notes" in r.json()

    def test_note_erstellen(self, client):
        r = client.post("/notes", json={"text": "Test Notiz aus pytest"})
        assert r.status_code == 200
        data = r.json()
        assert data.get("text") == "Test Notiz aus pytest"
        assert "id" in data

    def test_note_ohne_text_gibt_400(self, client):
        r = client.post("/notes", json={"text": ""})
        assert r.status_code == 400

    def test_note_loeschen(self, client):
        # Erstellen
        r = client.post("/notes", json={"text": "Loeschbare Notiz"})
        note_id = r.json()["id"]
        # Loeschen
        r2 = client.delete(f"/notes/{note_id}")
        assert r2.status_code == 200
        assert r2.json()["deleted"] == 1


class TestTasksRoutes:
    def test_tasks_liste(self, client):
        r = client.get("/tasks")
        assert r.status_code == 200
        assert "tasks" in r.json()

    def test_task_erstellen(self, client):
        r = client.post("/tasks", json={"text": "pytest Task"})
        assert r.status_code == 200
        assert r.json().get("text") == "pytest Task"

    def test_task_ohne_text_gibt_400(self, client):
        r = client.post("/tasks", json={"text": ""})
        assert r.status_code == 400


class TestSkillsRoutes:
    def test_skills_liste(self, client):
        r = client.get("/skills/list")
        assert r.status_code == 200
        assert "skills" in r.json()

    def test_skills_reload(self, client):
        r = client.post("/skills/reload")
        assert r.status_code == 200


class TestVoiceRoutes:
    def test_voice_core(self, client):
        r = client.get("/voice/core")
        assert r.status_code == 200
        data = r.json()
        assert "settings" in data

    def test_voice_settings_lesen(self, client):
        r = client.get("/voice/settings")
        assert r.status_code == 200
