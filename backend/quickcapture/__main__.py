# backend/quickcapture/__main__.py
"""CLI Einstieg fuer Quick Capture Tests."""

from __future__ import annotations

from .app import QuickCaptureApp


def main() -> None:
    """Startet das Quick Capture Popup einmalig."""
    QuickCaptureApp().open_popup()


if __name__ == "__main__":
    main()
