---
spec-id: SPEC-002
slug: knowledge-biblioteca-v2
artefato: tasks
atualizada: 2026-04-14
versao: 1.0
---

# Tasks — Knowledge Architecture + Biblioteca v2

## Phase A: Vector Store Foundation

- [ ] **A1**: Habilitar extensão pgvector no PostgreSQL (`CREATE EXTENSION IF NOT EXISTS vector`)
- [ ] **A2**: Criar `api/models/knowledge.py` — SQLAlchemy models (KnowledgeDocument, KnowledgeChunk)
- [ ] **A3**: Criar migration SQL para tabelas + índice ivfflat
- [ ] **A4**: Criar `api/chat/knowledge/embeddings.py` — wrapper Gemini text-embedding-004
- [ ] **A5**: Criar `api/chat/knowledge/vector_store.py` — upsert_chunks, search_similar, delete_by_doc
- [ ] **A6**: Criar `api/chat/knowledge/document_search.py` — tool `search_knowledge` (query, scope, file_type, limit)
- [ ] **A7**: Registrar `search_knowledge` no ContentCreator agent tools
- [ ] **A8**: Script para migrar docs mocados da Biblioteca → PostgreSQL + embeddings
- [ ] **A9**: Testar: agent chama search_knowledge e retorna chunks relevantes

## Phase B: Upload & Ingestion (Texto/PDF)

- [ ] **B1**: Criar bucket GCS `sunos-knowledge` (ou usar existente)
- [ ] **B2**: Criar `api/chat/knowledge/router.py` — POST /upload, GET /documents, GET /documents/{id}, DELETE /documents/{id}
- [ ] **B3**: Criar `api/chat/knowledge/schemas.py` — UploadResponse, DocumentResponse, SearchRequest, SearchResponse
- [ ] **B4**: Criar `api/chat/ingestion/processor.py` — dispatcher: detecta tipo → chama processor correto
- [ ] **B5**: Criar `api/chat/ingestion/text_processor.py` — chunk_by_paragraph + merge pequenos + embed
- [ ] **B6**: Criar `api/chat/ingestion/pdf_processor.py` — extract text (pdfplumber ou PyMuPDF) + chunk + embed
- [ ] **B7**: Criar `api/chat/ingestion/thumbnail.py` — gerar thumbnail (PDF 1ª página, imagem resize, ícone para outros)
- [ ] **B8**: Integrar processamento assíncrono no upload endpoint (`asyncio.create_task`)
- [ ] **B9**: Mount knowledge router em `api/main.py`
- [ ] **B10**: Adicionar `python-multipart`, `Pillow`, `pdfplumber` ao pyproject.toml
- [ ] **B11**: Testar: upload PDF → GCS + chunks + embeddings + thumbnail + status ready

## Phase C: Multimodal Processing

- [ ] **C1**: Criar `api/chat/ingestion/audio_processor.py` — Gemini Flash transcrição + chunk por segmento
- [ ] **C2**: Criar `api/chat/ingestion/video_processor.py` — Gemini multimodal transcrição + keyframe extraction
- [ ] **C3**: Criar `api/chat/ingestion/image_processor.py` — Gemini Vision caption + tags + thumbnail resize
- [ ] **C4**: Atualizar processor.py dispatcher para novos tipos
- [ ] **C5**: Testar: upload MP3 → transcrição + chunks embedados
- [ ] **C6**: Testar: upload MP4 → transcrição + keyframe thumb
- [ ] **C7**: Testar: upload PNG → caption + thumbnail

## Phase D: Biblioteca v2 UI

- [ ] **D1**: Atualizar `lib/biblioteca-types.ts` — adicionar fileType, fileUrl, thumbnailUrl, status, fileSize
- [ ] **D2**: Criar `components/biblioteca/FileTypeIcon.tsx` — componente que retorna ícone + cor por tipo
- [ ] **D3**: Atualizar `BibliotecaCard.tsx` — thumbnail 80x80 (real ou ícone), badge de tipo, status badge
- [ ] **D4**: Atualizar `BibliotecaModal.tsx` — drag & drop zone, file input, progress bar, campos existentes
- [ ] **D5**: Atualizar `BibliotecaFilters.tsx` — pills de filtro por tipo (Todos/PDF/Imagem/Áudio/Vídeo/Texto)
- [ ] **D6**: Atualizar `BibliotecaContext.tsx` — fetch API real quando apiAvailable(), fallback mock
- [ ] **D7**: Atualizar `ContextSidebar.tsx` — ícone de tipo nos items da Biblioteca
- [ ] **D8**: `npx tsc --noEmit` + `npm run build`
- [ ] **D9**: Testar: Biblioteca mostra thumbnails, ícones, filtro por tipo funciona

## Phase E: Agentic RAG

- [ ] **E1**: Criar tool `read_full_document(doc_id)` em document_search.py
- [ ] **E2**: Criar tool `find_related_documents(doc_id, limit)` em document_search.py
- [ ] **E3**: Registrar tools no ContentCreator agent
- [ ] **E4**: Testar: "compare o tom de voz do Santander com o relatório de performance"
- [ ] **E5**: Testar: agent navega entre 2+ docs e produz análise cruzada

<!-- REVIEW -->
**Checkpoint**: As tarefas são implementáveis e testáveis isoladamente?

## Estimativa de Escopo

| Phase | Arquivos novos | Arquivos modificados | Complexidade |
|-------|---------------|---------------------|-------------|
| A | 5 | 1 | Média (pgvector setup) |
| B | 7 | 2 | Alta (upload + GCS + async processing) |
| C | 3 | 1 | Média (Gemini multimodal) |
| D | 1 | 6 | Média (UI components) |
| E | 0 | 1 | Baixa (2 tools adicionais) |
| **Total** | **~16** | **~11** | — |

## Dependências entre Phases

```
A (vector store) → B (upload/ingest) → C (multimodal)
                                     → D (UI) ← pode rodar em paralelo com C
                 → E (agentic RAG) ← depende apenas de A
```

B e D podem rodar em paralelo após A.
C e D podem rodar em paralelo.
E depende apenas de A.
