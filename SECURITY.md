# Security Policy

## Unterstützte Versionen

| Version | Status |
|---|---|
| B6.5.1 | Unterstützt |
| B6.5.0 | Eingeschränkt unterstützt |
| Älter als B6.5.0 | Nicht unterstützt |

Sicherheitsrelevante Korrekturen werden zuerst für die aktuelle Version gepflegt. Ältere Versionen erhalten nur dann Korrekturen, wenn der Aufwand vertretbar ist und keine Architekturänderung nötig wird.

## Sicherheitslücken melden

Bitte melde Sicherheitslücken nicht öffentlich als GitHub Issue.

Kontakt:

```text
security@julien-negro.local
```

Falls diese Adresse noch nicht aktiv ist, nutze vorübergehend einen privaten Kontaktweg zum Repository Owner.

Bitte gib bei einer Meldung möglichst diese Informationen an:

| Angabe | Beschreibung |
|---|---|
| Betroffene Version | Zum Beispiel B6.5.1 |
| Betroffener Bereich | Backend, Frontend, Installer, Voice, Knowledge, Logs |
| Reproduktion | Schritte, mit denen sich das Problem nachvollziehen lässt |
| Risiko | Was könnte passieren |
| Vorschlag | Falls vorhanden, wie es behoben werden kann |

## Local First und Telemetrie

JARVIS ist als lokales Windows Tool geplant.

Das Projekt soll keine Telemetrie nach außen senden. Logs, Auditdaten, Knowledge Index, Diagnosedaten und lokale Konfigurationen bleiben auf dem Gerät, solange der Nutzer nicht ausdrücklich etwas anderes einrichtet.

## Schutz sensibler Daten

Nicht in Git committen:

```text
.env
*.local.json
logs/
audit/
knowledge_index/
*.log
*.key
*.pem
*.pfx
*.crt
*.token
```

## Voice Modul

Das Mikrofon bleibt standardmäßig ausgeschaltet.

Push to Talk bleibt der Standard. Wake Word Detection darf nur optional aktiviert werden und muss klar dokumentiert sein.

## Installer und Downloads

Installer Skripte sollen Downloads nur von bekannten Quellen beziehen. Für externe Downloads ist eine SHA256 Prüfung vorgesehen.

Beispiel für PowerShell:

```powershell
$ExpectedHash = "SHA256_HASH_HIER_EINTRAGEN"
$ActualHash = (Get-FileHash -Algorithm SHA256 -Path $DownloadPath).Hash

if ($ActualHash -ne $ExpectedHash) {
    throw "SHA256 Prüfung fehlgeschlagen. Download wird abgebrochen."
}
```

## Verantwortungsvolle Offenlegung

Bitte gib ausreichend Zeit für Analyse und Korrektur, bevor Details öffentlich geteilt werden. Ziel ist eine saubere Behebung ohne unnötiges Risiko für Nutzer.
