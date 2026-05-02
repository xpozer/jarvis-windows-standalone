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

## Aufgabe 5.2 Stand

Erledigt:

```text
frontend/src/api/client.ts          typisierter API Client mit Timeout und Fehlerobjekt
frontend/src/api/queryClient.ts     TanStack Query Default Client
frontend/src/api/providers.tsx      AppProviders fuer React Query
frontend/src/store/useDashboardStore.ts  zentraler Dashboard State mit Zustand
frontend/src/components/ui/         shadcn kompatible UI Basisstruktur
frontend/src/components/dashboard/  Cockpit Komponentenstruktur
frontend/src/components/sidebar/    KI Sidebar Komponentenstruktur
frontend/src/hooks/                 Custom Hooks Struktur
frontend/src/hooks/useReducedMotion.ts  Reduced Motion Hook
frontend/src/themes/                Theme Struktur
```

## Aufgabe 5.3 Stand

Erledigt:

```text
frontend/src/components/dashboard/Panel.tsx                  wiederverwendbares Cockpit Panel
frontend/src/components/dashboard/StatusDot.tsx              Status Indicator fuer echte Daten
frontend/src/components/dashboard/MetricCard.tsx             Metrik Karte fuer Telemetrie
frontend/src/components/dashboard/DashboardShell.tsx         neues 4 Spalten Cockpit Layout
frontend/src/components/dashboard/StackMigrationPreview.tsx  sichere Preview ohne alte App zu ersetzen
frontend/src/components/dashboard/MetricCard.test.tsx        erster Komponenten Test
frontend/src/main.tsx                                        Preview per ?stackPreview=1 erreichbar
```

Lokaler Preview Start:

```text
http://127.0.0.1:5173/?stackPreview=1
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

Aufgabe 5.4 baut die Komponenten Bibliothek weiter aus: LogList, SparkLine, HotkeyBadge und erste Storybook Vorbereitung.
