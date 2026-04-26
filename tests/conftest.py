"""
JARVIS Test-Konfiguration
Startet den FastAPI TestClient ohne echtes Ollama zu brauchen.
"""
import sys
import os
from pathlib import Path

# Backend-Pfad in sys.path damit Imports funktionieren
BACKEND = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(BACKEND))

import pytest
from unittest.mock import patch

@pytest.fixture(scope="session")
def app():
    """FastAPI App-Instanz fuer Tests."""
    with patch("main.ollama_online", return_value=False):
        import main as m
        return m.app

@pytest.fixture(scope="session")
def client(app):
    """Synchroner TestClient."""
    from fastapi.testclient import TestClient
    return TestClient(app)
