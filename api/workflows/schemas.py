"""Pydantic schemas for the Workflow Builder API."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Shared / Building-block schemas
# ---------------------------------------------------------------------------


class WorkflowStep(BaseModel):
    id: str
    name: str
    type: str  # "tool" | "llm" | "condition" | "action" | "hitl"
    tool_name: str | None = None
    prompt: str | None = None
    config: dict[str, Any] = {}
    next_step: str | None = None
    condition: dict[str, Any] | None = None
    # condition shape: {"field": str, "operator": str, "value": Any, "then": str, "else": str}


class CronSchedule(BaseModel):
    cron: str
    timezone: str = "America/Sao_Paulo"
    enabled: bool = True


# ---------------------------------------------------------------------------
# Request schemas
# ---------------------------------------------------------------------------


class WorkflowCreate(BaseModel):
    name: str
    description: str = ""
    steps: list[WorkflowStep]
    schedule: CronSchedule | None = None
    client_scope: list[str] = []
    default_model: str = "gemini-flash"
    max_execution_time: int = 300


class WorkflowUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    steps: list[WorkflowStep] | None = None
    schedule: CronSchedule | None = None
    status: str | None = None
    client_scope: list[str] | None = None
    default_model: str | None = None
    max_execution_time: int | None = None


class RunWorkflowRequest(BaseModel):
    input_overrides: dict[str, Any] = {}
    model_override: str | None = None


class ResumeRunRequest(BaseModel):
    approved: bool
    feedback: str | None = None
    modifications: dict[str, Any] = {}


# ---------------------------------------------------------------------------
# Response schemas
# ---------------------------------------------------------------------------


class WorkflowRunSummary(BaseModel):
    run_id: str
    status: str
    completed_at: datetime | None = None


class WorkflowResponse(BaseModel):
    id: str
    name: str
    description: str | None
    status: str
    steps_count: int
    schedule_cron: str | None
    schedule_enabled: bool
    last_run: WorkflowRunSummary | None = None
    created_by: str
    created_at: datetime
    updated_at: datetime


class WorkflowDetailResponse(WorkflowResponse):
    definition: dict[str, Any]
    client_scope: list[str]
    default_model: str
    max_execution_time: int


class WorkflowListResponse(BaseModel):
    workflows: list[WorkflowResponse]
    total: int


class RunWorkflowResponse(BaseModel):
    run_id: str
    status: str
    started_at: datetime


class StepLogResponse(BaseModel):
    id: str
    step_id: str
    step_name: str | None
    status: str
    input: dict[str, Any] | None
    output: dict[str, Any] | None
    error: str | None
    duration_ms: int | None
    started_at: datetime | None
    completed_at: datetime | None


class WorkflowRunResponse(BaseModel):
    id: str
    workflow_id: str
    status: str
    trigger: str
    started_at: datetime | None
    completed_at: datetime | None
    error: str | None
    steps_output: dict[str, Any]
    step_logs: list[StepLogResponse] = []


class WorkflowRunListResponse(BaseModel):
    runs: list[WorkflowRunResponse]
    total: int
