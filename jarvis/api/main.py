"""Minimal FastAPI app for JARVIS Windows Standalone."""

from __future__ import annotations

from fastapi import FastAPI

from jarvis import __version__


def create_app() -> FastAPI:
    """Erstellt die lokale FastAPI App.

    Die App ist bewusst klein gehalten. Sie dient als stabiler Einstiegspunkt
    fuer OpenAPI, Health Checks und spaetere WorkAgent Endpunkte.
    """
    app = FastAPI(
        title="JARVIS Local API",
        version=__version__,
        description="Local first API for JARVIS Windows Standalone",
    )

    @app.get("/health", tags=["system"])
    def health() -> dict[str, str]:
        """Einfacher Health Check fuer Installer, CI und DiagCenter."""
        return {"status": "ok", "version": __version__}

    return app


app = create_app()


def main() -> None:
    """Startet die API lokal ueber Uvicorn."""
    import uvicorn

    uvicorn.run("jarvis.api.main:app", host="127.0.0.1", port=8000, reload=False)
