from __future__ import annotations

from typing import Any


def workflow_node_registry() -> dict[str, Any]:
    triggers = ["manual", "cron", "interval", "webhook", "file_changed", "folder_changed", "screen_event", "app_opened", "app_closed", "clipboard_changed", "process_started", "process_stopped", "git_commit", "git_push", "email_received", "calendar_event", "goal_behind_schedule"]
    actions = ["agent_task", "browser_navigate", "browser_click", "browser_extract", "desktop_click", "desktop_type", "shell_command", "file_read", "file_write", "file_copy", "file_move", "git_status", "git_commit", "github_issue", "github_pull_request", "notification", "email_draft", "calendar_create", "memory_write", "goal_update"]
    logic = ["if_else", "switch", "loop", "delay", "wait_until", "merge", "race", "variable_set", "variable_get", "template_render", "json_parse", "regex_extract", "map", "filter", "aggregate"]
    errors = ["retry", "fallback", "error_handler", "compensate", "ask_user", "escalate_authority", "self_heal"]
    return {"ok": True, "count": len(triggers) + len(actions) + len(logic) + len(errors), "triggers": triggers, "actions": actions, "logic": logic, "error_handling": errors}


def agents() -> list[dict[str, Any]]:
    roles = [("primary", "Primary Agent", "Nutzerkontakt, Kontext, Freigaben"), ("researcher", "Researcher", "Recherche, Quellen, Vergleich"), ("coder", "Coder", "Code Analyse, Patches, Tests"), ("reviewer", "Reviewer", "Prüfung von Qualität und Risiko"), ("planner", "Planner", "Ziele, Reihenfolge, Tagesplanung"), ("writer", "Writer", "Doku, Texte, Spezifikationen"), ("analyst", "Analyst", "Datenanalyse und Metriken"), ("sysadmin", "Sysadmin", "Windows, Dienste, Logs"), ("devops", "DevOps", "Git, Builds, Releases"), ("security", "Security", "Secrets, Rechte, Freigaben"), ("designer", "Designer", "UI und visuelle Systeme"), ("data_engineer", "Data Engineer", "Speicher, Vektoren, ETL")]
    return [{"id": rid, "name": name, "description": desc, "authority": "prepare_only" if rid != "primary" else "approval_owner"} for rid, name, desc in roles]
