# JARVIS LifeOS Roadmap

Diese Roadmap beschreibt die größeren LifeOS Upgrade Ideen als konkrete Ausbaustufen. Ziel ist ein persönlicher Operations Layer, der Arbeit, Lernen, private Projekte, Energie, Entscheidungen und lokale Daten zusammenführt.

## Grundprinzip

LifeOS bleibt Local First. Private Daten gehören in lokale Dateien wie `config/lifeos.json` und nicht ins Repository.

## Aktueller Roadmap Stand

Stand: B6.6.7

| Priorität | Modul | Ziel | Status |
|---|---|---|---|
| Hoch | Daily Command Center | Tageslage, Fokus und nächster Schritt | in Arbeit |
| Hoch | Work Radar 2.0 | SAP, FSM, LNW, Mail, Angebote und Rückfragen strukturieren | in Arbeit |
| Hoch | LifeOS persönliche Vorlage | lokale `config/lifeos.json` einfacher erzeugen | erledigt |
| Hoch | Installer Robustheit | Setup, First Setup, Python Erkennung und ExecutionPolicy absichern | in Arbeit |
| Mittel | Backend Runtime Daten | LifeOS API mit echten lokalen Runtime Daten versorgen | in Arbeit |
| Mittel | Learning Coach | Meister, AEVO und Lernstände aktiv verfolgen | geplant |
| Mittel | Decision Assistant | Optionen, Risiken und Empfehlung strukturiert bewerten | geplant |
| Mittel | Private Project Manager | private Projekte mit Status und nächstem Schritt führen | geplant |
| Mittel | Health und Energy Radar | Energie, Belastung, Pausen und Fokusfenster berücksichtigen | geplant |
| Mittel | Finance und Contract Radar | Verträge, Rechnungen, Abos und Fristen lokal verwalten | geplant |
| Mittel | Memory und Knowledge Layer | lokale Notizen, Regeln, Dokumente und Projektwissen bündeln | geplant |
| Niedrig | Voice und Push to Talk | lokale Sprachsteuerung mit Mikrofon default off planen | geplant |
| Niedrig | Automation Layer | lokale Automationen mit Freigabe und Audit Log vorbereiten | geplant |

## 1. Daily Command Center

Status: in Arbeit

Bereits erledigt:

```text
LifeOS Daily Command Center als JARVIS Sidebar Panel integriert
LifeOS Status API ergänzt
Briefing API ergänzt
Regeneration API ergänzt
erste Tageslage über Backend vorbereitet
```

Noch offen:

```text
Top 3 Aufgaben prominent anzeigen
Tagesfokus klar sichtbar machen
nächsten sinnvollen Schritt besser aus lokalen Daten ableiten
Gewichtung nach Dringlichkeit, Außenwirkung und Aufwand einführen
```

Nutzen:

- schneller Überblick über den Tag
- wichtigste offenen Schleifen sichtbar
- weniger gedankliches Sortieren am Morgen
- klare nächste Aktion statt langer Aufgabenliste

Nächste Umsetzung:

```text
1. PR 30 prüfen und verwertbare Teile übernehmen oder schließen
2. Tagesfokus und Top 3 Aufgaben in der UI sauber sichtbar machen
3. Briefing Generator stärker an Aufgaben, Risiko und Fristen koppeln
```

Akzeptanzkriterien:

```text
[x] LifeOS zeigt eine Tageslage in natürlicher Sprache
[ ] LifeOS zeigt maximal 3 wichtigste Aufgaben sichtbar im UI
[ ] LifeOS zeigt einen nächsten sinnvollen Schritt aus echten lokalen Daten
[ ] Werte kommen aus lokaler JSON oder Backend API
```

## 2. Work Radar 2.0

Status: in Arbeit

Bereits erledigt:

```text
work_radar.items Struktur vorbereitet
Vorgänge haben Status, Risiko, Frist, Score und nächsten Schritt
Tests für Work Radar ergänzt
```

Noch offen:

```text
UI Sortierung nach Risiko, Frist und Status
kritische Vorgänge visuell hervorheben
echte lokale Quellen später anbinden
```

Nutzen:

- weniger vergessene Rückfragen
- bessere Übersicht über LNW, FSM, SAP und Angebote
- klare Trennung zwischen kritisch, wartend und erledigt
- bessere Vorbereitung auf Abrechnung und Kundenkommunikation

Geplante Inhalte:

```text
SAP Vorgänge
FSM Buchungen
LNW Status
offene Kunden Rückfragen
Angebote
Bestellwerterhöhungen
VDE und DGUV Recherche
Abrechnung Risiken
```

Nächste Umsetzung:

```text
1. Work Radar UI nach Risiko sortieren
2. Statuswerte vereinheitlichen: open, waiting, blocked, done, attention
3. echte lokale Datenquellen später anbinden
```

Akzeptanzkriterien:

```text
[x] Work Radar kann mehrere Vorgänge anzeigen oder verarbeiten
[x] jeder Vorgang hat Status, Risiko, nächsten Schritt und Frist
[ ] kritische Vorgänge werden sichtbar hervorgehoben
[ ] UI sortiert Vorgänge nach Dringlichkeit
```

## 3. LifeOS persönliche Vorlage

Status: erledigt

Erledigt:

```text
setup-lifeos-config.ps1 ergänzt
lifeos-private-config.md ergänzt
FIRST_SETUP.ps1 bereitet private lokale LifeOS Konfiguration vor
config/lifeos.json bleibt lokal und wird nicht committed
bestehende private Daten werden nicht überschrieben
```

Akzeptanzkriterien:

```text
[x] private config/lifeos.json kann aus Beispiel erzeugt werden
[x] bestehende config/lifeos.json wird nicht ohne Force überschrieben
[x] private Datei ist ignoriert
[x] Dokumentation vorhanden
```

## 4. Installer Robustheit

Status: in Arbeit

Bereits erledigt:

```text
FIRST_SETUP.ps1 bereitet LifeOS private Config vor
Tests für Installer Robustheit ergänzt
```

Noch offen:

```text
frisches Windows Testszenario prüfen
Python Erkennung real testen
PowerShell ExecutionPolicy real testen
Start und First Setup Endanwender Ablauf prüfen
```

Akzeptanzkriterien:

```text
[ ] frisches Windows System kann Setup starten
[ ] ExecutionPolicy blockiert nicht
[ ] Python wird sauber erkannt oder verständlich gemeldet
[ ] START_JARVIS.bat startet ohne manuelle Nacharbeit
```

## 5. Backend Runtime Daten

Status: in Arbeit

Bereits erledigt:

```text
Backend API für LifeOS Status ergänzt
Backend API für LifeOS Briefing ergänzt
Backend API für Regeneration ergänzt
Backend API für Installer Check ergänzt
```

Noch offen:

```text
echte lokale Runtime Daten anbinden
Health Check sauber mit Frontend und Installer verbinden
DiagCenter vorbereiten
```

Akzeptanzkriterien:

```text
[x] LifeOS Backend API existiert
[ ] API liefert echte lokale Runtime Daten
[ ] Frontend zeigt API Health eindeutig an
[ ] Installer kann API Status prüfen
```

## 6. Learning Coach

Status: geplant

Ziel: JARVIS soll Lernstände für Meister, AEVO und spätere Themen aktiv verfolgen.

Nutzen:

- Schwachstellen bleiben sichtbar
- Wiederholungen werden gezielter
- Lernzeit wird planbarer
- Prüfungswissen wird nicht nur gesammelt, sondern abgefragt

Geplante Inhalte:

```text
Fach
Thema
Sicherheit von 1 bis 5
letzte Wiederholung
nächste Wiederholung
Fehlerquote
offene Lernkarten
```

Nächste Umsetzung:

```text
1. learning_radar in LifeOS Config ergänzen
2. einfache Wiederholungslogik einführen
3. UI Kachel für Lernfokus des Tages ergänzen
```

Akzeptanzkriterien:

```text
[ ] LifeOS zeigt ein Lern Thema des Tages
[ ] schwache Themen werden priorisiert
[ ] Wiederholungstermine können lokal gespeichert werden
```

## 7. Health und Energy Radar

Status: geplant

Ziel: JARVIS soll Energie, Belastung und Pausen als Planungshilfe berücksichtigen, ohne medizinische Bewertung zu spielen.

Nutzen:

- realistischere Tagesplanung
- bessere Pausen Erinnerung
- schwere Themen in gute Konzentrationsfenster legen
- Überlastung früher sichtbar machen

Geplante Inhalte:

```text
Energie Prozent
Belastung niedrig, mittel, hoch
letzte Pause
Fokusfenster
Schlaf Notiz optional
Bewegung optional
```

Nächste Umsetzung:

```text
1. energy_profile in LifeOS Config ergänzen
2. Daily Briefing Generator nutzt Energie für Priorisierung
3. UI zeigt Hinweis, ob schwere Entscheidungen heute sinnvoll sind
```

Akzeptanzkriterien:

```text
[ ] LifeOS unterscheidet Fokus Tag, normaler Tag und Schon Tag
[ ] Empfehlungen bleiben neutral und nicht medizinisch
[ ] Daten bleiben vollständig lokal
```

## 8. Finance und Contract Radar

Status: geplant

Ziel: Verträge, Rechnungen, Fristen, Abos und steuerlich relevante Themen sollen lokal sichtbar werden.

Nutzen:

- weniger vergessene Fristen
- bessere Übersicht über regelmäßige Kosten
- Rechnungen und Nachweise werden planbarer
- private Organisation wird nicht mit Arbeitsthemen vermischt

Geplante Inhalte:

```text
Vertrag
Kategorie
Kosten
Fälligkeit
Kündigungsfrist
Nachweis benötigt
Status
```

Nächste Umsetzung:

```text
1. finance_radar Schema in LifeOS Config ergänzen
2. sichere Beispielwerte ohne echte Daten eintragen
3. UI Bereich für kommende Fristen vorbereiten
```

Akzeptanzkriterien:

```text
[ ] LifeOS zeigt kommende private Fristen
[ ] sensible Werte werden nur lokal gespeichert
[ ] keine Finanzdaten werden ins Repository committed
```

## 9. Private Project Manager

Status: geplant

Ziel: JARVIS soll private Projekte und technische Bastelthemen strukturiert verwalten.

Nutzen:

- JARVIS Ausbau bleibt nachvollziehbar
- Auto, Wohnung, Technik und private Aufgaben werden nicht vergessen
- Projekte bekommen Status und nächsten Schritt
- Ideen werden von echten Todos getrennt

Geplante Inhalte:

```text
Projektname
Ziel
Status
nächster Schritt
Risiko
Blocker
letztes Update
```

Nächste Umsetzung:

```text
1. projects Array in LifeOS Config ergänzen
2. Projektstatus Kachel in LifeOS UI ergänzen
3. JARVIS Projekt automatisch als erstes Projekt führen
```

Akzeptanzkriterien:

```text
[ ] Projekte haben klaren Status
[ ] jedes Projekt hat einen nächsten Schritt
[ ] blockierte Projekte werden sichtbar markiert
```

## 10. Decision Assistant

Status: geplant

Ziel: JARVIS soll Entscheidungen strukturieren, Optionen vergleichen und einen begründeten nächsten Schritt vorschlagen.

Nutzen:

- bessere Entscheidungen unter Zeitdruck
- weniger Bauchgefühl bei technischen oder organisatorischen Fragen
- klare Bewertung von Aufwand, Risiko, Nutzen und Rückfalloption

Geplante Inhalte:

```text
Option A
Option B
Aufwand
Risiko
Nutzen
Zeitdruck
Empfehlung
Begründung
```

Nächste Umsetzung:

```text
1. decision_layer Schema ergänzen
2. einfache Score Logik bauen
3. UI Bereich für Empfehlung und Begründung ergänzen
```

Akzeptanzkriterien:

```text
[ ] mindestens zwei Optionen vergleichbar
[ ] Empfehlung basiert auf sichtbaren Kriterien
[ ] JARVIS zeigt keine Scheinsicherheit, sondern begründet knapp
```

## 11. Memory und Knowledge Layer

Status: geplant

Ziel: Wiederkehrende Regeln, Projektwissen, Notizen und lokale Dokumente sollen als Wissensbasis nutzbar werden.

Nutzen:

- weniger Wiederholung in Gesprächen
- bessere Kontinuität zwischen Arbeit, Lernen und JARVIS Projekt
- lokale Dokumente und Regeln bleiben auffindbar
- Entscheidungen werden nachvollziehbar

Geplante Inhalte:

```text
Regeln
Notizen
Dokumente
Projektentscheidungen
wiederkehrende Formulierungen
technische Standards
Quellen
letztes Update
```

Nächste Umsetzung:

```text
1. knowledge_index Struktur definieren
2. lokale Markdown oder JSON Quellen zulassen
3. UI Bereich für zuletzt genutztes Wissen ergänzen
```

Akzeptanzkriterien:

```text
[ ] Wissen ist lokal speicherbar
[ ] Einträge haben Quelle und Datum
[ ] private Inhalte werden nicht automatisch committed
```

## 12. Voice und Push to Talk

Status: geplant

Ziel: JARVIS soll später per Sprache nutzbar sein, aber nur bewusst und kontrolliert.

Nutzen:

- schnelle Bedienung am Arbeitsplatz oder beim Testen
- weniger Tippen bei kurzen Kommandos
- bessere JARVIS Wirkung im Interface

Geplante Inhalte:

```text
Push to Talk
Mikrofon default off
lokale TTS
lokale Transkription optional
sichtbarer Mikrofon Status
Freigabe vor kritischen Aktionen
```

Nächste Umsetzung:

```text
1. voice.json Schema ergänzen
2. UI Status für Mikrofon und Voice Modul anzeigen
3. keine dauerhafte Aufnahme erlauben
```

Akzeptanzkriterien:

```text
[ ] Mikrofon ist standardmäßig aus
[ ] Sprachfunktion braucht bewusste Aktivierung
[ ] kritische Aktionen werden nicht automatisch ausgeführt
```

## 13. Automation Layer

Status: geplant

Ziel: kleine lokale Automationen sollen Aufgaben vorbereiten, aber nicht blind handeln.

Nutzen:

- weniger manuelle Routinearbeit
- vorbereitete Tageslage
- automatische Checks ohne Kontrollverlust
- nachvollziehbare Aktionen über Audit Log

Geplante Inhalte:

```text
Automation Name
Trigger
Risiko Level
Freigabe nötig ja nein
letzte Ausführung
Ergebnis
Audit Log Eintrag
```

Nächste Umsetzung:

```text
1. automation_tasks Schema ergänzen
2. RiskLevel mit ToolRegistry verbinden
3. UI Bereich für geplante Automationen vorbereiten
```

Akzeptanzkriterien:

```text
[ ] jede Automation hat Risiko Level
[ ] kritische Aktionen brauchen Freigabe
[ ] jede Ausführung wird lokal protokolliert
```

## Empfohlene Reihenfolge ab B6.6.7

```text
1. PR 30 prüfen und verwertbare Teile übernehmen oder schließen
2. Daily Command Center UI Feinschliff umsetzen
3. Work Radar 2.0 UI Sortierung ergänzen
4. Installer Endanwender Test durchführen
5. Backend Runtime Daten anbinden
6. Learning Coach ergänzen
7. Decision Assistant ergänzen
8. Private Project Manager ergänzen
9. Health und Energy Radar ergänzen
10. Finance und Contract Radar ergänzen
11. Memory und Knowledge Layer konkretisieren
12. Voice und Push to Talk planen
13. Automation Layer mit Audit Log vorbereiten
```
