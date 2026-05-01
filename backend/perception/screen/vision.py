# backend/perception/screen/vision.py
from __future__ import annotations

from pathlib import Path

from .models import ScreenshotFrame, VisionResult


class ScreenVisionAnalyzer:
    def __init__(self, model: str = "moondream") -> None:
        self.model = model
        self._cache: dict[str, VisionResult] = {}

    def analyze(self, frame: ScreenshotFrame) -> VisionResult:
        if not frame.path or not frame.image_hash:
            return VisionResult(provider="none", confidence=0.0)

        cached = self._cache.get(frame.image_hash)
        if cached:
            return cached

        result = self._analyze_with_ollama(frame.path)
        self._cache[frame.image_hash] = result
        return result

    def _analyze_with_ollama(self, image_path: Path) -> VisionResult:
        return VisionResult(
            provider="ollama",
            extracted_text="",
            ui_elements=[],
            user_intent_guess="",
            confidence=0.0,
            raw={"status": "not_implemented", "image_path": str(image_path), "model": self.model},
        )
