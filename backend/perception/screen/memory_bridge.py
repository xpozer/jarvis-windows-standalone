# backend/perception/screen/memory_bridge.py
from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Literal
from uuid import uuid4

from .models import ScreenContext

EpisodeSource = Literal["screen"]
EpisodeType = Literal["screen_context", "screen_app_switch", "screen_long_dwell", "screen_intent"]


@dataclass(slots=True)
class ScreenEpisodeCandidate:
    id: str
    timestamp: datetime
    source: EpisodeSource
    type: EpisodeType
    title: str
    content: str
    application: str
    window_title: str
    screenshot_hash: str | None
    tags: list[str]
    importance_score: float
    related_context: dict[str, Any]

    def as_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat(),
            "source": self.source,
            "type": self.type,
            "title": self.title,
            "content": self.content,
            "application": self.application,
            "window_title": self.window_title,
            "screenshot_hash": self.screenshot_hash,
            "tags": self.tags,
            "importance_score": self.importance_score,
            "related_context": self.related_context,
        }


class ScreenMemoryBridge:
    def __init__(self, min_importance_score: float = 0.35) -> None:
        self.min_importance_score = min_importance_score

    def to_episode_candidate(self, context: ScreenContext) -> ScreenEpisodeCandidate | None:
        if not self._is_eligible(context):
            return None

        episode_type = self._episode_type(context)
        importance_score = self._importance_score(context, episode_type)
        if importance_score < self.min_importance_score:
            return None

        return ScreenEpisodeCandidate(
            id=uuid4().hex,
            timestamp=context.timestamp or datetime.now(timezone.utc),
            source="screen",
            type=episode_type,
            title=self._title(context, episode_type),
            content=context.memory_summary(),
            application=context.application,
            window_title=context.window_title,
            screenshot_hash=context.screenshot_hash,
            tags=self._tags(context, episode_type),
            importance_score=importance_score,
            related_context={
                "process_name": context.process_name,
                "pid": context.pid,
                "activity_type": context.activity_type,
                "privacy_status": context.privacy_status,
                "confidence": context.confidence,
                "screenshot_changed": context.screenshot_changed,
                "episode_reason": context.episode_reason,
            },
        )

    def to_episode_candidates(self, contexts: list[ScreenContext]) -> list[ScreenEpisodeCandidate]:
        candidates: list[ScreenEpisodeCandidate] = []
        for context in contexts:
            candidate = self.to_episode_candidate(context)
            if candidate:
                candidates.append(candidate)
        return candidates

    def _is_eligible(self, context: ScreenContext) -> bool:
        if context.privacy_status != "allowed":
            return False
        if context.privacy_blocked:
            return False
        if not context.should_store_episode:
            return False
        if not context.screenshot_changed:
            return False
        if not context.memory_summary():
            return False
        return True

    def _episode_type(self, context: ScreenContext) -> EpisodeType:
        if context.duration_hint_seconds and context.duration_hint_seconds >= 300:
            return "screen_long_dwell"
        if context.user_intent_guess:
            return "screen_intent"
        if context.window_title:
            return "screen_app_switch"
        return "screen_context"

    def _importance_score(self, context: ScreenContext, episode_type: EpisodeType) -> float:
        score = 0.25
        if context.extracted_text:
            score += 0.2
        if context.user_intent_guess:
            score += 0.25
        if context.duration_hint_seconds and context.duration_hint_seconds >= 300:
            score += 0.2
        if context.activity_type != "unknown":
            score += 0.1
        if episode_type in {"screen_long_dwell", "screen_intent"}:
            score += 0.1
        return min(score, 1.0)

    def _title(self, context: ScreenContext, episode_type: EpisodeType) -> str:
        app = context.application or "unknown app"
        if episode_type == "screen_long_dwell":
            return f"Long activity in {app}"
        if episode_type == "screen_intent":
            return f"Screen intent in {app}"
        if episode_type == "screen_app_switch":
            return f"Active window in {app}"
        return f"Screen context in {app}"

    def _tags(self, context: ScreenContext, episode_type: EpisodeType) -> list[str]:
        tags = ["screen", episode_type]
        if context.application and context.application != "unknown":
            tags.append(context.application.lower())
        if context.activity_type != "unknown":
            tags.append(context.activity_type)
        return tags
