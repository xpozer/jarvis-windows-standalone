# JARVIS Projektstatus

Diese Datei zeigt den aktuellen Stand des Projekts auf einen Blick. Sie ergänzt den Changelog.

Der Changelog dokumentiert, was versioniert geändert wurde. Diese Datei zeigt zusätzlich, was noch offen ist und was als Nächstes sinnvoll ist.

## Aktueller Stand

| Bereich | Status | Hinweis |
|---|---|---|
| Repository Basis | erledigt | Projektstruktur, README, Changelog, Contribution Regeln und Security Hinweise vorhanden |
| Launcher | erledigt | Startseite mit Global Overview, ULTRON Grid und LifeOS Einstieg vorhanden |
| Global Overview | erledigt | Stabile Weltkarten Ansicht als lokaler HUD Prototyp vorhanden |
| ULTRON Grid | erledigt | JARVIS und ULTRON Command Grid mit Modus Umschaltung vorhanden |
| LifeOS Command Center | erledigt | Erste sichtbare LifeOS Oberfläche vorhanden |
| LifeOS lokale Daten | in Arbeit | `config/lifeos.example.json` als sichere Beispielkonfiguration vorbereitet |
| Installer | offen | Installer muss weiter auf echte Endanwender Robustheit geprüft werden |
| Backend Integration | offen | LifeOS liest noch keine echten Daten aus Backend oder lokaler Runtime |
| Tests und CI | vorhanden | CI ist angelegt, muss bei größeren Dependency Updates aufmerksam geprüft werden |

## Erledigte Updates

### B6.6.1

- `config/lifeos.example.json` vorbereitet.
- LifeOS Datenstruktur für Daily Briefing, Work Radar, Life Modules, Timeline und Security ergänzt.
- Dokumentation um lokale LifeOS Daten erweitert.
- Hinweis ergänzt, dass echte lokale Daten nicht ins Repository gehören.

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
| Hoch | LifeOS Daten laden | offen | Frontend soll Werte aus `config/lifeos.example.json` oder später Backend API verwenden |
| Hoch | Daily Briefing Generator | offen | Kleine Logik bauen, die aus LifeOS Daten eine Tageslage erzeugt |
| Hoch | Installer Prüfung | offen | Start, First Setup, Python Erkennung und PowerShell ExecutionPolicy erneut testen |
| Mittel | Backend Health Check | offen | lokalen `/health` Check sauber mit Frontend und Installer verbinden |
| Mittel | DiagCenter | offen | Diagnose Modul für Python, Node, Ports, Config und Logs konkretisieren |
| Mittel | Work Radar | offen | Struktur für SAP, FSM, Mail, LNW und offene Rückfragen vorbereiten |
| Mittel | Knowledge Index | offen | lokale Wissensstruktur für Notizen, Dokumente und Projektwissen definieren |
| Niedrig | UI Feinschliff LifeOS | offen | Layout, Texte und Live Werte nach erstem lokalen Test nachschärfen |
| Niedrig | Release ZIP | offen | GitHub Release Workflow mit echtem Tag testen |

## Risiken

| Risiko | Einschätzung | Empfehlung |
|---|---|---|
| Dependabot Major Updates | hoch | React, TypeScript, Vite und Actions Major Updates nicht blind mergen |
| Zu viele UI Prototypen ohne Daten | mittel | Ab jetzt kleine echte Datenintegration vor weiterer Optik priorisieren |
| Installer Fehler bei Endanwendern | hoch | Installer weiterhin als eigener Schwerpunkt behandeln |
| Private Daten im Repo | hoch | echte lokale Dateien wie `config/lifeos.json` nicht committen |

## Nächster sinnvoller Schritt

LifeOS soll als Nächstes lokale Daten anzeigen. Dafür wird zuerst die Beispielkonfiguration genutzt. Danach kann eine echte lokale `config/lifeos.json` entstehen, die nicht ins Repository committed wird.

Empfohlene Reihenfolge:

```text
1. LifeOS lokalen Daten Loader bauen
2. Daily Briefing aus JSON erzeugen
3. PROJECT_STATUS.md nach jedem größeren Schritt aktualisieren
4. Installer Robustheit erneut prüfen
5. Erst danach größere Dependency Updates angehen
```

## Pflege Regel

Diese Datei sollte bei jedem größeren Projektstand aktualisiert werden.

Kurzregel:

```text
Changelog = was wurde versioniert geändert
PROJECT_STATUS = was ist erledigt, was ist offen, was kommt als Nächstes
```
