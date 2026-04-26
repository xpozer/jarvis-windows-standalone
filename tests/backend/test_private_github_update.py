import os
import sys
from pathlib import Path


BACKEND = Path(__file__).resolve().parents[2] / "backend"
sys.path.insert(0, str(BACKEND))


def test_private_github_update_config_reports_missing_token(monkeypatch):
    monkeypatch.setenv("JARVIS_GITHUB_OWNER", "example-owner")
    monkeypatch.setenv("JARVIS_GITHUB_REPO", "jarvis-private")
    monkeypatch.delenv("JARVIS_GITHUB_TOKEN", raising=False)

    import services.product_update as product_update

    cfg = product_update.github_update_config()

    assert cfg["mode"] == "private_github_release"
    assert cfg["private"] is True
    assert cfg["token_configured"] is False
    assert cfg["owner"] == "example-owner"
    assert cfg["repo"] == "jarvis-private"


def test_build_github_headers_uses_token_without_exposing_it(monkeypatch):
    monkeypatch.setenv("JARVIS_GITHUB_TOKEN", "ghp_secret_for_test")

    import services.product_update as product_update

    headers = product_update.build_github_headers()

    assert headers["Authorization"] == "Bearer ghp_secret_for_test"
    assert "ghp_secret_for_test" not in str(product_update.github_update_config())
