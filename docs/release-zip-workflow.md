# Release ZIP Workflow

Der Release Workflow baut ein sauberes ZIP fuer GitHub Releases.

## Lokal testen

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\maintenance\build-release-zip.ps1 -TagName "B6.6.local" -SkipFrontendBuild
```

Ohne `-SkipFrontendBuild` installiert das Skript Frontend Dependencies und baut `frontend/dist` neu.

## GitHub Release

Ein Release wird durch einen Git Tag gestartet:

```powershell
git tag B6.6.26
git push origin B6.6.26
```

Der Workflow erzeugt:

```text
release/jarvis-windows-standalone-<tag>.zip
release/jarvis-windows-standalone-<tag>.zip.sha256.txt
release/release-manifest-<tag>.json
```

## Paketinhalt

Das ZIP nutzt getrackte Repository Dateien plus den gebauten Frontend Ordner `frontend/dist`.

Bewusst ausgeschlossen:

```text
.git
.github
node_modules
.venv
logs
audit
data
runtime
cache
local_data
knowledge_index
release
artifacts
.env
config/lifeos.json
```

Die Laufzeitordner `data`, `runtime`, `cache`, `logs`, `backups`, `exports` und `updates` werden nur auf Root-Ebene ausgeschlossen. Quellcodeordner wie `frontend/src/features/runtime` bleiben im Paket.

Dadurch landen lokale Laufzeitdaten, private LifeOS Daten und installierte Dependencies nicht im Release Paket.
