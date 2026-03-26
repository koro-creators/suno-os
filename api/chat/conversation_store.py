"""Persistence layer for chat conversations and messages."""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

from models.conversation import ChatMessage, Conversation

logger = logging.getLogger(__name__)


class ConversationStore:
    """Persistence layer for conversations. Uses SQLAlchemy session."""

    def create_conversation(
        self,
        db: Session,
        user_id: str,
        skill_slug: str | None = None,
        title: str | None = None,
    ) -> Conversation:
        """Create a new conversation."""
        conv = Conversation(
            id=str(uuid.uuid4()),
            user_id=user_id,
            skill_slug=skill_slug,
            title=title,
            created_at=datetime.now(timezone.utc),
        )
        db.add(conv)
        db.commit()
        db.refresh(conv)
        logger.info("Created conversation %s for user %s", conv.id, user_id)
        return conv

    def get_conversation(self, db: Session, conv_id: str) -> Conversation | None:
        """Retrieve a conversation by ID."""
        return db.query(Conversation).filter(Conversation.id == conv_id).first()

    def list_conversations(self, db: Session, user_id: str) -> list[Conversation]:
        """List all conversations for a user, ordered by last message (most recent first)."""
        return (
            db.query(Conversation)
            .filter(Conversation.user_id == user_id)
            .order_by(Conversation.last_message_at.desc().nullslast())
            .all()
        )

    def add_message(
        self,
        db: Session,
        conv_id: str,
        role: str,
        content: str,
        agent_name: str | None = None,
    ) -> ChatMessage:
        """Add a message to a conversation and update last_message_at."""
        now = datetime.now(timezone.utc)

        msg = ChatMessage(
            id=str(uuid.uuid4()),
            conversation_id=conv_id,
            role=role,
            content=content,
            agent_name=agent_name,
            created_at=now,
        )
        db.add(msg)

        # Update conversation's last_message_at
        conv = self.get_conversation(db, conv_id)
        if conv:
            conv.last_message_at = now

        db.commit()
        db.refresh(msg)
        return msg

    def save_state(self, db: Session, conv_id: str, state: dict[str, Any]) -> None:
        """Persist the LangGraph state snapshot for a conversation."""
        conv = self.get_conversation(db, conv_id)
        if conv is None:
            logger.warning("Cannot save state: conversation %s not found", conv_id)
            return
        conv.state = state
        db.commit()
        logger.debug("Saved state for conversation %s", conv_id)

    def load_state(self, db: Session, conv_id: str) -> dict[str, Any] | None:
        """Load the persisted LangGraph state for a conversation."""
        conv = self.get_conversation(db, conv_id)
        if conv is None:
            return None
        return conv.state


# Singleton store
conversation_store = ConversationStore()
