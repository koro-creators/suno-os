---
spec-id: SPEC-001
slug: sunohub-tools-integration
artefato: plan
atualizada: 2026-03-26
versao: 2.0
---

# Plan — sunohub Tools Integration (v2)

## Sequência de Implementação

```
Phase A: Backend Foundation (sunos-api repo + FastAPI + LangGraph skeleton)
    ↓
Phase B: Skills + Tools (skill dirs + tool implementations)
    ↓
Phase C: Chat Agent (LangGraph graph completo + SSE streaming)
    ↓
Phase D: Frontend Integration (sunOS consome API real)
    ↓
Phase E: TextGen + ImageGen (tools adicionais)
    ↓
Phase F: Eval + Polish (MLflow, scorers, error handling)
```

## Phase A: Backend Foundation

**Objetivo**: Criar repo sunos-api com FastAPI + LangGraph skeleton.

1. Criar repo `koro-creators/sunos-api`
2. Setup: `uv init`, FastAPI, dependências LangGraph
3. Estrutura de diretórios (`chat/`, `graph/`, `agents/`, `tools/`, `skills/`, `eval/`)
4. `BaseAgent` ABC (copiar padrão Meridian)
5. `SunosChatState` TypedDict
6. `SkillLoader` — carrega SKILL.md + references/
7. Health check endpoint
8. Docker + Cloud Run config

**Verificação**: `uvicorn main:app --port 8080` + `curl localhost:8080/health`

## Phase B: Skills + Tools

**Objetivo**: Popular skills dirs e implementar tools core.

1. Criar 8 skill dirs com SKILL.md + references/ (copy-social, plano-de-midia, etc.)
2. `tools/chat_tools.py` — Gemini Flash streaming via langchain-google-genai
3. `tools/text_tools.py` — geração de texto com tipo/tom/tamanho
4. `tools/prompt_tools.py` — aprimoramento de prompts
5. `tools/search_tools.py` — web search (Tavily ou SerpAPI)

**Verificação**: Tools unitárias funcionam isoladamente

## Phase C: Chat Agent (LangGraph)

**Objetivo**: Graph completo com routing + agents + SSE.

1. `graph/top_supervisor.py` — routing por intenção (criacao/midia/planejamento/conversation)
2. `graph/orchestrator.py` — orquestra agent + skill loading
3. `agents/content_creator.py` — ReAct agent com chat + text tools
4. `agents/conversational.py` — perguntas gerais
5. `graph/builder.py` — monta StateGraph
6. `graph/runner.py` — executa graph com streaming
7. `chat/router.py` — endpoint POST /api/chat/stream com SSE
8. `chat/schemas.py` — Pydantic models
9. `chat/conversation_store.py` — PostgreSQL persistence

**Verificação**: `curl -X POST localhost:8080/api/chat/stream` retorna SSE com texto real

## Phase D: Frontend Integration

**Objetivo**: sunOS consome API real com fallback mock.

1. Criar `lib/api.ts` — cliente HTTP
2. Criar/refactor `hooks/useToolStream.ts` — consome SSE + fallback
3. Atualizar `ChatInterface.tsx` — usa API quando disponível
4. Criar `.env.example` com `NEXT_PUBLIC_API_URL`
5. Testar com backend local (8080) + sem backend (fallback mock)

**Verificação**: Chat funciona com backend real E com mock

## Phase E: TextGen + ImageGen

**Objetivo**: Endpoints batch para texto e imagem.

1. `tools/image_tools.py` — Vertex AI Imagen 4
2. `agents/visual_creator.py` — ReAct agent para imagens
3. `chat/router.py` — endpoints generate-text, generate-image, enhance-prompt
4. Frontend: `TextGenPanel` e `ImageGenPanel` no chat (opcional)

**Verificação**: Gera texto com variações, gera imagem com Imagen 4

## Phase F: Eval + Polish

**Objetivo**: Observabilidade e qualidade.

1. `eval/tracing.py` — MLflow GenAI decorator no graph runner
2. `eval/scorers.py` — tone, format, routing, context scorers
3. `eval/trajectory.py` — AgentEvals para fluxo correto
4. `eval/datasets/` — 5-10 cases por scorer
5. Error handling robusto (timeout, rate limit, API errors)
6. CI/CD: GitHub Actions (lint, test, deploy Cloud Run)
7. Documentação: README, CLAUDE.md do backend

**Verificação**: Traces no MLflow, eval scores calculados, deploy staging funciona

## Changelog

| Versão | Data | Mudança |
|--------|------|---------|
| 2.0 | 2026-03-26 | Pivot para sunos-api repo com FastAPI + LangGraph |
| 1.0 | 2026-03-26 | Tudo no frontend com Supabase |
