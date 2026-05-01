# tests/test_quickcapture.py
"""Tests fuer Quick Capture Klassifikation und lokale Speicherung."""

from backend.quickcapture.classifier import CaptureCategory, QuickCaptureClassifier
from backend.quickcapture.persistence import QuickCaptureStore


def test_quickcapture_classifier_detects_reminder() -> None:
    classifier = QuickCaptureClassifier()

    result = classifier.classify("Morgen Herr Strompen wegen Angebot anrufen")

    assert result.category == CaptureCategory.REMINDER
    assert result.target == "reminders"
    assert result.confidence > 0.8


def test_quickcapture_classifier_detects_banf_preparation() -> None:
    classifier = QuickCaptureClassifier()

    result = classifier.classify("20 Stück Hager HNB160H beim Lieferanten anfragen")

    assert result.category == CaptureCategory.BANF
    assert result.target == "banf-drafts"


def test_quickcapture_classifier_detects_learning_question() -> None:
    classifier = QuickCaptureClassifier()

    result = classifier.classify("NTG Frage zu Spannungsfall nochmal lernen")

    assert result.category == CaptureCategory.LEARNING
    assert result.target == "tutor-inbox"


def test_quickcapture_store_roundtrip(tmp_path) -> None:
    classifier = QuickCaptureClassifier()
    store = QuickCaptureStore(tmp_path / "quickcapture.sqlite3")
    classified = classifier.classify("JARVIS Popup kleiner und schneller machen")

    saved = store.save(classified)
    records = store.list_recent(limit=10)

    assert saved.id
    assert saved.category == CaptureCategory.IDEA
    assert len(records) == 1
    assert records[0].text == "JARVIS Popup kleiner und schneller machen"
    assert records[0].target == "idea-journal"


def test_quickcapture_reclassify_keeps_negative_sample(tmp_path) -> None:
    store = QuickCaptureStore(tmp_path / "quickcapture.sqlite3")
    classified = QuickCaptureClassifier().classify("Später Kabelangebot prüfen")
    saved = store.save(classified)

    store.reclassify(saved.id, CaptureCategory.TASK)
    records = store.list_recent(limit=10)

    assert records[0].category == CaptureCategory.REMINDER
    assert records[0].corrected_category == CaptureCategory.TASK
