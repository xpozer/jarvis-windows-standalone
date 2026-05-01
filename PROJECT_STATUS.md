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
| Installer Readiness Check | erledigt | Nicht destruktiver Vorab Check für Installer Voraussetzungen vorhanden |
| Backend Health Check | erledigt | Startskript prüft Port 8000 und `/health`, bevor JARVIS als bereit gilt |
| DiagCenter Backend | erledigt | Zentraler Sammel Endpunkt `/diagnostic/center` bündelt Health, Self Check, Dependencies, Ports, Logs und Runtime Status |
| DiagCenter Frontend | erledigt | Lokale HUD Seite `frontend/public/jarvis-diagcenter.html` zeigt Checks, Sections und Raw JSON |
| Dashboard Themes | erledigt | JARVIS, MATRIX und ULTRON sind als eigene Global Themes Seite und direkt unter Optionen / Updates im React Dashboard eingebunden |
| Installer | in Arbeit | Installer selbst ist robust, zusätzlicher Vorab Check ergänzt. Lokaler echter Endanwender Test bleibt offen |
| Backend Integration | in Arbeit | Backend Health und DiagCenter sind angebunden, weitere Frontend Diagnose Integration folgt |
| Tests und CI | vorhanden | CI ist angelegt, muss bei größeren Dependency Updates aufmerksam geprüft werden |

## Erledigte Updates

### B6.6.23

- Chat Mikrofon Button nutzt jetzt echte Browser Speech Recognition als Push-to-Talk.
- Voice Status und Live Transkript sind direkt am Eingabefeld sichtbar.
- Transkripte werden im Voice Runtime Backend gespeichert und erst bewusst in den Chat uebernommen.
- Optionale Browser TTS fuer JARVIS Antworten nutzt vorhandene Voice Settings, bleibt aber standardmaessig aus.

### B6.6.22

- LifeOS Briefing liefert jetzt Decision Layer, Private Projects, Energy Profile, Finance Radar, Memory Layer und Automation Layer.
- `config/lifeos.example.json` enthaelt sichere lokale Beispielschemata fuer die restlichen LifeOS Roadmap Module.
- LifeOS Panel zeigt die Roadmap Module als kompakte Karten, ohne die Startseite zu ueberladen.
- `docs/lifeos-roadmap.md` wurde passend zum Umsetzungsstand aktualisiert.

### B6.6.21

- `Update Center` wurde in der Sidebar zu `Optionen / Updates` umbenannt.
- Der Theme Wechseler ist jetzt direkt im sichtbaren React Dashboard unter System eingebunden.
- JARVIS, MATRIX und ULTRON koennen dort direkt gewechselt werden und bleiben per `localStorage` gespeichert.
- MATRIX und ULTRON haben nun eigene staerkere Gestaltungskonzepte statt nur eingefaerbter JARVIS Oberflaeche.
- `START_JARVIS.ps1` erkennt veraltete Frontend Builds nach einem Pull und baut automatisch neu.
- Die Build-Erkennung nutzt nun auch den aktuellen Git Commit, damit alte `dist` Bundles sicher erneuert werden.

### B6.6.20

- FastAPI Static Fallback erweitert: Standalone HTML Seiten aus `frontend/public` werden jetzt direkt ausgeliefert.
- `jarvis-global-overview-themed.html` zeigt dadurch die Theme Seite statt der React Chat Oberflaeche.
- Regressionstest fuer Public HTML vor SPA Fallback ergaenzt.

### B6.6.19

- Themable Global Overview Seite `frontend/public/jarvis-global-overview-themed.html` eingebunden.
- Launcher Einstieg `GLOBAL THEMES` fuer JARVIS, MATRIX und ULTRON Theme Switcher ergaenzt.
- Dokumentation und Test Checkliste fuer das Dashboard Theme System ergaenzt.
- Die stabile bestehende `GLOBAL OVERVIEW` Seite bleibt als eigener Einstieg erhalten.

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
| Hoch | Installer Endanwender Test | offen | Readiness Check, INSTALL_JARVIS.bat und START_JARVIS.bat auf frischem Windows lokal ausführen |
| Mittel | Decision Assistant | vorbereitet | echte private Entscheidungen lokal in `config/lifeos.json` eintragen |
| Mittel | Private Project Manager | vorbereitet | echte private Projekte lokal in `config/lifeos.json` eintragen |
| Mittel | Health und Energy Radar | vorbereitet | echte Energie- und Fokusdaten lokal pflegen |
| Mittel | Finance und Contract Radar | vorbereitet | echte Vertrags- und Fristdaten nur lokal pflegen |
| Mittel | Memory und Knowledge Layer | vorbereitet | lokale Regeln, Notizen und Quellen weiter ausbauen |
| Niedrig | Voice und Push to Talk | erledigt | Browser Speech Recognition angebunden, TTS optional ueber Voice Settings |
| Niedrig | Automation Layer | vorbereitet | Audit Log fuer echte Ausfuehrungen anbinden |
| Niedrig | Release ZIP | offen | GitHub Release Workflow mit echtem Tag testen |

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

## Nächster sinnvoller Schritt

Nach Voice und den vorbereiteten LifeOS Roadmap Modulen ist der nächste sinnvolle Schritt der Automation Layer mit echtem Audit Log.

Empfohlene Reihenfolge:

```text
1. Automation Audit Log anbinden
2. Release ZIP Workflow testen
3. Installer Endanwender Test durchführen
4. echte lokale LifeOS Daten in `config/lifeos.json` pflegen
5. Voice UX mit echtem Mikrofon im Browser testen
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
