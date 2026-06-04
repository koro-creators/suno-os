"""
SPEC-015 — Pydantic v2 schemas for Onboarding + Wiki endpoints.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field, field_validator

# ---------------------------------------------------------------------------
# Shared type aliases
# ---------------------------------------------------------------------------

OntologyEntityType = Literal[
    "Posicionamento",
    "Persona",
    "Competidor",
    "Produto",
    "TomDeVoz",
    "Briefing",
]

EntityStatus = Literal["pending", "generated", "accepted", "regenerating"]
EntityBadge = Literal["seed_auto", "hitl", "capture"]
ClientStatus = Literal["DRAFT", "PRE_ACTIVE", "ACTIVE", "ARCHIVED", "CANCELLED"]
JobPhaseStatus = Literal["pending", "running", "done", "error"]
HITLAction = Literal["accept", "edit_accept", "reject_regenerate"]

# ---------------------------------------------------------------------------
# Oracle config
# ---------------------------------------------------------------------------


class OracleConfig(BaseModel):
    allowed_domains: list[str] = Field(default_factory=list)
    language: Literal["pt-BR", "en-US"] = "pt-BR"
    depth: Literal["shallow", "standard", "deep"] = "standard"


# ---------------------------------------------------------------------------
# Client creation (Wizard POST)
# ---------------------------------------------------------------------------


class ClientCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    slug: str = Field(..., min_length=1, max_length=100, pattern=r"^[a-z0-9-]+$")
    color: str = Field(default="#FFC801")
    description: str = Field(default="")
    sponsor_name: str = Field(default="")
    sponsor_email: str = Field(default="")
    oracle_config: OracleConfig = Field(default_factory=OracleConfig)
    selected_doc_ids: list[str] = Field(default_factory=list)


class ClientCreateResponse(BaseModel):
    id: str
    slug: str
    name: str
    status: ClientStatus
    job_id: str


class ClientSummary(BaseModel):
    id: str
    slug: str
    name: str
    color: str
    status: ClientStatus
    pre_active_since: datetime | None = None
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Onboarding job status (polling)
# ---------------------------------------------------------------------------


class OnboardingStatusResponse(BaseModel):
    client_id: str
    client_slug: str
    client_status: ClientStatus
    drive_sync_status: JobPhaseStatus
    oracle_status: JobPhaseStatus
    current_entity: OntologyEntityType | None
    entities_done: int
    total_entities: int
    entities: dict[OntologyEntityType, EntityStatus]
    error_detail: str | None
    eta_hours: int


# ---------------------------------------------------------------------------
# Start onboarding job
# ---------------------------------------------------------------------------


class StartOnboardingResponse(BaseModel):
    job_id: str
    status: Literal["started"]
    eta_hours: int


# ---------------------------------------------------------------------------
# HITL validation
# ---------------------------------------------------------------------------


class ValidateEntityRequest(BaseModel):
    action: HITLAction
    edited_content: str | None = None

    @field_validator("edited_content")
    @classmethod
    def edited_content_required_for_edit_accept(cls, v: str | None, info: Any) -> str | None:
        action = info.data.get("action")
        if action == "edit_accept" and not v:
            raise ValueError("edited_content is required when action is 'edit_accept'")
        return v


class ValidateEntityResponse(BaseModel):
    entity_type: OntologyEntityType
    status: EntityStatus
    badge: EntityBadge
    client_status: ClientStatus | None = None  # Set when last entity → ACTIVE


# ---------------------------------------------------------------------------
# Direct wiki edit (JN-15 — PX-07 Sponsor)
# ---------------------------------------------------------------------------


class DirectEditRequest(BaseModel):
    content: str = Field(..., min_length=1)


class DirectEditResponse(BaseModel):
    entity_type: OntologyEntityType
    content: str
    badge: EntityBadge
    status: EntityStatus


# ---------------------------------------------------------------------------
# Wiki entity
# ---------------------------------------------------------------------------


class ProvenanceEntry(BaseModel):
    source: str
    excerpt: str | None = None


class WikiEntityResponse(BaseModel):
    id: str
    client_id: str
    entity_type: OntologyEntityType
    content: str
    provenance: list[ProvenanceEntry]
    status: EntityStatus
    badge: EntityBadge
    created_at: datetime
    updated_at: datetime


class WikiPageResponse(BaseModel):
    client_id: str
    client_slug: str
    client_name: str
    entities: list[WikiEntityResponse]


# ---------------------------------------------------------------------------
# Audit log (Admin only)
# ---------------------------------------------------------------------------


class HitlEventResponse(BaseModel):
    id: str
    client_id: str
    entity_type: str
    action: str
    before_content: str | None = None
    after_content: str | None = None
    user_id: str
    timestamp_utc: datetime


class WikiAuditResponse(BaseModel):
    client_id: str
    client_slug: str
    events: list[HitlEventResponse]


# ---------------------------------------------------------------------------
# Client list response
# ---------------------------------------------------------------------------


class ClientListResponse(BaseModel):
    items: list[ClientSummary]
    total: int
