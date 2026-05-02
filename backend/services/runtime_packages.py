from __future__ import annotations

import json
import platform
import re
import shutil
import sys
import zipfile
from collections.abc import Callable
from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import HTTPException

from config import BACKUP_DIR, BASE_DIR, DATA_DIR, DIAG_DIR, LOG_DIR

RUNTIME_VERSION = "B4.0.0"


def now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def app_version() -> str:
    return RUNTIME_VERSION


def create_backup(label: str = "") -> dict:
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_label = re.sub(r"[^A-Za-z0-9_.-]+", "_", label.strip())[:50] if label else "manual"
    backup_path = BACKUP_DIR / f"jarvis_backup_{ts}_{safe_label}.zip"
    include_dirs = [DATA_DIR, LOG_DIR]
    manifest = {
        "version": app_version(),
        "created_at": now_iso(),
        "label": label or "manual",
        "base_dir": str(BASE_DIR),
        "included": [str(p.relative_to(BASE_DIR)) for p in include_dirs if p.exists()],
    }
    with zipfile.ZipFile(backup_path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("manifest.json", json.dumps(manifest, ensure_ascii=False, indent=2))
        for folder in include_dirs:
            if not folder.exists():
                continue
            for p in folder.rglob("*"):
                if p.is_file():
                    z.write(p, p.relative_to(BASE_DIR))
    return {
        "ok": True,
        "path": str(backup_path),
        "manifest": manifest,
        "size_kb": round(backup_path.stat().st_size / 1024, 1),
    }


def list_backups() -> list[dict]:
    items = []
    for p in sorted(BACKUP_DIR.glob("jarvis_backup_*.zip"), key=lambda x: x.stat().st_mtime, reverse=True):
        items.append({
            "name": p.name,
            "path": str(p),
            "size_kb": round(p.stat().st_size / 1024, 1),
            "modified": datetime.fromtimestamp(p.stat().st_mtime).isoformat(timespec="seconds"),
        })
    return items


def restore_backup(name: str) -> dict:
    candidate = BACKUP_DIR / Path(name).name
    if not candidate.exists() or not candidate.is_file():
        raise HTTPException(404, "Backup nicht gefunden")
    pre = create_backup("pre_restore")
    restored = []
    with zipfile.ZipFile(candidate, "r") as z:
        for member in z.namelist():
            if member == "manifest.json" or member.endswith("/"):
                continue
            target = (BASE_DIR / member).resolve()
            data_root = str(DATA_DIR.resolve()).lower()
            log_root = str(LOG_DIR.resolve()).lower()
            if not (str(target).lower().startswith(data_root) or str(target).lower().startswith(log_root)):
                continue
            target.parent.mkdir(parents=True, exist_ok=True)
            with z.open(member) as src, open(target, "wb") as dst:
                shutil.copyfileobj(src, dst)
            restored.append(member)
    return {"ok": True, "restored": restored, "pre_restore_backup": pre}


def create_diagnostics_zip(self_check_payload: Callable[[], dict[str, Any]] | None = None) -> dict:
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    diag_path = DIAG_DIR / f"jarvis_diagnostics_{ts}.zip"
    manifest = {
        "version": app_version(),
        "created_at": now_iso(),
        "platform": platform.platform(),
        "python": sys.version,
        "base_dir": str(BASE_DIR),
        "self_check": self_check_payload() if self_check_payload else {},
    }
    with zipfile.ZipFile(diag_path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("manifest.json", json.dumps(manifest, ensure_ascii=False, indent=2))
        for folder in [LOG_DIR, DATA_DIR]:
            if not folder.exists():
                continue
            for p in folder.rglob("*"):
                if p.is_file() and p.stat().st_size <= 2_000_000:
                    z.write(p, p.relative_to(BASE_DIR))
        for name in ["README_START.txt", "JARVIS_INSTALL_CONFIG.json"]:
            p = BASE_DIR / name
            if p.exists():
                z.write(p, p.relative_to(BASE_DIR))
    return {"ok": True, "path": str(diag_path), "size_kb": round(diag_path.stat().st_size / 1024, 1)}
