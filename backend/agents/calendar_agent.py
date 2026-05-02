import datetime
from .base_agent import BaseAgent, AgentContext, AgentResult
from persistent_memory import AgentMemory

def get_calendar_context() -> str:
    now = datetime.datetime.now()
    def kw(d):
        date = datetime.date(d.year, d.month, d.day)
        return date.isocalendar()[1]
    lines = [
        f"Heute: {now.strftime('%A, %d.%m.%Y')}",
        f"Uhrzeit: {now.strftime('%H:%M')} Uhr",
        f"Kalenderwoche: KW {kw(now)}",
        f"Quartal: Q{(now.month-1)//3+1}/{now.year}",
    ]
    return "\n".join(lines)

SYSTEM = """Du bist der Kalender- und Planungs-Spezialist von JARVIS.
Dein Nutzer ist Julien Negro, Arbeitsplaner bei Bayer/Tectrion Leverkusen.

Deine Aufgaben:
- Terminplanung und Fristberechnung
- Wartungsintervalle berechnen (z.B. DGUV V3: jährlich, alle 4 Jahre etc.)
- Prüffristen nach VDE/DGUV bestimmen
- Kalenderwochen und Quartale berechnen
- Schicht- und Ressourcenplanung unterstützen
- Erinnerungen und Deadlines strukturieren
- IM-Prüfungstermine und Lernpläne

Antworte immer auf Deutsch. Sei konkret mit Daten und Fristen."""

class CalendarAgent(BaseAgent):
    name        = "calendar"
    description = "Terminplanung, KW, Wartungsintervalle, Prüffristen"

    def run(self, ctx: AgentContext) -> AgentResult:
        cal_ctx = get_calendar_context()
        mem = AgentMemory("calendar")
        mem_summary = mem.get_summary()
        tool_log = [f"Kalender-Kontext: {cal_ctx.splitlines()[0]}"]
        sys_extra = f"\n\nAktuell:\n{cal_ctx}"
        if mem_summary:
            sys_extra += f"\n\nGespeicherter Kontext:\n{mem_summary}"
        messages = [
            {"role": "system", "content": SYSTEM + sys_extra},
            *[{"role": m["role"], "content": m["content"]} for m in ctx.history[-4:]],
            {"role": "user", "content": ctx.user_input},
        ]
        content = self.llm(messages, ctx, temperature=0.2)
        return AgentResult(agent=self.name, content=content, tool_log=tool_log)

    def run_stream(self, ctx):
        cal_ctx = get_calendar_context()
        mem = AgentMemory("calendar")
        mem_summary = mem.get_summary()
        sys_extra = f"\n\nAktuell:\n{cal_ctx}"
        if mem_summary:
            sys_extra += f"\n\nGespeicherter Kontext:\n{mem_summary}"
        messages = [
            {"role": "system", "content": SYSTEM + sys_extra},
            *[{"role": m["role"], "content": m["content"]} for m in ctx.history[-4:]],
            {"role": "user", "content": ctx.user_input},
        ]
        yield from self.llm_stream(messages, ctx, temperature=0.2)
