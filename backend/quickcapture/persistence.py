# backend/quickcapture/persistence.py
"""SQLite Speicher fuer Quick Capture."""

from __future__ import annotations

import sqlite3
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from uuid import uuid4

from .classifier import ClassifiedCapture, CaptureCategory


@dataclass(frozen=True)
class CaptureRecord:
    """Persistierter Quick Capture Eintrag."""

    id: str
    text: str
    category: CaptureCategory
    target: str
    confidence: float
    reason: str
    created_at: str
    corrected_category: CaptureCategory | None = None


class QuickCaptureStore:
    """Speichert Quick Capture Eintraege lokal in SQLite."""

    def __init__(self, db_path: Path | str = "local_data/quickcapture.sqlite3") -> None:
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def save(self, classified: ClassifiedCapture) -> CaptureRecord:
        """Speichert ein klassifiziertes Capture und gibt den Datensatz zurueck."""
        record = CaptureRecord(
            id=str(uuid4()),
            text=classified.text,
            category=classified.category,
            target=classified.target,
            confidence=classified.confidence,
            reason=classified.reason,
            created_at=datetime.now(UTC).isoformat(),
        )
        with self._connect() as connection:
            connection.execute(
                """
                INSERT INTO captures(id, text, category, target, confidence, reason, created_at, corrected_category)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    record.id,
                    record.text,
                    record.category.value,
                    record.target,
                    record.confidence,
                    record.reason,
                    record.created_at,
                    None,
                ),
            )
        return record

    def reclassify(self, capture_id: str, category: CaptureCategory) -> None:
        """Speichert eine manuelle Korrektur als Negative Sample Basis."""
        with self._connect() as connection:
            connection.execute(
                "UPDATE captures SET corrected_category = ? WHERE id = ?",
                (category.value, capture_id),
            )

    def list_recent(self, limit: int = 50) -> list[CaptureRecord]:
        """Liest die letzten Capture Eintraege."""
        safe_limit = max(1, min(limit, 500))
        with self._connect() as connection:
            rows = connection.execute(
                """
                SELECT id, text, category, target, confidence, reason, created_at, corrected_category
                FROM captures
                ORDER BY created_at DESC
                LIMIT ?
                """,
                (safe_limit,),
            ).fetchall()
        return [self._row_to_record(row) for row in rows]

    def _init_db(self) -> None:
        with self._connect() as connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS captures (
                    id TEXT PRIMARY KEY,
                    text TEXT NOT NULL,
                    category TEXT NOT NULL,
                    target TEXT NOT NULL,
                    confidence REAL NOT NULL,
                    reason TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    corrected_category TEXT
                )
                """
            )
            connection.execute("CREATE INDEX IF NOT EXISTS idx_captures_created_at ON captures(created_at)")
            connection.execute("CREATE INDEX IF NOT EXISTS idx_captures_category ON captures(category)")

    def _connect(self) -> sqlite3.Connection:
        return sqlite3.connect(self.db_path)

    def _row_to_record(self, row: tuple[object, ...]) -> CaptureRecord:
        return CaptureRecord(
            id=str(row[0]),
            text=str(row[1]),
            category=CaptureCategory(str(row[2])),
            target=str(row[3]),
            confidence=float(row[4]),
            reason=str(row[5]),
            created_at=str(row[6]),
            corrected_category=CaptureCategory(str(row[7])) if row[7] else None,
        )
