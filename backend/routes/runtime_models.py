from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class FactIn(BaseModel):
    fact_text: str = Field(min_length=1)
    source_type: str = "manual"
    source_ref: str | None = None
    confidence: float = 0.8
    importance: int = 3
    tags: list[str] = Field(default_factory=list)


class ExtractIn(BaseModel):
    text: str = Field(min_length=1)
    source_ref: str = "manual"


class AwarenessIn(BaseModel):
    event_type: str = Field(min_length=1)
    app_name: str | None = None
    window_title: str | None = None
    summary: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)


class AwarenessLoopIn(BaseModel):
    interval_seconds: int = 10


class ActionIn(BaseModel):
    action_type: str = Field(min_length=1)
    summary: str = Field(min_length=1)
    risk: str | None = None
    payload: dict[str, Any] = Field(default_factory=dict)


class ActionToolIn(BaseModel):
    tool_id: str = Field(min_length=1)
    payload: dict[str, Any] = Field(default_factory=dict)


class GoalIn(BaseModel):
    type: str = "objective"
    title: str = Field(min_length=1)
    description: str | None = None
    parent_id: str | None = None
    due_date: str | None = None


class WorkflowIn(BaseModel):
    name: str = Field(min_length=1)
    description: str | None = None
    trigger: dict[str, Any] = Field(default_factory=lambda: {"type": "manual"})
    nodes: list[dict[str, Any]] = Field(default_factory=list)
    edges: list[dict[str, Any]] = Field(default_factory=list)
    authority_policy: str = "high_requires_approval"


class WorkflowRunIn(BaseModel):
    input: dict[str, Any] = Field(default_factory=dict)


class WorkflowEnabledIn(BaseModel):
    enabled: bool


class SidecarIn(BaseModel):
    machine_id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    capabilities: list[str] = Field(default_factory=list)
    token_hint: str | None = None
