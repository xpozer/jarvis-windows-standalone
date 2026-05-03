# JARVIS · Frontend F-Roadmap

> Master-Plan fuer den Iron-Man-Style-Redesign des Frontends. Diese Datei ist Single Source of Truth.
> Aeltere Dokumente (`FRONTEND_VISUAL_ROADMAP.md`, `FRONTEND_LIVING_UI_VISION.md`) bleiben als Inspiration und Detail-Referenz erhalten, sind aber **nicht mehr massgeblich** fuer Block-Reihenfolge, Tabu-Liste oder Akzeptanzkriterien.

## Leitsatz

JARVIS-Frontend wird Iron-Man-Anzug-Interface: drei Bildschirm-Elemente, alles andere ueber Slash-Commands oder Voice.

1. **Orb** zentriert, 40-50% Viewport-Hoehe
2. **Dialogfeld** unten, semi-transparent, Slash-Commands + Texteingabe
3. **HUD-Telemetrie** in den vier Ecken

Keine sichtbaren Menues, Tabs oder Sidebars.

## Stack

TypeScript-Frontend (React + Vite), Three.js fuer Orb (bestehend), Python-Backend (FastAPI), Piper-TTS, WebSocket fuer Live-Telemetrie, CSS-Animations fuer HUD.

## Block-Uebersicht

| Block | Inhalt | Branch | Status |
|---|---|---|---|
| F1 | Foundation: Sidebar/TopBar weg, Command-Bus, Orb-Grid | `feat/frontend-f1-shell` | offen |
| F2 | Orb: 5 States, 40-50% Sizing, DPR-Test | `feat/frontend-f2-orb-states` | offen |
| F3 | HUD-Telemetrie: 4 Corner-Components, WebSocket-Channels | `feat/frontend-f3-hud-ws` | offen |
| F4 | Command-Interface: Dialogfeld, Autocomplete, History | `feat/frontend-f4-command` | offen |
| F5 | Voice: Whisper-STT, Piper-TTS, Orb-State-Sync | `feat/frontend-f5-voice` | offen |
| F6 | Modal-Overlays: Glasmorphism, Routing fuer Pages | `feat/frontend-f6-modals` | offen |

## F1 — Foundation

**Ziel:** Bildschirm zeigt nur Orb (zentriert, mit Platzhalter-Groesse) und Stub-Dialogfeld unten. Sidebar/TopBar/TitleBar nicht mehr sichtbar. Command-Bus existiert als zentraler Dispatcher.

**Akzeptanzkriterien:**
- `App.tsx` rendert kein `<Sidebar>` und kein `<TopBar>` mehr.
- Layout = CSS-Grid: Orb-Container (zentriert) + Dialog-Stub (unten) + 4 leere HUD-Ecken.
- Neuer Hook `useCommandBus()` zentralisiert Text-Input und ist vorbereitet auf Voice + Hotkeys.
- Alle 31 Pages bleiben ueber Command-Bus erreichbar (Stub-Routing reicht; Modal-System kommt in F6).
- ESC schliesst Modals (auch wenn noch keine sichtbar sind, Hook ist verkabelt).
- `JARVIS_CLASSIC_LAYOUT=1` Env zeigt das alte Layout (Rollback-Switch).
- Tests: `npm run build` gruen, `npm run typecheck` gruen.

**Out of scope:** Echte HUD-Inhalte (F3), Slash-Autocomplete (F4), Voice (F5), Modals (F6).

## F2 — Orb-Komponente

**Ziel:** Orb nutzt 40-50% Viewport, 5 States vollstaendig.

**Akzeptanzkriterien:**
- 5. State `error` ergaenzt in `OrbState` Type + `NEURAL_CONTENT` (rote Neuronen).
- Orb-Container-CSS: skaliert sauber von Mobile bis 4K, Zielbereich 40-50% Viewport-Hoehe.
- DevicePixelRatio-Scaling getestet auf 1x, 1.5x, 2x, 3x.
- Demo-Page oder Storybook zeigt alle 5 States.
- Tests: `npm run build` gruen.

**Out of scope:** Backend-Push fuer Orb-State (kommt in F3).

## F3 — HUD-Telemetrie

**Ziel:** Vier Corner-Components zeigen CPU/RAM/Latenz/Agent (TL), Netzwerk/Zeit (TR), AuditLog-Stream der letzten 5 Eintraege (BL), aktive Tools/RiskLevel (BR). Live via WebSocket.

**Akzeptanzkriterien:**
- Backend: drei WebSocket-Endpunkte
  - `/ws/telemetry` (Push alle 500ms)
  - `/ws/audit` (Push pro Audit-Event)
  - `/ws/orb-state` (Push pro Orb-State-Change)
- Frontend: vier Corner-Components mit smooth interpolation fuer Werte (kein abruptes Springen).
- Reconnect-Logik mit 3s exponential backoff.
- Tests: WS-Smoke (Backend liefert mindestens einen Frame innerhalb 3s).

## F4 — Command-Interface

**Ziel:** Dialogfeld unten, Slash-Autocomplete fuer alle definierten Commands, History via Pfeil hoch und runter.

**Akzeptanzkriterien:**
- Slash-Commands mindestens: `/agents`, `/tools`, `/audit`, `/diag`, `/settings`, `/sap`, `/vde`, `/knowledge`, `/work` plus die bestehenden aus `useSlashCommands.ts` (`/termin`, `/calc`, `/email`, `/skill`).
- Autocomplete-Dropdown bei `/`-Trigger.
- History bis 50 Eintraege, persistent in LocalStorage.
- Enter fuehrt aus, ESC verwirft.
- Hotkey Strg+K fokussiert Dialogfeld.
- Tests: Unit-Tests fuer Command-Bus-Parser und `getMatchingCommands()`.

## F5 — Voice-Mode

**Ziel:** Mikrofon Default-OFF, Push-to-Talk per Hotkey, Whisper-STT lokal, Piper-TTS, Orb-State synchron.

**Akzeptanzkriterien:**
- Hotkey (Default: rechte Strg-Taste, konfigurierbar) aktiviert Mic, Orb wechselt zu `listening`.
- Loslassen: Whisper transkribiert lokal, Result laeuft durch Command-Bus.
- Antwort kommt -> Piper rendert TTS, Orb wechselt zu `speaking`.
- Wake-Word optional, Default deaktiviert (Privacy-First).
- Mic-OFF-Indicator persistent in einer HUD-Ecke sichtbar.
- Tests: manueller Voice-Smoke plus automatisierter Whisper-Mock-Test.

## F6 — Modal-Overlays

**Ziel:** Pages erscheinen als Glasmorphism-Modal ueber dem Orb, schliessbar per ESC.

**Akzeptanzkriterien:**
- Modal-Komponente mit `backdrop-filter: blur(12px)` und transparenter Border.
- Routing: Slash-Command oeffnet zugehoerige Page als Modal (z. B. `/agents` -> `<AgentRegistryPage />`).
- ESC schliesst, Click-Outside schliesst, Stack-Logik fuer mehrere Modals (LIFO).
- Tests: Modal oeffnen und schliessen, ESC, Click-Outside.

## Mapping zur frueheren Roadmap

| F-Block | bezieht ein aus Visual Roadmap | bezieht ein aus Living UI Vision |
|---|---|---|
| F1 | Track A (Tokens) bleibt Pflicht-Foundation | — |
| F2 | — | DO-Punkt "Persoenlichkeit" Orb-State-Cues |
| F3 | Track C (HUD live) | DO-Punkt "Reaktivitaet auf Daten" (Heatmap, Pulse-on-Event) |
| F4 | Track D (Command Palette) | DO-Punkt "Persoenlichkeit" Status-Texte |
| F5 | — | DO-Punkt "Sound x Visual Coupling" |
| F6 | — | DO-Punkte "Holographic Glass" und "Depth-of-Field" |

Track B (Topbar/Sidebar Polish) entfaellt: das alte Layout wird in F1 entfernt.
Track E (Empty States) entfaellt vorerst: Pages werden in F6 als Modals neu beurteilt.

## Tabu-Update

Die fruehere Tabu-Liste (`Orb.tsx`, `App.tsx::sendMessage`, `sound-engine`, Voice, LocalStorage) galt fuer reines Visual-Polishing. Die F-Roadmap **erfordert** kontrollierte Anpassungen an diesen Stellen:

- **`Orb.tsx`** — wird in F2 erweitert (5. State + Sizing). Three.js-Basis bleibt.
- **`App.tsx` SSE-Parser** — bleibt funktional erhalten, wird in F4 hinter dem Command-Bus gekapselt.
- **`sound-engine`** — bleibt; F5 ergaenzt Whisper, ohne `jarvisSound` umzubauen.
- **Voice / Speech Recognition** — wird in F5 explizit refactored.
- **LocalStorage-Keys** — bleiben kompatibel, neue Keys nur additiv.

## Lieferung

- Ein Block = ein PR auf `main`.
- Branch-Naming siehe Tabelle.
- Vor jedem Block: dieses Dokument als Prompt-Anker referenzieren.
- Nach jedem Block: `PROJECT_STATUS.md` und `CHANGELOG.md` aktualisieren.
- Reihenfolge: F1 -> F2 -> F3 -> F4 -> F5 -> F6 (Foundation zuerst, Modals zuletzt).
- Rollback-Switch `JARVIS_CLASSIC_LAYOUT=1` bleibt bis F6 abgeschlossen ist.
