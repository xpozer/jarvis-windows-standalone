# Stack Migration Testplan

Dieser Testplan schliesst Block 5 ab und legt fest, was lokal und in CI geprueft werden muss.

## Lokale Pflichtpruefung

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

## Manuelle Sichtpruefung

```text
http://127.0.0.1:5173/?stackPreview=1
```

Pruefen:

```text
Navigation zeigt 13 Page Slots
Page Wechsel funktioniert per Klick
Focus Ring ist sichtbar
Preview wirkt ruhig und klar
Keine alte docs/index.html wurde ersetzt
Reduced Motion bleibt respektiert
```

## Storybook Pruefung

```powershell
cd frontend
npm run storybook
```

Pruefen:

```text
MetricCard Story laedt
LogList Story laedt
Komponenten bleiben lesbar auf dunklem Hintergrund
```

## CI Erwartung

Workflow:

```text
.github/workflows/frontend-stack-preview.yml
```

Erwartet:

```text
npm install
npm run typecheck
npm run test
npm run build:stack-preview
npm run budget:stack-preview
Artefakt jarvis-stack-preview
```

## Bekannte Einschraenkungen

```text
Der Branch wurde nicht lokal in dieser Umgebung gebaut.
Es gibt aktuell kein frontend/package-lock.json.
Der Workflow nutzt deshalb npm install statt npm ci.
Der a11y Checklist Schritt ist lokal vorbereitet, aber noch nicht im Workflow verdrahtet.
Der neue Stack ist Preview und ersetzt docs/index.html nicht.
```

## Abbruchkriterien

Nicht mergen, wenn:

```text
Typecheck rot
Tests rot
Build rot
Budget rot
Stack Preview zeigt leere Seite
docs/index.html wurde versehentlich geaendert
```

## Freigabe fuer naechsten Block

Block 1 Command Palette kann starten, wenn:

```text
Stack Preview lokal startet
Tests gruen sind
Router Slots sichtbar sind
```
