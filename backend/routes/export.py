from __future__ import annotations

from fastapi import APIRouter, Request
from services import export as export_service

router = APIRouter()

@router.get("/export/formats")
def api_export_formats():
    return export_service.list_export_formats()

@router.get("/export/list")
def api_export_list():
    return export_service.list_exports()

@router.post("/export/text")
async def api_export_text(req: Request):
    body = await req.json()
    return export_service.export_text(
        title=str(body.get("title") or "JARVIS Export"),
        content=str(body.get("content") or ""),
        fmt=str(body.get("format") or "md"),
    )

@router.get("/export/data.zip")
def api_export_data_zip(include_logs: bool = True):
    return export_service.create_data_export_zip(include_logs=include_logs)

@router.get("/export/{source}")
def api_export_source(source: str, format: str = "json"):
    return export_service.export_json_file(source, fmt=format)
