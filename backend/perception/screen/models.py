# backend/perception/screen/models.py
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal
from pydantic import BaseModel, Field


ScreenCaptureState = Literal["off", "paused", "active", "blocked", "error"]
VisionProvider = Literal["ollama", "ocr", "none"]


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


class VisionResult(BaseModel):
    provider: VisionProvider = "none"
    extracted_text: str = ""
    ui_elements: list[str] = Field(default_factory=list)
    user_intent_guess: str = ""
    confidence: float = 0.0
    raw: dict[str, Any] = Field(default_factory=dict)


class ScreenContext(BaseModel):
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    state: ScreenCaptureState = "off"
    application: str = "unknown"
    window_title: str = ""
    extracted_text: str = ""
    ui_elements: list[str] = Field(default_factory=list)
    user_intent_guess: str = ""
    screenshot_hash: str | None = None
    privacy_blocked: bool = False
    privacy_reason: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class PrivacyDecision(BaseModel):
    allowed: bool
    reason: str
    matched_rule: str | None = None
