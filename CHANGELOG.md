# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format orientiert sich an Keep a Changelog. Versionen folgen dem Projektstand B1 bis B6 und den Build Versionen von JARVIS.

## [B6.6.24] - 2026-05-02

### Added

- Aufgaben und Automationen sind im Frontend jetzt als Automation Cluster sichtbar.
- Organizer Panel lädt zusätzlich die letzten Einträge aus `/automation/audit`.
- Audit Log zeigt Task, Status, Risiko, Quelle, Ziel und Ergebnis direkt im HUD.
- Dashboard Cluster verlinken den Audit Endpunkt in Start, Diagnose, JARVIS Runtime, Sicherheitszentrale und API Konsole.

### Changed

- `frontend/package.json` Metadaten auf B6.6.24 und den aktuellen Local First HUD Stand angepasst.
- Aufgaben und Automationen wurden von reiner Organizer Ansicht zu einem zusammenhängenden Cluster für Tasks, Notes, Reminder und Audit erweitert.

### Fixed

- Der neue Backend Endpunkt `/automation/audit` war im Frontend noch nicht sichtbar und ist jetzt im Dashboard eingebunden.

## [B6.6.23] - 2026-05-01

### Added

- Chat Mikrofon Button nutzt jetzt Browser Speech Recognition als echtes Push-to-Talk.
- Voice Statuszeile zeigt Live Status, erkannte Transkripte und Browser-Unterstuetzung direkt am Chat-Eingabefeld.
- Transkripte werden an `/voice/transcript` gespeichert und erst danach bewusst an den Chat uebergeben.
- Optionale Browser TTS Ausgabe fuer JARVIS Antworten nutzt vorhandene Voice Settings, wenn `auto_speak` aktiviert ist.

### Changed

- Mikrofon bleibt weiterhin standardmaessig aus und wird nur per gedruecktem Button gestartet.

## [B6.6.22] - 2026-05-01

### Added

- LifeOS Briefing um Decision Layer, Private Projects, Energy Profile, Finance Radar, Memory Layer und Automation Layer erweitert.
- `config/lifeos.example.json` enthaelt jetzt lokale Beispielschemata fuer die restlichen LifeOS Roadmap Module.
- LifeOS Panel zeigt die neuen Roadmap Module als kompakte Karten im bestehenden HUD Stil.

### Changed

- `docs/lifeos-roadmap.md` markiert Learning Coach als erledigt und mehrere Local-First Module als vorbereitet.

## Hinweise

Aeltere Eintraege bleiben im Git Verlauf erhalten. Neue Eintraege sollen diese Gruppen nutzen:

```text
Added
Changed
Deprecated
Removed
Fixed
Security
```
