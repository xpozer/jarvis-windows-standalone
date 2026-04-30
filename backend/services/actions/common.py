from __future__ import annotations

import subprocess
from pathlib import Path

from config import BASE_DIR, DATA_DIR, UPLOAD_DIR

SAFE_ROOTS = [BASE_DIR, DATA_DIR, UPLOAD_DIR, Path.home()]
MAX_READ_BYTES = 512_000


def run_process(cmd: list[str], cwd: Path | None = None, timeout: int = 8) -> tuple[int, str, str]:
    try:
        proc = subprocess.run(cmd, cwd=str(cwd) if cwd else None, capture_output=True, text=True, timeout=timeout, shell=False)
        return proc.returncode, proc.stdout or "", proc.stderr or ""
    except Exception as exc:
        return 1, "", str(exc)


def resolve_path(raw: str | None, default: Path | None = None) -> Path:
    if not raw:
        return (default or BASE_DIR).resolve()
    candidate = Path(raw).expanduser()
    if not candidate.is_absolute():
        candidate = (BASE_DIR / candidate).resolve()
    else:
        candidate = candidate.resolve()
    return candidate


def is_safe_path(path: Path) -> bool:
    try:
        resolved = path.resolve()
        for root in SAFE_ROOTS:
            try:
                resolved.relative_to(root.resolve())
                return True
            except ValueError:
                continue
    except Exception:
        return False
    return False
