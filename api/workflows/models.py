"""SQLAlchemy models for workflow engine."""

from __future__ import annotations

import uuid

from sqlalchemy import (
    Boolean,
    Column,
    ForeignKey,
    Integer,
    String,
    Text,
    text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, TIMESTAMP, UUID
from sqlalchemy.orm import relationship

from models.conversation import Base


class Workflow(Base):
    """Persisted workflow definition."""

    __tablename__ = "workflows"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    created_by = Column(String(255), nullable=False)
    definition = Column(JSONB, nullable=False)  # WorkflowDefinition completa
    schedule_cron = Column(String(100))
    schedule_timezone = Column(String(50), default="America/Sao_Paulo")
    schedule_enabled = Column(Boolean, default=False)
    client_scope = Column(ARRAY(Text))
    default_model = Column(String(50), default="gemini-flash")
    max_execution_time = Column(Integer, default=300)
    on_error_notify = Column(String(255))
    is_template = Column(Boolean, default=False)
    status = Column(String(20), default="draft")  # draft|active|paused
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("NOW()"))
    updated_at = Column(TIMESTAMP(timezone=True), server_default=text("NOW()"))

    runs = relationship(
        "WorkflowRun",
        back_populates="workflow",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Workflow id={self.id!r} name={self.name!r} status={self.status!r}>"


class WorkflowRun(Base):
    """Single execution of a workflow."""

    __tablename__ = "workflow_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workflows.id", ondelete="CASCADE"),
        nullable=False,
    )
    status = Column(String(20), nullable=False, default="pending")  # pending|running|paused|completed|failed
    trigger = Column(String(20), nullable=False, default="manual")  # manual|scheduler|api
    started_at = Column(TIMESTAMP(timezone=True))
    completed_at = Column(TIMESTAMP(timezone=True))
    error = Column(Text)
    steps_output = Column(JSONB, default={})
    checkpoint_data = Column(JSONB)
    created_at = Column(TIMESTAMP(timezone=True), server_default=text("NOW()"))

    workflow = relationship("Workflow", back_populates="runs")
    step_logs = relationship(
        "StepLog",
        back_populates="run",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<WorkflowRun id={self.id!r} status={self.status!r}>"


class StepLog(Base):
    """Log entry for a single step execution within a run."""

    __tablename__ = "step_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    run_id = Column(
        UUID(as_uuid=True),
        ForeignKey("workflow_runs.id", ondelete="CASCADE"),
        nullable=False,
    )
    step_id = Column(String(100), nullable=False)
    step_name = Column(String(255))
    status = Column(String(20), nullable=False)  # running|completed|failed|skipped
    input = Column(JSONB)
    output = Column(JSONB)
    error = Column(Text)
    duration_ms = Column(Integer)
    started_at = Column(TIMESTAMP(timezone=True))
    completed_at = Column(TIMESTAMP(timezone=True))

    run = relationship("WorkflowRun", back_populates="step_logs")

    def __repr__(self) -> str:
        return f"<StepLog id={self.id!r} step={self.step_id!r} status={self.status!r}>"
