# backend/quickcapture/voice_input.py
"""Vorbereitung fuer lokalen Voice Input im Quick Capture."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class VoiceInputStatus:
    """Status des optionalen Voice Capture."""

    available: bool
    message: str


class QuickCaptureVoiceInput:
    """Platzhalter fuer Whisper lokalen Mikrofon Capture.

    Die Implementierung bleibt bewusst deaktiviert, bis Mikrofon Freigabe,
    Visualfeedback und lokale Whisper Pipeline in Aufgabe 1.4 sauber angebunden werden.
    """

    def status(self) -> VoiceInputStatus:
        """Gibt den aktuellen Voice Input Status zurueck."""
        return VoiceInputStatus(
            available=False,
            message="Voice Input ist vorbereitet, aber noch nicht aktiviert.",
        )

    def capture_once(self) -> str:
        """Reservierter Einstieg fuer eine spaetere lokale Transkription."""
        raise NotImplementedError("Voice Capture wird in Aufgabe 1.4 lokal angebunden.")
