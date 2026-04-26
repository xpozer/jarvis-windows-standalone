from __future__ import annotations

import json
import shutil
from datetime import datetime
from pathlib import Path
from typing import Any

from config import LOG_FILE, CORRUPT_BACKUP_DIR


def log(level: str, message: str, **extra: Any) -> None:
    row = {"ts": datetime.now().isoformat(timespec="seconds"), "level": level, "message": message, **extra}
    line = json.dumps(row, ensure_ascii=False)
    print(line, flush=True)
    try:
        with LOG_FILE.open("a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass


def read_json(path: Path, default: Any) -> Any:
    if not path.exists():
        return default
    try:
        content = path.read_text(encoding="utf-8")
        if not content.strip():
            return default
        return json.loads(content)
    except Exception as e:
        log("WARN", f"JSON defekt: {path.name} — Backup wird erstellt", error=str(e))
        try:
            ts = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup = CORRUPT_BACKUP_DIR / f"{path.stem}_corrupt_{ts}.json"
            shutil.copy2(path, backup)
            log("INFO", f"Corrupt Backup erstellt: {backup.name}")
        except Exception:
            pass
        return default


def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + ".tmp")
    tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(path)
