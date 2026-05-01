# Changelog

Alle nennenswerten Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format orientiert sich an Keep a Changelog. Versionen folgen dem Projektstand B1 bis B6 und den Build Versionen von JARVIS.

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
