"""
Block 1 Tests — Audit Log, Agent Registry, Tool Registry
"""
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "backend"))


class TestAuditLog:
    def test_log_action(self, tmp_path, monkeypatch):
        import audit_log
        monkeypatch.setattr(audit_log, "AUDIT_FILE", tmp_path / "audit_log.json")
        entry = audit_log.log_action("test_action", agent="sap", tool="sap_text_generate", risk_level="low")
        assert entry["action"] == "test_action"
        assert entry["agent"] == "sap"
        assert entry["risk_level"] == "low"
        assert "id" in entry and "ts" in entry

    def test_get_entries_leer(self, tmp_path, monkeypatch):
        import audit_log
        monkeypatch.setattr(audit_log, "AUDIT_FILE", tmp_path / "audit_log.json")
        entries = audit_log.get_entries()
        assert isinstance(entries, list)
        assert len(entries) == 0

    def test_filter_by_agent(self, tmp_path, monkeypatch):
        import audit_log
        monkeypatch.setattr(audit_log, "AUDIT_FILE", tmp_path / "audit_log.json")
        audit_log.log_action("a1", agent="sap")
        audit_log.log_action("a2", agent="vde")
        audit_log.log_action("a3", agent="sap")
        entries = audit_log.get_entries(agent="sap")
        assert len(entries) == 2
        assert all(e["agent"] == "sap" for e in entries)

    def test_filter_has_error(self, tmp_path, monkeypatch):
        import audit_log
        monkeypatch.setattr(audit_log, "AUDIT_FILE", tmp_path / "audit_log.json")
        audit_log.log_action("ok_action", agent="core", error=None)
        audit_log.log_action("bad_action", agent="core", error="Etwas ist schiefgelaufen")
        errors = audit_log.get_entries(has_error=True)
        assert len(errors) == 1
        assert errors[0]["error"] == "Etwas ist schiefgelaufen"

    def test_stats(self, tmp_path, monkeypatch):
        import audit_log
        monkeypatch.setattr(audit_log, "AUDIT_FILE", tmp_path / "audit_log.json")
        audit_log.log_action("a1", agent="sap", risk_level="low")
        audit_log.log_action("a2", agent="sap", risk_level="high", error="err")
        stats = audit_log.get_stats()
        assert stats["total"] == 2
        assert stats["errors"] == 1
        assert stats["by_agent"]["sap"] == 2

    def test_corrupt_file_gibt_leer(self, tmp_path, monkeypatch):
        import audit_log
        f = tmp_path / "audit_log.json"
        f.write_text("{kaputt}", encoding="utf-8")
        monkeypatch.setattr(audit_log, "AUDIT_FILE", f)
        entries = audit_log.get_entries()
        assert entries == []


class TestAgentRegistry:
    def _patch(self, monkeypatch, tmp_path):
        import agent_registry
        monkeypatch.setattr(agent_registry, "REGISTRY_FILE", tmp_path / "agents.json")
        return agent_registry

    def test_init_erstellt_alle_agenten(self, tmp_path, monkeypatch):
        ar = self._patch(monkeypatch, tmp_path)
        agents = ar.init_registry()
        ids = [a["id"] for a in agents]
        assert "core" in ids
        assert "sap" in ids
        assert "diagnostic" in ids
        assert "voice" in ids
        assert len(agents) >= 10

    def test_get_agent(self, tmp_path, monkeypatch):
        ar = self._patch(monkeypatch, tmp_path)
        ar.init_registry()
        a = ar.get_agent("sap")
        assert a is not None
        assert a["name"] == "Work Agent"

    def test_update_status(self, tmp_path, monkeypatch):
        ar = self._patch(monkeypatch, tmp_path)
        ar.init_registry()
        updated = ar.update_status("sap", "running", last_action="SAP Text generiert")
        assert updated["status"] == "running"
        assert updated["last_action"] == "SAP Text generiert"
        assert updated["call_count"] == 1

    def test_reset_all_status(self, tmp_path, monkeypatch):
        ar = self._patch(monkeypatch, tmp_path)
        ar.init_registry()
        ar.update_status("sap", "running")
        ar.update_status("file", "error")
        ar.reset_all_status()
        agents = ar.get_all()
        for a in agents:
            assert a["status"] in ("idle", "disabled")

    def test_unbekannter_agent_gibt_none(self, tmp_path, monkeypatch):
        ar = self._patch(monkeypatch, tmp_path)
        ar.init_registry()
        assert ar.get_agent("nicht_vorhanden") is None


class TestToolRegistry:
    def _patch(self, monkeypatch, tmp_path):
        import tool_registry
        monkeypatch.setattr(tool_registry, "TOOLS_FILE", tmp_path / "tools.json")
        return tool_registry

    def test_init_erstellt_tools(self, tmp_path, monkeypatch):
        tr = self._patch(monkeypatch, tmp_path)
        tools = tr.init_tools()
        ids = [t["id"] for t in tools]
        assert "file_search" in ids
        assert "sap_text_generate" in ids
        assert "backup_create" in ids
        assert len(tools) >= 15

    def test_get_tool(self, tmp_path, monkeypatch):
        tr = self._patch(monkeypatch, tmp_path)
        tr.init_tools()
        t = tr.get_tool("sap_text_generate")
        assert t is not None
        assert t["risk_level"] == "low"
        assert t["requires_confirmation"] is False

    def test_high_risk_braucht_bestaetigung(self, tmp_path, monkeypatch):
        tr = self._patch(monkeypatch, tmp_path)
        tr.init_tools()
        risky = tr.get_requiring_confirmation()
        ids = [t["id"] for t in risky]
        assert "text_file_write" in ids

    def test_by_category(self, tmp_path, monkeypatch):
        tr = self._patch(monkeypatch, tmp_path)
        tr.init_tools()
        work_tools = tr.get_by_category("work")
        assert len(work_tools) >= 4
        assert all(t["category"] == "work" for t in work_tools)

    def test_record_use(self, tmp_path, monkeypatch):
        tr = self._patch(monkeypatch, tmp_path)
        tr.init_tools()
        tr.record_use("knowledge_search")
        tr.record_use("knowledge_search")
        t = tr.get_tool("knowledge_search")
        assert t["call_count"] == 2
        assert t["last_used"] is not None

    def test_set_enabled(self, tmp_path, monkeypatch):
        tr = self._patch(monkeypatch, tmp_path)
        tr.init_tools()
        tr.set_enabled("mic_status_check", False)
        t = tr.get_tool("mic_status_check")
        assert t["enabled"] is False
