---
spec-id: SPEC-003
slug: workflow-builder
artefato: plan
atualizada: 2026-04-30
versao: 1.0
status: substituido
substituido_por: SPEC-005 (docs/specs/large/workflow-builder-canvas/)
---

> ⚠️ **Substituída em 2026-04-30 por SPEC-005 — `docs/specs/large/workflow-builder-canvas/plan.md`.**

# Plan — Workflow Builder (v1)

## Sequencia de Implementacao

```
Phase A: Backend Foundation (models, schemas, router CRUD, migration)
    ↓
Phase B: Workflow Compiler (WorkflowDefinition → StateGraph, tool registry)
    ↓
Phase C: Executor + HITL (run workflow, interrupt/resume, step logging, notificacoes)
    ↓
Phase D: Cloud Scheduler Integration (cron jobs, service account, trigger endpoint)
    ↓ (E pode comecar em paralelo apos A)
Phase E: Frontend (catalogo, builder UI, step editor, run history, sidebar)
    ↓
Phase F: Templates + Polish (4 templates, eval integration, error handling, docs)
```

## Phase A: Backend Foundation

**Objetivo**: Criar modulo `workflows/` com modelos SQLAlchemy, schemas Pydantic e endpoints CRUD basicos.

1. Criar diretorio `api/workflows/` com `__init__.py`
2. Implementar `workflows/models.py` — SQLAlchemy models (`Workflow`, `WorkflowRun`, `StepLog`)
3. Implementar `workflows/schemas.py` — Pydantic models (`WorkflowDefinition`, `WorkflowStep`, `CronSchedule`, request/response schemas)
4. Implementar `workflows/router.py` — endpoints CRUD (GET list, POST create, GET detail, PUT update, DELETE)
5. Criar migracao Alembic para tabelas `workflows`, `workflow_runs`, `step_logs`
6. Registrar router em `api/main.py` com prefix `/api/workflows`
7. Testes unitarios para schemas (validacao de WorkflowDefinition)
8. Verificar `uvicorn main:app` starta sem erro + `curl /api/workflows` retorna lista vazia

**Verificacao**: Endpoints CRUD funcionam via Swagger (`/docs`). Modelos persistem no PostgreSQL.

## Phase B: Workflow Compiler

**Objetivo**: Compilar `WorkflowDefinition` JSON em `StateGraph` do LangGraph em runtime.

1. Implementar `WorkflowState` TypedDict em `workflows/compiler.py` (ou separar em `state.py`)
2. Implementar `WorkflowCompiler.compile()` — itera steps e cria nodes + edges
3. Implementar `_make_step_node()` — executor generico que resolve step.type (tool, llm, condition, action)
4. Implementar `_resolve_templates()` — substitui `{{steps.X.output}}` por valores reais do state
5. Implementar `TOOL_REGISTRY` — mapeia `tool_name` string para tools existentes em `chat/tools/`
6. Testes unitarios: compila definicao simples (2-3 steps lineares) e verifica graph tem nodes corretos

**Verificacao**: `compiler.compile(sample_definition)` retorna `CompiledStateGraph` valido. Nodes executam em sequencia.

## Phase C: Executor + HITL

**Objetivo**: Executar workflows compilados, com suporte a HITL interrupt/resume, logging de steps e notificacoes.

1. Implementar `workflows/executor.py` — `WorkflowExecutor.run()` que compila e executa o graph
2. Implementar execucao async com SSE streaming (emite eventos por step: started, completed, failed)
3. Implementar step logging — salva `StepLog` no banco para cada step executado
4. Implementar HITL: step type "hitl" chama `interrupt()` do LangGraph
5. Implementar resume endpoint: `POST /api/workflows/{id}/runs/{run_id}/resume` carrega checkpoint e faz `Command(resume=input)`
6. Implementar status tracking: atualiza `WorkflowRun.status` (running → paused/completed/failed)
7. Implementar notificacao de erro: se step falha e `on_error_notify` esta configurado, envia Slack
8. Testes: executar workflow com 3 steps, verificar step_logs criados e status final "completed"

**Verificacao**: `POST /api/workflows/{id}/run` executa workflow. Steps logados no banco. HITL pausa e resume funciona. Erro marca run como "failed".

## Phase D: Cloud Scheduler Integration

**Objetivo**: Workflows com schedule executam automaticamente via Cloud Scheduler.

1. Implementar `workflows/scheduler.py` — `WorkflowScheduler` com `create_or_update()` e `delete()`
2. Implementar endpoint `POST /api/workflows/{id}/schedule` — cria/atualiza job no Cloud Scheduler
3. Configurar service account com permissao de invocar Cloud Run (`roles/run.invoker`)
4. Implementar enable/disable schedule: `PUT /api/workflows/{id}` com `schedule_enabled` toggle

**Verificacao**: Criar workflow com `schedule: "0 9 * * 1"`. Job aparece no Cloud Scheduler. Execucao automatica gera `WorkflowRun` no banco.

## Phase E: Frontend

**Objetivo**: Interface completa para criar, editar, executar e monitorar workflows.

1. Criar `lib/workflow-types.ts` — types TypeScript (Workflow, WorkflowStep, WorkflowRun, StepLog)
2. Criar `contexts/WorkflowsContext.tsx` — provider com estado + funcoes CRUD (fetch, create, update, delete)
3. Criar `components/workflows/WorkflowCard.tsx` — card com nome, numero de steps, schedule badge, ultimo run status
4. Criar `app/workflows/page.tsx` — catalogo (grid de WorkflowCards + botao "Novo Workflow")
5. Criar `components/workflows/WorkflowStepEditor.tsx` — painel/modal para configurar um step (selecionar tipo, tool, prompt, config)
6. Criar `components/workflows/WorkflowBuilder.tsx` — lista vertical de steps com add/remove/reorder + config geral (nome, descricao, schedule)
7. Criar `app/workflows/new/page.tsx` — pagina do builder para novo workflow
8. Criar `app/workflows/[workflowId]/page.tsx` — pagina de edicao (carrega workflow existente no builder)
9. Criar `components/workflows/WorkflowRunTimeline.tsx` — timeline de execucoes com status por step, duracoes, logs expandiveis
10. Criar `app/workflows/[workflowId]/runs/page.tsx` — pagina de historico de execucoes
11. Atualizar `components/layout/Sidebar.tsx` — adicionar item "Workflows" com icone e href `/workflows`
12. Registrar provider em `components/layout/Providers.tsx` (se necessario)

**Verificacao**: Navegar `/workflows` mostra catalogo. Criar workflow via builder salva no backend. Historico de runs mostra execucoes. `npx tsc --noEmit` + `npm run build` sem erros.

## Phase F: Templates + Polish

**Objetivo**: Templates pre-construidos, integracao com eval, error handling robusto e documentacao.

1. Criar template "Relatorio Mensal" — steps: query_data → generate_text (analise) → send_slack
2. Criar template "Briefing de Campanha" — steps: generate_text (briefing) → hitl (aprovacao) → generate_image → send_email
3. Criar template "Monitoramento de Marca" — steps: fetch_url (social) → analyze_data → condition (alerta?) → send_slack
4. Criar template "Plano de Midia" — steps: search_knowledge → generate_text (plano) → hitl (revisao) → export_ppt
5. Integrar `components/workflows/WorkflowTemplates.tsx` — grid de templates com "Usar Template" que pre-popula o builder
6. Integrar MLflow tracing no executor (decorator `@mlflow_trace` em cada execucao)
7. Error handling: timeout por step, retry com backoff, rate limiting por workflow
8. Endpoint `GET /api/workflows/templates` retorna templates disponiveis

**Verificacao**: Templates aparecem no catalogo. Usar template cria workflow pre-configurado. Traces aparecem no MLflow. Workflows com erro notificam e logam corretamente.

## Changelog

| Versao | Data | Mudanca |
|--------|------|---------|
| 1.0 | 2026-04-13 | Plano inicial. 6 phases, backend-first com frontend em paralelo apos A. |
