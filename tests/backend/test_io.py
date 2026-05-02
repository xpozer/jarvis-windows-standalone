"""
Tests fuer read_json / write_json
Prueft atomares Schreiben und Fehlertoleranz.
"""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "backend"))

from main import read_json, write_json


class TestReadJson:
    def test_existierende_datei(self, tmp_path):
        f = tmp_path / "test.json"
        f.write_text('{"key": "wert"}', encoding="utf-8")
        result = read_json(f, {})
        assert result == {"key": "wert"}

    def test_fehlende_datei_gibt_default(self, tmp_path):
        f = tmp_path / "nicht_vorhanden.json"
        result = read_json(f, {"default": True})
        assert result == {"default": True}

    def test_kaputtes_json_gibt_default(self, tmp_path):
        f = tmp_path / "kaputt.json"
        f.write_text("{kaputt}", encoding="utf-8")
        result = read_json(f, [])
        assert result == []

    def test_liste(self, tmp_path):
        f = tmp_path / "list.json"
        f.write_text("[1, 2, 3]", encoding="utf-8")
        assert read_json(f, []) == [1, 2, 3]


class TestWriteJson:
    def test_schreiben_und_lesen(self, tmp_path):
        f = tmp_path / "data.json"
        write_json(f, {"test": 42})
        result = json.loads(f.read_text(encoding="utf-8"))
        assert result == {"test": 42}

    def test_kein_tmp_file_uebrig(self, tmp_path):
        f = tmp_path / "data.json"
        write_json(f, {"ok": True})
        tmp = f.with_suffix(f.suffix + ".tmp")
        assert not tmp.exists(), ".tmp Datei wurde nicht aufgeraeumt"

    def test_ueberschreiben(self, tmp_path):
        f = tmp_path / "data.json"
        write_json(f, {"v": 1})
        write_json(f, {"v": 2})
        result = json.loads(f.read_text(encoding="utf-8"))
        assert result["v"] == 2

    def test_unicode(self, tmp_path):
        f = tmp_path / "unicode.json"
        write_json(f, {"text": "Prüfung VDE 0100-600 Überblick"})
        result = json.loads(f.read_text(encoding="utf-8"))
        assert "Prüfung" in result["text"]
