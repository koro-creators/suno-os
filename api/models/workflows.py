"""SQLAlchemy models para Workflows (SPEC-005 / A-4).

Espelha 002_workflow_tables.sql + 003_workflow_canvas_v2.sql. Tipos portáveis
(Uuid/JSON) para Postgres + SQLite (testes). `definition` guarda steps + metadata
em JSON; `edges` é tabela separada (workflow_edges).
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, Column, DateTime, Integer, String, Text, Uuid

from .base import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Workflow(Base):
    __tablename__ = "workflows"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    created_by = Column(String(255), nullable=False)
    definition = Column(JSON, nullable=False, default=dict)
    schedule_cron = Column(String(100), nullable=True)
    schedule_timezone = Column(String(50), default="America/Sao_Paulo")
    schedule_enabled = Column(Boolean, default=False)
    client_scope = Column(JSON, nullable=True)  # list[str] (PG: TEXT[]; portável via JSON)
    default_model = Column(String(50), default="gemini-flash")
    max_execution_time = Column(Integer, default=300)
    on_error_notify = Column(String(255), nullable=True)
    is_template = Column(Boolean, default=False)
    status = Column(String(20), default="draft")
    updated_by = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)
    updated_at = Column(DateTime(timezone=True), default=_now, onupdate=_now)


class WorkflowEdge(Base):
    __tablename__ = "workflow_edges"

    edge_id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    workflow_id = Column(Uuid, nullable=False, index=True)
    source_step_id = Column(String(100), nullable=False)
    source_handle = Column(String(20), nullable=False)
    target_step_id = Column(String(100), nullable=False)
    target_handle = Column(String(20), nullable=False, default="in")
    created_at = Column(DateTime(timezone=True), default=_now)


class WorkflowRun(Base):
    __tablename__ = "workflow_runs"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    workflow_id = Column(Uuid, nullable=False, index=True)
    status = Column(String(20), nullable=False, default="pending")
    trigger = Column(String(20), nullable=False, default="manual")
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    error = Column(Text, nullable=True)
    steps_output = Column(JSON, default=dict)
    checkpoint_data = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=_now)


class StepLog(Base):
    __tablename__ = "step_logs"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    run_id = Column(Uuid, nullable=False, index=True)
    step_id = Column(String(100), nullable=False)
    step_name = Column(String(255), nullable=True)
    status = Column(String(20), nullable=False)
    input = Column(JSON, nullable=True)
    output = Column(JSON, nullable=True)
    error = Column(Text, nullable=True)
    duration_ms = Column(Integer, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
