from __future__ import annotations

from fastapi import APIRouter, HTTPException

from routes.runtime_models import SidecarIn
from services import usejarvis_workflow as wf

router = APIRouter()


@router.get("/sidecars")
def sidecars(limit: int = 50):
    return {"ok": True, "sidecars": wf.list_sidecars(limit=limit)}


@router.post("/sidecars/register")
def sidecar_register(req: SidecarIn):
    return {"ok": True, "sidecar": wf.register_sidecar(req.machine_id, req.name, req.capabilities, req.token_hint)}


@router.post("/sidecars/{machine_id}/heartbeat")
def sidecar_heartbeat(machine_id: str):
    result = wf.heartbeat_sidecar(machine_id)
    if not result.get("ok"):
        raise HTTPException(status_code=404, detail="Sidecar not found")
    return result
