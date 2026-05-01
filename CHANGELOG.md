# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format orientiert sich an Keep a Changelog. Versionen folgen dem Projektstand B1 bis B6 und den Build Versionen von JARVIS.

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

## [B6.6.6] - 2026-05-01

### Added

- PowerShell Setup Skript `scripts/maintenance/setup-lifeos-config.ps1` ergänzt.
- Dokumentation `docs/lifeos-private-config.md` ergänzt.
- Skript erzeugt eine private lokale `config/lifeos.json` aus `config/lifeos.example.json`.

### Changed

- LifeOS persönliche Vorlage ist jetzt als konkreter Setup Schritt vorbereitet.

### Security

- Das Skript überschreibt eine bestehende `config/lifeos.json` nur mit `-Force`.
- Private LifeOS Daten bleiben lokal und werden weiterhin nicht committed.

## [B6.6.5] - 2026-05-01

### Added

- Ausgearbeitete LifeOS Upgrade Roadmap unter `docs/lifeos-roadmap.md` ergänzt.
- Roadmap Module für Daily Command Center, Work Radar 2.0, Learning Coach, Health und Energy Radar, Finance und Contract Radar, Private Project Manager, Decision Assistant, Memory und Knowledge Layer, Voice und Automation Layer dokumentiert.
- PROJECT_STATUS.md um Roadmap Verweis und erweiterte offene Todos ergänzt.

### Changed

- Offene Todos sind nun stärker nach LifeOS Upgrade Modulen und nächstem sinnvollen Schritt strukturiert.

## [B6.6.4] - 2026-05-01

### Added

- LifeOS lädt bevorzugt die private lokale Datei `config/lifeos.json`, wenn sie vorhanden ist.
- Fallback Reihenfolge ergänzt: private Datei, Beispiel Datei, interner Fallback.
- Datenstatus unterscheidet nun `PRIVATE JSON ACTIVE`, `EXAMPLE JSON ACTIVE` und `FALLBACK ACTIVE`.

### Changed

- LifeOS ist für persönliche lokale Daten vorbereitet, ohne diese Daten ins Repository aufzunehmen.

### Security

- `config/lifeos.json` wird über `.gitignore` ausgeschlossen.
- Private LifeOS Daten sollen lokal bleiben und nicht committed werden.

## [B6.6.3] - 2026-05-01

### Added

- LifeOS Daily Briefing Generator ergänzt.
- Neue generierte Tageslage aus Prioritäten, offenen Schleifen, Energie, Fokuszeit und Work Radar.
- Zusätzliche Anzeige `GENERATED DAILY BRIEFING` im LifeOS Command Center.

### Changed

- LifeOS zeigt nicht mehr nur die geladenen Rohwerte, sondern leitet daraus eine kurze verständliche Tagesbewertung ab.

## [B6.6.2] - 2026-05-01

### Added

- LifeOS Command Center lädt nun lokale Werte aus `config/lifeos.example.json`, wenn die Seite über einen lokalen Server geöffnet wird.
- Interner Fallback Datensatz ergänzt, falls der Browser lokales Datei Laden blockiert.
- Daily Briefing, Work Radar, Timeline, Life Modules und Next Best Action werden dynamisch gerendert.

### Changed

- LifeOS Anzeige von festen Demo Werten auf Daten Rendering mit JSON Grundlage umgestellt.

### Fixed

- LifeOS bleibt auch bei blockiertem `fetch` funktionsfähig und zeigt einen klaren Datenstatus an.

## [B6.6.1] - 2026-05-01

### Added

- Lokale LifeOS Beispielkonfiguration unter `config/lifeos.example.json`.
- Beispielstruktur für Daily Briefing, Work Radar, Life Modules, Timeline und Security Vorgaben.

### Changed

- LifeOS Dokumentation um lokale Datenstruktur und sicheren Umgang mit `config/lifeos.json` ergänzt.

### Security

- Persönliche lokale LifeOS Daten sollen nicht ins Repository committed werden.

## [B6.6.0] - 2026-05-01

### Added

- LifeOS Command Center Prototyp unter `frontend/public/jarvis-lifeos-command-center.html`.
- Launcher Eintrag für LifeOS neben Global Overview und ULTRON Grid.
- Dokumentation für das LifeOS Global Upgrade unter `docs/lifeos-global-upgrade.md`.
- Erste visuelle Struktur für Daily Briefing, Work Radar, Life Modules und Next Best Action.

### Changed

- Launcher Layout auf drei auswählbare Module erweitert.

### Security

- LifeOS Zielbild bleibt Local First und ohne externe Telemetrie dokumentiert.

## [B6.5.1] - 2026-04-29

### Added

- GitHub Pages Bootscreen und Dashboard unter `docs/index.html`.
- Dashboard Darstellung für Global Command Grid mit Live Telemetrie Ansatz.
- Dokumentationsgrundlage für Windows Standalone Betrieb.
- Projekt README mit Architektur, Roadmap und Setup Hinweisen.

### Changed

- Projektbeschreibung stärker auf lokalen Windows Standalone Einsatz ausgerichtet.
- Roadmap nach B1 bis B6 Struktur dokumentiert.
- Voice Modul in der Dokumentation auf Push to Talk und Mikrofon Default Off ausgerichtet.

### Fixed

- Klarere Hinweise zum lokalen Start des Dashboard Prototyps.
- Beschreibung der geplanten Installer und Diagnose Abläufe ergänzt.

### Security

- Local First Prinzip dokumentiert.
- Keine externe Telemetrie als Projektanforderung festgehalten.
- Mikrofon bleibt standardmäßig ausgeschaltet.

## [B6.5.0] - 2026-04-28

### Added

- Grundlage für JARVIS Windows Standalone Repository.
- Erste Dashboard und HUD Prototypen.
- Erste lokale HTML Ansicht ohne externe Assets.
- Basis für Installer und Maintenance Skripte.

### Changed

- Fokus auf offline nutzbare Single File Darstellung für das Dashboard.
- Projekt auf Windows 10 und Windows 11 als Zielplattform ausgerichtet.

### Fixed

- Entfernung externer Font Abhängigkeiten im Dashboard Prototyp.
- Verbesserte Nutzbarkeit per lokalem Browser Start.

### Security

- Erste Trennung zwischen lokalem Dashboard und späteren Backend Funktionen.
- Datenschutzanforderung für Voice Modul aufgenommen.

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
