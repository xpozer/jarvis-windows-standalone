# Deployment Guard

Diese Datei dokumentiert die Schutzregel fuer die Stack Migration.

## Regel

Der neue Frontend Stack darf `docs/index.html` nicht automatisch ersetzen.

## Erlaubt

```text
docs/stack-preview/
```

## Nicht erlaubt ohne bewusste Freigabe

```text
docs/index.html
```

## Warum

Der bestehende Single File Stand bleibt der stabile Fallback. Der neue Stack wird erst nach lokalem Test, CI Build und visueller Pruefung zum Hauptdashboard.
