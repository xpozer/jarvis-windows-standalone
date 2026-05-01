from __future__ import annotations

import json
import threading
import time
import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

import agent_registry
from config import CHAT_SESSIONS_FILE, DEFAULT_MODEL, JARVIS_PROVIDER, OLLAMA_BASE, PROVIDER_CONFIG
from services import _runtime as core
from services import usejarvis_runtime
from services.llm_client import call_llm
from utils import log, read_json, write_json

router = APIRouter(prefix="/api", tags=["local-chat"])
_sessions_lock = threading.Lock()


class ChatMessage(BaseModel):
    role: str = Field(default="user")
    content: str = Field(default="")


class ChatRequest(BaseModel):
    message: str = Field(min_length=1)
    history: list[ChatMessage] = Field(default_factory=list)
    model: str | None = None
    agent: str | None = None
    session_id: str | None = None


class RenameSessionRequest(BaseModel):
    title: str = Field(min_length=1, max_length=120)


def _now_iso() -> str:
    return datetime.now().isoformat(timespec="seconds")


def _safe_title(text: str) -> str:
    clean = " ".join(text.strip().split())
    if not clean:
        return "Neuer Chat"
    return clean[:80]


def _load_sessions() -> list[dict[str, Any]]:
    data = read_json(CHAT_SESSIONS_FILE, [])
    return data if isinstance(data, list) else []


def _save_sessions(sessions: list[dict[str, Any]]) -> None:
    write_json(CHAT_SESSIONS_FILE, sessions)


def _session_summary(session: dict[str, Any]) -> dict[str, Any]:
    messages = session.get("messages") if isinstance(session.get("messages"), list) else []
    last = messages[-1] if messages else {}
    return {
        "id": session.get("id"),
        "title": session.get("title") or "Neuer Chat",
        "created_at": session.get("created_at"),
        "updated_at": session.get("updated_at"),
        "message_count": len(messages),
        "last_message": last.get("text") if isinstance(last, dict) else "",
        "agent": session.get("agent"),
        "model": session.get("model"),
        "provider": session.get("provider"),
    }


def _append_session_turn(
    session_id: str | None,
    user_text: str,
    answer: str,
    *,
    agent_id: str,
    model: str,
    provider: str,
    duration_ms: int,
    memory: dict[str, int],
) -> str:
    ts = _now_iso()
    with _sessions_lock:
        sessions = _load_sessions()
        session = None
        if session_id:
            session = next((item for item in sessions if item.get("id") == session_id), None)
        if not session:
            session = {
                "id": f"chat_{uuid.uuid4().hex}",
                "title": _safe_title(user_text),
                "created_at": ts,
                "updated_at": ts,
                "messages": [],
            }
            sessions.insert(0, session)
        messages = session.setdefault("messages", [])
        meta = {
            "agent": agent_id,
            "model": model,
            "provider": provider,
            "duration_ms": duration_ms,
            "memory": memory,
        }
        messages.append({"role": "operator", "time": ts, "text": user_text})
        messages.append({"role": "jarvis", "time": ts, "text": answer, "meta": meta})
        session.update({
            "updated_at": ts,
            "agent": agent_id,
            "model": model,
            "provider": provider,
        })
        sessions.sort(key=lambda item: str(item.get("updated_at") or ""), reverse=True)
        _save_sessions(sessions[:80])
        return str(session["id"])


def _normalize_history(history: list[ChatMessage]) -> list[dict[str, str]]:
    out: list[dict[str, str]] = []
    for item in history[-10:]:
        role = item.role if item.role in {"user", "assistant", "system"} else "user"
        content = item.content.strip()
        if content:
            out.append({"role": role, "content": content})
    return out


def _memory_system_block(user_text: str) -> list[dict[str, str]]:
    facts = usejarvis_runtime.memory_context(user_text, limit=6)
    if not facts:
        return []
    compact = "\n".join(f"- {fact}" for fact in facts)
    return [{
        "role": "system",
        "content": "Relevanter lokaler JARVIS Memory Kontext:\n" + compact + "\nNutze diesen Kontext nur, wenn er zur Nutzerfrage passt.",
    }]


def _sse(event: str, data: dict[str, Any]) -> str:
    return f"event: {event}\ndata: {json.dumps(data, ensure_ascii=False)}\n\n"


def _phase(step: str, label: str, detail: str = "") -> str:
    return _sse("phase", {"step": step, "label": label, "detail": detail})


@router.post("/chat")
def chat(req: ChatRequest) -> dict[str, Any]:
    started = time.perf_counter()
    user_text = req.message.strip()
    agent_id, reason, confidence = core.classify_agent(user_text)
    if req.agent:
        agent_id = req.agent.strip().lower()
        reason = "Manuell gesetzter Agent"
        confidence = 1.0

    model = (req.model or DEFAULT_MODEL or "qwen3:8b").strip()
    memory_messages = _memory_system_block(user_text)
    messages = memory_messages + core.build_messages(
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

        extracted = usejarvis_runtime.extract_facts_from_text(user_text, source_ref="chat:user")
        duration_ms = int((time.perf_counter() - started) * 1000)
        memory = {
            "facts_used": len(memory_messages),
            "facts_extracted": len(extracted),
        }
        meta = {
            "agent": agent_id,
            "model": model,
            "provider": JARVIS_PROVIDER,
            "duration_ms": duration_ms,
            "memory": memory,
        }
        usejarvis_runtime.audit(
            "primary_agent",
            "chat.completed",
            user_text[:180],
            "low",
            {"agent": agent_id, "model": model, "provider": JARVIS_PROVIDER, "memory_facts_used": memory["facts_used"], "facts_extracted": memory["facts_extracted"], "duration_ms": duration_ms},
        )
        session_id = _append_session_turn(
            req.session_id,
            user_text,
            answer,
            agent_id=agent_id,
            model=model,
            provider=JARVIS_PROVIDER,
            duration_ms=duration_ms,
            memory=memory,
        )

        agent_registry.update_status(agent_id, "idle", last_action="Antwort erstellt")
        return {
            "ok": True,
            "session_id": session_id,
            "agent": agent_id,
            "reason": reason,
            "confidence": confidence,
            "model": model,
            "provider": JARVIS_PROVIDER,
            "duration_ms": duration_ms,
            "memory": memory,
            "meta": meta,
            "response": answer,
        }
    except Exception as exc:
        log("ERROR", "Lokaler Chat fehlgeschlagen", error=str(exc), agent=agent_id)
        agent_registry.update_status(agent_id, "error", last_action=str(exc)[:160], error=True)
        raise HTTPException(status_code=500, detail=f"Chat Fehler: {exc}") from exc


@router.post("/chat/stream")
def chat_stream(req: ChatRequest) -> StreamingResponse:
    started = time.perf_counter()
    user_text = req.message.strip()
    agent_id, reason, confidence = core.classify_agent(user_text)
    if req.agent:
        agent_id = req.agent.strip().lower()
        reason = "Manuell gesetzter Agent"
        confidence = 1.0

    model = (req.model or DEFAULT_MODEL or "qwen3:8b").strip()
    memory_messages = _memory_system_block(user_text)
    messages = memory_messages + core.build_messages(
        user_input=user_text,
        history=_normalize_history(req.history),
        memory_facts=[],
        agent=agent_id,
    )

    def generate():
        answer_parts: list[str] = []
        agent_registry.update_status(agent_id, "running", last_action=user_text[:160])
        try:
            yield _phase("context", "Kontext wird geladen", "Lokale Historie und Laufzeitdaten werden vorbereitet.")
            yield _sse("meta", {
                "agent": agent_id,
                "reason": reason,
                "confidence": confidence,
                "model": model,
                "provider": JARVIS_PROVIDER,
            })
            yield _phase("agent", f"Agent aktiv: {agent_id}", reason)
            yield _phase("memory", "Gedächtnis wird geprüft", f"{len(memory_messages)} relevante Memory-Bloecke gefunden.")
            yield _sse("memory", {"facts_used": len(memory_messages)})
            yield _phase("model", f"Provider verbunden: {JARVIS_PROVIDER}", f"Modell {model}")

            yield _phase("answer", "Antwort wird formuliert", "JARVIS schreibt live in den Verlauf.")
            stream_result = call_llm(messages, model, temperature=0.35, stream=True)
            chunks = [stream_result] if isinstance(stream_result, str) else stream_result
            for chunk in chunks:
                text = str(chunk or "")
                if not text:
                    continue
                answer_parts.append(text)
                yield _sse("delta", {"text": text})

            answer = "".join(answer_parts).strip()
            if not answer:
                answer = "Ich habe vom LLM Provider eine leere Antwort bekommen."
                yield _sse("delta", {"text": answer})

            extracted = usejarvis_runtime.extract_facts_from_text(user_text, source_ref="chat:user")
            duration_ms = int((time.perf_counter() - started) * 1000)
            memory = {
                "facts_used": len(memory_messages),
                "facts_extracted": len(extracted),
            }
            meta = {
                "agent": agent_id,
                "model": model,
                "provider": JARVIS_PROVIDER,
                "duration_ms": duration_ms,
                "memory": memory,
            }
            session_id = _append_session_turn(
                req.session_id,
                user_text,
                answer,
                agent_id=agent_id,
                model=model,
                provider=JARVIS_PROVIDER,
                duration_ms=duration_ms,
                memory=memory,
            )
            usejarvis_runtime.audit(
                "primary_agent",
                "chat.stream.completed",
                user_text[:180],
                "low",
                {"agent": agent_id, "model": model, "provider": JARVIS_PROVIDER, "memory_facts_used": memory["facts_used"], "facts_extracted": memory["facts_extracted"], "duration_ms": duration_ms},
            )
            agent_registry.update_status(agent_id, "idle", last_action="Antwort erstellt")
            yield _phase("done", "Antwort abgeschlossen", f"Dauer {duration_ms} ms")
            yield _sse("done", {
                "ok": True,
                "session_id": session_id,
                "agent": agent_id,
                "reason": reason,
                "confidence": confidence,
                "model": model,
                "provider": JARVIS_PROVIDER,
                "duration_ms": duration_ms,
                "memory": memory,
                "meta": meta,
                "response": answer,
            })
        except Exception as exc:
            log("ERROR", "Lokaler Chat Stream fehlgeschlagen", error=str(exc), agent=agent_id)
            agent_registry.update_status(agent_id, "error", last_action=str(exc)[:160], error=True)
            yield _sse("error", {"detail": f"Chat Fehler: {exc}"})

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/chat/health")
def chat_health() -> dict[str, Any]:
    provider_config = PROVIDER_CONFIG.get(JARVIS_PROVIDER, {})
    online = core.ollama_online() if JARVIS_PROVIDER == "ollama" else bool(provider_config.get("api_key"))
    payload: dict[str, Any] = {
        "ok": online,
        "provider": JARVIS_PROVIDER,
        "ollama": OLLAMA_BASE,
        "model": DEFAULT_MODEL,
        "runtime": usejarvis_runtime.runtime_status(),
    }
    if JARVIS_PROVIDER == "ollama":
        payload["ollama_online"] = online
    elif not online:
        payload["error"] = f"API Key fehlt fuer Provider {JARVIS_PROVIDER}"
    return payload


@router.get("/chat/sessions")
def list_chat_sessions() -> dict[str, Any]:
    with _sessions_lock:
        sessions = [_session_summary(item) for item in _load_sessions()]
    return {"ok": True, "sessions": sessions}


@router.get("/chat/sessions/{session_id}")
def get_chat_session(session_id: str) -> dict[str, Any]:
    with _sessions_lock:
        session = next((item for item in _load_sessions() if item.get("id") == session_id), None)
    if not session:
        raise HTTPException(status_code=404, detail="Chat Session nicht gefunden")
    return {"ok": True, **session}


@router.patch("/chat/sessions/{session_id}")
def rename_chat_session(session_id: str, req: RenameSessionRequest) -> dict[str, Any]:
    with _sessions_lock:
        sessions = _load_sessions()
        session = next((item for item in sessions if item.get("id") == session_id), None)
        if not session:
            raise HTTPException(status_code=404, detail="Chat Session nicht gefunden")
        session["title"] = _safe_title(req.title)
        session["updated_at"] = _now_iso()
        _save_sessions(sessions)
    return {"ok": True, "session": _session_summary(session)}


@router.delete("/chat/sessions/{session_id}")
def delete_chat_session(session_id: str) -> dict[str, Any]:
    with _sessions_lock:
        sessions = _load_sessions()
        remaining = [item for item in sessions if item.get("id") != session_id]
        if len(remaining) == len(sessions):
            raise HTTPException(status_code=404, detail="Chat Session nicht gefunden")
        _save_sessions(remaining)
    return {"ok": True, "deleted": session_id}
