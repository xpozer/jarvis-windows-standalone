# LifeOS Daily Command Center

Das Daily Command Center ist die nächste Ausbaustufe nach dem einfachen Daily Briefing. Es soll nicht nur Werte anzeigen, sondern den Tag praktisch sortieren.

## Ziel

LifeOS soll aus lokalen Daten ableiten:

```text
Tagesfokus
Top 3 Aufgaben
offene Schleifen
Energie Einschätzung
Fokuszeit
nächster sinnvoller Schritt
```

## Neue Datenfelder

Die Beispielkonfiguration `config/lifeos.example.json` wurde um diese Felder erweitert:

```text
daily_briefing.day_focus
daily_briefing.top_tasks[]
```

## Top Task Struktur

Jede Top Aufgabe enthält:

```text
title
area
impact
effort
next_step
```

Beispiel:

```json
{
  "title": "Offene Rückfragen prüfen",
  "area": "work",
  "impact": "high",
  "effort": "medium",
  "next_step": "Rückfragen mit Kunden oder Kollegen sortieren und beantworten"
}
```

## Bewertungslogik

Die spätere Logik soll Aufgaben nicht nur anzeigen, sondern gewichten.

Geplante Kriterien:

| Kriterium | Bedeutung |
|---|---|
| impact | Wirkung nach außen oder Risiko bei Nichtbearbeitung |
| effort | geschätzter Aufwand |
| area | work, learn, health, private oder project |
| next_step | konkrete nächste Handlung |

## Erste Akzeptanzkriterien

```text
[ ] LifeOS zeigt einen Tagesfokus
[ ] LifeOS zeigt maximal 3 wichtigste Aufgaben
[ ] jede Aufgabe hat einen konkreten nächsten Schritt
[ ] Daily Briefing Generator kann Top Tasks in die Tageslage einbeziehen
[ ] private Werte bleiben in config/lifeos.json
```

## Nächster technischer Schritt

Die LifeOS UI soll die neuen Felder sichtbar machen:

```text
1. Tagesfokus prominent im Daily Briefing anzeigen
2. Top 3 Aufgaben als eigene Liste rendern
3. Generated Daily Briefing um Top Task Bezug erweitern
```
