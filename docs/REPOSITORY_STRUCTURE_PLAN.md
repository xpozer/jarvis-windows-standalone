# Repository Struktur und Migrationsplan

Dieses Dokument beschreibt eine saubere Zielstruktur für JARVIS Windows Standalone und einen sicheren Migrationsplan für Batch und PowerShell Skripte.

Die GitHub Suche über den Connector hat aktuell keine `.bat` oder `.ps1` Dateien zurückgegeben. Der Plan ist deshalb bewusst als Migrationsplan mit Suchmustern formuliert. Vor einer echten Verschiebung müssen die Dateien lokal oder über GitHub vollständig gelistet werden.

## Zielstruktur

```text
jarvis-windows-standalone/
  backend/
    jarvis/
      api/
      agents/
      workagent/
      diagcenter/
      security/
      knowledge/
      voice/
    tests/
  frontend/
    src/
    public/
    tests/
  docs/
    index.html
    assets/
    architecture/
  config/
    examples/
  scripts/
    install/
    maintenance/
    dev/
    release/
  tools/
    audit/
    security/
  .github/
    workflows/
    ISSUE_TEMPLATE/
```

## Grundidee

| Bereich | Zweck |
|---|---|
| backend | Python Backend, FastAPI, Agenten, WorkAgent, DiagCenter |
| frontend | TypeScript UI und Dashboard Anwendung |
| docs | GitHub Pages, technische Dokumentation, Architektur |
| config | Beispielkonfigurationen ohne lokale Secrets |
| scripts/install | Installation und First Setup |
| scripts/maintenance | Update, Diagnose, Reparatur, Deinstallation |
| scripts/dev | Lokale Entwickler Hilfen |
| scripts/release | Build, Paketierung und ZIP Release |
| tools/audit | Audit und Log Hilfen |
| tools/security | Secret Scan, Allowlist Prüfung, Hash Verifikation |

## Migrationsregeln

| Aktueller Typ | Zielordner | Beispiel |
|---|---|---|
| Installer Batch | scripts/install/ | INSTALL_JARVIS.bat |
| Installer PowerShell | scripts/install/ | INSTALL_JARVIS.ps1 |
| First Setup | scripts/install/ | FIRST_SETUP.ps1 |
| Start Skripte | scripts/maintenance/ | START_JARVIS.bat |
| Update Skripte | scripts/maintenance/ | UPDATE_JARVIS.ps1 |
| Repair Skripte | scripts/maintenance/ | REPAIR_JARVIS.ps1 |
| Diagnose Skripte | scripts/maintenance/ | DIAGNOSE_JARVIS.ps1 |
| Clean Skripte | scripts/maintenance/ | CLEAN_JARVIS.ps1 |
| Build Skripte | scripts/release/ | BUILD_ZIP.ps1 |
| Release Skripte | scripts/release/ | RELEASE.ps1 |
| Entwickler Skripte | scripts/dev/ | DEV_START.ps1 |
| Test Helfer | scripts/dev/ | RUN_TESTS.bat |
| Security Scan | tools/security/ | SCAN_SECRETS.ps1 |
| Hash Prüfung | tools/security/ | VERIFY_HASH.ps1 |
| Audit Export | tools/audit/ | EXPORT_AUDIT.ps1 |

## Konkrete Mapping Tabelle

Diese Tabelle ist als Vorlage gedacht. Sobald die echte Dateiliste bestätigt ist, kann sie Datei für Datei abgehakt werden.

| Datei im Root | Neuer Pfad | Anpassung nötig |
|---|---|---|
| INSTALL_JARVIS.bat | scripts/install/INSTALL_JARVIS.bat | Pfade von `%~dp0` auf Repo Root prüfen |
| INSTALL_JARVIS.ps1 | scripts/install/INSTALL_JARVIS.ps1 | `$PSScriptRoot` an neuen Unterordner anpassen |
| FIRST_SETUP.ps1 | scripts/install/FIRST_SETUP.ps1 | Relative Pfade zu Backend, Frontend und Config prüfen |
| START_JARVIS.bat | scripts/maintenance/START_JARVIS.bat | Backend und Frontend Startpfade prüfen |
| START_JARVIS.ps1 | scripts/maintenance/START_JARVIS.ps1 | Working Directory explizit setzen |
| UPDATE_JARVIS.bat | scripts/maintenance/UPDATE_JARVIS.bat | Git Pull und Build Pfade prüfen |
| UPDATE_JARVIS.ps1 | scripts/maintenance/UPDATE_JARVIS.ps1 | Pfade zu Python, Node und Config prüfen |
| REPAIR_JARVIS.bat | scripts/maintenance/REPAIR_JARVIS.bat | Log und Temp Pfade prüfen |
| REPAIR_JARVIS.ps1 | scripts/maintenance/REPAIR_JARVIS.ps1 | Admin Check und Execution Policy prüfen |
| UNINSTALL_JARVIS.bat | scripts/maintenance/UNINSTALL_JARVIS.bat | Datenlöschung nur mit Rückfrage |
| UNINSTALL_JARVIS.ps1 | scripts/maintenance/UNINSTALL_JARVIS.ps1 | Schutz für config, logs, audit, knowledge_index |
| DIAGNOSE_JARVIS.ps1 | scripts/maintenance/DIAGNOSE_JARVIS.ps1 | Ausgabe in logs/diagnostics schreiben |
| BUILD_JARVIS_ZIP.ps1 | scripts/release/BUILD_JARVIS_ZIP.ps1 | ZIP Pfade und Artefaktname prüfen |
| RELEASE_JARVIS.ps1 | scripts/release/RELEASE_JARVIS.ps1 | Tag Format B*.* und vB*.* prüfen |
| DEV_START_BACKEND.ps1 | scripts/dev/DEV_START_BACKEND.ps1 | Virtuelle Umgebung prüfen |
| DEV_START_FRONTEND.ps1 | scripts/dev/DEV_START_FRONTEND.ps1 | frontend Ordner prüfen |
| RUN_TESTS.ps1 | scripts/dev/RUN_TESTS.ps1 | pytest und npm test kombinieren |
| SCAN_SECRETS.ps1 | tools/security/SCAN_SECRETS.ps1 | Git History Scan dokumentieren |
| VERIFY_DOWNLOAD_HASH.ps1 | tools/security/VERIFY_DOWNLOAD_HASH.ps1 | SHA256 Vergleich zentralisieren |

## Suchmuster vor der Migration

Nutze lokal diese Befehle, um echte Dateien zu erfassen:

```powershell
Get-ChildItem -Path . -File -Filter *.bat | Select-Object Name, FullName
Get-ChildItem -Path . -File -Filter *.ps1 | Select-Object Name, FullName
Get-ChildItem -Path . -Recurse -File -Include *.bat,*.ps1 | Select-Object FullName
```

Git Bash Alternative:

```bash
find . -maxdepth 2 -type f \( -name "*.bat" -o -name "*.ps1" \) | sort
```

## Relative Pfade prüfen

Nach dem Verschieben müssen diese Muster geprüft werden:

```text
%~dp0
%CD%
.\
..\
$PSScriptRoot
Get-Location
Set-Location
Start-Process
python
py -3
npm
node
frontend\
backend\
config\
logs\
```

## Robuster PowerShell Pfad Ansatz

```powershell
# Skript liegt künftig unter scripts/install oder scripts/maintenance
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..\..")
Set-Location $RepoRoot
```

## Robuster Batch Pfad Ansatz

```bat
@echo off
set "SCRIPT_DIR=%~dp0"
pushd "%SCRIPT_DIR%..\.."
rem Ab hier liegt das Arbeitsverzeichnis im Repo Root
popd
```

## Migrationsablauf

| Schritt | Aktion |
|---|---|
| 1 | Vollständige Liste aller `.bat` und `.ps1` Dateien erstellen |
| 2 | Jede Datei einer Kategorie zuordnen |
| 3 | Zielordner anlegen |
| 4 | Dateien verschieben, aber noch nicht inhaltlich umbauen |
| 5 | Relative Pfade in jeder Datei prüfen |
| 6 | Installer lokal auf frischem Windows Profil testen |
| 7 | Diagnose Skript ausführen |
| 8 | README Installationspfade aktualisieren |
| 9 | CHANGELOG Eintrag ergänzen |
| 10 | Release ZIP erzeugen und testen |

## Risiken

| Risiko | Gegenmaßnahme |
|---|---|
| Installer findet Dateien nicht mehr | `$RepoRoot` und `%~dp0..\..` konsequent nutzen |
| Start Skripte starten im falschen Ordner | `Set-Location` oder `pushd` am Anfang setzen |
| ZIP Build vergisst neue Ordner | Release Skript nach Migration anpassen |
| Logs landen im Script Ordner | Log Pfad immer relativ zum Repo Root setzen |
| Nutzer startet alte Root Skripte | Kleine Root Wrapper behalten oder README klar ändern |

## Empfehlung

Für Endanwenderfreundlichkeit sollten im Root maximal diese Wrapper bleiben:

```text
INSTALL_JARVIS.bat
START_JARVIS.bat
README.md
LICENSE
```

Diese Wrapper rufen dann nur noch die echten Skripte unter `scripts/` auf. Dadurch bleibt der Start einfach, während das Repository sauber strukturiert ist.
