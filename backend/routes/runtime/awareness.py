from __future__ import annotations

from fastapi import APIRouter

from routes.runtime_models import AwarenessIn, AwarenessLoopIn
from services import awareness_runtime
from services import usejarvis_runtime as rt

router = APIRouter()


@router.get("/awareness/current")
def awareness_current():
    return awareness_runtime.awareness_status()


@router.post("/awareness/capture")
def awareness_capture():
    return awareness_runtime.capture_snapshot(write_event=True)


@router.get("/awareness/snapshot")
def awareness_snapshot(write_event: bool = False):
    return awareness_runtime.capture_snapshot(write_event=write_event)


@router.get("/awareness/loop")
def awareness_loop_status():
    return awareness_runtime.loop_status()


@router.post("/awareness/loop/start")
def awareness_loop_start(req: AwarenessLoopIn = AwarenessLoopIn()):
    return awareness_runtime.start_loop(interval_seconds=req.interval_seconds)


@router.post("/awareness/loop/stop")
def awareness_loop_stop():
    return awareness_runtime.stop_loop()


@router.post("/awareness/events")
def awareness_event(req: AwarenessIn):
    return {"ok": True, "event": rt.set_awareness_event(req.event_type, req.app_name, req.window_title, req.summary, req.payload)}
