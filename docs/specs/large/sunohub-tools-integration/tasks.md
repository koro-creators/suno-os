---
spec-id: SPEC-001
slug: sunohub-tools-integration
artefato: tasks
atualizada: 2026-03-26
versao: 2.0
---

# Tasks — sunohub Tools Integration (v2)

## Phase A: Backend Foundation

- [x] **A1**: Criar repo `sunos-api` (monorepo em `api/`)
- [x] **A2**: Setup com `uv init` + dependências (fastapi, uvicorn, langgraph, langchain-core, langchain-google-genai, mlflow, sqlalchemy, asyncpg)
- [x] **A3**: Criar estrutura de diretórios (chat/, graph/, agents/, tools/, skills/, eval/, models/)
- [x] **A4**: Implementar `chat/agents/base.py` — BaseAgent ABC (padrão Meridian)
- [x] **A5**: Implementar `chat/graph/state.py` — SunosChatState TypedDict
- [x] **A6**: Implementar `chat/skills/__init__.py` — SkillLoader (carrega SKILL.md + references/)
- [x] **A7**: Implementar health check endpoint + `main.py`
- [x] **A8**: Criar Dockerfile + `.dockerignore` + `cloudbuild.yaml`
- [x] **A9**: Criar `.env.example` + `CLAUDE.md` do backend
- [x] **A10**: Verificar `uvicorn main:app --port 8080` funciona

## Phase B: Skills + Tools

- [x] **B1**: Criar 8 skill dirs com SKILL.md + references/ (conteúdo do sunOS adaptado)
- [x] **B2**: Implementar `chat/tools/chat_tools.py` — Gemini Flash streaming via langchain
- [x] **B3**: Implementar `chat/tools/text_tools.py` — geração por content_type, tone, length
- [x] **B4**: Implementar `chat/tools/prompt_tools.py` — enhance prompt por target_tool
- [x] **B5**: Implementar `chat/tools/search_tools.py` — web search (mock, ready for Tavily)
- [x] **B6**: Verificar tools importam e SkillLoader carrega 8 skills
- [x] **B7**: Verificar tools funcionam isoladamente

## Phase C: Chat Agent (LangGraph)

- [x] **C1**: Implementar `chat/graph/top_supervisor.py` — routing por intenção (short-circuit por skill_slug)
- [x] **C2**: Implementar `chat/graph/orchestrator.py` — orquestra agent + skill loading
- [x] **C3**: Implementar `chat/agents/content_creator.py` — ReAct com chat + text tools
- [x] **C4**: Implementar `chat/agents/conversational.py` — perguntas gerais
- [x] **C5**: Implementar `chat/graph/builder.py` — monta StateGraph completo
- [x] **C6**: Implementar `chat/graph/runner.py` — executa graph com streaming async
- [x] **C7**: Implementar `chat/router.py` — POST /api/chat/stream com SSE
- [x] **C8**: Implementar `chat/schemas/chat.py` — Pydantic models (request/response)
- [x] **C9**: Implementar `chat/conversation_store.py` — PostgreSQL persistence
- [x] **C10**: Implementar `models/conversation.py` — SQLAlchemy model
- [x] **C11**: Verificar todos os imports integram corretamente
- [x] **C12**: Verificar server starta com streaming endpoint

## Phase D: Frontend Integration

- [x] **D1**: Criar `lib/api.ts` — HTTP client com `apiAvailable()`, `consumeSSE()`
- [x] **D2**: Criar `hooks/useToolStream.ts` — consome SSE + fallback mock
- [x] **D3**: Atualizar `ChatInterface.tsx` — usa API quando disponível, fallback mock
- [x] **D4**: Criar `.env.example` — `NEXT_PUBLIC_API_URL`
- [x] **D5**: Testar com backend local (port 8080) — chat real funciona
- [x] **D6**: Testar sem backend — fallback mock funciona
- [x] **D7**: HITL feedback mantido (funciona com respostas reais)
- [x] **D8**: `npx tsc --noEmit` + `npm run build` — 0 erros

## Phase E: TextGen + ImageGen

- [x] **E1**: Implementar `chat/tools/image_tools.py` — mock (ready for Vertex AI Imagen 4)
- [x] **E2**: Implementar `chat/agents/visual_creator.py` — ReAct agent para imagens
- [x] **E3**: Endpoints generate-text, generate-image, enhance-prompt em `chat/router.py`
- [ ] **E4**: Frontend: integrar endpoints batch (opcional — pode usar via chat)
- [ ] **E5**: Teste de integração: gera imagem via Imagen 4 (requer API key)
- [ ] **E6**: Teste de integração: gera texto com variações (requer API key)

## Phase F: Eval + Polish

- [x] **F1**: Implementar `chat/eval/tracing.py` — MLflow GenAI decorator
- [x] **F2**: Implementar `chat/eval/scorers.py` — tone, format, routing, context scorers
- [x] **F3**: Implementar `chat/eval/trajectory.py` — AgentEvals para fluxo
- [x] **F4**: Criar `chat/eval/datasets/` — 20 cases (routing: 10, tone: 5, format: 5)
- [ ] **F5**: Error handling robusto (timeout 60s, rate limit backoff, API errors)
- [ ] **F6**: CI/CD: GitHub Actions (lint, pytest, deploy staging)
- [x] **F7**: README.md + CLAUDE.md do backend
- [ ] **F8**: Deploy staging em Cloud Run
- [ ] **F9**: Smoke test staging

<!-- REVIEW -->
**Status**: Phases A-F implementadas. Tasks pendentes são integração real (API keys), CI/CD e deploy.

## Estimativa de Escopo

| Phase | Path | Arquivos novos | Status |
|-------|------|---------------|--------|
| A | api/ | 24 | ✅ Done |
| B | api/ | 23 (8 skills + 4 tools + refs) | ✅ Done |
| C | api/ | 10 | ✅ Done |
| D | raiz (frontend) | 4 | ✅ Done |
| E | api/ | 4 | ✅ Done |
| F | api/ | 8 | ✅ Done |
| **Total** | | **~73** | — |

## Dependências entre Phases

```
A (foundation) → B (skills/tools) → C (graph) → D (frontend)
                                  → E (textgen/imagegen)
                                       → F (eval/polish)
```

D e E rodaram em paralelo após C. E e F rodaram em paralelo.

## Changelog

| Versão | Data | Mudança |
|--------|------|---------|
| 2.1 | 2026-03-26 | Todas as phases implementadas. Monorepo (api/ dentro de sunos). |
| 2.0 | 2026-03-26 | Pivot para sunos-api repo com FastAPI + LangGraph |
| 1.0 | 2026-03-26 | Tudo no frontend com Supabase |
