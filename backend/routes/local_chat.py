from __future__ import annotations

import json
from typing import Any
from urllib import error, request

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

import agent_registry
from config import DEFAULT_MODEL, OLLAMA_BASE
from services import _runtime as core
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


def _post_json(url: str, payload: dict[str, Any], timeout: int = 180) -> dict[str, Any]:
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            return json.loads(raw) if raw.strip() else {}
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise HTTPException(status_code=502, detail=f"Ollama HTTP Fehler {exc.code}: {detail}") from exc
    except error.URLError as exc:
        raise HTTPException(status_code=503, detail=f"Ollama ist nicht erreichbar: {exc.reason}") from exc
    except TimeoutError as exc:
        raise HTTPException(status_code=504, detail="Ollama Antwort Timeout") from exc


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
        payload = {
            "model": model,
            "messages": messages,
            "stream": False,
            "options": {
                "temperature": 0.35,
                "top_p": 0.9,
            },
        }
        result = _post_json(f"{OLLAMA_BASE.rstrip('/')}/api/chat", payload)
        answer = ""
        if isinstance(result.get("message"), dict):
            answer = str(result["message"].get("content") or "").strip()
        if not answer:
            answer = core.normalize_backend_text(result).strip()
        if not answer:
            answer = "Ich habe von Ollama eine leere Antwort bekommen."
        agent_registry.update_status(agent_id, "idle", last_action="Antwort erstellt")
        return {
            "ok": True,
            "agent": agent_id,
            "reason": reason,
            "confidence": confidence,
            "model": model,
            "response": answer,
        }
    except HTTPException:
        agent_registry.update_status(agent_id, "error", last_action="Ollama Fehler", error=True)
        raise
    except Exception as exc:
        log("ERROR", "local chat failed", error=str(exc), agent=agent_id)
        agent_registry.update_status(agent_id, "error", last_action=str(exc)[:160], error=True)
        raise HTTPException(status_code=500, detail=f"Chat Fehler: {exc}") from exc


@router.get("/chat/health")
def chat_health() -> dict[str, Any]:
    online = core.ollama_online()
    return {
        "ok": online,
        "ollama": OLLAMA_BASE,
        "model": DEFAULT_MODEL,
    }
