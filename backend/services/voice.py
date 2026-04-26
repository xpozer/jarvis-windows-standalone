from __future__ import annotations

from typing import Any, Dict, List, Optional
from fastapi import Request, HTTPException, UploadFile, File
from services import _runtime as core


def api_voice_runtime():
    return core.api_voice_runtime()

async def api_voice_runtime_save(req: Request):
    return await core.api_voice_runtime_save(req=req)

def api_voice_microphone_enable():
    return core.api_voice_microphone_enable()

def api_voice_microphone_disable():
    return core.api_voice_microphone_disable()

async def api_voice_transcript(req: Request):
    return await core.api_voice_transcript(req=req)

def api_voice_core():
    return core.api_voice_core()

def api_voice_presets():
    return core.api_voice_presets()

def api_voice_apply_preset(preset_id: str):
    return core.api_voice_apply_preset(preset_id=preset_id)

def api_voice_piper_status():
    return core.api_voice_piper_status()

def api_voice_piper_prepare():
    return core.api_voice_piper_prepare()

def api_voice_settings():
    return core.api_voice_settings()

async def api_voice_settings_save(req: Request):
    return await core.api_voice_settings_save(req=req)
