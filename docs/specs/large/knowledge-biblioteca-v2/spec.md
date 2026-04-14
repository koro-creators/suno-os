---
spec-id: SPEC-002
slug: knowledge-biblioteca-v2
artefato: spec
nivel-sdd: spec-anchored
tamanho: large
status: rascunho
criada: 2026-04-14
atualizada: 2026-04-14
versao: 1.0
escopo:
  projeto: sunos
  stack: "Next.js 14 + FastAPI + pgvector + GCS"
  autor: Heitor Miranda
  papel: Tech Lead
  branch: master
  contexto: Evoluir Biblioteca para multimodal com vector search e interface com thumbnails
---

# Spec — Knowledge Architecture + Biblioteca v2

## Resumo

Evoluir a Biblioteca do sunOS de uma lista de documentos texto mocados para um sistema de conhecimento multimodal com: upload real de arquivos, processamento automático (PDF, áudio, vídeo, imagem), busca semântica via pgvector, e interface com ícones por formato + thumbnails. O agent do chat ganha uma tool `search_knowledge` para busca contextual.

**O quê**: Knowledge system multimodal com ingestão, embedding e busca semântica
**Por quê**: O time de criação precisa acessar brand books, meeting notes, vídeos de campanha, e reports como contexto para os agents
**Para quem**: Builders (admins que alimentam a base) e Viewers (criativos que usam via chat)

## Comportamento Especificado

### 1. Upload de Arquivos

**Input:**
```
POST /api/knowledge/upload
Content-Type: multipart/form-data

Fields:
  file: <binary>
  title: string
  tags: string[]            (comma-separated)
  scope: string[]           (comma-separated: "suno", "santander", etc.)
  description?: string
```

**Output:**
```json
{
  "id": "doc-uuid",
  "title": "Brand Book Santander 2026",
  "file_type": "pdf",
  "file_size": 2400000,
  "file_url": "gs://sunos-knowledge/docs/doc-uuid/original.pdf",
  "thumbnail_url": "gs://sunos-knowledge/docs/doc-uuid/thumb.png",
  "status": "processing",
  "chunks_count": 0
}
```

**Fluxo:**
1. Frontend envia arquivo via multipart
2. Backend salva no GCS, cria metadata no PostgreSQL
3. Retorna imediatamente com `status: "processing"`
4. Worker assíncrono processa: extrai texto, gera chunks, embeddings, thumbnail
5. Atualiza status para `"ready"` quando completo

**Restrições:**
- Max 50MB por arquivo
- Tipos: PDF, DOCX, TXT, MD, PNG, JPG, WEBP, MP3, WAV, MP4, MOV
- Rejeitar tipos não permitidos com 415

### 2. Processamento por Tipo

| Tipo | Pipeline | Output |
|------|----------|--------|
| **PDF** | `extract_text` → `chunk_by_section` → `embed_chunks` → `generate_thumbnail` (primeira página) | Chunks + embeddings + thumbnail PNG |
| **DOCX** | `extract_text` → `chunk_by_section` → `embed_chunks` | Chunks + embeddings + ícone FileText |
| **TXT/MD** | `chunk_by_paragraph` → `embed_chunks` | Chunks + embeddings + ícone FileText |
| **Imagem** | `gemini_vision_caption` → `embed_caption` → `resize_thumbnail` | Caption como chunk + thumbnail |
| **Áudio** | `gemini_transcribe` → `chunk_by_timestamp` → `embed_chunks` | Transcrição chunks + ícone Mic |
| **Vídeo** | `gemini_multimodal` → `transcribe + extract_keyframes` → `embed_chunks` → `keyframe_as_thumbnail` | Transcrição chunks + thumbnail do keyframe |

**Embedding model:** `text-embedding-004` (Gemini, 768 dimensions)

**Chunking strategy:**
- PDFs: por seção/heading. Fallback: 1000 tokens com 200 overlap.
- Áudio/Vídeo: por segmentos de ~2min com overlap de 15s.
- Texto: por parágrafo. Merge parágrafos curtos (<100 tokens).

### 3. Busca Semântica (Vector Search)

**Input (tool do agent):**
```python
@tool
def search_knowledge(
    query: str,
    scope: list[str] | None = None,   # filtro por cliente/suno
    file_type: str | None = None,      # filtro por tipo
    limit: int = 5,
) -> str:
    """Busca documentos relevantes na base de conhecimento."""
```

**Output:** Top-K chunks mais relevantes com metadados (título do doc, score, tipo).

**Fluxo:**
1. Embed a query com `text-embedding-004`
2. `SELECT` com `<=>` (cosine distance) no pgvector
3. Filtro por scope e file_type
4. Retorna chunks formatados como contexto para o agent

### 4. Interface Biblioteca v2 (Frontend)

**Mudanças no BibliotecaCard:**

| Antes | Depois |
|-------|--------|
| Texto "content preview" 2 linhas | **Thumbnail** 80x80 (imagem real ou ícone por tipo) |
| Sem indicação de tipo | **Ícone por formato** (FileText, Image, Mic, Video, File) |
| Scope dots (6px) | Scope dots + **badge de tipo** (PDF, IMG, etc.) |
| "X links · Y arquivos" | **Tamanho do arquivo** + **status** (processing/ready) |

**Ícones por tipo (Lucide):**

| Tipo | Ícone | Cor |
|------|-------|-----|
| PDF | `FileText` | #EF4444 |
| DOCX | `FileText` | #3B82F6 |
| TXT/MD | `FileText` | var(--text-muted) |
| Imagem | `ImageIcon` | #10B981 |
| Áudio | `Mic` | #F59E0B |
| Vídeo | `Video` | #8B5CF6 |
| Outro | `File` | var(--text-muted) |

**Thumbnail display:**
- Imagem: thumbnail real (resize 80x80 cover)
- PDF: thumbnail da primeira página
- Vídeo: keyframe como thumbnail
- Áudio/Texto: ícone grande estilizado (40x40 no centro de um card 80x80 com bg sutil)

**Upload UI:**
- Botão "Novo Item" evolui para suportar arquivo + texto
- Drag & drop zone no modal de criação
- Progress bar durante upload
- Status badge: "Processando..." (amarelo) → "Pronto" (verde)

**Filtro por tipo:**
- Adicionar pills de filtro por tipo: Todos · PDF · Imagem · Áudio · Vídeo · Texto
- Integrar com filtros existentes (scope + tags + search)

### 5. Integração com Chat (ContextSidebar)

**Mudanças:**
- Itens da Biblioteca no sidebar mostram ícone do tipo + título
- Auto-seleção continua por scope/tags (sem mudança na lógica)
- Agent pode chamar `search_knowledge` para buscar docs adicionais durante conversa
- Resultados da busca aparecem como contexto adicional (não substituem os ativos)

### 6. Agentic RAG (navegação entre docs)

**Tools adicionais do agent:**

```python
@tool
def read_full_document(doc_id: str) -> str:
    """Lê o conteúdo completo de um documento da Biblioteca."""

@tool
def find_related_documents(doc_id: str, limit: int = 3) -> str:
    """Encontra documentos relacionados baseado em similaridade de embedding."""
```

**Quando usar:**
- `search_knowledge`: busca semântica por query (maioria dos casos)
- `read_full_document`: quando o agent precisa do contexto completo (ex: "resuma este brand book")
- `find_related_documents`: quando o agent precisa cruzar informações (ex: "compare o tom de voz com o relatório de performance")

## Data Model

### PostgreSQL (novas tabelas)

```sql
-- Extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Documentos (evolução da Biblioteca)
CREATE TABLE knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    file_type VARCHAR(10) NOT NULL,    -- pdf, docx, txt, md, png, jpg, mp3, wav, mp4, mov
    file_size BIGINT,
    file_url TEXT,                      -- GCS path
    thumbnail_url TEXT,                 -- GCS path ou null
    content_text TEXT,                  -- texto extraído completo
    tags TEXT[] DEFAULT '{}',
    scope TEXT[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'processing',  -- processing, ready, error
    error_message TEXT,
    chunks_count INT DEFAULT 0,
    created_by VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chunks com embeddings
CREATE TABLE knowledge_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(768),             -- text-embedding-004 = 768 dims
    metadata JSONB DEFAULT '{}',       -- page_number, timestamp, etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca vetorial
CREATE INDEX ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

### GCS Structure

```
gs://sunos-knowledge/
  docs/{doc_id}/
    original.pdf          -- arquivo original
    thumb.png             -- thumbnail gerado
  thumbnails/
    {doc_id}.png          -- thumbnails (alternativo)
```

## Restrições Técnicas

1. **pgvector** no PostgreSQL existente (Cloud SQL) — precisa habilitar extensão
2. **Embedding model**: Gemini `text-embedding-004` (768 dims, 2048 tokens max input)
3. **Processamento**: Cloud Run Job ou Cloud Function (não bloquear a API principal)
4. **GCS bucket**: criar `sunos-knowledge` no mesmo projeto GCP
5. **Thumbnails**: Pillow para resize, max 120x120, WebP format
6. **Frontend**: sem novas dependências, fetch nativo para upload
7. **Compatibilidade**: BibliotecaContext continua funcionando para dados mocados (fallback)

## Critérios de Aceite

### Upload
- [ ] DADO um PDF de 5MB, QUANDO faço upload, ENTÃO arquivo vai pro GCS, metadata pro PostgreSQL, status "processing"
- [ ] DADO um arquivo de 60MB, QUANDO faço upload, ENTÃO retorna 413
- [ ] DADO um .exe, QUANDO faço upload, ENTÃO retorna 415

### Processamento
- [ ] DADO um PDF uploadado, QUANDO worker processa, ENTÃO gera chunks + embeddings + thumbnail da 1ª página
- [ ] DADO um áudio MP3, QUANDO worker processa, ENTÃO transcreve via Gemini + gera chunks embedados
- [ ] DADO uma imagem PNG, QUANDO worker processa, ENTÃO gera caption via Gemini Vision + thumbnail resize
- [ ] DADO processamento falha, QUANDO erro ocorre, ENTÃO status = "error" + error_message salvo

### Busca Semântica
- [ ] DADO query "tom de voz Santander", QUANDO search_knowledge, ENTÃO retorna chunks do brand book do Santander
- [ ] DADO scope=["vivo"], QUANDO search_knowledge, ENTÃO retorna apenas chunks de docs com scope Vivo
- [ ] DADO query sem resultados, QUANDO search_knowledge, ENTÃO retorna mensagem informativa

### Interface
- [ ] DADO documento PDF, QUANDO exibido na Biblioteca, ENTÃO mostra ícone FileText vermelho + thumbnail da 1ª página
- [ ] DADO documento de áudio, QUANDO exibido, ENTÃO mostra ícone Mic amarelo + badge "MP3"
- [ ] DADO filtro "Imagem" selecionado, QUANDO filtra, ENTÃO mostra apenas documentos de imagem
- [ ] DADO upload em andamento, QUANDO status processing, ENTÃO mostra "Processando..." com badge amarelo
- [ ] DADO upload completo, QUANDO status ready, ENTÃO mostra "Pronto" com badge verde

### Chat Integration
- [ ] DADO agent no chat, QUANDO precisa de contexto, ENTÃO chama search_knowledge e usa resultado
- [ ] DADO search_knowledge retorna chunks, QUANDO agent responde, ENTÃO resposta incorpora conhecimento dos chunks

<!-- REVIEW -->
**Checkpoint**: A especificação captura o que você realmente quer construir?
