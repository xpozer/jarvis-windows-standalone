# Quick Capture

Quick Capture ist der schnelle lokale Eingang fuer Gedanken, Reminder, Aufgaben und Arbeitsnotizen.

## Modulstruktur

```text
app.py           verbindet Popup, Klassifikation und Speicherung
hotkey.py        globaler Hotkey Listener, spaeter Strg Shift Space
popup.py         kleines Always On Top Eingabefenster
classifier.py    lokale Erstklassifikation
voice_input.py   vorbereiteter Voice Stub
persistence.py   lokale SQLite Speicherung
__main__.py      einmaliger lokaler Teststart
```

## Lokaler Teststart

Aus dem Repository Root:

```powershell
python -m backend.quickcapture
```

## Bedienung

```text
Enter          speichert mit Auto Klassifikation
Strg Enter     speichert ohne Klassifikation als plain note
Esc            schliesst ohne Speicherung
Strg M         reserviert fuer Voice Capture
Strg R         reserviert fuer Reklassifikation
```

## Datenschutz

Quick Capture speichert lokal unter:

```text
local_data/quickcapture.sqlite3
```

Der Ordner `local_data/` ist in `.gitignore` ausgeschlossen.

## Aktuelle Kategorien

```text
reminder
banf-vorbereitung
learning
task
idea
note
```

## Stand

Aufgabe 1.1 und 1.2 sind umgesetzt. Hotkey, Voice Capture, Reklassifikation, Tray Feedback und Daily Review folgen in den naechsten Aufgaben.
