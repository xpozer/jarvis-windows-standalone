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
| LifeOS private Config | erledigt | `config/lifeos.json` wird bevorzugt geladen und über `.gitignore` aus dem Repository gehalten |
| LifeOS persönliche Vorlage | erledigt | Skript und Anleitung zum Erzeugen der privaten `config/lifeos.json` vorhanden |
| LifeOS Roadmap | erledigt | Ausgearbeitete Upgrade Roadmap liegt unter `docs/lifeos-roadmap.md` |
| LifeOS Daily Command Center | in Arbeit | Eigenes JARVIS Sidebar Panel, Status API, Briefing API und Regeneration sind vorhanden. Top 3 Aufgaben und UI Feinschliff bleiben offen |
| LifeOS Daily Briefing | erledigt | LifeOS erzeugt eine erste Tageslage aus Prioritäten, offenen Schleifen, Energie, Fokuszeit und Work Radar |
| Work Radar 2.0 | in Arbeit | Strukturierte Vorgänge mit Status, Risiko, Frist, Score und nächstem Schritt sind vorbereitet. UI Sortierung und echte Quellen fehlen noch |
| Backend Integration | in Arbeit | LifeOS API für Status, Briefing, Regeneration und Installer Check ist vorhanden. Echte Runtime Daten und weitere Module fehlen noch |
| Installer | in Arbeit | FIRST_SETUP bereitet private LifeOS Konfiguration vor. Robustheitstests sind ergänzt, echter Endanwender Test bleibt offen |
| Tests und CI | in Arbeit | Tests für LifeOS Briefing, Work Radar und Installer Robustheit sind ergänzt. CI und Dependabot müssen weiter beobachtet werden |

## Erledigte Updates

### B6.6.7

- LifeOS Daily Command Center als eigenes JARVIS Sidebar Panel integriert.
- Backend API für LifeOS Status, Briefing, Regeneration und Installer Check ergänzt.
- Work Radar 2.0 Struktur mit sortierbaren Vorgängen, Risiko, Status, Frist und nächstem Schritt vorbereitet.
- Tests für LifeOS Briefing, Work Radar und Installer Robustheit ergänzt.
- `config/lifeos.example.json` um `daily_briefing.summary` und strukturierte `work_radar.items` erweitert.
- `FIRST_SETUP.ps1` bereitet die private lokale LifeOS Konfiguration vor, ohne bestehende private Daten zu überschreiben.
- Changelog war bereits aktualisiert. PROJECT_STATUS wird mit diesem Update auf denselben Stand gebracht.

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
- Installer Logik teilweise verbessert.

## Offene Updates und Todos

| Priorität | Thema | Status | Nächster Schritt |
|---|---|---|---|
| Hoch | Daily Command Center UI Feinschliff | offen | Top 3 Aufgaben, Tagesfokus und klaren nächsten Schritt im Sidebar Panel sauber sichtbar machen |
| Hoch | Work Radar 2.0 UI Sortierung | offen | Vorgänge nach Risiko, Frist und Status sortieren und kritische Punkte hervorheben |
| Hoch | Installer Endanwender Test | offen | Start, First Setup, Python Erkennung und PowerShell ExecutionPolicy auf frischem Windows testen |
| Hoch | PR 30 prüfen | offen | PR 30 ist durch B6.6.7 teilweise überholt. Inhalt prüfen, relevante Teile übernehmen oder PR schließen |
| Mittel | Backend Runtime Daten | offen | LifeOS API mit echten lokalen Runtime Daten statt nur Beispiel oder Statusdaten versorgen |
| Mittel | Learning Coach | offen | Lernstände, Wiederholungen und Schwachstellen lokal abbilden |
| Mittel | Decision Assistant | offen | Optionen, Aufwand, Risiko, Nutzen und Empfehlung als Schema ergänzen |
| Mittel | Private Project Manager | offen | private Projekte mit Status, Blocker und nächstem Schritt führen |
| Mittel | Health und Energy Radar | offen | Energie, Belastung, Pausen und Fokusfenster in die Planung aufnehmen |
| Mittel | Finance und Contract Radar | offen | Verträge, Rechnungen, Abos, Fristen und Nachweise lokal strukturieren |
| Mittel | Memory und Knowledge Layer | offen | Regeln, Notizen, Dokumente, Entscheidungen und Quellen lokal verwalten |
| Mittel | DiagCenter | offen | Diagnose Modul für Python, Node, Ports, Config und Logs konkretisieren |
| Niedrig | Voice und Push to Talk | offen | Mikrofon default off, lokale TTS und bewusste Aktivierung planen |
| Niedrig | Automation Layer | offen | lokale Automationen mit RiskLevel, Freigabe und Audit Log vorbereiten |
| Niedrig | Release ZIP | offen | GitHub Release Workflow mit echtem Tag testen |

## Roadmap Dokumente

| Datei | Zweck |
|---|---|
| `docs/lifeos-roadmap.md` | Ausgearbeitete LifeOS Upgrade Roadmap mit Modulen, Nutzen, Umsetzung und Akzeptanzkriterien |
| `docs/lifeos-global-upgrade.md` | Grundkonzept des LifeOS Global Upgrade |
| `docs/lifeos-private-config.md` | Anleitung für die private lokale LifeOS Konfiguration |
| `CHANGELOG.md` | Versionierte Änderungen |
| `PROJECT_STATUS.md` | Projektstand, offene Todos, Risiken und nächster sinnvoller Schritt |

## Risiken

| Risiko | Einschätzung | Empfehlung |
|---|---|---|
| PR 30 basiert auf älterem Stand | hoch | nicht blind mergen, sondern gegen B6.6.7 prüfen |
| Browser blockiert lokale JSON Datei | mittel | LifeOS über lokalen Server starten oder Backend API nutzen |
| Dependabot Major Updates | hoch | React, TypeScript, Vite und Actions Major Updates nicht blind mergen |
| Installer Fehler bei Endanwendern | hoch | Installer weiterhin als eigener Schwerpunkt behandeln |
| Private Daten im Repo | reduziert | `config/lifeos.json` ist ignoriert, trotzdem vor Commits prüfen |
| Roadmap wird zu groß ohne Umsetzung | mittel | pro PR nur einen klaren Roadmap Punkt umsetzen |

## Nächster sinnvoller Schritt

Nach B6.6.7 ist der nächste sinnvolle Schritt nicht mehr das Grundmodell, sondern der Abgleich von PR 30 und danach der UI Feinschliff für das Daily Command Center.

Empfohlene Reihenfolge:

```text
1. PR 30 prüfen und entweder relevante Teile übernehmen oder schließen
2. Daily Command Center UI Feinschliff für Top 3 Aufgaben und Tagesfokus umsetzen
3. Work Radar 2.0 UI Sortierung ergänzen
4. Installer Endanwender Test auf frischem Windows durchführen
5. Backend Runtime Daten konkret anbinden
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
