# Architektur Verbesserungen

Dieses Dokument beschreibt sinnvolle Architektur Verbesserungen für JARVIS Windows Standalone.

Der Fokus liegt auf lokaler Stabilität, Nachvollziehbarkeit, Datenschutz und einfacher Weiterentwicklung.

## 1. AuditLog von JSON zu SQLite migrieren

### Ist Zustand

AuditLog ist als JSON Datei oder JSON Dateisammlung geplant. Das ist einfach, wird aber bei vielen Einträgen schnell unhandlich.

### Ziel

SQLite als lokale Datenbank mit WAL Mode.

Vorteile:

| Punkt | Vorteil |
|---|---|
| Performance | Schneller bei vielen Audit Einträgen |
| Stabilität | Weniger Risiko bei gleichzeitigen Schreibvorgängen |
| Abfragen | Filter nach Zeit, Agent, Tool, RiskLevel und Status möglich |
| Wartung | Rotation und Export werden einfacher |
| Local First | Bleibt vollständig lokal auf dem Gerät |

### Empfohlenes Schema

```sql
CREATE TABLE IF NOT EXISTS audit_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL,
    actor TEXT NOT NULL,
    agent_id TEXT,
    tool_id TEXT,
    risk_level TEXT NOT NULL,
    action TEXT NOT NULL,
    status TEXT NOT NULL,
    input_hash TEXT,
    output_hash TEXT,
    metadata_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_events(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_agent_id ON audit_events(agent_id);
CREATE INDEX IF NOT EXISTS idx_audit_tool_id ON audit_events(tool_id);
CREATE INDEX IF NOT EXISTS idx_audit_risk_level ON audit_events(risk_level);
```

### WAL Mode aktivieren

```python
import sqlite3
from pathlib import Path

DB_PATH = Path("runtime/audit/audit.db")
DB_PATH.parent.mkdir(parents=True, exist_ok=True)

conn = sqlite3.connect(DB_PATH)
conn.execute("PRAGMA journal_mode=WAL")
conn.execute("PRAGMA synchronous=NORMAL")
conn.execute("PRAGMA foreign_keys=ON")
```

### Was angepasst werden muss

| Bereich | Änderung |
|---|---|
| Audit Writer | Nicht mehr JSON append, sondern Insert in SQLite |
| Audit Reader | Filter und Pagination über SQL |
| DiagCenter | Prüfung auf DB Datei und WAL Dateien ergänzen |
| Export | Export nach JSON oder CSV anbieten |
| Backup | `audit.db`, `audit.db-wal`, `audit.db-shm` berücksichtigen |
| Tests | Schreibtest, Lesetest, Exporttest, Korruptionstest |

### Migrationspfad

| Schritt | Aktion |
|---|---|
| 1 | SQLite Audit Service parallel zu JSON einführen |
| 2 | Neue Events zusätzlich in SQLite schreiben |
| 3 | JSON Bestand einmalig importieren |
| 4 | DiagCenter auf SQLite Status erweitern |
| 5 | JSON Schreibweg deaktivieren |
| 6 | JSON Export als Kompatibilitätsfunktion behalten |

## 2. Knowledge Index: FAISS vs Chroma vs Qdrant

| Kriterium | FAISS | Chroma | Qdrant Local |
|---|---|---|---|
| Betrieb | Lokal als Library | Lokal als Library oder Server | Lokal als Binary oder Embedded naher Betrieb |
| Einrichtung | Technischer | Einfach | Mittel |
| Windows Standalone | Möglich, aber Paketierung beachten | Gut geeignet | Gut, aber mehr Runtime Aufwand |
| Metadaten | Muss selbst gebaut werden | Eingebaut | Sehr stark |
| Persistenz | Selbst organisieren | Eingebaut | Eingebaut |
| Suche | Sehr schnell | Gut | Sehr gut |
| Wartung | Mehr Eigenarbeit | Einfach | Mehr Komponenten |
| Offline Nutzung | Ja | Ja | Ja |

### Empfehlung

Für JARVIS als Windows Standalone ist Chroma am pragmatischsten.

Begründung:

| Grund | Erklärung |
|---|---|
| Wenig Betriebsaufwand | Kein zusätzlicher Server nötig |
| Gute Persistenz | Lokale Speicherung ist direkt vorgesehen |
| Metadaten brauchbar | Sources, Dateipfade, Chunk Typen und Zeitstempel lassen sich sauber speichern |
| Entwicklerfreundlich | Schnell in Python integrierbar |
| Ausreichend leistungsfähig | Für lokale Arbeitsunterlagen und technische Doku reicht es realistisch aus |

FAISS ist interessant, wenn maximale Geschwindigkeit wichtiger wird und Metadaten selbst verwaltet werden sollen.

Qdrant ist interessant, wenn später mehrere Nutzer, komplexe Filter oder ein eigener lokaler Dienst geplant sind.

### Zielstruktur Knowledge

```text
runtime/knowledge/
  chroma/
  sources/
  exports/
```

### Chunk Metadaten

```json
{
  "source_id": "vde_doc_001",
  "source_type": "pdf",
  "title": "Pruefung elektrischer Anlagen",
  "path": "sources/vde_doc_001.pdf",
  "chunk_index": 12,
  "created_at": "2026-04-29T12:00:00Z",
  "tags": ["VDE", "DGUV", "Pruefung"]
}
```

## 3. Logging mit Loguru einführen

### Ziel

Einheitliche strukturierte Logs für Backend, DiagCenter, WorkAgent und Installer Brücken.

### Beispielkonfiguration

```python
from loguru import logger
from pathlib import Path
import sys

LOG_DIR = Path("logs")
LOG_DIR.mkdir(parents=True, exist_ok=True)

logger.remove()

logger.add(
    sys.stderr,
    level="INFO",
    colorize=True,
    format="<green>{time:HH:mm:ss}</green> | <level>{level}</level> | {message}",
)

logger.add(
    LOG_DIR / "jarvis.log",
    level="INFO",
    rotation="10 MB",
    retention="14 days",
    compression="zip",
    serialize=True,
)

logger.add(
    LOG_DIR / "errors.log",
    level="ERROR",
    rotation="5 MB",
    retention="30 days",
    serialize=True,
)
```

### Empfohlene Felder

| Feld | Zweck |
|---|---|
| request_id | Verbindung zwischen Frontend Anfrage und Backend Log |
| agent_id | Welcher Agent hat gearbeitet |
| tool_id | Welches Tool wurde genutzt |
| risk_level | Sicherheitsklassifikation |
| user_action | Auslösende Nutzeraktion |
| duration_ms | Laufzeitmessung |
| status | ok, warning, error |

## 4. API Contract zwischen Backend und Frontend

FastAPI kann OpenAPI automatisch bereitstellen. Das Frontend sollte Typen daraus generieren, statt eigene API Typen manuell zu pflegen.

### Backend

```python
from fastapi import FastAPI

app = FastAPI(
    title="JARVIS Local API",
    version="6.5.1",
    description="Local first API for JARVIS Windows Standalone",
)
```

OpenAPI liegt dann lokal unter:

```text
http://127.0.0.1:8000/openapi.json
```

### Frontend Type Generation

```powershell
cd frontend
npx openapi-typescript http://127.0.0.1:8000/openapi.json -o src/api/schema.ts
```

### Empfehlung

| Regel | Wirkung |
|---|---|
| Backend ist Contract Quelle | Keine widersprüchlichen Typen |
| Frontend generiert Typen | Weniger Fehler bei API Änderungen |
| CI prüft Schema | Breaking Changes fallen früher auf |
| Version im API Titel | Releases bleiben nachvollziehbar |

## 5. Mock Modus für SAP und FSM

### Ziel

Entwicklung ohne echte SAP oder FSM Verbindung ermöglichen.

### Warum wichtig

| Problem | Lösung durch Mock Modus |
|---|---|
| Keine Verbindung im privaten Netz | Lokale Entwicklung bleibt möglich |
| Keine echten Kundendaten | Datenschutz bleibt sauber |
| Tests brauchen stabile Daten | Mock Fixtures sind reproduzierbar |
| UI braucht Beispielwerte | Dashboard kann ohne Backend Integrationen laufen |

### Konfiguration

```json
{
  "integrations": {
    "sap": {
      "mode": "mock"
    },
    "fsm": {
      "mode": "mock"
    },
    "mail": {
      "mode": "mock"
    }
  }
}
```

### Python Interface

```python
from typing import Protocol

class SapClient(Protocol):
    def get_order(self, order_id: str) -> dict:
        ...

class MockSapClient:
    def get_order(self, order_id: str) -> dict:
        return {
            "order_id": order_id,
            "status": "mock",
            "budget": 50000,
            "used": 12450,
        }
```

### Factory

```python
def create_sap_client(mode: str) -> SapClient:
    if mode == "mock":
        return MockSapClient()
    if mode == "live":
        return LiveSapClient()
    raise ValueError(f"Unbekannter SAP Modus: {mode}")
```

## 6. Empfohlene Reihenfolge

| Priorität | Maßnahme | Grund |
|---|---|---|
| 1 | Mock Modus | Macht Entwicklung und Tests sofort einfacher |
| 2 | Loguru Logging | Bessere Diagnose bei Installer und Backend Problemen |
| 3 | OpenAPI Contract | Stabilisiert Frontend und Backend Zusammenspiel |
| 4 | SQLite AuditLog | Wichtig für echte Nutzung und Nachvollziehbarkeit |
| 5 | Chroma Knowledge Index | Gute Grundlage für lokale Wissenssuche |

## 7. Akzeptanzkriterien

```text
[ ] Backend startet ohne SAP oder FSM Verbindung im Mock Modus
[ ] Frontend kann gegen Mock Daten entwickelt werden
[ ] Logs landen strukturiert unter logs/
[ ] OpenAPI Schema ist abrufbar
[ ] Frontend API Typen können generiert werden
[ ] AuditLog schreibt testweise in SQLite WAL Mode
[ ] Knowledge Index speichert Chunks mit Sources und Metadaten
```
