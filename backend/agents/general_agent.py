"""
JARVIS GeneralAgent
Fallback fuer alles was kein spezialisierter Agent abdeckt.
Nutzt den vollen JARVIS-Persoenlichkeitsprompt.
"""

from .base_agent import BaseAgent, AgentContext, AgentResult
from persistent_memory import AgentMemory

SYSTEM = """Du bist JARVIS — persönlicher KI-Assistent von Julien Negro.
Kühl, präzise, kompetent. Kein Smalltalk, kein Overkill.
Julien: Arbeitsplaner Elektro, Bayer/Tectrion Leverkusen, SAP PM, VDE-Normen,
IM-Prüfung (BwHa, MIKP, ZIB, NTG), Path of Exile.
Direkt zur Antwort. Deutsch. Kein KI-Ton."""


class GeneralAgent(BaseAgent):
    name = "general"
    description = "Allgemeine Fragen, Gespräch, Fallback"

    def run(self, ctx: AgentContext) -> AgentResult:
        pmem = AgentMemory("general")
        pmem_summary = pmem.get_summary()
        mem = "\n".join(f"- {f}" for f in ctx.memory_facts) if ctx.memory_facts else ""
        sys_content = SYSTEM
        if pmem_summary:
            sys_content += f"\n\nPersistentes Gedächtnis:\n{pmem_summary}"
        if mem:
            sys_content += f"\n\nGedächtnis:\n{mem}"
        messages = [
            {"role": "system", "content": sys_content},
            *[{"role": m["role"], "content": m["content"]} for m in ctx.history[-6:]],
            {"role": "user", "content": ctx.user_input},
        ]
        content = self.llm(messages, ctx, temperature=0.5)
        return AgentResult(agent=self.name, content=content, tool_log=["General-Fallback"])

    def run_stream(self, ctx):
        pmem = AgentMemory("general")
        pmem_summary = pmem.get_summary()
        mem = "\n".join(f"- {f}" for f in ctx.memory_facts) if ctx.memory_facts else ""
        sys_content = SYSTEM
        if pmem_summary:
            sys_content += f"\n\nPersistentes Gedächtnis:\n{pmem_summary}"
        if mem:
            sys_content += f"\n\nGedächtnis:\n{mem}"
        messages = [
            {"role": "system", "content": sys_content},
            *[{"role": m["role"], "content": m["content"]} for m in ctx.history[-6:]],
            {"role": "user", "content": ctx.user_input},
        ]
        yield from self.llm_stream(messages, ctx, temperature=0.5)
