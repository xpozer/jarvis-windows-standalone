"""
JARVIS ExamAgent (IM-Pruefung)
Industriemeister-Pruefungsvorbereitung:
- Erkennt Aufgabentyp (MC, Berechnung, Freitext)
- Stellt Fragen einzeln
- Wertet Antworten aus
- Sammelt Schwachstellen fuer Lernkarten
"""

from .base_agent import BaseAgent, AgentContext, AgentResult
from persistent_memory import AgentMemory

SYSTEM = """Du bist der Pruefungs-Coach von JARVIS fuer die IHK Industriemeisterpruefung Elektrotechnik.
Nutzer: Julien Negro. Basisqualifikation ist abgeschlossen. Aktuelle Faecher: BwHa, MIKP, ZIB, NTG.

Deine Aufgaben:
- Pruefungsfragen stellen (einzeln, eine nach der anderen)
- Aufgabentyp erkennen: Multiple Choice, Berechnung, Freitext
- Antworten bewerten und korrigieren
- Wissensluecken identifizieren und gezielt trainieren
- Am Ende einer Session Lernkarten erstellen

WICHTIGE REGELN:
- Loesungen NIEMALS direkt unter die Frage
- Immer erst auf Juliens Antwort warten
- Bei falscher Antwort: erklaeren WARUM falsch, richtige Loesung zeigen
- Bei Berechnungen: Loesungsweg Schritt fuer Schritt
- Schwierige Themen merken fuer spaetere Wiederholung

Wenn Julien ein Foto einer Aufgabe schickt: direkt analysieren und antworten, keine Rueckfrage.

Faecher-Schwerpunkte:
- BwHa: Kosten, Kalkulation, BAB, Deckungsbeitrag, Break-Even
- MIKP: Mitarbeiterfuehrung, Arbeitsrecht, Qualitaetsmanagement
- ZIB: Zusammenarbeit im Betrieb, Kommunikation, Moderation
- NTG: Elektrotechnik, Mathematik, Physik, Steuerungstechnik

Antworte auf Deutsch. Praezise, fachlich korrekt."""

class ExamAgent(BaseAgent):
    name        = "exam"
    description = "IM-Pruefungsvorbereitung: Fragen, Auswertung, Lernkarten"

    def run(self, ctx: AgentContext) -> AgentResult:
        self.mem = AgentMemory("exam")
        tool_log = ["Pruefungs-Kontext geladen"]

        # Schwachstellen aus Memory laden
        weak_topics = self.mem.get("weak_topics", [])
        session_score = self.mem.get("current_session", {"correct": 0, "wrong": 0, "topics": []})
        mem_block = ""
        if weak_topics:
            mem_block += f"\n\nBekannte Schwachstellen:\n" + "\n".join(f"- {t}" for t in weak_topics[-10:])
        if session_score.get("correct", 0) + session_score.get("wrong", 0) > 0:
            mem_block += f"\n\nAktuelle Session: {session_score['correct']} richtig, {session_score['wrong']} falsch"

        skill_ctx = self.get_skill_context(ctx)
        sys_content = SYSTEM + mem_block + skill_ctx

        messages = [
            {"role": "system", "content": sys_content},
            *[{"role": m["role"], "content": m["content"]} for m in ctx.history[-8:]],
            {"role": "user", "content": ctx.user_input},
        ]
        content = self.llm(messages, ctx, temperature=0.3)

        # Schwachstellen-Tracking: wenn "falsch" oder "nicht korrekt" in Antwort
        lower_content = content.lower()
        if "falsch" in lower_content or "nicht korrekt" in lower_content or "leider nein" in lower_content:
            session_score["wrong"] = session_score.get("wrong", 0) + 1
            self.mem.set("current_session", session_score)
        elif "richtig" in lower_content or "korrekt" in lower_content or "genau" in lower_content:
            session_score["correct"] = session_score.get("correct", 0) + 1
            self.mem.set("current_session", session_score)

        return AgentResult(agent=self.name, content=content, tool_log=tool_log)

    def run_stream(self, ctx):
        self.mem = AgentMemory("exam")
        weak_topics = self.mem.get("weak_topics", [])
        mem_block = ""
        if weak_topics:
            mem_block += f"\n\nBekannte Schwachstellen:\n" + "\n".join(f"- {t}" for t in weak_topics[-10:])

        skill_ctx = self.get_skill_context(ctx)
        messages = [
            {"role": "system", "content": SYSTEM + mem_block + skill_ctx},
            *[{"role": m["role"], "content": m["content"]} for m in ctx.history[-8:]],
            {"role": "user", "content": ctx.user_input},
        ]
        yield from self.llm_stream(messages, ctx, temperature=0.3)
