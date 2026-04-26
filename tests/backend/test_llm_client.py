import io
import json
import urllib.error

import pytest


class FakeResponse:
    def __init__(self, payload=None, lines=None):
        self.payload = payload or {}
        self.lines = lines or []

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    def read(self):
        return json.dumps(self.payload).encode("utf-8")

    def __iter__(self):
        return iter(self.lines)


def test_openai_compatible_provider_uses_bearer_header(monkeypatch):
    from services import llm_client

    captured = {}

    def fake_urlopen(req, timeout):
        captured["url"] = req.full_url
        captured["auth"] = req.headers.get("Authorization")
        captured["body"] = json.loads(req.data.decode("utf-8"))
        return FakeResponse({"choices": [{"message": {"content": "Hallo"}}]})

    monkeypatch.setattr(llm_client.request, "urlopen", fake_urlopen)
    monkeypatch.setattr(llm_client, "JARVIS_PROVIDER", "openai")
    monkeypatch.setattr(llm_client, "JARVIS_FALLBACK", [])
    monkeypatch.setitem(llm_client.PROVIDER_CONFIG["openai"], "api_key", "sk-test")

    result = llm_client.call_llm([{"role": "user", "content": "Hi"}], "gpt-test", 0.2, False)

    assert result == "Hallo"
    assert captured["url"] == "https://api.openai.com/v1/chat/completions"
    assert captured["auth"] == "Bearer sk-test"
    assert captured["body"]["model"] == "gpt-test"


def test_anthropic_provider_normalizes_request_and_response(monkeypatch):
    from services import llm_client

    captured = {}

    def fake_urlopen(req, timeout):
        captured["url"] = req.full_url
        captured["api_key"] = req.headers.get("X-api-key")
        captured["version"] = req.headers.get("Anthropic-version")
        captured["body"] = json.loads(req.data.decode("utf-8"))
        return FakeResponse({"content": [{"type": "text", "text": "Anthropic Antwort"}]})

    monkeypatch.setattr(llm_client.request, "urlopen", fake_urlopen)
    monkeypatch.setattr(llm_client, "JARVIS_PROVIDER", "anthropic")
    monkeypatch.setattr(llm_client, "JARVIS_FALLBACK", [])
    monkeypatch.setitem(llm_client.PROVIDER_CONFIG["anthropic"], "api_key", "anthropic-key")

    result = llm_client.call_llm(
        [{"role": "system", "content": "System"}, {"role": "user", "content": "Hi"}],
        "claude-test",
        0.4,
        False,
    )

    assert result == "Anthropic Antwort"
    assert captured["url"] == "https://api.anthropic.com/v1/messages"
    assert captured["api_key"] == "anthropic-key"
    assert captured["version"]
    assert captured["body"]["system"] == "System"
    assert captured["body"]["max_tokens"] > 0
    assert captured["body"]["messages"] == [{"role": "user", "content": "Hi"}]


def test_provider_fallback_skips_missing_key_and_uses_next_provider(monkeypatch):
    from services import llm_client

    calls = []

    def fake_urlopen(req, timeout):
        calls.append(req.full_url)
        return FakeResponse({"choices": [{"message": {"content": "Lokal"}}]})

    monkeypatch.setattr(llm_client.request, "urlopen", fake_urlopen)
    monkeypatch.setattr(llm_client, "JARVIS_PROVIDER", "openai")
    monkeypatch.setattr(llm_client, "JARVIS_FALLBACK", ["ollama"])
    monkeypatch.setitem(llm_client.PROVIDER_CONFIG["openai"], "api_key", None)

    result = llm_client.call_llm([{"role": "user", "content": "Hi"}], "qwen3:8b", 0.2, False)

    assert result == "Lokal"
    assert calls == ["http://127.0.0.1:11434/v1/chat/completions"]


def test_provider_fallback_on_http_error(monkeypatch):
    from services import llm_client

    calls = []

    def fake_urlopen(req, timeout):
        calls.append(req.full_url)
        if len(calls) == 1:
            raise urllib.error.HTTPError(req.full_url, 503, "down", {}, io.BytesIO(b""))
        return FakeResponse({"choices": [{"message": {"content": "Fallback"}}]})

    monkeypatch.setattr(llm_client.request, "urlopen", fake_urlopen)
    monkeypatch.setattr(llm_client, "JARVIS_PROVIDER", "ollama")
    monkeypatch.setattr(llm_client, "JARVIS_FALLBACK", ["openai"])
    monkeypatch.setitem(llm_client.PROVIDER_CONFIG["openai"], "api_key", "sk-test")

    result = llm_client.call_llm([{"role": "user", "content": "Hi"}], "qwen3:8b", 0.2, False)

    assert result == "Fallback"
    assert calls == [
        "http://127.0.0.1:11434/v1/chat/completions",
        "https://api.openai.com/v1/chat/completions",
    ]


def test_openai_compatible_stream_returns_text_chunks(monkeypatch):
    from services import llm_client

    lines = [
        b'data: {"choices":[{"delta":{"content":"Hal"}}]}\n\n',
        b'data: {"choices":[{"delta":{"content":"lo"}}]}\n\n',
        b"data: [DONE]\n\n",
    ]

    monkeypatch.setattr(llm_client.request, "urlopen", lambda req, timeout: FakeResponse(lines=lines))
    monkeypatch.setattr(llm_client, "JARVIS_PROVIDER", "ollama")
    monkeypatch.setattr(llm_client, "JARVIS_FALLBACK", [])

    chunks = list(llm_client.call_llm([{"role": "user", "content": "Hi"}], "qwen3:8b", 0.2, True))

    assert chunks == ["Hal", "lo"]
