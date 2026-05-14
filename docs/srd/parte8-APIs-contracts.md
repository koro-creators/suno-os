---
documento: SRD Parte 8 - APIs e Integration Contracts
projeto: sunOS
cliente: Suno United Creators (uso 100% interno)
versao: 1.0
data_criacao: 2026-04-28
ultima_atualizacao: 2026-04-28
autor: Heitor Miranda + Claude (Koro Docs Pipeline)
status: Rascunho
fonte_prd: docs/prd/parte4-FRs.md
fonte_brd: docs/brd/parte4-regras.md
fonte_srd: docs/srd/parte1-NFRs.md, docs/srd/parte2-domain-model.md, docs/srd/parte3-data-model-erd.md, docs/srd/parte4-data-flows-dfd.md, docs/srd/parte5-arch-as-is.md, docs/srd/parte6-arch-to-be.md, docs/srd/parte7-ADRs.md
fonte_codigo: api/chat/router.py, api/chat/schemas/chat.py, api/chat/knowledge/router.py, api/chat/knowledge/schemas.py, api/workflows/router.py, api/workflows/schemas.py, lib/api.ts
fonte_specs: docs/specs/large/video-generation/spec.md, docs/specs/large/image-editor/spec.md, docs/specs/large/sunohub-tools-integration/spec.md, docs/specs/large/knowledge-biblioteca-v2/spec.md
total_modulos_api: 12
total_endpoints_existentes: 19
total_endpoints_novos: 47
total_integration_contracts: 11
---

# SRD Parte 8 — APIs e Integration Contracts

## 1. Introdução

### 1.1. Objetivo

Este documento especifica as **APIs REST** expostas pelo backend FastAPI do sunOS e os **Contratos de Integração** com sistemas externos (Firebase, Vertex AI, Pub/Sub, Looker, Slack/Email), fornecendo base para implementação coordenada entre frontend Next.js (`lib/api.ts`), backend (`api/`) e integrações externas.

A especificação cobre:

- **APIs existentes** (já implementadas em `api/chat/router.py`, `api/chat/knowledge/router.py`, `api/workflows/router.py`)
- **APIs novas** necessárias para entregar a Parte 6 (Arch To-Be) — destaque para Phase 16 (VideoGen, Editor, Enhance), Moon Shot, Biblioteca admin, Mensuração, Auth/RBAC, Multi-tenant
- **Schemas Pydantic / OpenAPI** referenciados ou inline com tipos precisos (`Literal`, `datetime`, `UUID`, `vector(768)`)
- **Códigos de erro** padrão 4xx/5xx
- **Auth Firebase JWT** documentado por endpoint (obrigatório / service account / público)
- **Rate limiting** documentado por endpoint

### 1.2. Escopo

- APIs **REST** (principal — 90% do contrato com frontend)
- **SSE** (Server-Sent Events) como subset de REST para streaming
- Contratos com sistemas externos catalogados (`INT-XX`)
- Versionamento e ciclo de vida das APIs

### 1.3. Relação com Outros Artefatos

| Artefato | Relação |
|----------|---------|
| Domain Model (Parte 2) | Aggregates Roots → CRUD endpoints |
| Data Model (Parte 3) | Entidades ENT-XX → schemas Pydantic |
| Data Flows (Parte 4) | DFL-01..07 implementados via endpoints |
| Arch As-Is (Parte 5) | Endpoints existentes em `api/chat/router.py`, `api/chat/knowledge/router.py`, `api/workflows/router.py` |
| Arch To-Be (Parte 6) | Endpoints novos por módulo (CTM-01..07) |
| ADRs (Parte 7) | ADR-006 (Firebase Auth), ADR-001/005 (LangGraph), ADR-008/009/010 (propostos) |
| FRs (PRD Parte 4) | Cada FR vira 1+ endpoints |
| NFRs (Parte 1) | Latência (NFR-001/002/003) e auth (NFR-008/009) restringem APIs |

### 1.4. Convenções

- **API-XXX** — endpoint
- **SCH-XXX** — schema reutilizável (Pydantic)
- **INT-XX** — contrato de integração com sistema externo
- **Versionamento** — atualmente sem prefixo `/v1/` (padrão As-Is). Para a To-Be, **proposta** de adoção de `/v1/` em todos os módulos novos. Padrão a confirmar (ver TODO-API-04)
- Paths e schemas em **inglês** (padrão API)
- Descrições em **português brasileiro**
- Estado: `Existente` / `Novo` / `Evoluído`

---

## 2. Visão Geral das APIs

### 2.1. Módulos de API

| Módulo | Base Path | Descrição | Container (Parte 6) | Feature(s) | Estado |
|--------|-----------|-----------|---------------------|-----------|--------|
| Auth | `/api/auth` | Login flow + perfil + lazy-create | CTM-01 Auth Gateway | FA-09 | Novo |
| Chat | `/api/chat` | Streaming SSE, generate text/image, enhance prompt, conversations, scores HITL | CTM-03 Conversation Service | FA-04, FA-07, FA-08 | Existente + Evoluído |
| Knowledge (Biblioteca) | `/api/knowledge` | Upload + CRUD + search + admin | CTM-02 Knowledge & Skills | FA-01 | Existente + Evoluído |
| Skills | `/api/skills` | CRUD Skills + versions + Moons | CTM-02 | FA-03, FA-12 | Novo |
| Workflows | `/api/workflows` | CRUD Workflows + run + schedule + sub-workflow | CTM-02 | FA-05 | Existente |
| Provocation (Moon Shot) | `/api/chat/moon-shot` | Brief + Sparks + feedback | CTM-04 Provocation Engine | FA-02 | Novo |
| Multi-tenant | `/api/clients` | Clients (Planetas) + Biomas + Solar metadata | CTM-07 | FA-06 | Novo |
| Users | `/api/users` | Profiles + roles + assign-to-client | CTM-01 | FA-09 | Novo |
| Measurement | `/api/measurement` | AvoidedCost + DiversityMetric + ExecutiveReport + jobs | CTM-05 Measurement Service | FA-10 | Novo |
| Safety | `/api/safety` | SafetyAlerts + AuditLog query + ReflectionMoments | CTM-06 Safety Gateway | FA-11 | Novo |
| VideoGen (Phase 16) | `/api/chat/generate-video`, `/api/chat/video-status` | Vertex AI Veo (T2V/I2V) | CTM-03 | FA-08 | Novo (spec aprovada) |
| ImageEditor (Phase 16) | `/api/chat/edit-image`, `/api/chat/outpaint-image`, `/api/chat/enhance-image` | Vertex AI Imagen edit | CTM-03 | FA-08 | Novo (spec aprovada) |
| Approval | `/api/approval` | Submit + inbox + decide + chain config + validation reports | CTM-08 Approval Engine | FA-13 | Novo |
| Drive | `/api/drive` | OAuth connect + sync state + documents + suggestions + cleanup reports | CTM-09 Drive Connector | FA-14 | Novo |

**Total**: **14 módulos** | **19 endpoints existentes** | **60 endpoints novos** (47 anteriores + 13 para BC-07)

### 2.2. Autenticação e Autorização

**Método**: Firebase Authentication via JWT Bearer (ADR-006). Verificação server-side via `firebase-admin` no Auth Gateway (CTM-01).

**Headers obrigatórios** (todos os endpoints exceto `/health`):

```
Authorization: Bearer <firebase_id_token>
X-Request-ID: <uuid_v4_correlation>     # opcional — propagado nos traces
```

**Como o frontend obtém o token** (`lib/api.ts:getAuthToken`):
```typescript
const { auth } = getFirebase();
const token = await auth.currentUser?.getIdToken();
```

**Tipos de auth por endpoint**:

| Tipo | Descrição | Aplicação |
|------|-----------|-----------|
| **JWT obrigatório (user)** | `id_token` válido + `users` lazy-resolved + RBAC server-side | Default — todos endpoints `/api/*` |
| **JWT obrigatório (service account)** | Cloud Scheduler dispara com SA token (`audience` específico) | `/api/workflows/*/run`, `/api/measurement/jobs/*` |
| **Público** | Sem auth (raro) | `/health`, `/metrics` (Prometheus opcional) |

### 2.3. RBAC — Matriz de Roles e Permissões (RN-009, FR-139)

3 perfis hierárquicos (catálogo fixo em tabela `roles` — ENT-09):

| Role | Descrição | Permissões |
|------|-----------|------------|
| **Admin** | CRUD total + governança | Todas |
| **Lider** | Cura Biblioteca/Skills da própria área (bioma) | `bib:*`, `skill:*` (filtro bioma), `workflow:create/update/run`, `measurement:read`, `audit:read` |
| **Operacional** | Usa Skills/Chat/Moon Shot | `chat:execute`, `chat:read_history` (própria), `provocation:execute`, `score:submit`, **NÃO** `bib:*`, **NÃO** `skill:read_prompt` |

**Caixa-preta para Operacional** (RN-011, FR-140): qualquer endpoint de Biblioteca ou system_prompt retorna **404 genérico** ao Operacional (não revela existência do recurso).

**Decorators server-side** (CTM-01 §5.5):
```python
@require_role("Admin")
@require_perm("skill:write", scope="bioma")
@require_business_hours_or_review()  # RN-012
```

### 2.4. Padrões de Resposta

#### Sucesso (200/201/202/204)

Os endpoints atuais (`api/chat/router.py`, `api/workflows/router.py`) retornam o **schema Pydantic diretamente** (sem envelope). Para os endpoints novos, manter o padrão atual (consistência) — não envelopar `{ data: ..., meta: ... }`.

```json
{
  "id": "uuid",
  "name": "string",
  "...": "..."
}
```

#### Erro (4xx/5xx)

FastAPI default `HTTPException` retorna:
```json
{
  "detail": "Mensagem humana ou lista de erros de validação"
}
```

**Códigos padrão**:

| HTTP | Código semântico | Quando |
|------|------------------|--------|
| **400** | `BAD_REQUEST` | Body inválido (não Pydantic — validação custom) |
| **401** | `UNAUTHORIZED` | JWT ausente, expirado ou inválido |
| **403** | `FORBIDDEN` | Auth ok, mas RBAC nega (Operacional/Líder sem permissão) |
| **404** | `NOT_FOUND` | Recurso não existe **OU** RN-011 (Operacional → recurso oculto) |
| **409** | `CONFLICT` | Estado inválido (ex.: `client_scope` não permite skill) |
| **413** | `PAYLOAD_TOO_LARGE` | Upload > 50MB (knowledge) ou > 20MB (image edit) |
| **415** | `UNSUPPORTED_MEDIA_TYPE` | Extensão não permitida |
| **422** | `VALIDATION_ERROR` | Pydantic falha (lista de erros field-by-field) |
| **429** | `TOO_MANY_REQUESTS` | Rate limiting (NFR-006 / GR-001) |
| **500** | `INTERNAL_ERROR` | Exceção não tratada |
| **503** | `SERVICE_UNAVAILABLE` | DB / LLM / Vertex AI indisponível |
| **504** | `GATEWAY_TIMEOUT` | Timeout de tool ou LLM (60s default em router) |

### 2.5. Rate Limiting (NFR global)

Política proposta (a aplicar via middleware `slowapi` ou Cloud Armor — ver TODO-API-01):

| Endpoint group | Limite | Janela | Justificativa |
|----------------|-------:|--------|---------------|
| `/api/chat/stream` | 30 / min / user | rolling | Evitar abuso de LLM |
| `/api/chat/generate-image` | 10 / min / user | rolling | Custo Vertex |
| `/api/chat/generate-video` | 5 / min / user | rolling | Custo alto Veo |
| `/api/chat/moon-shot` | 10 / min / user | rolling | Pipeline pesado |
| `/api/knowledge/upload` | 60 / hour / user | rolling | Curadoria |
| Outros endpoints | 120 / min / user | rolling | Default |
| Service account (jobs) | 10 / min | rolling | Cloud Scheduler |

Resposta ao limit hit: `429 Too Many Requests` + headers `Retry-After: <seconds>` e `X-RateLimit-Remaining`.

---

## 3. Catálogo de APIs

> Convenção de tabelas por endpoint:
> - **Path** + **Method**
> - **Auth** (Firebase JWT user / SA / público)
> - **RBAC required**
> - **Request schema**
> - **Response schema** + status codes
> - **Errors**
> - **Rate limit**
> - **NFRs/FRs/RNs**
> - **DFL** correspondente (Parte 4)

### 3.1. Módulo: Auth (`/api/auth`) [Novo — CTM-01]

#### API-001 — `POST /api/auth/login-callback`

**Descrição**: Pós-login Firebase — backend faz lazy-create de `users` row + retorna profile/role completos.

**FR(s)**: FR-138 | **RN(s)**: RN-009 | **DFL**: DFL-07 (parcial)

**Auth**: JWT obrigatório (Firebase ID token recém-emitido)

**RBAC**: Qualquer role autenticada

**Request schema**: vazio (lê JWT do header)

**Response 200**:
```python
class LoginCallbackResponse(BaseModel):
    user_id: UUID
    firebase_uid: str
    email: str
    display_name: str
    role: Literal["Admin", "Lider", "Operacional"]
    bioma_id: UUID | None
    default_client_id: UUID | None
    career_stage: Literal["junior", "pleno", "senior"] | None  # FR-151
    onboarding_track: str | None
    is_first_login: bool
```

**Errors**: 401, 500

**Rate limit**: 60 / min / user

---

#### API-002 — `GET /api/auth/me`

**Descrição**: Retorna profile + permissões efetivas do usuário autenticado.

**FR(s)**: FR-138, FR-139

**Auth**: JWT obrigatório

**Response 200**: `LoginCallbackResponse` + `permissions: list[str]`

---

### 3.2. Módulo: Chat (`/api/chat`) [Existente + Evoluído — CTM-03]

#### API-010 — `POST /api/chat/stream` [Existente]

**Descrição**: Endpoint principal de chat com streaming SSE multi-modelo (FR-116).

**Origem**: `api/chat/router.py:30`
**FR(s)**: FR-110, FR-111, FR-116, FR-117, FR-118, FR-141, FR-152
**NFR(s)**: NFR-001 (P95 first-token < 1500ms), NFR-002 (P95 turn < 30s)
**DFL**: DFL-01

**Auth**: JWT obrigatório (user) — **TO-BE: aplicar `Depends(get_current_user)`** (LIM-01)

**RBAC**: Qualquer role; client_scope da Skill restringe

**Request schema** (`ChatRequest` — `api/chat/schemas/chat.py:6`):
```python
class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None
    skill_slug: str = "conversation"
    model: Literal["gemini-flash", "gemini-pro", "gpt-4o", "claude-sonnet-4"] = "gemini-flash"
    temperature: float = Field(0.7, ge=0.0, le=2.0)
    max_tokens: int = Field(4096, ge=1, le=32768)
    system_prompt: str | None = None  # opt-in override (Admin only)
    context_documents: list[str] = Field(default_factory=list)
    web_search: bool = False
    # TO-BE adições:
    client_slug: str | None = None      # explicito (FR-141)
    moon_slug: str | None = None        # FR-129
```

**Response**: `text/event-stream` (SSE). Eventos emitidos:

| Event | Payload | Quando |
|-------|---------|--------|
| `text` | `{"chunk": "<token>"}` | Cada token gerado |
| `tool_call` | `{"name": "...", "args": {...}}` | Agent invoca tool |
| `tool_result` | `{"name": "...", "result": "..."}` | Tool retorna |
| `sources` | `{"chunks": [{"chunk_id", "title", "score"}]}` | Após search_knowledge |
| `done` | `{"conversation_id": "uuid", "turn_id": "uuid"}` | Final |
| `error` | `{"message": "..."}` | Falha |

**Errors**:
- 401 (JWT inválido)
- 403 (Operacional tentando `system_prompt` override)
- 404 (skill_slug inexistente / não no client_scope)
- 504 timeout (60s)

**Rate limit**: 30 / min / user

---

#### API-011 — `POST /api/chat/generate-text` [Existente]

**Descrição**: Geração batch (não streaming) com até 4 variações.

**Origem**: `api/chat/router.py:62`
**FR(s)**: FR-118 (variações)

**Auth**: JWT obrigatório

**Request** (`TextGenRequest` — `schemas/chat.py:20`):
```python
class TextGenRequest(BaseModel):
    prompt: str
    content_type: Literal["social_post", "email", "blog", "ad_copy", "radio", "video_script"] = "social_post"
    tone: Literal["creative", "formal", "playful", "urgent"] = "creative"
    length: Literal["short", "medium", "long"] = "medium"
    variations: int = Field(default=1, ge=1, le=4)
    skill_slug: str | None = None
    model: str = "gemini-flash"
    context_documents: list[str] = Field(default_factory=list)
```

**Response 200** (`TextGenResponse`):
```python
class TextGenResponse(BaseModel):
    texts: list[str]
    model: str
    tokens_used: int
```

**Errors**: 422 (validação), 500, 504

**Rate limit**: 60 / min / user

---

#### API-012 — `POST /api/chat/enhance-prompt` [Existente]

**Descrição**: Enriquece um prompt para melhor resultado em outra tool.

**Origem**: `api/chat/router.py:93`

**Request** (`EnhancePromptRequest`):
```python
class EnhancePromptRequest(BaseModel):
    prompt: str
    target_tool: Literal["chat", "image", "video", "search"] = "chat"
    context: str | None = None
```

**Response 200** (`EnhancePromptResponse`):
```python
class EnhancePromptResponse(BaseModel):
    enhanced_prompt: str
    suggestions: list[str]
    reasoning: str
```

---

#### API-013 — `POST /api/chat/generate-image` [Existente — Phase 16]

**Descrição**: Geração de imagem via Vertex AI Imagen 4 / Nano Banana (FR-135).

**Origem**: `api/chat/router.py:131`

**Request** (`ImageGenRequest`):
```python
class ImageGenRequest(BaseModel):
    prompt: str
    model: Literal["imagen-4-standard", "imagen-4-fast", "nano-banana"] = "imagen-4-standard"
    aspect_ratio: Literal["1:1", "16:9", "9:16", "4:3", "3:4"] = "1:1"
    quantity: int = Field(default=1, ge=1, le=4)
    style: str | None = None
    enhance_prompt: bool = True
```

**Response 200** (`ImageGenResponse`):
```python
class ImageResult(BaseModel):
    url: str
    width: int
    height: int

class ImageGenResponse(BaseModel):
    images: list[ImageResult]
    model: str
    enhanced_prompt: str | None
```

**Errors**: 422, 504, 500

**Rate limit**: 10 / min / user

**Integração externa**: INT-08 (Vertex AI Imagen)

---

#### API-014 — `GET /api/chat/conversations` [Existente — placeholder]

**Estado atual**: placeholder (`api/chat/router.py:165` retorna `{"conversations": []}`).

**TO-BE**: implementar query real com paginação + filtro por `user_id`/`client_id`/`skill_slug`/`date_range`.

**Auth**: JWT obrigatório
**RBAC**: usuário só vê próprias conversations (Admin pode listar todas com `?user_id=`)

**Query params**:
| Param | Tipo | Default | Descrição |
|-------|------|---------|-----------|
| `page` | int ≥1 | 1 | Página |
| `per_page` | int 1-100 | 20 | Tamanho |
| `client_slug` | str | — | Filtro |
| `skill_slug` | str | — | Filtro |
| `date_from` / `date_to` | date | — | Janela |
| `q` | str | — | Busca textual |

**Response 200**:
```python
class ConversationSummary(BaseModel):
    id: str
    user_id: UUID
    client_id: UUID | None
    skill_slug: str | None
    title: str | None
    started_at: datetime
    last_message_at: datetime | None
    message_count: int

class ConversationListResponse(BaseModel):
    conversations: list[ConversationSummary]
    total: int
    page: int
    per_page: int
```

---

#### API-015 — `GET /api/chat/conversations/{conversation_id}` [Novo]

**Descrição**: Detalhes + mensagens completas de uma conversation.

**Auth**: JWT obrigatório | **RBAC**: dono ou Admin

**Response 200**: `ConversationDetailResponse` (turns + scores agregados)

**Errors**: 403 (não é dono), 404

---

#### API-016 — `POST /api/chat/scores` [Novo — FR-131..134]

**Descrição**: HITL feedback — thumbs up/down + rating + comentário em mensagem ou Spark.

**FR(s)**: FR-131, FR-132, FR-133, FR-134
**DFL**: DFL-01 §4.1.2 final

**Request schema** (`SCH-005`):
```python
class ScoreSubmitRequest(BaseModel):
    chat_message_id: str | None = None
    provocation_id: UUID | None = None
    thumbs: Literal["up", "down"] | None = None
    rating: int | None = Field(None, ge=1, le=5)
    comment: str | None = Field(None, max_length=2000)

    @model_validator(mode="after")
    def xor_target(self):
        # CHECK constraint ENT-28
        if (self.chat_message_id is None) == (self.provocation_id is None):
            raise ValueError("score deve ter exatamente um destino: chat_message_id OU provocation_id")
        return self
```

**Response 201**:
```python
class ScoreResponse(BaseModel):
    score_id: UUID
    created_at: datetime
```

**Rate limit**: 120 / min / user

---

### 3.3. Módulo: Knowledge / Biblioteca (`/api/knowledge`) [Existente + Evoluído — CTM-02]

#### API-020 — `POST /api/knowledge/upload` [Existente]

**Descrição**: Upload multimodal de KnowledgeItem (FR-100).

**Origem**: `api/chat/knowledge/router.py:67`
**RN**: RN-006 (≥2 tags + descrição ≥50)

**Auth**: JWT obrigatório
**RBAC**: `bib:write` — somente Admin/Líder (RN-011 — Operacional 404)

**Request**: `multipart/form-data`

| Campo | Tipo | Obrigatório | Constraint |
|-------|------|:-----------:|------------|
| `file` | binary | Sim | ≤ 50MB (`MAX_UPLOAD_SIZE`) |
| `title` | string | Sim | — |
| `tags` | string CSV | Sim | TO-BE: ≥2 (RN-006) |
| `scope` | string CSV | Sim | TO-BE: ≥1 (RN-006) |
| `description` | string | Sim | TO-BE: ≥50 char (RN-006) |
| `domain` | enum | TO-BE | `cliente/industria/cultura/metodologia/referencia` |
| `client_id` | UUID | Sim se `domain='cliente'` | RN-006 |

**Extensões permitidas** (`ALLOWED_EXTENSIONS`): `pdf, docx, txt, md, png, jpg, jpeg, webp, mp3, wav, mp4, mov`

**Response 201** (`UploadResponse` — `knowledge/schemas.py:41`):
```python
class UploadResponse(BaseModel):
    id: str
    title: str
    file_type: str
    status: Literal["processing", "ready", "failed"]
    message: str = "Document uploaded and processing started."
```

**Errors**:
- 400 — extensão não permitida ou size excedido
- 401, 403
- 415 — tipo MIME inválido
- 422 — metadados RN-006 não atendidos

**Rate limit**: 60 / hour / user

**Integração**: INT-09 (GCS upload)

---

#### API-021 — `GET /api/knowledge/documents` [Existente]

**Descrição**: Lista paginada com filtros.

**Origem**: `api/chat/knowledge/router.py:156`

**Query params**:
| Param | Tipo | Descrição |
|-------|------|-----------|
| `scope` | string | Filtra por scope (array contains) |
| `file_type` | string | — |
| `status` | string | `processing/ready/failed/blocked` |
| `domain` (TO-BE) | enum | RN-006 |
| `client_id` (TO-BE) | UUID | Filtro cliente |
| `risk_flag` (TO-BE) | enum | `OK/RISCO_TURNOVER` (RN-008) |
| `tags` (TO-BE) | CSV | Array contains |
| `q` (TO-BE) | string | Busca textual |
| `page`, `per_page` | int | Paginação |

**Response 200** (`DocumentListResponse`): `{ documents: list[DocumentResponse], total: int }`

---

#### API-022 — `GET /api/knowledge/documents/{doc_id}` [Existente]

**Origem**: `api/chat/knowledge/router.py:231`

---

#### API-023 — `PATCH /api/knowledge/documents/{doc_id}` [Novo]

**Descrição**: Edita metadados (FR-107 — versionamento).

**Auth**: JWT obrigatório | **RBAC**: `bib:write`

**Request schema**:
```python
class DocumentUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = Field(None, min_length=50)
    tags: list[str] | None = Field(None, min_length=2)
    scope: list[str] | None = Field(None, min_length=1)
    domain: Literal["cliente","industria","cultura","metodologia","referencia"] | None = None
    risk_flag: Literal["OK","RISCO_TURNOVER"] | None = None
    status: Literal["processing","ready","deprecated","blocked"] | None = None
```

**Response 200**: `DocumentResponse` + dispara `AuditEntry` (RN-012, DFL-07).

**Side-effects**: re-indexação (FR-107) — chunks_count + KG edges atualizadas

---

#### API-024 — `DELETE /api/knowledge/documents/{doc_id}` [Existente]

**Origem**: `api/chat/knowledge/router.py:283`

**Auth**: JWT obrigatório | **RBAC**: `bib:delete` (Admin)

---

#### API-025 — `POST /api/knowledge/search` [Existente]

**Descrição**: Busca semântica (modo convergente — DFL-04).

**Origem**: `api/chat/knowledge/router.py:332`

**Request** (`SearchRequest`):
```python
class SearchRequest(BaseModel):
    query: str
    scope: list[str] | None = None
    file_type: str | None = None
    limit: int = Field(default=5, ge=1, le=50)
    # TO-BE adições:
    client_id: UUID | None = None    # filtro multi-tenant (RN-010)
    tags: list[str] | None = None
    domain: list[str] | None = None
```

**Response 200** (`SearchResponse`):
```python
class SearchResult(BaseModel):
    chunk_id: str
    document_id: str
    title: str
    file_type: str
    content: str
    chunk_index: int
    score: float

class SearchResponse(BaseModel):
    results: list[SearchResult]
    total: int
    query: str
```

**NFR**: NFR-003 (P95 < 300ms para top_k=5 até 100K chunks)

---

#### API-026 — `POST /api/knowledge/jobs/risk-flag` [Novo — Service Account]

**Descrição**: Job batch trimestral disparado por Cloud Scheduler para detectar `RISCO_TURNOVER` (RN-008, FR-106).

**Auth**: SA token (Cloud Scheduler audience)
**RBAC**: `service:internal`

**Request schema**: vazio
**Response 200**:
```python
class RiskFlagJobResponse(BaseModel):
    flagged_count: int
    job_run_id: UUID
    completed_at: datetime
```

---

#### API-027 — `GET /api/knowledge/risk-flags` [Novo]

**Descrição**: Lista RiskFlags abertos para Admin/Líder.

---

#### API-028 — `GET /api/knowledge/documents/{doc_id}/versions` [Novo — FR-107]

**Descrição**: Histórico de versões.

---

### 3.4. Módulo: Skills (`/api/skills`) [Novo — CTM-02]

#### API-030 — `GET /api/skills`

**Descrição**: Lista skills filtradas por client_scope, intent, status.

**RBAC**: Operacional vê apenas skills atribuídas ao cliente ativo (FR-109); Líder/Admin veem catálogo completo.

**Query params**: `client_slug, intent, status, page, per_page`

**Response 200**:
```python
class SkillSummary(BaseModel):
    skill_id: UUID
    slug: str
    name: str
    description: str | None
    intent: Literal["criacao", "midia", "planejamento", "conversation"]
    default_model: str
    status: Literal["DRAFT", "ACTIVE", "DEPRECATED"]
    requires_revision: bool
    score_hitl_30d: float | None        # FR-133
    avoided_cost_30d_brl: Decimal | None  # FR-149
    icon_url: str | None
```

---

#### API-031 — `POST /api/skills` [FR-156]

**Descrição**: Cria nova Skill (4 tabs Identidade/Configuração/Moons/Clientes).

**RBAC**: `skill:write` (Admin); Líder limitado ao próprio bioma

**Request schema**:
```python
class SkillCreateRequest(BaseModel):
    slug: str = Field(min_length=2, pattern=r"^[a-z][a-z0-9-]+$")
    name: str
    description: str | None = None
    intent: Literal["criacao", "midia", "planejamento", "conversation"]
    default_model: str = "gemini-flash"
    temperature: float = Field(0.7, ge=0.0, le=2.0)
    client_scope: list[str] = ["*"]   # ou lista de client_slugs
    system_prompt: str          # cria SkillVersion v1 imutável
    references: list[str] = []  # markdown filenames
    moons: list["MoonCreate"] = []
    time_baseline: "TimeBaselineInput | None" = None  # opcional (RN-018)
```

**Response 201**: `SkillDetailResponse` + AuditEntry

---

#### API-032 — `GET /api/skills/{skill_id}` [FR-156]

**Descrição**: Detalhes (com `system_prompt` somente para Admin/Líder; Operacional **404 RN-011**).

---

#### API-033 — `PATCH /api/skills/{skill_id}`

**Descrição**: Atualiza Skill — mudança de `system_prompt` cria nova `SkillVersion` imutável (FR-113).

**Side-effects**: AuditEntry obrigatório (RN-012); EV-11 SystemPromptVersioned.

---

#### API-034 — `POST /api/skills/{skill_id}/versions/{version_id}/rollback` [FR-113]

**Descrição**: Rollback para versão anterior. Cria nova versão (não deleta histórico).

---

#### API-035 — `GET /api/skills/{skill_id}/baselines`

**Descrição**: Lista baselines de tempo manual (RN-018, FR-149).

---

#### API-036 — `POST /api/skills/{skill_id}/baselines` [Líder/Admin]

**Descrição**: Cria/atualiza baseline (`tempo_manual_minutos`, `custo_hora_brl`).

---

#### API-037 — `GET /api/skills/{skill_id}/health` [FR-114]

**Descrição**: Avaliação mensal automática.

**Response**:
```python
class SkillHealthResponse(BaseModel):
    skill_id: UUID
    period_month: date
    redution_pct: float
    score_hitl_avg: float
    runs_count: int
    status: Literal["saudavel", "requer_revisao", "baseline_pendente"]
    flags: list[str]
```

---

### 3.5. Módulo: Workflows (`/api/workflows`) [Existente — CTM-02]

> Endpoints atuais já implementados em `api/workflows/router.py`. Mudanças TO-BE: aplicar Auth Gateway dependency + persistir em DB (atualmente `_workflows: dict` in-memory dev).

#### API-040 — `GET /api/workflows/`
**Origem**: `workflows/router.py:132` — query: `status, creator`

#### API-041 — `POST /api/workflows/`
**Origem**: `:149` | Schema: `WorkflowCreate` (`workflows/schemas.py:41`) | max 20 steps | RBAC: `workflow:create`

#### API-042 — `GET /api/workflows/{workflow_id}`
**Origem**: `:191`

#### API-043 — `PUT /api/workflows/{workflow_id}`
**Origem**: `:200`

#### API-044 — `DELETE /api/workflows/{workflow_id}`
**Origem**: `:240`

#### API-045 — `POST /api/workflows/{workflow_id}/run`
**Origem**: `:262` | Auth dual: user JWT (manual) ou SA (cron) | Schema: `RunWorkflowRequest`
**FR**: FR-122, FR-123, FR-124 | **DFL**: DFL-05

#### API-046 — `GET /api/workflows/{workflow_id}/runs`
**Origem**: `:315`

#### API-047 — `GET /api/workflows/{workflow_id}/runs/{run_id}`
**Origem**: `:357`

#### API-048 — `POST /api/workflows/{workflow_id}/runs/{run_id}/resume`
**Origem**: `:391` | **FR-126** HITL gate | Schema: `ResumeRunRequest`

#### API-049 — `GET /api/workflows/{workflow_id}/runs/{run_id}/stream`
**Origem**: `:424` — SSE timeline

#### API-050 — `POST /api/workflows/{workflow_id}/schedule`
**Origem**: `:459` | **FR-124** Cloud Scheduler integration | Side-effect: cria/atualiza job em INT-04

#### API-051 — `DELETE /api/workflows/{workflow_id}/schedule`
**Origem**: `:491`

#### API-052 — `GET /api/workflows/templates/list`
**Origem**: `:564` — retorna templates pré-definidos (Relatório Mensal, Briefing Criativo, Monitor Social, Pesquisa de Mercado)

#### API-053 — `GET /api/workflows/{workflow_id}/duplicates-check` [Novo — FR-127]

**Descrição**: Verifica se workflow duplica funcionalidade de ferramenta de mercado adotada.

---

### 3.6. Módulo: Provocation / Moon Shot (`/api/chat/moon-shot`) [Novo — CTM-04]

#### API-060 — `POST /api/chat/moon-shot` [FA-02]

**Descrição**: Aciona pipeline Moon Shot. SSE com Sparks aprovados.

**FR(s)**: FR-001..018 (FRD externo), FR-152 (mark visual)
**RNs**: RN-001 (zonas), RN-002 (convergência ≥8), RN-003 (acionamento)
**NFR(s)**: NFR-024 (filtragem zonas), NFR-001 (latência)
**DFL**: DFL-02
**ADR**: ADR-008 (proposto)

**Auth**: JWT obrigatório
**RBAC**: Qualquer role; client_id obrigatório

**Request schema** (`SCH-010`):
```python
class MoonShotRequest(BaseModel):
    brief_text: str = Field(min_length=10, max_length=2000)
    client_slug: str           # RN-003 — obrigatório
    intensity: Literal["adjacente", "equilibrado", "radical"] = "equilibrado"
    mode: Literal["comecando-uma-ideia", "me-prova-que-ta-errada", "dupla"] = "comecando-uma-ideia"
    conversation_id: str | None = None
    candidates_per_iter: int = Field(3, ge=1, le=5)
    max_iterations: int = Field(5, ge=1, le=10)  # RN-002 limite
```

**Response**: `text/event-stream`. Eventos:

| Event | Payload | Quando |
|-------|---------|--------|
| `brief_devoured` | `{"brief_id": "uuid", "context_chunks": [...]}` | EV-18 |
| `iteration_start` | `{"iteration": 1}` | Início loop |
| `provocation` | `{"provocation_id", "text", "agent_persona", "scores", "bisociation_zone", "cosine_distance"}` | EV-19 (cada candidato) |
| `critic_feedback` | `{"provocation_id", "decision": "approved/rejected/retry", "feedback_text"}` | Após Crítico |
| `spark` | `Spark schema completo + mark_visual="estimulo"` | EV-20 (aprovado) |
| `reflection_required` | `{"stars_count": N, "threshold": 5}` | EV-21 (RN-015) |
| `done` | `{"brief_id", "sparks_count", "iterations"}` | Final |
| `error` | `{"message"}` | Falha |

**Errors**:
- 400 — `client_slug` ausente (RN-003)
- 401, 403
- 422 — texto < 10 char ou > 2000

**Rate limit**: 10 / min / user

---

#### API-061 — `GET /api/chat/moon-shot/briefs/{brief_id}` [Novo]

**Descrição**: Recupera Brief + Sparks gerados.

---

#### API-062 — `POST /api/chat/moon-shot/sparks/{spark_id}/star` [FR-131]

**Descrição**: Marca Spark como starred (HITL approval). Feeds RN-015 ReflectionTrigger.

**Side-effects**: EV-22 SparkStarred → BC-05

---

#### API-063 — `POST /api/chat/moon-shot/feedback` [Novo]

**Descrição**: Feedback geral sobre execução do Moon Shot (vs. score por Spark).

**Request**:
```python
class ShootFeedbackRequest(BaseModel):
    brief_id: UUID
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(None, max_length=2000)
    selected_spark_ids: list[UUID] = []
```

---

#### API-064 — `POST /api/chat/moon-shot/reflection` [Novo — RN-015]

**Descrição**: Submete resposta ao Reflection Moment ("Por que essas? Que padrão você vê?").

**Request**:
```python
class ReflectionResponseRequest(BaseModel):
    reflection_id: UUID
    creator_response: str | None = None
    was_skipped: bool = False
```

---

### 3.7. Módulo: Multi-tenant / Clients (`/api/clients`) [Novo — CTM-07]

#### API-070 — `GET /api/clients`

**Descrição**: Lista Clientes (Planetas) elegíveis para o usuário (FA-06).

**FR**: FR-128 | **RN**: RN-007 (status), RN-010 (scope)

**Query params**: `status, page, per_page`

**Response 200**:
```python
class ClientSummary(BaseModel):
    client_id: UUID
    slug: str
    name: str
    status: Literal["ACTIVE", "INACTIVE"]
    nda_status: Literal["OK", "PENDING", "BLOCKED"]
    solar_metadata: dict     # {color, orbit_radius, icon, sort_order}
    skills_count: int
    last_activity_at: datetime | None
```

**Migração**: substitui `data/clients.ts` mocado (TODO-TB-03).

---

#### API-071 — `POST /api/clients` [Admin]

**Schema**:
```python
class ClientCreateRequest(BaseModel):
    slug: str = Field(pattern=r"^[a-z][a-z0-9-]+$")
    name: str
    nda_status: Literal["OK", "PENDING", "BLOCKED"] = "PENDING"
    solar_metadata: dict | None = None
```

---

#### API-072 — `GET /api/clients/{slug}` — detalhes
#### API-073 — `PATCH /api/clients/{slug}` — Admin/Líder
#### API-074 — `GET /api/clients/{slug}/biomas` — lista Biomas associados
#### API-075 — `GET /api/clients/{slug}/skills` — Skills atribuídas (FR-109)
#### API-076 — `POST /api/clients/{slug}/users` — atribui user a client (`client_users`)

---

### 3.8. Módulo: Users (`/api/users`) [Novo — CTM-01]

#### API-080 — `GET /api/users` [Admin]

**Query params**: `role, bioma_id, status, q, page, per_page`

**Response**: `UserListResponse`

---

#### API-081 — `GET /api/users/{user_id}`
#### API-082 — `PATCH /api/users/{user_id}` [Admin] — pode mudar role (gera AuditEntry)
#### API-083 — `POST /api/users/{user_id}/profile` [self ou Admin] — FR-151 (career_stage, onboarding_track)

---

### 3.9. Módulo: Measurement (`/api/measurement`) [Novo — CTM-05]

#### API-090 — `GET /api/measurement/avoided-cost` [Admin/Líder/Sponsor]

**Descrição**: Lista AvoidedCost agregado/filtrado.

**FR**: FR-149 | **NFR**: NFR-028 | **DFL**: DFL-04, DFL-06

**Query params**: `skill_id, client_id, bioma_id, period_start, period_end, group_by (skill|client|bioma|month)`

**Response 200**:
```python
class AvoidedCostSummary(BaseModel):
    period_start: date
    period_end: date
    group_by: str
    rows: list[dict]    # group keys + avoided_cost_brl + count
    total_brl: Decimal
    total_runs: int
    baseline_pending_count: int   # RN-018 — quantos sem baseline
```

**Performance**: P95 < 30s para 90 dias (FR-145)

---

#### API-091 — `GET /api/measurement/diversity` [Admin/Sponsor]

**FR**: FR-147 | **NFR**: NFR-027

**Query params**: `period_start, period_end, bioma_id, client_id`

**Response 200**:
```python
class DiversityMetricResponse(BaseModel):
    metric_id: UUID
    period_start: date
    period_end: date
    bioma_id: UUID | None
    client_id: UUID | None
    sample_size: int
    mean_pairwise_cosine: float
    self_bleu: float
    compression_ratio: float
    baseline_mean_pairwise_cosine: float | None
    baseline_self_bleu: float | None
    baseline_compression_ratio: float | None
    divergence_sigma: float | None
    triggered_alert: bool
    calculated_at: datetime
```

---

#### API-092 — `GET /api/measurement/reports` [Admin/Sponsor]

**Descrição**: Lista ExecutiveReports.

**FR**: FR-148 | **RN**: RN-005, RN-020

---

#### API-093 — `GET /api/measurement/reports/{report_id}` [Admin/Sponsor]

**Descrição**: Detalhe do ExecutiveReport (KPIs + diversity_snapshot).

**Response 200**:
```python
class ExecutiveReportResponse(BaseModel):
    report_id: UUID
    period_start: date
    period_end: date
    cycle: Literal["mensal","trimestral","adhoc"]
    summary_kpis: dict           # avoided_cost_brl, conversations, sparks_starred...
    diversity_snapshot: DiversityMetricResponse | None  # CHECK RN-020
    flags: list[str]
    generated_by_job: str | None
    created_at: datetime
```

**NFR**: NFR-027 — bloqueia (422) se cycle != adhoc e diversity_snapshot ausente (RN-020)

---

#### API-094 — `POST /api/measurement/reports/generate` [Admin]

**Descrição**: Gera Executive Report ad-hoc.

**Request**:
```python
class GenerateReportRequest(BaseModel):
    period_start: date
    period_end: date
    cycle: Literal["mensal","trimestral","adhoc"] = "adhoc"
    include_diversity: bool = True  # RN-020 — false só para cycle=adhoc
```

**Response 200**: `ExecutiveReportResponse`

**Errors**:
- 422 (FR-150) — cycle=mensal/trimestral E include_diversity=false (anti-pattern bloqueado)

---

#### API-095 — `GET /api/measurement/dashboard` [Admin/Sponsor]

**Descrição**: Dashboard executivo agregado (FR-145, FR-148) — quick view.

**Performance**: P95 < 30s para janela 90d.

---

#### API-096 — `POST /api/measurement/jobs/diversity` [Service Account] [DFL-06]

**Descrição**: Job mensal disparado por Cloud Scheduler `0 5 1 * *`.

**Auth**: SA token (audience `sunos-jobs`)

**Request schema**: vazio

**Response 200**:
```python
class JobRunResponse(BaseModel):
    job_id: UUID
    status: Literal["completed","failed"]
    metrics_calculated: int
    alerts_raised: int
    completed_at: datetime
```

---

#### API-097 — `POST /api/measurement/jobs/executive-report` [SA] — `0 6 5 * *`
#### API-098 — `POST /api/measurement/jobs/retention` [SA] — diário (RN-013)
#### API-099 — `POST /api/measurement/jobs/avoided-cost-backfill` [Admin] — recalcula baselines

---

### 3.10. Módulo: Safety (`/api/safety`) [Novo — CTM-06]

#### API-100 — `GET /api/safety/alerts` [Admin/Líder]

**Descrição**: Lista SafetyAlerts (FA-11).

**Query params**: `alert_type, severity, status, period_start, period_end`

**Response 200**:
```python
class SafetyAlertResponse(BaseModel):
    alert_id: UUID
    alert_type: Literal["homogenization","cost_cap","audit_anomaly","cross_client_leak","missing_visual_mark","llm_outage"]
    severity: Literal["LOW","MEDIUM","HIGH","CRITICAL"]
    evidence: dict
    escalated_to: list[str]
    status: Literal["OPEN","ACK","RESOLVED"]
    acknowledged_by: UUID | None
    created_at: datetime
    resolved_at: datetime | None
```

---

#### API-101 — `POST /api/safety/alerts/{alert_id}/ack` [Admin/Líder]
#### API-102 — `POST /api/safety/alerts/{alert_id}/resolve` [Admin]
#### API-103 — `GET /api/safety/audit-log` [Admin] — query AuditLog (FR-142, FR-148)

**Query params**: `user_id, action, resource_type, resource_id, period_start, period_end, requires_review_only`

#### API-104 — `GET /api/safety/reflection-moments/{user_id}` [self/Admin] — RN-015

---

### 3.11. Módulo: VideoGen (Phase 16 — `/api/chat/generate-video` + `/api/chat/video-status`) [Novo]

> Spec aprovada em `docs/specs/large/video-generation/spec.md`

#### API-110 — `POST /api/chat/generate-video` [FR-137]

**Descrição**: Inicia geração de vídeo via Vertex AI Veo. Retorna em < 1s com `operation_name`.

**Auth**: JWT obrigatório
**RBAC**: Qualquer role com confirmação explícita pré-execução (FR-137 — custo alto)

**Request schema** (`SCH-020` — VideoGenRequest):
```python
class VideoGenRequest(BaseModel):
    prompt: str
    mode: Literal["t2v", "i2v"] = "t2v"
    model: Literal[
        "veo-3.1-fast", "veo-3.1-standard",
        "veo-3.0-fast", "veo-3.0-standard", "veo-2"
    ] = "veo-3.1-fast"
    aspect_ratio: Literal["16:9", "9:16", "1:1"] = "16:9"
    duration_sec: int = Field(6, ge=4, le=8)
    resolution: Literal["720p", "1080p"] = "1080p"
    audio_enabled: bool = False
    source_image_base64: str | None = None  # obrigatório se mode = "i2v"
    preset: str | None = None
    motion_intensity: Literal["low", "medium", "high"] = "medium"
    seed: int | None = None
```

**Response 200** (`VideoGenStartResponse`):
```python
class VideoGenStartResponse(BaseModel):
    operation_name: str
    status: Literal["queued", "running"] = "queued"
    estimated_seconds: int
    model: str
```

**Errors**:
- 400 — validação prompt
- 401, 403
- 413 — `source_image_base64` > 20MB
- 422 — `mode=i2v` sem `source_image_base64`
- 429 — rate limit
- 500, 503 — Vertex AI down

**Rate limit**: 5 / min / user (custo alto Veo)

**Integração**: INT-08 (Vertex AI Veo)

---

#### API-111 — `GET /api/chat/video-status/{operation_name}`

**Auth**: JWT obrigatório

**Response 200** (`VideoStatusResponse`):
```python
class VideoStatusResponse(BaseModel):
    operation_name: str
    status: Literal["queued", "running", "completed", "failed"]
    progress: float = Field(0.0, ge=0.0, le=1.0)
    video_url: str | None = None
    thumbnail_url: str | None = None
    duration_sec: int | None = None
    error_message: str | None = None
    started_at: datetime
    completed_at: datetime | None = None
```

**Errors**: 401, 404 (operation_name desconhecido), 500

**Rate limit**: 60 / min / user (polling 5s)

---

### 3.12. Módulo: ImageEditor (Phase 16) [Novo]

> Spec aprovada em `docs/specs/large/image-editor/spec.md`

#### API-120 — `POST /api/chat/edit-image` (Inpaint) [FR-136]

**Request schema** (`InpaintRequest`):
```python
class InpaintRequest(BaseModel):
    source_image_base64: str
    mask_base64: str
    prompt: str = ""    # obrigatório se intent=insertion
    intent: Literal["removal", "insertion"] = "removal"
    model: Literal["imagen-3-edit"] = "imagen-3-edit"
```

**Response 200** (`EditImageResponse`):
```python
class EditImageResponse(BaseModel):
    result_url: str          # GCS signed URL TTL 7d
    width: int
    height: int
    model: str
    prompt: str
```

**Errors**: 400, 401, 413 (>20MB), 415, 422 (insertion sem prompt), 429, 500

**Rate limit**: 10 / min / user

**Timeout**: 60s (RNF-03 spec)

---

#### API-121 — `POST /api/chat/outpaint-image`

```python
class OutpaintRequest(BaseModel):
    source_image_base64: str
    direction: Literal["left", "right", "top", "bottom"]
    amount_percent: Literal[25, 50, 75, 100]
    prompt: str | None = None
    model: str = "imagen-3-edit"
```

**Response**: `EditImageResponse`

---

#### API-122 — `POST /api/chat/enhance-image`

```python
class EnhanceRequest(BaseModel):
    source_image_base64: str
    scale: Literal[2, 4] = 2
    model: Literal["imagen-upscaler"] = "imagen-upscaler"
```

**Response**: `EditImageResponse`

**Validação extra**: 422 se `source > 2048px na maior dimensão E scale=4`

---

### 3.13. Módulo: Approval (`/api/approval`) [Novo — CTM-08]

Endpoints para FA-13 (Aprovação Hierárquica). Todos exigem JWT user. Decisão é exclusivamente humana (RN-024) — endpoints de validação são internos ao Approval Engine, não expostos a auto-approve.

#### API-130 — `POST /api/approval/submit` [FR-160, FR-161]

Submete um output (Spark, Turn, Workflow output) ao fluxo de aprovação. Dispara pré-validação automatizada (RN-023).

```python
class SubmitApprovalRequest(BaseModel):
    subject_type: Literal["spark", "turn", "workflow_output"]
    subject_id: UUID4
    client_id: UUID4
    chain_id: Optional[UUID4] = None  # se omitido, resolve chain default do cliente

class SubmitApprovalResponse(BaseModel):
    request_id: UUID4
    status: Literal["PENDING_VALIDATION"]
    chain_id: UUID4
    submitted_at: datetime
```

**Comportamento**:
- 201 com `request_id` quando aceita
- 400 se `subject_id` não pertencer ao `client_id` (RN-010)
- 404 se nenhuma chain ativa para `client_id` (Admin precisa criar antes)
- 409 se já existe ApprovalRequest ativa para o mesmo `(subject_type, subject_id)`
- Cria `subject_snapshot` JSONB imutável; emite `EV-28 SubmissionCreated` + `EV-29 ValidationStarted`

**Roles**: Operacional, Líder, Admin (qualquer um pode submeter).

---

#### API-131 — `GET /api/approval/inbox` [FR-162, FR-164]

Inbox do aprovador autenticado. Lista ApprovalRequests `PENDING_APPROVAL` cujo `current_level_order` corresponde a este aprovador na chain ativa.

```
GET /api/approval/inbox?status=PENDING_APPROVAL&client_id=<uuid>&limit=50&cursor=<opaque>
```

**Response** (`InboxResponse`):
```json
{
  "items": [
    {
      "request_id": "uuid",
      "client": { "client_id": "uuid", "slug": "vivo", "name": "Vivo" },
      "subject_type": "spark",
      "subject_summary": "Faísca: Tequila do Sertão",
      "submitter": { "user_id": "uuid", "display_name": "Cintia Souza" },
      "round": 1,
      "level_order": 2,
      "validation_status": "WARNINGS_ONLY",
      "submitted_at": "2026-04-28T14:00:00Z",
      "expires_at": "2026-04-30T14:00:00Z"
    }
  ],
  "next_cursor": "..."
}
```

**Roles**: qualquer user que esteja em `approval_chain_levels.approver_user_id` ou cuja Role esteja em `approver_role`.

---

#### API-132 — `GET /api/approval/requests/{request_id}` [FR-163]

Detalhe completo de uma ApprovalRequest: snapshot do subject, ValidationReport (findings agrupados por validator), histórico de decisões por rodada.

**Response** (`ApprovalRequestDetail`):
```json
{
  "request_id": "uuid",
  "subject_type": "spark",
  "subject_snapshot": { "...": "imutável" },
  "client_id": "uuid",
  "submitter": { "...": "..." },
  "chain": { "chain_id": "uuid", "version": 3, "levels": [ ... ] },
  "current_round": 1,
  "current_level_order": 2,
  "status": "PENDING_APPROVAL",
  "validation_report": {
    "report_id": "uuid",
    "status": "WARNINGS_ONLY",
    "brand_findings": [ { "severity": "warning", "span": {"start": 12, "end": 28}, "message": "Tom muito coloquial para Vivo Premium", "suggestion": "..." } ],
    "portugues_findings": [],
    "brand_validator_version": "v1.2.0",
    "portugues_validator_version": "v1.0.5",
    "latency_ms": 4231
  },
  "decisions_history": [
    { "decision_id": "uuid", "level_order": 1, "round": 1, "approver": { "...": "..." }, "decision": "APPROVE", "comment": "OK pra Wholesale", "decided_at": "..." }
  ]
}
```

**Roles**: submitter, qualquer aprovador da chain, Líder/Admin do `client_id`.

**Caixa-preta** (RN-011): Operacional que não é o submitter recebe 404 genérico.

---

#### API-133 — `POST /api/approval/requests/{request_id}/decide` [FR-165, FR-166]

Registra decisão humana imutável.

```python
class DecideApprovalRequest(BaseModel):
    decision: Literal["APPROVE", "REJECT", "REQUEST_CHANGES"]
    comment: Optional[str] = None  # recomendado para REJECT/REQUEST_CHANGES
    attachments: Optional[List[Attachment]] = None
```

**Comportamento**:
- 201 + `decision_id` se aceito
- 403 se aprovador não tem permissão para `current_level_order` (RN-024 + RN-026)
- 409 se request já está `APPROVED`/`REJECTED`/`EXPIRED`
- 409 se `decision='REQUEST_CHANGES'` E `current_round=3` → marca `EXPIRED` (RN-025)
- Emite `EV-32` (REQUEST_CHANGES) ou `EV-33 ApprovalDecided`
- Se `APPROVE` no último nível: dispara ValidatedStamp → atualiza subject store; emite `EV-33`
- Decision é imutável após criação (trigger SQL bloqueia UPDATE/DELETE)

**Roles**: aprovador no nível atual da chain.

---

#### API-134 — `POST /api/approval/requests/{request_id}/resubmit` [FR-167]

Submitter envia nova rodada após `CHANGES_REQUESTED` com versão revisada.

```python
class ResubmitRequest(BaseModel):
    new_subject_id: UUID4  # se subject foi recriado
    new_subject_snapshot: dict  # snapshot revisado
    addresses_findings: List[UUID4]  # decision_ids endereçados
```

**Comportamento**:
- 201 incrementa `current_round`; reseta `current_level_order=0` para nova validação
- 409 se `current_round` já = 3 (já marcaria `EXPIRED` no decide; este endpoint não pode ressuscitar)

**Roles**: somente o submitter original.

---

#### API-135 — `GET /api/approval/chains` + `POST /api/approval/chains` [FR-168 — Admin/Líder]

CRUD de ApprovalChains por cliente (RN-026).

`POST` body:
```python
class CreateChainRequest(BaseModel):
    client_id: UUID4
    applies_to_skill_id: Optional[UUID4] = None  # null = default cliente
    levels: List[ChainLevelInput]  # ordered

class ChainLevelInput(BaseModel):
    level_order: int  # ≥ 1
    approver_kind: Literal["USER", "ROLE"]
    approver_user_id: Optional[UUID4] = None
    approver_role: Optional[Literal["Admin", "Lider", "Operacional"]] = None
    sla_hours: int = 48
    escalation_policy: Optional[dict] = None
```

**Validação**: ao menos 1 nível humano; alterações criam **nova versão imutável** — versões anteriores ficam `DEPRECATED`. Mudança gera AuditEntry (RN-012).

**Roles**: Admin (qualquer cliente); Líder (somente clientes em que tem permissão).

---

#### API-136 — `GET /api/approval/validation-reports/{report_id}` [FR-169]

Acesso ao ValidationReport completo (versions dos validators, findings por categoria).

**Roles**: submitter, aprovador da request, Líder/Admin do cliente.

---

### 3.14. Módulo: Drive (`/api/drive`) [Novo — CTM-09]

Endpoints para FA-14 (Google Drive como Fonte). **Read-only sempre** (RN-027, ADR-009). Nenhum endpoint escreve no Drive.

#### API-140 — `POST /api/drive/connect` [FR-170 — Admin/Líder]

Inicia OAuth flow para conectar Drive de um cliente. Servidor gera URL com escopo `drive.readonly` (RN-027) e devolve para o frontend redirecionar.

```python
class ConnectDriveRequest(BaseModel):
    client_id: UUID4
    root_folder_ids: List[str]  # IDs das folders raiz que o cliente deseja autorizar (≥ 1)
```

**Response**:
```json
{ "oauth_url": "https://accounts.google.com/o/oauth2/v2/auth?...", "state": "<csrf>" }
```

**Validação**: scope solicitado é **forçado** a `https://www.googleapis.com/auth/drive.readonly`; se cliente tentar passar escopo write, 422.

---

#### API-141 — `GET /api/drive/oauth-callback` [FR-170]

Callback do Google OAuth. Troca `code` por `refresh_token`; criptografa via Cloud KMS; insere em `drive_oauth_credentials`. Cria `drive_syncs` ACTIVE com `next_scheduled_sync_at = NOW()`.

**Response**: redirect para FE em `/drive/{client_slug}` com toast de sucesso.

---

#### API-142 — `GET /api/drive/sync-state?client_id=<uuid>` [FR-171]

Estado atual do DriveSync de um cliente.

**Response** (`DriveSyncState`):
```json
{
  "sync_id": "uuid",
  "client_id": "uuid",
  "status": "ACTIVE",
  "root_folder_ids": ["..."],
  "last_full_sync_at": "...",
  "last_webhook_event_at": "...",
  "next_scheduled_sync_at": "...",
  "documents_total": 1432,
  "documents_indexed": 1432,
  "documents_curated": 87
}
```

**Roles**: Admin/Líder do cliente.

---

#### API-143 — `POST /api/drive/sync/run` [FR-172 — Service Account ou Admin]

Trigger manual de sync (mesmo endpoint chamado pelo Cloud Scheduler — RN-030 + INT-TB-22).

**Comportamento**: enfileira job; retorna 202 com `job_id`. Job assíncrono executa ListChangesWorker → SnapshotDiffer → CurationAgent.

---

#### API-144 — `POST /api/drive/webhook` [FR-173 — Sem auth user, validação Drive Push]

Webhook receiver para Drive Push notifications (INT-TB-23).

**Headers obrigatórios**:
```
X-Goog-Channel-Id: <uuid>
X-Goog-Resource-State: change|sync|update
X-Goog-Resource-Id: <id>
```

**Validação**: assinatura/headers do Google + `channel_id` deve existir em `drive_syncs` ativo. 401 caso contrário.

---

#### API-145 — `GET /api/drive/documents?client_id=<uuid>` [FR-174]

Lista DriveDocuments visíveis ao usuário autenticado. **AccessGuard** aplica filtro `Drive ACL ∩ RBAC sunOS` (RN-028) antes de devolver.

**Query params**: `mime_type`, `parent_id`, `is_orphan`, paginação cursor-based.

**Response**: lista de `DriveDocument` com flag `acl_match` (boolean).

**Roles**: Admin, Líder do cliente, Operacional somente se também presente em `drive_acl_snapshot`.

---

#### API-146 — `GET /api/drive/documents/{document_id}/content` [FR-175]

Busca conteúdo on-demand via Drive API (`files.get?alt=media`). Não cacheia (ASS-DT-07; cache pode evoluir — TODO-DF-13).

**Comportamento**: retorna content-type + bytes ou 403 se ACL∩RBAC fail; 404 se documento removido do Drive.

---

#### API-147 — `GET /api/drive/suggestions?client_id=<uuid>&status=PENDING` [FR-176]

Inbox de CurationSuggestions PENDING para o curador.

**Response**: lista com `suggestion_id`, `kind`, `confidence`, `rationale`, `payload`, `document` (preview), `created_at`.

**Roles**: Líder/Admin do cliente.

---

#### API-148 — `POST /api/drive/suggestions/{suggestion_id}/decide` [FR-177]

Curador aceita/rejeita sugestão.

```python
class DecideSuggestionRequest(BaseModel):
    decision: Literal["ACCEPT", "REJECT"]
    overrides: Optional[dict] = None  # ex: tags ajustadas pelo curador
```

**Comportamento**:
- `ACCEPT` em `IMPORT_TO_LIBRARY` → dispara Importer → cria `KnowledgeItem` em BC-02 com `provenance.drive_document_id`; emite `EV-39 CurationSuggestionAccepted`
- `ACCEPT` em outros kinds → atualiza metadata em `drive_documents` (tags, marca como duplicate, etc.) — **nunca escreve no Drive**
- `REJECT` → marca `status='REJECTED'`
- 409 se `status != 'PENDING'`

**Roles**: Líder/Admin do cliente.

---

#### API-149 — `GET /api/drive/cleanup-reports?client_id=<uuid>` [FR-178]

Lista DriveCleanupReports históricos (duplicatas, órfãos, candidatos a arquivamento).

**Roles**: Admin/Líder do cliente.

---

#### API-150 — `DELETE /api/drive/oauth?client_id=<uuid>` [FR-179 — Admin]

Revoga conexão OAuth. Marca `revoked_at`, pausa sync (`status=PAUSED`). NÃO apaga `drive_documents` imediatamente — política de retenção em TODO-DT-09.

---

## 4. Schemas Compartilhados (SCH-XXX)

Schemas reutilizados em múltiplos endpoints — convenção para evitar duplicação.

### SCH-001 — UUID + Timestamps base

```python
class TimestampedBase(BaseModel):
    created_at: datetime
    updated_at: datetime
```

### SCH-002 — User (alinhado ENT-08, DO-01)

```python
class UserSchema(BaseModel):
    user_id: UUID
    firebase_uid: str
    email: str = Field(pattern=r".+@.+")
    display_name: str
    role: Literal["Admin", "Lider", "Operacional"]
    bioma_id: UUID | None
    default_client_id: UUID | None
    status: Literal["ACTIVE", "INACTIVE"]
    created_at: datetime
```

### SCH-003 — Client (ENT-13, DO-06)

```python
class ClientSchema(BaseModel):
    client_id: UUID
    slug: str
    name: str
    status: Literal["ACTIVE", "INACTIVE"]
    nda_status: Literal["OK", "PENDING", "BLOCKED"]
    solar_metadata: dict | None
    created_at: datetime
```

### SCH-004 — Skill (ENT-16, DO-17)

```python
class SkillSchema(BaseModel):
    skill_id: UUID
    slug: str
    name: str
    description: str | None
    intent: Literal["criacao", "midia", "planejamento", "conversation"]
    default_model: str
    temperature: float
    client_scope: list[str]
    current_version_id: UUID | None
    status: Literal["DRAFT", "ACTIVE", "DEPRECATED"]
    requires_revision: bool
    created_at: datetime
```

### SCH-005 — Score (ENT-28, DO-41)

```python
class ScoreSchema(BaseModel):
    score_id: UUID
    chat_message_id: str | None
    provocation_id: UUID | None
    user_id: UUID
    thumbs: Literal["up", "down"] | None
    rating: int | None = Field(None, ge=1, le=5)
    comment: str | None
    created_at: datetime
```

### SCH-006 — Provocation / Spark (ENT-24, DO-32)

```python
class ProvocationSchema(BaseModel):
    provocation_id: UUID
    brief_id: UUID
    text: str
    cosine_distance: float
    bisociation_zone: Literal["Obvio", "SweetSpot", "Incoerente", "Adjacente", "Radical"]
    novelty_score: float = Field(ge=0, le=10)
    coherence_score: float = Field(ge=0, le=10)
    creative_potential_score: float = Field(ge=0, le=10)
    mean_score: float
    is_approved: bool
    is_starred: bool
    agent_persona: Literal["Antropofaga", "Carnavalesco", "Ancia"] | None
    mark_visual: Literal["estimulo", "provocacao", "faisca"]
    created_at: datetime
```

### SCH-007 — Trace (ENT-27, DO-30)

```python
class TraceSchema(BaseModel):
    trace_id: UUID
    mlflow_run_id: str | None
    request_id: str | None
    chat_message_id: str | None
    workflow_run_id: UUID | None
    provocation_id: UUID | None
    user_id: UUID
    client_id: UUID | None
    skill_slug: str | None
    model: str
    prompt_tokens: int
    output_tokens: int
    latency_ms: int
    cost_estimate_brl: Decimal | None
    scorer_results: dict | None
    created_at: datetime
```

### SCH-008 — KnowledgeDocument (ENT-03, DO-10)

```python
class KnowledgeDocumentSchema(BaseModel):
    id: UUID
    title: str
    description: str | None = Field(None, min_length=50)
    file_type: Literal["pdf","docx","txt","md","png","jpg","jpeg","webp","mp3","wav","mp4","mov"]
    file_size: int | None
    file_url: str | None
    thumbnail_url: str | None
    tags: list[str] = Field(min_length=2)
    scope: list[str] = Field(min_length=1)
    domain: Literal["cliente","industria","cultura","metodologia","referencia"] | None
    client_id: UUID | None  # obrigatório se domain=cliente
    risk_flag: Literal["OK","RISCO_TURNOVER"] = "OK"
    chunks_count: int = 0
    status: Literal["processing","ready","deprecated","blocked"]
    created_by: UUID | None
    created_at: datetime
    updated_at: datetime
```

### SCH-009 — DiversityMetric (ENT-30, DO-38)

Ver §3.9 API-091.

### SCH-010 — MoonShotRequest

Ver §3.6 API-060.

### SCH-011 — Pagination (genérico)

```python
class PageMeta(BaseModel):
    page: int = Field(ge=1)
    per_page: int = Field(ge=1, le=100)
    total: int
    total_pages: int
```

### SCH-012 — ErrorResponse (FastAPI default)

```python
class ErrorResponse(BaseModel):
    detail: str | list[dict]   # str para HTTPException; list[dict] para validation
```

### SCH-013 — ApprovalRequest (ENT-36, DO-43)

```python
class ApprovalRequestSchema(BaseModel):
    request_id: UUID
    submitter_id: UUID
    client_id: UUID
    subject_type: Literal["spark", "turn", "workflow_output"]
    subject_id: UUID
    subject_snapshot: dict
    chain_id: UUID
    current_round: int = Field(ge=1, le=3)
    current_level_order: int = Field(ge=0)
    status: Literal["PENDING_VALIDATION","PENDING_APPROVAL","CHANGES_REQUESTED","APPROVED","REJECTED","EXPIRED"]
    validation_report_id: UUID | None
    final_decision_id: UUID | None
    submitted_at: datetime
    decided_at: datetime | None
    expires_at: datetime | None
```

### SCH-014 — ValidationReport (ENT-38, DO-46)

```python
class Finding(BaseModel):
    severity: Literal["error","warning","info"]
    span: dict  # {start: int, end: int}
    message: str
    suggestion: str | None = None

class ValidationReportSchema(BaseModel):
    report_id: UUID
    request_id: UUID
    round: int
    status: Literal["PASS","WARNINGS_ONLY","BLOCKING_ERRORS"]
    brand_findings: list[Finding]
    portugues_findings: list[Finding]
    brand_validator_version: str
    portugues_validator_version: str
    started_at: datetime
    completed_at: datetime
    latency_ms: int
```

### SCH-015 — ApprovalChain (ENT-34/35, DO-44)

```python
class ChainLevel(BaseModel):
    level_order: int
    approver_kind: Literal["USER","ROLE"]
    approver_user_id: UUID | None = None
    approver_role: Literal["Admin","Lider","Operacional"] | None = None
    sla_hours: int = 48
    escalation_policy: dict | None = None

class ApprovalChainSchema(BaseModel):
    chain_id: UUID
    client_id: UUID
    applies_to_skill_id: UUID | None
    version: int
    status: Literal["ACTIVE","DEPRECATED"]
    levels: list[ChainLevel]  # ordered by level_order
    created_at: datetime
```

### SCH-016 — DriveDocument (ENT-41, DO-51)

```python
class DriveDocumentSchema(BaseModel):
    document_id: UUID
    sync_id: UUID
    drive_file_id: str
    drive_parent_id: str | None
    name: str
    mime_type: str
    size_bytes: int | None
    content_hash: str | None
    drive_acl_snapshot: list[dict]  # [{principal, role, type}]
    drive_modified_time: datetime
    drive_owners: list[str]
    web_view_link: str | None
    discovered_at: datetime
    last_seen_at: datetime
    is_orphan: bool = False
    acl_match: bool  # computed: principal autenticado tem acesso?
```

### SCH-017 — CurationSuggestion (ENT-42, DO-53)

```python
class CurationSuggestionSchema(BaseModel):
    suggestion_id: UUID
    document_id: UUID
    client_id: UUID
    kind: Literal["IMPORT_TO_LIBRARY","TAG","MERGE_WITH","MARK_DUPLICATE","MARK_OUTDATED"]
    payload: dict
    confidence: float = Field(ge=0, le=1)
    rationale: str
    status: Literal["PENDING","ACCEPTED","REJECTED","STALE"]
    decided_by: UUID | None
    decided_at: datetime | None
    resulting_knowledge_item_id: UUID | None
    created_at: datetime
```

---

## 5. Integration Contracts (INT-XX)

### 5.1. Catálogo de Integrações

| ID | Nome | Direção | Sistema Externo | Protocolo | Frequência | Estado |
|----|------|---------|-----------------|-----------|------------|--------|
| INT-01 | Firebase Auth (verify) | Backend → Firebase | Firebase Auth | Firebase Admin SDK (HTTPS) | Per request | Existente |
| INT-02 | Gemini API | Backend ↔ Gemini | Google Gemini API | langchain-google-genai (HTTPS) | Per chat turn | Existente |
| INT-03 | OpenAI / Anthropic | Backend ↔ LLM | OpenAI / Anthropic | langchain-openai / langchain-anthropic | Opt-in per skill | Existente |
| INT-04 | Cloud Scheduler → Backend | Inbound | Cloud Scheduler | HTTP POST (SA token) | Cron (FR-124, jobs mensais/diários) | Existente + Novo (jobs measurement) |
| INT-05 | MLflow | Backend → MLflow | MLflow Server self-hosted | mlflow client | Per chat turn | Existente |
| INT-06 | GCS (MLflow artifacts) | MLflow → GCS | Google Cloud Storage | GCS SDK | Per artifact | Existente |
| INT-07 | Pub/Sub Domain Events | Backend ↔ Pub/Sub | Cloud Pub/Sub | gRPC | Per event (EV-XX) | Novo (ADR-009 proposto) |
| INT-08 | Vertex AI (Imagen + Veo) | Backend ↔ Vertex | Vertex AI | REST + Polling | Sob demanda | Novo (Phase 16) |
| INT-09 | GCS (Knowledge files + Cold storage) | Backend ↔ GCS | Google Cloud Storage | GCS SDK | Sob demanda + retention | Existente + Evoluído |
| INT-10 | Looker Studio | Backend → Looker | Looker | JDBC ou BigQuery export | Atualização materialized views | Novo |
| INT-11 | Slack / Email | Backend → externos | Slack Webhook / SendGrid | REST | Sob demanda (alerts) | Novo |
| INT-12 | Google Drive API (readonly) | Backend ↔ Drive | Google Drive API v3 | REST `drive.readonly` | Cron 15min + on-webhook + on-import | Novo (FA-14) |
| INT-13 | Google Drive Push | Inbound | Google Drive Push | HTTPS webhook | Reativo a mudanças no Drive | Novo (FA-14) |
| INT-14 | Cloud KMS | Backend ↔ KMS | Google Cloud KMS | gRPC | Per OAuth decrypt | Novo (FA-14) |
| INT-15 | Pub/Sub Approval Events | Backend → Pub/Sub | Cloud Pub/Sub | gRPC | Per submission/decision | Novo (FA-13) |
| INT-16 | Pub/Sub Drive Events | Backend → Pub/Sub | Cloud Pub/Sub | gRPC | Per sync/curation | Novo (FA-14) |

### 5.2. INT-01 — Firebase Auth (verify_id_token)

**Direção**: Inbound

**Protocolo**: Firebase Admin SDK (Python) — `firebase_admin.auth.verify_id_token(id_token)`

**Quando**: A cada request `/api/*` (Auth Gateway middleware — CTM-01)

**Payload de Entrada (Bearer token)**:
```
Authorization: Bearer eyJhbGc...
```

**Validação**:
- Assinatura RS256 contra Firebase JWKS
- `aud == "toolbox-67a0e"` (project_id)
- `exp > now`

**Response (decoded)**:
```python
{
  "uid": "firebase_uid",
  "email": "user@suno.com.br",
  "name": "Display Name",
  "iat": ...,
  "exp": ...
}
```

**Garantias**: Cache de chaves públicas (TTL 1h)

**Erros**: 401 se inválido/expirado.

**ADR**: ADR-006

**NFRs**: NFR-008, NFR-009

---

### 5.3. INT-02 — Gemini API (LLM)

**Direção**: Bidirecional

**Protocolo**: REST via `langchain-google-genai` — model default `gemini-2.5-flash`

**Auth**: API key em Secret Manager (`GOOGLE_API_KEY`)

**Streaming**: SSE-equivalent via `astream` interface

**ADR**: ADR-004 (proposto — Gemini Flash default)

**Falha**: Circuit breaker dinâmico TO-BE (PRB-03 → DT-09 da Parte 5)

**Custo**: estimado por token (`prompt_tokens * cost_input + output_tokens * cost_output`) → `traces.cost_estimate_brl`

---

### 5.4. INT-04 — Cloud Scheduler → Backend

**Direção**: Inbound

**Protocolo**: HTTP POST com OIDC token (audience definido)

**Endpoints alvos**:

| Cron | Endpoint | Job |
|------|----------|-----|
| `*/5 * * * *` (custom per workflow) | `POST /api/workflows/{id}/run` | FR-124 |
| `0 5 1 * *` (mensal) | `POST /api/measurement/jobs/diversity` | DFL-06 |
| `0 6 5 * *` (mensal) | `POST /api/measurement/jobs/executive-report` | FR-148 |
| `0 4 * * *` (diário) | `POST /api/measurement/jobs/retention` | RN-013 |
| `0 3 1 */3 *` (trimestral) | `POST /api/knowledge/jobs/risk-flag` | FR-106, RN-008 |

**Headers obrigatórios**:
```
Authorization: Bearer <oidc_id_token_from_scheduler>
X-CloudScheduler-Job-Name: <job_name>
```

**Auth Gateway** valida `audience=sunos-jobs` e marca `principal=service_account`.

---

### 5.5. INT-07 — Pub/Sub Domain Events

**Direção**: Bidirecional

**Tópico (proposto)**: `projects/<gcp_project>/topics/sunos.events` (1 tópico único, evento via attribute `event_type`) — ver TODO-API-02

**Protocolo**: gRPC Pub/Sub Python SDK

**Eventos publicados**: EV-01 a EV-27 (catálogo Parte 2 §5)

**Schema do envelope**:
```python
{
  "event_id": "uuid",
  "event_type": "EV-14",
  "event_name": "TurnCompleted",
  "occurred_at": "ISO8601",
  "actor": {"user_id", "client_id", "request_id"},
  "payload": { ... }   # específico por evento
}
```

**Subscribers**:
- Measurement Service (CTM-05): EV-14, EV-20, EV-22, EV-26 → AvoidedCost / Diversity sample
- Audit Logger (CTM-01): EV-02, EV-11 → audit_log
- Notify (CTM-06): EV-08, EV-24, EV-27 → SafetyAlert pipeline

**ADR**: ADR-009 (proposto)

**Garantias**: at-least-once + DLQ + replay

---

### 5.6. INT-08 — Vertex AI (Imagen + Veo)

**Direção**: Bidirecional

**Protocolo**: REST (`aiplatform_v1.PredictionServiceClient` Python ou direct REST call)

**Endpoints**:
- `predict` — Imagen 4 (síncrono, < 30s)
- `predictLongRunning` — Veo (assíncrono, retorna `operation_name`)
- `operations.get` — polling status

**Auth**: GCP service account com role `aiplatform.user`

**Quotas**: a confirmar com SRE (TODO-TB-05 — Parte 6)

**Errors comuns**:
- 429 — quota
- 503 — região indisponível (fallback `us-central1`)

---

### 5.7. INT-09 — GCS (Knowledge + Cold)

**Buckets**:
| Bucket | Conteúdo | Lifecycle |
|--------|----------|-----------|
| `gs://sunos-knowledge` | Arquivos Biblioteca brutos | — |
| `gs://sunos-mlflow-artifacts/sunos` | Artifacts MLflow | — |
| `gs://sunos-cold-archive` (TO-BE) | Traces > 12m (RN-013) | Coldline |

**Signed URLs**: emitidas com TTL 7d para `result_url` (image edit, video).

---

### 5.8. INT-10 — Looker Studio

**Direção**: Backend → Looker (read-only)

**Protocolo**: JDBC (Cloud SQL connector) **ou** BigQuery export (a decidir — TODO-TB-04)

**Materialized views** alimentadas: `mv_avoided_cost_monthly`, `mv_diversity_trend`, `mv_skill_health`

---

### 5.9. INT-11 — Slack / Email

**Direção**: Backend (AlertEmitter MS-07) → externos

**Slack**: Webhook URL em Secret Manager (`SLACK_ALERT_WEBHOOK_URL`)

**Email**: SendGrid ou GCP Mail (a confirmar)

**Eventos disparadores**: SafetyAlert HIGH/CRITICAL, RiskFlag escalation, **EV-31 ApprovalRouted** (notify aprovador), **EV-41 OAuthExpired** (notify Líder).

---

### 5.10. INT-12 — Google Drive API (drive.readonly)

**Direção**: Backend (Drive Connector — CTM-09) → Google Drive

**Protocolo**: REST v3 (`https://www.googleapis.com/drive/v3`); biblioteca `google-api-python-client`

**Escopo único permitido**: `https://www.googleapis.com/auth/drive.readonly` (RN-027). Code review + unit test bloqueiam qualquer escopo write.

**Operações usadas**:
- `changes.list` — paginated, com `pageToken` salvo em `drive_syncs`
- `files.list` — fallback inicial após connect
- `files.get?alt=media` — fetch conteúdo on-demand quando curador aceita IMPORT
- `permissions.list` — popula `drive_acl_snapshot`

**Auth**: OAuth 2.0 com refresh_token criptografado em KMS; token de acesso curto mintado on-demand.

**Erros comuns**:
- `401 Unauthorized` → token revogado → marca `OAUTH_EXPIRED`, emite `EV-41`
- `403 insufficientPermissions` → escopo errado → bloqueia + alert (não deveria ocorrer dado scope check)
- `429 rateLimitExceeded` → backoff exponencial; Drive permite ~1k req/100s/user

---

### 5.11. INT-13 — Google Drive Push Webhook

**Direção**: Inbound (Google → Backend `/api/drive/webhook`)

**Setup**: `files.watch` (ou `changes.watch`) registra channel; Google envia POST em mudanças. Channels têm TTL ≈ 7d → renovação periódica via Cloud Scheduler (TODO-DF-12, ASS-TB-08).

**Validação obrigatória** (anti-spoofing):
- Header `X-Goog-Channel-Id` deve existir em `drive_syncs` ativo
- Verificar IP do Google (faixas conhecidas) ou validar token compartilhado em `X-Goog-Channel-Token`

---

### 5.12. INT-14 — Cloud KMS (encrypt/decrypt OAuth)

**Direção**: Backend ↔ KMS

**Protocolo**: gRPC `google-cloud-kms`

**Quando**: encrypt no `POST /api/drive/oauth-callback`; decrypt em cada `ListChangesWorker` run e `Importer` fetch.

**Política de chaves**: 1 keyring por environment (dev/staging/prod); 1 key por env. TODO-DT-10 avalia se evolui para 1 key per cliente conforme compliance.

**Auditabilidade**: KMS gera audit logs próprios em Cloud Audit Logs (não duplicar em `audit_log`).

---

### 5.13. INT-15 — Pub/Sub Approval Events

**Direção**: Backend (Approval Engine) → Pub/Sub

**Tópico**: `sunos.approval.events`

**Eventos publicados**: `EV-28 SubmissionCreated`, `EV-29 ValidationStarted`, `EV-30 ValidationCompleted`, `EV-31 ApprovalRouted`, `EV-32 ChangesRequested`, `EV-33 ApprovalDecided`, `EV-34 ApprovalExpired`.

**Subscribers**: Measurement Service (KPI taxa de aprovação primeiro round, latência média, retrabalho), AlertEmitter (notify aprovador em ApprovalRouted).

---

### 5.14. INT-16 — Pub/Sub Drive Events

**Direção**: Backend (Drive Connector) → Pub/Sub

**Tópico**: `sunos.drive.events`

**Eventos publicados**: `EV-35 DriveSyncStarted`, `EV-36 DriveSyncCompleted`, `EV-37 DriveDocumentDiscovered`, `EV-38 CurationSuggestionGenerated`, `EV-39 CurationSuggestionAccepted`, `EV-40 CleanupReportGenerated`, `EV-41 OAuthExpired`.

**Subscribers**: Measurement Service (KPI cobertura de curadoria, dedup ratio), Notification (Líder em OAuthExpired e CleanupReportGenerated).

---

## 6. Versionamento de APIs

### 6.1. Estratégia (proposta)

A As-Is **não usa versionamento** (paths `/api/chat/*` direto). Para a To-Be:

**Opção (a) preferida** — manter `/api/*` (sem versionamento) durante Piloto/MVP, dado que sunOS é **interno** e frontend + backend deployam juntos.

**Opção (b)** — adotar `/api/v1/*` se houver necessidade futura de cliente externo (clientes da Suno, parceiros).

**Decisão**: ver TODO-API-04 — discutir com Heitor.

### 6.2. Deprecação

Headers de deprecation (quando aplicável):
```
Deprecation: true
Sunset: <RFC 1123 date>
Link: <new path>; rel="successor-version"
```

---

## 7. OpenAPI / Auto-docs

FastAPI gera OpenAPI 3.0 automaticamente em **runtime**:
- Schema JSON: `GET /openapi.json`
- Swagger UI: `GET /docs` (DEBUG only)
- ReDoc: `GET /redoc` (DEBUG only)

**Em produção**: bloqueado por Auth Gateway (NFR-008) ou desabilitado via `docs_url=None, redoc_url=None`.

---

## 8. Rastreabilidade API ↔ FR ↔ Aggregate ↔ NFR ↔ DFL

| API | FR(s) | Aggregate (Parte 2) | NFRs | DFL (Parte 4) |
|-----|-------|---------------------|------|---------------|
| API-001/002 (Auth) | FR-138 | User | NFR-008, NFR-009 | DFL-07 |
| API-010 (chat/stream) | FR-110, FR-116, FR-117, FR-141 | Conversation, Turn | NFR-001, NFR-002, NFR-026 | DFL-01, DFL-04 |
| API-013 (gen-image) | FR-135 | — | NFR-021 | — |
| API-016 (scores) | FR-131..133 | Score | — | DFL-01 final |
| API-020..028 (knowledge) | FR-100..108 | KnowledgeItem, IngestionJob, RiskFlag | NFR-002, NFR-004, NFR-007 | DFL-03 |
| API-030..037 (skills) | FR-109, FR-112..115, FR-156 | Skill, SystemPrompt, Moon, TimeBaseline | NFR-016, NFR-025 | DFL-04 |
| API-040..053 (workflows) | FR-122..127 | Workflow, WorkflowRun, StepLog | NFR-002, NFR-005 | DFL-05 |
| API-060..064 (moon-shot) | FR-001..018 (FRD), FR-152 | Brief, Spark, Provocation | NFR-001, NFR-024 | DFL-02 |
| API-070..076 (clients) | FR-128 | Client, Bioma | NFR-010 | (transversal) |
| API-080..083 (users) | FR-138, FR-151 | User, Profile | NFR-008, NFR-009 | DFL-07 |
| API-090..099 (measurement) | FR-144, FR-145, FR-147..150 | Trace, AvoidedCost, DiversityMetric, ExecutiveReport | NFR-026, NFR-027, NFR-028 | DFL-04, DFL-06 |
| API-100..104 (safety) | FR-142, FR-148, FR-152 | SafetyAlert, AuditEntry, ReflectionMoment | NFR-008, NFR-021 | DFL-07 |
| API-110/111 (video) | FR-137 | — | — | — |
| API-120..122 (image edit) | FR-136 | — | — | — |
| API-130..136 (approval) | FR-160..169 | ApprovalRequest, ValidationReport, ApprovalChain, ApprovalDecision | NFR-001 (TODO-DM-08), NFR-008, NFR-009, NFR-010, NFR-026 | DFL-08 |
| API-140..150 (drive) | FR-170..179 | DriveSync, DriveDocument, OAuthCredential, CurationSuggestion, DriveCleanupReport | NFR-008 (KMS), NFR-010 (ACL∩RBAC), NFR-011 | DFL-09 |

---

## 9. Inconsistências entre Router Atual e Specs Novos

Identificadas durante a redação desta Parte 8:

### 9.1. Router atual

| ID | Inconsistência | Onde | Impacto |
|----|----------------|------|---------|
| INC-API-01 | `chat/router.py` **não aplica** `Depends(get_current_user)` em nenhum endpoint | `api/chat/router.py` linhas 30, 62, 93, 131, 165 | LIM-01 (Parte 5) — viola NFR-008 / RN-009 |
| INC-API-02 | `GET /chat/conversations` retorna **placeholder vazio** (sem DB query) | `api/chat/router.py:165` | API-014 não funcional; precisa implementação real |
| INC-API-03 | `ChatRequest` não tem `client_slug` ou `client_id` — multi-tenant não está enforced server-side | `api/chat/schemas/chat.py:6` | RN-010 (cross-client) e FR-141 não enforced |
| INC-API-04 | `workflows/router.py` usa `_workflows: dict` **in-memory** — perde dados em restart | `api/workflows/router.py:32` | Bloqueia Piloto; precisa migrar para DB |
| INC-API-05 | `workflows/router.py` usa `created_by="admin"` hardcoded em vez de extrair do JWT | `:174` | Quebra auditoria (RN-012) |
| INC-API-06 | `knowledge/router.py:upload` permite tags vazias e descrição opcional — viola **RN-006** | `:67` (params são `Form("")`) | Documentos sem metadata válida no banco |
| INC-API-07 | Schemas atuais usam tipos **menos precisos** (`str` para enums) — não usam `Literal` | `chat/schemas/chat.py` | Validação fraca; difícil OpenAPI |
| INC-API-08 | `ImageGenRequest.model` aceita string livre (sem `Literal`); `aspect_ratio` idem | `:39` | Frontend pode enviar valores inválidos |
| INC-API-09 | Frontend `lib/api.ts` **não define** `editImage`/`outpaintImage`/`enhanceImage`/`generateVideo` (presentes nas specs Phase 16) | `lib/api.ts` | Phase 16 ainda não wired no frontend |
| INC-API-10 | Spec `image-editor` usa path `/chat/edit-image` mas router atual não tem nenhum endpoint Phase 16 | `docs/specs/large/image-editor/spec.md:260` vs. `api/chat/router.py` | Implementação Phase 16 pendente |
| INC-API-11 | Spec `video-generation` exige polling `/chat/video-status/{op}` — router atual sem implementação | `docs/specs/large/video-generation/spec.md:241` | Pendente |
| INC-API-12 | Não há endpoint para CRUD de **Clients** — frontend lê `data/clients.ts` mocked | — | Bloqueia migração do Sistema Solar (Parte 6 §4.4 CTM-07) |
| INC-API-13 | Sem rate limiting middleware aplicado | — | NFR / GR-001 não atendidos |
| INC-API-14 | Schemas Pydantic não usam `UUID` — `conversations.id` é `VARCHAR` (LIM-12 Parte 3) | `models/conversation.py` | Inconsistência tipo entre `traces.user_id` (UUID) e `conversations.id` (VARCHAR) |

### 9.2. Resumo

A maioria das inconsistências reflete o **estado de protótipo** (Parte 5 LIM-01..LIM-12, DT-01..DT-10) e está **endereçada na To-Be** (Parte 6) via:

- Auth Gateway (CTM-01) — resolve INC-01
- Modularização Conversation Service (CTM-03) — resolve INC-02, INC-03
- Migração Workflows para DB — resolve INC-04, INC-05
- Validação RN-006 server-side — resolve INC-06
- Refactor schemas com `Literal` — resolve INC-07, INC-08
- Implementação Phase 16 — resolve INC-09, INC-10, INC-11
- Multi-tenant Resolver (CTM-07) — resolve INC-12
- Middleware rate-limiting — resolve INC-13
- Migração tipos UUID — resolve INC-14 (DT da Parte 3)

---

## 10. Assunções e Lacunas

### 10.1. Assunções

| ID | Assunção | Impacto se Falsa | Status |
|----|----------|------------------|--------|
| ASS-API-01 | REST + SSE é suficiente para o sunOS — não precisa GraphQL ou WebSocket bidirecional | Médio — refatoração se streaming complexo | A validar |
| ASS-API-02 | Firebase JWT como única forma de auth (sem API keys para clients externos) | Baixo — sunOS é interno | Confirmado |
| ASS-API-03 | Schemas Pydantic v2 (`model_validator`) | Baixo — já em uso | Confirmado |
| ASS-API-04 | OpenAPI auto-gen é suficiente — não precisa contract testing externo (Pact) | Baixo — time pequeno | Aceito |
| ASS-API-05 | Rate limiting via slowapi ou Cloud Armor (não Cloudflare) | Médio — depende do edge | A validar |
| ASS-API-06 | SSE é estável atrás do Cloud Run + Load Balancer (não há buffering perdendo eventos) | Médio — `X-Accel-Buffering: no` já aplicado | Confirmado |
| ASS-API-07 | Multipart upload via `UploadFile` suporta arquivos até 50MB sem buffering em disco quebrar Cloud Run | Médio — pode requerer signed URL direto a GCS para arquivos > 25MB | A medir |
| ASS-API-08 | Approval inbox usa polling (GET /api/approval/inbox) — não exige WebSocket/push | Baixo — pode evoluir se TPS subir | A validar com UX |
| ASS-API-09 | Drive Push webhook ouvido somente por uma instância (Cloud Run scaling = 1 worker per channel) — sem dedup distribuído | Médio — pode requerer Pub/Sub intermediário se autoscaler ativar | A medir em piloto |

### 10.2. Lacunas (TODOs)

| ID | Descrição | Referência | Responsável |
|----|-----------|------------|-------------|
| TODO-API-01 | Decidir biblioteca/lugar do rate-limiting (slowapi vs. Cloud Armor) e thresholds finais | NFR-006 / GR-001 | Eng + SRE |
| TODO-API-02 | Confirmar topologia Pub/Sub (1 tópico vs. N por evento) — afeta INT-07 | ADR-009 proposto | Eng + Heitor |
| TODO-API-03 | Validar formato de export Looker (JDBC direto vs. BigQuery export) | INT-10 | Data + SRE |
| TODO-API-04 | Decidir se adotar `/v1/` prefix nos endpoints To-Be | §6.1 | Heitor |
| TODO-API-05 | Definir TTL de signed URLs em result_url (image/video) — atual proposta 7d, validar com produto | INT-08 | Heitor + UX |
| TODO-API-06 | Especificar `request_id` propagation (header `X-Request-ID` é gerado pelo cliente, server, ou ambos?) | NFR-026 | Eng |
| TODO-API-07 | Definir comportamento do endpoint `/api/chat/stream` quando `system_prompt` é enviado por Operacional (403 ou silently dropped?) | RN-009 | Heitor |
| TODO-API-08 | Mapear quotas de Vertex AI (Imagen + Veo) por projeto e implementar circuit breaker | INT-08 | SRE + Eng |
| TODO-API-09 | Confirmar endpoint `/api/measurement/jobs/avoided-cost-backfill` (manual? cron?) | API-099 | Heitor |
| TODO-API-10 | Especificar webhook payload do Slack (formato Block Kit vs. simples) | INT-11 | UX + Eng |
| TODO-API-11 | Definir SLA p95 para `POST /api/approval/submit → ValidationReport ready` (TODO-DM-08) | API-130 | Heitor + Eng |
| TODO-API-12 | Decidir formato de `attachments` em ApprovalDecision (URL signed vs. base64) | API-133 | UX + Eng |
| TODO-API-13 | Definir política de paginação cursor para `/api/drive/documents` (cursor-based vs. offset) | API-145 | Eng |
| TODO-API-14 | Confirmar política de retenção/apagamento de DriveDocument após `DELETE /api/drive/oauth` | API-150, TODO-DT-09 | Heitor + Jurídico |

---

## Histórico de Versões

| Versão | Data | Autor | Alterações |
|--------|------|-------|------------|
| 1.0 | 2026-04-28 | Heitor Miranda + Claude | Versão inicial. **66 endpoints** documentados (19 existentes em `api/chat/router.py` + `api/chat/knowledge/router.py` + `api/workflows/router.py`; 47 novos para Auth, Skills, Provocation/Moon Shot, Multi-tenant, Users, Measurement, Safety, VideoGen, ImageEditor). **12 schemas compartilhados** (SCH-001 a SCH-012) alinhados com Aggregates da Parte 2 e Entidades da Parte 3. **11 integration contracts** (INT-01 a INT-11) cobrindo Firebase, Gemini/OpenAI/Anthropic, Cloud Scheduler (5 jobs cron), MLflow, Pub/Sub (proposto ADR-009), Vertex AI Imagen+Veo, GCS (3 buckets), Looker, Slack/Email. **14 inconsistências** entre router atual e specs novos catalogadas (INC-API-01 a INC-API-14) — todas endereçadas na Parte 6 (Arch To-Be). Auth Firebase JWT detalhada com matriz RBAC 3-níveis (Admin/Líder/Operacional). Rate limiting proposto por endpoint group. Phase 16 (VideoGen + ImageEditor) com schemas Pydantic completos extraídos das specs `docs/specs/large/`. Status: Rascunho aguardando revisão de Eng + Heitor. |
| 1.1 | 2026-04-28 | Heitor Miranda + Claude | Adicionados **2 módulos novos para BC-07** (Approval Engine CTM-08 + Drive Connector CTM-09): **§3.13 Approval** (7 endpoints — submit, inbox, detail, decide, resubmit, chains, validation reports) cobrindo FA-13/FR-160..169; **§3.14 Drive** (11 endpoints — connect OAuth, callback, sync state, sync run, webhook, documents, content fetch, suggestions inbox, decide suggestion, cleanup reports, revoke OAuth) cobrindo FA-14/FR-170..179. **+5 schemas** (SCH-013 ApprovalRequest, SCH-014 ValidationReport, SCH-015 ApprovalChain, SCH-016 DriveDocument, SCH-017 CurationSuggestion). **+5 integration contracts** (INT-12 Google Drive API readonly, INT-13 Drive Push webhook, INT-14 Cloud KMS, INT-15 Pub/Sub Approval, INT-16 Pub/Sub Drive). Total: **14 módulos | 19 existentes + 60 novos = 79 endpoints**. Rastreabilidade API↔FR↔Aggregate↔NFR↔DFL estendida com DFL-08/09. +2 assunções (ASS-API-08/09) e +4 TODOs (TODO-API-11..14). Status: Rascunho aguardando revisão de Eng + Heitor. |
