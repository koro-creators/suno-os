"""SQLAlchemy models for chat conversations and messages."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, JSON, String, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class Conversation(Base):
    """Persisted chat conversation."""

    __tablename__ = "conversations"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False)
    skill_slug = Column(String, nullable=True)
    title = Column(String, nullable=True)
    state = Column(JSON, nullable=True)  # Persisted LangGraph state
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    last_message_at = Column(DateTime, nullable=True)

    messages = relationship(
        "ChatMessage",
        back_populates="conversation",
        order_by="ChatMessage.created_at",
    )

    def __repr__(self) -> str:
        return f"<Conversation id={self.id!r} user={self.user_id!r} skill={self.skill_slug!r}>"


class ChatMessage(Base):
    """Individual message within a conversation."""

    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False)
    role = Column(String, nullable=False)  # "user", "assistant", "tool", "system"
    content = Column(Text, nullable=False)
    agent_name = Column(String, nullable=True)
    response_data = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    conversation = relationship("Conversation", back_populates="messages")

    def __repr__(self) -> str:
        return f"<ChatMessage id={self.id!r} role={self.role!r} conv={self.conversation_id!r}>"
