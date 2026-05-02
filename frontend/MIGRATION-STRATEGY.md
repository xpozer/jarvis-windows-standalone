# Frontend Migration Strategy

Die Stack Migration ersetzt den bestehenden Single File Stand nicht sofort.

## Ziel

Der neue Stack wird parallel aufgebaut, bis er als Werkzeug besser ist als die alte Oberflaeche.

## Phase 1: Stack Skelett

Status: begonnen

Ziel:

```text
Vite React Basis
Token System
Komponenten Bibliothek
13 Page Slots
Preview Build
Performance Budget
Accessibility Guardrails
```

Freigabe fuer Phase 1:

```text
npm run typecheck gruen
npm run test gruen
npm run build:stack-preview gruen
npm run budget:stack-preview gruen
npm run a11y:checklist gruen
```

## Phase 2: Echte Daten und KI Sidebar

Ziel:

```text
Dashboard API Client nutzt echte Backend Endpunkte
Websocket Stream fuer Logs und Tool Calls
JARVIS Sidebar als Kontext Beifahrer
Risk Level Confirmation Flow
Offline und Stale Indicators
```

Freigabe fuer Phase 2:

```text
Keine Demo Werte mehr auf produktiven Stack Pages
Stale Indicator funktioniert
High Risk Aktionen brauchen Bestaetigung
Reduced Motion bleibt wirksam
```

## Phase 3: Alle 13 Pages produktiv machen

Ziel:

```text
Start
Dialog
LifeOS
Wissensbasis
Datenstroeme
Aufgaben und Automationen
JARVIS Runtime
Diagnose
Agentennetz
Speicherbanken
Kernsysteme
Sicherheitszentrale
Werkzeuge
```

Freigabe fuer Phase 3:

```text
Jede Page hat echte Daten oder klaren Offline Zustand
Jede Page ist per Tastatur erreichbar
Jede Page hat leeren Zustand und Fehlerzustand
Kein kritischer Flow nur per Maus
```

## Phase 4: Alter HTML Stand abloesen

Der alte Stand darf erst ersetzt werden, wenn alle Bedingungen erfuellt sind.

```text
Phase 1 bis 3 abgeschlossen
Stack Preview lokal geprueft
CI Preview Build gruen
Performance Budget gruen
Accessibility Check gruen
Manuelle Sichtpruefung erledigt
Fallback Plan dokumentiert
```

## Fallback Plan

Wenn der neue Stack nach Umschaltung Probleme macht:

```text
1. docs/index.html aus letztem stabilen Commit wiederherstellen
2. Stack Preview in docs/stack-preview belassen
3. Fehler in eigenem Branch beheben
4. Erst nach erneutem Test wieder umschalten
```

## Verbotene Abkuerzungen

```text
Kein Ersetzen von docs/index.html nur wegen besserer Optik
Keine produktive Page mit Demo Werten
Keine Animation ohne Reduced Motion Pfad
Keine High Risk Aktion ohne sichtbare Bestaetigung
Keine ungetestete Dependency Migration direkt auf main
```

## Erfolgskriterium

Der neue Stack ist erst fertig, wenn JARVIS weniger Reibung erzeugt als der alte Stand.

Optik allein ist kein Release Grund.
