from __future__ import annotations

import ctypes
import os
import platform
import subprocess
from datetime import datetime, timezone
from typing import Any

from services import usejarvis_runtime


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _run(cmd: list[str], timeout: int = 3) -> tuple[int, str, str]:
    try:
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout, shell=False)
        return proc.returncode, proc.stdout or "", proc.stderr or ""
    except Exception as exc:
        return 1, "", str(exc)


def _active_window_windows() -> dict[str, Any]:
    try:
        user32 = ctypes.windll.user32
        kernel32 = ctypes.windll.kernel32
        hwnd = user32.GetForegroundWindow()
        length = user32.GetWindowTextLengthW(hwnd)
        buff = ctypes.create_unicode_buffer(length + 1)
        user32.GetWindowTextW(hwnd, buff, length + 1)
        pid = ctypes.c_ulong()
        user32.GetWindowThreadProcessId(hwnd, ctypes.byref(pid))
        process_id = int(pid.value)
        process_name = None
        if process_id:
            code, out, _ = _run(["tasklist", "/FI", f"PID eq {process_id}", "/FO", "CSV", "/NH"], timeout=3)
            if code == 0 and out.strip():
                first = out.strip().splitlines()[0]
                if first.startswith('"'):
                    process_name = first.split('","', 1)[0].strip('"')
                else:
                    process_name = first.split(",", 1)[0].strip('"')
        return {
            "platform": "windows",
            "hwnd": int(hwnd),
            "pid": process_id,
            "process_name": process_name,
            "window_title": buff.value,
        }
    except Exception as exc:
        return {"platform": "windows", "error": str(exc)}


def _process_snapshot(limit: int = 12) -> list[dict[str, Any]]:
    if platform.system().lower() != "windows":
        return []
    code, out, _ = _run(["tasklist", "/FO", "CSV", "/NH"], timeout=4)
    if code != 0:
        return []
    rows: list[dict[str, Any]] = []
    for line in out.splitlines()[: max(1, limit)]:
        clean = line.strip()
        if not clean:
            continue
        parts = [p.strip('"') for p in clean.split('","')]
        if len(parts) >= 2:
            rows.append({"image": parts[0], "pid": parts[1], "session": parts[2] if len(parts) > 2 else None, "memory": parts[-1] if parts else None})
    return rows


def _classify_activity(active: dict[str, Any]) -> dict[str, Any]:
    title = str(active.get("window_title") or "").lower()
    proc = str(active.get("process_name") or "").lower()
    text = f"{proc} {title}"
    if any(x in text for x in ["code.exe", "visual studio code", "main.tsx", ".py", ".tsx", ".ts", "github"]):
        return {"category": "development", "summary": "Der Nutzer arbeitet wahrscheinlich an Code oder Repository Dateien.", "confidence": 0.82}
    if any(x in text for x in ["chrome", "edge", "firefox", "browser"]):
        return {"category": "browser", "summary": "Der Nutzer arbeitet im Browser.", "confidence": 0.70}
    if any(x in text for x in ["powershell", "cmd.exe", "terminal", "windows terminal"]):
        return {"category": "terminal", "summary": "Der Nutzer arbeitet im Terminal oder an Startskripten.", "confidence": 0.78}
    if any(x in text for x in ["outlook", "mail"]):
        return {"category": "communication", "summary": "Der Nutzer arbeitet wahrscheinlich an E Mail oder Kommunikation.", "confidence": 0.72}
    if any(x in text for x in ["sap", "excel", "word", "acrobat"]):
        return {"category": "office_work", "summary": "Der Nutzer arbeitet wahrscheinlich an fachlichen oder organisatorischen Unterlagen.", "confidence": 0.68}
    return {"category": "unknown", "summary": "Aktivität erkannt, aber noch keiner Kategorie sicher zugeordnet.", "confidence": 0.35}


def capture_snapshot(write_event: bool = True) -> dict[str, Any]:
    system = platform.system().lower()
    active = _active_window_windows() if system == "windows" else {"platform": system, "window_title": None, "process_name": None, "note": "Active window capture is implemented for Windows first."}
    activity = _classify_activity(active)
    snapshot = {
        "ok": True,
        "captured_at": now_iso(),
        "host": platform.node(),
        "os": platform.platform(),
        "cwd": os.getcwd(),
        "active_window": active,
        "activity": activity,
        "processes": _process_snapshot(limit=12),
        "privacy": {
            "mode": "local_first",
            "screenshots_saved": False,
            "ocr_enabled": False,
            "cloud_vision": False,
        },
    }
    if write_event:
        usejarvis_runtime.set_awareness_event(
            event_type="snapshot",
            app_name=str(active.get("process_name") or "unknown"),
            window_title=str(active.get("window_title") or ""),
            summary=activity["summary"],
            payload=snapshot,
        )
        usejarvis_runtime.audit("awareness", "awareness.snapshot", activity["summary"], "low", {"category": activity["category"], "confidence": activity["confidence"]})
    return snapshot


def awareness_status() -> dict[str, Any]:
    current = usejarvis_runtime.current_awareness()
    return {
        "ok": True,
        "mode": "local_first",
        "capture": "active_window_process_snapshot",
        "ocr": "planned",
        "screen_vision": "planned",
        "current": current,
    }
