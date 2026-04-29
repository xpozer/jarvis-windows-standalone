# Mitwirken an JARVIS Windows Standalone

Danke, dass du am Projekt mitarbeitest. Dieses Dokument beschreibt den sauberen Entwicklungsablauf für JARVIS.

## Branch Strategie

| Branch | Zweck |
|---|---|
| main | Stabiler Stand. Nur geprüfte Änderungen und Releases. |
| develop | Integrationsbranch für kommende Versionen. |
| feature/* | Neue Funktionen, kleinere Umbauten und isolierte Änderungen. |
| fix/* | Fehlerbehebungen. |
| docs/* | Dokumentationsänderungen. |
| chore/* | Wartung, Struktur, Build und Tooling. |

Empfohlener Ablauf:

```powershell
git checkout develop
git pull
git checkout -b feature/mein-thema
```

Nach der Änderung:

```powershell
git status
git add .
git commit -m "feat: add local diagnostics view"
git push origin feature/mein-thema
```

## Commit Message Konvention

Bitte nutze Conventional Commits.

| Typ | Verwendung |
|---|---|
| feat | Neue Funktion |
| fix | Fehlerbehebung |
| docs | Dokumentation |
| refactor | Umbau ohne Funktionsänderung |
| test | Tests |
| chore | Wartung, Build, Hilfsdateien |
| ci | GitHub Actions und Automatisierung |
| security | Sicherheitsrelevante Änderung |

Beispiele:

```text
feat: add work agent registry
fix: repair windows installer path detection
docs: expand README setup section
chore: reorganize maintenance scripts
security: add local allowlist validation
```

## Lokal entwickeln

### Backend vorbereiten

```powershell
py -3.11 -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
pip install -e .[dev]
```

### Frontend vorbereiten

```powershell
cd frontend
npm install
npm run dev
```

### Dashboard prüfen

```text
docs/index.html
```

Die Datei kann lokal im Browser geöffnet werden.

## Lokal testen

### Python Lint

```powershell
ruff check .
black --check .
```

### Python Tests

```powershell
pytest --cov=jarvis --cov-report=term-missing
```

### Frontend Tests und Build

```powershell
cd frontend
npm run lint
npm test
npm run build
```

## Pull Request Hinweise

Ein Pull Request sollte enthalten:

| Punkt | Erwartung |
|---|---|
| Beschreibung | Was wurde geändert und warum |
| Tests | Welche Tests wurden ausgeführt |
| Risiko | Welche Bereiche könnten betroffen sein |
| Screenshots | Bei UI Änderungen, wenn sinnvoll |
| Changelog | Eintrag, wenn Nutzerverhalten betroffen ist |
| Dokumentation | README oder passende Doku aktualisiert |

Bitte erstelle Pull Requests gegen `develop`, außer es handelt sich um einen Hotfix für `main`.

## Pull Request Checkliste

Vor dem Erstellen prüfen:

```text
[ ] Änderung ist auf einen klaren Zweck begrenzt
[ ] Lokale Tests wurden ausgeführt
[ ] Frontend Build wurde geprüft, falls UI betroffen ist
[ ] README oder Doku wurde aktualisiert, falls nötig
[ ] CHANGELOG wurde aktualisiert, falls Nutzerverhalten betroffen ist
[ ] Keine Secrets, Tokens oder lokalen Pfade wurden committed
[ ] Voice Modul bleibt standardmäßig mit Mikrofon aus
```

## Datenschutz und lokale Daten

JARVIS ist als lokales Tool geplant. Bitte achte darauf, dass keine privaten Daten, Kundendaten, Logdateien, Secrets oder lokalen Pfade in Git landen.

Nicht committen:

```text
.env
*.local.json
logs/
audit/
knowledge_index/
*.log
```

## Coding Grundsätze

| Bereich | Regel |
|---|---|
| Backend | Kleine Funktionen, klare Fehlerbehandlung, strukturierte Logs |
| Frontend | Komponenten sauber trennen, API Typen nicht doppelt pflegen |
| Installer | Windows Pfade robust behandeln, Execution Policy beachten |
| Security | RiskLevel und Allowlist nicht umgehen |
| Voice | Push to Talk als Standard, Wake Word nur optional |
| Tests | Neue Logik braucht passende Tests |
