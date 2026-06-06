"""Pydantic schemas para o catálogo de Skills (camelCase = tipo SkillAdmin do front)."""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field

SkillType = Literal["criacao", "midia", "planejamento"]
SkillStatus = Literal["active", "draft", "archived"]


class Moon(BaseModel):
    id: str
    name: str
    slug: str
    description: str = ""


class SkillVersion(BaseModel):
    version: int
    date: str
    author: str
    summary: str


class SkillCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=120)
    type: SkillType
    description: str = ""
    icon: Optional[str] = None
    status: SkillStatus = "draft"
    systemPrompt: str = ""
    model: Optional[str] = None
    temperature: float = Field(0.7, ge=0.0, le=2.0)
    maxTokens: int = Field(4096, ge=256)
    moons: list[Moon] = Field(default_factory=list)
    assignedClients: list[str] = Field(default_factory=list)
    versions: list[SkillVersion] = Field(default_factory=list)
    createdBy: Optional[str] = None
    averageScore: float = 0
    totalFeedbacks: int = 0


class SkillUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=200)
    slug: Optional[str] = Field(None, max_length=120)
    type: Optional[SkillType] = None
    description: Optional[str] = None
    icon: Optional[str] = None
    status: Optional[SkillStatus] = None
    systemPrompt: Optional[str] = None
    model: Optional[str] = None
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0)
    maxTokens: Optional[int] = Field(None, ge=256)
    moons: Optional[list[Moon]] = None
    assignedClients: Optional[list[str]] = None
    versions: Optional[list[SkillVersion]] = None
    averageScore: Optional[float] = None
    totalFeedbacks: Optional[int] = None
