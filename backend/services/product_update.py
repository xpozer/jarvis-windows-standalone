from __future__ import annotations

import hashlib
import json
import os
import shutil
import urllib.error
import urllib.request
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import HTTPException, UploadFile

from config import (
    BASE_DIR, BACKUP_DIR, DATA_DIR, UPDATE_DIR, UPDATE_STAGING_DIR,
    UPDATE_MANIFEST_FILE, UPDATE_PLAN_FILE, INSTALL_STATE_FILE, APP_VERSION,
)
from utils import read_json, write_json, log


def _stamp() -> str:
    return datetime.now().strftime("%Y%m%d_%H%M%S")


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def github_update_config() -> dict[str, Any]:
    owner = os.environ.get("JARVIS_GITHUB_OWNER", "").strip()
    repo = os.environ.get("JARVIS_GITHUB_REPO", "").strip()
    token = os.environ.get("JARVIS_GITHUB_TOKEN", "").strip()
    release = os.environ.get("JARVIS_GITHUB_RELEASE", "latest").strip() or "latest"
    package_asset = os.environ.get("JARVIS_GITHUB_PACKAGE_ASSET", "").strip()
    manifest_asset = os.environ.get("JARVIS_GITHUB_MANIFEST_ASSET", "jarvis-update-manifest.json").strip()

    api_url = ""
    if owner and repo:
        if release == "latest":
            api_url = f"https://api.github.com/repos/{owner}/{repo}/releases/latest"
        else:
            api_url = f"https://api.github.com/repos/{owner}/{repo}/releases/tags/{release}"

    return {
        "mode": "private_github_release",
        "private": True,
        "configured": bool(owner and repo),
        "owner": owner,
        "repo": repo,
        "release": release,
        "api_url": api_url,
        "package_asset": package_asset,
        "manifest_asset": manifest_asset,
        "token_env": "JARVIS_GITHUB_TOKEN",
        "token_configured": bool(token),
    }


def build_github_headers(binary: bool = False) -> dict[str, str]:
    headers = {
        "Accept": "application/octet-stream" if binary else "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "JARVIS-Windows-Standalone-Updater",
    }
    token = os.environ.get("JARVIS_GITHUB_TOKEN", "").strip()
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def _github_request_json(url: str) -> dict[str, Any]:
    req = urllib.request.Request(url, headers=build_github_headers())
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        raise HTTPException(exc.code, f"GitHub Anfrage fehlgeschlagen: HTTP {exc.code}") from exc
    except urllib.error.URLError as exc:
        raise HTTPException(503, f"GitHub nicht erreichbar: {exc.reason}") from exc


def _download_github_asset(asset_api_url: str, target: Path) -> None:
    req = urllib.request.Request(asset_api_url, headers=build_github_headers(binary=True))
    try:
        with urllib.request.urlopen(req, timeout=120) as resp, target.open("wb") as f:
            shutil.copyfileobj(resp, f)
    except urllib.error.HTTPError as exc:
        raise HTTPException(exc.code, f"GitHub Asset Download fehlgeschlagen: HTTP {exc.code}") from exc
    except urllib.error.URLError as exc:
        raise HTTPException(503, f"GitHub Asset Download nicht erreichbar: {exc.reason}") from exc


def _select_release_asset(release: dict[str, Any], asset_name: str = "") -> dict[str, Any]:
    assets = release.get("assets") or []
    if asset_name:
        for asset in assets:
            if asset.get("name") == asset_name:
                return asset
        raise HTTPException(404, f"GitHub Release Asset nicht gefunden: {asset_name}")

    for asset in assets:
        name = str(asset.get("name") or "")
        if name.lower().endswith(".zip"):
            return asset
    raise HTTPException(404, "Kein ZIP Asset im GitHub Release gefunden")


def check_github_release_update() -> dict[str, Any]:
    cfg = github_update_config()
    if not cfg["configured"]:
        raise HTTPException(400, "JARVIS_GITHUB_OWNER und JARVIS_GITHUB_REPO muessen gesetzt sein.")
    if not cfg["token_configured"]:
        raise HTTPException(401, "Privates GitHub Update braucht JARVIS_GITHUB_TOKEN.")

    release = _github_request_json(cfg["api_url"])
    asset = _select_release_asset(release, cfg["package_asset"])
    latest_version = str(release.get("tag_name") or release.get("name") or "")

    return {
        "current_version": APP_VERSION,
        "latest_version": latest_version,
        "update_available": bool(latest_version and latest_version != APP_VERSION),
        "release_name": release.get("name"),
        "release_url": release.get("html_url"),
        "asset": {
            "name": asset.get("name"),
            "size_kb": round(int(asset.get("size") or 0) / 1024, 1),
            "updated_at": asset.get("updated_at"),
        },
        "config": cfg,
    }


def stage_github_release_update(asset_name: str = "") -> dict[str, Any]:
    cfg = github_update_config()
    if not cfg["configured"]:
        raise HTTPException(400, "JARVIS_GITHUB_OWNER und JARVIS_GITHUB_REPO muessen gesetzt sein.")
    if not cfg["token_configured"]:
        raise HTTPException(401, "Privates GitHub Update braucht JARVIS_GITHUB_TOKEN.")

    release = _github_request_json(cfg["api_url"])
    asset = _select_release_asset(release, asset_name or cfg["package_asset"])
    safe_name = "".join(c if c.isalnum() or c in "._-" else "_" for c in str(asset.get("name") or "github_update.zip"))
    UPDATE_STAGING_DIR.mkdir(parents=True, exist_ok=True)
    target = UPDATE_STAGING_DIR / f"{_stamp()}_{safe_name}"
    _download_github_asset(str(asset["url"]), target)

    check = _zip_has_valid_root(target)
    if not check["valid"]:
        bad = target.with_suffix(".invalid.zip")
        target.rename(bad)
        raise HTTPException(400, {"error": "GitHub Update ZIP ist nicht gueltig", "check": check, "saved_as": str(bad)})

    manifest = {
        "staged_at": datetime.now().isoformat(timespec="seconds"),
        "source": "private_github_release",
        "release": str(release.get("tag_name") or release.get("name") or ""),
        "filename": asset.get("name"),
        "path": str(target),
        "sha256": _sha256(target),
        "size_kb": round(target.stat().st_size / 1024, 1),
        "check": check,
        "status": "staged",
    }
    write_json(UPDATE_MANIFEST_FILE, manifest)
    log("INFO", "github_update_staged", path=str(target), release=manifest["release"])
    return manifest


def _zip_has_valid_root(zip_path: Path) -> dict[str, Any]:
    with zipfile.ZipFile(zip_path, "r") as z:
        names = z.namelist()
    has_backend = any(n.endswith("/backend/main.py") or n == "backend/main.py" for n in names)
    has_installer = any(n.endswith("/INSTALL_JARVIS.ps1") or n == "INSTALL_JARVIS.ps1" for n in names)
    top = sorted({n.split("/")[0] for n in names if n and not n.startswith("__MACOSX")})[:10]
    return {"valid": has_backend and has_installer, "has_backend": has_backend, "has_installer": has_installer, "top_entries": top, "file_count": len(names)}


def update_status() -> dict[str, Any]:
    manifest = read_json(UPDATE_MANIFEST_FILE, {})
    plan = read_json(UPDATE_PLAN_FILE, {})
    state = read_json(INSTALL_STATE_FILE, {})
    return {
        "current_version": APP_VERSION,
        "mode": "local_staged_zip",
        "manifest": manifest,
        "plan": plan,
        "install_state": state,
        "github": github_update_config(),
        "updates_dir": str(UPDATE_DIR),
        "message": "Updates werden vorbereitet und gestaged. Überschreiben des laufenden Systems erfolgt über UPDATE_JARVIS.ps1.",
    }


def package_manifest() -> dict[str, Any]:
    return {
        "app": "JARVIS Windows Standalone",
        "version": APP_VERSION,
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "base_dir": str(BASE_DIR),
        "update_format": "zip",
        "update_source": "private_github_release",
        "requires": ["Python 3.12+", "Node.js LTS", "Ollama optional"],
    }


async def stage_update_upload(file: UploadFile) -> dict[str, Any]:
    if not file.filename.lower().endswith(".zip"):
        raise HTTPException(400, "Nur ZIP Updatepakete erlaubt")
    UPDATE_STAGING_DIR.mkdir(parents=True, exist_ok=True)
    safe_name = "".join(c if c.isalnum() or c in "._-" else "_" for c in file.filename)
    target = UPDATE_STAGING_DIR / f"{_stamp()}_{safe_name}"
    content = await file.read()
    target.write_bytes(content)
    check = _zip_has_valid_root(target)
    if not check["valid"]:
        bad = target.with_suffix(".invalid.zip")
        target.rename(bad)
        raise HTTPException(400, {"error": "Update ZIP ist nicht gültig", "check": check, "saved_as": str(bad)})
    manifest = {
        "staged_at": datetime.now().isoformat(timespec="seconds"),
        "filename": file.filename,
        "path": str(target),
        "sha256": _sha256(target),
        "size_kb": round(target.stat().st_size / 1024, 1),
        "check": check,
        "status": "staged",
    }
    write_json(UPDATE_MANIFEST_FILE, manifest)
    log("INFO", "update_staged", path=str(target))
    return manifest


def prepare_update_plan(target_version: str = "", source: str = "manual") -> dict[str, Any]:
    manifest = read_json(UPDATE_MANIFEST_FILE, {})
    if not manifest.get("path"):
        raise HTTPException(400, "Kein Updatepaket gestaged. Erst /update/stage-upload nutzen.")
    plan = {
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "current_version": APP_VERSION,
        "target_version": target_version or manifest.get("filename", "staged_zip"),
        "source": source,
        "staged_zip": manifest,
        "steps": [
            "laufende JARVIS Prozesse beenden",
            "Backup der aktuellen Installation erstellen",
            "Update ZIP in temporären Ordner entpacken",
            "bestehende Installation sichern",
            "neue Dateien kopieren",
            "data, logs, backups standardmäßig behalten",
            "FIRST_SETUP.ps1 ausführen",
            "START_JARVIS.ps1 starten",
        ],
        "script": "UPDATE_JARVIS.ps1",
        "auto_apply_inside_running_backend": False,
    }
    write_json(UPDATE_PLAN_FILE, plan)
    return plan


def list_staged_updates() -> dict[str, Any]:
    items = []
    for p in sorted(UPDATE_STAGING_DIR.glob("*.zip"), key=lambda x: x.stat().st_mtime, reverse=True):
        items.append({"name": p.name, "path": str(p), "sha256": _sha256(p), "size_kb": round(p.stat().st_size / 1024, 1)})
    return {"updates": items}


def rollback_candidates() -> dict[str, Any]:
    items = []
    for p in sorted(BACKUP_DIR.glob("*"), key=lambda x: x.stat().st_mtime, reverse=True):
        items.append({"name": p.name, "path": str(p), "is_zip": p.suffix.lower() == ".zip", "modified": datetime.fromtimestamp(p.stat().st_mtime).isoformat(timespec="seconds")})
    return {"rollback_candidates": items}
