# backend/perception/screen/context_builder.py
from __future__ import annotations

from .models import ActiveWindowInfo, PrivacyStatus, ScreenContext, ScreenshotFrame, VisionResult
from .privacy import ScreenPrivacyPolicy


class ScreenContextBuilder:
    def __init__(self, privacy_policy: ScreenPrivacyPolicy | None = None) -> None:
        self.privacy_policy = privacy_policy or ScreenPrivacyPolicy()

    def build(
        self,
        window: ActiveWindowInfo,
        frame: ScreenshotFrame | None = None,
        vision: VisionResult | None = None,
        duration_hint_seconds: float | None = None,
    ) -> ScreenContext:
        decision = self.privacy_policy.decide(window)
        privacy_status = self._privacy_status(decision.allowed)

        if not decision.allowed:
            return ScreenContext(
                state="blocked" if self.privacy_policy.enabled else "off",
                source="window",
                application=window.application,
                process_name=window.process_name,
                window_title=window.window_title,
                pid=window.pid,
                screenshot_hash=frame.image_hash if frame else None,
                screenshot_changed=frame.changed if frame else False,
                privacy_status=privacy_status,
                privacy_blocked=True,
                privacy_reason=decision.reason,
                duration_hint_seconds=duration_hint_seconds,
                should_store_episode=False,
                metadata={"privacy_rule": decision.matched_rule},
            )

        result = vision or VisionResult()
        should_store, episode_reason = self._episode_hint(window, frame, result, duration_hint_seconds)
        return ScreenContext(
            state="active" if frame and frame.changed else "idle",
            source="vision" if result.provider != "none" else "window",
            application=window.application,
            process_name=window.process_name,
            window_title=window.window_title,
            pid=window.pid,
            extracted_text=result.extracted_text,
            ui_elements=result.ui_elements,
            structured_ui_elements=result.structured_ui_elements,
            user_intent_guess=result.user_intent_guess,
            activity_type=result.activity_type,
            confidence=result.confidence,
            screenshot_hash=frame.image_hash if frame else None,
            screenshot_changed=frame.changed if frame else False,
            privacy_status=privacy_status,
            privacy_blocked=False,
            duration_hint_seconds=duration_hint_seconds,
            should_store_episode=should_store,
            episode_reason=episode_reason,
            metadata={
                "vision_provider": result.provider,
                "vision_confidence": result.confidence,
                "privacy_rule": decision.matched_rule,
            },
        )

    def _privacy_status(self, allowed: bool) -> PrivacyStatus:
        if allowed:
            return "allowed"
        if not self.privacy_policy.enabled:
            return "disabled"
        if self.privacy_policy.paused:
            return "paused"
        return "blocked"

    def _episode_hint(
        self,
        window: ActiveWindowInfo,
        frame: ScreenshotFrame | None,
        vision: VisionResult,
        duration_hint_seconds: float | None,
    ) -> tuple[bool, str | None]:
        if not frame or not frame.changed:
            return False, None
        if duration_hint_seconds and duration_hint_seconds >= 300:
            return True, "long dwell time on active window"
        if vision.user_intent_guess or vision.extracted_text:
            return True, "vision context contains meaningful text or intent"
        if window.window_title:
            return True, "active window changed with usable title"
        return False, None
