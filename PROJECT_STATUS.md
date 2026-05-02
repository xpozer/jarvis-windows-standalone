# JARVIS Projektstatus

Diese Datei zeigt den aktuellen Stand des Projekts auf einen Blick. Sie ergänzt den Changelog.

Der Changelog dokumentiert, was versioniert geändert wurde. Diese Datei zeigt zusätzlich, was noch offen ist und was als Nächstes sinnvoll ist.

## Verbindliche Pflege Regel

Bei jedem größeren Schritt im Projekt müssen zwei Dateien geprüft und bei Bedarf aktualisiert werden:

```text
CHANGELOG.md
PROJECT_STATUS.md
```

Diese Regel gilt für neue Features, Fixes, UI Änderungen, Installer Änderungen, Dokumentation, Release Vorbereitungen und größere Dependency Updates.

Kurzregel:

```text
Changelog = was wurde versioniert geändert
PROJECT_STATUS = was ist erledigt, was ist offen, was kommt als Nächstes
```

Kein größerer Projektstand gilt als sauber abgeschlossen, wenn `PROJECT_STATUS.md` nicht geprüft wurde.

## Aktueller Stand

| Bereich | Status | Hinweis |
|---|---|---|
| Repository Basis | erledigt | Projektstruktur, README, Changelog, Contribution Regeln und Security Hinweise vorhanden |
| Root Hygiene | erledigt | PR #40 ist gemergt; Root ist auf sechs Batch Einstiegspunkte reduziert, PowerShell Logik liegt unter `scripts/` |
| Launcher | erledigt | Startseite mit Global Overview, ULTRON Grid, LifeOS und DiagCenter Einstieg vorhanden |
| Global Overview | erledigt | Stabile Weltkarten Ansicht als lokaler HUD Prototyp vorhanden |
| ULTRON Grid | erledigt | JARVIS und ULTRON Command Grid mit Modus Umschaltung vorhanden |
| LifeOS Command Center | erledigt | Erste sichtbare LifeOS Oberfläche vorhanden |
| LifeOS lokale Daten | erledigt | Beispielkonfiguration vorhanden und LifeOS kann lokale JSON Werte laden |
| LifeOS Daily Briefing | erledigt | LifeOS erzeugt eine erste Tageslage aus Prioritäten, offenen Schleifen, Energie, Fokuszeit und Work Radar |
| LifeOS Roadmap Module | erledigt | Learning, Decision, Projects, Energy, Finance, Memory und Automation sind local-first im Briefing und UI sichtbar |
| LifeOS private Config | erledigt | `config/lifeos.json` wird bevorzugt geladen und über `.gitignore` aus dem Repository gehalten |
| LifeOS Roadmap | erledigt | Ausgearbeitete Upgrade Roadmap liegt unter `docs/lifeos-roadmap.md` |
| LifeOS persönliche Vorlage | erledigt | Skript und Anleitung zum Erzeugen der privaten `config/lifeos.json` vorhanden |
| JARVIS Sound Layer | erledigt | Lokaler Web Audio Sound Layer vorhanden. Re Unlock nach Reload ist vorbereitet |
| Voice / Push to Talk | erledigt | Chat Mikrofon nutzt Browser Speech Recognition bewusst per gedruecktem Button, keine Daueraufnahme |
| Automation Audit Log | erledigt | Echtes Backend liefert `/automation/audit`; vorbereiten, bestaetigen, verwerfen und ausfuehren von Aktionen wird protokolliert |
| Installer Readiness Check | erledigt | Nicht destruktiver Vorab Check für Installer Voraussetzungen vorhanden |
| Backend Health Check | erledigt | Startskript prüft Port 8000 und `/health`, bevor JARVIS als bereit gilt |
| DiagCenter Backend | erledigt | Zentraler Sammel Endpunkt `/diagnostic/center` bündelt Health, Self Check, Dependencies, Ports, Logs und Runtime Status |
| DiagCenter Frontend | erledigt | Lokale HUD Seite `frontend/public/jarvis-diagcenter.html` zeigt Checks, Sections und Raw JSON |
| Dashboard Themes | erledigt | JARVIS, MATRIX und ULTRON sind als eigene Global Themes Seite und direkt unter Optionen / Updates im React Dashboard eingebunden |
| Installer | erledigt | Frischer Release ZIP Test laeuft mit Setup, Frontend Build, Backend Start und Health Check durch |
| Release ZIP Packager | erledigt | Runtime Quellcode wird korrekt gepackt; lokale Runtime Daten bleiben ausgeschlossen |
| Frontend Dependencies | erledigt | Dependabot PR #11 wurde gemergt; `three` und `@types/three` stehen auf `0.184.0` |
| Backend Integration | erledigt | Backend Health, DiagCenter, Automation Audit und CLI Smoke Checks sind angebunden |
| Tests und CI | erledigt | CI nutzt Node.js 24, Frontend Lockfile ist versioniert, Ruff/Black/Pytest sind gruen |

## Erledigte Updates

### B6.6.32

- Root Batch Einstiegspunkte auf sechs sichtbare Dateien reduziert.
- Sekundaere Batch Wrapper nach `scripts/install`, `scripts/maintenance` und `scripts/dev` verschoben.
- Operative PowerShell Logik aus dem Root nach `scripts/` migriert.
- Neue Wrapper geben `-Root` beziehungsweise `-SourceRoot` explizit weiter.
- `JARVIS_INSTALL_CONFIG.json` nach `scripts/install` verschoben.
- README auf die neue Skriptstruktur aktualisiert.
- PR #40 wurde mit aktuellem `main` synchronisiert und gemergt.
- Real Assist Roadmap wurde unter `docs/real-assist-roadmap.md` verankert.
- Veraltete Frontend/Stack-Migration PRs #44 und #45 wurden geschlossen, damit die neue UI aus #46 erhalten bleibt.
- Alte Sammel-Todos wurden geschlossen oder in dokumentierte Roadmap-/Backlog-Abschnitte ueberfuehrt.

### B6.6.31

- Dependabot PR #11 wurde per Squash gemergt.
- `three` wurde im Frontend auf `0.184.0` aktualisiert.
- `@types/three` wurde im Frontend auf `0.184.0` aktualisiert.
- Vor dem Merge war CI gruen: TypeScript Check, Frontend Build, Python Tests und Python Lint.

### B6.6.30

- `frontend/package-lock.json` ist jetzt Teil des Repositorys.
- `FIRST_SETUP.ps1` nutzt mit Lockfile `npm ci` fuer reproduzierbare Frontend Installationen.
- Frontend Paketmetadaten wurden auf B6.6.30 aktualisiert.

### B6.6.29

- Release Packager schliesst Root Runtime Daten aus, aber behaelt Quellcode unter `frontend/src/features/runtime`.
- Installer Selbstpruefung startet Backend mit Uvicorn und prueft `/health`.
- Echter Installer Endanwender Test aus frischem Release ZIP wurde erfolgreich lokal ausgefuehrt.
- Der alte Release `B6.6.26` ist als Installationspaket ueberholt; neuer Release Tag folgt nach diesem Fix.

## Abgeschlossene Todos

| Thema | Abschluss |
|---|---|
| Root Cleanup PR #40 | Gemergt in `main` |
| Stack Migration PR #43/#44 | Geschlossen, weil neue UI aus #46 Vorrang hat |
| Addon Visibility PR #45 | Geschlossen, weil UI nach #46 neu bewertet werden muss |
| Real Assist Roadmap Issue #42 | Dokumentiert in `docs/real-assist-roadmap.md` |
| Frontend Cleanup Issue #41 | Geschlossen als veraltet nach UI Overhaul #46 |
| Alte Architektur-Issues #16-#22 | Geschlossen als archivierter Backlog, Wiederaufnahme nur mit konkretem Branch |

## Offene Updates und Todos

Keine aktiven Repo-Todos. Neue Arbeit startet ab jetzt als kleiner, konkreter Branch mit klarer Akzeptanzliste.

## Roadmap Dokumente

| Datei | Zweck |
|---|---|
| `docs/lifeos-roadmap.md` | Ausgearbeitete LifeOS Upgrade Roadmap mit Modulen, Nutzen, Umsetzung und Akzeptanzkriterien |
| `docs/lifeos-global-upgrade.md` | Grundkonzept des LifeOS Global Upgrade |
| `docs/lifeos-private-config.md` | Anleitung für die private lokale LifeOS Konfiguration |
| `docs/installer-readiness.md` | Anleitung für den nicht destruktiven Installer Vorab Check |
| `docs/backend-health-check.md` | Anleitung zum Backend Health Check beim Start |
| `docs/diagcenter.md` | Anleitung zum zentralen DiagCenter Sammel Endpunkt |
| `docs/tidy-root-migration-notes.md` | Notizen zur Root Hygiene Migration und zur Wrapper Entscheidung |
| `docs/real-assist-roadmap.md` | Archivierte Real Assist Produktlinie mit Privacy Regeln und Testplan |
| `CHANGELOG.md` | Versionierte Änderungen |
| `PROJECT_STATUS.md` | Projektstand, offene Todos, Risiken und nächster sinnvoller Schritt |

## Risiken

| Risiko | Einschätzung | Empfehlung |
|---|---|---|
| Installer Fehler bei Endanwendern | reduziert | Readiness Check, Health Check und Root Wrapper sind vorhanden; frischer Windows Smoke Test bleibt sinnvoll |
| Browser Autoplay blockiert Sound nach Reload | reduziert | Re Unlock ist vorbereitet, muss lokal im Browser getestet werden |
| Dependabot Major Updates | hoch | React, TypeScript, Vite und Actions Major Updates nicht blind mergen |
| Private Daten im Repo | reduziert | `config/lifeos.json` ist ignoriert, trotzdem vor Commits prüfen |
| Roadmap wird zu groß ohne Umsetzung | reduziert | Sammel-Todos sind geschlossen; neue Arbeit nur mit konkretem Branch |

## Nächster sinnvoller Schritt

Aktuell gibt es keine offenen Sammel-Todos. Der nächste Schritt sollte bewusst neu gewählt werden, zum Beispiel Installer Smoke Test, ein kleiner Backend-Fix oder ein gezielter UI-Check auf dem aktuellen `main`.

## Pflege Ablauf

Vor jedem Commit oder Pull Request prüfen:

```text
1. Wurde etwas Nutzer sichtbares geändert?
2. Wurde ein technischer Meilenstein erreicht?
3. Hat sich ein offener Punkt erledigt?
4. Ist ein neues Risiko oder Todo entstanden?
5. Müssen CHANGELOG.md und PROJECT_STATUS.md angepasst werden?
```
