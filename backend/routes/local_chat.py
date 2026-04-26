from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

import agent_registry
from config import DEFAULT_MODEL, JARVIS_PROVIDER, OLLAMA_BASE, PROVIDER_CONFIG
from services import _runtime as core
from services.llm_client import call_llm
from utils import log

router = APIRouter(prefix="/api", tags=["local-chat"])


class ChatMessage(BaseModel):
    role: str = Field(default="user")
    content: str = Field(default="")


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    history: list[ChatMessage] = Field(default_factory=list)
    model: str | None = None
    agent: str | None = None


def _normalize_history(history: list[ChatMessage]) -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    for item in history[-10:]:
        role = item.role if item.role in {"user", "assistant", "system"} else "user"
        content = item.content.strip()
        if content:
            out.append({"role": role, "content": content})
    return out


@router.post("/chat")
def chat(req: ChatRequest) -> dict[str, Any]:
    user_text = req.message.strip()
    agent_id, reason, confidence = core.classify_agent(user_text)
    if req.agent:
        agent_id = req.agent.strip().lower()
        reason = "Manuell gesetzter Agent"
        confidence = 1.0

    model = (req.model or DEFAULT_MODEL or "qwen3:8b").strip()
    messages = core.build_messages(
        user_input=user_text,
        history=_normalize_history(req.history),
        memory_facts=[],
        agent=agent_id,
    )

    agent_registry.update_status(agent_id, "running", last_action=user_text[:160])
    try:
        answer = str(call_llm(messages, model, temperature=0.35, stream=False)).strip()
        if not answer:
            answer = "Ich habe vom LLM Provider eine leere Antwort bekommen."
        agent_registry.update_status(agent_id, "idle", last_action="Antwort erstellt")
        return {
            "ok": True,
            "agent": agent_id,
            "reason": reason,
            "confidence": confidence,
            "model": model,
            "response": answer,
        }
    except Exception as exc:
        log("ERROR", "local chat failed", error=str(exc), agent=agent_id)
        agent_registry.update_status(agent_id, "error", last_action=str(exc)[:160], error=True)
        raise HTTPException(status_code=500, detail=f"Chat Fehler: {exc}") from exc


@router.get("/chat/health")
def chat_health() -> dict[str, Any]:
    provider_config = PROVIDER_CONFIG.get(JARVIS_PROVIDER, {})
    online = core.ollama_online() if JARVIS_PROVIDER == "ollama" else bool(provider_config.get("api_key"))
    return {
        "ok": online,
        "provider": JARVIS_PROVIDER,
        "ollama": OLLAMA_BASE,
        "model": DEFAULT_MODEL,
    }
