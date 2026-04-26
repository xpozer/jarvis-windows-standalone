"""
JARVIS Awareness Pipeline
Erfasst zyklisch den Desktop-Kontext:
- Welche App ist aktiv (SAP, Outlook, Browser, PDF...)
- Fenstertitel (enthaelt oft Transaktionscodes, Dateinamen, Normen)
- Kategorie + Hinweise

Der Orchestrator nutzt diese Info um proaktiv den richtigen Agenten vorzuschlagen.
"""

import json
import subprocess
import threading
import time
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, field, asdict
from datetime import datetime
from collections import deque

SCRIPT = Path(__file__).parent / "capture_context.ps1"

@dataclass
class ContextSnapshot:
    timestamp:    str = ""
    app:          str = ""
    appPath:      str = ""
    windowTitle:  str = ""
    category:     str = "other"
    hints:        list = field(default_factory=list)
    error:        str = ""


class AwarenessPipeline:
    """Laeuft als Background-Thread, erfasst alle N Sekunden den Kontext."""

    def __init__(self, interval: float = 7.0, history_size: int = 20):
        self.interval = interval
        self.history: deque[ContextSnapshot] = deque(maxlen=history_size)
        self.current: ContextSnapshot = ContextSnapshot()
        self._running = False
        self._thread: Optional[threading.Thread] = None
        self._lock = threading.Lock()
        # Session-Tracking: wie lange in welcher App
        self.session_start: dict[str, float] = {}
        self.session_durations: dict[str, float] = {}

    def start(self):
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._loop, daemon=True)
        self._thread.start()

    def stop(self):
        self._running = False

    def _capture(self) -> ContextSnapshot:
        try:
            r = subprocess.run(
                ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass",
                 "-File", str(SCRIPT)],
                capture_output=True, text=True, timeout=5
            )
            if r.returncode != 0 or not r.stdout.strip():
                return ContextSnapshot(error=r.stderr.strip() or "Kein Output")
            data = json.loads(r.stdout.strip())
            if "error" in data:
                return ContextSnapshot(error=data["error"])
            return ContextSnapshot(**{k: data[k] for k in data if k in ContextSnapshot.__dataclass_fields__})
        except Exception as e:
            return ContextSnapshot(error=str(e))

    def _loop(self):
        while self._running:
            snap = self._capture()
            now = time.time()

            with self._lock:
                prev_cat = self.current.category
                self.current = snap
                self.history.append(snap)

                # Session-Tracking
                cat = snap.category
                if cat != prev_cat:
                    if prev_cat in self.session_start:
                        dur = now - self.session_start[prev_cat]
                        self.session_durations[prev_cat] = self.session_durations.get(prev_cat, 0) + dur
                    self.session_start[cat] = now

            time.sleep(self.interval)

    def get_current(self) -> dict:
        with self._lock:
            return asdict(self.current)

    def get_history(self, n: int = 10) -> list:
        with self._lock:
            items = list(self.history)[-n:]
            return [asdict(s) for s in items]

    def get_sessions(self) -> dict:
        with self._lock:
            # Aktive Session auch mitzaehlen
            now = time.time()
            result = dict(self.session_durations)
            cat = self.current.category
            if cat in self.session_start:
                result[cat] = result.get(cat, 0) + (now - self.session_start[cat])
            return {k: round(v, 1) for k, v in result.items()}

    def get_context_for_orchestrator(self) -> str:
        """Kompakte Zusammenfassung fuer den Routing-Prompt."""
        snap = self.get_current()
        if snap.get("error"):
            return ""
        parts = []
        cat = snap.get("category", "other")
        app = snap.get("app", "")
        title = snap.get("windowTitle", "")
        hints = snap.get("hints", [])

        if cat != "other":
            parts.append(f"Aktive App: {app} ({cat})")
        if title:
            # Titel kuerzen
            short_title = title[:80] + "..." if len(title) > 80 else title
            parts.append(f"Fenster: {short_title}")
        if hints:
            parts.append(f"Erkannt: {', '.join(hints)}")

        return "\n".join(parts)


# Singleton
_pipeline: Optional[AwarenessPipeline] = None

def get_pipeline() -> AwarenessPipeline:
    global _pipeline
    if _pipeline is None:
        _pipeline = AwarenessPipeline()
        _pipeline.start()
    return _pipeline


# ── FastAPI Routes ────────────────────────────────────────────────────
def create_awareness_router():
    from fastapi import APIRouter
    router = APIRouter(tags=["awareness"])

    @router.get("/current")
    async def get_current_context():
        return get_pipeline().get_current()

    @router.get("/history")
    async def get_context_history(n: int = 10):
        return {"history": get_pipeline().get_history(n)}

    @router.get("/sessions")
    async def get_session_durations():
        return {"sessions": get_pipeline().get_sessions()}

    @router.get("/summary")
    async def get_context_summary():
        return {"summary": get_pipeline().get_context_for_orchestrator()}

    return router
