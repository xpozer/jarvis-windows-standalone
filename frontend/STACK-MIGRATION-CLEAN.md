# Stack Migration Clean

Dieser Branch ersetzt den zu breiten Draft PR 43 durch einen kleineren, mergefaehigeren Einstieg.

## Ziel

Der neue Frontend Stack wird vorbereitet, ohne `docs/index.html` zu ersetzen.

## Enthalten

```text
package.json Stack Dependencies und Scripts
Tailwind und PostCSS Grundkonfiguration
shadcn components.json
Theme Tokens
React Query Provider
Zustand Store
Dashboard Basis Komponenten
StackMigrationPreview ueber ?stackPreview=1
Vite Alias und Vitest Setup
```

## Bewusst nicht enthalten

```text
Command Palette
Command Sources
KI Sidebar Produktionsflow
Route Registry mit 13 produktiven Pages
Ablösung von docs/index.html
```

## Lokaler Test

```powershell
cd frontend
npm install
npm run typecheck
npm run test
npm run build
```

Preview:

```text
http://127.0.0.1:5173/?stackPreview=1
```

## Warum kleiner

Der alte PR 43 war nicht mergeable und enthielt versehentlich bereits Command Palette Dateien. Dieser Branch ist kleiner und bleibt klar bei Block 5 Grundstack.
