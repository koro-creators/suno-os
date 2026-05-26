---
spec-id: SPEC-021
slug: agentes
artefato: plan
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
  contexto: "Plano de implementação em 4 fases (A-D) para a feature Agentes (FA-17)."
upstream:
  - docs/specs/large/agentes/spec.md
  - docs/specs/large/agentes/design.md
---

# Plano de Implementação — SPEC-021 — Agentes

## Visão Geral das Fases

| Fase | Marco | Entregável | Gate |
|------|-------|-----------|------|
| **A** | Foundation | Schema DB + API CRUD básico + Context + Listagem + Editor UI | TypeScript pass + listagem funcional no mock |
| **B** | Editor completo | Todas as 7 tabs funcionais + upload memória + skill/app assignment | Todas as CAs de listagem e edição passam em mock |
| **C** | Execução | Runtime LangGraph + manual run + preview sandboxed + schedule stub + activity log | CA-04, CA-13 passam com backend real |
| **D** | Produção | Cloud Scheduler real + GCS memory files + permission enforcement rigoroso | PRE-01 e PRE-04 resolvidos; CA-05, CA-09 validados em staging |

---

## Fase A — Foundation

**Objetivo:** Infraestrutura base — schema, API CRUD, Context com mock, listagem e criação de agentes.

**Pré-condições:** PRE-02 (RBAC) e PRE-03 (skills table) devem estar disponíveis.

**Sequência:**

1. `lib/agents-types.ts` — interfaces: `AgentStatus`, `Agent`, `AgentSummary`, `AgentDetail`, `AgentCreate`, `AgentPermission`, `AgentSkill`, `AppConnection`, `MemoryFile`, `AgentSchedule`, `AgentRun`
2. `data/agents-admin.ts` — 3 agentes mock com status variados (draft, active, inactive)
3. `contexts/AgentsContext.tsx` — CRUD mock (list, get, create, update, archive) com `apiAvailable()` fallback
4. `components/layout/Providers.tsx` — adicionar `<AgentsProvider>`
5. `components/layout/Sidebar.tsx` — adicionar item "Agentes" (Bot icon, adminOnly)
6. `api/migrations/010_agents.sql` — criar 7 tabelas (agents, permissions, skills, apps, memory, schedules, runs, preview_runs)
7. `api/agents/__init__.py` + `api/agents/router.py` — endpoints GET/POST/PATCH/DELETE `/api/agents` e `/api/agents/{id}`
8. `api/agents/schemas.py` — Pydantic models: AgentCreate, AgentUpdate, AgentSummary, AgentDetail
9. `api/main.py` — registrar agents router com prefix `/api/agents`
10. `app/agentes/page.tsx` — listagem com filtros de status, search, cards e "Novo Agente"
11. `components/admin/agentes/AgentesCards.tsx` — cards com status badge, skill_count, client_count
12. `components/admin/agentes/AgentDrawer.tsx` — preview drawer
13. `app/agentes/new/page.tsx` + `components/admin/agentes/AgentNewForm.tsx` — form de criação com redirect pós-criação

**Gate de saída:** `npx tsc --noEmit` limpo + listagem renderiza 3 agentes mock + criação redireciona para editor.

---

## Fase B — Editor Completo

**Objetivo:** Todas as 7 tabs do editor funcionais com mock-mode.

**Sequência:**

14. `app/agentes/[agentId]/page.tsx` + `components/admin/agentes/AgenteEditorTabs.tsx` — container do editor com 7 tabs
15. `components/admin/agentes/tabs/ConfiguracaoTab.tsx` — editar nome, ícone (emoji picker), instruções, status, botão arquivar
16. `components/admin/agentes/tabs/SkillsTab.tsx` — lista Skills ACTIVE com toggles (lê de SkillsContext)
17. `components/admin/agentes/tabs/AppsTab.tsx` — lista apps disponíveis (Drive) com enable/disable
18. `components/admin/agentes/tabs/MemoriaTab.tsx` — drag-and-drop upload (mock) + lista arquivos + delete (mock)
19. `components/admin/agentes/tabs/AgendamentoTab.tsx` — frequency radio, days checkboxes, time input, timezone select, toggle enabled
20. `components/admin/agentes/tabs/AtividadeTab.tsx` — tabela de runs mock (status, duração, trigger, cliente)
21. `components/admin/agentes/tabs/ClientesTab.tsx` — lista permissões + dropdown autorizar cliente + revogar
22. API endpoints tabs: POST/DELETE `/api/agents/{id}/permissions/{client_id}`, `/api/agents/{id}/skills/{slug}`, GET/PUT `/api/agents/{id}/schedule`

**Gate de saída:** Editor abre com todas as tabs populadas (mock); CAs de edição, skills, agendamento passam em mock.

---

## Fase C — Execução

**Objetivo:** Runtime LangGraph real, execução manual, preview sandboxed, activity log, schedule stub in-process.

**Pré-condições:** Backend rodando localmente com LangGraph e Gemini API key.

**Sequência:**

23. `api/agents/graph.py` — `AgentState` + `build_agent_graph()` com LangGraph StateGraph
24. `api/agents/skill_loader.py` — `skill_to_tool()`: converte Skill sunOS em LangChain StructuredTool
25. `api/agents/memory.py` — `load_memory_context()`: concatena conteúdo de memory files (mock: arquivos em filesystem local, não GCS)
26. `api/agents/runner.py` — `run_agent()` assíncrono: verifica status, permissions, cria `agent_run`, executa graph, atualiza status
27. `api/agents/router.py` — `POST /api/agents/{id}/run` com BackgroundTasks + `GET /api/agents/{id}/runs` + `GET /api/agents/{id}/runs/{run_id}`
28. Frontend: polling no `AtividadeTab.tsx` — `useEffect` com `setInterval(1000ms)` enquanto `status='running'`; cancelar ao montar/desmontar
29. `api/agents/preview.py` — `run_preview()`: executa sandboxed, persiste em `preview_runs`
30. Frontend: painel preview em `AgentEditorPage` — input text + trigger preview + exibir output
31. `api/agents/scheduler.py` — APScheduler in-process: carregar `agent_schedules.enabled=true` ao startup; disparar `run_agent()` no horário configurado

**Gate de saída:** CA-04 (executar agente ativo), CA-13 (preview sandbox), CA-14 (timeout) passam com backend real.

---

## Fase D — Produção

**Objetivo:** Cloud Scheduler real, GCS para memory files, permission enforcement rigoroso em staging.

**Pré-condições:** PRE-01 (bucket GCS) e PRE-04 (Cloud Scheduler service account) resolvidos.

**Sequência:**

32. `api/agents/gcs.py` — `upload_memory_file()`, `delete_memory_file()`, `generate_signed_url(TTL=900s)` usando `google-cloud-storage`
33. `api/agents/router.py` — `POST /api/agents/{id}/memory-files` (multipart upload real), `DELETE`, `GET .../download` (redirect Signed URL)
34. Frontend `MemoriaTab.tsx` — substituir mock upload por chamada à API real; `GET .../download` para abrir arquivo
35. `api/agents/scheduler.py` — migrar de APScheduler para Cloud Scheduler: `google-cloud-scheduler` SDK, criar Job HTTP target para `/api/agents/{id}/run?scheduled_for=<ISO8601>` para cada schedule ativo
36. `api/agents/router.py` — validar idempotência de schedule (checar índice único `idx_agent_runs_schedule_idem` antes de criar run)
37. Smoke tests em staging: CA-05 (permission gate), CA-09 (idempotência schedule), NFR-AGT-004 e NFR-AGT-005
38. Runbook: criar/atualizar Cloud Scheduler Jobs ao mudar `agent_schedule.enabled`; procedure de revogação de permissão de cliente

**Gate de saída:** Todas as CAs da spec passam em staging. NFR-AGT-001 a NFR-AGT-006 validados.

---

## Dependências Entre Fases

```
Fase A ──► Fase B ──► Fase C ──► Fase D
            ↑
         (PRE-02, PRE-03 — já resolvidos)

Fase C: requer Gemini API key no ambiente local
Fase D: requer PRE-01 (GCS bucket) + PRE-04 (Cloud Scheduler)
```

## Stack Técnico

| Camada | Tecnologia | Fase |
|--------|-----------|:----:|
| Frontend UI | Next.js 14, TypeScript, React Context | A |
| Backend CRUD | FastAPI + SQLAlchemy + PostgreSQL | A |
| LLM Runtime | LangGraph + LangChain + Gemini Flash | C |
| Memory Storage | GCS + `google-cloud-storage` | D |
| Schedule (stub) | APScheduler in-process | C |
| Schedule (prod) | Cloud Scheduler + HTTP target | D |
| Observabilidade | MLflow tracing em `run_agent()` | C |

## Estimativa Total

| Fase | Estimativa | Risco |
|------|-----------|-------|
| A | 2-3 dias | Baixo — padrão admin CRUD estabelecido |
| B | 2-3 dias | Baixo — 7 tabs seguem padrão Skills/Clientes |
| C | 3-4 dias | Médio — LangGraph StateGraph é novo código |
| D | 2-3 dias | Alto — PRE-01 e PRE-04 são dependências externas |
| **Total** | **9-13 dias** | Buffer REST-01 (30%): **12-17 dias** |
