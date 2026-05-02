"""Block 3 Tests — Work Agent, Knowledge Index"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "backend"))

import knowledge
import work_agent


class TestWorkAgent:
    def test_aufwandsangebot(self):
        r = work_agent.generate(
            "aufwandsangebot",
            {"leistung": "LED-Umbau", "ort": "E41", "normen": ["DIN VDE 0100-600"]},
        )
        assert r["ok"]
        assert "E41" in r["text"]
        assert "LED-Umbau" in r["text"]

    def test_sap_kurztext_max_laenge(self):
        r = work_agent.generate(
            "sap_kurztext",
            {"leistung": "LED-Umbau Bürobeleuchtung", "ort": "E41", "art": "Instandhaltung"},
        )
        assert r["ok"]
        assert len(r["text"]) <= 80

    def test_sap_langtext(self):
        r = work_agent.generate(
            "sap_langtext",
            {
                "leistung": "Steckdosen erneuern",
                "ort": "E41",
                "pruefung": True,
                "normen": ["DIN VDE 0100-600"],
            },
        )
        assert r["ok"]
        assert "DIN VDE 0100-600" in r["text"]

    def test_lnw(self):
        r = work_agent.generate(
            "lnw", {"leistung": "Prüfung Betriebsmittel", "ort": "E41", "ergebnis": "bestanden"}
        )
        assert r["ok"]
        assert "bestanden" in r["text"]

    def test_kostenuebersicht(self):
        r = work_agent.generate(
            "kostenuebersicht", {"stunden": 8, "stundensatz": 85, "material": 200}
        )
        assert r["ok"]
        assert "680.00" in r["text"]  # 8×85
        assert "880.00" in r["text"]  # + 200

    def test_zeitberechnung(self):
        r = work_agent.generate("zeitberechnung", {"anzahl": 10, "zeit_pro": 15, "aufschlag": 20})
        assert r["ok"]
        assert "150" in r["text"]  # 10×15
        assert "180" in r["text"]  # +20%

    def test_unbekannter_typ_gibt_fehler(self):
        r = work_agent.generate("xyz_unbekannt", {})
        assert not r["ok"]
        assert "error" in r

    def test_alias_funktioniert(self):
        r1 = work_agent.generate("sap", {"leistung": "Test"})
        r2 = work_agent.generate("aufwandsangebot", {"leistung": "Test"})
        assert r1["ok"] and r2["ok"]
        assert r1["text"] == r2["text"]

    def test_alle_types_vorhanden(self):
        types = work_agent.list_types()
        ids = [t["id"] for t in types]
        for expected in [
            "sap_kurztext",
            "sap_langtext",
            "lnw",
            "vde_hinweis",
            "dguv_hinweis",
            "mail",
            "kostenuebersicht",
        ]:
            assert expected in ids, f"{expected} fehlt"

    def test_mail_mit_ton(self):
        r = work_agent.generate(
            "mail", {"empfaenger": "Volker", "inhalt": "Auftrag erledigt", "ton": "locker"}
        )
        assert r["ok"]
        assert "Hallo Volker" in r["text"]

    def test_vde_hinweis(self):
        r = work_agent.generate("vde_hinweis", {"norm": "DIN VDE 0100-600"})
        assert r["ok"]
        assert "0100-600" in r["text"]

    def test_dguv_hinweis(self):
        r = work_agent.generate("dguv_hinweis", {"anlage": "Steckdosen", "frist": "1 Jahr"})
        assert r["ok"]
        assert "1 Jahr" in r["text"]
        assert "DGUV" in r["text"]


class TestKnowledge:
    def _patch(self, monkeypatch, tmp_path):
        monkeypatch.setattr(knowledge, "INDEX_FILE", tmp_path / "knowledge_index.json")

    def test_import_und_search(self, tmp_path, monkeypatch):
        self._patch(monkeypatch, tmp_path)
        knowledge.import_text("SAP PM Transaktion IW31 Auftrag erstellen E41", "SAP Notiz")
        r = knowledge.search("IW31")
        assert r["total"] > 0
        assert r["results"][0]["title"] == "SAP Notiz"

    def test_auto_kategorie_vde(self, tmp_path, monkeypatch):
        self._patch(monkeypatch, tmp_path)
        result = knowledge.import_text(
            "DIN VDE 0100-600 Erstprüfung elektrischer Anlagen", "VDE Notiz"
        )
        assert result["category"] == "VDE"

    def test_auto_kategorie_sap(self, tmp_path, monkeypatch):
        self._patch(monkeypatch, tmp_path)
        result = knowledge.import_text("SAP PM IW32 Auftrag bearbeiten", "SAP Hilfe")
        assert result["category"] == "SAP"

    def test_chunks_korrekt(self, tmp_path, monkeypatch):
        self._patch(monkeypatch, tmp_path)
        langer_text = "A" * 2500
        result = knowledge.import_text(langer_text, "Langer Text")
        assert result["chunks"] >= 2

    def test_duplicate_import_ersetzt(self, tmp_path, monkeypatch):
        self._patch(monkeypatch, tmp_path)
        knowledge.import_text("Inhalt eins XABC", "Mein Dokument")
        docs_after_first = knowledge.list_documents()
        assert len(docs_after_first) == 1
        knowledge.import_text("Inhalt zwei XDEF", "Mein Dokument")
        docs_after_second = knowledge.list_documents()
        # Nach dem zweiten Import noch immer nur 1 Dokument (ersetzt)
        assert len(docs_after_second) == 1
        # Alter Inhalt nicht mehr auffindbar
        r = knowledge.search("XABC")
        assert r["total"] == 0

    def test_stats(self, tmp_path, monkeypatch):
        self._patch(monkeypatch, tmp_path)
        knowledge.import_text("VDE Test", "VDE Doc")
        knowledge.import_text("SAP Test", "SAP Doc")
        stats = knowledge.get_stats()
        assert stats["total_documents"] == 2
        assert stats["total_chunks"] == 2

    def test_delete(self, tmp_path, monkeypatch):
        self._patch(monkeypatch, tmp_path)
        r = knowledge.import_text("Text zum Löschen", "Delete Me")
        doc_id = r["doc_id"]
        knowledge.delete_document(doc_id)
        docs = knowledge.list_documents()
        assert not any(d["doc_id"] == doc_id for d in docs)

    def test_summarize_ergebnisse(self, tmp_path, monkeypatch):
        self._patch(monkeypatch, tmp_path)
        knowledge.import_text("VDE 0100 ist eine wichtige Norm", "VDE Info")
        r = knowledge.search("VDE 0100")
        summary = knowledge.summarize_results(r["results"], "VDE 0100")
        assert "VDE" in summary
        assert "Quellen" in summary

    def test_leere_suche(self, tmp_path, monkeypatch):
        self._patch(monkeypatch, tmp_path)
        r = knowledge.search("")
        assert r["total"] == 0
        assert r["results"] == []
