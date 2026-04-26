"""
JARVIS Authority Gating
Kontrolliert welche Aktionen Sub-Agenten ausfuehren duerfen.

Drei Levels:
  ALLOWED   - Agent darf direkt ausfuehren
  CONFIRM   - Agent muss beim Nutzer nachfragen
  DENIED    - Agent darf das nie

Konfigurierbar pro Agent und pro Aktion.
"""

from enum import Enum
from dataclasses import dataclass
from typing import Optional


class AuthLevel(str, Enum):
    ALLOWED = "allowed"
    CONFIRM = "confirm"
    DENIED  = "denied"


@dataclass
class AuthResult:
    level:   AuthLevel
    action:  str
    agent:   str
    reason:  str = ""


# ── Standard-Regeln ──────────────────────────────────────────────────
# Format: (agent, action_pattern) -> AuthLevel
# action_pattern: "read", "write", "delete", "execute", "send"

DEFAULT_RULES: dict[str, dict[str, AuthLevel]] = {
    # SAP Agent
    "sap": {
        "read":    AuthLevel.ALLOWED,   # Texte generieren, lesen
        "write":   AuthLevel.ALLOWED,   # SAP-Texte schreiben
        "delete":  AuthLevel.DENIED,    # Nie direkt loeschen
        "execute": AuthLevel.CONFIRM,   # Transaktion ausfuehren: nachfragen
        "send":    AuthLevel.CONFIRM,   # Mail verschicken: nachfragen
    },
    # Calendar Agent
    "calendar": {
        "read":    AuthLevel.ALLOWED,
        "write":   AuthLevel.ALLOWED,   # Termine vorschlagen
        "delete":  AuthLevel.CONFIRM,   # Termin loeschen: nachfragen
        "execute": AuthLevel.ALLOWED,
        "send":    AuthLevel.CONFIRM,
    },
    # Research Agent
    "research": {
        "read":    AuthLevel.ALLOWED,
        "write":   AuthLevel.ALLOWED,
        "delete":  AuthLevel.DENIED,
        "execute": AuthLevel.ALLOWED,
        "send":    AuthLevel.DENIED,
    },
    # Memory Agent
    "memory": {
        "read":    AuthLevel.ALLOWED,
        "write":   AuthLevel.ALLOWED,   # Fakten speichern
        "delete":  AuthLevel.CONFIRM,   # Fakten loeschen: nachfragen
        "execute": AuthLevel.ALLOWED,
        "send":    AuthLevel.DENIED,
    },
    # Email Agent
    "email": {
        "read":    AuthLevel.ALLOWED,   # Inbox scannen: immer erlaubt
        "write":   AuthLevel.CONFIRM,   # Mail verfassen: nachfragen
        "delete":  AuthLevel.CONFIRM,   # Mails loeschen: IMMER nachfragen
        "execute": AuthLevel.ALLOWED,
        "send":    AuthLevel.CONFIRM,   # Mail senden: nachfragen
    },
    # General Agent
    "general": {
        "read":    AuthLevel.ALLOWED,
        "write":   AuthLevel.ALLOWED,
        "delete":  AuthLevel.DENIED,
        "execute": AuthLevel.DENIED,
        "send":    AuthLevel.CONFIRM,
    },
    # File Agent
    "file": {
        "read":    AuthLevel.ALLOWED,   # PDFs lesen: immer erlaubt
        "write":   AuthLevel.ALLOWED,   # Zusammenfassungen schreiben
        "delete":  AuthLevel.DENIED,
        "execute": AuthLevel.ALLOWED,
        "send":    AuthLevel.DENIED,
    },
    # Exam Agent (IM-Pruefung)
    "exam": {
        "read":    AuthLevel.ALLOWED,
        "write":   AuthLevel.ALLOWED,   # Lernkarten erstellen
        "delete":  AuthLevel.DENIED,
        "execute": AuthLevel.ALLOWED,
        "send":    AuthLevel.DENIED,
    },
    # VDE Agent
    "vde": {
        "read":    AuthLevel.ALLOWED,   # Normen nachschlagen: immer
        "write":   AuthLevel.ALLOWED,
        "delete":  AuthLevel.DENIED,
        "execute": AuthLevel.ALLOWED,
        "send":    AuthLevel.DENIED,
    },
}

# ── User-Overrides (aus persistent_memory geladen) ────────────────────
_user_overrides: dict[str, dict[str, AuthLevel]] = {}

def load_user_overrides():
    """Laedt benutzerdefinierte Regeln aus der persistenten Memory."""
    global _user_overrides
    try:
        from persistent_memory import AgentMemory
        mem = AgentMemory("authority")
        overrides = mem.get("rules", {})
        for agent, rules in overrides.items():
            _user_overrides[agent] = {
                k: AuthLevel(v) for k, v in rules.items()
            }
    except Exception:
        pass

def check_authority(agent: str, action: str) -> AuthResult:
    """
    Prueft ob ein Agent eine Aktion ausfuehren darf.
    Gibt AuthResult mit Level und Grund zurueck.
    """
    # User-Overrides haben Vorrang
    if agent in _user_overrides and action in _user_overrides[agent]:
        level = _user_overrides[agent][action]
        return AuthResult(level=level, action=action, agent=agent,
                         reason=f"Benutzerdefinierte Regel: {agent}.{action} = {level.value}")

    # Standard-Regeln
    agent_rules = DEFAULT_RULES.get(agent, DEFAULT_RULES["general"])
    level = agent_rules.get(action, AuthLevel.CONFIRM)
    return AuthResult(level=level, action=action, agent=agent,
                     reason=f"Standard-Regel: {agent}.{action} = {level.value}")

def set_user_override(agent: str, action: str, level: AuthLevel):
    """Setzt eine benutzerdefinierte Regel."""
    if agent not in _user_overrides:
        _user_overrides[agent] = {}
    _user_overrides[agent][action] = level
    # Persistent speichern
    try:
        from persistent_memory import AgentMemory
        mem = AgentMemory("authority")
        current = mem.get("rules", {})
        if agent not in current:
            current[agent] = {}
        current[agent][action] = level.value
        mem.set("rules", current)
    except Exception:
        pass

def get_all_rules() -> dict:
    """Gibt alle Regeln zurueck (Standard + Overrides)."""
    result = {}
    for agent, rules in DEFAULT_RULES.items():
        result[agent] = {}
        for action, level in rules.items():
            # Override hat Vorrang
            if agent in _user_overrides and action in _user_overrides[agent]:
                result[agent][action] = _user_overrides[agent][action].value
            else:
                result[agent][action] = level.value
    return result

def get_confirmation_prompt(agent: str, action: str, details: str = "") -> str:
    """Generiert die Bestaetigung die dem Nutzer gezeigt wird."""
    agent_labels = {
        "sap": "SAP-Agent", "calendar": "Kalender-Agent",
        "research": "Recherche-Agent", "memory": "Memory-Agent",
        "email": "Email-Agent", "general": "General-Agent",
    }
    action_labels = {
        "read": "Lesen", "write": "Schreiben", "delete": "Loeschen",
        "execute": "Ausfuehren", "send": "Senden",
    }
    label = agent_labels.get(agent, agent)
    act = action_labels.get(action, action)
    msg = f"{label} moechte eine Aktion ausfuehren: {act}"
    if details:
        msg += f"\nDetails: {details}"
    msg += "\n\nErlauben? (ja/nein)"
    return msg


# ── FastAPI Routes ────────────────────────────────────────────────────
def create_authority_router():
    from fastapi import APIRouter
    from pydantic import BaseModel
    router = APIRouter(tags=["authority"])

    class CheckRequest(BaseModel):
        agent: str
        action: str

    class OverrideRequest(BaseModel):
        agent: str
        action: str
        level: str

    @router.get("/rules")
    async def list_rules():
        return {"rules": get_all_rules()}

    @router.post("/check")
    async def check(req: CheckRequest):
        result = check_authority(req.agent, req.action)
        return {
            "level": result.level.value,
            "agent": result.agent,
            "action": result.action,
            "reason": result.reason,
        }

    @router.post("/override")
    async def override(req: OverrideRequest):
        try:
            level = AuthLevel(req.level)
        except ValueError:
            return {"error": f"Ungueltiges Level: {req.level}. Erlaubt: allowed, confirm, denied"}
        set_user_override(req.agent, req.action, level)
        return {"ok": True, "agent": req.agent, "action": req.action, "level": level.value}

    return router

# Beim Import User-Overrides laden
load_user_overrides()
