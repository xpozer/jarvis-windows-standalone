# backend/perception/screen/indicator.py
from __future__ import annotations

from .runtime_state import ScreenRuntimeState


class ScreenActivityIndicator:
    def __init__(self, visual_indicator: bool = True, tray_indicator: bool = True) -> None:
        self.visual_indicator = visual_indicator
        self.tray_indicator = tray_indicator

    def snapshot(self, state: ScreenRuntimeState) -> dict[str, str | bool]:
        return {
            "visible": self.visual_indicator,
            "tray_enabled": self.tray_indicator,
            "status": state.status_label(),
            "message": self._message_for(state),
        }

    def _message_for(self, state: ScreenRuntimeState) -> str:
        status = state.status_label()
        if status == "ACTIVE":
            return "Screen perception active"
        if status == "PAUSED":
            return "Screen perception paused"
        if status == "IDLE":
            return "Screen perception enabled but idle"
        return "Screen perception off"
