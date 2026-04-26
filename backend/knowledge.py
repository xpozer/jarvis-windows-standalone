"""
JARVIS Knowledge Index — Block 3
Dokumente importieren, in Chunks zerlegen, suchen, Zusammenfassung aus Treffern.
Kategorien: Arbeit, E41, SAP, FSM, CATS, LNW, VDE, Prüfung, Kosten, Personen, Projekte, Allgemein
"""
from __future__ import annotations
import json
import re
import uuid
from datetime import datetime
from pathlib import Path
from typing import Optional

INDEX_FILE = Path(__file__).resolve().parent.parent / "data" / "knowledge_index.json"

CATEGORIES = [
    "Arbeit", "E41", "SAP", "FSM", "CATS", "LNW", "VDE",
    "Prüfung", "Kosten", "Personen", "Projekte", "Allgemein",
]

CHUNK_SIZE    = 1000
CHUNK_OVERLAP = 100
MAX_CHUNKS    = 1000


# ── Hilfsfunktionen ───────────────────────────────────────────────────────────

def _load() -> list[dict]:
    if not INDEX_FILE.exists():
        return []
    try:
        content = INDEX_FILE.read_text(encoding="utf-8")
        if not content.strip():
            return []
        data = json.loads(content)
        return data if isinstance(data, list) else []
    except Exception:
        return []


def _save(records: list[dict]) -> None:
    INDEX_FILE.parent.mkdir(parents=True, exist_ok=True)
    tmp = INDEX_FILE.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(records, ensure_ascii=False, indent=2), encoding="utf-8")
    tmp.replace(INDEX_FILE)


def _chunk(text: str) -> list[str]:
    text = (text or "").replace("\r", "").strip()
    if not text:
        return []
    chunks, i = [], 0
    while i < len(text) and len(chunks) < MAX_CHUNKS:
        chunk = text[i:i + CHUNK_SIZE].strip()
        if chunk:
            chunks.append(chunk)
        i += max(1, CHUNK_SIZE - CHUNK_OVERLAP)
    return chunks


def _score(text: str, terms: list[str], query: str) -> int:
    low = text.lower()
    score = sum(low.count(t) for t in terms)
    if query in low:
        score += 5
    # Bonus für Begriffe am Anfang (Titel-Nähe)
    if any(low.startswith(t) for t in terms):
        score += 3
    return score


def _auto_category(text: str, title: str) -> str:
    combined = (title + " " + text).lower()
    rules = [
        ("VDE",      ["vde", "dguv", "norm", "0100", "0105", "elektrisch"]),
        ("SAP",      ["sap", "pm", "iw31", "iw32", "iw38", "meldung", "auftrag"]),
        ("FSM",      ["fsm", "field service"]),
        ("CATS",     ["cats", "zeitbuchung", "stunden buchen"]),
        ("LNW",      ["lnw", "leistungsnachweis"]),
        ("Prüfung",  ["prüfung", "pruefung", "prüfbericht", "prüfprotokoll"]),
        ("Kosten",   ["kosten", "stundensatz", "aufwand", "rechnung"]),
        ("E41",      ["e41", "e-41"]),
        ("Personen", ["kollege", "mitarbeiter", "team", "chef"]),
        ("Projekte", ["projekt", "vorhaben", "umbau"]),
        ("Arbeit",   ["arbeitsplan", "wartung", "instandhaltung"]),
    ]
    for cat, keywords in rules:
        if any(k in combined for k in keywords):
            return cat
    return "Allgemein"


# ── Public API ────────────────────────────────────────────────────────────────

def import_text(
    text: str,
    title: str,
    category: Optional[str] = None,
    source_type: str = "manual",
    filename: Optional[str] = None,
) -> dict:
    """Text importieren, chunken und in den Index aufnehmen."""
    text = text.strip()
    if not text:
        return {"ok": False, "error": "Text ist leer", "chunks": 0}

    doc_id   = str(uuid.uuid4())[:12]
    cat      = category if category in CATEGORIES else _auto_category(text, title)
    chunks   = _chunk(text)
    ts       = datetime.now().isoformat(timespec="seconds")
    records  = _load()

    # Alte Chunks dieser Quelle (gleicher Titel + source_type) entfernen
    records = [r for r in records if not (
        r.get("title") == title and r.get("source_type") == source_type
    )]

    for idx, chunk in enumerate(chunks):
        records.append({
            "id":          str(uuid.uuid4())[:8],
            "doc_id":      doc_id,
            "title":       title,
            "category":    cat,
            "source_type": source_type,
            "filename":    filename or title,
            "chunk_no":    idx,
            "chunk_total": len(chunks),
            "text":        chunk,
            "preview":     chunk[:120],
            "imported_at": ts,
        })

    _save(records)
    return {
        "ok":         True,
        "doc_id":     doc_id,
        "title":      title,
        "category":   cat,
        "chunks":     len(chunks),
        "imported_at": ts,
    }


def search(
    query: str,
    limit: int = 10,
    category: Optional[str] = None,
    source_type: Optional[str] = None,
) -> dict:
    """Suche im Index. Gibt Treffer mit Quelle, Score und Preview zurück."""
    q = (query or "").lower().strip()
    if not q:
        return {"query": query, "results": [], "total": 0}

    records = _load()
    terms   = [t for t in re.findall(r"[a-zA-ZÄÖÜäöüß0-9_-]{2,}", q)]

    # Filter
    if category:
        records = [r for r in records if r.get("category") == category]
    if source_type:
        records = [r for r in records if r.get("source_type") == source_type]

    scored = []
    for r in records:
        s = _score(r.get("text", ""), terms, q)
        if s > 0:
            scored.append({**r, "score": s})

    scored.sort(key=lambda x: x["score"], reverse=True)
    top = scored[:limit]

    # Preview kürzen
    for r in top:
        r["preview"] = r.get("text", "")[:200]

    return {
        "query":   query,
        "results": top,
        "total":   len(scored),
    }


def summarize_results(results: list[dict], query: str) -> str:
    """Erstellt eine Zusammenfassung aus mehreren Suchergebnissen mit Quellenangaben."""
    if not results:
        return f"Keine Treffer für '{query}' im lokalen Wissensindex."

    lines = [f"Lokales Wissen zu '{query}':\n"]
    seen_docs: set[str] = set()

    for r in results[:5]:
        doc_id = r.get("doc_id", r.get("id", ""))
        title  = r.get("title", "Unbekannt")
        cat    = r.get("category", "")
        chunk  = r.get("chunk_no", 0)
        total  = r.get("chunk_total", 1)
        text   = r.get("text", "")[:300]

        source_label = f"{title}"
        if cat:
            source_label += f" [{cat}]"
        if total > 1:
            source_label += f" (Abschnitt {chunk + 1}/{total})"

        lines.append(f"— {source_label}")
        lines.append(f"  {text}")
        if doc_id not in seen_docs:
            seen_docs.add(doc_id)

    lines.append(f"\nQuellen: {len(seen_docs)} Dokument(e)")
    return "\n".join(lines)


def list_documents() -> list[dict]:
    """Gibt alle indizierten Dokumente als Übersicht zurück (ein Eintrag pro Dokument)."""
    records = _load()
    docs: dict[str, dict] = {}
    for r in records:
        doc_id = r.get("doc_id", r.get("id"))
        if doc_id not in docs:
            docs[doc_id] = {
                "doc_id":      doc_id,
                "title":       r.get("title"),
                "category":    r.get("category"),
                "source_type": r.get("source_type"),
                "filename":    r.get("filename"),
                "chunks":      0,
                "imported_at": r.get("imported_at"),
            }
        docs[doc_id]["chunks"] += 1
    return sorted(docs.values(), key=lambda x: x.get("imported_at", ""), reverse=True)


def delete_document(doc_id: str) -> dict:
    """Löscht alle Chunks eines Dokuments aus dem Index."""
    records = _load()
    before  = len(records)
    records = [r for r in records if r.get("doc_id") != doc_id]
    _save(records)
    return {"ok": True, "deleted_chunks": before - len(records)}


def get_stats() -> dict:
    records  = _load()
    by_cat: dict[str, int] = {}
    by_type: dict[str, int] = {}
    doc_ids: set[str] = set()
    for r in records:
        cat  = r.get("category", "Allgemein")
        stype = r.get("source_type", "manual")
        doc_ids.add(r.get("doc_id", r.get("id", "")))
        by_cat[cat]   = by_cat.get(cat, 0) + 1
        by_type[stype] = by_type.get(stype, 0) + 1
    return {
        "total_chunks":    len(records),
        "total_documents": len(doc_ids),
        "by_category":     by_cat,
        "by_source_type":  by_type,
        "categories":      CATEGORIES,
    }


def rebuild_from_notes_and_files(
    notes: list[dict],
    file_index: list[dict],
    work_memory: dict,
) -> dict:
    """Baut den Index aus vorhandenen Notizen, Dateien und Arbeitswissen neu auf."""
    records = []
    ts = datetime.now().isoformat(timespec="seconds")

    for n in notes:
        text = str(n.get("text") or "").strip()
        if not text:
            continue
        cat = _auto_category(text, "Notiz")
        records.append({
            "id":          str(uuid.uuid4())[:8],
            "doc_id":      n.get("id", str(uuid.uuid4())[:8]),
            "title":       "Notiz",
            "category":    cat,
            "source_type": "note",
            "filename":    "notes.json",
            "chunk_no":    0,
            "chunk_total": 1,
            "text":        text[:CHUNK_SIZE],
            "preview":     text[:120],
            "imported_at": n.get("created_at", ts),
        })

    for d in file_index:
        text = str(d.get("text_preview") or d.get("summary") or "").strip()
        if not text:
            continue
        title  = d.get("name", "Unbekannte Datei")
        cat    = _auto_category(text, title)
        chunks = _chunk(text)
        doc_id = d.get("id", str(uuid.uuid4())[:8])
        for idx, chunk in enumerate(chunks):
            records.append({
                "id":          str(uuid.uuid4())[:8],
                "doc_id":      doc_id,
                "title":       title,
                "category":    cat,
                "source_type": "file",
                "filename":    title,
                "chunk_no":    idx,
                "chunk_total": len(chunks),
                "text":        chunk,
                "preview":     chunk[:120],
                "imported_at": d.get("indexed_at", ts),
            })

    if isinstance(work_memory, dict):
        for cat_key, entries in work_memory.items():
            if isinstance(entries, dict):
                for key, item in entries.items():
                    text = json.dumps(item, ensure_ascii=False)[:CHUNK_SIZE]
                    records.append({
                        "id":          str(uuid.uuid4())[:8],
                        "doc_id":      f"wm_{cat_key}_{key}",
                        "title":       f"{cat_key}/{key}",
                        "category":    _auto_category(text, key),
                        "source_type": "work_memory",
                        "filename":    "work_memory.json",
                        "chunk_no":    0,
                        "chunk_total": 1,
                        "text":        text,
                        "preview":     text[:120],
                        "imported_at": ts,
                    })

    _save(records)
    return {"ok": True, "chunks": len(records), "updated_at": ts}
