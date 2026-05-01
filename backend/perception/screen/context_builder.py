# backend/perception/screen/context_builder.py
from __future__ import annotations

from .models import ActiveWindowInfo, ScreenContext, ScreenshotFrame, VisionResult
from .privacy import ScreenPrivacyPolicy


class ScreenContextBuilder:
    def __init__(self, privacy_policy: ScreenPrivacyPolicy | None = None) -> None:
        self.privacy_policy = privacy_policy or ScreenPrivacyPolicy()

    def build(
        self,
        window: ActiveWindowInfo,
        frame: ScreenshotFrame | None = None,
        vision: VisionResult | None = None,
    ) -> ScreenContext:
        decision = self.privacy_policy.decide(window)
        if not decision.allowed:
            return ScreenContext(
                state="blocked" if self.privacy_policy.enabled else "off",
                application=window.application,
                window_title=window.window_title,
                privacy_blocked=True,
                privacy_reason=decision.reason,
                screenshot_hash=frame.image_hash if frame else None,
            )

        result = vision or VisionResult()
        return ScreenContext(
            state="active",
            application=window.application,
            window_title=window.window_title,
            extracted_text=result.extracted_text,
            ui_elements=result.ui_elements,
            user_intent_guess=result.user_intent_guess,
            screenshot_hash=frame.image_hash if frame else None,
            metadata={
                "process_name": window.process_name,
                "pid": window.pid,
                "vision_provider": result.provider,
                "vision_confidence": result.confidence,
            },
        )
