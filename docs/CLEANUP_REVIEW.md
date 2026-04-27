# JARVIS Cleanup Review

Stand: aktueller Runtime und Action Engine Refactor

## Grundregel

Es wird nichts gelöscht, wenn nicht eindeutig klar ist, dass es ungenutzt und gefahrlos entfernbar ist. Unsichere Stellen bleiben aktiv oder werden erst dokumentiert.

## Bereits sicher verschlankt

### Frontend Runtime

Aus `frontend/src/components/RuntimeControlPanel.tsx` wurden ausgelagert:

- `frontend/src/features/runtime/runtimeTypes.ts`
- `frontend/src/features/runtime/runtimeApi.ts`
- `frontend/src/features/runtime/runtimeFormat.ts`
- `frontend/src/features/runtime/MemoryCard.tsx`
- `frontend/src/features/runtime/AwarenessCard.tsx`
- `frontend/src/features/runtime/ActionEngineCard.tsx`
- `frontend/src/features/runtime/AuthorityGateCard.tsx`
- `frontend/src/features/runtime/GoalsCard.tsx`
- `frontend/src/features/runtime/WorkflowsCard.tsx`
- `frontend/src/features/runtime/SidecarsCard.tsx`

Bewertung: aktiv genutzt, nicht löschen.

### Frontend Dashboard

Aus `frontend/src/components/DashboardModules.tsx` wurde ausgelagert:

- `frontend/src/features/dashboard/dashboardConfig.ts`

Bewertung: aktiv genutzt, nicht löschen.

### Backend Runtime Router

`backend/routes/usejarvis.py` wurde zur Compatibility Fassade und verweist auf:

- `backend/routes/runtime/__init__.py`
- `backend/routes/runtime/status.py`
- `backend/routes/runtime/memory.py`
- `backend/routes/runtime/awareness.py`
- `backend/routes/runtime/actions.py`
- `backend/routes/runtime/goals.py`
- `backend/routes/runtime/workflows.py`
- `backend/routes/runtime/sidecars.py`
- `backend/routes/runtime_models.py`

Bewertung: aktiv genutzt. Die Fassade `usejarvis.py` bleibt bestehen, damit bestehende Imports und Main App Wiring nicht brechen.

### Backend Runtime Services

`backend/services/usejarvis_runtime.py` wurde zur Compatibility Fassade und verweist auf:

- `backend/services/runtime/db.py`
- `backend/services/runtime/audit.py`
- `backend/services/runtime/memory.py`
- `backend/services/runtime/awareness.py`
- `backend/services/runtime/authority.py`
- `backend/services/runtime/goals.py`
- `backend/services/runtime/registry.py`
- `backend/services/runtime/status.py`

Bewertung: aktiv genutzt. Die Fassade bleibt bestehen, weil mehrere Bereiche weiterhin `from services import usejarvis_runtime as rt` nutzen.

### Backend Action Engine

`backend/services/action_engine.py` wurde zur Compatibility Fassade und verweist auf:

- `backend/services/actions/common.py`
- `backend/services/actions/filesystem.py`
- `backend/services/actions/git_tools.py`
- `backend/services/actions/system_tools.py`
- `backend/services/actions/registry.py`
- `backend/services/actions/executor.py`
- `backend/services/actions/dispatcher.py`

Bewertung: aktiv genutzt. Die Fassade bleibt bestehen, weil Runtime Routes weiterhin `from services import action_engine` verwenden.

## Nicht löschen

Diese Dateien sehen klein aus, sind aber absichtlich Fassaden:

- `backend/services/usejarvis_runtime.py`
- `backend/services/action_engine.py`
- `backend/routes/usejarvis.py`

Sie sichern Rückwärtskompatibilität und verhindern Import Brüche.

## Cleanup Kandidaten für spätere Prüfung

Diese Bereiche sollten später geprüft, aber nicht ohne Test gelöscht werden:

- alte Mockup Dateien im Frontend, falls vorhanden
- große CSS Dateien mit eventuell ungenutzten Klassen
- doppelte API Helper im Frontend außerhalb `features/runtime`
- ältere Diagnose oder Deep Status Funktionen, falls sie nicht mehr über UI erreichbar sind
- alte Boot HUD Varianten, falls mehrere Versionen nebeneinander liegen
- alte Installer Skript Fallbacks, falls durch neuere Skripte ersetzt

## Empfohlene Prüfungen nach jedem Refactor

Backend:

```bat
python -m compileall backend
```

Frontend:

```bat
npm run build
```

Runtime Endpoints:

```text
/api/runtime/status
/api/runtime/memory/facts
/api/runtime/awareness/current
/api/runtime/actions
/api/runtime/action-engine/tools
/api/runtime/action-engine/system/info
/api/runtime/action-engine/git/status
```

Frontend manuell:

```text
SYSTEM -> JARVIS Runtime
Memory SAVE
Awareness START LOOP / STOP
Action Engine SYSTEM / GIT STATUS / PREPARE URL
Authority Gate APPROVE / EXECUTE
Goals ADD
Workflows CREATE DEMO / RUN
Sidecars REGISTER
```

## Offene nächste Schritte

1. TypeScript Build prüfen.
2. Python Compile prüfen.
3. CSS Größen und Doppelungen prüfen.
4. Alte Mockups und nicht verlinkte Dateien suchen.
5. Erst danach Action Engine Level 2 bauen.
