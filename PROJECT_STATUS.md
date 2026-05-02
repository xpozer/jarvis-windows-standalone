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
| Launcher | erledigt | Startseite mit Global Overview, ULTRON Grid, LifeOS und DiagCenter Einstieg vorhanden |
| Global Overview | erledigt | Stabile Weltkarten Ansicht als lokaler HUD Prototyp vorhanden |
| ULTRON Grid | erledigt | JARVIS und ULTRON Command Grid mit Modus Umschaltung vorhanden |
| LifeOS Command Center | erledigt | Erste sichtbare LifeOS Oberfläche vorhanden |
| LifeOS lokale Daten | erledigt | Beispielkonfiguration vorhanden und LifeOS kann lokale JSON Werte laden |
| LifeOS Daily Briefing | erledigt | LifeOS erzeugt eine erste Tageslage aus Prioritäten, offenen Schleifen, Energie, Fokuszeit und Work Radar |
| LifeOS Roadmap Module | vorbereitet | Learning, Decision, Projects, Energy, Finance, Memory und Automation sind local-first im Briefing und UI sichtbar |
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
| Backend Integration | in Arbeit | Backend Health und DiagCenter sind angebunden, weitere Frontend Diagnose Integration folgt |
| Tests und CI | erledigt | CI nutzt Node.js 24, Frontend Lockfile ist versioniert, Ruff/Black/Pytest sind gruen |

## Erledigte Updates

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

## Offene Updates und Todos

| Priorität | Thema | Status | Nächster Schritt |
|---|---|---|---|
| Hoch | Root Cleanup PR #40 | offen | PR #40 reviewen, Root Skripte prüfen, lokal INSTALL/START/DIAGNOSE testen und dann mergen oder Review anfordern |
| Mittel | Stack Migration PR #43 | draft | Erst nach PR #40 rebasen und Maintainer Entscheidung dokumentieren |
| Mittel | Decision Assistant | vorbereitet | echte private Entscheidungen lokal in `config/lifeos.json` eintragen |
| Mittel | Private Project Manager | vorbereitet | echte private Projekte lokal in `config/lifeos.json` eintragen |
| Mittel | Health und Energy Radar | vorbereitet | echte Energie- und Fokusdaten lokal pflegen |
| Mittel | Finance und Contract Radar | vorbereitet | echte Vertrags- und Fristdaten nur lokal pflegen |
| Mittel | Memory und Knowledge Layer | vorbereitet | lokale Regeln, Notizen und Quellen weiter ausbauen |
| Niedrig | Voice und Push to Talk | erledigt | Browser Speech Recognition angebunden, TTS optional ueber Voice Settings |
| Niedrig | Automation Layer | erledigt | Audit Log fuer echte Ausfuehrungen ist im Backend angebunden |
| Niedrig | Release ZIP | erledigt | GitHub Release `B6.6.26` wurde erfolgreich erzeugt; naechster Schritt ist Installer Endanwender Test |

## Roadmap Dokumente

| Datei | Zweck |
|---|---|
| `docs/lifeos-roadmap.md` | Ausgearbeitete LifeOS Upgrade Roadmap mit Modulen, Nutzen, Umsetzung und Akzeptanzkriterien |
| `docs/lifeos-global-upgrade.md` | Grundkonzept des LifeOS Global Upgrade |
| `docs/lifeos-private-config.md` | Anleitung für die private lokale LifeOS Konfiguration |
| `docs/installer-readiness.md` | Anleitung für den nicht destruktiven Installer Vorab Check |
| `docs/backend-health-check.md` | Anleitung zum Backend Health Check beim Start |
| `docs/diagcenter.md` | Anleitung zum zentralen DiagCenter Sammel Endpunkt |
| `CHANGELOG.md` | Versionierte Änderungen |
| `PROJECT_STATUS.md` | Projektstand, offene Todos, Risiken und nächster sinnvoller Schritt |

## Risiken

| Risiko | Einschätzung | Empfehlung |
|---|---|---|
| Installer Fehler bei Endanwendern | reduziert | Readiness Check und Health Check vorhanden, echter Test auf frischem Windows bleibt nötig |
| Browser Autoplay blockiert Sound nach Reload | reduziert | Re Unlock ist vorbereitet, muss lokal im Browser getestet werden |
| Dependabot Major Updates | hoch | React, TypeScript, Vite und Actions Major Updates nicht blind mergen |
| Private Daten im Repo | reduziert | `config/lifeos.json` ist ignoriert, trotzdem vor Commits prüfen |
| Roadmap wird zu groß ohne Umsetzung | mittel | pro PR nur ein klarer Roadmap Punkt umsetzen |
| Merge Stau | hoch | PR #40 zuerst bereinigen und erst danach PR #43 rebasen |

## Nächster sinnvoller Schritt

Merge Stau seriell weiter abbauen.

Empfohlene Reihenfolge:

```text
1. PR #40 Root Cleanup reviewen und mergen oder konkrete Changes anfordern
2. main lokal pullen und INSTALL_JARVIS.bat, START_JARVIS.bat und DIAGNOSE.bat prüfen
3. PR #43 auf neuen main rebasen und Maintainer Entscheidung dokumentieren
```

## Pflege Ablauf

Vor jedem Commit oder Pull Request prüfen:

```text
1. Wurde etwas Nutzer sichtbares geändert?
2. Wurde ein technischer Meilenstein erreicht?
3. Hat sich ein offener Punkt erledigt?
4. Ist ein neues Risiko oder Todo entstanden?
5. Müssen CHANGELOG.md und PROJECT_STATUS.md angepasst werden?
```
