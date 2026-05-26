---
spec-id: SPEC-002
slug: knowledge-biblioteca-v2
artefato: plan
status: rascunho
atualizada: 2026-05-15
versao: 1.0
---

# Plan — Knowledge Architecture + Biblioteca v2

## Sequência de Implementação

```
Phase A: Vector Store Foundation (pgvector + embeddings + search tool)
    ↓
Phase B: Upload & Ingestion Pipeline (GCS + processamento texto/PDF)
    ↓
Phase C: Multimodal Processing (áudio, vídeo, imagem)
    ↓
Phase D: Biblioteca v2 UI (thumbnails, ícones, filtro por tipo, upload)
    ↓
Phase E: Agentic RAG (read_full_document, find_related)
```

## Phase A: Vector Store Foundation

**Objetivo**: pgvector funcionando com busca semântica + tool do agent.

1. Habilitar `pgvector` extension no PostgreSQL
2. Criar modelos SQLAlchemy (`knowledge_documents`, `knowledge_chunks`)
3. Implementar `embeddings.py` — wrapper Gemini `text-embedding-004`
4. Implementar `vector_store.py` — upsert, search (cosine), delete
5. Implementar `document_search.py` — tool `search_knowledge` para LangGraph
6. Registrar tool no ContentCreator agent
7. Migration SQL (Alembic ou raw)
8. Migrar documentos existentes da Biblioteca mock → PostgreSQL + embeddings

**Verificação**: Agent no chat chama `search_knowledge("tom de voz")` e retorna chunks relevantes

## Phase B: Upload & Ingestion (Texto/PDF)

**Objetivo**: Upload real de arquivos com processamento de texto e PDF.

1. Criar bucket GCS `sunos-knowledge`
2. Implementar `knowledge/router.py` — endpoints upload, list, get, delete
3. Implementar `knowledge/schemas.py` — Pydantic models
4. Implementar `ingestion/processor.py` — dispatcher por file_type
5. Implementar `ingestion/text_processor.py` — chunk por parágrafo + embed
6. Implementar `ingestion/pdf_processor.py` — extract text + chunk + embed + thumbnail
7. Implementar `ingestion/thumbnail.py` — Pillow resize + WebP
8. Background processing com `asyncio.create_task`
9. Mount router em `main.py`

**Verificação**: Upload PDF → GCS + chunks embedados + thumbnail gerado + status "ready"

## Phase C: Multimodal Processing

**Objetivo**: Pipeline para áudio, vídeo e imagem.

1. Implementar `ingestion/audio_processor.py` — Gemini transcrição + chunk
2. Implementar `ingestion/video_processor.py` — Gemini transcrição + keyframes
3. Implementar `ingestion/image_processor.py` — Gemini Vision caption + thumbnail
4. Testar com arquivos reais (MP3, MP4, PNG)

**Verificação**: Upload MP3 → transcrição + chunks embedados + ícone correto

## Phase D: Biblioteca v2 UI

**Objetivo**: Interface com thumbnails, ícones por tipo, upload real.

1. Atualizar `lib/biblioteca-types.ts` — adicionar `fileType`, `fileUrl`, `thumbnailUrl`, `status`
2. Atualizar `BibliotecaCard.tsx` — thumbnail 80x80 + ícone por tipo + badge + status
3. Atualizar `BibliotecaModal.tsx` — drag & drop upload zone + progress bar
4. Atualizar `BibliotecaFilters.tsx` — pills de filtro por tipo (Todos/PDF/Imagem/Áudio/Vídeo/Texto)
5. Atualizar `BibliotecaContext.tsx` — fetch de API real quando `apiAvailable()`
6. Atualizar `ContextSidebar.tsx` — ícone de tipo nos items
7. Fallback: se API não disponível, usa dados mocados (como hoje)

**Verificação**: Biblioteca mostra PDFs com thumbnail, áudios com ícone Mic, filtro funciona

## Phase E: Agentic RAG

**Objetivo**: Agent pode navegar entre documentos para cruzar informações.

1. Implementar tool `read_full_document(doc_id)` — lê todo o texto de um doc
2. Implementar tool `find_related_documents(doc_id)` — busca por similaridade média dos chunks
3. Registrar tools no agent
4. Testar: "compare o tom de voz do Santander com o relatório de performance"

**Verificação**: Agent navega entre 2+ docs e produz análise cruzada
