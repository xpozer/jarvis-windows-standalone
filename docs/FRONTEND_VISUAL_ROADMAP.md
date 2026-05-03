# Frontend Visual Roadmap

> ⚠️ **Superseded by [`FRONTEND_F_ROADMAP.md`](FRONTEND_F_ROADMAP.md)** (B6.6.36).
> Dieses Dokument bleibt als Inspirations- und Detail-Referenz erhalten, ist aber nicht mehr massgeblich fuer Block-Reihenfolge, Tabu-Liste oder Akzeptanzkriterien. Track A (Tokens) bleibt jedoch verbindliche Foundation und wird in F1 vorausgesetzt.

> Ziel: Das echte App-Frontend (`frontend/src/`) auf das gleiche visuelle Niveau heben wie das HUD-Dashboard (`docs/index.html`) — **ohne** die fragile Logik (Orb, SSE-Parser, Voice, LocalStorage) anzufassen.

**Branding-Anker:** HUD-Style · Cyan / Anthrazit · Operator-Console · industrial-serious, kein Marvel-Cosplay.
**Master-Referenz:** [`docs/index.html`](index.html) und [`docs/assets/jarvis-hero.svg`](assets/jarvis-hero.svg).

---

## Ground Truth (Stand 2026-05)

| Bereich | Ist-Zustand |
|---|---|
| Routing | Kein React Router — `App.tsx` ist 905 Zeilen, `activeNav`-State switched ~31 Pages |
| Pages | 31 `*Page.tsx` Components in `frontend/src/components/` |
| Styling | Vanilla CSS, 16 Files. **Zwei parallele Token-Sets**: `--jv-*` (App.css), `--panel/--cyan` (jarvis-dashboard.css) → Palette-Drift |
| Themes | 3 Varianten via `data-jarvisTheme`: `jarvis`, `matrix`, `ultron` |
| Build | Vite 5, base `./` (Electron-relative), Three.js Dependency |
| Sound-Engine | Custom `jarvisSound`, fragil — nicht anfassen |
| Backend-Coupling | SSE-Stream-Parser in `App.tsx::sendMessage()` — nicht anfassen |

## Master-Palette (verbindlich)

| Variable | Hex | Verwendung |
|---|---|---|
| `--jv-bg-0` | `#05080d` | tiefster Hintergrund |
| `--jv-bg-1` | `#0a0e14` | Panel-Hintergrund |
| `--jv-bg-2` | `#0f141c` | erhöhte Karten |
| `--jv-bg-3` | `#161c27` | Hover/Active |
| `--jv-line` | `#1f2937` | Standard-Border |
| `--jv-line-soft` | `#141b25` | sanfte Trennlinien |
| `--jv-text` | `#e6f1ff` | Primärtext |
| `--jv-text-dim` | `#8aa1bd` | Sekundärtext |
| `--jv-text-mute` | `#5b6b82` | Labels, Hints |
| `--jv-cyan` | `#00d4ff` | Primary / Brand |
| `--jv-cyan-dim` | `#0a7c94` | Cyan-Borders |
| `--jv-green` | `#00ff88` | OK / Online |
| `--jv-amber` | `#ffb800` | Warning / RiskLevel MED |
| `--jv-red` | `#ff3b5c` | Error / RiskLevel HIGH / Mic-OFF |
| `--jv-violet` | `#b48cff` | Audit / Storage |

---

## Tracks

### 🟢 Track A — Tokens-Layer angleichen
**Risiko:** keins. **Aufwand:** ~2h. **Sichtbarkeit:** sofort.

- Neues File: `frontend/src/styles/tokens.css`
- Master-Palette als Single Source of Truth (siehe Tabelle oben)
- Bestehende `--jv-*` und `--panel/--cyan/...` zeigen **referenziell** auf die Master-Vars
- Import in `frontend/src/main.tsx` als erste CSS-Datei
- Keine Component-Änderungen, keine Layout-Änderungen
- **Akzeptanz:** App startet, alle Pages rendern, Farben matchen jetzt das Pages-Dashboard

### 🟡 Track B — Topbar + Sidebar polish
**Risiko:** low. **Aufwand:** ~3h. **Sichtbarkeit:** hoch.

- Topbar bekommt persistent **`MIC OFF`-Indicator** (rote Pille) → Datenschutz-Versprechen sichtbar einlösen
- Sidebar bekommt **Pulse-Dots** für aktive Modul-Status (Pure CSS, dataset-driven)
- Risk-Indicator-Klassen für Buttons mit hohem RiskLevel (`data-risk="high"`)
- Glow-States für aktiven Nav-Eintrag
- **Pure CSS**, kein React-State
- **Akzeptanz:** App.tsx-Logik unverändert, aber Topbar/Sidebar matchen das Dashboard-Look

### 🟠 Track C — HUD-Frame: Mockup → Live
**Risiko:** medium. **Aufwand:** ~4h.

- `JarvisHudFrame.tsx` empfängt schon Props (`memoryCount`, `messageCount`, `awarenessOnline`) die nicht genutzt werden
- Conversation Context Card: aktuelle Session anstelle Hardcoded
- System Snapshot: echte Telemetrie-Werte statt Mock
- Quick Actions: bleiben statisch (keine Logik-Änderung)
- **Akzeptanz:** Cards zeigen Live-Daten, keine neuen Backend-Calls

### 🔵 Track D — Command Palette `Strg+K` (optional)
**Risiko:** low (additive). **Aufwand:** ~3h.
- Neues Component: `CommandPalette.tsx`
- Listet alle 31 Pages plus häufige Aktionen
- Keyboard-First — typisch JARVIS-USP
- **Akzeptanz:** `Strg+K` öffnet Palette, Enter springt zu Page

### 🟣 Track E — Empty States mit Charakter (optional)
**Risiko:** keins. **Aufwand:** ~2h.
- Pages wie `KnowledgePage`, `FilesPage`, `AuditLogPage` zeigen aktuell vermutlich generische "Keine Daten" Texte
- Pro Page ein passendes SVG + sinnvoller Primary CTA
- **Akzeptanz:** keine "No data" Strings mehr

---

## Tabu — niemals anfassen ohne separate Diskussion

- `Orb.tsx` (Three.js, hand-getuned)
- `App.tsx::sendMessage()` und der gesamte SSE-Parser
- `sound-engine` Imports
- Voice / Speech Recognition Setup
- LocalStorage-Keys (Zoom, Theme, SafeMode)

---

## Lieferung

- Ein Track = ein PR
- Branch-Naming: `feat/frontend-track-{a|b|c|d|e}-…`
- Vor jedem Track: dieses Roadmap-Dokument als Prompt-Anker referenzieren
- Nach jedem Track: User entscheidet ob nächster Track freigegeben wird
- Tabu-Sektion ist verbindlich
