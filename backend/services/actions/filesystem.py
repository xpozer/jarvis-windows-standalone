from __future__ import annotations

import shutil
from typing import Any

from config import BASE_DIR
from services import usejarvis_runtime as rt
from services.actions.common import MAX_READ_BYTES, is_safe_path, resolve_path

MAX_WRITE_BYTES = 128_000


def list_dir(path: str | None = None, limit: int = 80) -> dict[str, Any]:
    target = resolve_path(path, BASE_DIR)
    if not is_safe_path(target):
        return {"ok": False, "error": "path_not_allowed", "path": str(target)}
    if not target.exists() or not target.is_dir():
        return {"ok": False, "error": "not_a_directory", "path": str(target)}
    items = []
    for child in sorted(target.iterdir(), key=lambda p: (not p.is_dir(), p.name.lower()))[: max(1, min(500, limit))]:
        try:
            stat = child.stat()
            items.append({"name": child.name, "path": str(child), "type": "dir" if child.is_dir() else "file", "size": stat.st_size, "modified": stat.st_mtime})
        except Exception:
            items.append({"name": child.name, "path": str(child), "type": "unknown"})
    rt.audit("action", "action.filesystem.list_dir", str(target), "low", {"count": len(items)})
    return {"ok": True, "path": str(target), "items": items, "count": len(items)}


def read_file(path: str, max_bytes: int = MAX_READ_BYTES) -> dict[str, Any]:
    target = resolve_path(path, BASE_DIR)
    if not is_safe_path(target):
        return {"ok": False, "error": "path_not_allowed", "path": str(target)}
    if not target.exists() or not target.is_file():
        return {"ok": False, "error": "not_a_file", "path": str(target)}
    size = target.stat().st_size
    if size > max(1024, min(MAX_READ_BYTES, int(max_bytes or MAX_READ_BYTES))):
        return {"ok": False, "error": "file_too_large", "path": str(target), "size": size, "max_bytes": max_bytes}
    try:
        content = target.read_text(encoding="utf-8", errors="replace")
    except Exception as exc:
        return {"ok": False, "error": "read_failed", "detail": str(exc), "path": str(target)}
    rt.audit("action", "action.filesystem.read_file", str(target), "low", {"size": size})
    return {"ok": True, "path": str(target), "size": size, "content": content}


def make_dir(path: str) -> dict[str, Any]:
    target = resolve_path(path, BASE_DIR)
    if not is_safe_path(target):
        return {"ok": False, "error": "path_not_allowed", "path": str(target)}
    if target.exists() and not target.is_dir():
        return {"ok": False, "error": "path_exists_not_directory", "path": str(target)}
    target.mkdir(parents=True, exist_ok=True)
    rt.audit("action", "action.filesystem.make_dir", str(target), "high", {})
    return {"ok": True, "path": str(target), "created": True}


def write_text_file(path: str, content: str, overwrite: bool = False) -> dict[str, Any]:
    target = resolve_path(path, BASE_DIR)
    if not is_safe_path(target):
        return {"ok": False, "error": "path_not_allowed", "path": str(target)}
    encoded = (content or "").encode("utf-8")
    if len(encoded) > MAX_WRITE_BYTES:
        return {"ok": False, "error": "content_too_large", "size": len(encoded), "max_bytes": MAX_WRITE_BYTES}
    if target.exists() and not overwrite:
        return {"ok": False, "error": "file_exists", "path": str(target), "overwrite_required": True}
    if target.exists() and not target.is_file():
        return {"ok": False, "error": "target_not_file", "path": str(target)}
    target.parent.mkdir(parents=True, exist_ok=True)
    if not is_safe_path(target.parent):
        return {"ok": False, "error": "parent_path_not_allowed", "path": str(target.parent)}
    target.write_text(content or "", encoding="utf-8")
    rt.audit("action", "action.filesystem.write_text_file", str(target), "high", {"size": len(encoded), "overwrite": overwrite})
    return {"ok": True, "path": str(target), "size": len(encoded), "overwritten": bool(overwrite)}


def copy_file(source: str, destination: str, overwrite: bool = False) -> dict[str, Any]:
    src = resolve_path(source, BASE_DIR)
    dst = resolve_path(destination, BASE_DIR)
    if not is_safe_path(src) or not is_safe_path(dst):
        return {"ok": False, "error": "path_not_allowed", "source": str(src), "destination": str(dst)}
    if not src.exists() or not src.is_file():
        return {"ok": False, "error": "source_not_file", "source": str(src)}
    if dst.exists() and not overwrite:
        return {"ok": False, "error": "destination_exists", "destination": str(dst), "overwrite_required": True}
    dst.parent.mkdir(parents=True, exist_ok=True)
    if not is_safe_path(dst.parent):
        return {"ok": False, "error": "parent_path_not_allowed", "destination": str(dst)}
    shutil.copy2(src, dst)
    rt.audit("action", "action.filesystem.copy_file", f"{src} -> {dst}", "high", {"overwrite": overwrite})
    return {"ok": True, "source": str(src), "destination": str(dst), "size": dst.stat().st_size, "overwritten": bool(overwrite)}
