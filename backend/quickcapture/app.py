# backend/quickcapture/app.py
"""Bedienbarer Quick Capture Ablauf."""

from __future__ import annotations

import logging

from .classifier import QuickCaptureClassifier
from .persistence import QuickCaptureStore
from .popup import PopupResult, QuickCapturePopup

LOGGER = logging.getLogger(__name__)


class QuickCaptureApp:
    """Verbindet Popup, Klassifikation und lokale Speicherung."""

    def __init__(
        self,
        classifier: QuickCaptureClassifier | None = None,
        store: QuickCaptureStore | None = None,
    ) -> None:
        self.classifier = classifier or QuickCaptureClassifier()
        self.store = store or QuickCaptureStore()
        self.popup: QuickCapturePopup | None = None

    def open_popup(self) -> None:
        """Oeffnet das Capture Popup und blockiert bis zum Schliessen."""
        self.popup = QuickCapturePopup(on_submit=self.save_capture, on_cancel=self.cancel_capture)
        self.popup.show()

    def save_capture(self, result: PopupResult) -> None:
        """Klassifiziert und speichert eine Popup Eingabe."""
        classified = self.classifier.classify(
            result.text,
            force_plain_note=result.force_plain_note,
        )
        record = self.store.save(classified)
        LOGGER.info("Quick Capture gespeichert: %s -> %s", record.id, record.category.value)
        if self.popup:
            self.popup.flash_saved(record.category.value, record.target)

    def cancel_capture(self) -> None:
        """Behandelt bewusstes Abbrechen ohne Speicherung."""
        LOGGER.debug("Quick Capture abgebrochen")
