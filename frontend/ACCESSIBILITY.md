# Frontend Accessibility Guardrails

Diese Regeln gelten fuer alle neuen Stack Komponenten.

## Tastatur

- Jede interaktive Funktion muss per Tastatur erreichbar sein.
- Sichtbarer Focus Ring ist Pflicht.
- Modals brauchen Focus Trap und Escape zum Schliessen.
- Command Palette nutzt ARIA Combobox Pattern.
- Sidebar Toggle bekommt einen klaren Button Namen und Hotkey Hinweis.

## Semantik

- Navigation nutzt `nav` mit `aria-label`.
- Hauptinhalt nutzt `main`.
- Log Listen nutzen `ol` oder `ul` mit sinnvollem Label.
- Metriken brauchen lesbare Labels, nicht nur Icons.
- Icons ohne Text bekommen `aria-hidden` oder ein Label.

## Motion

- `prefers-reduced-motion: reduce` ist Pflicht.
- Motion darf Bedeutung transportieren, aber keine Funktion verstecken.
- Live Daten Updates duerfen bei Reduced Motion nicht blinken oder springen.

## Kontrast

- Standardziel ist WCAG AA.
- Wireframe Theme nutzt harte Linien und klare Kontraste.
- Kritische Zustaende duerfen nicht nur ueber Farbe erkennbar sein.

## Kognitive Last

- Keine unnoetigen Glows in Arbeitsansichten.
- Status und Risiko muessen klar lesbar sein.
- Vorschlaege der KI Sidebar muessen ablehnbar und snoozebar sein.
- Leere Zustaende sagen konkret, was als naechstes moeglich ist.

## Freigabe vor Main Dashboard Ersatz

```text
Keyboard Navigation geprueft
Focus Reihenfolge geprueft
Reduced Motion geprueft
Screenreader Labels geprueft
Kontrast geprueft
Keine kritische Funktion nur per Maus erreichbar
```
