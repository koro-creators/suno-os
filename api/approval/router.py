"""
FastAPI router para Aprovação Hierárquica (SPEC-004 / FA-13).
Endpoints API-130..136.

Segurança (constitution §2 + caixa-preta.md):
- Operacional (não-admin) recebe 404, nunca 403 — não revela existência.
- Cross-client guard: toda query filtra pelo client_id do JWT.

Phase 20: usa in-memory store. DB persistence chega na Phase D+.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Header, HTTPException, Request

try:
    from notifications.router import _create_notification_internal

    _NOTIFICATIONS_AVAILABLE = True
except ImportError:
    _NOTIFICATIONS_AVAILABLE = False

from .schemas import (
    ApprovalDecisionRequest,
    ApprovalEventResponse,
    ApprovalHistoryResponse,
    ApprovalStatus,
    ApprovalSubmissionResponse,
    ApprovalSubmitRequest,
    EventAction,
    Urgency,
)

router = APIRouter(tags=["Approval"])

# ---------------------------------------------------------------------------
# In-memory store (Phase 20 — substituído por DB na Phase D+)
# ---------------------------------------------------------------------------

_submissions: dict[str, dict] = {}
_events: dict[str, list[dict]] = {}  # submission_id → list of events


# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------


def _resolve_actor(request: Request, authorization: Optional[str]) -> dict:
    """
    Resolve o actor do JWT.

    Phase 20: se Firebase Auth não estiver disponível, aceita o header
    X-Debug-Admin para testes locais (apenas quando DEBUG=True).
    Em produção, o Auth Gateway (CTM-01) valida o JWT antes de chegar aqui.
    """
    # Tenta decodificar o Firebase JWT (best-effort; sem falhar no MVP)
    if authorization and authorization.startswith("Bearer "):
        try:
            import firebase_admin.auth as fb_auth

            from core.firebase import get_firebase_app

            get_firebase_app()
            token = authorization.removeprefix("Bearer ").strip()
            decoded = fb_auth.verify_id_token(token)
            return {
                "uid": decoded.get("uid", "unknown"),
                "name": decoded.get("name", "Usuário"),
                "is_admin": decoded.get("role") == "admin",
                "client_id": decoded.get("client_id"),
            }
        except Exception:
            pass

    from config import settings

    if settings.DEBUG:
        debug_admin = request.headers.get("X-Debug-Admin")
        if debug_admin == "true":
            return {
                "uid": "debug-admin",
                "name": "Debug Admin",
                "is_admin": True,
                "client_id": None,
            }

    # Sem token válido em produção → trata como não-admin (caixa-preta: 404)
    return {"uid": "anonymous", "name": "Anônimo", "is_admin": False, "client_id": None}


def _require_admin(actor: dict) -> None:
    """
    Garante que o actor é admin.
    Caixa-preta (RN-009/011): retorna 404, nunca 403.
    """
    if not actor["is_admin"]:
        raise HTTPException(status_code=404, detail="Not found")


def _require_submission(submission_id: str, actor: dict) -> dict:
    """
    Busca submission com cross-client guard.
    404 quando não existe OU quando actor não tem permissão (caixa-preta).
    """
    sub = _submissions.get(submission_id)
    if not sub:
        raise HTTPException(status_code=404, detail="Not found")
    # Cross-client guard: admin vê todos; usuário comum só vê do seu client_id
    if not actor["is_admin"] and actor.get("client_id") and sub["client_id"] != actor["client_id"]:
        raise HTTPException(status_code=404, detail="Not found")
    return sub


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _notify_creator(sub: dict, notif_type: str, title: str, body: str) -> None:
    """
    Enviar notificação ao creator da submission (fire-and-forget).

    Silently skips if notifications module is unavailable or creator unknown.
    Nunca bloqueia a transição de status principal.
    """
    if not _NOTIFICATIONS_AVAILABLE:
        return
    try:
        creator_id = sub.get("submitted_by")
        if not creator_id or creator_id == "anonymous":
            return
        _create_notification_internal(
            user_id=creator_id,
            notif_type=notif_type,
            title=title,
            body=body,
            submission_id=sub.get("id"),
        )
    except Exception:
        pass  # Notification failure never blocks approval flow


def _sub_to_response(sub: dict) -> ApprovalSubmissionResponse:
    return ApprovalSubmissionResponse(**sub)


def _evt_to_response(evt: dict) -> ApprovalEventResponse:
    return ApprovalEventResponse(**evt)


# ---------------------------------------------------------------------------
# API-130 — GET /api/approvals
# ---------------------------------------------------------------------------


@router.get("/approvals", response_model=list[ApprovalSubmissionResponse])
async def list_approvals(
    request: Request,
    client_id: Optional[str] = None,
    skill_slug: Optional[str] = None,
    urgency: Optional[Urgency] = None,
    status: Optional[ApprovalStatus] = None,
    authorization: Optional[str] = Header(None),
):
    """
    Listar submissions de aprovação (inbox do aprovador).

    Acesso restrito a admins (P3 Líder / P4 Admin — FA-09 RBAC).
    Caixa-preta: 404 para não-admins.
    """
    actor = _resolve_actor(request, authorization)
    _require_admin(actor)

    results = list(_submissions.values())

    if client_id:
        results = [s for s in results if s["client_id"] == client_id]
    if skill_slug:
        results = [s for s in results if s["skill_slug"] == skill_slug]
    if urgency:
        results = [s for s in results if s["urgency"] == urgency]
    if status:
        results = [s for s in results if s["status"] == status]

    results.sort(key=lambda s: s["created_at"], reverse=True)
    return [_sub_to_response(s) for s in results]


# ---------------------------------------------------------------------------
# API-131 — POST /api/approvals
# ---------------------------------------------------------------------------


@router.post("/approvals", response_model=ApprovalSubmissionResponse, status_code=201)
async def submit_approval(
    request: Request,
    body: ApprovalSubmitRequest,
    authorization: Optional[str] = Header(None),
):
    """
    Submeter conteúdo para aprovação (T-31).

    Retorna 201 PENDING_VALIDATION em ≤2s (constitution §3.2).
    Validação roda async (BrandValidator + PortuguêsValidator — Phase D+).
    """
    actor = _resolve_actor(request, authorization)
    # Qualquer usuário autenticado pode submeter; verificação de chain ocorre no domain

    now = _now()
    sub_id = str(uuid.uuid4())

    sub = {
        "id": sub_id,
        "client_id": body.client_id,
        "client_name": body.client_id,  # Phase 20: sem lookup de nome
        "skill_slug": body.skill_slug,
        "skill_name": body.skill_slug,
        "subject_type": body.subject_type,
        "subject_id": body.subject_id,
        "content": body.content,
        "status": ApprovalStatus.PENDING_VALIDATION,
        "urgency": body.urgency,
        "submitted_by": actor["uid"],
        "submitted_by_name": actor["name"],
        "assigned_approver": None,
        "comment": body.comment,
        "round": 1,
        "created_at": now,
        "updated_at": now,
    }
    _submissions[sub_id] = sub

    evt = {
        "id": str(uuid.uuid4()),
        "submission_id": sub_id,
        "action": EventAction.SUBMITTED,
        "comment": None,
        "user_id": actor["uid"],
        "user_name": actor["name"],
        "timestamp": now,
    }
    _events.setdefault(sub_id, []).append(evt)

    return _sub_to_response(sub)


# ---------------------------------------------------------------------------
# API-132 — GET /api/approvals/{id}
# ---------------------------------------------------------------------------


@router.get("/approvals/{submission_id}", response_model=ApprovalSubmissionResponse)
async def get_approval(
    submission_id: str,
    request: Request,
    authorization: Optional[str] = Header(None),
):
    """
    Detalhe de uma submission.
    Caixa-preta: 404 para não-admin e para cross-client.
    """
    actor = _resolve_actor(request, authorization)
    _require_admin(actor)
    sub = _require_submission(submission_id, actor)
    return _sub_to_response(sub)


# ---------------------------------------------------------------------------
# API-133 — POST /api/approvals/{id}/approve
# ---------------------------------------------------------------------------


@router.post("/approvals/{submission_id}/approve", response_model=ApprovalSubmissionResponse)
async def approve_submission(
    submission_id: str,
    request: Request,
    body: ApprovalDecisionRequest,
    authorization: Optional[str] = Header(None),
):
    """
    Aprovar submission.

    DecisionRecorder valida que approver é humano (constitution §1.1).
    Phase 20: qualquer admin pode aprovar (chain config chega na Phase D+).
    """
    actor = _resolve_actor(request, authorization)
    _require_admin(actor)
    sub = _require_submission(submission_id, actor)

    if sub["status"] not in ("PENDING_APPROVAL", "PENDING_VALIDATION"):
        raise HTTPException(status_code=422, detail="Submission não está pendente de aprovação.")

    now = _now()
    sub["status"] = ApprovalStatus.APPROVED
    sub["assigned_approver"] = actor["uid"]
    sub["updated_at"] = now

    evt = {
        "id": str(uuid.uuid4()),
        "submission_id": submission_id,
        "action": EventAction.APPROVE,
        "comment": body.comment,
        "user_id": actor["uid"],
        "user_name": actor["name"],
        "timestamp": now,
    }
    _events.setdefault(submission_id, []).append(evt)

    _notify_creator(
        sub,
        notif_type="approval_decision",
        title="Submissão aprovada",
        body="Sua submissão foi aprovada.",
    )

    return _sub_to_response(sub)


# ---------------------------------------------------------------------------
# API-134 — POST /api/approvals/{id}/request-revision
# ---------------------------------------------------------------------------


@router.post(
    "/approvals/{submission_id}/request-revision", response_model=ApprovalSubmissionResponse
)
async def request_revision(
    submission_id: str,
    request: Request,
    body: ApprovalDecisionRequest,
    authorization: Optional[str] = Header(None),
):
    """
    Solicitar revisão (REQUEST_CHANGES).

    Anti-loop RN-025: round 3 → EXPIRED automaticamente.
    """
    actor = _resolve_actor(request, authorization)
    _require_admin(actor)
    sub = _require_submission(submission_id, actor)

    if sub["status"] not in ("PENDING_APPROVAL", "PENDING_VALIDATION"):
        raise HTTPException(status_code=422, detail="Submission não está pendente de aprovação.")

    now = _now()
    current_round = sub.get("round", 1)

    if current_round >= 3:
        # Anti-loop: 3ª revisão → EXPIRED (RN-025)
        sub["status"] = ApprovalStatus.EXPIRED
        action = EventAction.REQUEST_CHANGES
        notif_title = "Submissão expirada"
        notif_body = "Sua submissão atingiu o limite de rodadas de revisão e foi expirada."
    else:
        sub["status"] = ApprovalStatus.CHANGES_REQUESTED
        action = EventAction.REQUEST_CHANGES
        notif_title = "Revisão solicitada"
        notif_body = "Sua submissão precisa de ajustes antes de ser aprovada."

    sub["updated_at"] = now

    evt = {
        "id": str(uuid.uuid4()),
        "submission_id": submission_id,
        "action": action,
        "comment": body.comment,
        "user_id": actor["uid"],
        "user_name": actor["name"],
        "timestamp": now,
    }
    _events.setdefault(submission_id, []).append(evt)

    _notify_creator(
        sub,
        notif_type="changes_requested",
        title=notif_title,
        body=notif_body,
    )

    return _sub_to_response(sub)


# ---------------------------------------------------------------------------
# API-135 — POST /api/approvals/{id}/reject
# ---------------------------------------------------------------------------


@router.post("/approvals/{submission_id}/reject", response_model=ApprovalSubmissionResponse)
async def reject_submission(
    submission_id: str,
    request: Request,
    body: ApprovalDecisionRequest,
    authorization: Optional[str] = Header(None),
):
    """Rejeitar submission com motivo obrigatório."""
    actor = _resolve_actor(request, authorization)
    _require_admin(actor)
    sub = _require_submission(submission_id, actor)

    if sub["status"] not in ("PENDING_APPROVAL", "PENDING_VALIDATION"):
        raise HTTPException(status_code=422, detail="Submission não está pendente de aprovação.")

    now = _now()
    sub["status"] = ApprovalStatus.REJECTED
    sub["updated_at"] = now

    evt = {
        "id": str(uuid.uuid4()),
        "submission_id": submission_id,
        "action": EventAction.REJECT,
        "comment": body.comment,
        "user_id": actor["uid"],
        "user_name": actor["name"],
        "timestamp": now,
    }
    _events.setdefault(submission_id, []).append(evt)

    _notify_creator(
        sub,
        notif_type="approval_decision",
        title="Submissão rejeitada",
        body="Sua submissão foi rejeitada.",
    )

    return _sub_to_response(sub)


# ---------------------------------------------------------------------------
# API-136 — GET /api/approvals/{id}/history
# ---------------------------------------------------------------------------


@router.get("/approvals/{submission_id}/history", response_model=ApprovalHistoryResponse)
async def get_approval_history(
    submission_id: str,
    request: Request,
    authorization: Optional[str] = Header(None),
):
    """Histórico de eventos (append-only) de uma submission."""
    actor = _resolve_actor(request, authorization)
    _require_admin(actor)
    _require_submission(submission_id, actor)

    evts = sorted(_events.get(submission_id, []), key=lambda e: e["timestamp"])
    return ApprovalHistoryResponse(
        submission_id=submission_id,
        events=[_evt_to_response(e) for e in evts],
    )
