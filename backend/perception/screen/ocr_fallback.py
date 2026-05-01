# backend/perception/screen/ocr_fallback.py
from __future__ import annotations

from .models import ScreenshotFrame, VisionResult


class OcrFallback:
    def extract(self, frame: ScreenshotFrame) -> VisionResult:
        if not frame.path:
            return VisionResult(provider="none", confidence=0.0)

        try:
            import pytesseract
            from PIL import Image

            text = pytesseract.image_to_string(Image.open(frame.path)).strip()
            return VisionResult(provider="ocr", extracted_text=text, confidence=0.35 if text else 0.0)
        except Exception as exc:
            return VisionResult(provider="ocr", confidence=0.0, raw={"error": str(exc)})
