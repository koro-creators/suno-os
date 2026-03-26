---
spec-id: SPEC-001
slug: sunohub-tools-integration
artefato: tasks
atualizada: 2026-03-26
versao: 2.0
---

# Tasks — sunohub Tools Integration (v2)

## Phase A: Backend Foundation

- [ ] **A1**: Criar repo `koro-creators/sunos-api` no GitHub
- [ ] **A2**: Setup com `uv init` + dependências (fastapi, uvicorn, langgraph, langchain-core, langchain-google-genai, mlflow, sqlalchemy, asyncpg)
- [ ] **A3**: Criar estrutura de diretórios (chat/, graph/, agents/, tools/, skills/, eval/, models/)
- [ ] **A4**: Implementar `chat/agents/base.py` — BaseAgent ABC (padrão Meridian)
- [ ] **A5**: Implementar `chat/graph/state.py` — SunosChatState TypedDict
- [ ] **A6**: Implementar `chat/skills/__init__.py` — SkillLoader (carrega SKILL.md + references/)
- [ ] **A7**: Implementar health check endpoint + `main.py`
- [ ] **A8**: Criar Dockerfile + `.dockerignore` + `cloudbuild.yaml`
- [ ] **A9**: Criar `.env.example` + `CLAUDE.md` do backend
- [ ] **A10**: Verificar `uvicorn main:app --port 8080` funciona

## Phase B: Skills + Tools

- [ ] **B1**: Criar 8 skill dirs com SKILL.md + references/ (conteúdo do sunOS adaptado)
- [ ] **B2**: Implementar `chat/tools/chat_tools.py` — Gemini Flash streaming via langchain
- [ ] **B3**: Implementar `chat/tools/text_tools.py` — geração por content_type, tone, length
- [ ] **B4**: Implementar `chat/tools/prompt_tools.py` — enhance prompt por target_tool
- [ ] **B5**: Implementar `chat/tools/search_tools.py` — web search
- [ ] **B6**: Testes unitários para cada tool
- [ ] **B7**: Verificar tools funcionam isoladamente (pytest)

## Phase C: Chat Agent (LangGraph)

- [ ] **C1**: Implementar `chat/graph/top_supervisor.py` — routing por intenção
- [ ] **C2**: Implementar `chat/graph/orchestrator.py` — orquestra agent + skill loading
- [ ] **C3**: Implementar `chat/agents/content_creator.py` — ReAct com chat + text tools
- [ ] **C4**: Implementar `chat/agents/conversational.py` — perguntas gerais
- [ ] **C5**: Implementar `chat/graph/builder.py` — monta StateGraph completo
- [ ] **C6**: Implementar `chat/graph/runner.py` — executa graph com streaming async
- [ ] **C7**: Implementar `chat/router.py` — POST /api/chat/stream com SSE
- [ ] **C8**: Implementar `chat/schemas.py` — Pydantic models (request/response)
- [ ] **C9**: Implementar `chat/conversation_store.py` — PostgreSQL persistence
- [ ] **C10**: Implementar `models/conversation.py` — SQLAlchemy model
- [ ] **C11**: Teste de integração: request → graph → SSE response com Gemini real
- [ ] **C12**: Verificar streaming funciona end-to-end

## Phase D: Frontend Integration

- [ ] **D1**: Criar `lib/api.ts` — HTTP client com `apiAvailable()`, helpers fetch
- [ ] **D2**: Criar `hooks/useToolStream.ts` — consome SSE + fallback mock
- [ ] **D3**: Atualizar `ChatInterface.tsx` — monta input (systemPrompt + context), usa useToolStream
- [ ] **D4**: Criar `.env.example` — `NEXT_PUBLIC_API_URL`
- [ ] **D5**: Testar com backend local (port 8080) — chat real funciona
- [ ] **D6**: Testar sem backend — fallback mock funciona
- [ ] **D7**: Verificar HITL feedback funciona com respostas reais
- [ ] **D8**: `npx tsc --noEmit` + `npm run build`

## Phase E: TextGen + ImageGen

- [ ] **E1**: Implementar `chat/tools/image_tools.py` — Vertex AI Imagen 4
- [ ] **E2**: Implementar `chat/agents/visual_creator.py` — ReAct agent para imagens
- [ ] **E3**: Endpoints generate-text, generate-image, enhance-prompt em `chat/router.py`
- [ ] **E4**: Frontend: integrar endpoints batch (opcional — pode usar via chat)
- [ ] **E5**: Teste de integração: gera imagem via Imagen 4
- [ ] **E6**: Teste de integração: gera texto com variações

## Phase F: Eval + Polish

- [ ] **F1**: Implementar `chat/eval/tracing.py` — MLflow GenAI decorator
- [ ] **F2**: Implementar `chat/eval/scorers.py` — tone, format, routing, context scorers
- [ ] **F3**: Implementar `chat/eval/trajectory.py` — AgentEvals para fluxo
- [ ] **F4**: Criar `chat/eval/datasets/` — 5-10 cases por scorer
- [ ] **F5**: Error handling em todos os endpoints (timeout 60s, rate limit backoff, API errors)
- [ ] **F6**: CI/CD: GitHub Actions (lint, pytest, deploy staging)
- [ ] **F7**: README.md + CLAUDE.md do backend
- [ ] **F8**: Deploy staging em Cloud Run
- [ ] **F9**: Smoke test staging

<!-- REVIEW -->
**Checkpoint**: As tarefas são implementáveis e testáveis isoladamente?

## Estimativa de Escopo

| Phase | Repo | Arquivos novos | Complexidade |
|-------|------|---------------|-------------|
| A | sunos-api | ~10 | Média (setup) |
| B | sunos-api | ~12 (8 skills + 4 tools) | Média |
| C | sunos-api | ~10 | Alta (LangGraph) |
| D | suno-os | ~3 | Baixa (frontend) |
| E | sunos-api | ~3 | Média |
| F | sunos-api | ~8 | Média |
| **Total** | | **~46** | — |

## Dependências entre Phases

```
A (foundation) → B (skills/tools) → C (graph) → D (frontend)
                                  → E (textgen/imagegen)
                                       → F (eval/polish)
```

D e E podem rodar em paralelo após C.

## Changelog

| Versão | Data | Mudança |
|--------|------|---------|
| 2.0 | 2026-03-26 | Pivot: novo repo sunos-api, tasks reorganizadas por backend/frontend |
| 1.0 | 2026-03-26 | Tudo no frontend, 28 tasks |
