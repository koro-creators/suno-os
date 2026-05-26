---
spec-id: SPEC-021
slug: agentes
artefato: tasks
nivel-sdd: spec-anchored
tamanho: large
status: rascunho
criada: 2026-05-26
atualizada: 2026-05-26
versao: 1.0
escopo:
  projeto: sunos
  stack: "Frontend: Next.js 14 + TypeScript | Backend: FastAPI + LangGraph + Python 3.11"
  autor: Heitor Miranda
  papel: Tech Lead
  branch: master
  contexto: "Tarefas atômicas para implementação da feature Agentes (FA-17) em 4 fases."
upstream:
  - docs/specs/large/agentes/spec.md
  - docs/specs/large/agentes/design.md
  - docs/specs/large/agentes/plan.md
---

# Tasks — SPEC-021 — Agentes

## Fase A — Foundation

| ID | Descrição | Estimativa | Arquivos |
|----|-----------|:----------:|---------|
| TASK-A01 | Criar `lib/agents-types.ts` com interfaces: `AgentStatus`, `Agent`, `AgentSummary`, `AgentDetail`, `AgentCreate`, `AgentUpdate`, `AgentPermission`, `AgentSkill`, `AppConnection`, `MemoryFile`, `AgentSchedule`, `AgentScheduleConfig`, `AgentRun`, `AgentRunRequest` | 2h | `lib/agents-types.ts` |
| TASK-A02 | Criar `data/agents-admin.ts` com 3 agentes mock: um `draft`, um `active` com 2 skills e 1 cliente, um `inactive`. Incluir agent_runs mock (últimas 5 execuções do ativo) | 1h | `data/agents-admin.ts` |
| TASK-A03 | Criar `contexts/AgentsContext.tsx` com: listAgents, getAgent, createAgent, updateAgent, archiveAgent + apiAvailable() fallback para mock data | 3h | `contexts/AgentsContext.tsx` |
| TASK-A04 | Adicionar `<AgentsProvider>` em `components/layout/Providers.tsx` após `<ApprovalsProvider>` | 0.5h | `components/layout/Providers.tsx` |
| TASK-A05 | Adicionar item "Agentes" em `components/layout/Sidebar.tsx` (Bot icon, href `/agentes`, adminOnly=true) após item Workflows | 0.5h | `components/layout/Sidebar.tsx` |
| TASK-A06 | Criar migration `api/migrations/010_agents.sql` com as 8 tabelas: agents, agent_client_permissions, agent_skill_assignments, agent_app_connections, agent_memory_files, agent_schedules, agent_runs (com índice idempotência), preview_runs | 3h | `api/migrations/010_agents.sql` |
| TASK-A07 | Criar `api/agents/schemas.py` com Pydantic models: AgentCreate, AgentUpdate, AgentSummary, AgentDetail, AgentRunSummary, AgentRunDetail | 2h | `api/agents/schemas.py` |
| TASK-A08 | Criar `api/agents/router.py` — `GET /`, `POST /`, `GET /{id}`, `PATCH /{id}`, `DELETE /{id}` com middleware `require_agent_access` (caixa-preta: 404 para Operacional) | 4h | `api/agents/router.py`, `api/agents/__init__.py` |
| TASK-A09 | Registrar agents router em `api/main.py`: `app.include_router(agents_router, prefix=f"{settings.API_PREFIX}/agents")` | 0.5h | `api/main.py` |
| TASK-A10 | Criar `app/agentes/page.tsx` — listagem com: filtro de status (pills), search debounced, grid de cards, botão "Novo Agente" | 3h | `app/agentes/page.tsx` |
| TASK-A11 | Criar `components/admin/agentes/AgentesCards.tsx` — card com: nome, ícone, status badge (STATUS_CONFIG), skill_count, client_count, last_run_at | 2h | `components/admin/agentes/AgentesCards.tsx` |
| TASK-A12 | Criar `components/admin/agentes/AgentDrawer.tsx` — side drawer de preview com nome, ícone, status, instruções (truncadas), skill_count, botão "Editar" | 2h | `components/admin/agentes/AgentDrawer.tsx` |
| TASK-A13 | Criar `app/agentes/new/page.tsx` + `components/admin/agentes/AgentNewForm.tsx` — form: nome, ícone (emoji picker com AGENT_ICON_PRESETS), instruções, status inicial; submit → createAgent → redirect para /agentes/[agentId] | 3h | `app/agentes/new/page.tsx`, `components/admin/agentes/AgentNewForm.tsx` |

**Subtotal Fase A:** ~26h (3,5 dias)

---

## Fase B — Editor Completo

| ID | Descrição | Estimativa | Arquivos |
|----|-----------|:----------:|---------|
| TASK-B01 | Criar `app/agentes/[agentId]/page.tsx` — carrega agente via context/API; renderiza `AgenteEditorTabs` | 1h | `app/agentes/[agentId]/page.tsx` |
| TASK-B02 | Criar `components/admin/agentes/AgenteEditorTabs.tsx` — array TABS + activeTab state + renderização condicional das 7 tabs | 2h | `components/admin/agentes/AgenteEditorTabs.tsx` |
| TASK-B03 | Criar `components/admin/agentes/tabs/ConfiguracaoTab.tsx` — formulário: nome, ícone, instruções, status dropdown, botão "Arquivar" (modal de confirmação) | 3h | `tabs/ConfiguracaoTab.tsx` |
| TASK-B04 | Criar `components/admin/agentes/tabs/SkillsTab.tsx` — lista Skills ACTIVE do SkillsContext com toggles; persiste via `addSkill`/`removeSkill` no AgentsContext | 2h | `tabs/SkillsTab.tsx` |
| TASK-B05 | Criar `components/admin/agentes/tabs/AppsTab.tsx` — lista apps disponíveis (Drive Suno como único app Fase B); toggle enable/disable; mock connection status | 2h | `tabs/AppsTab.tsx` |
| TASK-B06 | Criar `components/admin/agentes/tabs/MemoriaTab.tsx` — drag-and-drop zone (mock upload); lista de arquivos com nome/tipo/tamanho; botão delete; limite 10 arquivos (contador visível) | 3h | `tabs/MemoriaTab.tsx` |
| TASK-B07 | Criar `components/admin/agentes/tabs/AgendamentoTab.tsx` — radio frequency (hourly/daily); checkboxes dias da semana; time input; timezone select (lista de timezones BR + UTC); toggle enabled; exibir next_run_at calculado no frontend | 4h | `tabs/AgendamentoTab.tsx` |
| TASK-B08 | Criar `components/admin/agentes/tabs/AtividadeTab.tsx` — tabela paginada de agent_runs mock; colunas: data, status (badge), duração, trigger, cliente; clicar em row exibe detalhe inline com input/output | 3h | `tabs/AtividadeTab.tsx` |
| TASK-B09 | Criar `components/admin/agentes/tabs/ClientesTab.tsx` — lista permissões (nome cliente, data, quem autorizou); dropdown/search "Autorizar cliente" com clientes ACTIVE do ClientsContext; botão "Revogar" com confirmação | 3h | `tabs/ClientesTab.tsx` |
| TASK-B10 | Adicionar endpoints de permissões ao `api/agents/router.py`: `GET/POST /agents/{id}/permissions`, `DELETE /agents/{id}/permissions/{client_id}` | 2h | `api/agents/router.py` |
| TASK-B11 | Adicionar endpoints de skills ao `api/agents/router.py`: `GET/POST /agents/{id}/skills/{slug}`, `DELETE /agents/{id}/skills/{slug}` — validar que skill existe e é ACTIVE antes de associar | 2h | `api/agents/router.py` |
| TASK-B12 | Adicionar endpoints de apps ao `api/agents/router.py`: `GET/POST /agents/{id}/apps`, `PATCH/DELETE /agents/{id}/apps/{connection_id}` — config JSONB nunca retornar ao frontend | 2h | `api/agents/router.py` |
| TASK-B13 | Adicionar endpoints de schedule ao `api/agents/router.py`: `GET /agents/{id}/schedule`, `PUT /agents/{id}/schedule` — upsert em `agent_schedules`; calcular `next_run_at` ao salvar | 2h | `api/agents/router.py` |

**Subtotal Fase B:** ~31h (4 dias)

---

## Fase C — Execução

| ID | Descrição | Estimativa | Arquivos |
|----|-----------|:----------:|---------|
| TASK-C01 | Criar `api/agents/skill_loader.py` — `skill_to_tool(skill_slug, db)`: busca skill ACTIVE, retorna `StructuredTool.from_function` que invoca `/api/chat` com contexto da skill | 3h | `api/agents/skill_loader.py` |
| TASK-C02 | Criar `api/agents/memory.py` — `load_memory_context(agent_id, db)`: para Fase C, lê arquivos de `agent_memory_files.gcs_path` via GCS (ou filesystem local em DEBUG) e concatena como contexto | 2h | `api/agents/memory.py` |
| TASK-C03 | Criar `api/agents/graph.py` — `AgentState` TypedDict + `build_agent_graph(agent, skill_tools, memory_context)` LangGraph StateGraph com nó `agent` (LLM + tools) + nó `tools` (ToolNode) + `should_continue` routing | 4h | `api/agents/graph.py` |
| TASK-C04 | Criar `api/agents/runner.py` — `run_agent(run_id, agent_id, client_id, input, db)`: carrega agent + skills + memory; executa graph com MLflow tracing; atualiza `agent_run.status` + `output` + `duration_ms`; timeout 10min | 4h | `api/agents/runner.py` |
| TASK-C05 | Adicionar `POST /agents/{id}/run` ao router: cria `agent_run` com status `pending`; despacha `run_agent` como FastAPI BackgroundTask; retorna `202 { run_id }`. Validar: status=active, permission check | 3h | `api/agents/router.py` |
| TASK-C06 | Adicionar `GET /agents/{id}/runs` e `GET /agents/{id}/runs/{run_id}` ao router. Paginação na listagem | 2h | `api/agents/router.py` |
| TASK-C07 | Criar `api/agents/preview.py` — `run_preview(agent_id, input, db)`: mesma lógica de runner mas persiste em `preview_runs` (TTL 1h); retorna `preview_run_id` | 3h | `api/agents/preview.py` |
| TASK-C08 | Adicionar `POST /agents/{id}/run` com `triggered_by='preview'`: chama `run_preview`; também retorna `202 { run_id }` mas `run_id` refere `preview_runs` | 1h | `api/agents/router.py` |
| TASK-C09 | Frontend `AtividadeTab.tsx` — substituir mock por polling real: `useEffect` com `setInterval(2000ms)` nos runs com status `pending/running`; cancelar ao status final | 2h | `tabs/AtividadeTab.tsx` |
| TASK-C10 | Frontend — painel de preview no editor: botão "Preview / Testar" abre painel lateral com textarea de input; submit → `POST /agents/{id}/run?triggered_by=preview`; spinner + exibir output ao completar | 3h | `app/agentes/[agentId]/page.tsx` |
| TASK-C11 | Criar `api/agents/scheduler.py` — APScheduler in-process: ao startup, carregar todos `agent_schedules` com `enabled=true`; agendar jobs com cron expression derivada de frequency/days/time; job chama `run_agent` com `triggered_by='schedule'` | 4h | `api/agents/scheduler.py` |
| TASK-C12 | Criar job de limpeza de `preview_runs` expirados: FastAPI lifespan background task que deleta `WHERE expires_at < now()` a cada 30min | 1h | `api/main.py` ou `api/agents/cleanup.py` |

**Subtotal Fase C:** ~32h (4,5 dias)

---

## Fase D — Produção

| ID | Descrição | Estimativa | Arquivos |
|----|-----------|:----------:|---------|
| TASK-D01 | Criar `api/agents/gcs.py` — `upload_to_gcs(agent_id, file_content, filename, content_type)`: upload multipart para `gs://bucket/agents/{agent_id}/memory/{uuid}/{filename}`; `delete_from_gcs(gcs_path)`; `generate_signed_url(gcs_path, ttl_seconds=900)` | 3h | `api/agents/gcs.py` |
| TASK-D02 | Atualizar `POST /agents/{id}/memory-files`: receber multipart/form-data; validar tipo e tamanho; contar arquivos existentes (≤10); upload para GCS; criar registro em `agent_memory_files` | 3h | `api/agents/router.py` |
| TASK-D03 | Adicionar `DELETE /agents/{id}/memory-files/{file_id}`: deletar do GCS + DB em transação | 1h | `api/agents/router.py` |
| TASK-D04 | Adicionar `GET /agents/{id}/memory-files/{file_id}/download`: gerar Signed URL GCS (TTL 15min) + retornar redirect 302 | 1h | `api/agents/router.py` |
| TASK-D05 | Frontend `MemoriaTab.tsx` — substituir mock por upload real: `POST .../memory-files` com FormData; progresso via `XMLHttpRequest.upload.onprogress`; `GET .../download` para abrir arquivo em nova tab | 3h | `tabs/MemoriaTab.tsx` |
| TASK-D06 | `api/agents/memory.py` — atualizar `load_memory_context` para usar GCS real: download via `generate_signed_url` em vez de filesystem local | 1h | `api/agents/memory.py` |
| TASK-D07 | Migrar scheduler para Cloud Scheduler: criar Cloud Scheduler Job via API (`google-cloud-scheduler`) com HTTP target `POST /api/agents/{id}/run?scheduled_for=<ISO8601>` para cada `agent_schedules.enabled=true`. Remover APScheduler em produção (manter como fallback DEBUG=true) | 4h | `api/agents/scheduler_cloud.py` |
| TASK-D08 | Validar idempotência de schedule em staging: testar disparo duplo do mesmo `scheduled_run_at`; confirmar que índice único parcial previne duplicata | 1h | smoke test |
| TASK-D09 | Smoke tests staging: CA-05 (permission gate — execução para cliente não autorizado retorna 404), CA-09 (idempotência schedule), NFR-AGT-004, NFR-AGT-005 | 2h | smoke test / staging |
| TASK-D10 | Runbook em `docs/runbooks/agents-production.md`: como criar/atualizar Cloud Scheduler Jobs ao mudar `agent_schedule.enabled`; procedure de revogação de permissão de cliente; limpeza manual de `preview_runs` | 2h | `docs/runbooks/agents-production.md` |

**Subtotal Fase D:** ~21h (3 dias)

---

## Totais

| Fase | Estimativa Base | Com Buffer 30% (REST-01) |
|------|:--------------:|:------------------------:|
| A | 26h | 34h |
| B | 31h | 40h |
| C | 32h | 42h |
| D | 21h | 27h |
| **Total** | **110h** | **143h (~18 dias úteis)** |

---

## Mapa CA ↔ Tasks

| Critério de Aceite | Tasks |
|--------------------|-------|
| CA-01 (Operacional → 404) | TASK-A08, TASK-B10, TASK-B11 |
| CA-02 (criação → redirect) | TASK-A13 |
| CA-03 (status draft → active) | TASK-B03 |
| CA-04 (executar agente ativo) | TASK-C05, TASK-C09 |
| CA-05 (permission gate 404) | TASK-C05, TASK-D09 |
| CA-06 (limite 10 arquivos) | TASK-B06, TASK-D02 |
| CA-07 (schedule next_run_at) | TASK-B07, TASK-B13 |
| CA-08 (agente archived read-only) | TASK-A08, TASK-B03 |
| CA-09 (idempotência schedule) | TASK-A06, TASK-C11, TASK-D08 |
| CA-10 (autorizar cliente) | TASK-B09, TASK-B10 |
| CA-11 (skill como tool) | TASK-B04, TASK-C01, TASK-C03 |
| CA-12 (deletar memory file) | TASK-B06, TASK-D03 |
| CA-13 (preview sandbox) | TASK-C07, TASK-C08, TASK-C10 |
| CA-14 (timeout 10min) | TASK-C04 |
| CA-15 (filtro por status) | TASK-A10, TASK-A11 |

---

## Mapa Tasks ↔ FR/NFR/ADR-LOCAL

| FR / NFR / ADR-LOCAL | Tasks |
|----------------------|-------|
| FR-AGT-001 (cards com metadados) | TASK-A10, TASK-A11 |
| FR-AGT-002 (filtro status) | TASK-A10 |
| FR-AGT-003 (busca nome debounced) | TASK-A10 |
| FR-AGT-004 (botão Novo Agente) | TASK-A10, TASK-A13 |
| FR-AGT-005 (side drawer) | TASK-A12 |
| FR-AGT-006 (form criação) | TASK-A13 |
| FR-AGT-007 (redirect pós-criação) | TASK-A13 |
| FR-AGT-008 (editar campos) | TASK-B03 |
| FR-AGT-009 (archived read-only) | TASK-A08, TASK-B03 |
| FR-AGT-010 (botão arquivar) | TASK-B03 |
| FR-AGT-011, FR-AGT-012 (skills toggle) | TASK-B04, TASK-B11 |
| FR-AGT-013, FR-AGT-014 (apps) | TASK-B05, TASK-B12 |
| FR-AGT-015–FR-AGT-018 (memory files) | TASK-B06, TASK-D01–TASK-D05 |
| FR-AGT-019–FR-AGT-023 (schedule) | TASK-B07, TASK-B13, TASK-C11 |
| FR-AGT-024–FR-AGT-026 (activity) | TASK-B08, TASK-C06, TASK-C09 |
| FR-AGT-027–FR-AGT-029 (clientes tab) | TASK-B09, TASK-B10 |
| FR-AGT-030 (executar manual) | TASK-C05 |
| FR-AGT-031 (preview) | TASK-C07, TASK-C08, TASK-C10 |
| FR-AGT-032 (feedback execução) | TASK-C09, TASK-C10 |
| FR-AGT-033 (draft/archived sem executar) | TASK-A08, TASK-C05 |
| NFR-AGT-001 (listagem ≤500ms) | TASK-A08 (índices) |
| NFR-AGT-002 (upload ≤10s) | TASK-D02 |
| NFR-AGT-003 (preview ≤5min) | TASK-C04 (timeout 10min) |
| NFR-AGT-004 (Operacional → 404) | TASK-A08 |
| NFR-AGT-005 (permission gate antes de LLM) | TASK-C05 |
| NFR-AGT-006 (schedule inactive/archived ignorado) | TASK-C11 |
| ADR-LOCAL-01 (global + permission table) | TASK-A06, TASK-A07, TASK-B10 |
| ADR-LOCAL-02 (APScheduler → Cloud Scheduler) | TASK-C11, TASK-D07 |
| ADR-LOCAL-03 (GCS memory files) | TASK-D01–TASK-D06 |
| ADR-LOCAL-04 (status draft) | TASK-A01, TASK-A08 |
| ADR-LOCAL-05 (skill_slug FK lógica) | TASK-A06, TASK-B11, TASK-C01 |
