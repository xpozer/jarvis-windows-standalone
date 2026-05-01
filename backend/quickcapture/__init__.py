"""Quick Capture fuer reibungsarme Erfassung aus Windows Anwendungen."""

from .classifier import CaptureCategory, ClassifiedCapture, QuickCaptureClassifier
from .persistence import CaptureRecord, QuickCaptureStore

__all__ = [
    "CaptureCategory",
    "ClassifiedCapture",
    "QuickCaptureClassifier",
    "CaptureRecord",
    "QuickCaptureStore",
]
