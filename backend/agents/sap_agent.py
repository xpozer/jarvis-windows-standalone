"""
JARVIS SAPAgent
Zustaendig fuer: SAP PM Texte, Transaktionshilfe,
Auftragsbeschreibungen, Leistungsnachweise, VDE-Norm-Vorschlaege.
"""

from .base_agent import BaseAgent, AgentContext, AgentResult
from persistent_memory import AgentMemory

SYSTEM = """Du bist der SAP-Spezialist von JARVIS.
Dein Nutzer ist Julien Negro, Arbeitsplaner Elektro bei Bayer/Tectrion Leverkusen.
Er arbeitet täglich mit SAP PM (Plant Maintenance) und FSM.

Deine Aufgaben:
- SAP-Auftragstexte schreiben (kurz, technisch präzise, kein KI-Ton)
- Leistungsnachweise formulieren
- Transaktionscodes erklären (IW31, IW32, IW38, IW41, IW51 etc.)
- Meldungstexte verfassen
- VDE-Normen vorschlagen wenn relevant (VDE 0100, VDE 0105, DGUV V3 etc.)
- Fehleranalysen für SAP-Meldungen unterstützen

Schreibstil für SAP-Texte:
- Aktiv, direkt, technisch korrekt
- Keine Füllwörter, kein KI-Ton
- Industrietypisch formuliert
- Kurz aber vollständig

Antworte immer auf Deutsch."""

class SAPAgent(BaseAgent):
    name        = "sap"
    description = "SAP PM Texte, Transaktionen, Leistungsnachweise, VDE-Normen"

    def run(self, ctx: AgentContext) -> AgentResult:
        self.mem = AgentMemory("sap")
        tool_log = ["SAP-Kontext geladen"]
        # Persistente Daten in Kontext laden
        mem_summary = self.mem.get_summary()
        if mem_summary:
            tool_log.append(f"Memory: {len(self.mem.get_all())} Eintraege")
        skill_ctx = self.get_skill_context(ctx)
        sys_content = SYSTEM + skill_ctx
        if mem_summary:
            sys_content += f"\n\nGespeicherter Kontext:\n{mem_summary}"
        messages = [
            {"role": "system", "content": sys_content},
            *[{"role": m["role"], "content": m["content"]} for m in ctx.history[-4:]],
            {"role": "user", "content": ctx.user_input},
        ]
        content = self.llm(messages, ctx, temperature=0.2)
        return AgentResult(agent=self.name, content=content, tool_log=tool_log)

    def run_stream(self, ctx):
        skill_ctx = self.get_skill_context(ctx)
        sys_content = SYSTEM + skill_ctx
        if mem_summary:
            sys_content += f"\n\nGespeicherter Kontext:\n{mem_summary}"
        messages = [
            {"role": "system", "content": sys_content},
            *[{"role": m["role"], "content": m["content"]} for m in ctx.history[-4:]],
            {"role": "user", "content": ctx.user_input},
        ]
        yield from self.llm_stream(messages, ctx, temperature=0.2)
