# Screen Perception

Screen Perception ist Block 1 der autonomen JARVIS Roadmap.

Ziel: JARVIS kann lokalen Bildschirm Kontext erkennen und daraus später proaktive Unterstützung ableiten.

## Stand

Umgesetzt sind die Aufgaben 1.1 bis 1.4:

```text
1.1 Modulstruktur
1.2 Privacy First Konfiguration
1.3 Performance Grundlagen
1.4 Kontext Datenmodell
```

Es wird weiterhin keine dauerhafte Bildschirmbeobachtung automatisch aktiviert.

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

## Kontext Modell

Pflichtfelder aus der Roadmap:

```text
timestamp
application
window_title
extracted_text
ui_elements
user_intent_guess
```

Zusätzlich vorbereitet für Memory, Trigger und AuditLog:

```text
source
process_name
pid
structured_ui_elements
activity_type
confidence
screenshot_hash
screenshot_changed
privacy_status
duration_hint_seconds
should_store_episode
episode_reason
metadata
```

`ScreenContext` ist das zentrale Datenmodell für spätere Trigger, Memory und AuditLog.

Der Context Builder setzt noch keine Aktion um. Er liefert nur Hinweise, ob ein Kontext später als Episode interessant sein könnte.

## Lokale Verarbeitung

Die aktuelle Struktur nutzt lokale Dateien und lokale Modelle als Zielbild. Cloud Calls sind nicht vorgesehen. Falls später Cloud Vision ergänzt wird, muss das explizit Opt In sein und mit AuditLog dokumentiert werden.

## Nächste Aufgabe

Aufgabe 1.5 ergänzt die Integration mit Memory. Wichtige Kontext Snapshots werden dafür vorbereitet, aber weiterhin nicht ungefragt dauerhaft beobachtet.
