# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format orientiert sich an Keep a Changelog. Versionen folgen dem Projektstand B1 bis B6 und den Build Versionen von JARVIS.

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
