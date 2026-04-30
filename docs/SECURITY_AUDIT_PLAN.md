# Sicherheits Audit Plan

Dieses Dokument beschreibt den Sicherheits Audit für JARVIS Windows Standalone.

Ziel ist ein lokales, nachvollziehbares und wartbares Sicherheitsniveau. JARVIS soll keine Telemetrie nach außen senden. Lokale Daten wie Logs, Auditdaten, Knowledge Index und Konfigurationen bleiben auf dem Gerät.

## Ziele

| Ziel | Beschreibung |
|---|---|
| Secrets finden | Prüfen, ob Tokens, Keys, Passwörter oder Zertifikate versehentlich committed wurden |
| Git History prüfen | Auch alte Commits müssen geprüft werden, nicht nur der aktuelle Stand |
| Downloads absichern | Installer Downloads sollen SHA256 geprüft werden |
| Lokale Daten schützen | Logs, Audit und Knowledge Index dürfen nicht versehentlich im Repo landen |
| RiskLevel prüfen | ToolRegistry und AgentRegistry sollen riskante Aktionen klar markieren |
| Windows Allowlist prüfen | Lokale Systemaktionen müssen begrenzt und nachvollziehbar bleiben |

## Sofortprüfung im aktuellen Arbeitsbaum

```powershell
# Prüft typische Secret Muster im aktuellen Stand
python -m pip install detect-secrets==1.5.0

detect-secrets scan --all-files > .secrets.baseline

detect-secrets audit .secrets.baseline
```

Alternative mit Git Secrets:

```powershell
# Git Secrets installieren und Repo prüfen
git secrets --install
git secrets --register-aws
git secrets --scan
```

## Git History nach Secrets durchsuchen

Für die Historie eignet sich Gitleaks.

```powershell
# Beispiel mit lokal installierter gitleaks.exe
gitleaks detect --source . --verbose --redact
```

Empfohlene Prüfung vor Releases:

```powershell
gitleaks detect --source . --report-format json --report-path gitleaks-report.json --redact
```

Die Datei `gitleaks-report.json` darf nicht committed werden.

## BFG Repo Cleaner bei echten Funden

Wenn ein echtes Secret bereits in der Git History gelandet ist, reicht Löschen im aktuellen Commit nicht aus. Dann muss das Secret zuerst beim Anbieter widerrufen werden. Danach kann die History bereinigt werden.

### Vorbereitung

```powershell
# Mirror Clone erstellen
git clone --mirror https://github.com/xpozer/jarvis-windows-standalone.git jarvis-windows-standalone.git
cd jarvis-windows-standalone.git
```

### Datei mit Secrets entfernen

```powershell
# Beispiel: .env aus kompletter Historie entfernen
java -jar bfg.jar --delete-files .env
```

### Bestimmte Secret Werte ersetzen

Erstelle lokal eine Datei `secrets.txt`:

```text
MEIN_ALTES_SECRET==>REMOVED_SECRET
```

Dann ausführen:

```powershell
java -jar bfg.jar --replace-text secrets.txt
```

### Repository bereinigen

```powershell
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

Wichtig: Nach einem Force Push müssen alle lokalen Klone neu geklont oder hart zurückgesetzt werden.

## Dateien, die nie ins Repo gehören

```text
.env
.env.*
*.local.json
*.secret.json
*.key
*.pem
*.pfx
*.crt
*.token
logs/
audit/
knowledge_index/
local_data/
runtime/
cache/
```

## SHA256 Prüfung in Installer Skripten

Downloads im Installer müssen gegen bekannte Hashes geprüft werden.

### PowerShell Beispiel

```powershell
function Invoke-VerifiedDownload {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Url,

        [Parameter(Mandatory = $true)]
        [string]$DestinationPath,

        [Parameter(Mandatory = $true)]
        [string]$ExpectedSha256
    )

    Write-Host "Lade Datei herunter: $Url"
    Invoke-WebRequest -Uri $Url -OutFile $DestinationPath

    $ActualSha256 = (Get-FileHash -Algorithm SHA256 -Path $DestinationPath).Hash.ToLowerInvariant()
    $Expected = $ExpectedSha256.ToLowerInvariant()

    if ($ActualSha256 -ne $Expected) {
        Remove-Item -Path $DestinationPath -Force -ErrorAction SilentlyContinue
        throw "SHA256 Prüfung fehlgeschlagen. Erwartet: $ExpectedSha256, erhalten: $ActualSha256"
    }

    Write-Host "SHA256 Prüfung erfolgreich: $ActualSha256"
}

Invoke-VerifiedDownload `
    -Url "https://example.com/tool.zip" `
    -DestinationPath "$env:TEMP\tool.zip" `
    -ExpectedSha256 "PUT_EXPECTED_SHA256_HERE"
```

## Zentrale Hash Datei

Empfohlen ist eine zentrale Datei für erlaubte Downloads:

```json
{
  "downloads": [
    {
      "name": "piper",
      "url": "https://example.com/piper.zip",
      "sha256": "PUT_EXPECTED_SHA256_HERE"
    }
  ]
}
```

Möglicher Pfad:

```text
config/examples/downloads.allowlist.json
```

## Audit Checkliste vor Release

```text
[ ] gitleaks detect ausgeführt
[ ] detect-secrets scan ausgeführt
[ ] .gitignore geprüft
[ ] Keine .env Dateien committed
[ ] Keine Tokens oder Zertifikate committed
[ ] Installer Downloads haben SHA256 Prüfung
[ ] Voice Modul startet mit Mikrofon aus
[ ] ToolRegistry enthält RiskLevel
[ ] Windows Allowlist geprüft
[ ] Release ZIP enthält keine lokalen Logs
[ ] Release ZIP enthält keinen Knowledge Index
```

## CI Integration Vorschlag

Später kann ein Security Job in `.github/workflows/ci.yml` ergänzt werden:

```yaml
security-scan:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: gitleaks/gitleaks-action@v2
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Umgang mit Findings

| Fall | Reaktion |
|---|---|
| False Positive | In Baseline dokumentieren und begründen |
| Echtes Secret im aktuellen Commit | Secret widerrufen, Datei entfernen, neuen Commit erstellen |
| Echtes Secret in History | Secret widerrufen, BFG oder git filter repo nutzen, Force Push planen |
| Lokale Kundendaten | Sofort entfernen, History prüfen, Zugriff begrenzen |
| Installer Download ohne Hash | Release blockieren, Hash ergänzen |
