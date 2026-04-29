# Voice Modul Erweiterung

Dieses Dokument beschreibt die geplante Erweiterung des Voice Moduls für JARVIS Windows Standalone.

Grundsatz: Das Mikrofon bleibt standardmäßig aus. Push to Talk bleibt der Default. Wake Word Detection ist optional und muss bewusst aktiviert werden.

## Ziele

| Ziel | Beschreibung |
|---|---|
| Datenschutz | Keine dauerhafte Audioaufnahme ohne bewusste Aktivierung |
| Lokaler Betrieb | Sprachausgabe und optionales Wake Word lokal ausführen |
| Kontrollierbarkeit | Nutzer sieht klar, ob Mikrofon aktiv ist |
| Erweiterbarkeit | Piper TTS, Push to Talk und Wake Word sauber trennen |
| Diagnose | DiagCenter erkennt Voice Status und Fehler |

## Betriebsarten

| Modus | Standard | Beschreibung |
|---|---|---|
| TTS Only | Ja | JARVIS spricht lokal über Piper, Mikrofon bleibt aus |
| Push to Talk | Ja | Nutzer hält Taste oder klickt Button, dann wird kurz aufgenommen |
| Wake Word | Nein | Optionales Modul hört lokal auf Aktivierungswort |
| Always On | Nein | Nicht empfohlen und nicht als Standard vorgesehen |

## Datenschutz Hinweise im Code

Jede Mikrofon Aktivierung soll im Code klar kommentiert sein.

```python
# Datenschutz Hinweis:
# Das Mikrofon darf nur aktiv sein, wenn der Nutzer Push to Talk nutzt
# oder Wake Word Detection ausdrücklich in der Konfiguration aktiviert hat.
# Audio wird lokal verarbeitet und nicht an externe Dienste gesendet.
```

## Beispiel Konfiguration

```json
{
  "voice": {
    "enabled": true,
    "tts_engine": "piper",
    "microphone_default": "off",
    "input_mode": "push_to_talk",
    "wake_word": {
      "enabled": false,
      "engine": "porcupine",
      "keyword": "jarvis",
      "sensitivity": 0.55
    },
    "privacy": {
      "local_processing_only": true,
      "external_audio_upload": false,
      "show_microphone_indicator": true
    }
  }
}
```

## Push to Talk als Default

Push to Talk bleibt die empfohlene Standardlösung.

Vorteile:

| Vorteil | Erklärung |
|---|---|
| Kontrolle | Nutzer entscheidet aktiv, wann aufgenommen wird |
| Datenschutz | Keine dauerhafte Hintergrundaufnahme |
| Stabilität | Weniger Fehler durch Nebengeräusche |
| Einfache Diagnose | Aufnahmezeitpunkte sind klar nachvollziehbar |

## Wake Word mit Porcupine optional

Porcupine kann als optionales Modul ergänzt werden.

Vorgaben:

| Punkt | Regel |
|---|---|
| Aktivierung | Nur per Konfiguration oder UI Schalter |
| Default | Aus |
| Anzeige | UI muss aktives Mikrofon sichtbar zeigen |
| Logs | Aktivierung und Deaktivierung lokal protokollieren |
| Datenschutz | Keine externe Audioübertragung |
| Fallback | Push to Talk bleibt immer verfügbar |

## Python Interface Vorschlag

```python
from typing import Protocol

class VoiceInput(Protocol):
    def start(self) -> None:
        ...

    def stop(self) -> None:
        ...

    def is_active(self) -> bool:
        ...

class PushToTalkInput:
    def __init__(self) -> None:
        self._active = False

    def start(self) -> None:
        self._active = True

    def stop(self) -> None:
        self._active = False

    def is_active(self) -> bool:
        return self._active

class WakeWordInput:
    def __init__(self, keyword: str, sensitivity: float) -> None:
        self.keyword = keyword
        self.sensitivity = sensitivity
        self._active = False

    def start(self) -> None:
        # Porcupine Initialisierung wird hier gekapselt
        self._active = True

    def stop(self) -> None:
        # Audio Stream sauber schließen
        self._active = False

    def is_active(self) -> bool:
        return self._active
```

## Factory für Voice Input

```python
def create_voice_input(config: dict) -> VoiceInput:
    mode = config.get("input_mode", "push_to_talk")

    if mode == "push_to_talk":
        return PushToTalkInput()

    if mode == "wake_word":
        wake_word = config.get("wake_word", {})
        if not wake_word.get("enabled", False):
            raise ValueError("Wake Word wurde angefordert, ist aber nicht aktiviert")
        return WakeWordInput(
            keyword=wake_word.get("keyword", "jarvis"),
            sensitivity=float(wake_word.get("sensitivity", 0.55)),
        )

    raise ValueError(f"Unbekannter Voice Input Modus: {mode}")
```

## UI Anforderungen

| Element | Verhalten |
|---|---|
| Mikrofon Status | Zeigt Aus, Push to Talk, Wake Word aktiv |
| Datenschutz Hinweis | Kurz sichtbar in Voice Einstellungen |
| Push to Talk Button | Aktiviert Aufnahme nur während Bedienung |
| Wake Word Schalter | Warnhinweis vor Aktivierung |
| Aktivitätsindikator | Sichtbar, sobald Mikrofon aktiv ist |

## DiagCenter Checks

DiagCenter soll prüfen:

```text
[ ] Piper ausführbar gefunden
[ ] TTS Testausgabe möglich
[ ] Mikrofon Berechtigung vorhanden
[ ] Mikrofon aktuell aus, wenn Default erwartet wird
[ ] Push to Talk reagiert
[ ] Wake Word Modul installiert, falls aktiviert
[ ] Kein externer Audio Upload konfiguriert
```

## Log Beispiele

```python
from loguru import logger

logger.info("Voice TTS gestartet", engine="piper")
logger.info("Push to Talk Aufnahme gestartet", input_mode="push_to_talk")
logger.info("Push to Talk Aufnahme beendet", input_mode="push_to_talk")
logger.warning("Wake Word aktiviert", keyword="jarvis", local_only=True)
logger.error("Voice Initialisierung fehlgeschlagen", error="device_not_found")
```

## Sicherheitsregeln

| Regel | Begründung |
|---|---|
| Mikrofon Default Off | Datenschutz und Vertrauen |
| Kein Always On Default | Unnötiges Risiko |
| Wake Word optional | Nutzer entscheidet bewusst |
| Lokale Verarbeitung | Keine externe Audioübertragung |
| Sichtbarer Status | Nutzer erkennt aktive Aufnahme |
| Audit Event bei Moduswechsel | Nachvollziehbarkeit |

## Akzeptanzkriterien

```text
[ ] Standardkonfiguration setzt microphone_default auf off
[ ] Push to Talk funktioniert ohne Wake Word Modul
[ ] Wake Word lässt sich nur bewusst aktivieren
[ ] UI zeigt aktives Mikrofon klar sichtbar an
[ ] DiagCenter erkennt Voice Status
[ ] Logs enthalten keine Audio Inhalte
[ ] Keine Audio Daten werden extern übertragen
```

## Empfohlene Umsetzung

| Schritt | Aktion |
|---|---|
| 1 | Voice Konfiguration mit Default Off anlegen |
| 2 | Push to Talk Interface stabilisieren |
| 3 | Piper TTS Diagnose ergänzen |
| 4 | UI Mikrofonindikator ergänzen |
| 5 | Porcupine als optionales Extra Modul ergänzen |
| 6 | Wake Word Warnhinweis und Aktivierung bauen |
| 7 | Tests für Default Off und Moduswechsel schreiben |
