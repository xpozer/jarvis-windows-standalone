"""
JARVIS Persistent Agent Memory
Einfaches JSON-basiertes Gedaechtnis fuer Sub-Agenten.
Ueberlebt Neustarts. Jeder Agent hat seinen eigenen Namespace.

Verwendung in Agenten:
    from persistent_memory import AgentMemory
    mem = AgentMemory("sap")
    mem.set("letzte_auftragsnr", "4500012345")
    nr = mem.get("letzte_auftragsnr")
    mem.append("verwendete_normen", "VDE 0100-600")
    alle = mem.get_all()
"""

import json
import os
import threading
from pathlib import Path
from typing import Any, Optional
from datetime import datetime

# Speicherort: neben den Backend-Dateien
MEMORY_DIR = Path(__file__).parent / "jarvis_memory"
MEMORY_DIR.mkdir(exist_ok=True)

_lock = threading.Lock()


class AgentMemory:
    def __init__(self, agent_name: str):
        self.agent = agent_name
        self.file = MEMORY_DIR / f"{agent_name}.json"
        self._data: dict = self._load()

    def _load(self) -> dict:
        with _lock:
            if self.file.exists():
                try:
                    with open(self.file, "r", encoding="utf-8") as f:
                        return json.load(f)
                except Exception:
                    return {"_created": datetime.now().isoformat(), "_entries": {}}
            return {"_created": datetime.now().isoformat(), "_entries": {}}

    def _save(self):
        self._data["_updated"] = datetime.now().isoformat()
        with _lock:
            with open(self.file, "w", encoding="utf-8") as f:
                json.dump(self._data, f, ensure_ascii=False, indent=2)

    def get(self, key: str, default: Any = None) -> Any:
        return self._data.get("_entries", {}).get(key, default)

    def set(self, key: str, value: Any):
        if "_entries" not in self._data:
            self._data["_entries"] = {}
        self._data["_entries"][key] = value
        self._save()

    def append(self, key: str, value: Any):
        """Fuegt einen Wert zu einer Liste hinzu (erstellt sie falls noetig)."""
        entries = self._data.setdefault("_entries", {})
        if key not in entries:
            entries[key] = []
        if isinstance(entries[key], list):
            if value not in entries[key]:
                entries[key].append(value)
        else:
            entries[key] = [entries[key], value]
        self._save()

    def remove(self, key: str):
        entries = self._data.get("_entries", {})
        if key in entries:
            del entries[key]
            self._save()

    def get_all(self) -> dict:
        return dict(self._data.get("_entries", {}))

    def get_summary(self, max_items: int = 10) -> str:
        """Gibt eine kompakte Zusammenfassung fuer den System-Prompt."""
        entries = self._data.get("_entries", {})
        if not entries:
            return ""
        lines = []
        for i, (k, v) in enumerate(entries.items()):
            if i >= max_items:
                lines.append(f"... und {len(entries) - max_items} weitere")
                break
            if isinstance(v, list):
                lines.append(f"{k}: {', '.join(str(x) for x in v[:5])}")
            else:
                lines.append(f"{k}: {v}")
        return "\n".join(lines)

    def clear(self):
        self._data = {"_created": datetime.now().isoformat(), "_entries": {}}
        self._save()


# ── FastAPI Routes fuer Memory-Verwaltung ────────────────────────────
def create_memory_router():
    from fastapi import APIRouter
    router = APIRouter(tags=["memory"])

    @router.get("/agents")
    async def list_agent_memories():
        files = list(MEMORY_DIR.glob("*.json"))
        return {
            "agents": [f.stem for f in files],
            "path": str(MEMORY_DIR),
        }

    @router.get("/{agent_name}")
    async def get_agent_memory(agent_name: str):
        mem = AgentMemory(agent_name)
        return {
            "agent": agent_name,
            "entries": mem.get_all(),
        }

    @router.post("/{agent_name}/set")
    async def set_agent_memory(agent_name: str, data: dict):
        mem = AgentMemory(agent_name)
        for k, v in data.items():
            mem.set(k, v)
        return {"ok": True, "agent": agent_name}

    @router.delete("/{agent_name}")
    async def clear_agent_memory(agent_name: str):
        mem = AgentMemory(agent_name)
        mem.clear()
        return {"ok": True, "agent": agent_name, "cleared": True}

    return router
