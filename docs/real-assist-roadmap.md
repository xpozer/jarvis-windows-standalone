# Real Assist Roadmap

Diese Roadmap archiviert die Real Assist Produktlinie im Repository. Sie ersetzt verstreute Chat-Todos durch eine klare, lokale und privacy-first Arbeitsgrundlage.

## Leitlinien

- Local first: sensible Daten bleiben lokal.
- Kein Cloud Call fuer private Inhalte ohne bewusste Freigabe.
- Pro Block ein eigener Branch.
- Pro Aufgabe erst weiterarbeiten, wenn der vorherige Schritt wirklich erledigt ist.
- Kritische Aktionen bleiben bestaetigungspflichtig.
- Roadmap-Arbeit wird in `PROJECT_STATUS.md` und `CHANGELOG.md` nachgezogen.

## Status

| Block | Thema | Status | Hinweis |
|---|---|---|---|
| 1 | Quick Capture | geparkt | Begonnene Arbeit liegt historisch auf `feature/quickcapture`; vor Wiederaufnahme neu gegen `main` pruefen |
| 2 | Pre Meeting Briefing und Post Meeting Capture | geplant | Nur lokale Kalender- und Notizquellen verwenden |
| 3 | Anlagen Akte und Personen Akte | geplant | Strikte Trennung zwischen Arbeitsdaten, privaten Daten und Projektwissen |
| 4 | Energy Calendar und Cognitive Load Tracking | geplant | Planungshilfe, keine medizinische Bewertung |
| 5 | Honest Reflection und Anti Pattern Watch | geplant | Kurze Reflexion, keine permanente Ueberwachung |

## 1. Quick Capture

Ziel: Gedanken, Aufgaben und kurze Fundstellen schnell lokal erfassen, ohne den Arbeitsfluss zu brechen.

Module:

```text
backend/quickcapture/app.py
backend/quickcapture/classifier.py
backend/quickcapture/hotkey.py
backend/quickcapture/popup.py
backend/quickcapture/persistence.py
backend/quickcapture/voice_input.py
```

Privacy Regeln:

- Standardziel ist lokale Speicherung.
- Erfasste Inhalte werden nicht automatisch an LLMs oder Cloud APIs gesendet.
- Voice Input bleibt bewusst aktiviert und ist nicht dauerhaft offen.
- Hotkeys duerfen keine riskanten Aktionen direkt ausfuehren.

Testplan:

```text
[ ] Quick Capture startet ohne Backend Crash
[ ] Hotkey ist optional und abschaltbar
[ ] Eintrag wird lokal gespeichert
[ ] Klassifikation kann ohne Cloud Provider laufen
[ ] Tests decken Speichern, Klassifizieren und Fehlerfaelle ab
```

## 2. Pre Meeting Briefing und Post Meeting Capture

Ziel: Vor Terminen kompakte Vorbereitung liefern und danach offene Punkte erfassen.

Modulstruktur:

```text
meeting_briefing/
  sources.py
  briefing.py
  capture.py
  storage.py
```

Privacy Regeln:

- Kalenderdaten werden nur lokal oder ueber bewusst eingerichtete Connectoren gelesen.
- Meeting Notes werden nicht ungefragt synchronisiert.
- Zusammenfassungen duerfen lokale Quellen nennen, aber keine privaten Rohdaten in Logs schreiben.

Testplan:

```text
[ ] Briefing funktioniert mit Beispieltermin
[ ] Post Meeting Capture erzeugt offene Punkte
[ ] Keine Rohdaten in Logs
[ ] Fehlende Kalenderquelle fuehrt zu klarer Meldung
```

## 3. Anlagen Akte und Personen Akte

Ziel: Wiederkehrende technische Anlagen, Ansprechpartner und Kontext lokal nachvollziehbar machen.

Modulstruktur:

```text
records/
  assets.py
  people.py
  links.py
  audit.py
```

Privacy Regeln:

- Personenbezogene Daten minimal halten.
- Quellen, Datum und Zweck speichern.
- Export nur bewusst ausloesen.

Testplan:

```text
[ ] Anlage kann lokal angelegt und gefunden werden
[ ] Personeneintrag hat klare Quelle
[ ] Export ist explizit
[ ] Loeschen entfernt lokale Eintraege nachvollziehbar
```

## 4. Energy Calendar und Cognitive Load Tracking

Ziel: Tagesplanung realistischer machen, ohne medizinische Bewertung zu spielen.

Modulstruktur:

```text
energy/
  profile.py
  calendar.py
  recommendation.py
```

Privacy Regeln:

- Gesundheits- und Energiedaten bleiben lokal.
- Empfehlungen sind neutral formuliert.
- Keine Diagnose, keine medizinische Einordnung.

Testplan:

```text
[ ] Fokusfenster werden lokal gespeichert
[ ] Tageslage nutzt Energie nur als Planungssignal
[ ] Empfehlungen bleiben neutral
[ ] Keine sensiblen Werte im Repository
```

## 5. Honest Reflection und Anti Pattern Watch

Ziel: JARVIS soll auf wiederkehrende Muster hinweisen, ohne belehrend oder ueberwachend zu werden.

Modulstruktur:

```text
reflection/
  signals.py
  patterns.py
  prompts.py
  journal.py
```

Privacy Regeln:

- Reflexion ist opt-in.
- Keine permanente Auswertung ohne sichtbaren Modus.
- Journal bleibt lokal.

Testplan:

```text
[ ] Reflexion kann deaktiviert werden
[ ] Musterhinweise nennen ihre Grundlage
[ ] Journal speichert lokal
[ ] Keine automatische Cloud-Auswertung
```

## Wiederaufnahme

Die Roadmap ist jetzt dokumentiert und abgeschlossen als Todo. Neue Arbeit daran beginnt nicht als Sammel-Issue, sondern mit einem konkreten kleinen Branch, zum Beispiel:

```text
feature/quickcapture-storage
feature/meeting-briefing-local
feature/records-local-schema
```
