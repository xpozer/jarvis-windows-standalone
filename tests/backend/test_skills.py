"""
Tests fuer das Skill-System
Prueft Parsing, Matching und Kontext-Injektion.
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "backend"))

from skill_system import SkillManager, parse_skill_md


EXAMPLE_SKILL_MD = """\
---
name: Kabelquerschnitt berechnen
description: Berechnet Kabelquerschnitt nach VDE 0298-4
agent: sap
trigger: kabelquerschnitt|querschnitt berechnen
---
Du kannst Kabelquerschnitte nach VDE 0298-4 berechnen.
Frage nach Strom, Laenge und Verlegeart wenn noch nicht angegeben.
"""

EXAMPLE_SKILL_ALL = """\
---
name: Datumsformat
description: Erklaert deutsche Datumsformate
agent: all
trigger: datum|datumsformat
---
Deutsche Datumsformate: TT.MM.JJJJ ist Standard.
"""


class TestSkillParsing:
    def test_parse_gueltiger_skill(self, tmp_path):
        f = tmp_path / "SKILL.md"
        f.write_text(EXAMPLE_SKILL_MD, encoding="utf-8")
        skill = parse_skill_md(f)
        assert skill is not None
        assert skill.name == "Kabelquerschnitt berechnen"
        assert skill.agent == "sap"
        assert "0298-4" in skill.instructions

    def test_parse_ohne_frontmatter_gibt_none(self, tmp_path):
        f = tmp_path / "SKILL.md"
        f.write_text("Kein Frontmatter hier", encoding="utf-8")
        assert parse_skill_md(f) is None

    def test_parse_leere_datei_gibt_none(self, tmp_path):
        f = tmp_path / "SKILL.md"
        f.write_text("", encoding="utf-8")
        assert parse_skill_md(f) is None


class TestSkillManager:
    def _make_manager(self, tmp_path):
        skill_dir = tmp_path / "jarvis_skills"
        skill_dir.mkdir()
        (skill_dir / "kabel").mkdir()
        (skill_dir / "kabel" / "SKILL.md").write_text(EXAMPLE_SKILL_MD, encoding="utf-8")
        (skill_dir / "datum").mkdir()
        (skill_dir / "datum" / "SKILL.md").write_text(EXAMPLE_SKILL_ALL, encoding="utf-8")
        return SkillManager(skills_dir=skill_dir)

    def test_skills_werden_geladen(self, tmp_path):
        mgr = self._make_manager(tmp_path)
        assert len(mgr.skills) == 2

    def test_get_skills_for_agent_sap(self, tmp_path):
        mgr = self._make_manager(tmp_path)
        sap_skills = mgr.get_skills_for_agent("sap")
        names = [s.name for s in sap_skills]
        assert "Kabelquerschnitt berechnen" in names
        assert "Datumsformat" in names  # agent=all gilt fuer alle

    def test_get_skills_for_agent_vde(self, tmp_path):
        mgr = self._make_manager(tmp_path)
        vde_skills = mgr.get_skills_for_agent("vde")
        names = [s.name for s in vde_skills]
        assert "Kabelquerschnitt berechnen" not in names
        assert "Datumsformat" in names  # all bleibt

    def test_match_skills_trifft_trigger(self, tmp_path):
        mgr = self._make_manager(tmp_path)
        matches = mgr.match_skills("kabelquerschnitt fuer 16A berechnen")
        names = [s.name for s in matches]
        assert "Kabelquerschnitt berechnen" in names

    def test_match_skills_kein_treffer(self, tmp_path):
        mgr = self._make_manager(tmp_path)
        matches = mgr.match_skills("Wie ist das Wetter in Leverkusen")
        assert len(matches) == 0

    def test_skill_context_nicht_leer_wenn_skills_vorhanden(self, tmp_path):
        mgr = self._make_manager(tmp_path)
        ctx = mgr.get_skill_context("sap", "kabelquerschnitt berechnen")
        assert "SKILL" in ctx or "0298-4" in ctx

    def test_skill_context_leer_ohne_skills(self, tmp_path):
        empty_dir = tmp_path / "leer"
        empty_dir.mkdir()
        mgr = SkillManager(skills_dir=empty_dir)
        ctx = mgr.get_skill_context("sap", "irgendwas")
        assert ctx == ""
