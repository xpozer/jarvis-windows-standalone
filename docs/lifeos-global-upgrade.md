# JARVIS LifeOS Global Upgrade

LifeOS ist die geplante persönliche Operations Schicht für JARVIS. Ziel ist nicht nur eine neue Oberfläche, sondern ein praktischer Tages und Entscheidungs Assistent, der Arbeit, Lernen, private Themen und Projektstatus zusammenführt.

## Zielbild

JARVIS soll erkennen, was heute wichtig ist, was offen geblieben ist und welcher nächste Schritt sinnvoll ist. Die Oberfläche `frontend/public/jarvis-lifeos-command-center.html` ist der erste visuelle Prototyp für diesen Layer.

## Kernbereiche

| Bereich | Aufgabe |
|---|---|
| Daily Briefing | Tageslage, Prioritäten, offene Schleifen und Fokuszeit sichtbar machen |
| Work Radar | SAP, FSM, Mail, LNW, Angebote und Rückfragen überwachen |
| Learning | Meister, AEVO und spätere Weiterbildung als aktive Wiederholung führen |
| Health und Energy | Pausen, Energie und Belastung als Planungshilfe berücksichtigen |
| Private | Verträge, Finanzen, Termine, Auto, Wohnung und persönliche Projekte bündeln |
| Decision Layer | Optionen, Risiken und nächsten sinnvollen Schritt vorschlagen |

## Daily Briefing

Das Daily Briefing ist der erste echte Nutzwert. Es soll später lokale Quellen auswerten und daraus eine kurze Lage erzeugen.

Geplante Ausgabe:

```text
Heute wichtig:
1. Offene Arbeitsthemen prüfen
2. Kritische Rückfragen vor Mittag klären
3. Lernblock oder Projektblock einplanen
4. Private Fristen und Termine abgleichen
```

## Datenprinzip

LifeOS bleibt Local First.

| Regel | Bedeutung |
|---|---|
| Keine externe Telemetrie | JARVIS sendet keine Nutzungsdaten nach außen |
| Lokale Konfiguration | Quellen und Module werden lokal gesteuert |
| Bewusste Freigabe | Mails, Kalender oder Dokumente werden nur nach aktiver Verbindung genutzt |
| Auditfähig | Automationen und Entscheidungen sollen nachvollziehbar protokolliert werden |

## Geplante technische Struktur

```text
lifeos/
  daily_briefing.py
  work_radar.py
  learning_radar.py
  private_radar.py
  decision_layer.py
  schemas.py

config/
  lifeos.json
```

## Erste Ausbaustufe

1. LifeOS Command Center als lokale Single File Ansicht
2. Launcher Eintrag für LifeOS
3. Dokumentation des Zielbilds
4. später: lokale JSON Demo Daten
5. danach: Backend Schnittstelle für echtes Daily Briefing

## Akzeptanzkriterien für die nächste Stufe

```text
[ ] LifeOS Ansicht lädt lokal ohne externe Assets
[ ] Daily Briefing kann aus lokalen Demo Daten erzeugt werden
[ ] Work Radar zeigt offene Aufgaben aus einer lokalen JSON Datei
[ ] Decision Layer gibt genau einen nächsten sinnvollen Schritt aus
[ ] Keine Secrets, privaten Pfade oder Kundendaten im Repo
```
