from __future__ import annotations

from fastapi import APIRouter

from routes.runtime_models import GoalIn
from services import usejarvis_runtime as rt

router = APIRouter()


@router.get("/goals")
def goals(limit: int = 50):
    return {"ok": True, "goals": rt.list_goals(limit=limit)}


@router.post("/goals")
def goal_create(req: GoalIn):
    return {"ok": True, "goal": rt.create_goal(req.type, req.title, req.description, req.parent_id, req.due_date)}
