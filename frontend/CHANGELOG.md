# Frontend Changelog

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
