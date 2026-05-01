# backend/perception/screen/hotkeys.py
from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class ScreenHotkeyConfig:
    pause_hotkey: str = "ctrl+alt+p"


class ScreenHotkeyRegistry:
    def __init__(self, config: ScreenHotkeyConfig | None = None) -> None:
        self.config = config or ScreenHotkeyConfig()
        self.registered = False

    def register_pause_hotkey(self) -> dict[str, str | bool]:
        self.registered = True
        return {
            "registered": self.registered,
            "hotkey": self.config.pause_hotkey,
            "note": "hotkey hook is not active yet, registration is prepared only",
        }

    def unregister_pause_hotkey(self) -> dict[str, str | bool]:
        self.registered = False
        return {
            "registered": self.registered,
            "hotkey": self.config.pause_hotkey,
        }
