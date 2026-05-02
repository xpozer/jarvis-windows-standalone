# Automation Audit Log

Der Automation Audit Log ist der erste Sicherheitsbaustein fuer echte JARVIS Automationen.

## Ziel

Jede Automation soll nachvollziehbar bleiben.

Der Log beantwortet:

```text
Was wurde ausgeloest?
Wann wurde es ausgeloest?
Von welchem Modul kam die Aktion?
War eine Bestaetigung noetig?
Welches Risiko hatte die Aktion?
Was war das Ergebnis?
```

## Lokaler Speicherort

```text
audit/automation-audit.jsonl
```

Der Ordner `audit/` ist ueber `.gitignore` ausgeschlossen. Echte lokale Automationsdaten werden dadurch nicht ins Repository committed.

## API Endpunkte

### Audit Log lesen

```text
GET http://127.0.0.1:8000/automation/audit
```

Optional mit Limit:

```text
GET http://127.0.0.1:8000/automation/audit?limit=25
```

### Audit Log schreiben

```text
POST http://127.0.0.1:8000/automation/audit
```

Beispiel Body:

```json
{
  "task": "Daily LifeOS Scan",
  "source": "LifeOS",
  "status": "ok",
  "result": "Briefing aktualisiert",
  "requires_confirmation": false,
  "risk": "low",
  "target": "config/lifeos.json"
}
```

## Status Werte

```text
ok
error
waiting
blocked
started
```

## Risiko Werte

```text
low
medium
high
```

## Sicherheitsprinzip

Der Audit Log fuehrt selbst keine Aktion aus. Er dokumentiert nur, was ein anderes Modul getan oder vorbereitet hat.

Spaeter sollen echte Automationen zuerst pruefen:

```text
1. Ist die Aktion erlaubt?
2. Ist eine Nutzerbestaetigung noetig?
3. Wird ein Audit Eintrag geschrieben?
4. Gibt es ein klares Ergebnis?
```

## Naechster Schritt

Der naechste sinnvolle Ausbau ist eine kleine Anzeige im Frontend, damit die letzten Audit Log Eintraege im JARVIS HUD sichtbar werden.
