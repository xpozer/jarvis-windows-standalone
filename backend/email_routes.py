"""
JARVIS EmailAgent - FastAPI Routes
Einhaengen in das Stanford-Backend:

  from email_routes import router as email_router
  app.include_router(email_router, prefix="/email")

Endpoints:
  POST /email/scan          -> Inbox scannen + klassifizieren
  POST /email/delete        -> Mails loeschen
  GET  /email/status        -> Outlook erreichbar?
"""

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
import asyncio
from typing import Optional
from email_agent import scan_and_classify, delete_mails, run_ps, SCAN_PS

router = APIRouter(tags=["email"])

# ── Request-Modelle ────────────────────────────────────────────────────────────
class ScanRequest(BaseModel):
    max_mails:       int   = 30
    spam_threshold:  float = 0.75
    api_url:         str   = "http://localhost:8000"
    model:           str   = "qwen3:8b"

class DeleteRequest(BaseModel):
    entry_ids: list[str]
    permanent: bool = False

# ── Status ─────────────────────────────────────────────────────────────────────
@router.get("/status")
async def email_status():
    """Prueft ob Outlook offen und erreichbar ist."""
    test = run_ps(SCAN_PS, ["-MaxMails", "1"])
    if "error" in test:
        return {"status": "offline", "error": test["error"]}
    return {"status": "online", "folder": test.get("folder", "Inbox")}

# ── Scan mit Streaming ─────────────────────────────────────────────────────────
@router.post("/scan")
async def email_scan(req: ScanRequest):
    """
    Scannt Inbox und klassifiziert per LLM.
    Streamt Events damit der Orb live Fortschritt zeigen kann.
    """
    async def stream():
        # Event: Start
        yield f"data: {json.dumps({'event':'start','message':'Scanne Outlook-Inbox...'})}\n\n"
        await asyncio.sleep(0.05)

        # In Thread auslagern (PS-Call blockiert)
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: scan_and_classify(
                max_mails=req.max_mails,
                spam_threshold=req.spam_threshold,
                api_url=req.api_url,
                model=req.model
            )
        )

        if "error" in result:
            yield f"data: {json.dumps({'event':'error','message':result['error']})}\n\n"
            return

        # Event: Ergebnis
        yield f"data: {json.dumps({'event':'result', **result})}\n\n"

        # Summary fuer JARVIS Chat
        spam_count = len(result.get("spam", []))
        total = result.get("total_scanned", 0)
        summary = f"{total} Mails gescannt. {spam_count} Spam-Kandidaten gefunden."
        yield f"data: {json.dumps({'event':'summary','message':summary})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")

# ── Delete ─────────────────────────────────────────────────────────────────────
@router.post("/delete")
async def email_delete(req: DeleteRequest):
    """Loescht Mails anhand EntryID-Liste."""
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(
        None,
        lambda: delete_mails(req.entry_ids, permanent=req.permanent)
    )
    return result
