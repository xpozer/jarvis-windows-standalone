# backend/perception/screen/config.py
from __future__ import annotations

import json
from pathlib import Path
from pydantic import BaseModel, Field


class ScreenPerformanceConfig(BaseModel):
    capture_interval_seconds: float = 2.0
    max_frames: int = 100
    max_buffer_mb: int = 100
    image_format: str = "webp"
    image_quality: int = 72
    diff_detection_enabled: bool = True
    diff_hash_width: int = 32
    diff_hash_height: int = 18


class ScreenPrivacyConfig(BaseModel):
    enabled: bool = False
    paused: bool = False
    pause_hotkey: str = "ctrl+alt+p"
    visual_indicator: bool = True
    tray_indicator: bool = True
    capture_interval_seconds: float = 2.0
    allowlist_apps: list[str] = Field(default_factory=list)
    blocked_apps: list[str] = Field(default_factory=lambda: [
        "1password",
        "bitwarden",
        "keepass",
        "keepassxc",
        "lastpass",
        "dashlane",
        "nordpass",
        "banking",
        "tan",
        "authenticator",
    ])
    blocked_title_words: list[str] = Field(default_factory=lambda: [
        "bank",
        "passwort",
        "password",
        "pin",
        "tan",
        "konto",
        "private",
        "privat",
        "gehalt",
    ])


class ScreenPerceptionConfig(BaseModel):
    privacy: ScreenPrivacyConfig = Field(default_factory=ScreenPrivacyConfig)
    performance: ScreenPerformanceConfig = Field(default_factory=ScreenPerformanceConfig)


DEFAULT_SCREEN_CONFIG_PATH = Path("config/screen-perception.json")


def load_screen_config(path: Path = DEFAULT_SCREEN_CONFIG_PATH) -> ScreenPerceptionConfig:
    if not path.exists():
        return ScreenPerceptionConfig()

    with path.open("r", encoding="utf-8") as file:
        return ScreenPerceptionConfig.model_validate(json.load(file))


def save_screen_config(config: ScreenPerceptionConfig, path: Path = DEFAULT_SCREEN_CONFIG_PATH) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as file:
        json.dump(config.model_dump(), file, indent=2, ensure_ascii=False)
