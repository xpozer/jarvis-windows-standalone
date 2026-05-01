# Backend Health Check

Der Backend Health Check stellt sicher, dass JARVIS nicht nur einen offenen Port hat, sondern dass der Backend Dienst wirklich antwortet.

## Endpunkt

```text
http://127.0.0.1:8000/health
```

## Startverhalten

`START_JARVIS.ps1` prüft jetzt nach dem Port Check zusätzlich den Health Endpunkt.

Vorher reichte:

```text
Port 8000 ist offen
```

Jetzt gilt erst als bereit:

```text
Port 8000 ist offen
/health antwortet erfolgreich
```

## Warum das wichtig ist

Ein offener Port allein bedeutet nicht sicher, dass das Backend vollständig gestartet ist. Es kann sein, dass ein Prozess hängt, eine falsche Anwendung auf dem Port läuft oder der Dienst noch nicht bereit ist.

Der Health Check reduziert diese Fälle.

## Verhalten bei Fehler

Wenn `/health` nicht sauber antwortet, bricht `START_JARVIS.ps1` mit einer klaren Fehlermeldung ab:

```text
Backend /health antwortet nicht sauber
```

Dann sollte geprüft werden:

```text
logs/start.log
backend Logs
Port 8000
Python venv
requirements
```

## Manuelle Prüfung

Im Browser öffnen:

```text
http://127.0.0.1:8000/health
```

Oder in PowerShell:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
```
