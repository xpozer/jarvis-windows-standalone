# backend/quickcapture/classifier.py
"""Regelbasierte Erstklassifikation fuer Quick Capture."""

from __future__ import annotations

import re
from dataclasses import dataclass
from enum import StrEnum


class CaptureCategory(StrEnum):
    """Zielkategorien fuer schnelle Erfassungen."""

    REMINDER = "reminder"
    BANF = "banf-vorbereitung"
    LEARNING = "learning"
    TASK = "task"
    IDEA = "idea"
    NOTE = "note"


@dataclass(frozen=True)
class ClassifiedCapture:
    """Ergebnis der Quick Capture Klassifikation."""

    text: str
    category: CaptureCategory
    confidence: float
    reason: str
    target: str


class QuickCaptureClassifier:
    """Klassifiziert kurze Eingaben ohne Cloud Call.

    Die Regeln sind absichtlich transparent. Ein lokaler Agent Router kann spaeter
    dahinter geschaltet werden, ohne das Speicherformat zu aendern.
    """

    _reminder_terms = (
        "morgen",
        "spaeter",
        "später",
        "naechste woche",
        "nächste woche",
        "heute",
        "um ",
        "erinner",
        "termin",
    )
    _learning_terms = ("bwha", "mikp", "zib", "ntg", "ihk", "meister", "lern", "karteikarte")
    _idea_terms = ("jarvis", "ultron", "excel", "tool", "script", "skript", "dashboard")
    _banf_terms = ("banf", "material", "lieferant", "bestellen", "angebot", "stueck", "stück", "kabel", "hager", "spelsberg")
    _task_verbs = ("pruefen", "prüfen", "klaeren", "klären", "rufen", "schreiben", "erstellen", "nachfragen", "senden", "bauen")

    _date_pattern = re.compile(r"\b(\d{1,2}\.\d{1,2}\.?|\d{1,2}:\d{2}|kw\s?\d{1,2})\b", re.IGNORECASE)
    _amount_pattern = re.compile(r"\b\d+\s?(stk|stueck|stück|m|meter|mm2|mm²|a|v)\b", re.IGNORECASE)

    def classify(self, text: str, *, force_plain_note: bool = False) -> ClassifiedCapture:
        """Gibt eine lokale Erstklassifikation fuer den Capture Text zurueck."""
        cleaned = " ".join(text.strip().split())
        lowered = cleaned.lower()

        if force_plain_note:
            return self._result(cleaned, CaptureCategory.NOTE, 1.0, "manuell ohne Klassifikation", "quick-notes")
        if not cleaned:
            return self._result(cleaned, CaptureCategory.NOTE, 0.0, "leere Eingabe", "quick-notes")
        if self._has_any(lowered, self._reminder_terms) or self._date_pattern.search(lowered):
            return self._result(cleaned, CaptureCategory.REMINDER, 0.82, "Zeitbezug erkannt", "reminders")
        if self._has_any(lowered, self._banf_terms) or self._amount_pattern.search(lowered):
            return self._result(cleaned, CaptureCategory.BANF, 0.78, "Material oder Beschaffung erkannt", "banf-drafts")
        if self._has_any(lowered, self._learning_terms) or cleaned.endswith("?"):
            return self._result(cleaned, CaptureCategory.LEARNING, 0.76, "Lernbezug oder Frage erkannt", "tutor-inbox")
        if self._has_any(lowered, self._idea_terms):
            return self._result(cleaned, CaptureCategory.IDEA, 0.72, "Projekt oder Tool Bezug erkannt", "idea-journal")
        if self._starts_with_task_verb(lowered):
            return self._result(cleaned, CaptureCategory.TASK, 0.68, "Aufgabenverb erkannt", "tasks")
        return self._result(cleaned, CaptureCategory.NOTE, 0.55, "Default Kategorie", "quick-notes")

    def _result(self, text: str, category: CaptureCategory, confidence: float, reason: str, target: str) -> ClassifiedCapture:
        return ClassifiedCapture(text=text, category=category, confidence=confidence, reason=reason, target=target)

    def _has_any(self, text: str, terms: tuple[str, ...]) -> bool:
        return any(term in text for term in terms)

    def _starts_with_task_verb(self, text: str) -> bool:
        return any(text.startswith(f"{verb} ") for verb in self._task_verbs)
