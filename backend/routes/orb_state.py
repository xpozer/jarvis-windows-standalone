from __future__ import annotations

import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()


@router.websocket("/orb-state")
async def orb_state_socket(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_json({"type": "state_change", "state": "idle"})
    try:
        while True:
            await asyncio.sleep(30)
            await websocket.send_json({"type": "state_change", "state": "idle"})
    except WebSocketDisconnect:
        return
