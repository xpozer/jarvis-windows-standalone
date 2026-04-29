# Rollout Guide

Dieser Leitfaden beschreibt den sicheren Rollout von Repository Verbesserungen für JARVIS Windows Standalone.

Projekt: JARVIS Windows Standalone  
Version: B6.5.1  
Plattform: Windows 10 und Windows 11  
Werkzeuge: Git Bash, GitHub Desktop, VS Code, GitHub Actions

## Grundregel

Arbeite riskante Änderungen immer in eigenen Branches. Merge erst nach lokalem Test und grünem Pull Request.

## Phase 1: Pre Flight Checks

### 1.1 Repo Hygiene prüfen

Was zu tun ist:

```bash
cd /c/Users/DEIN_NAME/PFAD/ZU/jarvis-windows-standalone
```

Prüfen, ob das richtige Remote gesetzt ist:

```bash
git remote -v
```

Erwartetes Ergebnis:

```text
origin  https://github.com/xpozer/jarvis-windows-standalone.git
```

Prüfen, ob sensible Dateien ignoriert werden:

```bash
grep -nE '^\.env|^\.env\.\*|^\*\.local\.json|^\*\.secret\.json' .gitignore
```

Prüfen, ob sensible Dateien bereits getrackt werden:

```bash
git ls-files | grep -Ei '(^|/)(\.env|.*\.local\.json|.*\.secret\.json|.*\.key|.*\.pem|.*\.pfx|.*\.crt|.*\.token)$'
```

Erwartetes Ergebnis: keine Ausgabe.

Wenn Dateien angezeigt werden:

```bash
git rm --cached PFAD/ZUR/DATEI
```

History grob nach Secrets durchsuchen:

```bash
git grep -I -n -E "(password|passwd|secret|token|apikey|api_key|client_secret|private_key|BEGIN RSA PRIVATE KEY|BEGIN OPENSSH PRIVATE KEY)" $(git rev-list --all)
```

Gezielt nach Secret Dateien in der History suchen:

```bash
git log --all --name-only --pretty=format: | sort -u | grep -Ei '(^|/)(\.env|.*\.local\.json|.*\.secret\.json|.*\.key|.*\.pem|.*\.pfx|.*\.crt|.*\.token)$'
```

Wenn Treffer erscheinen, nicht pushen. Erst Phase 1.2 nutzen.

### 1.2 BFG Repo Cleaner bei gefundenen Secrets

Wichtig: Zuerst das Secret beim Anbieter widerrufen. Danach die Git History bereinigen.

Mirror Clone erstellen:

```bash
git clone --mirror https://github.com/xpozer/jarvis-windows-standalone.git jarvis-windows-standalone.git
cd jarvis-windows-standalone.git
```

Einzelne Datei aus der gesamten Historie entfernen:

```bash
java -jar bfg.jar --delete-files .env
```

Bestimmten Secret Wert ersetzen:

```text
MEIN_ALTES_SECRET==>REMOVED_SECRET
```

Dann ausführen:

```bash
java -jar bfg.jar --replace-text secrets.txt
```

Repository bereinigen:

```bash
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

Wenn es nicht klappt:

Prüfe, ob Java installiert ist:

```bash
java -version
```

Prüfe, ob du im Mirror Repository bist:

```bash
git rev-parse --is-bare-repository
```

Erwartet wird:

```text
true
```

### 1.3 Lokales Backup anlegen

Im Ordner über dem Repository:

```bash
cd ..
cp -r jarvis-windows-standalone jarvis-windows-standalone-backup-$(date +%Y%m%d-%H%M%S)
```

Windows Explorer Alternative:

```text
Repo Ordner kopieren
Kopie umbenennen in jarvis-windows-standalone-backup-DATUM
```

Erwartetes Ergebnis: Eine vollständige lokale Kopie des Repos.

### 1.4 Main aktualisieren und lokale Änderungen prüfen

```bash
git checkout main
git pull origin main
git status
```

Erwartetes Ergebnis:

```text
nothing to commit, working tree clean
```

Wenn lokale Änderungen angezeigt werden:

```bash
git status --short
```

Dann entscheiden:

```bash
# Änderungen behalten
git add .
git commit -m "chore: save local work"

# Änderungen verwerfen
git restore .
```

## Phase 2: Doku und Config Files

### 2.1 Branch erstellen

```bash
git checkout main
git pull origin main
git checkout -b chore/repo-cleanup
```

### 2.2 Dateien committen

```bash
git add README.md LICENSE CONTRIBUTING.md SECURITY.md CHANGELOG.md .gitignore pyproject.toml .github/dependabot.yml .github/ISSUE_TEMPLATE .github/PULL_REQUEST_TEMPLATE.md

git commit -m "chore: add repository documentation and configuration"
```

### 2.3 Push und Pull Request

```bash
git push origin chore/repo-cleanup
```

Click Pfad:

```text
GitHub Repository öffnen
Pull requests
New pull request
base: main
compare: chore/repo-cleanup
Create pull request
```

### 2.4 Nach Merge main aktualisieren

```bash
git checkout main
git pull origin main
```

Rollback:

```bash
git revert COMMIT_SHA
```

## Phase 3: Screenshot fürs README

### 3.1 Dashboard lokal öffnen

```bash
explorer.exe docs\\index.html
```

Oder im Browser:

```text
file:///C:/PFAD/ZU/jarvis-windows-standalone/docs/index.html
```

### 3.2 Screenshot speichern

Empfehlung: 1920 x 1080.

Speicherort:

```text
docs/screenshot.png
```

### 3.3 README anpassen

Platzhalter ersetzen durch:

```md
![JARVIS Dashboard](docs/screenshot.png)
```

### 3.4 Commit

```bash
git checkout -b docs/dashboard-screenshot
git add README.md docs/screenshot.png
git commit -m "docs: add dashboard screenshot"
git push origin docs/dashboard-screenshot
```

## Phase 4: Folder Structure Migration

Diese Phase ist riskant. Vor dem Merge Installer auf einer sauberen Windows Test VM oder in einem leeren Test Ordner prüfen.

Rollback:

```bash
git revert COMMIT_SHA
```

Oder Branch löschen, solange nicht gemerged wurde:

```bash
git branch -D chore/folder-structure
git push origin --delete chore/folder-structure
```

### 4.1 Branch erstellen

```bash
git checkout main
git pull origin main
git checkout -b chore/folder-structure
```

### 4.2 Ordner anlegen

```bash
mkdir -p scripts/install scripts/maintenance scripts/dev scripts/release tools/security tools/audit
```

### 4.3 Dateien verschieben

Mapping:

| Datei | Ziel |
|---|---|
| INSTALL_JARVIS.ps1 | scripts/install/INSTALL_JARVIS.ps1 |
| FIRST_SETUP.ps1 | scripts/install/FIRST_SETUP.ps1 |
| START_JARVIS.ps1 | scripts/maintenance/START_JARVIS.ps1 |
| UPDATE_JARVIS.ps1 | scripts/maintenance/UPDATE_JARVIS.ps1 |
| REPAIR_JARVIS.ps1 | scripts/maintenance/REPAIR_JARVIS.ps1 |
| DIAGNOSE_JARVIS.ps1 | scripts/maintenance/DIAGNOSE_JARVIS.ps1 |
| RUN_TESTS.ps1 | scripts/dev/RUN_TESTS.ps1 |
| BUILD_JARVIS_ZIP.ps1 | scripts/release/BUILD_JARVIS_ZIP.ps1 |

Beispiel:

```bash
git mv INSTALL_JARVIS.ps1 scripts/install/INSTALL_JARVIS.ps1
```

### 4.4 Smoke Test nach jedem Move

PowerShell Skript Syntax prüfen:

```bash
powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts/install/INSTALL_JARVIS.ps1 -WhatIf
```

Falls kein WhatIf unterstützt wird:

```bash
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Get-Content 'scripts/install/INSTALL_JARVIS.ps1' | Out-Null"
```

Batch Datei prüfen:

```bash
cmd.exe /c scripts\\maintenance\\START_JARVIS.bat
```

Wenn es nicht klappt:

Pfade im Skript prüfen und noch nicht committen.

### 4.5 Relative Pfade suchen

```bash
grep -RInE "(\.\\|\.\./|\.\.\\|%~dp0|%CD%|\$PSScriptRoot|frontend\\|backend\\|config\\|logs\\|python|py -3|npm|node)" scripts *.bat *.ps1 2>/dev/null
```

### 4.6 Verweise anpassen

Root Wrapper behalten:

```bat
@echo off
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\install\INSTALL_JARVIS.ps1"
```

PowerShell Repo Root robust setzen:

```powershell
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..\..")
Set-Location $RepoRoot
```

### 4.7 Push und PR

```bash
git add .
git commit -m "chore: reorganize scripts folder structure"
git push origin chore/folder-structure
```

Erst mergen, wenn die Installation in sauberer Umgebung läuft.

## Phase 5: CI/CD aktivieren

Rollback:

```bash
git revert COMMIT_SHA
```

### 5.1 Branch erstellen

```bash
git checkout main
git pull origin main
git checkout -b ci/github-actions
```

### 5.2 Workflows committen

```bash
git add .github/workflows/ci.yml .github/workflows/release.yml .github/workflows/dependabot-auto.yml
git commit -m "ci: add github actions workflows"
git push origin ci/github-actions
```

### 5.3 Actions prüfen

Click Pfad:

```text
GitHub Repository
Actions
Workflow auswählen
Run anklicken
Job anklicken
Fehlerlog lesen
```

### 5.4 Typische Fehler

| Fehler | Ursache | Lösung |
|---|---|---|
| Module not found | Paket fehlt | pyproject oder package.json prüfen |
| No tests directory | Tests fehlen | Workflow defensiv halten oder Tests anlegen |
| Python version mismatch | Version nicht verfügbar | Matrix prüfen |
| npm ci fails | package-lock fehlt oder passt nicht | npm install ausführen und lockfile committen |
| Pfad nicht gefunden | Ordnerstruktur anders | Workflow Pfade anpassen |

### 5.5 PR mergen

Wenn alles grün ist:

```text
Pull request öffnen
Merge pull request
Confirm merge
```

### 5.6 Branch Protection aktivieren

Click Pfad:

```text
GitHub Repository
Settings
Branches
Add branch protection rule
Branch name pattern: main
Require a pull request before merging aktivieren
Require status checks to pass before merging aktivieren
CI Jobs auswählen
Require branches to be up to date before merging aktivieren
Create
```

## Phase 6: Repo Metadaten

### 6.1 Beschreibung setzen

Click Pfad:

```text
GitHub Repository
About Zahnrad
Description eintragen
Save changes
```

Vorschlag:

```text
Local first Windows standalone assistant for electrical work planning, diagnostics and workflow automation.
```

### 6.2 Topics setzen

```text
jarvis
windows
fastapi
typescript
powershell
local-first
assistant
diagnostics
```

### 6.3 GitHub Pages aktivieren

Click Pfad:

```text
Settings
Pages
Build and deployment
Source: Deploy from a branch
Branch: main
Folder: /docs
Save
```

### 6.4 Open Graph Image optional

Click Pfad:

```text
Settings
General
Social preview
Edit
Upload image
```

### 6.5 Test Release B6.5.2 taggen

```bash
git checkout main
git pull origin main
git tag B6.5.2
git push origin B6.5.2
```

Erwartung: Release Workflow startet automatisch.

Rollback Release:

```bash
git tag -d B6.5.2
git push origin --delete B6.5.2
```

GitHub Release löschen:

```text
GitHub Repository
Releases
B6.5.2 öffnen
Delete
```

## Phase 7: Architektur Migrationen

Jede Migration bekommt einen eigenen Branch.

### 7.1 AuditLog SQLite

```bash
git checkout main
git pull origin main
git checkout -b feature/auditlog-sqlite
```

Aufgaben:

```text
SQLite WAL Mode einführen
Migrationsskript für alte JSON Daten schreiben
Lesende Backwards Kompatibilität behalten
Tests ergänzen
```

### 7.2 Knowledge Chroma

```bash
git checkout -b feature/knowledge-chroma
```

Aufgaben:

```text
Chroma einführen
Reindex Skript schreiben
Performance Vergleich dokumentieren
```

### 7.3 Loguru Logging

```bash
git checkout -b feature/loguru-logging
```

Aufgaben:

```text
Zentrale Loguru Konfiguration
Rotierende Log Files
print Aufrufe ersetzen
```

### 7.4 OpenAPI

```bash
git checkout -b feature/openapi
```

Aufgaben:

```text
FastAPI OpenAPI Schema sauber exportieren
Frontend TypeScript Client generieren
CI Prüfung ergänzen
```

### 7.5 Mock Mode

```bash
git checkout -b feature/mock-mode
```

Aufgaben:

```text
SAP Mock Adapter
FSM Mock Adapter
Umschaltung per .env
Tests ohne echte Verbindung
```

### 7.6 Voice Porcupine

```bash
git checkout -b feature/voice-porcupine
```

Aufgaben:

```text
Porcupine optional integrieren
Push to Talk Default behalten
Datenschutz Hinweise ergänzen
README erweitern
```

## Phase 8: Aufräumen

### 8.1 Alte Branches löschen

Lokal:

```bash
git branch --merged main
git branch -d BRANCH_NAME
```

Remote:

```bash
git push origin --delete BRANCH_NAME
```

### 8.2 Tags prüfen

```bash
git tag --sort=-creatordate
```

Tag löschen:

```bash
git tag -d TAG_NAME
git push origin --delete TAG_NAME
```

### 8.3 Issues anlegen

Click Pfad:

```text
GitHub Repository
Issues
New issue
Feature request oder Bug report auswählen
```

Empfohlene Issues:

```text
AuditLog SQLite Migration
Knowledge Index Chroma Migration
Loguru Logging einführen
OpenAPI TypeScript Client generieren
SAP und FSM Mock Mode bauen
Optionales Porcupine Wake Word Modul
Installer Strukturmigration testen
```

### 8.4 Project Board optional

Click Pfad:

```text
GitHub Repository
Projects
New project
Board auswählen
Spalten anlegen: Backlog, Ready, In Progress, Review, Done
```

## Abschluss Checkliste

```text
[ ] README sichtbar und korrekt
[ ] LICENSE vorhanden
[ ] CONTRIBUTING vorhanden
[ ] SECURITY vorhanden
[ ] CHANGELOG vorhanden
[ ] .gitignore schützt lokale Daten
[ ] pyproject.toml vorhanden
[ ] Dependabot aktiv
[ ] Issue Templates aktiv
[ ] PR Template aktiv
[ ] CI Workflow läuft
[ ] Release Workflow läuft bei Tag
[ ] GitHub Pages aktiv
[ ] Main Branch geschützt
```
