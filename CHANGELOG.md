# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format orientiert sich an Keep a Changelog. Versionen folgen dem Projektstand B1 bis B6 und den Build Versionen von JARVIS.

## [B6.8.1-themes-prototype] - 2026-05-01

### Added

- Neue themenfähige Dashboard Datei `frontend/public/jarvis-global-overview-themed.html` ergänzt.
- Launcher um `GLOBAL THEMES` Einstieg erweitert.
- Theme Switcher für JARVIS, MATRIX und ULTRON ergänzt.
- MATRIX Theme mit Code Rain Layer ergänzt.
- ULTRON Theme mit Circuit Layer ergänzt.
- Theme Auswahl wird lokal in `localStorage` gespeichert.

### Changed

- Die bestehende stabile `jarvis-global-overview-standalone.html` bleibt als Rückfall unverändert erhalten.

## [B6.8.0-themes-plan] - 2026-05-01

### Added

- Umsetzungsdokument `docs/dashboard-theme-system-implementation.md` ergänzt.
- Theme Switcher Grundsystem für JARVIS, MATRIX und ULTRON dokumentiert.
- MATRIX CSS Override, Code Rain Layer und Theme Parameter als prüfbare Snippets vorbereitet.

### Changed

- Dashboard Theme System wird auf separatem Branch `feature/dashboard-themes` geplant, bevor die große Single File HTML verändert wird.

## [B6.6.18] - 2026-05-01

### Added

- DiagCenter Frontend Seite unter `frontend/public/jarvis-diagcenter.html` ergänzt.
- Launcher um `DIAGCENTER` Einstieg erweitert.
- DiagCenter Frontend ruft `GET /diagnostic/center` ab und zeigt Checks, Sections und Raw JSON an.

### Changed

- Diagnose ist nun nicht nur per PowerShell oder Browser JSON erreichbar, sondern auch als lokale HUD Oberfläche sichtbar.

## [B6.6.17] - 2026-05-01

### Added

- DiagCenter Sammel Endpunkt `GET /diagnostic/center` ergänzt.
- DiagCenter bündelt Backend Health, Self Check, Dependencies, Ports, Logs, System Status, UseJARVIS Runtime und Awareness Runtime.
- Dokumentation `docs/diagcenter.md` ergänzt.

### Changed

- Diagnoseinformationen sind nun über einen zentralen Endpunkt abrufbar, statt nur über einzelne Diagnose Routen verteilt zu sein.

## [B6.6.16] - 2026-05-01

### Added

- Backend Health Check im Startskript ergänzt.
- Dokumentation `docs/backend-health-check.md` ergänzt.
- `START_JARVIS.ps1` prüft nach Port 8000 jetzt zusätzlich `http://127.0.0.1:8000/health`.

### Changed

- JARVIS gilt beim Start erst als bereit, wenn Backend Port und Health Endpunkt erfolgreich antworten.

### Fixed

- Startskript erkennt besser, wenn zwar Port 8000 offen ist, der Backend Dienst aber nicht sauber antwortet.

## [B6.6.15] - 2026-05-01

### Added

- Installer Readiness Check unter `scripts/maintenance/check-installer-readiness.ps1` ergänzt.
- Dokumentation `docs/installer-readiness.md` ergänzt.
- Vorprüfung für PowerShell, Root Dateien, Python, Node.js, npm, winget, Ollama, Ports und LifeOS Config ergänzt.

### Changed

- Installer Robustheit wird um einen nicht destruktiven Diagnose Schritt vor der eigentlichen Installation erweitert.

## [B6.6.14] - 2026-05-01

### Fixed

- Sound Re Unlock im Frontend ergänzt, damit ein gespeicherter aktiver Soundstatus nach Reload beim nächsten Nutzerklick wieder sauber entsperrt wird.
- Stabile Listener Referenz für `pointerdown` und `keydown` ergänzt, damit Unlock Listener korrekt entfernt werden können.

### Changed

- Sound Engine setzt bei aktivem Sound und gesperrtem AudioContext automatisch einen Re Unlock Listener, statt dauerhaft stumm zu bleiben.

## [B6.6.13] - 2026-05-01

### Fixed

- Sound Engine respektiert Browser Autoplay Regeln jetzt strenger und spielt erst nach erfolgreichem Audio Unlock.
- Reload Problem entschärft, bei dem Sound zwar im HUD als aktiviert gespeichert war, der Browser AudioContext aber noch gesperrt blieb.
- WebKit Fallback für `webkitAudioContext` ergänzt.

### Changed

- Sound Events werden ignoriert, solange der AudioContext nicht wirklich freigeschaltet ist, statt stumm in einen gesperrten Context zu laufen.

## [B6.6.12] - 2026-05-01

### Added

- Sound Layer v1 mit lokaler Web Audio Engine ohne externe Audio Dateien.
- Sound Toggle und Lautstaerke Regler im HUD ergaenzt.
- Dezente JARVIS Sounds fuer Agent Routing, Memory, Provider Kontakt, Antwortstart, Abschluss, Listening und Fehlerpulse.

### Changed

- Sound ist standardmaessig aus und wird erst nach bewusster Nutzeraktion aktiviert.

## [B6.6.11] - 2026-05-01

### Added

- Work Radar 2.0 erweitert um Kategorien, Risiko Zusammenfassung, Status Zusammenfassung, Fristlage und naechste Work Aktion.
- LifeOS Backend normalisiert Arbeitsthemen jetzt mit Kategorie, Due State und Prioritaetswert.
- LifeOS Panel zeigt kompakte Work Radar Kennzahlen und Kategorien ohne die Startseite zu ueberladen.

### Changed

- `config/lifeos.example.json` nutzt jetzt explizite Work Kategorien fuer LNW, FSM und Mail.

## [B6.6.10] - 2026-05-01

### Added

- Orb Event Layer v1 fuer echte Stream-Signale am JARVIS Kern.
- Chat Streaming sendet nun Orb-Events fuer Agent Routing, Memory Scan, Provider Kontakt, Antwortstart und Fehlerpulse.
- Dialog Orb zeigt den aktuellen Kernstatus direkt unter dem Label.

### Changed

- Orb reagiert waehrend Antworten mit zusaetzlichen Synapsen-Pulsen, Memory-Blitzen und roten Fehler/Thinking-Akzenten.

## [B6.6.9] - 2026-05-01

### Added

- Interaction Layer v1 fuer lebendigere Chat-Antworten.
- Chat Streaming sendet nun Phasen fuer Kontext, Agent, Memory, Modell, Antwort und Abschluss.
- Frontend zeigt Live-Phasen direkt in der Antwortkarte.
- Orb wechselt waehrend Streaming sichtbar zwischen Denken und Sprechen.
- Antwortkarte nutzt dezente Scan-, Avatar- und Meta-Einblendanimationen.

### Changed

- Streaming Antworten wirken reaktiver und zeigen, was JARVIS gerade verarbeitet.

## [B6.6.8] - 2026-05-01

### Added

- Learning Coach v1 in LifeOS ergaenzt.
- `learning_radar.subjects` in der LifeOS Beispielkonfiguration vorbereitet.
- Backend berechnet einen Lernfokus aus Sicherheit, Fehlerquote, offenen Karten und Wiederholungstermin.
- LifeOS Panel zeigt Lernfokus, Empfehlung, Sicherheit, offene Karten und Fehlerquote.

### Changed

- LifeOS Briefing liefert nun `learning_focus` zusaetzlich zu Tageslage, Top 3 und Work Radar.

## [B6.6.7] - 2026-05-01

### Added

- LifeOS Daily Command Center als eigenes JARVIS Sidebar Panel integriert.
- Neue Backend API fuer LifeOS Status, Briefing, Regeneration und Installer Check ergaenzt.
- Work Radar 2.0 Struktur mit sortierbaren Vorgaengen, Risiko, Status, Frist und naechstem Schritt vorbereitet.
- Tests fuer LifeOS Briefing, Work Radar und Installer Robustheit ergaenzt.

### Changed

- `config/lifeos.example.json` um `daily_briefing.summary` und strukturierte `work_radar.items` erweitert.
- `FIRST_SETUP.ps1` bereitet die private lokale LifeOS Konfiguration vor, ohne bestehende private Daten zu ueberschreiben.

### Security

- Private LifeOS Daten bleiben weiter in `config/lifeos.json` und werden nicht committed.
- Installer Check prueft, ob private Config ignoriert und Setup ohne `-Force` ausgefuehrt wird.

## Hinweise

Geplante zukünftige Einträge sollen diese Gruppen nutzen:

```text
Added
Changed
Deprecated
Removed
Fixed
Security
```
