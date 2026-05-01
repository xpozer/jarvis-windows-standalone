# JARVIS Autonomous Assistant Roadmap

Diese Roadmap erweitert JARVIS vom reaktiven Tool Assistenten zu einem tief integrierten autonomen Personal Assistenten.

## Leitprinzipien

```text
Local First
Privacy First
Default Off bei sensiblen Funktionen
Cloud nur Opt In
AuditLog für sicherheitsrelevante Aktionen
RiskLevel Gating für autonome Schritte
kein PR auf main vor Abschluss des jeweiligen Blocks
```

## Benutzerkontext

JARVIS wird für einen Arbeitsplaner Elektro in der Chemieindustrie entwickelt. Tägliche Werkzeuge sind SAP ERP, FSM, Outlook und Excel. Zusätzlich läuft die Vorbereitung auf die Industriemeisterprüfung mit BwHa, MIKP, ZIB und NTG. Datenschutz ist kritisch, da Arbeitskontext und Werksinformationen sensibel sein können.

## Block Reihenfolge

| Block | Thema | Ziel | Branch |
|---|---|---|---|
| 1 | Bildschirm Beobachtung | JARVIS erkennt lokalen Bildschirm Kontext und kann proaktiv helfen | `feature/screen` |
| 2 | Episodisches Gedächtnis | JARVIS speichert Aktionen, Beteiligte, Ergebnisse und Zusammenhänge | `feature/episodic` |
| 3 | Autonome Mail Triage | Outlook wird lokal klassifiziert, vorsortiert und mit Freigabe unterstützt | `feature/mail-triage` |
| 4 | Multi Agent System | Orchestrator plus spezialisierte Agenten statt monolithischem WorkAgent | `feature/multi-agent` |
| 5 | Daily Planning und Weekly Review | Tagesplanung und Wochenreflexion mit Goals, Memory und Lernfortschritt | `feature/planner` |

## Arbeitsweise

Pro Block wird ein eigener Branch genutzt. Innerhalb eines Blocks werden Aufgaben schrittweise umgesetzt. Nach jeder Aufgabe wird gestoppt und auf Bestätigung oder Fehlermeldung gewartet. Ein PR auf `main` kommt erst, wenn der komplette Block dokumentiert und sinnvoll testbar ist.

## Block 1: Bildschirm Beobachtung

Ziel: JARVIS sieht, was am Monitor passiert, erkennt Kontext und kann proaktiv helfen, ohne dass jedes Mal eine explizite Anfrage nötig ist.

### Aufgabe 1.1 Modul Struktur

Pfad:

```text
backend/perception/screen/
```

Dateien:

```text
capturer.py
window_tracker.py
vision.py
ocr_fallback.py
context_builder.py
privacy.py
models.py
README.md
```

Status: in Arbeit.

### Aufgabe 1.2 Privacy First Konfiguration

Default Off, Blocklist für sensible Apps, Pause Hotkey und sichtbarer Aktivitätsindikator.

Status: offen.

### Aufgabe 1.3 Performance

Screenshots als WebP, Diff Detection, Ring Buffer und Speicherlimit.

Status: offen.

### Aufgabe 1.4 Kontext Datenmodell

Strukturierter Screen Kontext mit Zeit, App, Fenster, Text, UI Elementen und Intent Guess.

Status: offen.

### Aufgabe 1.5 Integration mit Memory

Wichtige Wendepunkte werden als Episodic Memory gespeichert, nicht jeder Snapshot.

Status: offen.

### Aufgabe 1.6 Proaktive Trigger

SAP BANF Hilfe, Outlook Erinnerung, Excel Zusammenfassung und ähnliche lokale Trigger.

Status: offen.

### Aufgabe 1.7 User Kommandos

`/screen pause`, `/screen resume`, `/screen status`, `/context what`, `/history last 10`.

Status: offen.

### Aufgabe 1.8 AuditLog

Jeder Vision Call bekommt Bild Hash und Begründung für proaktive Vorschläge.

Status: offen.

### Aufgabe 1.9 Tests

Mock Display, Privacy Tests und Performance Test für Idle CPU.

Status: offen.

## Block 2: Episodisches Gedächtnis

Ziel: JARVIS speichert Aktionen mit Zeit, Kontext, Beteiligten, Ergebnis und verknüpften Artefakten.

Status: offen.

## Block 3: Autonome Mail Triage

Ziel: Outlook wird halbautonom klassifiziert, vorsortiert und mit sicheren Freigaben unterstützt.

Status: offen.

## Block 4: Multi Agent System

Ziel: ResearchAgent, DocAgent, CodeAgent und TutorAgent arbeiten über einen CoreAgent zusammen.

Status: offen.

## Block 5: Daily Planning und Weekly Review

Ziel: JARVIS erzeugt Tagesplanung, Wochenreview, Goal Tracking und adaptive Entlastung.

Status: offen.
