"""Pydantic schemas for the Agents API — SPEC-021 FA-17."""

from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

AgentStatus = Literal["draft", "active", "inactive", "archived"]
RunStatus = Literal["pending", "running", "completed", "failed", "timed_out"]
TriggeredBy = Literal["manual", "schedule", "preview"]


# ---------------------------------------------------------------------------
# Agent CRUD
# ---------------------------------------------------------------------------


class AgentCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    icon: str = Field(default="🤖", max_length=100)
    instructions: str = Field(default="")
    status: AgentStatus = "draft"


class AgentUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=120)
    icon: str | None = Field(default=None, max_length=100)
    instructions: str | None = None
    status: AgentStatus | None = None


class AgentSummary(BaseModel):
    id: str
    name: str
    icon: str
    status: AgentStatus
    skill_count: int = 0
    client_count: int = 0
    last_run_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class AgentDetail(AgentSummary):
    instructions: str


# ---------------------------------------------------------------------------
# Sub-resources
# ---------------------------------------------------------------------------


class AgentPermissionOut(BaseModel):
    client_id: str
    client_name: str
    granted_by_name: str
    granted_at: datetime


class AgentSkillOut(BaseModel):
    skill_slug: str
    skill_name: str
    assigned_at: datetime


class AppConnectionOut(BaseModel):
    id: str
    app_type: str
    enabled: bool
    connected_at: datetime


class MemoryFileOut(BaseModel):
    id: str
    filename: str
    content_type: str
    size_bytes: int
    created_at: datetime


class AgentScheduleConfig(BaseModel):
    """Input schema for PATCH /agents/{id}/schedule."""

    enabled: bool
    frequency: Literal["hourly", "daily"] = "daily"
    days_of_week: list[int] | None = None  # 0=Mon … 6=Sun (ISO weekday-1)
    time_of_day: str | None = None  # "HH:MM" 24h
    timezone: str = "America/Sao_Paulo"


class AgentScheduleOut(BaseModel):
    id: str
    frequency: Literal["hourly", "daily"]
    days_of_week: list[int] | None = None
    time_of_day: str | None = None
    minute_offset: int = 0
    timezone: str = "America/Sao_Paulo"
    enabled: bool = False
    last_run_at: datetime | None = None
    next_run_at: datetime | None = None


# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------


class AgentRunSummary(BaseModel):
    id: str
    status: RunStatus
    triggered_by: TriggeredBy
    client_id: str | None = None
    duration_ms: int | None = None
    started_at: datetime
    finished_at: datetime | None = None
    error_message: str | None = None


class AgentRunDetail(AgentRunSummary):
    input: dict
    output: dict | None = None


class AgentRunRequest(BaseModel):
    input: str = Field(..., min_length=1, description="Text input for the agent")
    client_id: str | None = None


class RunResponse(BaseModel):
    run_id: str
