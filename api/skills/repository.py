"""Repository do catálogo de Skills (feature SPEC-017).

Mapeia o payload camelCase do frontend (systemPrompt, maxTokens, …) para as
colunas snake_case do model. `to_dict` (no model) devolve camelCase de volta.
"""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

try:
    from models.skill import Skill
except ImportError:  # test import root (repo root on sys.path)
    from api.models.skill import Skill

# camelCase (API) → coluna (snake_case)
_FIELD_MAP = {
    "name": "name",
    "slug": "slug",
    "type": "type",
    "description": "description",
    "icon": "icon",
    "status": "status",
    "systemPrompt": "system_prompt",
    "model": "model",
    "temperature": "temperature",
    "maxTokens": "max_tokens",
    "moons": "moons",
    "assignedClients": "assigned_clients",
    "versions": "versions",
    "createdBy": "created_by",
    "averageScore": "average_score",
    "totalFeedbacks": "total_feedbacks",
}


def _apply(skill: Skill, data: dict) -> None:
    for camel, col in _FIELD_MAP.items():
        if camel in data and data[camel] is not None:
            setattr(skill, col, data[camel])


def list_skills(session: Session, status: str | None = None, type: str | None = None) -> list[dict]:
    query = session.query(Skill)
    if status:
        query = query.filter(Skill.status == status)
    if type:
        query = query.filter(Skill.type == type)
    rows = query.order_by(Skill.updated_at.desc()).all()
    return [s.to_dict() for s in rows]


def get_skill(session: Session, skill_id: str) -> dict | None:
    skill = session.get(Skill, skill_id)
    return skill.to_dict() if skill else None


def create_skill(session: Session, data: dict) -> dict:
    skill = Skill(id=f"skill-{uuid.uuid4().hex[:12]}")
    _apply(skill, data)
    session.add(skill)
    session.commit()
    session.refresh(skill)
    return skill.to_dict()


def update_skill(session: Session, skill_id: str, data: dict) -> dict | None:
    skill = session.get(Skill, skill_id)
    if skill is None:
        return None
    _apply(skill, data)
    session.commit()
    session.refresh(skill)
    return skill.to_dict()


def delete_skill(session: Session, skill_id: str) -> bool:
    skill = session.get(Skill, skill_id)
    if skill is None:
        return False
    session.delete(skill)
    session.commit()
    return True
