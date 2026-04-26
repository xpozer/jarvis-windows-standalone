"""
JARVIS BaseAgent
Gemeinsame Basis fuer alle Sub-Agenten.
"""

import json
import urllib.request
from typing import Generator
from dataclasses import dataclass, field

from config import OLLAMA_OPENAI


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
        payload = json.dumps({
            "model": ctx.model, "messages": messages,
            "stream": False, "temperature": temperature,
        }).encode()
        req = urllib.request.Request(
            OLLAMA_OPENAI, data=payload,
            headers={"Content-Type": "application/json"}, method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = json.loads(resp.read())
                return data["choices"][0]["message"]["content"].strip()
        except Exception as e:
            return f"[LLM-Fehler: {e}]"

    def llm_stream(self, messages: list, ctx: AgentContext, temperature: float = 0.3) -> Generator[str, None, None]:
        payload = json.dumps({
            "model": ctx.model, "messages": messages,
            "stream": True, "temperature": temperature,
        }).encode()
        req = urllib.request.Request(
            OLLAMA_OPENAI, data=payload,
            headers={"Content-Type": "application/json"}, method="POST"
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                for line in resp:
                    line = line.decode("utf-8").strip()
                    if not line.startswith("data:"): continue
                    raw = line[5:].strip()
                    if raw == "[DONE]": break
                    try:
                        delta = json.loads(raw)["choices"][0]["delta"].get("content","")
                        if delta: yield delta
                    except Exception: continue
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
