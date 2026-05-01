# Dashboard Theme Test Checkliste

Diese Checkliste gilt für den Prototype im Draft PR 39.

## Datei

```text
frontend/public/jarvis-global-overview-themed.html
```

## Start über lokalen Server

Empfohlen:

```powershell
python -m http.server 8080
```

Dann im Browser öffnen:

```text
http://127.0.0.1:8080/frontend/public/jarvis-global-overview-themed.html
```

Alternativ über den Launcher:

```text
http://127.0.0.1:8080/index.html
```

Dann `GLOBAL THEMES` auswählen.

## Test 1: Grundlayout

Erwartung:

```text
Header oben
linke Sidebar sichtbar
Weltkarte in der Mitte
rechte Sidebar sichtbar
Footer unten
keine leeren großen Flächen
```

Ergebnis:

```text
[ ] ok
[ ] Fehler
```

## Test 2: Theme Switcher

Im Header zwischen diesen Themes umschalten:

```text
JARVIS
MATRIX
ULTRON
```

Erwartung:

```text
Theme ändert Farben sofort
Auswahl bleibt nach Reload gespeichert
kein Page Reload nötig
kurzer Flash beim Wechsel
```

Ergebnis:

```text
[ ] ok
[ ] Fehler
```

## Test 3: MATRIX

Erwartung:

```text
schwarzer Hintergrund
grüne Matrix Optik
fallender Code Rain sichtbar
Weltkarte und Routen grün
keine roten Threat Farben
```

Ergebnis:

```text
[ ] ok
[ ] Fehler
```

## Test 4: ULTRON

Erwartung:

```text
roter dunkler Hintergrund
ULTRON Logo im Header
Circuit Layer sichtbar
rote Routen und Pakete
Theme wirkt mechanischer und bedrohlicher
```

Ergebnis:

```text
[ ] ok
[ ] Fehler
```

## Test 5: Performance

Browser DevTools öffnen und prüfen:

```text
keine sichtbaren Ruckler
Canvas Animation bleibt flüssig
Laptop Lüfter dreht nicht sofort hoch
```

Ergebnis:

```text
[ ] ok
[ ] Fehler
```

## Test 6: Mobile

Browser Fenster schmal ziehen oder am Handy öffnen.

Erwartung:

```text
keine komplett leeren Flächen
Theme Switcher bleibt nutzbar
Hauptkarte bleibt sichtbar
Sidebar Inhalte werden sinnvoll reduziert
```

Ergebnis:

```text
[ ] ok
[ ] Fehler
```

## Entscheidung danach

Wenn alles passt:

```text
done
```

Wenn etwas nicht passt, bitte Screenshot oder kurze Beschreibung schicken:

```text
Theme:
Problem:
Bildschirmgröße:
```
