---
name: SAP Auftragstexte
description: Generiert standardisierte SAP PM Auftragstexte fuer typische Elektro-Arbeiten
agent: sap
trigger: auftragstext|auftrag text|sap text|meldungstext|leistungsnachweis
---

# SAP PM Auftragstexte fuer Elektro

## Format
SAP-Auftragstexte sind kurz, technisch praezise und folgen diesem Schema:

Kurztext (max 40 Zeichen): Kompakte Beschreibung der Arbeit
Langtext: Detaillierte Beschreibung mit:
- Was wird gemacht (Taetigkeit)
- Wo (Anlage/Ort/Equipment)
- Warum (Anlass: Stoerung, Wartung, Pruefung, Umbau)
- Normreferenz wenn relevant

## Beispiele

Kurztext: LED Retrofit Beleuchtung Halle 3
Langtext: Austausch der bestehenden Leuchtstofflampen gegen LED-Panels in Halle 3, Ebene 2. Insgesamt 24 Leuchten. Inklusive Demontage Altgeraete und Entsorgung. Pruefung nach VDE 0100-600 im Anschluss.

Kurztext: DGUV V3 Pruefung Buero Geb. 42
Langtext: Wiederkehrende Pruefung ortsveraenderlicher elektrischer Betriebsmittel gemaess DGUV Vorschrift 3. Gebaeude 42, alle Bueroetagen. Messungen, Sichtpruefung, Funktionspruefung. Dokumentation im Pruefprotokoll.

## Stil
- Aktiv, direkt, keine Fuellwoerter
- Kein KI-Ton, industrietypisch
- VDE/DGUV Referenzen wenn relevant
