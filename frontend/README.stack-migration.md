# Frontend Stack Migration

Dieser Branch startet die Migration des JARVIS Frontends auf einen skalierbaren 2026 Stack.

## Entscheidung

```text
Vite plus React
TypeScript
Tailwind Token Basis
shadcn/ui Vorbereitung
Radix primitives
Lucide Icons
TanStack Query
Zustand
Vitest plus Testing Library
```

## Grundsatz

`docs/index.html` bleibt unangetastet, bis der neue Stack stabil ist.

## Aufgabe 5.1 Stand

Erledigt:

```text
package.json Dependencies erweitert
Tailwind Konfiguration angelegt
PostCSS Konfiguration angelegt
shadcn components.json angelegt
TypeScript Alias @ vorbereitet
Vite Alias und Vitest Setup vorbereitet
Theme Token CSS angelegt
Inter Tight und JetBrains Mono lokal geladen
cn Utility plus Test angelegt
```

## Lokale Pruefung

```powershell
cd frontend
npm install
npm run typecheck
npm run test
npm run build
```

## Naechster Schritt

Aufgabe 5.2 legt die neue Projektstruktur fuer Komponenten, Sidebar, API, Hooks und Themes an.
