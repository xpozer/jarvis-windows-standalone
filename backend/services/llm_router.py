from __future__ import annotations

import json
import socket
import time
from typing import Any, Dict, List, Optional
from urllib import error, request

from fastapi import HTTPException

from config import (
    DEFAULT_MODEL,
    LLM_PROVIDER,
    OLLAMA_BASE,
    OPENROUTER_API_KEY,
    OPENROUTER_APP_TITLE,
    OPENROUTER_BASE_URL,
    OPENROUTER_FALLBACK_TO_OLLAMA,
    OPENROUTER_HTTP_REFERER,
    OPENROUTER_MODEL,
)
from utils import log


Message = Dict[str, str]


def _json_request(
    url: str,
    payload: Optional[dict[str, Any]] = None,
    headers: Optional[dict[str, str]] = None,
    timeout: int = 75,
) -> dict[str, Any]:
    data = None if payload is None else json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json", **(headers or {})},
        method="POST" if payload is not None else "GET",
    )
    try:
        with request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            return json.loads(raw) if raw.strip() else {}
    except error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise HTTPException(status_code=502, detail=f"LLM HTTP Fehler {exc.code}: {detail}") from exc
    except (error.URLError, ConnectionRefusedError) as exc:
        reason = getattr(exc, "reason", exc)
        raise HTTPException(status_code=503, detail=f"LLM Provider nicht erreichbar: {reason}") from exc
    except (TimeoutError, socket.timeout) as exc:
        raise HTTPException(status_code=504, detail="LLM Antwort Timeout") from exc


def _normalize_messages(messages: list[dict[str, Any]]) -> list[Message]:
    out: list[Message] = []
    for item in messages or []:
        if not isinstance(item, dict):
            continue
        role = str(item.get("role") or "user").strip().lower()
        if role not in {"system", "user", "assistant", "tool"}:
            role = "user"
        content = item.get("content")
        if isinstance(content, list):
            # OpenRouter versteht zwar multimodal, aber der lokale Fallback nicht.
            # Textteile bleiben erhalten, andere Parts werden sauber ignoriert.
            text_parts: list[str] = []
            for part in content:
                if isinstance(part, dict) and part.get("type") in {"text", "input_text"}:
                    text_parts.append(str(part.get("text") or ""))
                elif isinstance(part, str):
                    text_parts.append(part)
            content = "\n".join(p for p in text_parts if p.strip())
        content = str(content or "").strip()
        if content:
            out.append({"role": role, "content": content})
    return out


def _extract_openai_text(data: dict[str, Any]) -> str:
    choices = data.get("choices")
    if isinstance(choices, list) and choices:
        first = choices[0] if isinstance(choices[0], dict) else {}
        msg = first.get("message") if isinstance(first, dict) else None
        if isinstance(msg, dict):
            content = msg.get("content")
            if isinstance(content, str):
                return content.strip()
        text = first.get("text") if isinstance(first, dict) else None
        if isinstance(text, str):
            return text.strip()
    return ""


def openrouter_available() -> bool:
    return bool(str(OPENROUTER_API_KEY or "").strip())


def openrouter_chat(
    messages: list[dict[str, Any]],
    model: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 2048,
) -> dict[str, Any]:
    if not openrouter_available():
        raise HTTPException(status_code=424, detail="OPENROUTER_API_KEY fehlt. Bitte lokal als Umgebungsvariable setzen.")

    selected_model = (model or OPENROUTER_MODEL or "openrouter/free").strip()
    clean_messages = _normalize_messages(messages)
    if not clean_messages:
        raise HTTPException(status_code=400, detail="Keine Chat Nachrichten übergeben.")

    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": OPENROUTER_HTTP_REFERER,
        "X-Title": OPENROUTER_APP_TITLE,
    }
    payload = {
        "model": selected_model,
        "messages": clean_messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }
    data = _json_request(f"{OPENROUTER_BASE_URL.rstrip('/')}/chat/completions", payload, headers=headers, timeout=90)
    answer = _extract_openai_text(data)
    if not answer:
        answer = "Ich habe vom OpenRouter Provider eine leere Antwort bekommen."
    return {"provider": "openrouter", "model": selected_model, "response": answer, "raw": data}


def ollama_chat(
    messages: list[dict[str, Any]],
    model: Optional[str] = None,
    temperature: float = 0.35,
    max_tokens: int = 700,
) -> dict[str, Any]:
    selected_model = (model or DEFAULT_MODEL or "qwen3:8b").strip()
    clean_messages = _normalize_messages(messages)
    if not clean_messages:
        raise HTTPException(status_code=400, detail="Keine Chat Nachrichten übergeben.")

    payload = {
        "model": selected_model,
        "messages": clean_messages,
        "stream": False,
        "options": {
            "temperature": temperature,
            "top_p": 0.9,
            "num_predict": max_tokens,
        },
    }
    data = _json_request(f"{OLLAMA_BASE.rstrip('/')}/api/chat", payload, timeout=75)
    answer = ""
    if isinstance(data.get("message"), dict):
        answer = str(data["message"].get("content") or "").strip()
    if not answer:
        answer = json.dumps(data, ensure_ascii=False, indent=2)
    return {"provider": "ollama", "model": selected_model, "response": answer, "raw": data}


def chat(
    messages: list[dict[str, Any]],
    model: Optional[str] = None,
    provider: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 2048,
) -> dict[str, Any]:
    selected_provider = (provider or LLM_PROVIDER or "openrouter").strip().lower()
    if selected_provider in {"openrouter", "openrouter-free", "free"}:
        try:
            return openrouter_chat(messages, model=model or OPENROUTER_MODEL, temperature=temperature, max_tokens=max_tokens)
        except HTTPException as exc:
            if not OPENROUTER_FALLBACK_TO_OLLAMA:
                raise
            log("WARN", "OpenRouter fehlgeschlagen, fallback auf Ollama", error=str(exc.detail))
            return ollama_chat(messages, model=None, temperature=0.35, max_tokens=min(max_tokens, 900))
    if selected_provider in {"ollama", "local"}:
        return ollama_chat(messages, model=model, temperature=temperature, max_tokens=max_tokens)
    raise HTTPException(status_code=400, detail=f"Unbekannter LLM Provider: {selected_provider}")


def openai_compatible_response(
    messages: list[dict[str, Any]],
    model: Optional[str] = None,
    provider: Optional[str] = None,
    temperature: float = 0.7,
    max_tokens: int = 2048,
) -> dict[str, Any]:
    result = chat(messages=messages, model=model, provider=provider, temperature=temperature, max_tokens=max_tokens)
    created = int(time.time())
    selected_model = result.get("model") or model or DEFAULT_MODEL
    answer = result.get("response") or ""
    return {
        "id": f"chatcmpl-jarvis-{created}",
        "object": "chat.completion",
        "created": created,
        "model": selected_model,
        "provider": result.get("provider"),
        "choices": [
            {
                "index": 0,
                "message": {"role": "assistant", "content": answer},
                "finish_reason": "stop",
            }
        ],
    }


def models_payload() -> dict[str, Any]:
    return {
        "object": "list",
        "provider": LLM_PROVIDER,
        "data": [
            {"id": OPENROUTER_MODEL or "openrouter/free", "object": "model", "owned_by": "openrouter"},
            {"id": "qwen3:8b", "object": "model", "owned_by": "ollama-fallback"},
        ],
    }


def health_payload() -> dict[str, Any]:
    return {
        "ok": True,
        "provider": LLM_PROVIDER,
        "main": "openrouter",
        "main_model": OPENROUTER_MODEL,
        "openrouter_key_present": openrouter_available(),
        "fallback_to_ollama": OPENROUTER_FALLBACK_TO_OLLAMA,
        "ollama_base": OLLAMA_BASE,
        "default_model": DEFAULT_MODEL,
    }
