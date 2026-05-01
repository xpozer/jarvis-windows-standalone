# backend/perception/screen/window_tracker.py
from __future__ import annotations

from .models import ActiveWindowInfo


class WindowTracker:
    def get_active_window(self) -> ActiveWindowInfo:
        try:
            return self._get_windows_active_window()
        except Exception:
            return ActiveWindowInfo()

    def _get_windows_active_window(self) -> ActiveWindowInfo:
        try:
            import win32gui
            import win32process
            import psutil
        except Exception:
            return ActiveWindowInfo()

        handle = win32gui.GetForegroundWindow()
        title = win32gui.GetWindowText(handle) or ""
        _, pid = win32process.GetWindowThreadProcessId(handle)
        process_name = "unknown"
        application = "unknown"

        if pid:
            process = psutil.Process(pid)
            process_name = process.name() or "unknown"
            application = process_name.rsplit(".", 1)[0]

        return ActiveWindowInfo(
            application=application,
            process_name=process_name,
            window_title=title,
            pid=pid,
        )
