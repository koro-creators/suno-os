---
spec-id: SPEC-002
slug: knowledge-biblioteca-v2
artefato: design
nivel-sdd: spec-anchored
tamanho: large
status: rascunho
criada: 2026-05-15
atualizada: 2026-05-26
versao: 1.1
---

# Design — Knowledge Architecture + Biblioteca v2

## Arquitetura

```
┌──────────────────────────────────────────────────────────────┐
│ Frontend (Next.js 14)                                        │
│                                                              │
│  BibliotecaCard (v2)                                         │
│  ├── Thumbnail 80x80 (real ou ícone)                         │
│  ├── Ícone por tipo (FileText/Image/Mic/Video)               │
│  ├── Badge de tipo + status                                  │
│  └── Upload com drag & drop                                  │
│                                                              │
│  BibliotecaModal (v2)                                        │
│  ├── File upload zone                                        │
│  ├── Progress bar                                            │
│  └── Campos existentes (título, tags, scope)                 │
│                                                              │
│  ContextSidebar                                              │
│  └── Ícone de tipo ao lado do título                         │
└──────────────────────┬───────────────────────────────────────┘
                       │ HTTPS
                       ▼
┌──────────────────────────────────────────────────────────────┐
│ Backend (FastAPI)                                            │
│                                                              │
│  /api/knowledge/upload          → GCS + PostgreSQL + trigger │
│  /api/knowledge/search          → pgvector cosine search     │
│  /api/knowledge/documents       → CRUD list/get              │
│  /api/knowledge/documents/{id}  → GET com chunks             │
│                                                              │
│  chat/knowledge/                                             │
│  ├── vector_store.py    (pgvector: embed, search, upsert)    │
│  ├── document_search.py (tool wrapper para agent)            │
│  └── embeddings.py      (Gemini text-embedding-004)          │
│                                                              │
│  chat/ingestion/                                             │
│  ├── processor.py       (dispatcher por tipo)                │
│  ├── pdf_processor.py   (extract + chunk + thumb)            │
│  ├── audio_processor.py (transcribe + chunk)                 │
│  ├── video_processor.py (transcribe + keyframes)             │
│  ├── image_processor.py (caption + resize)                   │
│  ├── text_processor.py  (chunk paragraphs)                   │
│  └── entity_extractor.py (LLMGraphTransformer → knowledge_entities) │
└──────────────────────┬───────────────────────────────────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
    PostgreSQL      GCS         Gemini API
    (pgvector)   (arquivos)   (embed + multimodal)
```

## Fluxo de Upload & Processamento

```
User uploads file
        │
        ▼
  POST /api/knowledge/upload
        │
        ├── Validate (size, type)
        ├── Upload to GCS (gs://sunos-knowledge/docs/{id}/original.{ext})
        ├── INSERT knowledge_documents (status='processing')
        ├── Return 201 {id, status: 'processing'}
        │
        └── Trigger async processing ──────────────┐
                                                    │
                                                    ▼
                                          Processing Worker
                                          (same Cloud Run, background task)
                                                    │
                              ┌──────────────────────┤
                              │ Detect file_type     │
                              │                      │
                    ┌─────────┼─────────┬────────────┤
                    ▼         ▼         ▼            ▼
                  PDF      Image     Audio         Video
                    │         │         │            │
              extract_text  caption  transcribe   transcribe
              chunk_sections  │      chunk_time   +keyframes
              thumbnail_p1    │         │            │
                    │     resize_thumb   │       thumb_keyframe
                    │         │         │            │
                    └─────────┴─────────┴────────────┘
                              │
                        embed_chunks
                        (text-embedding-004)
                              │
                    INSERT knowledge_chunks
                    UPDATE status='ready'
                              │
                    entity_extractor.py (async, não bloqueia)
                    INSERT knowledge_entities + entity_relationships
                    (status='pending' — HITL gate SPEC-015)
```

## Decisões Técnicas

### 1. pgvector vs Vertex AI Vector Search

| Aspecto | pgvector | Vertex AI Vector Search |
|---------|----------|------------------------|
| Custo | Grátis (extensão do PostgreSQL) | $$$  |
| Setup | `CREATE EXTENSION vector` | Endpoint dedicado |
| Escala | Até ~1M vectors OK | Bilhões |
| Latência | ~10-50ms | ~5-10ms |
| Filtros | SQL WHERE (scope, tags) | Metadata filters |

**Decisão:** pgvector. Vocês terão <10K chunks no primeiro ano. pgvector é mais que suficiente, zero custo adicional, e filtros via SQL são mais flexíveis.

### 2. Processamento sync vs async

**Decisão:** Async com `asyncio.create_task` no mesmo Cloud Run. Sem Cloud Functions separado na fase 1.

```python
@router.post("/knowledge/upload")
async def upload_document(file: UploadFile, ...):
    # Sync: validate, upload GCS, create DB record
    doc = await create_document(...)
    
    # Async: process in background
    asyncio.create_task(process_document(doc.id))
    
    return doc  # Returns immediately
```

**Por que não Cloud Function?** Simplicidade. Um serviço, um deploy. Quando o volume justificar (>100 uploads/dia), migrar processamento para Cloud Function trigger on GCS.

### 3. Chunking Strategy

```python
def chunk_by_sections(text: str, max_tokens: int = 1000) -> list[str]:
    """Split by headings/sections. Fallback to paragraph split."""
    # 1. Try split by markdown headings (# ## ###)
    # 2. Try split by double newlines
    # 3. Fallback: split by token count with overlap
    
    # Merge chunks < 100 tokens with previous
    # Overlap: 200 tokens between chunks
```

### 4. Thumbnail Generation

| Tipo | Método | Output |
|------|--------|--------|
| PDF | `pdf2image` primeira página → Pillow resize | 120x120 WebP |
| Imagem | Pillow resize + crop center | 120x120 WebP |
| Vídeo | Gemini extract keyframe (ou ffmpeg frame@1s) | 120x120 WebP |
| Áudio | Ícone estático (Mic) com waveform visual | 120x120 SVG/WebP |
| Texto | Ícone estático (FileText) | Nenhum (usa ícone Lucide) |

### 5. Model Mapping

```python
# Embedding
EMBEDDING_MODEL = "models/text-embedding-004"  # 768 dims, Gemini
EMBEDDING_DIMS = 768

# Multimodal processing
VISION_MODEL = "gemini-2.5-flash"     # image captioning
AUDIO_MODEL = "gemini-2.5-flash"      # transcription
VIDEO_MODEL = "gemini-2.5-flash"      # transcription + keyframes
```

## Impacto em Arquivos Existentes

### Backend (novos)
```
api/
  chat/
    knowledge/
      __init__.py
      router.py           # /api/knowledge/* endpoints
      schemas.py           # Pydantic models
      vector_store.py      # pgvector operations
      embeddings.py        # Gemini embedding wrapper
      document_search.py   # Agent tool: search_knowledge
    ingestion/
      __init__.py
      processor.py         # Dispatcher by type
      pdf_processor.py
      audio_processor.py
      video_processor.py
      image_processor.py
      text_processor.py
      thumbnail.py         # Thumbnail generation
      entity_extractor.py  # LLMGraphTransformer + dedup (ADR-013) — NOVO
  models/
    knowledge.py           # SQLAlchemy models + knowledge_entities + entity_relationships
```

### Backend (modificados)
```
api/main.py               # Mount knowledge router
api/chat/agents/content_creator.py  # Add search_knowledge tool
```

### Frontend (modificados)
```
components/biblioteca/BibliotecaCard.tsx    # Thumbnail + ícone + badge tipo
components/biblioteca/BibliotecaModal.tsx   # File upload zone + progress
components/biblioteca/BibliotecaFilters.tsx # Filtro por tipo
components/chat/ContextSidebar.tsx          # Ícone de tipo nos items
lib/biblioteca-types.ts                     # Adicionar file_type, file_url, thumbnail_url, status
contexts/BibliotecaContext.tsx              # Fetch de API real (quando disponível)
```

### Infra
```
PostgreSQL: CREATE EXTENSION vector + migrations
GCS: criar bucket sunos-knowledge
```

## Extração de Entidades Ontológicas (ADR-013)

> Decisão de arquitetura: ADR-013 (LLMGraphTransformer vs. Cognee vs. FalkorDB GraphRAG-SDK).
> Detalhe: ADR-007 (AlloyDB + pgvector), ADR-008 (RAG architecture).

### Modelo de Dados — Novas Tabelas

```sql
CREATE TABLE knowledge_entities (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    UUID NOT NULL REFERENCES clients(id),
  doc_id       UUID NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  entity_type  VARCHAR(50) NOT NULL,   -- ONTOLOGY_NODES abaixo
  entity_name  TEXT NOT NULL,
  properties   JSONB DEFAULT '{}',
  embedding    VECTOR(768),
  status       VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ke_client    ON knowledge_entities(client_id);
CREATE INDEX idx_ke_type      ON knowledge_entities(client_id, entity_type);
CREATE INDEX idx_ke_status    ON knowledge_entities(client_id, status);
CREATE INDEX idx_ke_embedding ON knowledge_entities
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

CREATE TABLE entity_relationships (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  UUID NOT NULL,
  source_id  UUID NOT NULL REFERENCES knowledge_entities(id) ON DELETE CASCADE,
  target_id  UUID NOT NULL REFERENCES knowledge_entities(id) ON DELETE CASCADE,
  relation   VARCHAR(80) NOT NULL,
  weight     FLOAT NOT NULL DEFAULT 1.0,
  doc_id     UUID REFERENCES knowledge_documents(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_er_source ON entity_relationships(source_id);
CREATE INDEX idx_er_target ON entity_relationships(target_id);
CREATE INDEX idx_er_client ON entity_relationships(client_id);
```

### Componente `entity_extractor.py`

```python
from langchain_experimental.graph_transformers import LLMGraphTransformer
from langchain_google_genai import ChatGoogleGenerativeAI

ONTOLOGY_NODES = [
    "Posicionamento", "Persona", "Competidor",
    "Produto", "TomDeVoz", "Briefing"
]

ONTOLOGY_RELATIONSHIPS = [
    "COMPETE_COM", "DESTINA_A", "PERTENCE_A",
    "MENCIONA", "DEFINE", "ORIENTA"
]

def build_extractor() -> LLMGraphTransformer:
    llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)
    return LLMGraphTransformer(
        llm=llm,
        allowed_nodes=ONTOLOGY_NODES,
        allowed_relationships=ONTOLOGY_RELATIONSHIPS,
        strict_mode=True,
        node_properties=["description", "source_doc"],
    )

async def extract_and_persist(
    doc_id: str, client_id: str, chunks: list[str], db
) -> int:
    """Extrai entidades de todos os chunks, faz dedup e persiste."""
    extractor = build_extractor()
    from langchain_core.documents import Document

    graph_docs = extractor.convert_to_graph_documents(
        [Document(page_content=c) for c in chunks]
    )
    count = 0
    for gd in graph_docs:
        for node in gd.nodes:
            if not _is_duplicate(db, client_id, node, threshold=0.92):
                _upsert_entity(db, client_id, doc_id, node)
                count += 1
        for rel in gd.relationships:
            _upsert_relationship(db, client_id, rel)
    db.commit()
    return count
```

### Dedup via Cosine Similarity (threshold 0.92)

Antes de inserir, verifica existência de entidade semanticamente equivalente no mesmo `(client_id, entity_type)`:

```python
def _is_duplicate(db, client_id, node, threshold=0.92) -> bool:
    from langchain_core.documents import Document
    embedding = embed_text(node.id)       # reutiliza embeddings.py
    result = db.execute(
        text("""
        SELECT 1 FROM knowledge_entities
        WHERE client_id = :cid
          AND entity_type = :etype
          AND 1 - (embedding <=> :emb::vector) > :threshold
        LIMIT 1
        """),
        {"cid": client_id, "etype": node.type,
         "emb": str(embedding), "threshold": threshold}
    ).fetchone()
    return result is not None
```

### Integração com `processor.py`

Fase 2 assíncrona, disparada após embedding. Falha na extração não reverte `status='ready'`.

```python
# processor.py (trecho)
async def process_document(doc_id: str, client_id: str, db):
    # Fase 1: chunk + embed (existente)
    chunks = await extract_and_chunk(doc_id)
    await embed_and_store(doc_id, chunks, db)
    await update_status(doc_id, "ready", db)

    # Fase 2: extração ontológica (nova — falha silenciosa)
    try:
        await extract_and_persist(doc_id, client_id, [c.text for c in chunks], db)
    except Exception as e:
        logger.warning("entity extraction failed for doc %s: %s", doc_id, e)
        # status='ready' mantido; entidades ficam ausentes — não bloqueia RAG semântico
```

**Distinção crítica:** `knowledge_entities` captura entidades de **toda a Biblioteca** (ingestão automatizada, `status='pending'`). `wiki_entities` (SPEC-015) é o **perfil ontológico curado** do cliente — subset aprovado via HITL pelo Oráculo. As duas tabelas coexistem com propósitos distintos e **não se substituem**.

### Nova dependência

```
langchain-experimental>=0.3.0  # LLMGraphTransformer
```

Adicionar em `api/pyproject.toml`. Ver ADR-013 §6 para guia de spike de qualidade antes do Piloto.

<!-- REVIEW -->
**Checkpoint**: A arquitetura faz sentido para as restrições do projeto?
