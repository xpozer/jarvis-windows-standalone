# JARVIS God Level Runtime Architektur

Stand: 2026 04 26

Diese Datei definiert den Zielzustand von JARVIS als lokales KI Agentensystem für Windows. JARVIS ist nicht nur ein Chatfrontend. JARVIS ist eine lokale Agenten Runtime mit persistenter Erinnerung, kontinuierlichem Kontextverständnis, echter Aktionsfähigkeit und koordinierter Mehragenten Ausführung.

Die Architektur orientiert sich an vier Grundfähigkeiten:

1. Memory
2. Awareness
3. Action
4. Orchestration

Darauf aufbauend kommen Zielverfolgung, Workflows, Sidecars, Authority Gating, Auditierbarkeit und ein visueller Workflow Builder.

---

## 1. Aktueller Stand im Repository

Der aktuelle Code Stand enthält bereits eine Windows Frontend Basis mit React, Vite, TypeScript und Three.js. Das Projekt ist als `jarvis-windows-standalone` angelegt und besitzt aktuell Frontend Build Skripte für Entwicklung, Build, Typecheck und Preview.

Vorhanden:

- React Frontend
- Vite Entwicklungsserver
- TypeScript
- Three.js für visuelle Tiefe
- Electron Einstieg laut Package Metadata
- JARVIS Bootsequenz als visuelles Asset
- Diagnose Overlay und Safe Mode Einstieg
- lokale Startlogik über Windows Skripte

Noch nicht vollständig abgedeckt:

- persistente Memory Engine mit Fakten und Entitätsgraph
- Awareness Pipeline mit Screen Capture, OCR, App Kontext und Aktivitätssitzungen
- echte Action Engine für Browser, Desktop, Terminal, Dateisystem und Tools
- Orchestration Engine mit spezialisierten Agentenrollen
- Workflow Engine mit visueller Bearbeitung
- Sidecar Runtime für mehrere Maschinen
- Authority Gating und Freigabesystem
- OKR Zielsystem mit Morgenplanung und Abendreview
- vollständiges Audit Log
- Plugin und Tool Registry
- Self Healing Workflows

---

## 2. Produktdefinition

JARVIS ist eine lokale Agenten Runtime mit Desktop Oberfläche.

JARVIS soll:

- den Nutzer kennen
- Projekte, Ziele, Aufgaben und technische Zustände behalten
- den aktuellen Bildschirmkontext verstehen
- lokale Anwendungen kontrollieren können
- Browser und Terminal nutzen können
- Dateien lesen und schreiben können
- Aktionen nachvollziehbar protokollieren
- kritische Aktionen nur nach Freigabe ausführen
- spezialisierte Agentenrollen parallel koordinieren
- Workflows dauerhaft ausführen
- Ziele morgens planen und abends überprüfen

Nicht Ziel:

- ein einfacher Chatbot
- eine reine UI Demo
- ein System ohne Sicherheitsgrenzen
- ein Agent, der ungefragt kritische Aktionen ausführt
- ein Cloud only System

---

## 3. Architekturübersicht

```text
JARVIS Windows Standalone

  Frontend
    React UI
    Boot HUD
    Chat Interface
    Workflow Builder
    Goal Dashboard
    Memory Viewer
    Approval Center
    Diagnostics Overlay

  Local Runtime
    Agent Gateway
    Memory Engine
    Awareness Engine
    Action Engine
    Orchestration Engine
    Workflow Engine
    Goal Engine
    Authority Engine
    Audit Engine
    Tool Registry

  Local Services
    SQLite
    Vector Index
    File Store
    Screenshot Store
    Event Bus
    Local API
    WebSocket Server

  Sidecars
    Windows Desktop Sidecar
    Browser Sidecar
    Terminal Sidecar
    Future Remote Machine Sidecars

  Providers
    Ollama
    OpenAI optional
    Anthropic optional
    Gemini optional
    Local embedding model
```

---

## 4. Core Primitive 1: Memory

### 4.1 Ziel

Memory ist das dauerhafte semantische Gedächtnis von JARVIS. Es speichert nicht nur Chatverläufe, sondern extrahiert strukturierte Fakten, Entitäten, Beziehungen, Aufgaben, Ziele, Vorlieben und technische Zustände.

JARVIS muss dadurch wissen:

- wer der Nutzer ist
- woran der Nutzer arbeitet
- welche Projekte existieren
- welche Dateien, Repositories und Systeme wichtig sind
- welche Entscheidungen bereits getroffen wurden
- welche Präferenzen dauerhaft gelten
- welche Aufgaben offen, blockiert oder erledigt sind

### 4.2 Datenarten

Memory speichert mindestens:

- Facts
- Entities
- Relationships
- Events
- Decisions
- Preferences
- Tasks
- Project States
- Conversation Summaries
- Tool Results
- File References
- Approval History

### 4.3 Tabellenmodell

```sql
CREATE TABLE memory_facts (
  id TEXT PRIMARY KEY,
  fact_text TEXT NOT NULL,
  source_type TEXT NOT NULL,
  source_ref TEXT,
  confidence REAL NOT NULL DEFAULT 0.8,
  importance INTEGER NOT NULL DEFAULT 3,
  valid_from TEXT NOT NULL,
  valid_until TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE memory_entities (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  canonical_name TEXT NOT NULL,
  aliases_json TEXT NOT NULL DEFAULT '[]',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE memory_relationships (
  id TEXT PRIMARY KEY,
  source_entity_id TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  target_entity_id TEXT NOT NULL,
  confidence REAL NOT NULL DEFAULT 0.8,
  evidence_fact_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE memory_embeddings (
  id TEXT PRIMARY KEY,
  object_type TEXT NOT NULL,
  object_id TEXT NOT NULL,
  embedding_model TEXT NOT NULL,
  vector BLOB NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE memory_audit (
  id TEXT PRIMARY KEY,
  operation TEXT NOT NULL,
  object_type TEXT NOT NULL,
  object_id TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT,
  actor TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

### 4.4 Memory Pipeline

Nach jeder relevanten Interaktion läuft eine Memory Pipeline:

```text
Conversation or Tool Result
  -> classify relevance
  -> extract facts
  -> extract entities
  -> link entities
  -> detect contradictions
  -> score importance
  -> write to memory
  -> update vector index
  -> write audit entry
```

### 4.5 Kontextinjektion

Vor jeder Antwort ruft der Agent Memory ab:

```text
User Input
  -> semantic search
  -> entity match
  -> active project lookup
  -> recent task lookup
  -> preference lookup
  -> inject compact context block
```

Regeln:

- Nur relevante Fakten werden injiziert.
- Fakten werden nach Wichtigkeit, Aktualität und Kontextnähe sortiert.
- Widersprüche werden markiert statt still überschrieben.
- Sensible Fakten werden nur nach Bedarf geladen.

### 4.6 Memory API

```http
POST /api/memory/facts
GET  /api/memory/search?q=
GET  /api/memory/entities/:id
POST /api/memory/extract
POST /api/memory/forget
GET  /api/memory/audit
```

### 4.7 Memory UI

Die Oberfläche braucht:

- Memory Viewer
- Suche über Fakten und Entitäten
- Projektfilter
- Löschfunktion
- Korrekturfunktion
- Anzeige der Quelle
- Anzeige der Vertrauenswürdigkeit
- Timeline Ansicht

---

## 5. Core Primitive 2: Awareness

### 5.1 Ziel

Awareness bedeutet: JARVIS versteht, was gerade auf dem Rechner passiert. Nicht nur durch Chatnachrichten, sondern durch Bildschirm, aktives Fenster, OCR, App Zustand, laufende Prozesse und Nutzeraktivität.

### 5.2 Datenquellen

- aktives Fenster
- Fenstertitel
- Prozessname
- Screenshot
- OCR Text
- optional Vision Analyse
- Maus und Tastatur Aktivität als Metadaten
- Zwischenablage optional
- Browser URL und DOM optional
- Dateisystem Ereignisse optional

### 5.3 Awareness Loop

Standardzyklus:

```text
Every 5 to 10 seconds
  -> capture active window metadata
  -> capture screenshot thumbnail
  -> run OCR locally
  -> classify activity
  -> update current session
  -> detect struggle patterns
  -> store lightweight context
  -> notify agent only if relevant
```

### 5.4 Activity Sessions

JARVIS gruppiert Aktivität in Sitzungen:

```json
{
  "session_id": "activity_123",
  "started_at": "2026-04-26T18:00:00Z",
  "ended_at": null,
  "primary_app": "Code.exe",
  "window_title": "main.tsx - jarvis-windows-standalone",
  "inferred_task": "editing JARVIS frontend boot sequence",
  "confidence": 0.87,
  "related_project": "jarvis-windows-standalone"
}
```

### 5.5 Struggle Detection

JARVIS erkennt, wenn der Nutzer hängt:

- gleicher Fehler erscheint wiederholt
- Nutzer wechselt oft zwischen Terminal und Browser
- Build schlägt mehrfach fehl
- gleiche Datei wird lange bearbeitet ohne Fortschritt
- Chat Fragen drehen sich um denselben Fehler
- Installer oder Startskript bricht wiederholt ab

Dann darf JARVIS anbieten:

- Fehleranalyse
- Log Prüfung
- konkreten Fix
- Rollback Vorschlag
- neuen Plan

### 5.6 Datenschutz

Awareness ist sensibel.

Regeln:

- Awareness ist lokal first.
- Screenshots werden nicht dauerhaft gespeichert, außer bei expliziter Aufgabe.
- OCR Text wird nur verdichtet gespeichert.
- Cloud Vision ist standardmäßig aus.
- Nutzer kann Apps und Fenster ausschließen.
- Private Bereiche können maskiert werden.
- Awareness kann vollständig pausiert werden.

### 5.7 Awareness API

```http
GET  /api/awareness/current
POST /api/awareness/capture
POST /api/awareness/pause
POST /api/awareness/resume
GET  /api/awareness/sessions
GET  /api/awareness/struggles
```

---

## 6. Core Primitive 3: Action

### 6.1 Ziel

Action bedeutet: JARVIS kann echte Aufgaben ausführen. Nicht nur Antworttext erzeugen.

Aktionsbereiche:

- Browser
- Desktop
- Terminal
- Dateisystem
- Git
- GitHub
- Zwischenablage
- lokale HTTP APIs
- E Mail Entwürfe
- Kalender
- Benachrichtigungen
- Voice

### 6.2 Tool Registry

Alle Tools werden zentral registriert.

```ts
interface JarvisTool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  risk: RiskLevel;
  inputSchema: JsonSchema;
  outputSchema: JsonSchema;
  timeoutMs: number;
  requiresApproval: boolean;
  execute(input: unknown, ctx: ToolContext): Promise<ToolResult>;
}
```

### 6.3 Risikoklassen

```text
LOW
  lesen, suchen, anzeigen, analysieren

MEDIUM
  Datei erzeugen, Entwurf erstellen, lokale ungefährliche Befehle

HIGH
  Datei überschreiben, Git Commit, externe API Änderung, E Mail vorbereiten mit Empfänger

CRITICAL
  löschen, senden, pushen, deployen, kaufen, Zugangsdaten ändern, Systemkonfiguration ändern
```

### 6.4 Browser Action

Browser Aktionen laufen über CDP oder Playwright.

Fähigkeiten:

- Seite öffnen
- DOM lesen
- Elemente anklicken
- Formulare ausfüllen
- Screenshots erzeugen
- Downloads überwachen
- Tabellen extrahieren
- Login Status erkennen

Freigabe:

- Lesen: LOW
- Formular ausfüllen: MEDIUM
- Kaufen, Senden, Veröffentlichen: CRITICAL

### 6.5 Desktop Action

Desktop Aktionen laufen über Windows UI Automation und Sidecar.

Fähigkeiten:

- Fenster finden
- Anwendung fokussieren
- Buttons klicken
- Textfelder füllen
- Tastenkombination senden
- Dialoge erkennen
- Screenshot erstellen

### 6.6 Terminal Action

Terminal Aktionen müssen sandboxed und protokolliert sein.

Regeln:

- Jeder Befehl wird vor Ausführung klassifiziert.
- Schreibende Befehle werden markiert.
- Löschbefehle brauchen Freigabe.
- Befehle mit Netzwerk oder Secrets werden geprüft.
- Ausgabe wird zusammengefasst und als Artifact gespeichert.

### 6.7 Action API

```http
POST /api/tools/run
GET  /api/tools
GET  /api/actions/:id
POST /api/actions/:id/approve
POST /api/actions/:id/reject
GET  /api/actions/audit
```

---

## 7. Core Primitive 4: Orchestration

### 7.1 Ziel

Orchestration koordiniert mehrere Agenten, Tools, Workflows und Ziele. Der Primary Agent bleibt Autoritätsträger. Subagenten dürfen denken, analysieren und vorbereiten, aber keine kritischen Aktionen eigenständig freigeben.

### 7.2 Agentenrollen

Mindestens diese Rollen:

```text
Primary Agent
  zentrale Autorität, Nutzerkontakt, Freigaben, finaler Kontext

Researcher
  Web Recherche, Quellen, Vergleich, Faktenprüfung

Coder
  Code Analyse, Patches, Tests, Refactoring

Reviewer
  Prüfung von Code, Text, Risiko und Vollständigkeit

Planner
  Zerlegung von Zielen, Tagesplanung, Reihenfolge

Writer
  Dokumentation, E Mails, Texte, Spezifikationen

Analyst
  Datenanalyse, Tabellen, Metriken, Auswertung

Sysadmin
  Windows, Installer, Dienste, Prozesse, Logs

DevOps
  Git, Builds, Releases, Deployment

Security
  Risiken, Secrets, Rechte, Authority Gates

Designer
  UI, Layout, Boot HUD, visuelle Systeme

Data Engineer
  Speicher, Vektoren, ETL, Datenflüsse
```

### 7.3 Delegation

```json
{
  "task_id": "task_123",
  "assigned_role": "coder",
  "goal": "Fix boot sequence layout scaling",
  "context_refs": ["repo:jarvis-windows-standalone", "file:frontend/src/main.tsx"],
  "allowed_tools": ["file_read", "code_patch", "typecheck"],
  "denied_tools": ["git_push", "delete_file", "send_email"],
  "authority": "prepare_only"
}
```

### 7.4 Orchestration Regeln

- Subagenten erhalten nur benötigten Kontext.
- Subagenten dürfen kritische Aktionen nicht selbst freigeben.
- Ergebnisse müssen strukturiert zurückkommen.
- Parallele Ausführung ist erlaubt.
- Abhängigkeiten werden explizit modelliert.
- Jeder Tool Call wird protokolliert.
- Fehler führen zu Retry, Fallback oder Eskalation.

### 7.5 Event Bus

Alle Engines kommunizieren über Events:

```text
memory.fact.created
awareness.session.updated
action.requested
action.approval_required
action.completed
workflow.started
workflow.failed
workflow.self_healed
goal.progress_updated
agent.task.delegated
agent.task.completed
```

---

## 8. Sidecar Prinzip

### 8.1 Ziel

Ein JARVIS Brain kann mehrere Maschinen steuern. Jede Maschine verbindet sich als Sidecar mit der zentralen Runtime.

### 8.2 Sidecar Fähigkeiten

- terminal
- filesystem
- browser
- desktop
- clipboard
- screenshot
- awareness
- process list
- notifications

### 8.3 Verbindung

```text
JARVIS Brain
  WebSocket Server
  JWT Auth
  Capability Registry
  Audit Log

Sidecar
  machine_id
  friendly_name
  capabilities
  heartbeat
  command executor
```

### 8.4 Sidecar Handshake

```json
{
  "type": "sidecar.hello",
  "machine_id": "workstation-e41",
  "name": "Julien Windows PC",
  "capabilities": ["terminal", "filesystem", "browser", "desktop", "screenshot", "clipboard"],
  "version": "0.1.0"
}
```

### 8.5 Sicherheit

- JWT Token pro Maschine
- Token widerrufbar
- Capability Einschränkungen pro Sidecar
- Heartbeat Überwachung
- Audit pro Befehl
- Emergency Pause
- kein Critical Action ohne Freigabe

---

## 9. Workflow Engine

### 9.1 Ziel

Workflows sind dauerhafte, wiederholbare Automationen. Sie können visuell gebaut oder per YAML importiert werden.

### 9.2 Node Typen

Mindestens 50 Node Typen über diese Kategorien:

#### Trigger

- manual
- cron
- interval
- webhook
- file changed
- folder changed
- screen event
- app opened
- app closed
- clipboard changed
- process started
- process stopped
- git commit
- git push
- email received
- calendar event
- goal behind schedule

#### Actions

- agent task
- browser navigate
- browser click
- browser extract
- desktop click
- desktop type
- shell command
- file read
- file write
- file copy
- file move
- git status
- git commit
- github issue
- github pull request
- notification
- email draft
- calendar create
- memory write
- goal update

#### Logic

- if else
- switch
- loop
- delay
- wait until
- merge
- race
- variable set
- variable get
- template render
- JSON parse
- regex extract
- map
- filter
- aggregate

#### Error Handling

- retry
- fallback
- error handler
- compensate
- ask user
- escalate authority
- self heal

### 9.3 Workflow Modell

```json
{
  "id": "workflow_morning_plan",
  "name": "Morning Planning",
  "enabled": true,
  "trigger": { "type": "cron", "value": "0 7 * * *" },
  "nodes": [],
  "edges": [],
  "authority_policy": "medium_requires_approval",
  "created_at": "2026-04-26T00:00:00Z"
}
```

### 9.4 Self Healing

Wenn ein Workflow scheitert, versucht JARVIS:

- Retry mit Backoff
- Auth Header erneuern
- Dateipfad suchen
- alternatives Tool verwenden
- Eingabeformat reparieren
- Browser neu starten
- Sidecar neu verbinden
- Fehler an Reviewer Agent delegieren
- Nutzer fragen, wenn Risiko steigt

---

## 10. Goal Engine und OKR System

### 10.1 Ziel

JARVIS verfolgt Ziele aktiv. Nicht nur als To Do Liste, sondern mit OKR Struktur, Tagesplanung und Review.

### 10.2 Zielstruktur

```text
Objective
  Key Result
    Milestone
      Task
        Daily Action
```

### 10.3 Datenmodell

```sql
CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  parent_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  score REAL NOT NULL DEFAULT 0,
  target_score REAL NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'active',
  due_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE goal_reviews (
  id TEXT PRIMARY KEY,
  review_type TEXT NOT NULL,
  goal_id TEXT,
  summary TEXT NOT NULL,
  evidence_json TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL
);
```

### 10.4 Morgenplanung

Morgens erstellt JARVIS:

- Tagesfokus
- wichtigste Ziele
- fällige Aufgaben
- blockierte Themen
- konkrete nächste Aktionen
- realistische Zeitblöcke

### 10.5 Abendreview

Abends prüft JARVIS:

- was erledigt wurde
- was offen blieb
- welche Blocker erkannt wurden
- welche Ziele Fortschritt hatten
- was morgen zuerst dran ist

### 10.6 Awareness Kopplung

Awareness darf Fortschritt vorschlagen:

- Nutzer arbeitet an Repo
- Build abgeschlossen
- Datei erstellt
- Issue geschlossen
- Kalendertermin erledigt
- Recherche abgeschlossen

Fortschritt wird nicht blind übernommen. Bei Unsicherheit wird gefragt.

---

## 11. Authority Gating

### 11.1 Ziel

JARVIS darf handeln, aber nicht unkontrolliert. Kritische Aktionen brauchen Freigabe.

### 11.2 Governed Actions

Immer freigabepflichtig:

- E Mail senden
- Nachricht senden
- Git Push
- Deployment
- Datei löschen
- große Dateiänderung
- Bestellung oder Kauf
- Zahlung
- Zugriff auf Zugangsdaten
- Änderung an Systemkonfiguration
- externe Veröffentlichung
- irreversible Aktionen

### 11.3 Approval Modell

```json
{
  "approval_id": "approval_123",
  "requested_by": "coder_agent",
  "action": "git_push",
  "risk": "critical",
  "summary": "Push boot HUD changes to main",
  "diff_ref": "artifact_diff_123",
  "status": "pending",
  "expires_at": "2026-04-26T20:00:00Z"
}
```

### 11.4 Freigabekanäle

- Chat Button
- PIN
- später mobile Freigabe
- später Telegram oder Discord
- zeitlich begrenzte Auto Approval Regel

### 11.5 Auto Approval

Auto Approval ist nur erlaubt, wenn:

- Aktion wiederholt identisch ist
- Risiko maximal Medium ist
- Nutzer mindestens mehrfach zugestimmt hat
- Regel sichtbar im Approval Center steht
- Regel jederzeit deaktivierbar ist

---

## 12. Audit Engine

### 12.1 Ziel

JARVIS muss nachvollziehbar sein. Jede wichtige Aktion wird protokolliert.

### 12.2 Audit Eintrag

```json
{
  "id": "audit_123",
  "timestamp": "2026-04-26T18:00:00Z",
  "actor": "primary_agent",
  "action_type": "tool.run",
  "tool_id": "github.update_file",
  "risk": "high",
  "approval_id": "approval_123",
  "input_summary": "Update frontend/src/main.tsx",
  "output_summary": "Commit created",
  "status": "success"
}
```

### 12.3 Audit UI

- Timeline
- Filter nach Risiko
- Filter nach Agent
- Filter nach Tool
- Fehler und Retries
- Freigaben
- Export als JSON

---

## 13. Lokale Runtime Struktur

Empfohlene Zielstruktur:

```text
jarvis-windows-standalone/
  frontend/
    src/
      App.tsx
      main.tsx
      components/
      diagnostics/
      features/
        chat/
        boot/
        memory/
        awareness/
        workflows/
        goals/
        approvals/
        settings/
  backend/
    app/
      main.py
      api/
      core/
      memory/
      awareness/
      actions/
      orchestration/
      workflows/
      goals/
      authority/
      audit/
      tools/
      providers/
  sidecar/
    windows/
      main.py
      desktop.py
      browser.py
      filesystem.py
      terminal.py
      screenshots.py
  docs/
    JARVIS_GOD_LEVEL_ARCHITECTURE.md
    SECURITY_MODEL.md
    WORKFLOW_NODES.md
    MEMORY_SCHEMA.md
    SIDECAR_PROTOCOL.md
```

---

## 14. Entwicklungsphasen

### Phase 1: Stabile lokale App

Ziel:

- Frontend startet zuverlässig
- Bootsequenz stabil
- Chat funktioniert
- Backend erreichbar
- Diagnose funktioniert

Definition of Done:

- `START_JARVIS.bat` startet alles
- Chat bekommt Antworten
- Fehler landen im Diagnose Log
- Safe Mode funktioniert

### Phase 2: Memory Engine

Ziel:

- SQLite Memory Store
- Faktenextraktion
- semantische Suche
- Memory Viewer
- Kontextinjektion

Definition of Done:

- JARVIS merkt sich Projekte und Präferenzen
- Nutzer kann Fakten anzeigen, ändern und löschen
- Memory wird in Antworten korrekt genutzt

### Phase 3: Awareness Engine

Ziel:

- aktives Fenster erkennen
- Screenshot Capture
- OCR Pipeline
- Activity Sessions
- Struggle Detection

Definition of Done:

- JARVIS erkennt aktive App
- JARVIS erkennt wiederholte Fehler
- Awareness ist pausierbar
- sensible Apps können ausgeschlossen werden

### Phase 4: Action Engine

Ziel:

- Tool Registry
- Dateisystem Tools
- Terminal Tools
- Browser Tools
- GitHub Tools
- Approval Pflicht nach Risiko

Definition of Done:

- JARVIS kann kontrolliert handeln
- kritische Aktionen brauchen Zustimmung
- alle Aktionen werden protokolliert

### Phase 5: Orchestration

Ziel:

- Primary Agent
- Subagent Rollen
- Delegation
- parallele Aufgaben
- Ergebnisaggregation

Definition of Done:

- Researcher und Coder können parallel arbeiten
- Primary Agent behält Freigabehoheit
- Subagenten haben begrenzte Tools

### Phase 6: Workflow Builder

Ziel:

- visueller Workflow Editor
- Node Registry
- Workflow Runner
- Retry und Fallback
- YAML Import Export

Definition of Done:

- Nutzer kann Workflow visuell bauen
- Workflow kann geplant laufen
- Fehler werden selbstheilend behandelt

### Phase 7: Goal Engine

Ziel:

- OKR Modell
- Morgenplanung
- Abendreview
- Awareness basierter Fortschritt

Definition of Done:

- Ziele werden aktiv verfolgt
- tägliche Vorschläge erscheinen
- Review speichert Fortschritt und Blocker

### Phase 8: Sidecar

Ziel:

- WebSocket Sidecar
- JWT Auth
- Capabilities
- Multi Maschine

Definition of Done:

- zweiter Rechner kann angebunden werden
- Sidecar meldet Fähigkeiten
- Aktionen laufen auf Zielmaschine

---

## 15. Sicherheitsgrundsätze

1. Local first
2. Nutzer bleibt Autorität
3. Keine kritische Aktion ohne Freigabe
4. Jede Aktion wird auditiert
5. Subagenten dürfen keine Freigaben erteilen
6. Memory ist sichtbar und löschbar
7. Awareness ist pausierbar
8. Sidecars sind widerrufbar
9. Secrets werden nicht in Logs gespeichert
10. Fehler werden offen angezeigt

---

## 16. Praktischer nächster Schritt im bestehenden Projekt

Direkt als nächstes sollte umgesetzt werden:

1. `backend/app/main.py` als lokale API Runtime
2. SQLite Datenbank unter `data/jarvis.db`
3. `/api/health`
4. `/api/chat`
5. `/api/memory/search`
6. `/api/memory/facts`
7. Frontend Chat an Backend koppeln
8. Diagnose Log mit Backend Status verbinden
9. Memory Viewer im Frontend anlegen
10. Authority Gate Komponente vorbereiten

Minimaler Backend Start:

```python
from fastapi import FastAPI

app = FastAPI(title="JARVIS Runtime")

@app.get("/api/health")
def health():
    return {"status": "ok", "runtime": "jarvis", "version": "0.1.0"}
```

Minimaler Runtime Check:

```text
Frontend startet
Backend health ok
Chat request ok
Memory write ok
Memory search ok
Audit entry created
```

---

## 17. Qualitätsstandard

Jede neue Fähigkeit muss diese Fragen beantworten:

- Welche Primitive nutzt sie?
- Welche Daten speichert sie?
- Welche Tools darf sie nutzen?
- Welches Risiko hat sie?
- Braucht sie Freigabe?
- Wird sie auditiert?
- Kann sie fehlschlagen?
- Wie heilt sie sich selbst?
- Wie kann der Nutzer sie stoppen?

Wenn eine Fähigkeit diese Fragen nicht beantworten kann, ist sie noch nicht produktionsreif.

---

## 18. Zielbild

JARVIS soll sich anfühlen wie ein lokales Betriebssystem für persönliche KI Arbeit:

- visuell hochwertig
- technisch belastbar
- dauerhaft kontextbewusst
- handlungsfähig
- sicher begrenzt
- ehrlich protokolliert
- erweiterbar
- lokal kontrollierbar

Der Chat ist nur die Oberfläche. Die Runtime ist das eigentliche Produkt.
