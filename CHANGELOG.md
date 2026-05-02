# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format orientiert sich an Keep a Changelog. Versionen folgen dem Projektstand B1 bis B6 und den Build Versionen von JARVIS.

## [B6.6.32] - 2026-05-02

### Changed

- Root Skripte auf sechs sichtbare Batch Einstiegspunkte reduziert: `INSTALL_JARVIS.bat`, `START_JARVIS.bat`, `UPDATE_JARVIS.bat`, `UNINSTALL_JARVIS.bat`, `DIAGNOSE.bat` und `REPAIR.bat`.
- Operative PowerShell Skripte nach `scripts/install`, `scripts/maintenance` und `scripts/dev` migriert.
- PowerShell Wrapper nutzen nun explizite `-Root` beziehungsweise `-SourceRoot` Parameter, damit verschobene Skripte den Projekt Root sauber aufloesen.
- README auf die neue Skriptstruktur und die aktuellen Betriebsbefehle aktualisiert.

### Removed

- Doppelte und sekundaere Root Batch Wrapper aus dem Root entfernt.
- `REPAIR_JARVIS.bat` entfernt, weil `REPAIR.bat` denselben Einstieg mit besserer Nutzerfuehrung abdeckt.

### Security

- Schlanker Root reduziert versehentliche Nutzung alter oder doppelter Wartungsskripte.

## [B6.6.31] - 2026-05-02

### Changed

- Dependabot PR #11 gemergt.
- Frontend Dependency `three` von `0.160.1` auf `0.184.0` aktualisiert.
- Frontend Dependency `@types/three` von `0.160.0` auf `0.184.0` aktualisiert.
- CI fuer PR #11 war vor dem Merge gruen: TypeScript Check, Frontend Build, Python Tests und Python Lint.

## [B6.6.30] - 2026-05-02

### Added

- `frontend/package-lock.json` wird jetzt versioniert, damit Frontend Dependencies reproduzierbar installiert werden.

### Changed

- `FIRST_SETUP.ps1` nutzt bei vorhandenem Lockfile `npm ci` und faellt nur ohne Lockfile auf `npm install` zurueck.
- Frontend Paketmetadaten auf B6.6.30 aktualisiert.

## [B6.6.29] - 2026-05-02

### Changed

- Installer Selbstpruefung startet das Backend jetzt wie der normale Launcher mit `python -m uvicorn main:app`.
- Installer Selbstpruefung prueft zusaetzlich `/health` statt nur den TCP Port.
- Release Packager unterscheidet jetzt Root Runtime Ordner von Quellcode Ordnern.

### Fixed

- `frontend/src/features/runtime` wird nicht mehr versehentlich aus Release ZIPs entfernt.
- Der echte Installer Test aus einem frischen Release ZIP laeuft mit Setup, Frontend Build, Backend Start und Health Check durch.
- Port 8000 wird im Installer nicht mehr stillschweigend als Erfolg akzeptiert, wenn bereits ein alter Prozess laeuft.

## [B6.6.28] - 2026-05-02

### Changed

- CI installiert fuer Python Tests jetzt das Projekt mit Dev Abhaengigkeiten.
- Python Lint Jobs pruefen den paketierten Kern `jarvis` und die Tests statt alten Legacy Backend Code.
- Tests wurden mit Black formatiert und Ruff bereinigt.

### Fixed

- CI Testlauf findet FastAPI, PyYAML und pytest-asyncio nun korrekt.
- Pytest Asyncio Loop Scope ist explizit gesetzt, damit keine Warnung mehr ausgegeben wird.

## [B6.6.27] - 2026-05-02

### Changed

- GitHub Actions Workflows bereiten JavaScript Actions auf Node 24 vor.
- CI und Release Frontend Jobs nutzen jetzt Node.js 24.

### Fixed

- Die GitHub Release Warnung zur kommenden Node.js 20 Abschaltung wurde vorgezogen entschärft.
- Projektstatus markiert den echten Release ZIP Workflow nach erfolgreichem Tag Release als erledigt.

## [B6.6.26] - 2026-05-02

### Added

- Release ZIP Packager `scripts/maintenance/build-release-zip.ps1` ergaenzt.
- Dokumentation `docs/release-zip-workflow.md` fuer lokalen Release Test und GitHub Tag Release ergaenzt.
- Release Manifest mit Dateien, SHA256 und Paketmetadaten wird beim Build erzeugt.

### Changed

- GitHub Release Workflow nutzt jetzt denselben Release Packager wie der lokale Testlauf.
- Release Upload haengt ZIP, SHA256 Datei und Manifest an.

### Fixed

- Release ZIP schliesst verschachtelte Entwicklungsordner wie `frontend/node_modules`, `.venv`, Laufzeitdaten und private Konfigurationen robust aus.
- Lokaler Release Packager funktioniert auch mit Windows PowerShell 5 ohne `GetRelativePath`.

## [B6.6.25] - 2026-05-02

### Added

- Das echte FastAPI Backend liefert jetzt `GET /automation/audit` und `POST /automation/audit`.
- Vorbereitete, bestaetigte, verworfene und ausgefuehrte Legacy Actions schreiben Automation Audit Eintraege.
- Die Sicherheitszentrale erhaelt wieder eine flache `actions` Liste mit Legacy Actions und UseJARVIS Authority Gate Eintraegen.

### Fixed

- Der sichtbare Automation Cluster griff auf `/automation/audit` zu, der bisher nur in der kleinen `jarvis/api` App vorhanden war.
- Automation Audit Daten aus Legacy Audit Log und UseJARVIS Runtime Audit werden fuer das Frontend vereinheitlicht.

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
