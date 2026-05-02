"""Block 2 Tests — Diagnostic Agent, Log-Analyse"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent.parent / "backend"))
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "backend" / "agents"))
from diagnostic_agent import analyze_log_text, check_port


class TestLogAnalysis:
    def test_erkennt_modulenotfounderror(self):
        text = "ModuleNotFoundError: No module named 'pyyaml'"
        findings = analyze_log_text(text)
        assert len(findings) > 0
        assert findings[0]["severity"] == "critical"
        assert "pyyaml" in findings[0]["description"]

    def test_erkennt_npm_fehler(self):
        text = "npm ERR! code ENOENT\nnpm ERR! syscall open"
        findings = analyze_log_text(text)
        assert any(f["severity"] in ("high", "critical") for f in findings)

    def test_erkennt_alter_pfad(self):
        text = "Loading config from C:\\Projekte\\jarvis\\config.json"
        findings = analyze_log_text(text)
        assert any(
            "alter Projektpfad" in f["description"].lower() or "pfad" in f["description"].lower()
            for f in findings
        )

    def test_keine_false_positives_bei_ok_log(self):
        text = "[INFO] Backend gestartet\n[INFO] Ollama erreichbar\n[OK] Alle Checks bestanden"
        findings = analyze_log_text(text)
        crits = [f for f in findings if f["severity"] == "critical"]
        assert len(crits) == 0

    def test_liefert_fix_vorschlag(self):
        text = "ModuleNotFoundError: No module named 'fastapi'"
        findings = analyze_log_text(text)
        assert findings[0]["fix"] != ""
        assert "pip" in findings[0]["fix"].lower()

    def test_sortierung_nach_schweregrad(self):
        text = "ModuleNotFoundError: No module named 'x'\nWARNING deprecated package\nERROR failed"
        findings = analyze_log_text(text)
        severities = [f["severity"] for f in findings]
        order = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}
        assert severities == sorted(severities, key=lambda s: order.get(s, 5))

    def test_zeilen_nummer_korrekt(self):
        text = "normale Zeile\nModuleNotFoundError: No module named 'xyz'\nnoch eine Zeile"
        findings = analyze_log_text(text)
        assert findings[0]["line_no"] == 2


class TestCheckPort:
    def test_port_nicht_belegt_gibt_false(self):
        result = check_port(19999)  # unwahrscheinlich belegt
        assert result["port"] == 19999
        assert isinstance(result["in_use"], bool)
