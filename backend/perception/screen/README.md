# Screen Perception

Screen Perception ist Block 1 der autonomen JARVIS Roadmap.

Ziel: JARVIS kann lokalen Bildschirm Kontext erkennen und daraus später proaktive Unterstützung ableiten.

## Aufgabe 1.1

Diese Aufgabe legt nur die Modul Struktur und stabile Schnittstellen an. Sie aktiviert noch keine permanente Beobachtung.

## Aufgabe 1.2

Diese Aufgabe ergänzt die Privacy First Konfiguration. Screen Perception bleibt weiterhin standardmäßig aus.

Neu vorbereitet:

```text
config/screen-perception.example.json
config/screen-perception.json wird ignoriert
Pause Status
Pause Hotkey Grundlage
sichtbarer Aktivitätsstatus
Tray Indicator Grundlage
```

## Module

| Datei | Zweck |
|---|---|
| `capturer.py` | Screenshot Capture mit Ring Buffer Grundlage |
| `config.py` | lokale Privacy First Konfiguration laden und speichern |
| `window_tracker.py` | aktives Fenster, Prozess und Titel erkennen |
| `vision.py` | lokale Vision Modell Integration vorbereiten |
| `ocr_fallback.py` | Tesseract OCR Fallback vorbereiten |
| `context_builder.py` | Fenster Info und Vision Ergebnis zu ScreenContext verbinden |
| `privacy.py` | Privacy Policy mit Default Off, Pause, Allowlist und Blocklist |
| `runtime_state.py` | Laufzeitstatus OFF, PAUSED, ACTIVE oder IDLE |
| `indicator.py` | sichtbarer Status für UI oder Tray Anzeige |
| `hotkeys.py` | Pause Hotkey Grundlage ohne aktiven System Hook |
| `models.py` | Pydantic Datenmodelle für Screen Kontext |

## Privacy First

Screen Perception ist standardmäßig aus. Ohne explizite Aktivierung liefert die Privacy Policy `allowed=false`.

Blockierte Anwendungen und Fenstertitel werden bereits in der Policy berücksichtigt. Dazu gehören Passwort Manager, Banking Begriffe und private Inhalte.

Die private Datei `config/screen-perception.json` wird nicht committed. Nur die sichere Beispielkonfiguration bleibt im Repository.

## Lokale Verarbeitung

Die aktuelle Struktur nutzt lokale Dateien und lokale Modelle als Zielbild. Cloud Calls sind nicht vorgesehen. Falls später Cloud Vision ergänzt wird, muss das explizit Opt In sein und mit AuditLog dokumentiert werden.

## Nächste Aufgabe

Aufgabe 1.3 ergänzt Performance Grundlagen wie WebP Ring Buffer Limit, Diff Detection und Speichergrenzen.
