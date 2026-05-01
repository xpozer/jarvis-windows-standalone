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
| Dashboard Theme System | in Arbeit | Konzept und Snippets für JARVIS, MATRIX und ULTRON liegen unter `docs/dashboard-theme-system-implementation.md` |
| ULTRON Grid | erledigt | JARVIS und ULTRON Command Grid mit Modus Umschaltung vorhanden |
| LifeOS Command Center | erledigt | Erste sichtbare LifeOS Oberfläche vorhanden |
| DiagCenter Frontend | erledigt | Lokale HUD Seite `frontend/public/jarvis-diagcenter.html` zeigt Checks, Sections und Raw JSON |
| Autonome Assistant Roadmap | in Arbeit | Neue fünf Block Roadmap liegt unter `docs/autonomous-assistant-roadmap.md` auf `feature/screen` |
| Screen Perception 1.1 | erledigt | Modulstruktur für Bildschirm Beobachtung ist auf `feature/screen` angelegt |
| Screen Perception 1.2 | erledigt | Privacy First Konfiguration, Pause Status, Beispielconfig und Indikator Grundlage ergänzt |
| JARVIS Sound Layer | erledigt | Lokaler Web Audio Sound Layer vorhanden. Re Unlock nach Reload ist vorbereitet |
| Installer Readiness Check | erledigt | Nicht destruktiver Vorab Check für Installer Voraussetzungen vorhanden |
| Backend Health Check | erledigt | Startskript prüft Port 8000 und `/health`, bevor JARVIS als bereit gilt |
| DiagCenter Backend | erledigt | Zentraler Sammel Endpunkt `/diagnostic/center` bündelt Health, Self Check, Dependencies, Ports, Logs und Runtime Status |
| Installer | in Arbeit | Installer selbst ist robust, zusätzlicher Vorab Check ergänzt. Lokaler echter Endanwender Test bleibt offen |
| Tests und CI | vorhanden | CI ist angelegt, muss bei größeren Dependency Updates aufmerksam geprüft werden |

## Erledigte Updates

### B6.8.0 Themes Plan

- Dashboard Theme System Umsetzungsdokument `docs/dashboard-theme-system-implementation.md` ergänzt.
- Theme Switcher Grundsystem für JARVIS, MATRIX und ULTRON dokumentiert.
- MATRIX CSS Override, Code Rain Layer und Theme Parameter als prüfbare Snippets vorbereitet.
- Changelog und PROJECT_STATUS gemäß Pflege Regel aktualisiert.

### B6.6.18

- DiagCenter Frontend Seite `frontend/public/jarvis-diagcenter.html` ergänzt.
- Launcher um `DIAGCENTER` Einstieg erweitert.
- DiagCenter Frontend zeigt Checks, Sections und Raw JSON aus `/diagnostic/center`.
- Changelog und PROJECT_STATUS gemäß Pflege Regel aktualisiert.

### B6.6.17

- DiagCenter Sammel Endpunkt `GET /diagnostic/center` ergänzt.
- DiagCenter bündelt Backend Health, Self Check, Dependencies, Ports, Logs, System Status, UseJARVIS Runtime und Awareness Runtime.
- Dokumentation `docs/diagcenter.md` ergänzt.
- Changelog und PROJECT_STATUS gemäß Pflege Regel aktualisiert.

### B6.6.16

- Backend Health Check im Startskript ergänzt.
- `START_JARVIS.ps1` prüft nach Port 8000 zusätzlich `http://127.0.0.1:8000/health`.
- Dokumentation `docs/backend-health-check.md` ergänzt.
- Changelog und PROJECT_STATUS gemäß Pflege Regel aktualisiert.

### B6.6.15

- Installer Readiness Check unter `scripts/maintenance/check-installer-readiness.ps1` ergänzt.
- Dokumentation `docs/installer-readiness.md` ergänzt.
- Vorprüfung für PowerShell, wichtige Root Dateien, Python, Node.js, npm, winget, Ollama, Ports und LifeOS Config ergänzt.
- Changelog und PROJECT_STATUS gemäß Pflege Regel aktualisiert.

### B6.6.14

- Sound Re Unlock im Frontend ergänzt.
- Sound Engine setzt bei aktivem Sound und gesperrtem AudioContext automatisch Listener für den nächsten Nutzerklick oder Tastendruck.
- Listener nutzen eine stabile Referenz und können korrekt entfernt werden.
- Changelog und PROJECT_STATUS gemäß Pflege Regel aktualisiert.

### B6.6.13

- Sound Engine prüft jetzt, ob der AudioContext wirklich freigeschaltet ist, bevor Events abgespielt werden.
- Reload Problem entschärft, bei dem Sound im HUD als aktiviert gespeichert war, der Browser AudioContext aber noch gesperrt blieb.
- WebKit Fallback für `webkitAudioContext` ergänzt.
- Changelog und PROJECT_STATUS gemäß Pflege Regel aktualisiert.

### B6.6.12

- Sound Layer v1 mit lokaler Web Audio Engine ohne externe Audio Dateien ergaenzt.
- Sound Toggle und Lautstaerke Regler im HUD eingebaut.
- Chat und Orb Events triggern dezente Sounds fuer Agent Routing, Memory, Provider Kontakt, Antwortstart, Abschluss, Listening und Fehlerpulse.
- Sound ist standardmaessig aus und wird erst nach bewusster Nutzeraktion aktiviert.

## Offene Updates und Todos

| Priorität | Thema | Status | Nächster Schritt |
|---|---|---|---|
| Hoch | Dashboard Theme Integration | offen | Theme Switcher und MATRIX Theme in `frontend/public/jarvis-global-overview-standalone.html` integrieren |
| Hoch | Screen Perception 1.3 | offen | Performance Grundlagen mit WebP Ring Buffer Limit, Diff Detection und Speichergrenze ergänzen |
| Hoch | Installer Endanwender Test | offen | Readiness Check, INSTALL_JARVIS.bat und START_JARVIS.bat auf frischem Windows lokal ausführen |
| Mittel | Dashboard ULTRON Theme | offen | ULTRON CSS Override, Circuit Layer und mechanische Canvas Parameter ergänzen |
| Mittel | Episodic Memory | offen | Nach Abschluss Block 1 beginnen |
| Mittel | Mail Triage | offen | Nach Abschluss Block 2 beginnen |
| Mittel | Multi Agent System | offen | Nach Abschluss Block 3 beginnen |
| Mittel | Daily Planning und Weekly Review | offen | Nach Abschluss Block 4 beginnen |
| Niedrig | Release ZIP | offen | GitHub Release Workflow mit echtem Tag testen |

## Roadmap Dokumente

| Datei | Zweck |
|---|---|
| `docs/dashboard-theme-system-implementation.md` | Umsetzungsskizze und prüfbare Snippets für JARVIS, MATRIX und ULTRON Themes |
| `docs/autonomous-assistant-roadmap.md` | Neue fünf Block Roadmap für autonomen Personal Assistenten |
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
| Theme Integration beschädigt Single File Dashboard | mittel | Zuerst Snippets dokumentieren, danach kleine gezielte Integration in eigener Branch |
| Matrix Code Rain belastet FPS | mittel | Viewport Reduktion, Reduced Motion und Canvas Parameter nutzen |
| Screen Perception erfasst sensible Daten | hoch | Default Off, Blocklist, Pause Funktion und AuditLog zwingend vor Aktivierung ausbauen |
| Vision Modell belastet System | mittel | Diff Detection, Caching und Intervallsteuerung vor Dauerbetrieb einbauen |
| Installer Fehler bei Endanwendern | reduziert | Readiness Check und Health Check vorhanden, echter Test auf frischem Windows bleibt nötig |
| Dependabot Major Updates | hoch | React, TypeScript, Vite und Actions Major Updates nicht blind mergen |

## Nächster sinnvoller Schritt

Nach dem Theme Plan ist der nächste sinnvolle Schritt die kleine Integration des Theme Switchers und des MATRIX Themes in das bestehende Global Overview Dashboard.

Empfohlene Reihenfolge:

```text
1. Theme Switcher und MATRIX Theme integrieren
2. MATRIX Code Rain lokal prüfen
3. ULTRON Theme ergänzen
4. Accessibility und Reduced Motion prüfen
5. Danach zurück zu Screen Perception 1.3
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
