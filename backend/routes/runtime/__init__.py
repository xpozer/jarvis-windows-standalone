from __future__ import annotations

from fastapi import APIRouter

from routes.runtime.actions import router as actions_router
from routes.runtime.awareness import router as awareness_router
from routes.runtime.goals import router as goals_router
from routes.runtime.memory import router as memory_router
from routes.runtime.sidecars import router as sidecars_router
from routes.runtime.status import router as status_router
from routes.runtime.workflows import router as workflows_router

router = APIRouter(prefix="/api/runtime", tags=["usejarvis-runtime"])
router.include_router(status_router)
router.include_router(memory_router)
router.include_router(awareness_router)
router.include_router(actions_router)
router.include_router(goals_router)
router.include_router(workflows_router)
router.include_router(sidecars_router)
