---
spec-id: SPEC-018
slug: clientes-admin
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
  contexto: "Plano de implementação faseado A–E para Clientes Admin, com dependência sequencial de SPEC-017 (junction skill_clients)."
upstream:
  - docs/prd/parte1-feature-map.md (FA-12-03)
  - docs/specs/large/skills-admin/plan.md (SPEC-017 deve ser implementada primeiro — junction)
---

# Plan — SPEC-018 — Clientes Admin

## 1. Visão de Fases

| Fase | Marco | Entrega |
|------|-------|---------|
| **A** | Foundation backend | Schema DB `clients` + endpoints CRUD básicos + view `client_metrics` |
| **B** | RBAC + Caixa-preta | Middleware auth, 404 para P1/P2, state machine status, warnings de Solar System |
| **C** | Frontend persistência | Componentes migrados de Context para SWR+API; wizard criação; tabs completos |
| **D** | Piloto | Deploy produção, runbook sync com Solar System, smoke tests |
| **E** | MVP estabilizado | Métricas dashboard, Tab Biblioteca funcional, polish de UX |

**Dependência crítica:** Fase A desta SPEC pressupõe que a junction `skill_clients` (SPEC-017 TASK-A01) já existe no DB. Implementar SPEC-017 Fase A antes de iniciar SPEC-018 Fase A.

---

## 2. Fase A — Foundation Backend

**Objetivo:** Schema PostgreSQL + endpoints CRUD + view metrics.

### Tarefas

| ID | Tarefa | Estimativa |
|----|--------|:----------:|
| TASK-A01 | Migration: criar tabela `clients` com enum status + índices | 0.5d |
| TASK-A02 | Migration: criar view `client_metrics` com aggregation | 0.5d |
| TASK-A03 | Pydantic schemas: `ClientCreate`, `ClientUpdate`, `ClientSummary`, `ClientDetail`, `ClientMetrics` | 0.5d |
| TASK-A04 | `GET /api/clients` com query params (status, skill_id, q, sort) | 0.5d |
| TASK-A05 | `GET /api/clients/{id}` retorna ClientDetail | 0.25d |
| TASK-A06 | `POST /api/clients` com validação slug unique | 0.5d |
| TASK-A07 | `PATCH /api/clients/{id}` (campos parciais, sem slug) | 0.25d |
| TASK-A08 | `POST /api/clients/{id}/archive` com warning solar_impact | 0.25d |
| TASK-A09 | `GET /api/clients/{id}/metrics` via view client_metrics | 0.5d |
| TASK-A10 | Endpoints skills: GET/POST/DELETE (usa junction skill_clients de SPEC-017) | 0.5d |
| TASK-A11 | `GET /api/clients/{id}/biblioteca` delegando para Biblioteca endpoint com client_id filter | 0.25d |

**Gate A:** `curl http://localhost:8080/api/clients` retorna lista 200 OK. GET /api/clients/{id}/metrics retorna campos calculados. Junction skill_clients funciona em ambas as direções (SPEC-017 + SPEC-018).

---

## 3. Fase B — RBAC e Caixa-preta

**Objetivo:** Enforcement de permissões + 404 para P1/P2.

### Tarefas

| ID | Tarefa | Estimativa |
|----|--------|:----------:|
| TASK-B01 | Dependency `require_client_access`: role check + 404 para P1/P2 | 0.5d |
| TASK-B02 | State machine validation: só permitir transições válidas (PRE_ACTIVE→ACTIVE, ACTIVE→ARCHIVED) | 0.25d |
| TASK-B03 | Archive endpoint: incluir `solar_impact` no response como aviso de sincronização manual | 0.25d |
| TASK-B04 | Middleware Next.js: `/clientes*` redireciona P1/P2 para `/404` (compartilhado com SPEC-017) | 0.1d |
| TASK-B05 | Teste integração: P2 GET /api/clients/{id} → 404 | 0.25d |
| TASK-B06 | Teste integração: transição de status inválida (ARCHIVED→ACTIVE) → 422 | 0.25d |

**Gate B:** NFR-CAD-002 verificado por testes automatizados. Zero falsos negativos para P1/P2.

---

## 4. Fase C — Frontend Persistência

**Objetivo:** Migrar componentes de React Context para chamadas API; mock-mode preservado.

### Tarefas

| ID | Tarefa | Estimativa |
|----|--------|:----------:|
| TASK-C01 | Criar `lib/clients-api.ts` com funções fetch wrappers | 0.5d |
| TASK-C02 | Atualizar `ClientsContext`: despachar para API se `apiAvailable()`, mock senão | 0.5d |
| TASK-C03 | `ClientesCards` com SWR para listagem e filtros sidebar | 0.5d |
| TASK-C04 | `ClienteWizardPage` (4 steps): integrar com API POST + validação slug inline | 1d |
| TASK-C05 | `IdentidadeTab` salvar via PATCH API com color picker | 0.5d |
| TASK-C06 | `SkillsTab` — toggle via POST/DELETE (junction skill_clients) + state sync bidirecional | 0.75d |
| TASK-C07 | `BibliotecaTab` — lista read-only via `/api/clients/{id}/biblioteca` | 0.5d |
| TASK-C08 | `MetricasTab` — dashboard com SWR para `/api/clients/{id}/metrics` | 0.5d |
| TASK-C09 | `ClientDrawer` preview com dados da API | 0.25d |
| TASK-C10 | Status badge e botão Archive com confirmation dialog + warning solar_impact | 0.5d |
| TASK-C11 | Toast feedback em todas as operações de escrita | 0.25d |
| TASK-C12 | `npx tsc --noEmit` + `npx next lint` sem erros novos | 0.25d |

**Gate C:** Fluxo end-to-end manual: criar cliente → atribuir skills → ver métricas — tudo persiste após refresh. Tab Skills bidirecional com SPEC-017. Mock-mode sem `NEXT_PUBLIC_API_URL`.

---

## 5. Fase D — Piloto

**Objetivo:** Deploy em produção + runbook de sincronização Solar System.

### Tarefas

| ID | Tarefa | Estimativa |
|----|--------|:----------:|
| TASK-D01 | Migration Alembic no Cloud SQL (produção): `clients` + `client_metrics` view | 0.5d |
| TASK-D02 | Runbook: criar cliente → sincronizar com `data/clients.ts` + rebuild Solar System | 1d |
| TASK-D03 | Smoke tests manuais com Líder real | 0.5d |
| TASK-D04 | Monitorar latência da view `client_metrics` nas primeiras 48h | ongoing |

**Gate D:** Líder confirma que fluxo completo funciona em produção. Solar System continua funcionando sem alterações. Zero erros 5xx em 48h.

---

## 6. Fase E — MVP Estabilizado

**Objetivo:** Polish, métricas avançadas, FA-15 preparação.

### Tarefas

| ID | Tarefa | Estimativa |
|----|--------|:----------:|
| TASK-E01 | Endpoint `POST /api/clients/{id}/activate` para transição PRE_ACTIVE→ACTIVE (FA-15 prep) | 0.5d |
| TASK-E02 | Listagem com badge PRE_ACTIVE + workflow de validação visual (FA-15 prep) | 0.5d |
| TASK-E03 | Índice GIN em clients.name para busca full-text | 0.25d |
| TASK-E04 | Paginação na listagem (>100 clientes) | 0.5d |
| TASK-E05 | Validação vocabulário UI (RN-016) em labels de /clientes | 0.25d |

**Gate E:** Todas as CAs passam em testes automatizados ou manuais documentados. DoD da constitution verificado.
