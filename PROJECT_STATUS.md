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
| LifeOS private Config | erledigt | `config/lifeos.json` wird bevorzugt geladen und über `.gitignore` aus dem Repository gehalten |
| LifeOS Roadmap | erledigt | Ausgearbeitete Upgrade Roadmap liegt unter `docs/lifeos-roadmap.md` |
| Autonome Assistant Roadmap | in Arbeit | Neue fünf Block Roadmap liegt unter `docs/autonomous-assistant-roadmap.md` |
| Screen Perception 1.1 | erledigt | Modulstruktur für Bildschirm Beobachtung ist auf `feature/screen` angelegt |
| Screen Perception 1.2 | erledigt | Privacy First Konfiguration, Pause Status, Beispielconfig und Indikator Grundlage ergänzt |
| Screen Perception 1.3 | erledigt | WebP, Diff Detection, Ring Buffer nach Frames und 100 MB Speicherlimit ergänzt |
| LifeOS persönliche Vorlage | erledigt | Skript und Anleitung zum Erzeugen der privaten `config/lifeos.json` vorhanden |
| JARVIS Sound Layer | erledigt | Lokaler Web Audio Sound Layer vorhanden. Re Unlock nach Reload ist vorbereitet |
| Installer Readiness Check | erledigt | Nicht destruktiver Vorab Check für Installer Voraussetzungen vorhanden |
| Backend Health Check | erledigt | Startskript prüft Port 8000 und `/health`, bevor JARVIS als bereit gilt |
| DiagCenter Backend | erledigt | Zentraler Sammel Endpunkt `/diagnostic/center` bündelt Health, Self Check, Dependencies, Ports, Logs und Runtime Status |
| DiagCenter Frontend | erledigt | Lokale HUD Seite `frontend/public/jarvis-diagcenter.html` zeigt Checks, Sections und Raw JSON |
| Installer | in Arbeit | Installer selbst ist robust, zusätzlicher Vorab Check ergänzt. Lokaler echter Endanwender Test bleibt offen |
| Backend Integration | in Arbeit | Backend Health und DiagCenter sind angebunden, weitere Frontend Diagnose Integration folgt |
| Tests und CI | vorhanden | CI ist angelegt, muss bei größeren Dependency Updates aufmerksam geprüft werden |

## Erledigte Updates

### B6.7.0 Screen 1.3

- Performance Konfiguration in `backend/perception/screen/config.py` ergänzt.
- Capturer speichert Screenshots als WebP mit konfigurierbarer Qualität.
- Diff Detection über verkleinerten Graustufen Hash ergänzt.
- Bei unverändertem Bild wird keine neue Datei geschrieben.
- Ring Buffer begrenzt jetzt nach Frame Anzahl und Speicherlimit.
- Beispielkonfiguration und README aktualisiert.
- Changelog und PROJECT_STATUS gemäß Pflege Regel aktualisiert.

### B6.7.0 Screen 1.2

- Privacy First Konfigurationsmodell `backend/perception/screen/config.py` ergänzt.
- Sichere Beispielkonfiguration `config/screen-perception.example.json` ergänzt.
- Private Konfiguration `config/screen-perception.json` und temporärer Buffer `tmp/` werden ignoriert.
- Pause Status, Runtime Status, Aktivitätsindikator und Pause Hotkey Grundlage ergänzt.
- Screen Perception README aktualisiert.
- Changelog und PROJECT_STATUS gemäß Pflege Regel aktualisiert.

### B6.7.0 Screen 1.1

- Autonome Assistant Roadmap unter `docs/autonomous-assistant-roadmap.md` ergänzt.
- Screen Perception Modulstruktur unter `backend/perception/screen/` angelegt.
- Scaffolds für Capturer, Window Tracker, Vision Analyse, OCR Fallback, Context Builder und Privacy Policy ergänzt.
- Datenmodelle für Screen Kontext ergänzt.
- Screen Perception README ergänzt.
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

### B6.6.11

- Work Radar 2.0 um Kategorien, Risiko Zusammenfassung, Status Zusammenfassung, Fristlage und naechste Work Aktion erweitert.
- LifeOS Backend normalisiert Arbeitsthemen mit Kategorie, Due State und Prioritaetswert.
- LifeOS Panel zeigt kompakte Work Kennzahlen und Kategorien im bestehenden HUD Stil.
- `config/lifeos.example.json` enthaelt explizite Kategorien fuer LNW, FSM und Mail.

### B6.6.6

- Setup Skript `scripts/maintenance/setup-lifeos-config.ps1` ergänzt.
- Dokumentation `docs/lifeos-private-config.md` ergänzt.
- Skript kopiert `config/lifeos.example.json` nach `config/lifeos.json`.
- Bestehende private Konfiguration wird nur mit `-Force` überschrieben.
- Changelog und PROJECT_STATUS gemäß Pflege Regel aktualisiert.

### B6.6.5

- LifeOS Upgrade Roadmap unter `docs/lifeos-roadmap.md` ergänzt.
- Roadmap enthält Daily Command Center, Work Radar 2.0, Learning Coach, Health und Energy Radar, Finance und Contract Radar, Private Project Manager, Decision Assistant, Memory und Knowledge Layer, Voice und Automation Layer.
- PROJECT_STATUS verweist auf die Roadmap und führt die wichtigsten offenen Roadmap Punkte als Todos.

### B6.6.4

- `config/lifeos.json` wird als private lokale LifeOS Datei vorbereitet.
- `.gitignore` schließt `config/lifeos.json` aus.
- LifeOS lädt zuerst `config/lifeos.json`, danach `config/lifeos.example.json`, danach interne Fallback Daten.
- Datenstatus unterscheidet private, Beispiel und Fallback Daten.
- Changelog und PROJECT_STATUS gemäß Pflege Regel aktualisiert.

### B6.6.3

- LifeOS Daily Briefing Generator ergänzt.
- LifeOS erzeugt eine verständliche Tageslage aus JSON Daten oder Fallback Daten.
- Die generierte Tageslage bewertet Prioritäten, offene Schleifen, Energie, Fokuszeit und Work Radar.
- Changelog und PROJECT_STATUS gemäß Pflege Regel aktualisiert.

### B6.6.2

- LifeOS Command Center lädt lokale Werte aus `config/lifeos.example.json`, wenn die Seite über einen lokalen Server läuft.
- Interner Fallback ergänzt, falls der Browser lokales Datei Laden blockiert.
- Daily Briefing, Work Radar, Timeline, Life Modules und Next Best Action werden dynamisch gerendert.
- Changelog und PROJECT_STATUS gemäß Pflege Regel aktualisiert.

### B6.6.1

- `config/lifeos.example.json` vorbereitet.
- LifeOS Datenstruktur für Daily Briefing, Work Radar, Life Modules, Timeline und Security ergänzt.
- Dokumentation um lokale LifeOS Daten erweitert.
- Hinweis ergänzt, dass echte lokale Daten nicht ins Repository gehören.
- Verbindliche Pflege Regel für `CHANGELOG.md` und `PROJECT_STATUS.md` ergänzt.

### B6.6.0

- LifeOS Command Center Prototyp erstellt.
- Launcher um LifeOS erweitert.
- Dokumentation `docs/lifeos-global-upgrade.md` angelegt.
- Changelog um LifeOS ergänzt.

### B6.5.1

- GitHub Actions CI ergänzt.
- Release Workflow ergänzt.
- Dependabot ergänzt.
- Issue und Pull Request Templates ergänzt.
- Changelog und Contribution Dokumentation ergänzt.

## Offene Updates und Todos

| Priorität | Thema | Status | Nächster Schritt |
|---|---|---|---|
| Hoch | Screen Perception 1.4 | offen | Kontext Datenmodell finalisieren und Felder für Timestamp, Anwendung, Fenstertitel, Text, UI Elemente und Intent Guess prüfen |
| Hoch | Installer Endanwender Test | offen | Readiness Check, INSTALL_JARVIS.bat und START_JARVIS.bat auf frischem Windows lokal ausführen |
| Mittel | Episodic Memory | offen | Nach Abschluss Block 1 beginnen |
| Mittel | Mail Triage | offen | Nach Abschluss Block 2 beginnen |
| Mittel | Multi Agent System | offen | Nach Abschluss Block 3 beginnen |
| Mittel | Daily Planning und Weekly Review | offen | Nach Abschluss Block 4 beginnen |
| Mittel | Decision Assistant | offen | Nach aktueller autonomen Roadmap später einordnen |
| Mittel | Private Project Manager | offen | Nach aktueller autonomen Roadmap später einordnen |
| Mittel | Health und Energy Radar | offen | Nach aktueller autonomen Roadmap später einordnen |
| Mittel | Finance und Contract Radar | offen | Nach aktueller autonomen Roadmap später einordnen |
| Mittel | Memory und Knowledge Layer | offen | Nach aktueller autonomen Roadmap später einordnen |
| Niedrig | Voice und Push to Talk | offen | Mikrofon default off, lokale TTS und bewusste Aktivierung planen |
| Niedrig | Automation Layer | offen | lokale Automationen mit RiskLevel, Freigabe und Audit Log vorbereiten |
| Niedrig | Release ZIP | offen | GitHub Release Workflow mit echtem Tag testen |

## Roadmap Dokumente

| Datei | Zweck |
|---|---|
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
| Screen Perception erfasst sensible Daten | hoch | Default Off, Blocklist, Pause Funktion und AuditLog zwingend vor Aktivierung ausbauen |
| Vision Modell belastet System | reduziert | Diff Detection, Caching Grundlage und Intervallsteuerung sind vorbereitet. Lokaler Performance Test bleibt nötig |
| Installer Fehler bei Endanwendern | reduziert | Readiness Check und Health Check vorhanden, echter Test auf frischem Windows bleibt nötig |
| Browser Autoplay blockiert Sound nach Reload | reduziert | Re Unlock ist vorbereitet, muss lokal im Browser getestet werden |
| Dependabot Major Updates | hoch | React, TypeScript, Vite und Actions Major Updates nicht blind mergen |
| Private Daten im Repo | reduziert | `config/lifeos.json` und `config/screen-perception.json` sind ignoriert, trotzdem vor Commits prüfen |

## Nächster sinnvoller Schritt

Nach Aufgabe 1.3 ist der nächste sinnvolle Schritt Screen Perception 1.4. Dabei wird das Kontext Datenmodell finalisiert und gegen die Roadmap Felder geprüft.

Empfohlene Reihenfolge:

```text
1. Screen Perception 1.4 Kontext Datenmodell finalisieren
2. Screen Perception 1.5 Memory Integration
3. Screen Perception 1.6 Proaktive Trigger
4. Screen Perception 1.7 User Kommandos
5. Screen Perception 1.8 AuditLog
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
