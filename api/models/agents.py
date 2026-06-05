"""SQLAlchemy models para Agents (SPEC-021 / FA-17 / A-5).

Espelha 010_agents.sql + 015_agents_portable.sql. Apenas as tabelas usadas pelos
endpoints atuais: agents, agent_runs, agent_schedules. As tabelas-filhas
(permissions/skills/app/memory) seguem órfãs (sem CRUD ainda).

Tipos portáveis (Uuid/JSON/String) para Postgres + SQLite.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, Column, DateTime, Integer, String, Text, Uuid

from .base import Base


def _now() -> datetime:
    return datetime.now(timezone.utc)


class Agent(Base):
    __tablename__ = "agents"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    name = Column(String(120), nullable=False)
    icon = Column(String(100), nullable=False, default="🤖")
    instructions = Column(Text, nullable=False, default="")
    status = Column(String(20), nullable=False, default="draft")
    created_by = Column(Uuid, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=_now)
    updated_at = Column(DateTime(timezone=True), nullable=False, default=_now, onupdate=_now)

    def to_dict(self, last_run_at: datetime | None = None) -> dict:
        return {
            "id": str(self.id),
            "name": self.name,
            "icon": self.icon,
            "instructions": self.instructions,
            "status": self.status,
            "skill_count": 0,  # populado quando SPEC-017 (skills em DB) chegar
            "client_count": 0,
            "last_run_at": last_run_at,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


class AgentRun(Base):
    __tablename__ = "agent_runs"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    agent_id = Column(Uuid, nullable=False, index=True)
    client_id = Column(Uuid, nullable=True)
    triggered_by = Column(String(20), nullable=False)  # manual | schedule | preview
    status = Column(String(20), nullable=False, default="pending")
    input = Column(JSON, nullable=False, default=dict)
    output = Column(JSON, nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=False, default=_now)
    finished_at = Column(DateTime(timezone=True), nullable=True)
    duration_ms = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    scheduled_run_at = Column(DateTime(timezone=True), nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "agent_id": str(self.agent_id),
            "status": self.status,
            "triggered_by": self.triggered_by,
            "client_id": str(self.client_id) if self.client_id else None,
            "duration_ms": self.duration_ms,
            "started_at": self.started_at,
            "finished_at": self.finished_at,
            "error_message": self.error_message,
            "input": self.input or {},
            "output": self.output,
        }


class AgentSchedule(Base):
    __tablename__ = "agent_schedules"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    agent_id = Column(Uuid, nullable=False, unique=True, index=True)
    frequency = Column(String(20), nullable=False)  # hourly | daily
    days_of_week = Column(JSON, nullable=True)  # list[int] ou None
    time_of_day = Column(String(5), nullable=True)  # "HH:MM"
    minute_offset = Column(Integer, default=0)
    timezone = Column(String(50), nullable=False, default="America/Sao_Paulo")
    enabled = Column(Boolean, nullable=False, default=False)
    last_run_at = Column(DateTime(timezone=True), nullable=True)
    next_run_at = Column(DateTime(timezone=True), nullable=True)

    def to_dict(self) -> dict:
        return {
            "id": str(self.id),
            "frequency": self.frequency,
            "days_of_week": self.days_of_week,
            "time_of_day": self.time_of_day,
            "minute_offset": self.minute_offset or 0,
            "timezone": self.timezone,
            "enabled": self.enabled,
            "last_run_at": self.last_run_at,
            "next_run_at": self.next_run_at,
        }
