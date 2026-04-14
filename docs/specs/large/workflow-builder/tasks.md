---
spec-id: SPEC-003
slug: workflow-builder
artefato: tasks
atualizada: 2026-04-13
versao: 1.0
---

# Tasks — Workflow Builder (v1)

## Phase A: Backend Foundation

- [ ] **A1**: Criar diretorio `api/workflows/` com `__init__.py`
- [ ] **A2**: Implementar `workflows/models.py` — model `Workflow` (id, name, description, created_by, definition JSONB, schedule fields, client_scope, default_model, max_execution_time, on_error_notify, is_template, timestamps)
- [ ] **A3**: Implementar `workflows/models.py` — model `WorkflowRun` (id, workflow_id FK, status, trigger, started_at, completed_at, error, steps_output JSONB, checkpoint_data JSONB)
- [ ] **A4**: Implementar `workflows/models.py` — model `StepLog` (id, run_id FK, step_id, step_name, status, input JSONB, output JSONB, error, duration_ms, timestamps)
- [ ] **A5**: Implementar `workflows/schemas.py` — Pydantic models: `WorkflowStep`, `CronSchedule`, `WorkflowDefinition` (match ADR-001 schema)
- [ ] **A6**: Implementar `workflows/schemas.py` — request/response schemas: `WorkflowCreate`, `WorkflowUpdate`, `WorkflowResponse`, `WorkflowListResponse`
- [ ] **A7**: Implementar `workflows/router.py` — `GET /` listar workflows, `POST /` criar workflow
- [ ] **A8**: Implementar `workflows/router.py` — `GET /{id}` detalhe, `PUT /{id}` atualizar, `DELETE /{id}` remover
- [ ] **A9**: Criar migracao Alembic para tabelas `workflows`, `workflow_runs`, `step_logs` com indices
- [ ] **A10**: Registrar router em `api/main.py` — `app.include_router(workflow_router, prefix="/api/workflows")`
- [ ] **A11**: Verificar `uvicorn main:app` starta sem erro + endpoints CRUD respondem via Swagger

## Phase B: Workflow Compiler

- [ ] **B1**: Implementar `WorkflowState` TypedDict — workflow_id, run_id, steps_output, current_step, status, messages, human_input, started_at, model, error
- [ ] **B2**: Implementar `TOOL_REGISTRY` — dict mapeando tool_name string para tools de `chat/tools/` (generate_text, generate_image, search_knowledge, text_generation)
- [ ] **B3**: Implementar `WorkflowCompiler.compile()` — itera `definition.steps`, cria node por step, adiciona edges (linear + condicional)
- [ ] **B4**: Implementar `_make_step_node()` — executor generico que resolve step.type (tool → tool_registry, llm → LLM call, action → action tool, hitl → interrupt)
- [ ] **B5**: Implementar `_resolve_templates()` — substitui `{{steps.X.output}}` por valores reais de `state.steps_output`
- [ ] **B6**: Implementar `_make_condition()` — avalia `step.condition` dict para branching condicional entre steps
- [ ] **B7**: Testes unitarios: compilar definicao com 3 steps lineares, verificar graph.nodes e graph.edges corretos
- [ ] **B8**: Testes unitarios: compilar definicao com step condicional, verificar conditional edges

## Phase C: Executor + HITL

- [ ] **C1**: Implementar `WorkflowExecutor.run()` — compila definicao via `WorkflowCompiler`, executa graph, retorna resultado final
- [ ] **C2**: Implementar execucao async com SSE — `WorkflowExecutor.run_stream()` emite `SSEEvent` por step (step_started, step_completed, step_failed, workflow_completed)
- [ ] **C3**: Implementar step logging — salva `StepLog` no PostgreSQL para cada step (input, output, status, duration_ms)
- [ ] **C4**: Implementar `WorkflowRun` lifecycle — cria run com status "pending", atualiza para "running" ao iniciar, "completed"/"failed" ao finalizar
- [ ] **C5**: Implementar HITL interrupt — step type "hitl" chama `interrupt()` do LangGraph, salva checkpoint, marca run como "paused"
- [ ] **C6**: Implementar resume endpoint — `POST /api/workflows/{id}/runs/{run_id}/resume` carrega checkpoint, `Command(resume=input)`, continua execucao
- [ ] **C7**: Implementar endpoint `POST /api/workflows/{id}/run` — cria WorkflowRun, chama executor (background task ou inline)
- [ ] **C8**: Implementar endpoint `GET /api/workflows/{id}/runs` — listar runs de um workflow (paginado, ordenado por data)
- [ ] **C9**: Implementar endpoint `GET /api/workflows/{id}/runs/{run_id}` — detalhe do run com step_logs
- [ ] **C10**: Implementar endpoint `GET /api/workflows/{id}/runs/{run_id}/stream` — SSE stream de execucao em andamento
- [ ] **C11**: Implementar notificacao de erro — se step falha e `on_error_notify` configurado, tenta enviar Slack
- [ ] **C12**: Testes: executar workflow mock com 3 steps, verificar step_logs criados, run status "completed"

## Phase D: Cloud Scheduler Integration

- [ ] **D1**: Implementar `workflows/scheduler.py` — `WorkflowScheduler` com client `google.cloud.scheduler_v1`
- [ ] **D2**: Implementar `WorkflowScheduler.create_or_update()` — cria/atualiza job com HTTP target + OIDC token
- [ ] **D3**: Implementar `WorkflowScheduler.delete()` — remove job do Cloud Scheduler
- [ ] **D4**: Implementar endpoint `POST /api/workflows/{id}/schedule` — valida cron, chama scheduler.create_or_update()
- [ ] **D5**: Implementar endpoint `DELETE /api/workflows/{id}/schedule` — chama scheduler.delete()
- [ ] **D6**: Configurar service account `sunos-scheduler@project.iam.gserviceaccount.com` com `roles/run.invoker`
- [ ] **D7**: Implementar enable/disable — `PUT /api/workflows/{id}` com `schedule_enabled` toggle, atualiza/remove job

## Phase E: Frontend

- [ ] **E1**: Criar `lib/workflow-types.ts` — types: `Workflow`, `WorkflowStep`, `WorkflowRun`, `StepLog`, `CronSchedule`, `WorkflowTemplate`
- [ ] **E2**: Criar `contexts/WorkflowsContext.tsx` — provider com `workflows`, `loading`, `fetchWorkflows()`, `createWorkflow()`, `updateWorkflow()`, `deleteWorkflow()`
- [ ] **E3**: Criar `components/workflows/WorkflowCard.tsx` — card escuro com nome, descricao truncada, badge de steps count, badge de schedule (se cron ativo), indicador de ultimo run (verde/vermelho/cinza)
- [ ] **E4**: Criar `app/workflows/page.tsx` — pagina catalogo com grid de `WorkflowCard`, botao "Novo Workflow" (link para `/workflows/new`), filtros por status/template
- [ ] **E5**: Criar `components/workflows/WorkflowStepEditor.tsx` — painel lateral ou modal: select tipo (tool/llm/condition/action/hitl), select tool_name (do registry), textarea prompt, JSON editor config, preview de template refs
- [ ] **E6**: Criar `components/workflows/WorkflowBuilder.tsx` — formulario principal: inputs nome/descricao, toggle schedule com cron input, lista vertical de steps arrastáveis, botao add step, cada step clicavel abre StepEditor, botao salvar/atualizar
- [ ] **E7**: Criar `app/workflows/new/page.tsx` — monta `WorkflowBuilder` em modo criacao, submit chama `createWorkflow()`, redireciona para `/workflows/[id]`
- [ ] **E8**: Criar `app/workflows/[workflowId]/page.tsx` — carrega workflow existente, monta `WorkflowBuilder` em modo edicao, submit chama `updateWorkflow()`
- [ ] **E9**: Criar `components/workflows/WorkflowRunTimeline.tsx` — lista vertical de runs com: status badge, data/hora, duracao total, expandir mostra step-by-step com status individual, output preview, erro se houver
- [ ] **E10**: Criar `app/workflows/[workflowId]/runs/page.tsx` — pagina de historico com `WorkflowRunTimeline`, botao "Executar Agora" que chama `POST /run`
- [ ] **E11**: Criar `hooks/useWorkflowRun.ts` — hook que conecta ao SSE stream de um run em andamento, atualiza status em tempo real
- [ ] **E12**: Atualizar `components/layout/Sidebar.tsx` — adicionar item "Workflows" com icone `Workflow` (lucide-react), href `/workflows`, posicionar apos "Biblioteca"
- [ ] **E13**: Registrar `WorkflowsProvider` em `components/layout/Providers.tsx`
- [ ] **E14**: Verificar `npx tsc --noEmit` + `npm run build` — 0 erros

## Phase F: Templates + Polish

- [ ] **F1**: Criar template "Relatorio Mensal" — 3 steps: query_data (consulta metricas) → generate_text (analise com LLM) → send_slack (publica no canal)
- [ ] **F2**: Criar template "Briefing de Campanha" — 4 steps: generate_text (briefing) → hitl (aprovacao do gestor) → generate_image (visual conceito) → send_email (envia para cliente)
- [ ] **F3**: Criar template "Monitoramento de Marca" — 4 steps: fetch_url (redes sociais) → analyze_data (sentimento) → condition (alerta se negativo?) → send_slack (aviso)
- [ ] **F4**: Criar template "Plano de Midia" — 4 steps: search_knowledge (referencias) → generate_text (plano) → hitl (revisao equipe) → export_ppt (apresentacao)
- [ ] **F5**: Criar `components/workflows/WorkflowTemplates.tsx` — grid de template cards com nome, descricao, steps preview, botao "Usar Template" que redireciona para `/workflows/new?template=slug`
- [ ] **F6**: Implementar endpoint `GET /api/workflows/templates` — retorna templates (is_template=True) ou lista hardcoded
- [ ] **F7**: Integrar MLflow tracing no executor — decorator `@mlflow_trace` em `WorkflowExecutor.run()`, log span por step
- [ ] **F8**: Implementar timeout por step — `asyncio.wait_for(step, timeout=max_execution_time/n_steps)`
- [ ] **F9**: Implementar retry com backoff — steps tipo "tool" e "action" tentam ate 3x com exponential backoff
- [ ] **F10**: Implementar rate limiting por workflow — maximo N execucoes por hora por workflow (evitar cron mal configurado)
- [ ] **F11**: Documentacao: atualizar `CLAUDE.md` com conventions do modulo workflows
- [ ] **F12**: Verificacao final: todos os endpoints funcionam, frontend integrado, templates disponives, eval tracing ativo

<!-- REVIEW -->
**Status**: Todas as tasks pendentes. Estimativa total: ~42 tasks.

## Estimativa de Escopo

| Phase | Path | Arquivos novos | Arquivos modificados | Estimativa |
|-------|------|---------------|---------------------|------------|
| A | api/workflows/ | 5 (init, models, schemas, router, migration) | 1 (main.py) | ~8h |
| B | api/workflows/ | 1 (compiler.py) | 0 | ~6h |
| C | api/workflows/ | 1 (executor.py) | 1 (router.py — novos endpoints) | ~12h |
| D | api/workflows/ | 1 (scheduler.py) | 1 (router.py — schedule endpoints) | ~4h |
| E | frontend | ~12 (pages, components, context, types, hook) | 2 (Sidebar, Providers) | ~16h |
| F | ambos | ~5 (templates, tracing) | 2 (executor, CLAUDE.md) | ~8h |
| **Total** | | **~25** | **~7** | **~54h** |

## Dependencias entre Phases

```
A (foundation) ──→ B (compiler) ──→ C (executor + HITL) ──→ D (scheduler)
       │                                     │
       │                                     ↓
       └──────→ E (frontend) ───────────→ F (templates + polish)
```

- **A → B → C → D**: backend sequencial — cada phase depende da anterior
- **A → E**: frontend pode comecar apos A (CRUD ready), mas precisa de C para runs/HITL
- **C + E → F**: templates e polish dependem de executor (C) e frontend (E) prontos
- **E pode rodar em paralelo com B/C** para pages estaticas (catalogo, builder UI com mock)

## Changelog

| Versao | Data | Mudanca |
|--------|------|---------|
| 1.0 | 2026-04-13 | Tasks iniciais. 42 tasks em 6 phases. |
