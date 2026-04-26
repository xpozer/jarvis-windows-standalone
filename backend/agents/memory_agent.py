"""
JARVIS MemoryAgent
Zustaendig fuer: Fakten speichern, abrufen,
Kontext aus Memory-DB lesen.
"""

import json
import urllib.request
from .base_agent import BaseAgent, AgentContext, AgentResult

SYSTEM = """Du bist der Memory-Spezialist von JARVIS.
Deine Aufgaben:
- Wichtige Informationen aus dem Gesprächsverlauf extrahieren
- Bestehende Fakten zusammenfassen und einordnen
- Widersprüche in gespeicherten Fakten erkennen
- Auf Fakten antworten die der Nutzer gespeichert hat

Antworte kurz und direkt auf Deutsch."""

class MemoryAgent(BaseAgent):
    name        = "memory"
    description = "Fakten speichern, abrufen, Memory-Kontext verwalten"

    def _fetch_memory(self, ctx: AgentContext) -> list[str]:
        """Holt Fakten aus dem Stanford-Memory-Endpoint falls verfügbar."""
        try:
            req = urllib.request.Request(
                f"{ctx.api_url}/memory/search",
                data=json.dumps({"query": ctx.user_input, "limit": 8}).encode(),
                headers={"Content-Type": "application/json"}, method="POST"
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read())
                return [r.get("content","") for r in data.get("results",[])]
        except Exception:
            return ctx.memory_facts  # Fallback auf uebergebene Facts

    def run(self, ctx: AgentContext) -> AgentResult:
        tool_log = []
        facts = self._fetch_memory(ctx)
        tool_log.append(f"{len(facts)} Fakten geladen")

        facts_block = "\n".join(f"- {f}" for f in facts) if facts else "Keine Fakten gespeichert."
        messages = [
            {"role": "system", "content": SYSTEM + f"\n\nGespeicherte Fakten:\n{facts_block}"},
            *[{"role": m["role"], "content": m["content"]} for m in ctx.history[-4:]],
            {"role": "user", "content": ctx.user_input},
        ]
        content = self.llm(messages, ctx, temperature=0.2)
        return AgentResult(agent=self.name, content=content, tool_log=tool_log)

    def run_stream(self, ctx):
        facts = self._fetch_memory(ctx)
        facts_block = "\n".join(f"- {f}" for f in facts) if facts else "Keine Fakten gespeichert."
        messages = [
            {"role": "system", "content": SYSTEM + f"\n\nGespeicherte Fakten:\n{facts_block}"},
            *[{"role": m["role"], "content": m["content"]} for m in ctx.history[-4:]],
            {"role": "user", "content": ctx.user_input},
        ]
        yield from self.llm_stream(messages, ctx, temperature=0.2)
