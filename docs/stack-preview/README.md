# JARVIS Stack Preview

Dieser Ordner ist fuer den parallelen Preview Build des neuen Frontend Stacks reserviert.

## Wichtig

`docs/index.html` bleibt der stabile bestehende GitHub Pages Einstieg.

Der neue Stack wird erst hier abgelegt:

```text
docs/stack-preview/
```

## Build

```powershell
cd frontend
npm install
npm run build:stack-preview
```

## Zweck

Der Preview Build erlaubt Vergleich und Test, ohne den alten Single File Dashboard Stand zu ersetzen.
