# Command Palette

Die Command Palette ist der zentrale Tastatur Einstieg fuer den neuen JARVIS Stack.

## Aufgabe 1.1 Stand

Erledigt:

```text
CommandPalette.tsx       zentriertes Modal mit Suchfeld, Gruppen, Tastatursteuerung und Footer Shortcuts
CommandPalette.test.tsx  Tests fuer Rendering, Filterung und Escape Verhalten
StackRouterApp.tsx       Strg K und Header Button oeffnen die Palette im Stack Preview
```

## Aufgabe 1.2 Stand

Erledigt:

```text
commandSources.ts       Datenquellen Adapter fuer Pages, Tools, Quick Actions, Akten, Reminder, Mails, Settings und Themes
commandSources.test.ts  Tests fuer Gruppen und Page Select Handler
StackRouterApp.tsx      nutzt jetzt buildCommandPaletteItems statt inline Daten
```

## Bedienung

```text
Strg K       Palette oeffnen
Esc          schliessen
Pfeil runter naechster Treffer
Pfeil hoch   vorheriger Treffer
Tab          naechste Gruppe
Enter        ausfuehren und schliessen
Strg Enter   ausfuehren und offen halten
```

## Aktuelle Datenquellen

```text
Pages
Tools
Quick Actions
Akten
Reminder
Mails
Settings
Themes
```

## Noch Stub Daten

```text
Tools
Akten
Reminder
Mails
Themes
```

Diese Gruppen sind bewusst vorbereitet, aber noch nicht an echte Backend Endpunkte angebunden.

## Naechster Schritt

Aufgabe 1.3 baut die Fuzzy Search Engine aus, inklusive Score Sortierung, Recent Items und Frequently Used Persistenz.
