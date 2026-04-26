from __future__ import annotations

import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import APIRouter, File, HTTPException, UploadFile

from config import DATA_DIR, FILE_INDEX_FILE
from services import _runtime as core
from services.llm_client import call_llm
from utils import read_json, write_json, log

router = APIRouter(prefix="/api/files", tags=["files"])

UPLOAD_DIR = DATA_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

MAX_UPLOAD_BYTES = 25 * 1024 * 1024


def _safe_filename(name: str) -> str:
    original = Path(name or "upload.bin").name
    cleaned = "".join(ch if ch.isalnum() or ch in ".-_ ()" else "_" for ch in original).strip()
    return cleaned or "upload.bin"


def _load_index() -> list[dict[str, Any]]:
    data = read_json(FILE_INDEX_FILE, [])
    return data if isinstance(data, list) else []


def _save_index(items: list[dict[str, Any]]) -> None:
    write_json(FILE_INDEX_FILE, items[:500])


def _summarize_with_llm(filename: str, extracted_text: str) -> str:
    text = extracted_text.strip()
    if not text:
        return "Die Datei wurde gespeichert, aber es konnte kein Text extrahiert werden."
    prompt = (
        f"Analysiere die Datei '{filename}' kurz und praxisnah auf Deutsch.\n"
        "Gib mir:\n"
        "1. Kurze Zusammenfassung\n"
        "2. Wichtige Punkte\n"
        "3. Auffälligkeiten oder Fehler, falls vorhanden\n"
        "4. Sinnvolle nächste Schritte\n\n"
        "Dateiinhalt:\n"
        f"{text[:12000]}"
    )
    agent = "file"
    messages = core.build_messages(prompt, history=[], memory_facts=[], agent=agent)
    try:
        answer = str(call_llm(messages, getattr(core, "DEFAULT_MODEL", "qwen3:8b"), temperature=0.25, stream=False)).strip()
        return answer or core.summarize_text_basic(text)
    except Exception as exc:
        log("WARN", "Dateianalyse per LLM fehlgeschlagen", filename=filename, error=str(exc))
        return core.summarize_text_basic(text)


@router.post("/upload")
async def upload_file(file: UploadFile = File(...), analyze: bool = True) -> dict[str, Any]:
    raw = await file.read()
    if len(raw) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Datei ist zu groß. Maximum sind 25 MB.")

    upload_id = str(uuid.uuid4())
    safe_name = _safe_filename(file.filename or "upload.bin")
    target = UPLOAD_DIR / f"{upload_id}_{safe_name}"
    target.write_bytes(raw)

    try:
        extracted = core.extract_text_from_upload(safe_name, raw)
    except Exception as exc:
        log("ERROR", "file extraction failed", filename=safe_name, error=str(exc))
        extracted = f"[Textextraktion fehlgeschlagen: {exc}]"

    summary = _summarize_with_llm(safe_name, extracted) if analyze else core.summarize_text_basic(extracted)
    item = {
        "id": upload_id,
        "filename": safe_name,
        "path": str(target),
        "content_type": file.content_type,
        "size_bytes": len(raw),
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "text_preview": extracted[:2000],
    }
    index = _load_index()
    index.insert(0, item)
    _save_index(index)
    return {
        "ok": True,
        "file": item,
        "summary": summary,
        "extracted_chars": len(extracted),
    }


@router.get("")
def list_files() -> dict[str, Any]:
    return {"ok": True, "files": _load_index()}


@router.get("/{file_id}")
def get_file(file_id: str) -> dict[str, Any]:
    for item in _load_index():
        if item.get("id") == file_id:
            return {"ok": True, "file": item}
    raise HTTPException(status_code=404, detail="Datei nicht gefunden")
