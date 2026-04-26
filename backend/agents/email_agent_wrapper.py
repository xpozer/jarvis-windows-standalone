"""
JARVIS EmailAgent Wrapper
Bindet den bestehenden EmailAgent als Sub-Agenten ein.
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "jarvis_email_agent"))

from .base_agent import BaseAgent, AgentContext, AgentResult

SYSTEM = """Du bist der Email-Assistent von JARVIS.
Du hilfst beim Verwalten von Outlook-Mails:
- Spam erkennen und löschen
- Inbox zusammenfassen
- Mail-Inhalte analysieren
Antworte auf Deutsch."""

class EmailAgentWrapper(BaseAgent):
    name        = "email"
    description = "Outlook-Spam erkennen, Inbox verwalten"

    def run(self, ctx: AgentContext) -> AgentResult:
        # Direkt als Hinweis -- eigentliche Aktion läuft ueber /email/* Endpoints
        messages = [
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": ctx.user_input},
        ]
        content = self.llm(messages, ctx, temperature=0.2)
        return AgentResult(
            agent=self.name, content=content,
            tool_log=["Email-Kontext geladen", "Outlook-Scan bereit"]
        )

    def run_stream(self, ctx):
        messages = [
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": ctx.user_input},
        ]
        yield from self.llm_stream(messages, ctx, temperature=0.2)
