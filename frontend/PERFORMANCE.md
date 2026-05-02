# Frontend Performance Budget

JARVIS soll sich wie ein Profi Werkzeug anfuehlen, nicht wie eine schwere Show Oberflaeche.

## Budget

Die Grenzwerte liegen in:

```text
frontend/performance-budget.json
```

Aktuelle Ziele:

```text
Initial JavaScript: 100 KB
Initial CSS: 40 KB
Total Assets: 750 KB
Time to Interactive: 2000 ms
Lighthouse Performance: 90+
Lighthouse Accessibility: 90+
Lighthouse Best Practices: 90+
```

## Lokaler Check

```powershell
cd frontend
npm run build:stack-preview
npm run budget:stack-preview
```

## CI Check

Der Workflow `.github/workflows/frontend-stack-preview.yml` fuehrt den Budget Check nach dem Preview Build aus.

## Regel

Wenn das Budget reisst, wird nicht automatisch mehr Animation oder mehr Framework Code akzeptiert.

Erst pruefen:

```text
1. Wurde eine Komponente unnoetig global importiert?
2. Kann die Funktion lazy geladen werden?
3. Ist die Animation wirklich funktional?
4. Respektiert der Code Reduced Motion?
5. Zeigt der Screen echte Daten oder nur Dekoration?
```

## GitHub Pages Schutz

Der neue Stack darf `docs/index.html` erst ersetzen, wenn:

```text
Typecheck gruen
Tests gruen
Stack Preview Build gruen
Budget Check gruen
Manuelle Sichtpruefung erledigt
Reduced Motion geprueft
```
