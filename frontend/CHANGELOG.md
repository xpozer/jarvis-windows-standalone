# Frontend Changelog

## v18_F2_ORB

### Added

- State reactive Canvas Orb replaces the F1 SVG placeholder.
- New Orb renderer files:
  - `frontend/src/components/Orb/Orb.tsx`
  - `frontend/src/components/Orb/OrbCanvas.ts`
  - `frontend/src/components/Orb/OrbStates.ts`
  - `frontend/src/components/Orb/useOrbAnimation.ts`
  - `frontend/src/components/Orb/useOrbState.ts`
  - `frontend/src/components/Orb/useAudioReactive.ts`
- Five Orb states:
  - idle
  - listening
  - thinking
  - speaking
  - error
- Smooth interpolation for color, glow, rotation speed, particle behavior and pulse cycle over 600ms.
- DPR aware canvas resize with minimum 2x render scale.
- Adaptive particle count:
  - desktop 200
  - mobile 80
- Hidden tab animation throttling through `document.hidden`.
- Generic `useWebSocket` hook with reconnect backoff.
- Orb state channel service for `/orb-state`.
- Backend WebSocket stub at `/orb-state` that sends idle on connect.

### Changed

- `OrbSlot` now renders `Orb` instead of `OrbPlaceholder`.
- `orbStore` now tracks `state`, `audioLevel` and `intensity`.
- `CommandBus.execute` now drives Orb states:
  - command start: thinking
  - successful stub response: speaking
  - after 1.5s: idle
  - errors: error
- Orb sizing updated:
  - desktop landscape: 50vh
  - portrait/tablet: 45vh
  - mobile below 640px: 60vw
- `frontend/package.json` version updated to `v18_F2_ORB`.

### Removed

- `frontend/src/components/Orb/OrbPlaceholder.tsx`

### Migration from `docs/index.html`

The exact GitHub Pages dashboard file remains unchanged. F2 does not render the page directly. The visual behavior was migrated into a React compatible Canvas renderer:

- retained black/cyan HUD visual identity
- retained soft radial glow
- retained particle/orb energy effect
- retained local-only frontend behavior
- adapted into `OrbCanvas` class with explicit lifecycle methods
- added stateful visual parameters and interpolation
- added DPR and ResizeObserver handling for React runtime

### Backend

- Added `backend/routes/orb_state.py`
- Registered `orb_state_router` in `backend/main.py`
- The endpoint is intentionally minimal and only sends idle keepalive messages. Real backend state push comes later.

### Test checklist

- [ ] Orb renders centered, correct size around 50vh on desktop
- [ ] Idle state visually matches the existing cyan GitHub Pages identity
- [ ] Resize browser window: Orb scales smoothly without pixel blur
- [ ] DPR scaling on Retina or 4K looks sharp
- [ ] Dev console state switch works through `useOrbStore.getState().setState('thinking')`
- [ ] All five states are visually distinct
- [ ] Error state resets to idle after 3 seconds
- [ ] WebSocket `/orb-state` connects and receives idle
- [ ] Disconnect triggers temporary error state and reconnect backoff
- [ ] Slash command submit moves thinking, then speaking, then idle
- [ ] Mobile 375px shows Orb at 60vw without overflow
- [ ] Hidden tab pauses render work via `document.hidden`
- [ ] Unmount cleans ResizeObserver, animation frame and renderer
- [ ] Desktop Chrome performance remains around 60fps

### ZIP build

```powershell
cd frontend
npm install
npm run typecheck
npm run build
New-Item -ItemType Directory -Force -Path ..\release | Out-Null
Compress-Archive -Path .\* -DestinationPath ..\release\jarvis-v18_F2_ORB-frontend.zip -Force
```

Backend patch ZIP:

```powershell
New-Item -ItemType Directory -Force -Path .\release\backend-orb-state | Out-Null
Copy-Item .\backend\main.py .\release\backend-orb-state\main.py -Force
New-Item -ItemType Directory -Force -Path .\release\backend-orb-state\routes | Out-Null
Copy-Item .\backend\routes\orb_state.py .\release\backend-orb-state\routes\orb_state.py -Force
Compress-Archive -Path .\release\backend-orb-state\* -DestinationPath .\release\jarvis-v18_F2_ORB-backend-orb-state.zip -Force
```

## v18_F1_FOUNDATION

### Added

- New Iron Man suit interface foundation shell.
- Fullscreen fixed layout with three visible screen groups:
  - centered Orb slot
  - bottom command dialog
  - four HUD corner placeholders
- CommandBus foundation with register, parse, execute and getSuggestions.
- Slash command registry with F1 stubs:
  - /help
  - /clear
  - /agents
  - /tools
  - /audit
  - /diag
  - /settings
  - /sap
  - /vde
  - /knowledge
  - /work
- Zustand UI store for focus, overlay and command history state.
- Zustand Orb store for idle, listening, thinking, speaking and error placeholder states.
- Global hotkeys:
  - Ctrl K or Cmd K focuses command input
  - ESC blurs input and closes overlay state
- WebSocketClient placeholder prepared for later channels:
  - /telemetry
  - /audit
  - /orb-state
- Tailwind config foundation for later utility based UI work.

### Changed

- `frontend/index.html` stripped to one React entrypoint.
- `frontend/src/main.tsx` stripped to direct RootLayout mount.
- Runtime entry no longer mounts the legacy topbar, sidebar, tab navigation or old page shell.
- `frontend/package.json` renamed version to `v18_F1_FOUNDATION`.
- Added `zustand`, `tailwindcss`, `postcss` and `autoprefixer` for the v18 stack foundation.

### Removed from runtime path

The following legacy UI elements are no longer imported by the new runtime entry:

- Legacy App shell
- Topbar
- Sidebar navigation
- Tab navigation
- Old dashboard visible page shell
- Boot iframe overlay
- Legacy bridge script tags from index.html

### Planned physical delete after green build

These files should be physically removed after local `npm run typecheck` confirms there are no lingering imports:

- `frontend/src/App.tsx`
  - Reason: old monolithic UI shell with visible menus, topbar, sidebar, page routing and legacy chat logic.
- `frontend/src/jarvis-dashboard.css`
  - Reason: old dashboard shell styling, not used by v18 RootLayout.
- `frontend/src/orb-legacy.css`
  - Reason: old Orb styling, F2 will bring the migrated Orb component cleanly.
- `frontend/src/chat-window.css`
  - Reason: old chat and panel styling, replaced by DialogSlot in F1.
- Legacy page and sidebar components under `frontend/src/components/` that are only referenced by the old `App.tsx`.
  - Reason: no visible menus, tabs or sidebars are allowed in v18.

### Kept unchanged

- Backend code
- Python package config
- Installer scripts
- `docs/index.html`, because the existing GitHub Pages Orb is the source for F2 migration
- Existing diagnostic HTML files
- Existing local config and runtime data rules

### Test checklist

- [ ] `npm install` runs successfully
- [ ] `npm run dev` starts without errors
- [ ] Black fullscreen screen with vignette is visible
- [ ] Orb placeholder is centered and pulses
- [ ] Dialog is bottom centered and focusable with Ctrl K or Cmd K
- [ ] Typing `/` opens suggestions
- [ ] Enter on slash command logs `[JARVIS:F1:COMMAND]` in console
- [ ] ESC blurs dialog
- [ ] Arrow up and down navigate suggestions and history
- [ ] Four HUD corner placeholders are visible
- [ ] No old menus, tabs or sidebars are visible in runtime DOM
- [ ] Mobile width around 375px does not break layout

### ZIP build

```powershell
cd frontend
npm install
npm run typecheck
npm run build
New-Item -ItemType Directory -Force -Path ..\release | Out-Null
Compress-Archive -Path .\* -DestinationPath ..\release\jarvis-v18_F1_FOUNDATION-frontend.zip -Force
```
