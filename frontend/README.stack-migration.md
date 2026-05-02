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
Storybook fuer isolierte Komponentenentwicklung
TanStack Router vorbereitet
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

## Aufgabe 5.4 Stand

Erledigt:

```text
frontend/src/components/dashboard/HotkeyBadge.tsx       Tastatur Shortcut Anzeige
frontend/src/components/dashboard/LogList.tsx           Audit und System Log Liste
frontend/src/components/dashboard/SparkLine.tsx         kleine Datenlinie ohne Deko Effekt
frontend/src/components/dashboard/LogList.test.tsx      LogList Test
frontend/src/components/dashboard/HotkeyBadge.test.tsx  HotkeyBadge Test
frontend/src/components/dashboard/MetricCard.stories.tsx Storybook Story
frontend/src/components/dashboard/LogList.stories.tsx   Storybook Story
frontend/.storybook/main.ts                             Storybook Vite Konfiguration
frontend/.storybook/preview.ts                          Storybook Token Preview
frontend/src/components/dashboard/StackMigrationPreview.tsx zeigt die neuen Komponenten
```

## Aufgabe 5.5 Stand

Erledigt:

```text
frontend/package.json                         TanStack Router Dependency vorbereitet
frontend/src/routes/pageRegistry.ts           13 Page Slots mit Gruppen und Pfaden
frontend/src/routes/StackPagePlaceholder.tsx  generischer Page Slot mit Contract Anzeige
frontend/src/routes/StackRouterApp.tsx        Stack Navigation und Page Slot Rendering
frontend/src/routes/pageRegistry.test.ts      Tests fuer 13 Slots, eindeutige IDs und Pfade
frontend/src/components/dashboard/StackMigrationPreview.tsx nutzt jetzt die Router App
```

## Aufgabe 5.6 Stand

Erledigt:

```text
frontend/package.json                         Build Scripts fuer stack preview
.github/workflows/frontend-stack-preview.yml  CI Workflow fuer Preview Build als Artefakt
docs/stack-preview/README.md                  Preview Deployment Hinweis
docs/stack-preview/DEPLOYMENT-GUARD.md        Schutzregel gegen versehentliches Ersetzen von docs/index.html
```

## Aufgabe 5.7 Stand

Erledigt:

```text
frontend/performance-budget.json              konkrete Grenzwerte fuer JS, CSS, Assets und Lighthouse
frontend/scripts/check-performance-budget.mjs Budget Check fuer docs/stack-preview
frontend/package.json                         budget:stack-preview Script
.github/workflows/frontend-stack-preview.yml  CI Budget Check nach Preview Build
frontend/PERFORMANCE.md                       Performance Regeln und Freigabekriterien
```

## Aufgabe 5.8 Stand

Erledigt:

```text
frontend/ACCESSIBILITY.md                         Accessibility Guardrails fuer Tastatur, Semantik, Motion und Kontrast
frontend/scripts/check-accessibility-checklist.mjs Check fuer Pflichtpunkte der Accessibility Dokumentation
frontend/package.json                             a11y:checklist Script
frontend/src/hooks/useReducedMotion.test.tsx      Tests fuer Reduced Motion Hook
frontend/src/routes/StackRouterApp.test.tsx       Test fuer beschriftete Stack Navigation
```

Hinweis:

```text
Der Workflow Eintrag fuer a11y:checklist wurde vom Connector blockiert.
Der lokale Script Einstieg ist vorhanden und kann spaeter manuell in CI nachgezogen werden.
```

## Aufgabe 5.9 Stand

Erledigt:

```text
frontend/MIGRATION-STRATEGY.md             Phasenplan 1 bis 4 mit Freigaben und Fallback Plan
frontend/migration-checklist.json          maschinenlesbare Freigabe Checkliste
frontend/scripts/check-migration-gate.mjs  Gate gegen versehentliches Ersetzen von docs/index.html
frontend/package.json                      migration:gate Script
```

Lokaler Preview Start:

```text
http://127.0.0.1:5173/?stackPreview=1
```

Stack Preview Build:

```powershell
cd frontend
npm run build:stack-preview
npm run budget:stack-preview
npm run migration:gate
```

Storybook Start:

```powershell
cd frontend
npm run storybook
```

## Lokale Pruefung

```powershell
cd frontend
npm install
npm run a11y:checklist
npm run migration:gate
npm run typecheck
npm run test
npm run build
npm run build:stack-preview
npm run budget:stack-preview
npm run build-storybook
```

## Naechster Schritt

Aufgabe 5.10 schliesst Block 5 mit Testplan, PR Vorbereitung und einer ehrlichen Liste offener lokaler Pruefungen ab.
