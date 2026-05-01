# Quick Capture

Quick Capture ist der schnelle lokale Eingang fuer Gedanken, Reminder, Aufgaben und Arbeitsnotizen.

## Aufgabe 1.1 Stand

Dieses Modul legt die technische Basis an:

```text
hotkey.py        globaler Hotkey Listener, spaeter Strg Shift Space
popup.py         kleines Always On Top Eingabefenster
classifier.py    lokale Erstklassifikation
voice_input.py   vorbereiteter Voice Stub
persistence.py   lokale SQLite Speicherung
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

## Naechster Schritt

Aufgabe 1.2 verbindet Hotkey, Popup, Klassifikation und Speicherung zu einem bedienbaren Ablauf.
