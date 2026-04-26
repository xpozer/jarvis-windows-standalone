"""
JARVIS Work Agent — Block 3
Erstellt alle Arbeitstext-Typen fachlich korrekt und industrietypisch.
Felder: ort, gebaeude, auftrag, meldung, leistung, normen, pruefung,
        aufwand, hinweis, ton, empfaenger, stunden, stundensatz
"""
from __future__ import annotations
import re
from typing import Optional

# ── Hilfsfunktionen ───────────────────────────────────────────────────────────

def _clean(val) -> str:
    return str(val or "").strip()

def _list(val) -> list[str]:
    if not val:
        return []
    if isinstance(val, list):
        return [str(v).strip() for v in val if str(v).strip()]
    return [s.strip() for s in re.split(r"[,;|]", str(val)) if s.strip()]

def _join(items: list[str]) -> str:
    if not items:
        return ""
    if len(items) == 1:
        return items[0]
    return ", ".join(items[:-1]) + " und " + items[-1]

def _norm_line(norms: list[str]) -> str:
    if not norms:
        return "nach den einschlägigen elektrotechnischen Regeln"
    return "unter Berücksichtigung von " + _join(norms)


# ── SAP Kurztext ──────────────────────────────────────────────────────────────

def sap_kurztext(data: dict) -> str:
    """Kurztext für SAP PM Auftrag oder Meldung — max ~60 Zeichen, technisch präzise."""
    leistung = _clean(data.get("leistung") or data.get("scope"))
    ort      = _clean(data.get("ort")      or data.get("location") or "E41")
    auftrag  = _clean(data.get("auftrag")  or data.get("order"))
    art      = _clean(data.get("art")      or "Instandhaltung")
    if leistung:
        base = f"{art}: {leistung}"
    else:
        base = art
    if ort:
        base += f" — {ort}"
    if auftrag:
        base += f" ({auftrag})"
    return base[:80]


# ── SAP Langtext ──────────────────────────────────────────────────────────────

def sap_langtext(data: dict) -> str:
    """Ausführlicher SAP-Auftragstext mit allen relevanten Feldern."""
    leistung   = _clean(data.get("leistung") or data.get("scope"))
    ort        = _clean(data.get("ort")      or data.get("location") or "E41")
    gebaeude   = _clean(data.get("gebaeude") or data.get("building"))
    auftrag    = _clean(data.get("auftrag")  or data.get("order"))
    meldung    = _clean(data.get("meldung")  or data.get("notification"))
    norms      = _list(data.get("normen")    or data.get("norms"))
    pruefung   = bool(data.get("pruefung", False))
    aufwand    = bool(data.get("aufwand",  True))
    hinweis    = _clean(data.get("hinweis") or data.get("extra"))
    lines = []
    # Kopfzeile
    loc_parts = [p for p in [gebaeude, ort] if p]
    if loc_parts:
        lines.append(f"Bereich: {' / '.join(loc_parts)}")
    if auftrag:
        lines.append(f"Auftrag: {auftrag}")
    if meldung:
        lines.append(f"Bezug Meldung: {meldung}")
    lines.append("")
    # Leistungsbeschreibung
    if leistung:
        lines.append(f"Leistungsumfang: {leistung}.")
    else:
        lines.append("Leistungsumfang: gemäß Abstimmung vor Ort.")
    lines.append("Die Durchführung erfolgt nach vorheriger Abstimmung mit dem Betreiber und dem zuständigen Ansprechpartner vor Ort.")
    # Prüfung
    if pruefung:
        lines.append(f"Die erforderlichen Prüfungen und Kontrollen erfolgen, soweit für den Leistungsumfang zutreffend, {_norm_line(norms)}.")
    elif norms:
        lines.append(f"Ausführung {_norm_line(norms)}.")
    # Abrechnung
    if aufwand:
        lines.append("Abrechnung nach tatsächlich angefallenem Aufwand und bestätigtem Leistungsnachweis.")
    # Hinweis
    if hinweis:
        lines.append(f"Hinweis: {hinweis}")
    return "\n".join(lines)


# ── Aufwandsangebot ───────────────────────────────────────────────────────────

def aufwandsangebot(data: dict) -> str:
    leistung   = _clean(data.get("leistung") or data.get("scope"))
    ort        = _clean(data.get("ort")      or data.get("location") or "E41")
    norms      = _list(data.get("normen")    or data.get("norms"))
    pruefung   = bool(data.get("pruefung", True))
    hinweis    = _clean(data.get("hinweis") or data.get("extra"))
    art        = _clean(data.get("art")      or "Aufwandsangebot")
    lines = [f"{art}: Durchführung der beschriebenen Elektroarbeiten im Bereich {ort}."]
    if leistung:
        lines.append(f"Leistungsumfang: {leistung}.")
    lines.append("Die Ausführung erfolgt nach vorheriger Abstimmung mit dem Betreiber beziehungsweise dem zuständigen Ansprechpartner vor Ort.")
    if pruefung:
        lines.append(f"Die erforderlichen Prüfungen und Kontrollen erfolgen, soweit zutreffend, {_norm_line(norms)}.")
    if hinweis:
        lines.append(hinweis)
    lines.append("Abrechnung nach tatsächlich angefallenem Aufwand und bestätigtem Leistungsnachweis.")
    return "\n".join(lines)


# ── LNW Text ──────────────────────────────────────────────────────────────────

def lnw_text(data: dict) -> str:
    leistung = _clean(data.get("leistung") or data.get("scope"))
    ort      = _clean(data.get("ort")      or data.get("location"))
    ergebnis = _clean(data.get("ergebnis") or data.get("result"))
    norms    = _list(data.get("normen")    or data.get("norms"))
    auftrag  = _clean(data.get("auftrag")  or data.get("order"))
    meldung  = _clean(data.get("meldung")  or data.get("notification"))
    lines = []
    if auftrag:
        lines.append(f"Auftrag: {auftrag}")
    if meldung:
        lines.append(f"Meldung: {meldung}")
    if leistung:
        lines.append(f"Ausgeführte Arbeiten: {leistung}")
    if ort:
        lines.append(f"Ort/Anlage: {ort}")
    if ergebnis:
        lines.append(f"Ergebnis/Hinweis: {ergebnis}")
    if norms:
        lines.append("Prüfbezug, soweit zutreffend: " + _join(norms))
    if not lines:
        lines.append("Ausgeführte Arbeiten gemäß Abstimmung vor Ort.")
    return "\n".join(lines)


# ── Prüfhinweis ───────────────────────────────────────────────────────────────

def pruefhinweis(data: dict) -> str:
    ort      = _clean(data.get("ort")     or data.get("location") or "E41")
    anlage   = _clean(data.get("anlage")  or data.get("system"))
    norms    = _list(data.get("normen")   or data.get("norms"))
    art      = _clean(data.get("art")     or "Wiederholungsprüfung")
    ergebnis = _clean(data.get("ergebnis") or data.get("result"))
    lines = [f"Prüfhinweis: {art}"]
    if anlage:
        lines.append(f"Anlage/Betriebsmittel: {anlage}")
    if ort:
        lines.append(f"Bereich: {ort}")
    if norms:
        lines.append("Prüfgrundlage: " + _join(norms))
    if ergebnis:
        lines.append(f"Prüfergebnis: {ergebnis}")
    lines.append("Dokumentation und Prüfprotokoll gemäß Vorgabe.")
    return "\n".join(lines)


# ── VDE Hinweis ───────────────────────────────────────────────────────────────

def vde_hinweis(data: dict) -> str:
    norm    = _clean(data.get("norm")    or data.get("normen") or "DIN VDE 0100")
    kontext = _clean(data.get("kontext") or data.get("context") or "")
    norm_texte = {
        "dguv":      "DGUV V3: Prüfung elektrischer Anlagen und Betriebsmittel. Fristen und Umfang nach Gefährdungsbeurteilung.",
        "0100-600":  "DIN VDE 0100-600: Erstprüfung vor Inbetriebnahme. Bestandteile: Besichtigen, Erproben, Messen.",
        "0105-100":  "DIN VDE 0105-100: Betrieb elektrischer Anlagen. Wiederkehrende Prüfungen und Arbeiten im Betrieb.",
        "0100":      "DIN VDE 0100: Errichten von Niederspannungsanlagen. Gilt für Planung, Errichtung und Prüfung.",
        "0105":      "DIN VDE 0105: Betrieb elektrischer Anlagen. Organisatorische und technische Anforderungen.",
    }
    snip = ""
    for k, v in norm_texte.items():
        if k in norm.lower():
            snip = v
            break
    lines = []
    if snip:
        lines.append(snip)
    else:
        lines.append(f"Normhinweis: {norm}")
    lines.append("")
    lines.append("Angebotsformulierung:")
    angebotstext = "Die Arbeiten erfolgen, soweit für den beschriebenen Leistungsumfang zutreffend, unter Berücksichtigung der einschlägigen DIN VDE Bestimmungen."
    if kontext:
        angebotstext += f" {kontext}"
    lines.append(angebotstext)
    lines.append("Der konkrete Prüfumfang richtet sich nach Ausführung, Anlagenzustand und Abstimmung vor Ort.")
    return "\n".join(lines)


# ── DGUV V3 Hinweis ───────────────────────────────────────────────────────────

def dguv_hinweis(data: dict) -> str:
    anlage   = _clean(data.get("anlage")  or data.get("system") or "Elektrische Betriebsmittel")
    ort      = _clean(data.get("ort")     or data.get("location"))
    frist    = _clean(data.get("frist")   or data.get("interval"))
    lines = [
        f"DGUV Vorschrift 3 — Prüfpflicht: {anlage}",
        "Elektrische Anlagen und Betriebsmittel müssen in bestimmten Zeitabständen auf ihren ordnungsgemäßen Zustand geprüft werden.",
        "Die Fristen ergeben sich aus der Gefährdungsbeurteilung und den Herstellerangaben.",
    ]
    if frist:
        lines.append(f"Empfohlene Prüffrist gemäß Einschätzung: {frist}")
    if ort:
        lines.append(f"Bereich: {ort}")
    lines.append("Prüfergebnisse sind zu dokumentieren und aufzubewahren.")
    return "\n".join(lines)


# ── FSM Buchungshinweis ───────────────────────────────────────────────────────

def fsm_buchungshinweis(data: dict) -> str:
    empfaenger = _clean(data.get("empfaenger") or data.get("recipient") or "zusammen")
    hinweis    = _clean(data.get("hinweis") or "")
    text = (
        f"Hallo {empfaenger},\n\n"
        "wenn ein Auftrag über FSM eingestellt wurde, bucht die Stunden bitte vollständig über FSM. "
        "Bitte nicht parallel oder anteilig über CATS buchen, weil die Stunden sonst nicht sauber auf dem digitalen Leistungsnachweis erscheinen.\n\n"
        "Wenn etwas unklar ist, bitte vorher kurz melden.\n\n"
    )
    if hinweis:
        text += f"{hinweis}\n\n"
    text += "Viele Grüße"
    return text


# ── CATS Warnhinweis ──────────────────────────────────────────────────────────

def cats_warnhinweis(data: dict) -> str:
    empfaenger = _clean(data.get("empfaenger") or data.get("recipient") or "zusammen")
    auftrag    = _clean(data.get("auftrag") or data.get("order"))
    lines = [
        f"Hallo {empfaenger},",
        "",
        "ich habe festgestellt, dass Stunden über CATS gebucht wurden, obwohl der Auftrag über FSM läuft.",
    ]
    if auftrag:
        lines.append(f"Betrifft: {auftrag}")
    lines += [
        "",
        "Bitte prüfen und ggf. korrigieren. Doppelbuchungen führen zu Fehlern im Leistungsnachweis und erschweren die Abrechnung.",
        "Bei Fragen gerne melden.",
        "",
        "Viele Grüße",
    ]
    return "\n".join(lines)


# ── Mail Texte ────────────────────────────────────────────────────────────────

def mail_text(data: dict) -> str:
    ton        = _clean(data.get("ton") or data.get("tone") or "locker").lower()
    inhalt     = _clean(data.get("inhalt") or data.get("content") or data.get("text"))
    empfaenger = _clean(data.get("empfaenger") or data.get("recipient"))
    betreff    = _clean(data.get("betreff") or data.get("subject"))
    anrede = f"Hallo {empfaenger}," if empfaenger else "Hallo,"
    if not inhalt:
        inhalt = "ich wollte euch kurz den aktuellen Stand mitteilen."
    gruss = "Viele Grüße" if "locker" in ton or "intern" in ton else "Mit freundlichen Grüßen"
    lines = []
    if betreff:
        lines.append(f"Betreff: {betreff}\n")
    lines.append(anrede)
    lines.append("")
    lines.append(inhalt)
    lines.append("")
    lines.append(gruss)
    return "\n".join(lines)


# ── Mängeltext ────────────────────────────────────────────────────────────────

def maengeltext(data: dict) -> str:
    mangel  = _clean(data.get("mangel")   or data.get("defect") or data.get("leistung"))
    ort     = _clean(data.get("ort")      or data.get("location"))
    anlage  = _clean(data.get("anlage")   or data.get("system"))
    schwere = _clean(data.get("schwere")  or data.get("severity") or "mittel")
    empf    = _clean(data.get("empfehlung") or data.get("recommendation"))
    lines   = ["Mangelbefund:"]
    if mangel:
        lines.append(f"Festgestellter Mangel: {mangel}")
    if anlage:
        lines.append(f"Betroffene Anlage/Betriebsmittel: {anlage}")
    if ort:
        lines.append(f"Ort: {ort}")
    lines.append(f"Einschätzung Schwere: {schwere}")
    if empf:
        lines.append(f"Empfehlung: {empf}")
    else:
        lines.append("Empfehlung: Umgehende Prüfung und Instandsetzung veranlassen.")
    lines.append("Bis zur Behebung ist der sichere Betrieb sicherzustellen.")
    return "\n".join(lines)


# ── Kostenübersicht ───────────────────────────────────────────────────────────

def kostenuebersicht(data: dict) -> str:
    stunden     = float(data.get("stunden", 0)    or 0)
    stundensatz = float(data.get("stundensatz", 0) or 0)
    material    = float(data.get("material", 0)    or 0)
    aufschlag   = float(data.get("aufschlag", 0)   or 0)  # Prozent
    leistung    = _clean(data.get("leistung") or "Elektroarbeiten")
    ort         = _clean(data.get("ort") or "")
    personal    = stunden * stundensatz
    gesamt_netto = personal + material
    if aufschlag:
        gesamt_netto *= (1 + aufschlag / 100)
    lines = [f"Kostenübersicht: {leistung}"]
    if ort:
        lines.append(f"Ort: {ort}")
    lines.append("")
    if stunden and stundensatz:
        lines.append(f"Personal:   {stunden:.1f} h × {stundensatz:.2f} €/h = {personal:.2f} €")
    elif stunden:
        lines.append(f"Geplante Stunden: {stunden:.1f} h")
    if material:
        lines.append(f"Material:   {material:.2f} €")
    if aufschlag:
        lines.append(f"Aufschlag:  {aufschlag:.0f} %")
    if gesamt_netto:
        lines.append(f"Gesamt (netto): {gesamt_netto:.2f} €")
    lines.append("")
    lines.append("Alle Angaben netto, zuzüglich gesetzlicher MwSt. Abrechnung nach bestätigtem Leistungsnachweis.")
    return "\n".join(lines)


# ── Zeitberechnung ────────────────────────────────────────────────────────────

def zeitberechnung(data: dict) -> str:
    anzahl     = int(data.get("anzahl",     0) or 0)
    zeit_pro   = float(data.get("zeit_pro", 0) or 0)   # Minuten
    einheit    = _clean(data.get("einheit") or "Steckdosen")
    aufschlag  = float(data.get("aufschlag", 20) or 20)  # % Rüst/Wege
    leistung   = _clean(data.get("leistung") or "")
    netto_min  = anzahl * zeit_pro
    rüst_min   = netto_min * (aufschlag / 100)
    gesamt_min = netto_min + rüst_min
    gesamt_h   = gesamt_min / 60
    lines = ["Zeitberechnung:"]
    if leistung:
        lines.append(f"Leistung: {leistung}")
    if anzahl and zeit_pro:
        lines.append(f"Anzahl {einheit}: {anzahl}")
        lines.append(f"Zeit pro Einheit: {zeit_pro:.0f} min")
        lines.append(f"Netto-Zeit: {netto_min:.0f} min")
        lines.append(f"Rüst-/Wegezeit ({aufschlag:.0f}%): {rüst_min:.0f} min")
        lines.append(f"Gesamtzeit: {gesamt_min:.0f} min = {gesamt_h:.2f} h")
    else:
        lines.append("Bitte Anzahl und Zeit pro Einheit angeben.")
    return "\n".join(lines)


# ── Stundensatz-Berechnung ────────────────────────────────────────────────────

def stundensatz_berechnung(data: dict) -> str:
    jahresgehalt  = float(data.get("jahresgehalt",  0) or 0)
    zuschlaege    = float(data.get("zuschlaege",    0) or 0)   # % Lohnnebenkosten
    produktiv_h   = float(data.get("produktiv_h",  1600) or 1600)
    gemeinkostens = float(data.get("gemeinkosten",  30) or 30)  # %
    gewinn        = float(data.get("gewinn",        10) or 10)  # %
    lohn_mit_nk   = jahresgehalt * (1 + zuschlaege / 100) if jahresgehalt else 0
    stundensatz   = (lohn_mit_nk / produktiv_h) * (1 + gemeinkostens / 100) * (1 + gewinn / 100) if produktiv_h else 0
    lines = ["Stundensatz-Berechnung:"]
    if jahresgehalt:
        lines.append(f"Jahresgehalt:          {jahresgehalt:,.2f} €")
        if zuschlaege:
            lines.append(f"Lohnnebenkosten ({zuschlaege:.0f}%): {jahresgehalt * zuschlaege / 100:,.2f} €")
            lines.append(f"Personalkosten gesamt: {lohn_mit_nk:,.2f} €")
        lines.append(f"Produktivstunden/Jahr: {produktiv_h:.0f} h")
        lines.append(f"Gemeinkostenzuschlag:  {gemeinkostens:.0f} %")
        lines.append(f"Gewinnaufschlag:       {gewinn:.0f} %")
        lines.append(f"Kalkulierter Stundensatz: {stundensatz:.2f} €/h")
    else:
        lines.append("Bitte Jahresgehalt und Lohnnebenkosten angeben.")
    return "\n".join(lines)


# ── Dispatcher ────────────────────────────────────────────────────────────────

WORK_TYPES = {
    "sap_kurztext":        sap_kurztext,
    "sap_langtext":        sap_langtext,
    "aufwandsangebot":     aufwandsangebot,
    "lnw":                 lnw_text,
    "leistungsnachweis":   lnw_text,
    "pruefhinweis":        pruefhinweis,
    "vde_hinweis":         vde_hinweis,
    "dguv_hinweis":        dguv_hinweis,
    "fsm_buchungshinweis": fsm_buchungshinweis,
    "cats_warnhinweis":    cats_warnhinweis,
    "mail":                mail_text,
    "mail_locker":         mail_text,
    "mail_klar":           lambda d: mail_text({**d, "ton": "klar"}),
    "mail_kunde":          lambda d: mail_text({**d, "ton": "formal"}),
    "mail_intern":         lambda d: mail_text({**d, "ton": "intern"}),
    "maengeltext":         maengeltext,
    "kostenuebersicht":    kostenuebersicht,
    "zeitberechnung":      zeitberechnung,
    "stundensatz":         stundensatz_berechnung,
    # Aliase
    "sap":                 aufwandsangebot,
    "angebot":             aufwandsangebot,
    "fsm":                 fsm_buchungshinweis,
    "cats":                cats_warnhinweis,
    "vde":                 vde_hinweis,
    "dguv":                dguv_hinweis,
    "email":               mail_text,
    "kosten":              kostenuebersicht,
    "zeit":                zeitberechnung,
}


def generate(kind: str, data: dict) -> dict:
    """Hauptfunktion: erzeugt den gewünschten Texttyp."""
    fn = WORK_TYPES.get((kind or "").lower().strip())
    if not fn:
        available = sorted(set(WORK_TYPES.keys()))
        return {
            "ok":    False,
            "error": f"Unbekannter Typ: '{kind}'. Verfügbar: {', '.join(available)}",
            "text":  "",
            "kind":  kind,
        }
    try:
        text = fn(data)
        return {"ok": True, "text": text, "kind": kind}
    except Exception as e:
        return {"ok": False, "error": str(e), "text": "", "kind": kind}


def list_types() -> list[dict]:
    """Gibt alle verfügbaren Typen mit Beschreibung zurück."""
    descriptions = {
        "sap_kurztext":        "SAP Kurztext (max ~80 Zeichen, technisch)",
        "sap_langtext":        "SAP Auftragstext ausführlich mit allen Feldern",
        "aufwandsangebot":     "Aufwandsangebot mit Normen und Prüfhinweis",
        "lnw":                 "Leistungsnachweis-Text",
        "pruefhinweis":        "Prüfhinweis mit Norm und Ergebnis",
        "vde_hinweis":         "VDE Norm-Hinweis mit Angebotsformulierung",
        "dguv_hinweis":        "DGUV V3 Prüfpflicht-Hinweis",
        "fsm_buchungshinweis": "FSM Buchungshinweis (kein paralleles CATS)",
        "cats_warnhinweis":    "CATS Warnhinweis bei Falschbuchung",
        "mail":                "E-Mail locker/professionell",
        "mail_klar":           "E-Mail klar und direkt",
        "mail_kunde":          "E-Mail formal an Kunden",
        "mail_intern":         "E-Mail intern ans Team",
        "maengeltext":         "Mangelbefund mit Empfehlung",
        "kostenuebersicht":    "Kostenübersicht mit Stunden und Material",
        "zeitberechnung":      "Zeitberechnung (Anzahl × Zeit + Rüst)",
        "stundensatz":         "Stundensatz-Kalkulation",
    }
    seen: set[str] = set()
    result = []
    for k, fn in WORK_TYPES.items():
        if k in descriptions and k not in seen:
            seen.add(k)
            result.append({"id": k, "name": k, "description": descriptions[k]})
    return result
