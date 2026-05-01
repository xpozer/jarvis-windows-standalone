# backend/quickcapture/popup.py
"""Minimales Tkinter Popup fuer Quick Capture."""

from __future__ import annotations

import tkinter as tk
from collections.abc import Callable
from dataclasses import dataclass


@dataclass(frozen=True)
class PopupResult:
    """Ergebnis aus dem Quick Capture Popup."""

    text: str
    force_plain_note: bool = False


class QuickCapturePopup:
    """Leichtgewichtiges Always On Top Eingabefenster."""

    def __init__(self, on_submit: Callable[[PopupResult], None], on_cancel: Callable[[], None] | None = None) -> None:
        self.on_submit = on_submit
        self.on_cancel = on_cancel or (lambda: None)
        self._root: tk.Tk | None = None
        self._entry: tk.Entry | None = None
        self._status: tk.Label | None = None

    def show(self) -> None:
        """Oeffnet das Popup in Bildschirmmitte."""
        if self._root:
            self._root.lift()
            return

        root = tk.Tk()
        root.title("JARVIS Quick Capture")
        root.geometry(self._center_geometry(root, 480, 120))
        root.attributes("-topmost", True)
        root.resizable(False, False)
        root.configure(bg="#06101f")

        entry = tk.Entry(root, font=("Segoe UI", 13), bg="#081a2d", fg="#eafcff", insertbackground="#05d8ff")
        entry.pack(fill="x", padx=16, pady=(18, 8), ipady=8)
        entry.focus_set()

        status = tk.Label(root, text="Enter speichert, Strg Enter als Notiz, Esc schliesst", bg="#06101f", fg="#80b8c8", font=("Segoe UI", 9))
        status.pack(fill="x", padx=16)

        root.bind("<Escape>", lambda _event: self.close(cancel=True))
        root.bind("<Return>", lambda event: self._submit(event, force_plain_note=False))
        root.bind("<Control-Return>", lambda event: self._submit(event, force_plain_note=True))
        root.bind("<Control-m>", lambda _event: self._show_status("Voice Capture wird in Aufgabe 1.4 aktiviert."))
        root.bind("<Control-r>", lambda _event: self._show_status("Reklassifikation folgt in Aufgabe 1.6."))

        self._root = root
        self._entry = entry
        self._status = status
        root.mainloop()

    def close(self, *, cancel: bool = False) -> None:
        """Schliesst das Popup."""
        if cancel:
            self.on_cancel()
        if self._root:
            self._root.destroy()
        self._root = None
        self._entry = None
        self._status = None

    def flash_saved(self, category: str, target: str) -> None:
        """Zeigt nach dem Speichern ein kurzes Feedback."""
        self._show_status(f"Gespeichert als {category} in {target}")
        if self._root:
            self._root.after(1500, lambda: self.close(cancel=False))

    def _submit(self, _event: object, *, force_plain_note: bool) -> str:
        text = self._entry.get().strip() if self._entry else ""
        if not text:
            self.close(cancel=True)
            return "break"
        self.on_submit(PopupResult(text=text, force_plain_note=force_plain_note))
        return "break"

    def _show_status(self, text: str) -> None:
        if self._status:
            self._status.configure(text=text)

    def _center_geometry(self, root: tk.Tk, width: int, height: int) -> str:
        root.update_idletasks()
        screen_width = root.winfo_screenwidth()
        screen_height = root.winfo_screenheight()
        x = int((screen_width - width) / 2)
        y = int((screen_height - height) / 2)
        return f"{width}x{height}+{x}+{y}"
