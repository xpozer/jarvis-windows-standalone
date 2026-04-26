from __future__ import annotations

import csv
import hashlib
import json
import zipfile
from datetime import datetime
from html import escape
from pathlib import Path
from typing import Any

from fastapi import HTTPException

from config import (
    BASE_DIR, DATA_DIR, LOG_DIR, EXPORT_DIR,
    AUDIT_LOG_FILE, WORK_LOG_FILE, FILE_INDEX_FILE, KNOWLEDGE_INDEX_FILE,
    NOTES_FILE, TASKS_FILE, REMINDERS_FILE,
)
from utils import read_json, write_json, log


def _safe_name(name: str, fallback: str = "export") -> str:
    cleaned = "".join(c if c.isalnum() or c in "._- " else "_" for c in (name or "").strip())
    cleaned = cleaned.strip().replace(" ", "_")
    return (cleaned or fallback)[:90]


def _stamp() -> str:
    return datetime.now().strftime("%Y%m%d_%H%M%S")


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def list_export_formats() -> dict[str, Any]:
    return {
        "formats": ["txt", "md", "json", "html", "csv", "zip"],
        "exports_dir": str(EXPORT_DIR),
        "capabilities": [
            "Text als TXT, MD, JSON oder HTML exportieren",
            "Tabellenartige Listen als CSV exportieren",
            "Daten ZIP mit data und ausgewählten logs erzeugen",
            "Audit Log exportieren",
            "Work Agent Logs exportieren",
            "Knowledge Index exportieren",
        ],
    }


def export_text(title: str, content: str, fmt: str = "md") -> dict[str, Any]:
    fmt = (fmt or "md").lower().strip().lstrip(".")
    if fmt not in {"txt", "md", "json", "html"}:
        raise HTTPException(400, "Format erlaubt: txt, md, json, html")
    if not content:
        raise HTTPException(400, "content fehlt")

    name = _safe_name(title)
    path = EXPORT_DIR / f"{_stamp()}_{name}.{fmt}"

    if fmt == "json":
        payload = {"title": title or "Export", "content": content, "created_at": datetime.now().isoformat(timespec="seconds")}
        path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    elif fmt == "html":
        html = (
            "<!doctype html><html><head><meta charset='utf-8'>"
            f"<title>{escape(title or 'JARVIS Export')}</title>"
            "<style>body{font-family:Segoe UI,Arial,sans-serif;max-width:900px;margin:40px auto;line-height:1.5}"
            "pre{white-space:pre-wrap;background:#111;color:#eee;padding:18px;border-radius:12px}</style></head><body>"
            f"<h1>{escape(title or 'JARVIS Export')}</h1><pre>{escape(content)}</pre></body></html>"
        )
        path.write_text(html, encoding="utf-8")
    elif fmt == "md":
        path.write_text(f"# {title or 'JARVIS Export'}\n\n{content}\n", encoding="utf-8")
    else:
        path.write_text(content, encoding="utf-8")

    log("INFO", "export_text", path=str(path), format=fmt)
    return {"ok": True, "path": str(path), "name": path.name, "format": fmt, "sha256": _sha256(path), "size_kb": round(path.stat().st_size / 1024, 1)}


def export_json_file(source: str, fmt: str = "json") -> dict[str, Any]:
    mapping = {
        "audit": AUDIT_LOG_FILE,
        "work_logs": WORK_LOG_FILE,
        "files": FILE_INDEX_FILE,
        "knowledge": KNOWLEDGE_INDEX_FILE,
        "notes": NOTES_FILE,
        "tasks": TASKS_FILE,
        "reminders": REMINDERS_FILE,
    }
    if source not in mapping:
        raise HTTPException(400, f"Unbekannte Quelle: {source}")
    data = read_json(mapping[source], [])
    fmt = (fmt or "json").lower()
    out = EXPORT_DIR / f"{_stamp()}_{source}.{fmt}"
    if fmt == "csv":
        rows = data if isinstance(data, list) else [data]
        keys = sorted({k for row in rows if isinstance(row, dict) for k in row.keys()})
        with out.open("w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=keys)
            writer.writeheader()
            for row in rows:
                if isinstance(row, dict):
                    writer.writerow({k: json.dumps(v, ensure_ascii=False) if isinstance(v, (dict, list)) else v for k, v in row.items()})
    elif fmt == "md":
        out.write_text(f"# Export {source}\n\n```json\n{json.dumps(data, ensure_ascii=False, indent=2)}\n```\n", encoding="utf-8")
    else:
        out.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return {"ok": True, "source": source, "path": str(out), "name": out.name, "sha256": _sha256(out), "size_kb": round(out.stat().st_size / 1024, 1)}


def create_data_export_zip(include_logs: bool = True) -> dict[str, Any]:
    out = EXPORT_DIR / f"{_stamp()}_jarvis_data_export.zip"
    manifest = {
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "base_dir": str(BASE_DIR),
        "include_logs": include_logs,
        "type": "jarvis_data_export",
    }
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("manifest.json", json.dumps(manifest, ensure_ascii=False, indent=2))
        if DATA_DIR.exists():
            for p in DATA_DIR.rglob("*"):
                if p.is_file():
                    z.write(p, p.relative_to(BASE_DIR))
        if include_logs and LOG_DIR.exists():
            for p in LOG_DIR.rglob("*"):
                if p.is_file() and p.stat().st_size <= 5_000_000:
                    z.write(p, p.relative_to(BASE_DIR))
    return {"ok": True, "path": str(out), "name": out.name, "sha256": _sha256(out), "size_kb": round(out.stat().st_size / 1024, 1)}


def list_exports() -> dict[str, Any]:
    items = []
    for p in sorted(EXPORT_DIR.glob("*"), key=lambda x: x.stat().st_mtime, reverse=True):
        if p.is_file():
            items.append({
                "name": p.name,
                "path": str(p),
                "size_kb": round(p.stat().st_size / 1024, 1),
                "modified": datetime.fromtimestamp(p.stat().st_mtime).isoformat(timespec="seconds"),
            })
    return {"exports": items}
