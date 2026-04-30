from __future__ import annotations

import os
import platform
from typing import Any

from config import BASE_DIR, DATA_DIR
from services import usejarvis_runtime as rt
from services.actions.common import run_process


def system_info() -> dict[str, Any]:
    data = {
        "ok": True,
        "platform": platform.platform(),
        "system": platform.system(),
        "release": platform.release(),
        "machine": platform.machine(),
        "node": platform.node(),
        "python": platform.python_version(),
        "cwd": os.getcwd(),
        "base_dir": str(BASE_DIR),
        "data_dir": str(DATA_DIR),
    }
    rt.audit("action", "action.system.info", "System Info gelesen", "low", {})
    return data


def process_list(limit: int = 50) -> dict[str, Any]:
    if platform.system().lower() != "windows":
        return {"ok": False, "error": "windows_only_first", "processes": []}
    code, out, err = run_process(["tasklist", "/FO", "CSV", "/NH"], timeout=6)
    processes = []
    if code == 0:
        for line in out.splitlines()[: max(1, min(200, limit))]:
            parts = [p.strip('"') for p in line.strip().split('","')]
            if len(parts) >= 2:
                processes.append({"image": parts[0], "pid": parts[1], "session": parts[2] if len(parts) > 2 else None, "memory": parts[-1]})
    rt.audit("action", "action.process.list", "Prozessliste gelesen", "low", {"count": len(processes)})
    return {"ok": code == 0, "returncode": code, "processes": processes, "stderr": err}
