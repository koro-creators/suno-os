---
spec-id: SPEC-002
slug: knowledge-biblioteca-v2
artefato: design
status: rascunho
atualizada: 2026-05-15
versao: 1.0
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
│  └── text_processor.py  (chunk paragraphs)                   │
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
  models/
    knowledge.py           # SQLAlchemy models
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

<!-- REVIEW -->
**Checkpoint**: A arquitetura faz sentido para as restrições do projeto?
