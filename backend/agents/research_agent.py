"""
JARVIS ResearchAgent
Zustaendig fuer: Websuche (DuckDuckGo),
Norm-Recherche, technische Fachfragen.
"""

import urllib.request
import urllib.parse
import json
from .base_agent import BaseAgent, AgentContext, AgentResult

def search_ddg(query: str, max_results: int = 4) -> str:
    try:
        url = f"https://api.duckduckgo.com/?q={urllib.parse.quote(query)}&format=json&no_html=1&skip_disambig=1"
        with urllib.request.urlopen(url, timeout=8) as resp:
            data = json.loads(resp.read())
        lines = [f'Suche: "{query}"']
        if data.get("AbstractText"):
            lines.append(data["AbstractText"])
            if data.get("AbstractURL"): lines.append(f"Quelle: {data['AbstractURL']}")
        topics = [t["Text"] for t in data.get("RelatedTopics", []) if t.get("Text")][:max_results]
        if topics: lines.extend(topics)
        if data.get("Answer"): lines.append(f"Direkt: {data['Answer']}")
        return "\n".join(lines) if len(lines) > 1 else "Keine Ergebnisse."
    except Exception as e:
        return f"Suche fehlgeschlagen: {e}"

SYSTEM = """Du bist der Recherche-Spezialist von JARVIS.
Nutzer: Julien Negro, Elektro-Arbeitsplaner, Leverkusen.

Deine Aufgaben:
- Technische Fachfragen beantworten
- Normen und Regelwerke erklären (VDE, DGUV, TRBS, DIN)
- Websuche-Ergebnisse zusammenfassen und einordnen
- Industriemeister-Prüfungsstoff erklären (BwHa, MIKP, ZIB, NTG)
- Elektrische Berechnungen erläutern

Wenn Suchergebnisse bereitgestellt werden, nutze sie als Basis.
Antworte präzise, technisch korrekt, auf Deutsch."""

class ResearchAgent(BaseAgent):
    name        = "research"
    description = "Websuche, Normen, technische Fachfragen, IM-Stoff"

    def run(self, ctx: AgentContext) -> AgentResult:
        tool_log = []
        search_ctx = ""
        # Kurze Suchanfrage aus Input ableiten (erste 60 Zeichen)
        query = ctx.user_input[:80].strip()
        tool_log.append(f"Suche: {query}")
        search_ctx = search_ddg(query)
        tool_log.append(f"Ergebnisse: {len(search_ctx)} Zeichen")

        sys_content = SYSTEM
        if search_ctx:
            sys_content += f"\n\nSuchergebnisse:\n{search_ctx}"

        messages = [
            {"role": "system", "content": sys_content},
            *[{"role": m["role"], "content": m["content"]} for m in ctx.history[-4:]],
            {"role": "user", "content": ctx.user_input},
        ]
        content = self.llm(messages, ctx, temperature=0.3)
        return AgentResult(agent=self.name, content=content, tool_log=tool_log)

    def run_stream(self, ctx):
        query = ctx.user_input[:80].strip()
        search_ctx = search_ddg(query)
        sys_content = SYSTEM + (f"\n\nSuchergebnisse:\n{search_ctx}" if search_ctx else "")
        messages = [
            {"role": "system", "content": sys_content},
            *[{"role": m["role"], "content": m["content"]} for m in ctx.history[-4:]],
            {"role": "user", "content": ctx.user_input},
        ]
        yield from self.llm_stream(messages, ctx, temperature=0.3)
