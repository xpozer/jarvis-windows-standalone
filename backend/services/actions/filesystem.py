from __future__ import annotations

from typing import Any

from config import BASE_DIR
from services import usejarvis_runtime as rt
from services.actions.common import MAX_READ_BYTES, is_safe_path, resolve_path


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
