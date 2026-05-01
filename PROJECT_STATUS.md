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
| Launcher | erledigt | Startseite mit Global Overview, ULTRON Grid und LifeOS Einstieg vorhanden |
| Global Overview | erledigt | Stabile Weltkarten Ansicht als lokaler HUD Prototyp vorhanden |
| ULTRON Grid | erledigt | JARVIS und ULTRON Command Grid mit Modus Umschaltung vorhanden |
| LifeOS Command Center | erledigt | Erste sichtbare LifeOS Oberfläche vorhanden |
| LifeOS lokale Daten | erledigt | Beispielkonfiguration vorhanden und LifeOS kann lokale JSON Werte laden |
| LifeOS Daily Briefing | erledigt | LifeOS erzeugt eine erste Tageslage aus Prioritäten, offenen Schleifen, Energie, Fokuszeit und Work Radar |
| Installer | offen | Installer muss weiter auf echte Endanwender Robustheit geprüft werden |
| Backend Integration | offen | LifeOS liest noch keine echten Daten aus Backend oder lokaler Runtime |
| Tests und CI | vorhanden | CI ist angelegt, muss bei größeren Dependency Updates aufmerksam geprüft werden |

## Erledigte Updates

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
- Installer Logik teilweise verbessert.

## Offene Updates und Todos

| Priorität | Thema | Status | Nächster Schritt |
|---|---|---|---|
| Hoch | Installer Prüfung | offen | Start, First Setup, Python Erkennung und PowerShell ExecutionPolicy erneut testen |
| Hoch | LifeOS echte lokale Datei | offen | nicht versionierte `config/lifeos.json` für persönliche lokale Daten vorbereiten |
| Mittel | Backend Health Check | offen | lokalen `/health` Check sauber mit Frontend und Installer verbinden |
| Mittel | DiagCenter | offen | Diagnose Modul für Python, Node, Ports, Config und Logs konkretisieren |
| Mittel | Work Radar | offen | Struktur für SAP, FSM, Mail, LNW und offene Rückfragen weiter konkretisieren |
| Mittel | Knowledge Index | offen | lokale Wissensstruktur für Notizen, Dokumente und Projektwissen definieren |
| Niedrig | UI Feinschliff LifeOS | offen | Layout, Texte und Live Werte nach erstem lokalen Test nachschärfen |
| Niedrig | Release ZIP | offen | GitHub Release Workflow mit echtem Tag testen |

## Risiken

| Risiko | Einschätzung | Empfehlung |
|---|---|---|
| Browser blockiert lokale JSON Datei | mittel | LifeOS über lokalen Server starten oder später Backend API nutzen |
| Dependabot Major Updates | hoch | React, TypeScript, Vite und Actions Major Updates nicht blind mergen |
| Installer Fehler bei Endanwendern | hoch | Installer weiterhin als eigener Schwerpunkt behandeln |
| Private Daten im Repo | hoch | echte lokale Dateien wie `config/lifeos.json` nicht committen |

## Nächster sinnvoller Schritt

Nach dem Daily Briefing Generator ist der nächste sinnvolle Schritt die lokale persönliche Datei `config/lifeos.json`. Diese Datei soll echte private Werte enthalten können, darf aber nicht ins Repository committed werden.

Empfohlene Reihenfolge:

```text
1. config/lifeos.json als lokale, ignorierte Datei vorbereiten
2. LifeOS bevorzugt config/lifeos.json laden lassen und danach auf lifeos.example.json fallen lassen
3. Installer Robustheit erneut prüfen
4. Backend Health Check sauber anbinden
5. Erst danach größere Dependency Updates angehen
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
