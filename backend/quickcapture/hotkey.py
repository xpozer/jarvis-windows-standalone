# backend/quickcapture/hotkey.py
"""Globaler Hotkey Listener fuer Quick Capture."""

from __future__ import annotations

import logging
import threading
from collections.abc import Callable
from dataclasses import dataclass

LOGGER = logging.getLogger(__name__)


@dataclass(frozen=True)
class HotkeyConfig:
    """Konfiguration fuer den globalen Quick Capture Hotkey."""

    shortcut: str = "<ctrl>+<shift>+<space>"


class QuickCaptureHotkeyListener:
    """Startet einen globalen Hotkey Listener in einem Daemon Thread.

    `pynput` wird absichtlich erst zur Laufzeit importiert. Dadurch bleiben Tests
    und reine Backend Starts moeglich, auch wenn das Windows Hotkey Paket fehlt.
    """

    def __init__(self, on_activate: Callable[[], None], config: HotkeyConfig | None = None) -> None:
        self.on_activate = on_activate
        self.config = config or HotkeyConfig()
        self._thread: threading.Thread | None = None
        self._listener: object | None = None
        self._stop_requested = threading.Event()

    @property
    def running(self) -> bool:
        """Gibt zurueck, ob der Listener Thread laeuft."""
        return bool(self._thread and self._thread.is_alive())

    def start(self) -> None:
        """Startet den Listener einmalig."""
        if self.running:
            return
        self._stop_requested.clear()
        self._thread = threading.Thread(target=self._run, name="quickcapture-hotkey", daemon=True)
        self._thread.start()

    def stop(self) -> None:
        """Stoppt den Listener bestmoeglich."""
        self._stop_requested.set()
        listener = self._listener
        if listener and hasattr(listener, "stop"):
            try:
                listener.stop()
            except Exception as exc:  # pragma: no cover
                LOGGER.debug("Hotkey Listener konnte nicht sauber stoppen: %s", exc)

    def _run(self) -> None:
        try:
            from pynput import keyboard  # type: ignore
        except Exception as exc:  # pragma: no cover
            LOGGER.warning("pynput ist nicht verfuegbar. Quick Capture Hotkey bleibt aus: %s", exc)
            return

        def handle_activation() -> None:
            try:
                self.on_activate()
            except Exception as exc:  # pragma: no cover
                LOGGER.exception("Quick Capture Aktivierung fehlgeschlagen: %s", exc)

        with keyboard.GlobalHotKeys({self.config.shortcut: handle_activation}) as listener:
            self._listener = listener
            listener.join()
