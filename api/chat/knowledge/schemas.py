"""Pydantic schemas for Knowledge API endpoints."""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


class DocumentResponse(BaseModel):
    """Single document returned from the API."""

    id: str
    title: str
    description: Optional[str] = None
    file_type: str
    file_size: Optional[int] = None
    file_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    tags: List[str] = Field(default_factory=list)
    scope: List[str] = Field(default_factory=list)
    status: str = "processing"
    error_message: Optional[str] = None
    chunks_count: int = 0
    created_by: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    """List of documents."""

    documents: List[DocumentResponse]
    total: int


class UploadResponse(BaseModel):
    """Response after a successful document upload."""

    id: str
    title: str
    file_type: str
    status: str
    message: str = "Document uploaded and processing started."


class SearchRequest(BaseModel):
    """Request body for semantic search."""

    query: str
    scope: Optional[List[str]] = None
    file_type: Optional[str] = None
    limit: int = Field(default=5, ge=1, le=50)


class SearchResult(BaseModel):
    """A single search result with relevance score."""

    chunk_id: str
    document_id: str
    title: str
    file_type: str
    content: str
    chunk_index: int
    score: float


class SearchResponse(BaseModel):
    """Response from a semantic search."""

    results: List[SearchResult]
    total: int
    query: str
