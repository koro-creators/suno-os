# Prompt para Nova Sessão — Implementação Paralela SPEC-001/002/003

> **Execute com:** `claude --dangerously-skip-permissions` no diretório `/Users/heitormiranda/projects/koro/sunos/`

---

## Contexto

O **sunOS** é a plataforma interna de IA da Suno United Creators. Monorepo com frontend (Next.js 14) e backend (FastAPI + LangGraph em `api/`). Temos 3 specs prontas para implementação em paralelo usando git worktrees.

### O que já existe:
- **Frontend funcional**: sistema solar (4 níveis), admin de Skills/Biblioteca/Clientes, chat com IA real (Gemini), HITL feedback, social preview para Copy Social
- **Backend funcional**: FastAPI + LangGraph com TopSupervisor → Orchestrator → ContentCreator agent, SSE streaming, 8 skill dirs, eval framework
- **Auth**: Firebase Google Auth + RBAC (admin/creator)
- **CI/CD**: GitHub Actions (ci.yml + deploy-staging.yml)
- **ADRs**: ADR-001 (Workflow Builder aceito), ADR-002 (engine único com context injection)

### Repo: `koro-creators/suno-os` — branch: `master`

---

## O que implementar: 3 SPECs em paralelo com git worktrees

### SPEC-001 — Finalização (restante)
**Spec:** `docs/specs/large/sunohub-tools-integration/tasks.md`
**Branch:** `spec-001-finish`
**Escopo:** Tasks pendentes:
- E4: Frontend batch endpoints (TextGen, ImageGen panels no chat)
- E5-E6: Testes de integração com API keys reais (se disponíveis)
**Estimativa:** Pequeno — ~3-4 arquivos

### SPEC-002 — Knowledge + Biblioteca v2
**Spec:** `docs/specs/large/knowledge-biblioteca-v2/`
**Branch:** `spec-002-knowledge`
**Escopo:** 5 phases, 37 tasks:
- Phase A: pgvector extension + SQLAlchemy models + embeddings wrapper + vector_store + search_knowledge tool
- Phase B: Upload endpoint + GCS + ingestion pipeline (texto/PDF)
- Phase C: Multimodal processing (áudio, vídeo, imagem via Gemini)
- Phase D: Frontend Biblioteca v2 (thumbnails, ícones por tipo, filtro, upload UI)
- Phase E: Agentic RAG (read_full_document, find_related)
**Estimativa:** Grande — ~16 novos + ~11 modificados

### SPEC-003 — Workflow Builder
**Spec:** `docs/specs/large/workflow-builder/`
**Branch:** `spec-003-workflows`
**Escopo:** 6 phases, 42 tasks:
- Phase A: SQLAlchemy models + Pydantic schemas + CRUD router
- Phase B: Compiler (WorkflowDefinition JSON → LangGraph StateGraph)
- Phase C: Executor async + HITL interrupt/resume + step logging
- Phase D: Cloud Scheduler integration
- Phase E: Frontend (/workflows catalog, builder UI, step editor, run history)
- Phase F: 4 templates pré-configurados + eval + polish
**Estimativa:** Grande — ~25 novos + ~7 modificados

---

## Como trabalhar

### Estratégia: Git Worktrees para isolamento

```bash
# Criar worktrees para cada spec
git worktree add ../sunos-spec-001 -b spec-001-finish
git worktree add ../sunos-spec-002 -b spec-002-knowledge
git worktree add ../sunos-spec-003 -b spec-003-workflows
```

### Executar com Agent Teams

Despachar 3 agents em paralelo, um por worktree:

**Agent 1 (SPEC-001):** Trabalha em `../sunos-spec-001/`
- Ler tasks.md para tasks pendentes (E4-E6)
- Implementar frontend batch endpoints
- Commitar a cada task

**Agent 2 (SPEC-002):** Trabalha em `../sunos-spec-002/`
- Ler todos os 5 artefatos da spec
- Implementar Phase A primeiro (foundation)
- Depois B, C, D, E em sequência
- Commitar a cada phase

**Agent 3 (SPEC-003):** Trabalha em `../sunos-spec-003/`
- Ler todos os 5 artefatos da spec
- Implementar Phase A primeiro (models + CRUD)
- Depois B (compiler), C (executor), D (scheduler)
- E (frontend) pode rodar em paralelo com D
- Commitar a cada phase

### Merge sequencial após completar

```bash
git checkout master
git merge spec-001-finish   # Menor, merge primeiro
git merge spec-002-knowledge # Resolve conflitos em api/main.py
git merge spec-003-workflows # Resolve conflitos em api/main.py + Sidebar
```

### Arquivo compartilhado: `api/main.py`

Todos os 3 adicionam routers. Resolver no merge:
```python
# SPEC-002 adiciona:
from chat.knowledge.router import router as knowledge_router
app.include_router(knowledge_router, prefix=settings.API_PREFIX)

# SPEC-003 adiciona:
from workflows.router import router as workflows_router
app.include_router(workflows_router, prefix=settings.API_PREFIX)
```

### Outro arquivo compartilhado: `components/layout/Sidebar.tsx`

SPEC-003 adiciona item "Workflows" com ícone `Workflow` ou `Zap`.

---

## Verificação após merge

1. `npx tsc --noEmit` — zero errors
2. `npm run build` — sucesso
3. Backend: `cd api && uv run uvicorn main:app --port 8080` — health check OK
4. Frontend: `npx next dev -p 3003` — todas as rotas funcionam
5. Chat: enviar mensagem → resposta real via Gemini
6. Biblioteca: upload de arquivo (se SPEC-002 implementada)
7. Workflows: criar workflow (se SPEC-003 implementada)

---

## Stack Reference

- Frontend: Next.js 14 (App Router), TypeScript, Tailwind + CSS variables, Lucide icons, React Context
- Backend: FastAPI, LangGraph StateGraph, LangChain (Gemini Flash default), PostgreSQL, MLflow, Cloud Run
- Auth: Firebase JWT
- Porta frontend: 3003 | Porta backend: 8080
- Design system: inline styles, CSS variables (--void, --deep, --sun, --text-primary, etc.)
- Padrão Koro: mesmo do meridian-api (`/Users/heitormiranda/projects/koro/meridian-api/`)

## Docs importantes
- `CLAUDE.md` — convenções do projeto
- `api/CLAUDE.md` — convenções do backend
- `docs/ROADMAP.md` — roadmap atualizado
- `docs/adr/` — ADR-001 (Workflow Builder aceito), ADR-002 (engine único)
- `docs/specs/_log/usage-log.md` — log SDD
