"""
JARVIS VDE-Agent
Durchsucht die lokale VDE-Norm-Datenbank und gibt praezise
Norm-Referenzen, Prueffristen und Anwendungsbereiche.
"""

import json
from pathlib import Path
from .base_agent import BaseAgent, AgentContext, AgentResult

NORMEN_FILE = Path(__file__).parent.parent / "jarvis_skills" / "vde_datenbank" / "normen.json"

def load_normen() -> list:
    if NORMEN_FILE.exists():
        try:
            return json.loads(NORMEN_FILE.read_text(encoding="utf-8"))
        except Exception:
            return []
    return []

def search_normen(query: str, normen: list) -> list:
    """Durchsucht Normen nach Stichworten, Nr oder Titel."""
    query_lower = query.lower()
    terms = query_lower.split()
    results = []
    for n in normen:
        score = 0
        searchable = f"{n.get('nr','')} {n.get('titel','')} {n.get('bereich','')} {n.get('stichworte','')}".lower()
        for term in terms:
            if term in searchable:
                score += 1
            # Exakter Norm-Nr Match bonus
            if term in n.get("nr","").lower():
                score += 3
        if score > 0:
            results.append((score, n))
    results.sort(key=lambda x: -x[0])
    return [r[1] for r in results[:8]]

SYSTEM = """Du bist der VDE-Norm-Spezialist von JARVIS.
Nutzer: Julien Negro, Elektro-Arbeitsplaner bei Bayer/Tectrion.

Deine Aufgaben:
- Die richtige Norm fuer eine Fragestellung finden
- Prueffristen nach DGUV V3 / VDE 0105-100 bestimmen
- Normhierarchie erklaeren (welche Norm gilt wo)
- Anwendungsbereiche abgrenzen (VDE 0100-600 vs VDE 0105-100 etc.)
- Korrekte Norm-Nummern angeben

WICHTIG:
- VDE 0100-600 = Erstpruefung (vor Inbetriebnahme)
- VDE 0105-100 = Wiederkehrende Pruefung (im Betrieb)
- Das sind VERSCHIEDENE Normen, nicht verwechseln!
- DGUV V3 = Unfallverhuetungsvorschrift (rechtliche Grundlage)
- TRBS 1201 = Pruefung nach BetrSichV

Antworte praezise, mit korrekten Norm-Nummern. Deutsch."""

class VDEAgent(BaseAgent):
    name        = "vde"
    description = "VDE/DGUV Normen, Prueffristen, Anwendungsbereiche"

    def run(self, ctx: AgentContext) -> AgentResult:
        tool_log = []
        normen = load_normen()
        tool_log.append(f"{len(normen)} Normen in Datenbank")

        # Suche
        results = search_normen(ctx.user_input, normen)
        tool_log.append(f"{len(results)} Treffer")

        norm_block = ""
        if results:
            lines = []
            for n in results:
                line = f"{n['nr']}: {n['titel']} ({n['bereich']})"
                if n.get("pruefung"):
                    line += f" | Frist: {n.get('frist','')}"
                lines.append(line)
            norm_block = "\n\nRelevante Normen aus der Datenbank:\n" + "\n".join(lines)

        skill_ctx = self.get_skill_context(ctx)
        messages = [
            {"role": "system", "content": SYSTEM + norm_block + skill_ctx},
            *[{"role": m["role"], "content": m["content"]} for m in ctx.history[-4:]],
            {"role": "user", "content": ctx.user_input},
        ]
        content = self.llm(messages, ctx, temperature=0.1)
        return AgentResult(agent=self.name, content=content, tool_log=tool_log)

    def run_stream(self, ctx):
        normen = load_normen()
        results = search_normen(ctx.user_input, normen)
        norm_block = ""
        if results:
            lines = [f"{n['nr']}: {n['titel']} ({n['bereich']})" +
                     (f" | Frist: {n.get('frist','')}" if n.get("pruefung") else "")
                     for n in results]
            norm_block = "\n\nRelevante Normen:\n" + "\n".join(lines)
        skill_ctx = self.get_skill_context(ctx)
        messages = [
            {"role": "system", "content": SYSTEM + norm_block + skill_ctx},
            *[{"role": m["role"], "content": m["content"]} for m in ctx.history[-4:]],
            {"role": "user", "content": ctx.user_input},
        ]
        yield from self.llm_stream(messages, ctx, temperature=0.1)
