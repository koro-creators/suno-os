"""Knowledge Architecture module — SPEC-002.

Provides vector store operations, embedding wrappers, and agentic RAG tools.

Tools available for agent registration:
- search_knowledge: Semantic search across the knowledge base
- read_full_document: Read complete document content by ID
- find_related_documents: Discover related documents via embedding similarity
"""

from chat.knowledge.document_search import (
    KNOWLEDGE_TOOLS,
    find_related_documents,
    read_full_document,
    search_knowledge,
)

__all__ = [
    "search_knowledge",
    "read_full_document",
    "find_related_documents",
    "KNOWLEDGE_TOOLS",
]
