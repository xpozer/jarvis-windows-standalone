"""
JARVIS Orchestrator - FastAPI Routes
Einhaengen in Stanford-Backend:

  from orchestrator_routes import router as orch_router
  app.include_router(orch_router, prefix="/orchestrate")

Endpoint:
  POST /orchestrate/run    -> SSE-Stream mit Agent-Events
  GET  /orchestrate/agents -> Liste verfuegbarer Agenten
  GET  /memory/agents       -> Agent-Gedaechtnis auflisten
  GET  /memory/{agent}      -> Gedaechtnis eines Agenten
"""

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from orchestrator import orchestrate_stream, AGENTS

from persistent_memory import create_memory_router
from awareness import create_awareness_router
from authority import create_authority_router
from skill_system import create_skills_router

router = APIRouter(tags=["orchestrator"])
memory_router = create_memory_router()
awareness_router = create_awareness_router()
authority_router = create_authority_router()
skills_router = create_skills_router()

class OrchestrateRequest(BaseModel):
    user_input:   str
    api_url:      str   = "http://localhost:8000"
    model:        str   = "qwen3:8b"
    memory_facts: list  = []
    history:      list  = []

@router.get("/agents")
async def list_agents():
    return {
        name: {"name": name, "description": agent.description}
        for name, agent in AGENTS.items()
    }

@router.post("/run")
async def orchestrate_run(req: OrchestrateRequest):
    async def stream():
        import asyncio
        loop = asyncio.get_event_loop()

        # orchestrate_stream ist synchron (Generator) → in Thread
        def _gen():
            return list(orchestrate_stream(
                user_input=req.user_input,
                api_url=req.api_url,
                model=req.model,
                memory_facts=req.memory_facts,
                history=req.history,
            ))

        # Fuer echtes Streaming: sync Generator direkt iterieren
        # (FastAPI/Starlette toleriert sync generators in StreamingResponse)
        for chunk in orchestrate_stream(
            user_input=req.user_input,
            api_url=req.api_url,
            model=req.model,
            memory_facts=req.memory_facts,
            history=req.history,
        ):
            yield chunk

    return StreamingResponse(stream(), media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"})
