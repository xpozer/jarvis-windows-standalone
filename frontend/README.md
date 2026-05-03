# JARVIS v18_F1_FOUNDATION

F1 ist der Strip und Foundation Block fuer das neue Iron Man Anzug Interface.

## Setup

```powershell
cd frontend
npm install
npm run dev
```

Danach im Browser oeffnen:

```text
http://127.0.0.1:5173
```

## Build

```powershell
cd frontend
npm run typecheck
npm run build
```

## ZIP Build

```powershell
cd frontend
npm install
npm run typecheck
npm run build
Compress-Archive -Path .\* -DestinationPath ..\release\jarvis-v18_F1_FOUNDATION-frontend.zip -Force
```

## Verhalten in F1

- Schwarzer Fullscreen ohne Scroll
- Zentrierter Orb Platzhalter
- Dialogfeld unten mit Slash Command Suggestions
- Vier HUD Corner Platzhalter
- Command Bus mit F1 Stub Commands
- Strg K oder Cmd K fokussiert Eingabe
- ESC blurrt Eingabe und schliesst Overlay State

## Nicht enthalten

- Echter Orb Canvas aus docs/index.html
- Live Telemetrie
- Voice Mode
- Backend Command Routing
- Modal Overlays fuer tiefe UIs
