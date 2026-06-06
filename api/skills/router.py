"""FastAPI router para o catálogo de Skills (feature SPEC-017). DB-backed."""

from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

try:
    from core.db import get_session
    from skills import repository
except ImportError:  # test import root (repo root on sys.path)
    from api.core.db import get_session
    from api.skills import repository

from .schemas import SkillCreate, SkillUpdate

router = APIRouter(tags=["Skills"])


@router.get("/")
async def list_skills(
    status: Optional[str] = None,
    type: Optional[str] = None,
    session: Session = Depends(get_session),
) -> list[dict]:
    return repository.list_skills(session, status=status, type=type)


@router.post("/", status_code=201)
async def create_skill(req: SkillCreate, session: Session = Depends(get_session)) -> dict:
    return repository.create_skill(session, req.model_dump())


@router.get("/{skill_id}")
async def get_skill(skill_id: str, session: Session = Depends(get_session)) -> dict:
    skill = repository.get_skill(session, skill_id)
    if skill is None:
        raise HTTPException(status_code=404, detail="Not found")
    return skill


@router.patch("/{skill_id}")
async def update_skill(
    skill_id: str,
    req: SkillUpdate,
    session: Session = Depends(get_session),
) -> dict:
    updated = repository.update_skill(session, skill_id, req.model_dump(exclude_unset=True))
    if updated is None:
        raise HTTPException(status_code=404, detail="Not found")
    return updated


@router.delete("/{skill_id}", status_code=204)
async def delete_skill(skill_id: str, session: Session = Depends(get_session)) -> None:
    if not repository.delete_skill(session, skill_id):
        raise HTTPException(status_code=404, detail="Not found")
