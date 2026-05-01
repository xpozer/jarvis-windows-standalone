# LifeOS private Konfiguration

LifeOS kann persönliche lokale Daten aus `config/lifeos.json` laden. Diese Datei ist bewusst nicht Teil des Repositorys und wird über `.gitignore` ausgeschlossen.

## Warum privat?

`config/lifeos.json` kann später echte persönliche Daten enthalten, zum Beispiel Tagesplanung, private Projekte, Lernstände, Vertragsfristen oder Arbeitsnotizen. Solche Daten gehören nicht nach GitHub.

## Datei erzeugen

Unter Windows im Repository Root ausführen:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\maintenance\setup-lifeos-config.ps1
```

Das Skript kopiert:

```text
config/lifeos.example.json
```

nach:

```text
config/lifeos.json
```

Wenn `config/lifeos.json` bereits existiert, wird sie nicht überschrieben.

## Datei neu erzeugen

Nur wenn die bestehende private Datei bewusst überschrieben werden soll:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\maintenance\setup-lifeos-config.ps1 -Force
```

## Lade Reihenfolge in LifeOS

LifeOS nutzt diese Reihenfolge:

```text
1. config/lifeos.json
2. config/lifeos.example.json
3. interner Fallback im HTML
```

## Sicherheitsregel

```text
config/lifeos.json niemals committen
```

Vor jedem Commit prüfen:

```powershell
git status
```

Wenn `config/lifeos.json` auftaucht, darf sie nicht eingecheckt werden.
