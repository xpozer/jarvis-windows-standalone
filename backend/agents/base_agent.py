"""
JARVIS BaseAgent
Gemeinsame Basis fuer alle Sub-Agenten.
"""

import json
from typing import Generator
from dataclasses import dataclass, field

from services.llm_client import call_llm


@dataclass
class AgentContext:
    user_input:   str
    api_url:      str  = "http://localhost:8000"
    model:        str  = "qwen3:8b"
    memory_facts: list = field(default_factory=list)
    history:      list = field(default_factory=list)
    extra:        dict = field(default_factory=dict)


@dataclass
class AgentResult:
    agent:    str
    content:  str
    tool_log: list = field(default_factory=list)
    error:    str  = ""


class BaseAgent:
    name:        str = "base"
    description: str = ""

    def llm(self, messages: list, ctx: AgentContext, temperature: float = 0.3) -> str:
        try:
            return str(call_llm(messages, ctx.model, temperature=temperature, stream=False))
        except Exception as e:
            return f"[LLM-Fehler: {e}]"

    def llm_stream(self, messages: list, ctx: AgentContext, temperature: float = 0.3) -> Generator[str, None, None]:
        try:
            yield from call_llm(messages, ctx.model, temperature=temperature, stream=True)
        except Exception as e:
            yield f"[Stream-Fehler: {e}]"

    def extract_json(self, text: str) -> dict:
        text = text.strip()
        if text.startswith("```"):
            parts = text.split("```")
            text = parts[1] if len(parts) > 1 else text
            if text.startswith("json"): text = text[4:].lstrip("\n")
        try:
            return json.loads(text.strip())
        except Exception:
            return {}

    def get_skill_context(self, ctx: AgentContext) -> str:
        """Holt Skill-Kontext aus ctx.extra falls vorhanden."""
        return ctx.extra.get("skills", "")

    def run(self, ctx: AgentContext) -> AgentResult:
        raise NotImplementedError

    def run_stream(self, ctx: AgentContext) -> Generator[str, None, None]:
        result = self.run(ctx)
        yield f"[Fehler: {result.error}]" if result.error else result.content
