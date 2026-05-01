"""Quick Capture fuer reibungsarme Erfassung aus Windows Anwendungen."""

from .app import QuickCaptureApp
from .classifier import CaptureCategory, ClassifiedCapture, QuickCaptureClassifier
from .persistence import CaptureRecord, QuickCaptureStore

__all__ = [
    "QuickCaptureApp",
    "CaptureCategory",
    "ClassifiedCapture",
    "QuickCaptureClassifier",
    "CaptureRecord",
    "QuickCaptureStore",
]
