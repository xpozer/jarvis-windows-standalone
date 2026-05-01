from __future__ import annotations


def test_public_html_page_is_served_before_spa_fallback(client):
    response = client.get("/jarvis-global-overview-themed.html")

    assert response.status_code == 200
    assert "JARVIS Global Overview Themes" in response.text
    assert "MATRIX" in response.text
    assert "ULTRON" in response.text
