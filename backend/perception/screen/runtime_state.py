# backend/perception/screen/runtime_state.py
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone


@dataclass(slots=True)
class ScreenRuntimeState:
    enabled: bool = False
    paused: bool = False
    running: bool = False
    last_reason: str = "disabled by default"
    last_changed_at: datetime = datetime.now(timezone.utc)

    def status_label(self) -> str:
        if not self.enabled:
            return "OFF"
        if self.paused:
            return "PAUSED"
        if self.running:
            return "ACTIVE"
        return "IDLE"

    def set_enabled(self, value: bool, reason: str) -> None:
        self.enabled = value
        if not value:
            self.running = False
        self.last_reason = reason
        self.last_changed_at = datetime.now(timezone.utc)

    def set_paused(self, value: bool, reason: str) -> None:
        self.paused = value
        if value:
            self.running = False
        self.last_reason = reason
        self.last_changed_at = datetime.now(timezone.utc)

    def set_running(self, value: bool, reason: str) -> None:
        self.running = value
        self.last_reason = reason
        self.last_changed_at = datetime.now(timezone.utc)

    def as_dict(self) -> dict[str, str | bool]:
        return {
            "enabled": self.enabled,
            "paused": self.paused,
            "running": self.running,
            "status": self.status_label(),
            "last_reason": self.last_reason,
            "last_changed_at": self.last_changed_at.isoformat(),
        }
