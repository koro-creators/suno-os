"""SQLAlchemy models for knowledge documents and vector chunks."""

from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    BigInteger,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB, UUID
from sqlalchemy.orm import relationship

from models.base import Base

try:
    from pgvector.sqlalchemy import Vector
except ImportError:
    # Fallback: pgvector not installed (dev/CI without postgres extensions)
    from sqlalchemy import LargeBinary as Vector  # type: ignore[assignment]


class KnowledgeDocument(Base):
    """A document stored in the knowledge base (Biblioteca)."""

    __tablename__ = "knowledge_documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(Text, nullable=False)
    description = Column(Text, nullable=True)
    file_type = Column(String(10), nullable=False)
    file_size = Column(BigInteger, nullable=True)
    file_url = Column(Text, nullable=True)
    thumbnail_url = Column(Text, nullable=True)
    content_text = Column(Text, nullable=True)
    tags = Column(ARRAY(Text), default=list)
    scope = Column(ARRAY(Text), default=list)
    status = Column(String(20), default="processing")
    error_message = Column(Text, nullable=True)
    chunks_count = Column(Integer, default=0)
    created_by = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    chunks = relationship(
        "KnowledgeChunk",
        back_populates="document",
        cascade="all, delete-orphan",
        order_by="KnowledgeChunk.chunk_index",
    )

    def __repr__(self) -> str:
        return f"<KnowledgeDocument id={self.id!r} title={self.title!r} status={self.status!r}>"


class KnowledgeChunk(Base):
    """A vector-embedded chunk of a knowledge document."""

    __tablename__ = "knowledge_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(
        UUID(as_uuid=True),
        ForeignKey("knowledge_documents.id", ondelete="CASCADE"),
        nullable=False,
    )
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    embedding = Column(Vector(768), nullable=True)  # type: ignore[call-arg]
    metadata_ = Column("metadata", JSONB, default=dict)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    document = relationship("KnowledgeDocument", back_populates="chunks")

    def __repr__(self) -> str:
        return f"<KnowledgeChunk id={self.id!r} doc={self.document_id!r} idx={self.chunk_index}>"
