"""
JARVIS Orchestrator
Analysiert die Nutzeranfrage und delegiert an den passenden Sub-Agenten.
Gibt strukturierte Events zurueck (fuer Streaming + Orb-Visualisierung).
"""

import json
from typing import Generator
from agents.base_agent import BaseAgent, AgentContext, AgentResult
from agents.sap_agent       import SAPAgent
from agents.calendar_agent  import CalendarAgent
from agents.research_agent  import ResearchAgent
from agents.memory_agent    import MemoryAgent
from agents.email_agent_wrapper import EmailAgentWrapper
from agents.general_agent   import GeneralAgent
from agents.file_agent      import FileAgent
from agents.exam_agent      import ExamAgent
from agents.vde_agent       import VDEAgent
from agents.diagnostic_agent import DiagnosticAgent

# Awareness
try:
    from awareness import get_pipeline
    _HAS_AWARENESS = True
except ImportError:
    _HAS_AWARENESS = False

try:
    from skill_system import get_skill_manager
    _HAS_SKILLS = True
except ImportError:
    _HAS_SKILLS = False

# ── Agent-Registry ─────────────────────────────────────────────────────────────
AGENTS: dict[str, BaseAgent] = {
    "sap":      SAPAgent(),
    "calendar": CalendarAgent(),
    "research": ResearchAgent(),
    "memory":   MemoryAgent(),
    "email":    EmailAgentWrapper(),
    "general":  GeneralAgent(),
    "file":     FileAgent(),
    "exam":     ExamAgent(),
    "vde":      VDEAgent(),
    "diagnostic": DiagnosticAgent(),
}

# ── Routing-Prompt ─────────────────────────────────────────────────────────────
ROUTER_SYSTEM = """Du bist der JARVIS-Orchestrator.
Analysiere die Nutzeranfrage und entscheide welcher Agent antwortet.

Verfügbare Agenten:
- sap       → SAP PM, Auftragstexte, Transaktionen, Meldungen, Leistungsnachweise, VDE-Normen
- calendar  → Termine, Fristen, Kalenderwochen, Wartungsintervalle, Prüffristen, Lernpläne
- research  → Websuche, Normen nachschlagen, technische Fachfragen, IM-Prüfungsstoff
- memory    → "Was weißt du über...", "Erinnerst du dich...", gespeicherte Fakten abrufen
- email     → Outlook, Mails, Spam, Inbox
- file      → PDF analysieren, Dokumente zusammenfassen, Pruefberichte lesen
- exam      → IM-Pruefung: Fragen stellen, Antworten bewerten, Lernkarten, BwHa/MIKP/ZIB/NTG
- vde       → VDE/DGUV Normen nachschlagen, Prueffristen, Normhierarchie
- diagnostic → Fehlerlogs analysieren, npm Build-Fehler, Python-Fehler, Port-Probleme, Startprobleme, Diagnose-Check
- general   → Alles andere: Gespräch, Analyse, Erklärungen, Berechnungen

Antworte NUR mit diesem JSON (kein Text davor oder danach):
{"agent":"sap","confidence":0.95,"reason":"Nutzer fragt nach SAP-Auftragstext"}

Regeln:
Wähle immer genau einen Agenten.
Bei Unklarheit: general.
confidence: 0.0-1.0
"""

def route(user_input: str, ctx: AgentContext) -> dict:
    """Bestimmt per LLM welcher Agent zustaendig ist."""
    dummy = GeneralAgent()
    # Awareness-Kontext fuer besseres Routing
    awareness_ctx = ""
    if _HAS_AWARENESS:
        try:
            awareness_ctx = get_pipeline().get_context_for_orchestrator()
        except Exception as e:
            import sys; print(f"[WARN] Awareness-Kontext nicht geladen: {e}", file=sys.stderr)
    routing_input = user_input
    if awareness_ctx:
        routing_input = f"[Desktop-Kontext]\n{awareness_ctx}\n\n[Nutzer-Anfrage]\n{user_input}"
    messages = [
        {"role": "system", "content": ROUTER_SYSTEM},
        {"role": "user",   "content": routing_input},
    ]
    raw = dummy.llm(messages, ctx, temperature=0.1)
    result = dummy.extract_json(raw)
    # Fallback wenn JSON kaputt
    if "agent" not in result or result["agent"] not in AGENTS:
        return {"agent": "general", "confidence": 0.5, "reason": "Fallback"}
    return result

# ── SSE-Event Helper ───────────────────────────────────────────────────────────
def sse(event: str, data: dict) -> str:
    return f"data: {json.dumps({'event': event, **data}, ensure_ascii=False)}\n\n"

# ── Haupt-Streaming-Funktion ───────────────────────────────────────────────────
def orchestrate_stream(
    user_input:   str,
    api_url:      str   = "http://localhost:8000",
    model:        str   = "qwen3:8b",
    memory_facts: list  = [],
    history:      list  = [],
) -> Generator[str, None, None]:
    """
    Streamt SSE-Events:
      {event:"routing",  agent:"...", reason:"...", confidence:0.9}
      {event:"thinking", agent:"...", message:"..."}
      {event:"delta",    agent:"...", content:"..."}   (mehrfach)
      {event:"done",     agent:"...", tool_log:[...]}
      {event:"error",    message:"..."}
    """
    # Awareness in Extra-Kontext
    extra = {}
    if _HAS_AWARENESS:
        try:
            extra["awareness"] = get_pipeline().get_context_for_orchestrator()
        except Exception as e:
            import sys; print(f"[WARN] Awareness in Stream nicht geladen: {e}", file=sys.stderr)
    ctx = AgentContext(
        user_input=user_input,
        api_url=api_url,
        model=model,
        memory_facts=memory_facts,
        history=history,
        extra=extra,
    )

    # 1. Routing
    try:
        routing = route(user_input, ctx)
    except Exception as e:
        yield sse("error", {"message": f"Routing-Fehler: {e}"})
        return

    agent_name = routing["agent"]

    # Skills erst nach Routing laden, weil agent_name vorher nicht existiert.
    if _HAS_SKILLS:
        try:
            skill_ctx = get_skill_manager().get_skill_context(agent_name, user_input)
            if skill_ctx:
                ctx.extra["skills"] = skill_ctx
        except Exception as e:
            import sys; print(f"[WARN] Skill-Kontext nicht geladen: {e}", file=sys.stderr)

    yield sse("routing", {
        "agent":      agent_name,
        "reason":     routing.get("reason", ""),
        "confidence": routing.get("confidence", 0.0),
    })

    # 2. Agent holen
    agent = AGENTS.get(agent_name, AGENTS["general"])

    yield sse("thinking", {
        "agent":   agent_name,
        "message": f"{agent_name.upper()} Agent verarbeitet...",
    })

    # 3. Streaming-Antwort
    try:
        full_content = ""
        for chunk in agent.run_stream(ctx):
            full_content += chunk
            yield sse("delta", {"agent": agent_name, "content": chunk})

        # 4. Done mit Tool-Log
        # Tool-Log holen via run() nur wenn kein Stream-Overhead
        tool_log = [f"{agent_name} abgeschlossen"]
        yield sse("done", {"agent": agent_name, "tool_log": tool_log})
        yield "data: [DONE]\n\n"

    except Exception as e:
        yield sse("error", {"message": f"Agent-Fehler ({agent_name}): {e}"})


# ── CLI ────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys
    query = " ".join(sys.argv[1:]) or "Was ist heute für ein Tag?"
    print(f"Query: {query}\n")
    for event in orchestrate_stream(query):
        if event.startswith("data:") and not event.strip() == "data: [DONE]":
            try:
                data = json.loads(event[5:].strip())
                evt = data.get("event","")
                if evt == "routing":
                    print(f"→ ROUTING: {data['agent'].upper()} (confidence: {data['confidence']:.0%})")
                    print(f"  Grund: {data['reason']}")
                elif evt == "thinking":
                    print(f"  {data['message']}")
                elif evt == "delta":
                    print(data["content"], end="", flush=True)
                elif evt == "done":
                    print(f"\n\n✓ Done: {data['agent']}")
                elif evt == "error":
                    print(f"\n✗ Fehler: {data['message']}")
            except Exception:
                pass
