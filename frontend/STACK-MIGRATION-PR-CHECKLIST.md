# Stack Migration PR Checklist

## Umfang

Dieser PR bereitet den neuen Frontend Stack vor.

Er ersetzt nicht:

```text
docs/index.html
```

Er ergaenzt:

```text
Vite React Stack Basis
Tailwind Token System
shadcn/ui Vorbereitung
Komponenten Bibliothek
13 Page Slots
Stack Preview Build
Performance Budget
Accessibility Guardrails
Migrationsstrategie
Testplan
```

## Review Punkte

```text
package.json Dependencies pruefen
Tailwind und Token Setup pruefen
Stack Preview Route pruefen
Komponenten API pruefen
Routing Slots pruefen
Performance Budget pruefen
Accessibility Dokumentation pruefen
Migration Gate pruefen
```

## Lokale Commands

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

## Manuelle Pruefung

```text
http://127.0.0.1:5173/?stackPreview=1
```

## Nicht im PR enthalten

```text
Command Palette
Wireframe Mode
Echte Backend Daten
KI Sidebar Produktionsflow
Ablösung von docs/index.html
```

## Merge Bedingung

Der PR darf erst gemerged werden, wenn lokale Pruefung oder CI bestaetigt, dass Typecheck, Tests und Build laufen.
