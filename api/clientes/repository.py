"""Repository de clientes (SPEC-022 Fase B / A-1).

Lógica SQLAlchemy pura para a tabela `clients`. Foundation reaproveitável —
consumida pelo fluxo de onboarding (A-8) e por quem precisar resolver client_id.
Recebe uma ``Session`` já aberta (via core.db.get_session) e faz commit ao mutar.
"""

from __future__ import annotations

import uuid

from sqlalchemy.orm import Session

try:
    from models.client import Client
except ImportError:  # test import root (repo root on sys.path)
    from api.models.client import Client


def create_client(
    session: Session,
    *,
    name: str,
    slug: str,
    status: str = "PRE_ACTIVE",
    color: str | None = None,
    description: str | None = None,
    sponsor_name: str | None = None,
    sponsor_email: str | None = None,
    oracle_config: dict | None = None,
    selected_doc_ids: list | None = None,
) -> dict:
    client = Client(
        id=str(uuid.uuid4()),
        name=name,
        slug=slug,
        status=status,
        color=color,
        description=description,
        sponsor_name=sponsor_name,
        sponsor_email=sponsor_email,
        oracle_config=oracle_config or {},
        selected_doc_ids=selected_doc_ids or [],
    )
    session.add(client)
    session.commit()
    session.refresh(client)
    return client.to_dict()


def get(session: Session, client_id: str) -> Client | None:
    return session.get(Client, client_id)


def get_by_slug(session: Session, slug: str) -> Client | None:
    return session.query(Client).filter(Client.slug == slug).first()


def list_clients(session: Session) -> list[dict]:
    return [c.to_dict() for c in session.query(Client).order_by(Client.name).all()]


def update(session: Session, client_id: str, updates: dict) -> dict | None:
    client = session.get(Client, client_id)
    if client is None:
        return None
    allowed = {
        "name",
        "slug",
        "status",
        "color",
        "description",
        "sponsor_name",
        "sponsor_email",
        "oracle_config",
        "selected_doc_ids",
        "pre_active_since",
    }
    for key, value in updates.items():
        if key in allowed and value is not None:
            setattr(client, key, value)
    session.commit()
    session.refresh(client)
    return client.to_dict()


def update_status(session: Session, client_id: str, status: str) -> dict | None:
    return update(session, client_id, {"status": status})
