from __future__ import annotations

import json
from typing import Generator
from urllib import error, request

from config import JARVIS_FALLBACK, JARVIS_PROVIDER, PROVIDER_CONFIG
from utils import log

DEFAULT_TIMEOUT = 120
ANTHROPIC_VERSION = "2023-06-01"
ANTHROPIC_MAX_TOKENS = 4096


def _provider_order() -> list[str]:
    order = [JARVIS_PROVIDER, *JARVIS_FALLBACK]
    seen: set[str] = set()
    return [provider for provider in order if provider and not (provider in seen or seen.add(provider))]


def _endpoint(provider: str, config: dict[str, str | None]) -> str:
    base_url = str(config.get("base_url") or "").rstrip("/")
    if provider == "gemini" and not base_url.endswith("/chat/completions"):
        return base_url + "/chat/completions"
    return base_url


def _headers(provider: str, config: dict[str, str | None]) -> dict[str, str]:
    headers = {"Content-Type": "application/json"}
    api_key = config.get("api_key")
    auth_header = config.get("auth_header")
    if auth_header == "bearer" and api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    elif auth_header == "x-api-key" and api_key:
        headers["x-api-key"] = str(api_key)
        headers["anthropic-version"] = ANTHROPIC_VERSION
    if provider == "openrouter":
        headers["HTTP-Referer"] = "http://127.0.0.1:8000"
        headers["X-Title"] = "JARVIS Windows Standalone"
    return headers


def _requires_key(provider: str, config: dict[str, str | None]) -> bool:
    return provider != "ollama" and not config.get("api_key")


def _split_anthropic_messages(messages: list[dict]) -> tuple[str | None, list[dict]]:
    system_parts: list[str] = []
    normalized: list[dict] = []
    for message in messages:
        role = message.get("role")
        content = message.get("content", "")
        if role == "system":
            if content:
                system_parts.append(str(content))
            continue
        normalized.append({"role": "assistant" if role == "assistant" else "user", "content": str(content)})
    return ("\n\n".join(system_parts) if system_parts else None, normalized)


def _anthropic_payload(messages: list[dict], model: str, temperature: float, stream: bool) -> dict:
    system, normalized_messages = _split_anthropic_messages(messages)
    payload: dict = {
        "model": model,
        "messages": normalized_messages,
        "max_tokens": ANTHROPIC_MAX_TOKENS,
        "stream": stream,
    }
    if system:
        payload["system"] = system
    if temperature is not None:
        payload["temperature"] = temperature
    return payload


def _openai_payload(messages: list[dict], model: str, temperature: float, stream: bool) -> dict:
    return {
        "model": model,
        "messages": messages,
        "stream": stream,
        "temperature": temperature,
    }


def _request_payload(provider: str, messages: list[dict], model: str, temperature: float, stream: bool) -> dict:
    if provider == "anthropic":
        return _anthropic_payload(messages, model, temperature, stream)
    return _openai_payload(messages, model, temperature, stream)


def _post_json(provider: str, messages: list[dict], model: str, temperature: float, stream: bool):
    config = PROVIDER_CONFIG.get(provider)
    if not config:
        raise RuntimeError(f"Unbekannter Provider: {provider}")
    if _requires_key(provider, config):
        log("ERROR", f"API Key fehlt für Provider {provider}")
        raise RuntimeError(f"API Key fehlt fuer Provider {provider}")
    payload = json.dumps(_request_payload(provider, messages, model, temperature, stream)).encode("utf-8")
    req = request.Request(
        _endpoint(provider, config),
        data=payload,
        headers=_headers(provider, config),
        method="POST",
    )
    return request.urlopen(req, timeout=DEFAULT_TIMEOUT)


def _parse_non_stream(provider: str, raw: bytes) -> str:
    data = json.loads(raw.decode("utf-8"))
    if provider == "anthropic":
        content = data.get("content") or []
        if content and isinstance(content[0], dict):
            return str(content[0].get("text", "")).strip()
        return ""
    return str(data["choices"][0]["message"]["content"]).strip()


def _parse_stream_line(provider: str, raw: str) -> str:
    if not raw or raw == "[DONE]":
        return ""
    data = json.loads(raw)
    if provider == "anthropic":
        if data.get("type") == "content_block_delta":
            return str((data.get("delta") or {}).get("text") or "")
        return ""
    return str(data.get("choices", [{}])[0].get("delta", {}).get("content") or "")


def _stream_provider(provider: str, messages: list[dict], model: str, temperature: float) -> Generator[str, None, None]:
    with _post_json(provider, messages, model, temperature, True) as resp:
        for line in resp:
            text = line.decode("utf-8", errors="ignore").strip()
            if not text.startswith("data:"):
                continue
            raw = text[5:].strip()
            if raw == "[DONE]":
                break
            try:
                delta = _parse_stream_line(provider, raw)
            except Exception:
                continue
            if delta:
                yield delta


def _call_provider(provider: str, messages: list[dict], model: str, temperature: float, stream: bool):
    if stream:
        return _stream_provider(provider, messages, model, temperature)
    with _post_json(provider, messages, model, temperature, False) as resp:
        return _parse_non_stream(provider, resp.read())


def call_llm(messages: list[dict], model: str, temperature: float = 0.3, stream: bool = False) -> str | Generator[str, None, None]:
    if stream:
        return _call_stream_with_fallback(messages, model, temperature)

    last_error: Exception | None = None
    previous = ""
    for provider in _provider_order():
        if previous:
            log("WARN", "Provider fallback", von=previous, auf=provider)
        try:
            return _call_provider(provider, messages, model, temperature, False)
        except Exception as exc:
            last_error = exc
            previous = provider
            continue
    raise RuntimeError(f"Kein LLM Provider erreichbar: {last_error}")


def _call_stream_with_fallback(messages: list[dict], model: str, temperature: float) -> Generator[str, None, None]:
    def gen() -> Generator[str, None, None]:
        last_error: Exception | None = None
        previous = ""
        for provider in _provider_order():
            if previous:
                log("WARN", "Provider fallback", von=previous, auf=provider)
            try:
                yield from _stream_provider(provider, messages, model, temperature)
                return
            except Exception as exc:
                last_error = exc
                previous = provider
                continue
        raise RuntimeError(f"Kein LLM Provider erreichbar: {last_error}")

    return gen()
