# backend/perception/screen/privacy.py
from __future__ import annotations

from dataclasses import dataclass, field

from .config import ScreenPrivacyConfig
from .models import ActiveWindowInfo, PrivacyDecision


DEFAULT_BLOCKED_APPS = {
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
}

DEFAULT_BLOCKED_TITLE_WORDS = {
    "bank",
    "passwort",
    "password",
    "pin",
    "tan",
    "konto",
    "private",
    "privat",
    "gehalt",
}


@dataclass(slots=True)
class ScreenPrivacyPolicy:
    enabled: bool = False
    paused: bool = False
    allowlist_apps: set[str] = field(default_factory=set)
    blocked_apps: set[str] = field(default_factory=lambda: set(DEFAULT_BLOCKED_APPS))
    blocked_title_words: set[str] = field(default_factory=lambda: set(DEFAULT_BLOCKED_TITLE_WORDS))

    @classmethod
    def from_config(cls, config: ScreenPrivacyConfig) -> "ScreenPrivacyPolicy":
        return cls(
            enabled=config.enabled,
            paused=config.paused,
            allowlist_apps=set(config.allowlist_apps),
            blocked_apps=set(config.blocked_apps),
            blocked_title_words=set(config.blocked_title_words),
        )

    def pause(self) -> None:
        self.paused = True

    def resume(self) -> None:
        self.paused = False

    def decide(self, window: ActiveWindowInfo) -> PrivacyDecision:
        if not self.enabled:
            return PrivacyDecision(allowed=False, reason="screen perception is disabled by default", matched_rule="default_off")

        if self.paused:
            return PrivacyDecision(allowed=False, reason="screen perception is paused", matched_rule="paused")

        app = (window.process_name or window.application or "").lower()
        title = (window.window_title or "").lower()

        for blocked in self.blocked_apps:
            if blocked and blocked in app:
                return PrivacyDecision(allowed=False, reason=f"blocked application: {blocked}", matched_rule="blocked_apps")

        for word in self.blocked_title_words:
            if word and word in title:
                return PrivacyDecision(allowed=False, reason=f"blocked window title word: {word}", matched_rule="blocked_title_words")

        if self.allowlist_apps:
            allowed = any(item.lower() in app for item in self.allowlist_apps)
            if not allowed:
                return PrivacyDecision(allowed=False, reason="application is not in allowlist", matched_rule="allowlist_apps")

        return PrivacyDecision(allowed=True, reason="allowed by privacy policy")
