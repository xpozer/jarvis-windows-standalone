# Installer Readiness Check

Der Installer Readiness Check ist eine nicht destruktive Vorprüfung für die Windows Installation.

Er installiert nichts, ändert keine Systemwerte und soll typische Fehler vor `INSTALL_JARVIS.ps1` sichtbar machen.

## Ausführen

Im Repository Root:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\maintenance\check-installer-readiness.ps1
```

## Was geprüft wird

```text
PowerShell Version
wichtige Root Dateien
backend, frontend und config Ordner
Python 3.10 oder neuer
Node.js
npm
winget
Ollama CLI und Port 11434
Port 8000
Port 5173
LifeOS Beispielkonfiguration
LifeOS private Konfiguration
```

## Ergebnis

Der Check unterscheidet drei Zustände:

```text
OK    = bereit
WARN  = Hinweis, Installation kann oft trotzdem weitergehen
FAIL  = Problem muss vor Installation behoben werden
```

Bei `FAIL` endet das Skript mit ExitCode 1.

## Warum dieser Check existiert

Der Installer selbst kann viele Dinge reparieren oder installieren. Für echte Endanwender ist es aber besser, vorab klar zu sehen, warum eine Installation scheitern könnte.

Typische Problemfälle:

```text
Python fehlt oder ist nur als Windows Store Dummy vorhanden
Node.js oder npm fehlen
PowerShell ist zu alt
Ports sind bereits belegt
Ollama ist nicht erreichbar
LifeOS Beispielkonfiguration fehlt
```

## Wichtig

Der Readiness Check ersetzt den Installer nicht. Er ist ein vorgeschalteter Diagnose Schritt.

Empfohlene Reihenfolge:

```text
1. check-installer-readiness.ps1 ausführen
2. Falls FAIL, Problem beheben
3. INSTALL_JARVIS.bat starten
4. Bei Startproblemen START_JARVIS.bat testen
```
