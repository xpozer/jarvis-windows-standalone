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

## Aufgabe 1.3

Diese Aufgabe ergänzt Performance Grundlagen, bevor Screen Perception dauerhaft laufen darf.

Neu vorbereitet:

```text
WebP Speicherung
Bildqualität konfigurierbar
Diff Detection über verkleinerten Graustufen Hash
keine neue Datei, wenn sich der Bildschirm nicht geändert hat
Ring Buffer nach Frame Anzahl
Ring Buffer nach Speicherlimit, Standard 100 MB
Performance Konfiguration in config/screen-perception.example.json
```

## Module

| Datei | Zweck |
|---|---|
| `capturer.py` | Screenshot Capture mit WebP, Diff Detection und Ring Buffer Limit |
| `config.py` | lokale Privacy und Performance Konfiguration laden und speichern |
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

## Performance First

Der Capturer speichert ein Bild nur, wenn sich der reduzierte Diff Hash geändert hat. Dadurch werden unnötige Vision Calls und unnötige Dateien im Leerlauf vermieden.

Der Ring Buffer wird über zwei Grenzen begrenzt:

```text
max_frames
max_buffer_mb
```

Standard ist maximal 100 Frames und maximal 100 MB.

## Lokale Verarbeitung

Die aktuelle Struktur nutzt lokale Dateien und lokale Modelle als Zielbild. Cloud Calls sind nicht vorgesehen. Falls später Cloud Vision ergänzt wird, muss das explizit Opt In sein und mit AuditLog dokumentiert werden.

## Nächste Aufgabe

Aufgabe 1.4 finalisiert das Kontext Datenmodell für timestamp, application, window_title, extracted_text, ui_elements und user_intent_guess.
