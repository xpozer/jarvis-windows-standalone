from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Request, HTTPException, UploadFile, File


from services import voice as voice_service

router = APIRouter()

@router.get("/voice/runtime")
def api_voice_runtime():
    return voice_service.api_voice_runtime()

@router.post("/voice/runtime")
async def api_voice_runtime_save(req: Request):
    return await voice_service.api_voice_runtime_save(req=req)

@router.post("/voice/microphone/enable")
def api_voice_microphone_enable():
    return voice_service.api_voice_microphone_enable()

@router.post("/voice/microphone/disable")
def api_voice_microphone_disable():
    return voice_service.api_voice_microphone_disable()

@router.post("/voice/transcript")
async def api_voice_transcript(req: Request):
    return await voice_service.api_voice_transcript(req=req)

@router.get("/voice/core")
def api_voice_core():
    return voice_service.api_voice_core()

@router.get("/voice/presets")
def api_voice_presets():
    return voice_service.api_voice_presets()

@router.post("/voice/preset/{preset_id}")
def api_voice_apply_preset(preset_id: str):
    return voice_service.api_voice_apply_preset(preset_id=preset_id)

@router.get("/voice/piper/status")
def api_voice_piper_status():
    return voice_service.api_voice_piper_status()

@router.post("/voice/piper/prepare")
def api_voice_piper_prepare():
    return voice_service.api_voice_piper_prepare()

@router.get("/voice/settings")
def api_voice_settings():
    return voice_service.api_voice_settings()

@router.post("/voice/settings")
async def api_voice_settings_save(req: Request):
    return await voice_service.api_voice_settings_save(req=req)
