# sunOS — Technical Handoff

**Last Updated:** 2026-04-15
**Data original:** 2026-04-16
**De:** Heitor Miranda (Tech Lead)
**Para:** Tech Lead, Arquiteto, Desenvolvedores
**Repo:** https://github.com/koro-creators/suno-os

---

## 1. Arquitetura & Stack

### Visão Geral (C4 Nível 1)

```
                    ┌──────────┐
                    │ Usuário  │
                    └────┬─────┘
                         │ HTTPS
                    ┌────▼─────┐
                    │ Frontend │ Next.js 14 (porta 3003)
                    └────┬─────┘
                         │ fetch + SSE
                    ┌────▼─────┐
                    │ Backend  │ FastAPI + LangGraph (porta 8080)
                    └────┬─────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
    ┌──────────┐  ┌──────────┐  ┌──────────────┐
    │PostgreSQL│  │   GCS    │  │  Google AI   │
    │(pgvector)│  │(arquivos)│  │(Gemini/Imagen)│
    └──────────┘  └──────────┘  └──────────────┘
```

### Visão Geral (C4 Nível 2 — Backend)

```
Request (POST /api/chat/stream)
  │
  ▼
main.py → Middleware (request ID, logging, CORS dev, error handlers)
  │
  ▼
chat/router.py → Valida request, inicia streaming
  │
  ▼
chat/graph/runner.py → _get_llm() + build agents + compile graph
  │
  ▼
chat/graph/builder.py → StateGraph(SunosChatState)
  │
  ├── top_supervisor → detecta intenção (criacao/midia/planejamento/conversation)
  │     │
  │     ▼ conditional_edges
  │
  ├── orchestrator → carrega skill (SkillLoader) + executa agent
  │     │
  │     ├── ContentCreator (ReAct: chat_tools, text_tools, search_knowledge)
  │     ├── VisualCreator (ReAct: image_tools)
  │     └── Conversational (sem tools, resposta direta)
  │
  └── respond → garante AIMessage no final → END
  │
  ▼
SSE events: text → sources → tool_call → tool_result → done | error
```

### Stack Detalhada

| Camada | Tecnologia | Versão | Notas |
|--------|-----------|--------|-------|
| **Frontend** | Next.js (App Router) | 14.2 | TypeScript strict |
| **Estilo** | Tailwind CSS + CSS vars | 3.4 | Inline styles para componentes |
| **Icons** | Lucide React | 0.468 | size 14, strokeWidth 1.5 |
| **State** | React Context | — | 5 providers (Auth, Skills, Biblioteca, Clients, Workflows) |
| **Backend** | FastAPI | 0.115+ | Async, StreamingResponse |
| **Agents** | LangGraph | 0.4+ | StateGraph, conditional edges |
| **LLM** | LangChain | 0.3+ | Gemini Flash default |
| **Embeddings** | text-embedding-004 | — | 768 dims, via Gemini API |
| **Vector DB** | pgvector | — | Extensão PostgreSQL, cosine search |
| **DB** | PostgreSQL | 15+ | Cloud SQL (shared) |
| **Storage** | GCS | — | Bucket `sunos-knowledge` |
| **Auth** | Firebase Admin | 6.2+ | JWT + Custom Claims |
| **Tracing** | MLflow | 2.10+ | GenAI tracing |
| **Package (Python)** | uv | — | Lockfile: `uv.lock` |
| **Deploy** | Cloud Run | — | Dockerfile multi-stage |
| **CI/CD** | GitHub Actions | — | `ci.yml` + `deploy-staging.yml` |

### ADRs (Decisões de Arquitetura)

| ADR | Decisão | Status |
|-----|---------|--------|
| ADR-001 | Workflow Builder com LangGraph (aceito) | Implementado |
| ADR-002 | Engine único com context injection (não deep agent por cliente) | Aceito |

Docs em: `docs/adr/`

---

## 2. Setup do Ambiente

### Pré-requisitos

```bash
# Node.js 20+
node --version  # v20.x

# Python 3.11+
python3 --version  # 3.11.x

# uv (Python package manager)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Google Cloud CLI (para deploy)
gcloud --version
```

### Passo a passo

```bash
# 1. Clonar
git clone https://github.com/koro-creators/suno-os.git
cd suno-os

# 2. Frontend
npm install

# 3. Backend
cd api
uv sync
cp .env.example .env
# Editar .env com suas API keys (GOOGLE_API_KEY obrigatório)
cd ..

# 4. Frontend env
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8080 (já preenchido)

# 5. Rodar backend (terminal 1)
cd api && uv run uvicorn main:app --host 0.0.0.0 --port 8080 --reload

# 6. Rodar frontend (terminal 2)
npx next dev -p 3003

# 7. Verificar
curl http://localhost:8080/health   # {"status":"healthy"}
open http://localhost:3003          # Login ou Home
```

### Variáveis de Ambiente

**Frontend (`.env.local`):**
```
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
```

**Backend (`api/.env`):**
```
ENVIRONMENT=local
DEBUG=true
GOOGLE_API_KEY=...              # Obrigatório (Gemini)
OPENAI_API_KEY=                 # Opcional (GPT-4o fallback)
ANTHROPIC_API_KEY=              # Opcional (Claude fallback)
DATABASE_URL=postgresql+asyncpg://...
FIREBASE_PROJECT_ID=koro-creators
```

### Troubleshooting

| Problema | Causa | Solução |
|----------|-------|---------|
| Chat retorna fallback "Desculpe..." | LLM API key missing ou modelo errado | Verificar `GOOGLE_API_KEY` no `.env` |
| Frontend tela branca | Backend não rodando | Verificar porta 8080 |
| Login loop | Firebase não configurado | Dev bypass ativo em development |
| `tsc` errors | Tipos desatualizados | `npx tsc --noEmit` para checar |
| Port already in use | Processo anterior | `lsof -ti:3003 \| xargs kill -9` |

---

## 3. Mapa do Código

### Estrutura de Diretórios

```
sunos/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Home (sistema solar)
│   ├── login/page.tsx            # Login Google
│   ├── [clientSlug]/             # Navegação solar (3 níveis — SPEC-007)
│   │   └── [skillSlug]/
│   │       ├── page.tsx          # Chat contextualizado (moons como chips)
│   │       └── [moonSlug]/page.tsx  # Redirect → /[client]/[skill]?moon=[moon]
│   ├── skills/                   # Admin de skills
│   ├── biblioteca/               # Admin de biblioteca
│   ├── clientes/                 # Admin de clientes
│   ├── workflows/                # Workflow builder
│   │   ├── page.tsx              # Catálogo
│   │   ├── new/page.tsx          # Criar workflow
│   │   └── [workflowId]/
│   │       ├── page.tsx          # Editar workflow
│   │       └── runs/page.tsx     # Histórico de execuções
│   └── design-system/page.tsx    # Component library reference
│
├── components/
│   ├── admin/                    # Skills admin (SkillCard, SkillEditor, SkillsTable, SkillsSidebar, SkillDrawer, tabs)
│   ├── biblioteca/               # Biblioteca (BibliotecaCard, BibliotecaTable, BibliotecaSidebar, BibliotecaDrawer, Modal, Filters, FileTypeIcon)
│   ├── chat/                     # Chat (ChatInterface, MessageBubble, ModelSelector, SocialPreview, ContextSidebar, StreamingIndicator, PromptTemplateBar)
│   ├── clientes/                 # Clientes admin (ClientCard, ClientEditor, ClientDrawer)
│   ├── layout/                   # Layout (Sidebar, AppHeader, Providers, AuthGuard, AppShell)
│   ├── solar/                    # Sistema solar (OrbitalSystem, PlanetNode, MoonNode, QuickStats)
│   ├── ui/                       # Primitivas (Toast, EmptyState, Skeleton)
│   └── workflows/                # Workflows (WorkflowCard, WorkflowTable, WorkflowDrawer, WorkflowBuilder, StepEditor, RunTimeline)
│
├── contexts/                     # React Context providers
│   ├── AuthContext.tsx           # Firebase Auth + roles
│   ├── SkillsContext.tsx         # CRUD skills
│   ├── BibliotecaContext.tsx     # CRUD docs + upload
│   ├── ClientsContext.tsx        # CRUD clientes
│   └── WorkflowsContext.tsx      # CRUD workflows
│
├── hooks/
│   ├── useToolStream.ts          # SSE consumer + mock fallback
│   ├── useStreamingText.ts       # Mock streaming (legacy)
│   ├── useOrbitalLayout.ts       # Cálculo de posições do sistema solar
│   └── useWorkflowRun.ts         # Execução de workflow + polling
│
├── lib/
│   ├── api.ts                    # HTTP client (apiAvailable, consumeSSE, getAuthToken)
│   ├── firebase.ts               # Firebase client init
│   ├── types.ts                  # Core types (Client, Skill, Moon)
│   ├── admin-types.ts            # SkillAdmin, SkillVersion
│   ├── biblioteca-types.ts       # BibliotecaDocument, KnowledgeFileType
│   ├── client-types.ts           # ClientAdmin, ClientMetrics
│   ├── feedback-types.ts         # MessageFeedback, SessionFeedback
│   ├── workflow-types.ts         # WorkflowDefinition, WorkflowStep, WorkflowRun
│   └── utils.ts                  # getClientBySlug, cn(), etc.
│
├── data/                         # Mock data (fallback quando sem backend)
│   ├── clients.ts                # ⚠️ NÃO MODIFICAR — dados do sistema solar
│   ├── skills-admin.ts           # 10 skills mocados
│   ├── biblioteca-docs.ts        # 31 documentos mocados
│   ├── clients-admin.ts          # 5 clientes mocados
│   ├── chat-responses.ts         # Respostas mock para chat
│   └── prompt-templates.ts       # Templates de prompt por moon
│
├── api/                          # Backend (FastAPI + LangGraph)
│   ├── main.py                   # App entry + middleware + error handlers
│   ├── config.py                 # Pydantic Settings
│   ├── core/
│   │   └── firebase.py           # Firebase Admin init
│   ├── models/
│   │   ├── base.py               # SQLAlchemy Base
│   │   ├── conversation.py       # Conversation + ChatMessage
│   │   └── knowledge.py          # KnowledgeDocument + KnowledgeChunk
│   ├── chat/
│   │   ├── router.py             # /api/chat/* endpoints
│   │   ├── schemas/chat.py       # Request/response Pydantic models
│   │   ├── agents/
│   │   │   ├── base.py           # BaseAgent ABC
│   │   │   ├── content_creator.py # ReAct: chat + text + search
│   │   │   ├── visual_creator.py  # ReAct: image
│   │   │   └── conversational.py  # Sem tools, resposta direta
│   │   ├── graph/
│   │   │   ├── state.py          # SunosChatState TypedDict
│   │   │   ├── top_supervisor.py # Routing por intenção
│   │   │   ├── orchestrator.py   # Skill loading + agent execution
│   │   │   ├── builder.py        # Monta StateGraph
│   │   │   └── runner.py         # Streaming execution + SSE events
│   │   ├── tools/
│   │   │   ├── chat_tools.py     # _get_llm() + chat_completion tool
│   │   │   ├── text_tools.py     # generate_text tool
│   │   │   ├── image_tools.py    # generate_image tool (mock)
│   │   │   ├── prompt_tools.py   # enhance_prompt tool
│   │   │   ├── search_tools.py   # web_search tool (mock)
│   │   │   └── retry.py          # retry_on_error decorator
│   │   ├── knowledge/
│   │   │   ├── router.py         # /api/knowledge/* endpoints
│   │   │   ├── schemas.py        # Knowledge Pydantic models
│   │   │   ├── embeddings.py     # Gemini text-embedding-004
│   │   │   ├── vector_store.py   # pgvector operations
│   │   │   └── document_search.py # search_knowledge + read + find_related tools
│   │   ├── ingestion/
│   │   │   ├── processor.py      # Dispatcher by file type
│   │   │   ├── pdf_processor.py  # PDF → text → chunks
│   │   │   ├── audio_processor.py # Áudio → transcrição → chunks
│   │   │   ├── video_processor.py # Vídeo → transcrição + keyframes
│   │   │   ├── image_processor.py # Imagem → caption + tags
│   │   │   ├── text_processor.py  # Texto → chunks
│   │   │   └── thumbnail.py      # Geração de thumbnails
│   │   ├── skills/               # 8 skill directories
│   │   │   ├── copy-social/SKILL.md + references/
│   │   │   ├── plano-de-midia/SKILL.md + references/
│   │   │   └── ... (6 mais)
│   │   └── eval/
│   │       ├── tracing.py        # MLflow GenAI decorator
│   │       ├── scorers.py        # Tone, format, routing, context
│   │       └── trajectory.py     # AgentEvals
│   └── workflows/
│       ├── router.py             # /api/workflows/* endpoints
│       ├── schemas.py            # Workflow Pydantic models
│       ├── models.py             # SQLAlchemy models
│       ├── compiler.py           # WorkflowDefinition → StateGraph
│       ├── executor.py           # Run workflow + SSE streaming
│       └── scheduler.py          # Cloud Scheduler integration
│
├── docs/
│   ├── ROADMAP.md
│   ├── adr/                      # Architecture Decision Records
│   ├── specs/                    # SDD specs (4 specs large)
│   ├── handoff/                  # Este documento
│   └── prompts/                  # Prompts para novas sessões Claude
│
├── .github/workflows/
│   ├── ci.yml                    # Lint + build (frontend + backend)
│   └── deploy-staging.yml        # Deploy Cloud Run staging
│
└── .claude/                      # Claude Code config
    ├── settings.json             # Hooks (auto-lint, protect files)
    ├── skills/                   # Claude Code skills
    │   ├── new-component/        # Scaffold componente
    │   ├── new-admin-page/       # Scaffold admin CRUD
    │   └── sdd-koro/             # Spec-Driven Development
    └── agents/
        └── code-reviewer.md      # Design system reviewer
```

### Fluxo de uma Request (Chat)

```
1. User digita mensagem no ChatInput
2. ChatInterface.handleSend() chamado
3. apiAvailable()? → sim: useToolStream.startStream() / não: startMockStream()
4. fetch POST /api/chat/stream (SSE)
5. main.py → middleware (request ID, logging) → chat/router.py
6. router → run_chat_stream() em graph/runner.py
7. runner → _get_llm() (Gemini Flash ou fallback)
8. runner → build agents (ContentCreator, Conversational)
9. runner → build_chat_graph() → StateGraph compilado
10. graph.astream(state) → top_supervisor → orchestrator → agent
11. agent → ReAct loop: LLM decide tools → executa → observa → repete
12. AIMessage com resposta → runner yield SSEEvent(type="text", content="...")
13. Frontend: useToolStream acumula chunks → setText() → MessageBubble renderiza
14. graph termina → SSEEvent(type="done") → isStreaming=false → mensagem salva
15. Se copy-social: auto-gera 2 variações via /api/chat/generate-text
```

---

## 4. Padrões & Conventions

### Como criar um novo Skill

```bash
# 1. Criar diretório no backend
mkdir -p api/chat/skills/meu-skill/references

# 2. Criar SKILL.md
cat > api/chat/skills/meu-skill/SKILL.md << 'EOF'
# Meu Skill
Overview do skill, quando usar, contexto.

## Tools
- generate_text: para geração de conteúdo
- search_knowledge: para busca na Biblioteca
EOF

# 3. Criar references (knowledge do skill)
cat > api/chat/skills/meu-skill/references/guidelines.md << 'EOF'
# Guidelines
Conhecimento específico que o agent precisa...
EOF

# 4. Adicionar no frontend (data/skills-admin.ts)
# Adicionar objeto SkillAdmin com id, name, slug, etc.

# 5. Verificar
npx tsc --noEmit  # Frontend OK
curl -X POST localhost:8080/api/chat/stream \
  -d '{"message":"teste","skill_slug":"meu-skill"}'
```

### Como criar uma nova página Admin

Usar Claude Code skill: `/new-admin-page NomeFeature slugfeature`

Ou manualmente:
1. `lib/{feature}-types.ts` — interfaces
2. `data/{feature}-admin.ts` — mock data
3. `contexts/{Feature}Context.tsx` — Provider + hook
4. `components/{feature}/` — Card, Editor, Tabs
5. `app/{feature}/` — page.tsx, new/page.tsx, [id]/page.tsx
6. Atualizar `Providers.tsx` e `Sidebar.tsx`

### Como adicionar uma Tool ao Agent

```python
# api/chat/tools/minha_tool.py
from langchain_core.tools import tool

@tool
def minha_tool(param1: str, param2: int = 10) -> str:
    """Descrição clara para o LLM decidir quando usar."""
    # implementação
    return resultado

# Registrar no agent (api/chat/agents/content_creator.py)
from chat.tools.minha_tool import minha_tool

class ContentCreatorAgent(BaseAgent):
    def get_tools(self):
        return [...existing..., minha_tool]
```

### Como adicionar um Endpoint

```python
# api/chat/router.py (ou criar novo router)
@router.post("/chat/meu-endpoint")
async def meu_endpoint(request: MeuRequest) -> MeuResponse:
    # ...
    return MeuResponse(...)

# Se novo router:
# api/meu_modulo/router.py
# Montar em api/main.py:
from meu_modulo.router import router as meu_router
app.include_router(meu_router, prefix=settings.API_PREFIX)
```

### Model Repo Pattern (SPEC-005)

Admin pages follow the "Model Repo" pattern: table view (default) + filter sidebar (left) + side drawer (right). Components:

| Page | Table | Sidebar | Drawer |
|------|-------|---------|--------|
| `/skills` | `SkillsTable` | `SkillsSidebar` | `SkillDrawer` |
| `/biblioteca` | `BibliotecaTable` | `BibliotecaSidebar` | `BibliotecaDrawer` |
| `/clientes` | Condensed `ClientCard`s | — | `ClientDrawer` |
| `/workflows` | `WorkflowTable` | — | `WorkflowDrawer` |

**Side Drawer pattern:** Click on a table row opens a drawer from the right (320-400px wide). Drawer shows entity details in read/edit mode. Closing drawer returns focus to table. For Clientes, clicking the card opens the drawer (no navigation to `/clientes/[id]`).

### Design System (tokens)

```css
/* Backgrounds */
var(--void)           /* Fundo principal */
var(--deep)           /* Surface cards/panels */
var(--nebula)         /* Surface hover/inputs */

/* Borders */
var(--border-subtle)  /* Borders sutis */
var(--twilight)       /* Borders hover */

/* Text */
var(--text-primary)   /* Texto principal */
var(--text-secondary) /* Texto body */
var(--text-muted)     /* Labels, hints */

/* Accent */
var(--sun)            /* #FFC801 — CTAs, active */

/* Skill types */
var(--criacao)        /* Amarelo */
var(--midia)          /* Azul */
var(--planejamento)   /* Verde */
```

```
Border radius: 12px (cards), 8px (inputs), 9999px (pills)
Transitions: 150ms ease (hover), 200ms ease (layout)
Icons: lucide-react, size 14, strokeWidth 1.5
Focus ring: boxShadow '0 0 0 2px rgba(255,200,1,0.15)'
```

---

## 5. Specs Técnicas (SDD)

| Spec | Escopo | Status | Artefatos |
|------|--------|--------|-----------|
| **SPEC-001** | Backend LangGraph + Chat real | Implementada | `docs/specs/large/sunohub-tools-integration/` |
| **SPEC-002** | Knowledge + Biblioteca v2 (pgvector, multimodal) | Implementada | `docs/specs/large/knowledge-biblioteca-v2/` |
| **SPEC-003** | Workflow Builder (compiler, executor, UI) | Implementada | `docs/specs/large/workflow-builder/` |
| **SPEC-004** | Workflow Chaining (sub-workflows) | Implementada | `docs/specs/medium/workflow-chaining.spec.md` |
| **SPEC-005** | UX Redesign (Model Repo pattern, 7 admin pages) | Implementada | `docs/specs/large/ux-redesign/spec.md` |
| **SPEC-006** | Chat Attachments (file upload no chat) | Spec only | `docs/specs/medium/chat-attachments.spec.md` |
| **SPEC-007** | Navigation Simplification (4→3 niveis) | Implementada | `docs/specs/medium/nav-simplification.spec.md` |

Cada spec Large tem 5 artefatos: `constitution.md`, `spec.md`, `design.md`, `plan.md`, `tasks.md`. Specs Medium tem um unico `spec.md`.

Para executar uma spec: ler `plan.md` (phases) e `tasks.md` (tasks atômicas por phase).

Log de specs: `docs/specs/_log/usage-log.md`

---

## 6. Fluxos Críticos

### 6.1 Chat Streaming

```
Frontend                    Backend                      LLM
   │                           │                          │
   ├── POST /api/chat/stream ──▶                          │
   │   {message, skill_slug,   │                          │
   │    context_documents}     │                          │
   │                           ├── build_chat_graph() ────│
   │                           ├── graph.astream(state) ──│
   │                           │                          │
   │                           │   top_supervisor ────────│
   │                           │   orchestrator ──────────│
   │                           │   load skill references  │
   │                           │   agent.invoke() ────────▶
   │                           │                          │
   │   ◀── event: text ────────┤   ◀── AIMessage ────────┤
   │       {content: "chunk"}  │                          │
   │   ◀── event: text ────────┤                          │
   │   ◀── event: done ────────┤                          │
   │       {conversation_id}   │                          │
```

**Fallback:** Se `NEXT_PUBLIC_API_URL` não definida → `useToolStream.startMockStream()` simula streaming com dados de `data/chat-responses.ts`.

### 6.2 Workflow Execution

```
WorkflowDefinition (JSON no PostgreSQL)
   │
   ▼
compiler.py → compile_workflow(definition)
   │
   ▼
LangGraph StateGraph
   ├── Node: step_1 (tool: generate_text)
   ├── Node: step_2 (llm: "analise estes dados")
   ├── Node: step_3 (hitl: interrupt para revisão)
   ├── Node: step_4 (action: send_slack)
   └── END
   │
   ▼
executor.py → execute_workflow(workflow_id)
   │
   ├── Cria WorkflowRun (status: running)
   ├── Para cada step: executa, salva StepLog
   ├── Se HITL: interrupt(), salva run (status: paused)
   ├── Resume: POST /api/workflows/{id}/runs/{run_id}/resume
   └── Completa: status = completed
```

### 6.3 Upload + Ingestion

```
User upload (multipart)
   │
   ▼
POST /api/knowledge/upload
   ├── Validate (size ≤ 50MB, type allowed)
   ├── Upload to GCS (gs://sunos-knowledge/docs/{id}/original.ext)
   ├── INSERT knowledge_documents (status: processing)
   ├── Return 201 {id, status: processing}
   │
   └── asyncio.create_task(process_document(id))
         │
         ├── Detect file_type
         ├── PDF → pdfplumber → text → chunk_by_section → embed
         ├── Audio → Gemini transcribe → chunk_by_segment → embed
         ├── Video → Gemini multimodal → transcribe + keyframes → embed
         ├── Image → Gemini Vision caption → embed
         ├── Text → chunk_by_paragraph → embed
         │
         ├── Generate thumbnail (Pillow)
         ├── INSERT knowledge_chunks (with embeddings)
         └── UPDATE status = ready
```

### 6.4 Auth Flow

```
Frontend                Firebase              Backend
   │                       │                     │
   ├── signInWithPopup() ──▶                     │
   │   (Google OAuth)      │                     │
   │   ◀── User + JWT ─────┤                     │
   │                       │                     │
   ├── getIdToken() ───────│                     │
   │   ◀── JWT ────────────┤                     │
   │                       │                     │
   ├── fetch(/api/...) ───────────────────────────▶
   │   Authorization: Bearer <JWT>               │
   │                       │                     ├── Verify JWT (firebase_admin)
   │                       │                     ├── Extract claims (role: admin)
   │                       │                     ├── Process request
   │   ◀── Response ─────────────────────────────┤
```

**Dev bypass:** `AuthGuard.tsx` pula auth quando `NODE_ENV === 'development'`.

---

## 7. Débitos & Riscos Técnicos

### Débitos

| Débito | Arquivo(s) | Impacto | Ação |
|--------|-----------|---------|------|
| Sem testes (pytest/jest) | — | Regressão silenciosa | Criar test suite |
| Conversas não persistem | `ChatInterface.tsx` | UX ruim | Implementar com PostgreSQL |
| `data/clients.ts` estático | `data/clients.ts` vs `ClientsContext` | Solar ≠ Admin | Unificar (ADR-002 permite) |
| ImageGen mock | `api/chat/tools/image_tools.py` | Sem imagem real | Configurar Vertex AI key |
| 3 vulnerabilidades GitHub | `package.json` deps | Segurança | `npm audit fix` |
| LLM fallback silencioso | `runner.py`, `chat_tools.py` | User não sabe que mudou modelo | Parcialmente resolvido: ModelSelector mostra modelo ativo, StreamingIndicator mostra nome do modelo |

### Riscos

| Risco | Onde | Mitigação existente |
|-------|------|---------------------|
| API key exposta | `.env` no repo | `.gitignore` cobre `.env` e `.env.local` |
| Rate limit LLM | Gemini 15 RPM free tier | `retry.py` com backoff |
| SQL injection | pgvector queries | Parameterized queries via SQLAlchemy |
| Upload malicioso | `/api/knowledge/upload` | Validação de tipo + size limit 50MB |
| CORS aberto em dev | `main.py` DEBUG=True | Só ativo em development |

---

## 8. CI/CD & Deploy

### GitHub Actions

**`.github/workflows/ci.yml`** — roda em todo push/PR:
```yaml
Frontend: npm ci → tsc --noEmit → npm run build
Backend:  uv sync → ruff check → ruff format --check
```

**`.github/workflows/deploy-staging.yml`** — roda em push para master quando `api/` muda:
```yaml
Auth WIF → Docker build → Push Artifact Registry → Deploy Cloud Run → Smoke test
```

### Deploy manual

```bash
# Backend (Cloud Run)
cd api
gcloud run deploy sunos-api \
  --source . \
  --region us-central1 \
  --port 8080

# Frontend (Cloud Run ou Vercel)
npm run build
# Deploy output de .next/
```

### Dockerfile (backend)

Multi-stage build com non-root user:
```
Stage 1 (builder): instala deps com uv
Stage 2 (runtime): copia deps + app, roda como appuser
ENTRYPOINT: python -m uvicorn main:app
```

---

## 9. Eval & Observabilidade

### MLflow Tracing

Decorator em `chat/eval/tracing.py` logga cada execução do graph:
- user_message, conversation_id
- routing_intent, agent_used, skill_loaded
- tools_called, latency_ms, tokens

### Scorers (avaliação de qualidade)

| Scorer | O que avalia | Arquivo |
|--------|-------------|---------|
| **Tone** | Output segue tom do skill? | `scorers.py` |
| **Format** | Output segue formato esperado? | `scorers.py` |
| **Routing** | Supervisor roteou corretamente? | `scorers.py` |
| **Context** | Agent usou docs da Biblioteca? | `scorers.py` |

### Eval Datasets

20 casos em `chat/eval/datasets/`:
- `routing_decisions.json` — 10 casos de routing
- `tone_evaluations.json` — 5 casos de tom
- `format_evaluations.json` — 5 casos de formato

### Como adicionar um scorer

```python
# api/chat/eval/scorers.py
def meu_scorer(output: str, expected: dict) -> float:
    """Retorna score 0-1."""
    # Lógica de avaliação
    return score
```

---

## 10. Onboarding Tasks

### Dia 1 — Familiarização

1. **Rode o projeto local** — siga a seção 2 deste doc. Navegue pelo sistema solar, abra um chat, envie mensagem, veja resposta do Gemini.

2. **Leia estes arquivos** (nesta ordem):
   - `CLAUDE.md` (15 min)
   - `api/CLAUDE.md` (10 min)
   - `docs/adr/ADR-002-single-engine-not-deep-agent-per-client.md` (5 min)

3. **Faça uma mudança pequena**: edite o system prompt de um skill em `api/chat/skills/copy-social/SKILL.md`. Envie mensagem no chat e veja a diferença na resposta.

### Dia 2 — Entendendo o fluxo

4. **Trace um request**: coloque um `print()` em `chat/graph/top_supervisor.py` e siga o fluxo até a resposta.

5. **Crie um mock skill**: crie `api/chat/skills/teste/SKILL.md` com um prompt simples. Teste via chat.

6. **Explore a Biblioteca**: uploade um PDF via `/biblioteca`, veja o processamento, e teste `search_knowledge` no chat.

### Dia 3 — Contribuindo

7. **Pegue um débito técnico** da tabela da seção 7 e faça um PR.

8. **Leia uma SPEC**: abra `docs/specs/large/workflow-builder/spec.md` e entenda como specs guiam implementação.

9. **Rode o eval**: execute os scorers contra os datasets em `chat/eval/datasets/` e interprete os resultados.
