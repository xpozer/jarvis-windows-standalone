---
name: Kabelquerschnitt berechnen
description: Berechnet den Mindest-Kabelquerschnitt nach VDE 0298-4 basierend auf Strom, Verlegeart und Material
agent: sap
trigger: kabelquerschnitt|querschnitt|kabel berechnen|leiterquerschnitt
---

# Kabelquerschnitt nach VDE 0298-4

Wenn der Nutzer einen Kabelquerschnitt berechnen will, frage nach:
- Bemessungsstrom (A)
- Verlegeart (A1, A2, B1, B2, C, E, F, G)
- Material (Cu oder Al)
- Anzahl belasteter Adern (2 oder 3)

Berechne dann den Mindestquerschnitt anhand dieser Referenzwerte (VDE 0298-4, Tabelle 11, Verlegeart B2, 3 belastete Adern, PVC, Cu):

| Querschnitt mm2 | Belastbarkeit A |
|-----------------|----------------|
| 1.5             | 15.5           |
| 2.5             | 21             |
| 4               | 28             |
| 6               | 36             |
| 10              | 50             |
| 16              | 68             |
| 25              | 89             |
| 35              | 110            |
| 50              | 134            |
| 70              | 171            |
| 95              | 207            |
| 120             | 239            |

Waehle den naechstgroesseren Querschnitt der den Bemessungsstrom abdeckt.

Hinweis: Bei anderen Verlegearten oder Haeufungsfaktoren die Tabellenwerte anpassen. Immer die vollstaendige VDE 0298-4 als Referenz angeben.
