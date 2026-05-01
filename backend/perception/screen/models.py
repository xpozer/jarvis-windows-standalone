# backend/perception/screen/models.py
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal
from pydantic import BaseModel, Field


ScreenCaptureState = Literal["off", "paused", "active", "idle", "blocked", "error"]
VisionProvider = Literal["ollama", "ocr", "none"]
ActivityType = Literal[
    "unknown",
    "reading",
    "writing",
    "reviewing",
    "data_entry",
    "searching",
    "communication",
    "planning",
    "coding",
    "learning",
]
PrivacyStatus = Literal["allowed", "blocked", "disabled", "paused"]
ContextSource = Literal["screen", "window", "vision", "ocr", "manual"]


class ActiveWindowInfo(BaseModel):
    application: str = "unknown"
    process_name: str = "unknown"
    window_title: str = ""
    pid: int | None = None


class ScreenshotFrame(BaseModel):
    id: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    path: Path | None = None
    width: int | None = None
    height: int | None = None
    image_hash: str | None = None
    changed: bool = True


class UiElement(BaseModel):
    label: str
    kind: str = "unknown"
    confidence: float = 0.0
    bounds: tuple[int, int, int, int] | None = None


class VisionResult(BaseModel):
    provider: VisionProvider = "none"
    extracted_text: str = ""
    ui_elements: list[str] = Field(default_factory=list)
    structured_ui_elements: list[UiElement] = Field(default_factory=list)
    user_intent_guess: str = ""
    activity_type: ActivityType = "unknown"
    confidence: float = 0.0
    raw: dict[str, Any] = Field(default_factory=dict)


class ScreenContext(BaseModel):
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    state: ScreenCaptureState = "off"
    source: ContextSource = "screen"
    application: str = "unknown"
    process_name: str = "unknown"
    window_title: str = ""
    pid: int | None = None
    extracted_text: str = ""
    ui_elements: list[str] = Field(default_factory=list)
    structured_ui_elements: list[UiElement] = Field(default_factory=list)
    user_intent_guess: str = ""
    activity_type: ActivityType = "unknown"
    confidence: float = 0.0
    screenshot_hash: str | None = None
    screenshot_changed: bool = False
    privacy_status: PrivacyStatus = "disabled"
    privacy_blocked: bool = False
    privacy_reason: str | None = None
    duration_hint_seconds: float | None = None
    should_store_episode: bool = False
    episode_reason: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)

    def memory_summary(self) -> str:
        parts = [self.application, self.window_title, self.user_intent_guess, self.extracted_text]
        return " | ".join(part for part in parts if part).strip()


class PrivacyDecision(BaseModel):
    allowed: bool
    reason: str
    matched_rule: str | None = None
