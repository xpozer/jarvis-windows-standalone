"""
Tests fuer classify_agent() Keyword-Router
Prueft ob bekannte Eingaben den richtigen Agenten bekommen.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "backend"))

from main import classify_agent


class TestSAPRouting:
    def test_meldung(self):
        agent, _, conf = classify_agent("SAP Meldung erstellen fuer E41")
        assert agent == "sap", f"Erwartet sap, bekam {agent}"
        assert conf > 0.8

    def test_angebotstext(self):
        agent, _, _ = classify_agent("Angebotstext fuer LED Umbau schreiben")
        assert agent == "sap"

    def test_lnw(self):
        agent, _, _ = classify_agent("LNW fuer Beleuchtungspruefung")
        assert agent == "sap"

    def test_leistungsnachweis(self):
        agent, _, _ = classify_agent("Leistungsnachweis Steckdosen E41 erstellen")
        assert agent == "sap"


class TestVDERouting:
    def test_norm(self):
        agent, _, _ = classify_agent("Pruefung nach DIN VDE 0100-600")
        assert agent == "vde"

    def test_dguv(self):
        agent, _, _ = classify_agent("DGUV Vorschrift 3 Wiederholungspruefung")
        assert agent == "vde"

    def test_0105(self):
        agent, _, _ = classify_agent("VDE 0105 Betrieb elektrischer Anlagen")
        assert agent == "vde"


class TestEmailRouting:
    def test_outlook(self):
        agent, _, _ = classify_agent("Outlook Postfach leeren")
        assert agent == "email"

    def test_mail(self):
        agent, _, _ = classify_agent("Mail an Volker wegen LNW schreiben")
        assert agent == "email"


class TestExamRouting:
    def test_ihk(self):
        agent, _, _ = classify_agent("IHK Industriemeister Frage BwHa")
        assert agent == "exam"

    def test_karteikarte(self):
        agent, _, _ = classify_agent("Karteikarte fuer Deckungsbeitrag erstellen")
        assert agent == "exam"


class TestCalendarRouting:
    def test_termin(self):
        agent, _, _ = classify_agent("Termin fuer Wartung KW 20 eintragen")
        assert agent == "calendar"

    def test_kw(self):
        agent, _, _ = classify_agent("Welche Prueffristen sind in KW 18 faellig")
        assert agent == "calendar"


class TestFallback:
    def test_allgemein(self):
        agent, _, conf = classify_agent("Wie wird das Wetter heute?")
        assert agent == "general"
        assert conf < 0.8

    def test_leer(self):
        agent, _, _ = classify_agent("")
        assert agent == "general"

    def test_unbekannt(self):
        agent, _, _ = classify_agent("xkcd lorem ipsum foo bar")
        assert agent == "general"
