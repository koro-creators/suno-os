---
spec-id: SPEC-006
slug: chat-attachments
nivel-sdd: spec-anchored
tamanho: medium
status: rascunho
criada: 2026-04-16
atualizada: 2026-04-16
versao: 1.0
escopo:
  projeto: sunos
  stack: "FastAPI + LangGraph + Gemini multimodal"
  autor: Heitor Miranda
  papel: Tech Lead
  branch: develop
  contexto: Permitir envio de arquivos e links no chat para processamento contextual
arquivos-relacionados:
  - api/chat/schemas/chat.py
  - api/chat/router.py
  - api/chat/graph/runner.py
  - api/chat/ingestion/processor.py
  - api/chat/knowledge/router.py
---

# Spec — Chat Attachments & Model Selection

## 1. Resumo

Permitir que usuarios enviem arquivos (PDF, imagens, audio, documentos) e links junto com mensagens no chat. Os arquivos sao processados inline (extracao de texto, captioning, transcricao) e injetados como contexto adicional na conversa. Tambem permitir selecao de modelo por mensagem.

**O que**: Attachments multimodais no chat + selecao de modelo per-message
**Por que**: Usuarios precisam referenciar documentos e imagens durante conversas sem sair do fluxo
**Para quem**: P2 (criativo) e P3 (estrategista) que trabalham com briefings, references visuais e audio

## 2. Comportamento Especificado

### 2.1 Chat Stream com Attachments

**Input atualizado (ChatRequest):**

```python
class AttachmentInput(BaseModel):
    """A single file or URL attachment in a chat message."""
    filename: str
    content_type: str                 # MIME type (e.g. "application/pdf", "image/png")
    data: str | None = None           # base64-encoded file content
    url: str | None = None            # OR a URL to fetch

    @model_validator(mode="after")
    def require_data_or_url(self):
        if not self.data and not self.url:
            raise ValueError("Either 'data' or 'url' must be provided")
        return self


class ChatRequest(BaseModel):
    """Request body for POST /api/chat/stream — updated with attachments."""
    message: str
    skill_slug: str = "conversation"
    model: str = "gemini-flash"       # Now user-selectable per message
    temperature: float = 0.7
    max_tokens: int = 4096
    system_prompt: str | None = None
    context_documents: list[str] = Field(default_factory=list)
    conversation_id: str | None = None
    web_search: bool = False
    # NEW:
    attachments: list[AttachmentInput] = Field(
        default_factory=list,
        max_length=5,
        description="Max 5 attachments per message"
    )
```

**Processing flow:**

1. Validate attachments (count <= 5, size <= 10MB each)
2. For each attachment, process based on source:
   - If `data` provided: decode base64, detect type from `content_type`
   - If `url` provided: fetch URL content with httpx (timeout 10s)
3. Process based on `content_type`:
   - `application/pdf` → reuse `chat.ingestion.pdf_processor` for text extraction
   - `application/vnd.openxmlformats-officedocument.wordprocessingml.document` → docx text extraction
   - `text/plain`, `text/markdown` → direct text read
   - `image/png`, `image/jpeg`, `image/webp` → Gemini Vision captioning + OCR
   - `audio/mpeg`, `audio/wav` → Gemini audio transcription
   - URL → fetch + html2text extraction
4. Truncate extracted text to 4000 tokens per attachment
5. Inject as context with markers: `[Attached: filename.pdf]\n{extracted_text}\n[/Attached]`
6. For images with Gemini models: use native multimodal content format
7. Pass enriched messages to the LangGraph agent

### 2.2 Multimodal Messages (Gemini Native)

When the selected model is Gemini and the attachment is an image, use native multimodal input instead of text captioning:

```python
from langchain_core.messages import HumanMessage

# Native multimodal — image sent directly to Gemini
message = HumanMessage(content=[
    {"type": "text", "text": user_message},
    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64_data}"}},
])
```

For non-Gemini models (GPT-4o, Claude): convert image to text caption via Gemini Vision, then inject as text context. This ensures all models can work with image attachments regardless of native multimodal support.

### 2.3 Model Selection per Message

The `model` field in `ChatRequest` already supports this. The change is frontend-driven: the UI now exposes model selection per message. Backend behavior:

1. Frontend sends `model` field with each request (e.g., `"gemini-pro"`, `"gpt-4o"`, `"claude"`)
2. `runner.py` already calls `_get_llm(model)` which resolves to the correct provider
3. `_get_llm` already has fallback logic (missing API key → Gemini Flash)
4. No backend change needed for this — already works

### 2.4 Link Processing

When an attachment has `url` instead of `data`:

1. Fetch URL with `httpx.AsyncClient` (timeout 10s, follow redirects)
2. Detect content type from response headers
3. If HTML: extract main content using `html2text` (strip nav, footer, ads)
4. If PDF/image: download and process as file attachment
5. Truncate extracted text to 4000 tokens
6. Inject as context: `[Link: {url}]\n{extracted_text}\n[/Link]`

## 3. Interface & Contratos

### 3.1 Updated chat/stream (primary)

No new endpoint needed. The existing `POST /api/chat/stream` receives the extended `ChatRequest` with the `attachments` field. The SSE event format remains unchanged.

### 3.2 New endpoint: upload-attachment (optional, pre-upload)

```
POST /api/chat/upload-attachment
Content-Type: multipart/form-data

Body:
  file: binary (required)

Response (200):
{
  "filename": "briefing.pdf",
  "content_type": "application/pdf",
  "extracted_text": "...",
  "token_count": 1523
}

Error (400):
{
  "detail": "Tipo de arquivo 'exe' nao permitido"
}

Error (413):
{
  "detail": "Arquivo excede o limite de 10MB"
}
```

This endpoint allows the frontend to pre-process attachments and show a preview (token count, extracted text snippet) before sending the chat message.

### 3.3 Processing module interface

```python
# api/chat/attachments/processor.py

async def process_attachment(attachment: AttachmentInput) -> ProcessedAttachment:
    """Process a single attachment and return extracted content.

    Returns:
        ProcessedAttachment with text, token_count, and optional multimodal_content
    """

async def process_url(url: str) -> ProcessedAttachment:
    """Fetch URL and extract main text content."""

async def build_multimodal_content(
    user_message: str,
    attachments: list[AttachmentInput],
    model: str,
) -> HumanMessage:
    """Build a HumanMessage with text + multimodal content for the LLM."""


class ProcessedAttachment(BaseModel):
    """Result of processing a single attachment."""
    filename: str
    content_type: str
    extracted_text: str
    token_count: int
    is_multimodal: bool = False       # True for images when using Gemini
    multimodal_data: dict | None = None  # {"type": "image_url", "image_url": {...}}
```

## 4. Integracao com Runner

O `run_chat_stream` em `graph/runner.py` precisa ser atualizado para processar attachments antes de executar o graph:

```python
async def run_chat_stream(
    message: str,
    skill_slug: str = "conversation",
    conversation_id: str | None = None,
    model: str = "gemini-flash",
    temperature: float = 0.7,
    max_tokens: int = 4096,
    system_prompt: str | None = None,
    context_documents: list[str] | None = None,
    web_search: bool = False,
    attachments: list[AttachmentInput] | None = None,  # NEW
) -> AsyncGenerator[SSEEvent, None]:
```

**Flow dentro do runner:**

1. Se `attachments` nao vazio:
   a. Processar cada attachment via `process_attachment()`
   b. Para imagens + Gemini: construir `HumanMessage` multimodal
   c. Para outros: concatenar texto extraido ao `message` com marcadores
2. Construir `_build_initial_state()` com mensagem enriquecida
3. Executar graph normalmente

## 5. Restricoes

| Restricao | Valor | Motivo |
|-----------|-------|--------|
| Max attachments por mensagem | 5 | Evitar sobrecarga de contexto |
| Max tamanho por arquivo | 10MB | Limite de memoria do Cloud Run |
| Max tokens extraidos por attachment | 4000 | Manter window de contexto gerenciavel |
| Tipos suportados | PDF, DOCX, TXT, MD, PNG, JPG, WEBP, MP3, WAV | Cobrir casos de uso criativos |
| URL fetch timeout | 10s | Evitar bloqueio em sites lentos |
| Armazenamento de arquivos | Nenhum (inline) | Processar e descartar; Biblioteca para permanente |
| Max tamanho base64 no request | ~13.3MB (10MB encoded) | Limite do payload JSON |

## 6. Reuso de Processadores Existentes

Os processadores de `chat/ingestion/` ja implementam a logica de extracao:

| Tipo | Processador existente | Adaptacao necessaria |
|------|-----------------------|-----------------------|
| PDF | `chat.ingestion.pdf_processor.process_pdf` | Aceitar bytes em vez de file_url |
| Imagem | `chat.ingestion.image_processor.process_image` | Aceitar base64, retornar caption |
| Audio | `chat.ingestion.audio_processor.process_audio` | Aceitar bytes, retornar transcricao |
| Texto | `chat.ingestion.text_processor.process_text` | Ja aceita string direta |

A adaptacao principal e criar wrappers que aceitem bytes/base64 em vez de file paths, ja que attachments nao sao salvos em disco.

## 7. Criterios de Aceite

- [ ] DADO um PDF anexado, QUANDO enviado no chat, ENTAO texto extraido e usado como contexto na resposta
- [ ] DADO uma imagem PNG com modelo Gemini, QUANDO enviada, ENTAO Gemini Vision processa nativamente via multimodal
- [ ] DADO uma imagem PNG com modelo GPT-4o, QUANDO enviada, ENTAO caption e gerado via Gemini e injetado como texto
- [ ] DADO um audio MP3, QUANDO enviado, ENTAO transcricao e injetada como contexto
- [ ] DADO um DOCX, QUANDO enviado, ENTAO texto extraido e usado como contexto
- [ ] DADO uma URL valida, QUANDO colada como attachment, ENTAO conteudo da pagina e extraido e injetado
- [ ] DADO uma URL invalida/timeout, QUANDO tentada, ENTAO erro gracioso sem quebrar o chat
- [ ] DADO 6 arquivos, QUANDO tentados, ENTAO erro de validacao "Maximo 5 anexos por mensagem"
- [ ] DADO arquivo de 15MB, QUANDO enviado, ENTAO erro de validacao "Maximo 10MB por arquivo"
- [ ] DADO modelo "gpt-4o" selecionado, QUANDO enviado, ENTAO usa GPT-4o (ou fallback para Gemini Flash se sem API key)
- [ ] DADO modelo "claude" selecionado, QUANDO enviado, ENTAO usa Claude (ou fallback)
- [ ] DADO attachment com texto > 4000 tokens, QUANDO processado, ENTAO texto e truncado

## 8. Arquivos a Criar/Modificar

### Criar:

| Arquivo | Descricao |
|---------|-----------|
| `api/chat/attachments/__init__.py` | Module init |
| `api/chat/attachments/processor.py` | `process_attachment()`, `process_url()`, `build_multimodal_content()` |

### Modificar:

| Arquivo | Mudanca |
|---------|---------|
| `api/chat/schemas/chat.py` | Adicionar `AttachmentInput`, `ProcessedAttachment`; campo `attachments` em `ChatRequest` |
| `api/chat/graph/runner.py` | Aceitar `attachments` param; processar antes de executar graph |
| `api/chat/router.py` | Passar `attachments` para `run_chat_stream()`; adicionar endpoint `upload-attachment` (opcional) |

## 9. Notas de Implementacao

1. **Reutilizar processadores existentes** em `chat/ingestion/` — criar thin wrappers que aceitam bytes/base64 em vez de file_url
2. **Gemini multimodal**: usar content list format (`[{"type": "text", ...}, {"type": "image_url", ...}]`) para mensagens com imagens
3. **Fallback cross-model**: para modelos que nao suportam multimodal nativo (ou quando nao ha API key), converter imagem em caption texto via Gemini Vision
4. **Frontend ja envia attachments como base64** — backend recebe e processa inline sem salvar em disco
5. **html2text** para link processing — ja disponivel como dependencia ou adicionar ao `pyproject.toml`
6. **Sem persistencia de attachments** — sao efemeros, processados e descartados. Para armazenamento permanente, o usuario usa a Biblioteca (Knowledge)

<!-- REVIEW -->
**Checkpoint**: A especificacao cobre todos os tipos de attachment necessarios? O limite de 5 attachments e suficiente?

## Changelog

| Versao | Data | Mudanca |
|--------|------|---------|
| 1.0 | 2026-04-16 | Versao inicial |
