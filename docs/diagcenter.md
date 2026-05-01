# DiagCenter

DiagCenter ist der zentrale Sammelpunkt für JARVIS Diagnoseinformationen.

## Endpunkt

```text
http://127.0.0.1:8000/diagnostic/center
```

## Zweck

Vorher gab es mehrere einzelne Diagnose Endpunkte. DiagCenter bündelt die wichtigsten davon in einer gemeinsamen Übersicht.

## Enthaltene Bereiche

```text
Backend Health
Self Check
Dependencies
Ports
Logs
System Status
UseJARVIS Runtime
Awareness Runtime
```

## Antwortstruktur

Der Endpunkt liefert:

```text
ok
status
summary
checks
sections
```

## Beispiel Prüfung

In PowerShell:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/diagnostic/center
```

Im Browser:

```text
http://127.0.0.1:8000/diagnostic/center
```

## Zielbild

DiagCenter soll später auch im Frontend sichtbar werden und folgende Themen klar darstellen:

```text
Python
Node.js
Ports
Backend Health
LifeOS Config
Logs
Ollama
Build Status
Installer Status
```

## Sicherheitsprinzip

DiagCenter führt keine Reparaturen aus. Es sammelt und bewertet nur lokale Diagnoseinformationen.
