---
spec-id: SPEC-018
slug: clientes-admin
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
  contexto: "Lista de tasks com estimativas e backward mapping FR/CA/ADR-LOCAL para Clientes Admin."
upstream:
  - docs/specs/large/clientes-admin/spec.md
  - docs/specs/large/clientes-admin/design.md
  - docs/specs/large/clientes-admin/plan.md
---

# Tasks — SPEC-018 — Clientes Admin

> **Pré-requisito:** SPEC-017 Fase A deve estar concluída antes de iniciar esta SPEC (junction `skill_clients` e tabela `skills` precisam existir no DB).

## Fase A — Foundation Backend

| ID | Tarefa | Est. | FR/NFR coberto |
|----|--------|:----:|----------------|
| TASK-A01 | Migration: `clients` com enum status + índices (status, slug) | 0.5d | FR-CAD-001, FR-CAD-011, FR-CAD-021, ADR-LOCAL-03 |
| TASK-A02 | Migration: adicionar `client_id` à tabela `conversations`; stub GET /metrics retorna zeros (Fase A); view `client_metrics` real em Fase C (pré-condição: spec HITL para `feedbacks`) | 0.75d | FR-CAD-016, FR-CAD-022, FR-CAD-023, ADR-LOCAL-04 |
| TASK-A03 | Pydantic schemas: `ClientCreate`, `ClientUpdate`, `ClientSummary`, `ClientDetail`, `ClientMetrics` | 0.5d | FR-CAD-007, FR-CAD-008, FR-CAD-013 |
| TASK-A04 | `GET /api/clients` com query params (status, skill_id, q, sort, limit, offset) | 0.5d | FR-CAD-001, FR-CAD-002, FR-CAD-003, FR-CAD-004 |
| TASK-A05 | `GET /api/clients/{id}` retorna ClientDetail | 0.25d | FR-CAD-013 |
| TASK-A06 | `POST /api/clients` com validação slug unique (409) | 0.5d | FR-CAD-007, FR-CAD-008, FR-CAD-012, CA-CAD-006, NFR-CAD-006 |
| TASK-A07 | `PATCH /api/clients/{id}` para campos parciais (sem slug) | 0.25d | FR-CAD-013 |
| TASK-A08 | `POST /api/clients/{id}/archive` com `solar_impact` warning | 0.25d | FR-CAD-018, FR-CAD-021, CA-CAD-002, ADR-LOCAL-01 |
| TASK-A09 | `GET /api/clients/{id}/metrics` via view client_metrics | 0.5d | FR-CAD-016, FR-CAD-022, FR-CAD-023, CA-CAD-005 |
| TASK-A10 | Endpoints skills (junction skill_clients): GET / POST / DELETE | 0.5d | FR-CAD-014, CA-CAD-003, CA-CAD-004, ADR-LOCAL-02 |
| TASK-A11 | `GET /api/clients/{id}/biblioteca` delegando para KnowledgeItems com client_id | 0.25d | FR-CAD-015, CA-CAD-009 |

**Total Fase A:** ~4.5d

---

## Fase B — RBAC e Caixa-preta

| ID | Tarefa | Est. | FR/NFR coberto |
|----|--------|:----:|----------------|
| TASK-B01 | Dependency `require_client_access`: role check + 404 para P1/P2 | 0.5d | FR-CAD-019, NFR-CAD-002, CA-CAD-007 |
| TASK-B02 | State machine: validar transições permitidas (PRE_ACTIVE→ACTIVE, ACTIVE→ARCHIVED) | 0.25d | FR-CAD-017, FR-CAD-018, ADR-LOCAL-03 |
| TASK-B03 | Archive endpoint: solar_impact no response body | 0.25d | FR-CAD-018, ADR-LOCAL-01 |
| TASK-B04 | Middleware Next.js: `/clientes*` → `/404` para P1/P2 (shared com SPEC-017) | 0.1d | CA-CAD-008 |
| TASK-B05 | Teste integração: P2 GET /api/clients/{id} → 404 | 0.25d | CA-CAD-007, NFR-CAD-002 |
| TASK-B06 | Teste integração: transição inválida ARCHIVED→ACTIVE → 422 | 0.25d | ADR-LOCAL-03 |
| TASK-B07 | Teste: `data/clients.ts` md5 intacto após 10 operações CRUD | 0.25d | FR-CAD-020, NFR-CAD-003, REST-CAD-01 |

**Total Fase B:** ~1.85d

---

## Fase C — Frontend Persistência

| ID | Tarefa | Est. | FR/NFR coberto |
|----|--------|:----:|----------------|
| TASK-C01 | `lib/clients-api.ts`: funções fetch com mock-mode fallback | 0.5d | REST-CAD-02 |
| TASK-C02 | Atualizar `ClientsContext`: despachar para API se `apiAvailable()` | 0.5d | FR-CAD-001 |
| TASK-C03 | `ClientesCards` com SWR + filtros sidebar + ordenação | 0.5d | FR-CAD-001, FR-CAD-002, FR-CAD-003, FR-CAD-004, FR-CAD-005, FR-CAD-006 |
| TASK-C04 | `ClienteWizardPage` 4 steps com API POST + validação slug inline | 1d | FR-CAD-007, FR-CAD-008, FR-CAD-009, FR-CAD-010, FR-CAD-011, FR-CAD-012, CA-CAD-001 |
| TASK-C05 | `IdentidadeTab` com color picker + PATCH API | 0.5d | FR-CAD-013, CA-CAD-001 |
| TASK-C06 | `SkillsTab` — toggle POST/DELETE com bidirecional state sync | 0.75d | FR-CAD-014, CA-CAD-003, CA-CAD-004, ADR-LOCAL-02 |
| TASK-C07 | `BibliotecaTab` — lista read-only com link | 0.5d | FR-CAD-015, CA-CAD-009 |
| TASK-C08 | `MetricasTab` — SWR para /metrics com loading + null state | 0.5d | FR-CAD-016, FR-CAD-023, CA-CAD-005 |
| TASK-C09 | `ClientDrawer` preview com status badge e color swatch | 0.25d | FR-CAD-006 |
| TASK-C10 | Status badge + botão Archive com confirmation dialog + solar_impact warning | 0.5d | FR-CAD-017, FR-CAD-018, CA-CAD-002, ADR-LOCAL-01 |
| TASK-C11 | Toast feedback em operações de escrita | 0.25d | (UX transversal) |
| TASK-C12 | `npx tsc --noEmit` + `npx next lint` sem erros | 0.25d | NFR-CAD-005 |

**Total Fase C:** ~6.0d

---

## Fase D — Piloto

| ID | Tarefa | Est. | FR/NFR coberto |
|----|--------|:----:|----------------|
| TASK-D01 | Migration Alembic (produção): `clients` + `client_metrics` view | 0.5d | — |
| TASK-D02 | Runbook: criar cliente Admin → sincronizar `data/clients.ts` + rebuild Solar System | 1d | ADR-LOCAL-01 |
| TASK-D03 | Smoke tests manuais com Líder real | 0.5d | CA-CAD-001..010 |
| TASK-D04 | Monitor latência `client_metrics` view em produção (≤800ms) | ongoing | NFR-CAD-001 |

**Total Fase D:** ~2d + ongoing

---

## Fase E — MVP Estabilizado

| ID | Tarefa | Est. | FR/NFR coberto |
|----|--------|:----:|----------------|
| TASK-E01 | `POST /api/clients/{id}/activate` (PRE_ACTIVE→ACTIVE) para FA-15 | 0.5d | CA-CAD-010, ADR-LOCAL-03 |
| TASK-E02 | Badge PRE_ACTIVE na listagem + visual do workflow de validação | 0.5d | CA-CAD-010 |
| TASK-E03 | Índice GIN em clients.name para busca full-text | 0.25d | NFR-CAD-001 |
| TASK-E04 | Paginação na listagem (>100 clientes) | 0.5d | NFR-CAD-001 |
| TASK-E05 | Validação vocabulário UI (RN-016) em labels de /clientes | 0.25d | RN-009 |

**Total Fase E:** ~2d

---

## Resumo de Estimativas

| Fase | Estimativa |
|------|:----------:|
| A — Foundation | 4.5d |
| B — RBAC | 1.85d |
| C — Frontend | 6.0d |
| D — Piloto | 2d + ongoing |
| E — MVP | 2d |
| **Total** | **~16.35d** |

---

## Mapa CA ↔ Tasks

| CA | Descrição curta | Tasks |
|----|-----------------|-------|
| CA-CAD-001 | Criar cliente → listagem + clients.ts intacto | TASK-A06, TASK-B07, TASK-C04 |
| CA-CAD-002 | Arquivar cliente → status ARCHIVED | TASK-A08, TASK-C10 |
| CA-CAD-003 | Atribuir skill → skill_clients + bidirecional | TASK-A10, TASK-C06 |
| CA-CAD-004 | Desatribuir skill → remove skill_clients | TASK-A10, TASK-C06 |
| CA-CAD-005 | Métricas on-demand | TASK-A02, TASK-A09, TASK-C08 |
| CA-CAD-006 | Slug duplicado → erro inline | TASK-A06, TASK-C04 |
| CA-CAD-007 | P2 GET client → 404 | TASK-B01, TASK-B05 |
| CA-CAD-008 | Operacional navega /clientes → /404 | TASK-B04 |
| CA-CAD-009 | Tab Biblioteca read-only | TASK-A11, TASK-C07 |
| CA-CAD-010 | FA-15 cria cliente PRE_ACTIVE | TASK-A01, TASK-B02, TASK-E01, TASK-E02 |

---

## Mapa Tasks ↔ FR/NFR/ADR-LOCAL

| Grupo | ID | Tasks que cobrem |
|-------|----|-----------------|
| **FR** | FR-CAD-001 | TASK-A04, TASK-C02, TASK-C03 |
| **FR** | FR-CAD-002 | TASK-A04, TASK-C03 |
| **FR** | FR-CAD-003 | TASK-A04, TASK-C03 |
| **FR** | FR-CAD-004 | TASK-A04, TASK-C03 |
| **FR** | FR-CAD-005 | TASK-C03 |
| **FR** | FR-CAD-006 | TASK-C03, TASK-C09 |
| **FR** | FR-CAD-007 | TASK-A03, TASK-A06, TASK-C04 |
| **FR** | FR-CAD-008 | TASK-A03, TASK-A06, TASK-C04 |
| **FR** | FR-CAD-009 | TASK-A03, TASK-C04 |
| **FR** | FR-CAD-010 | TASK-A10, TASK-C04 |
| **FR** | FR-CAD-011 | TASK-A01, TASK-A06 |
| **FR** | FR-CAD-012 | TASK-A06, TASK-C04 |
| **FR** | FR-CAD-013 | TASK-A03, TASK-A05, TASK-A07, TASK-C05 |
| **FR** | FR-CAD-014 | TASK-A10, TASK-C06 |
| **FR** | FR-CAD-015 | TASK-A11, TASK-C07 |
| **FR** | FR-CAD-016 | TASK-A02, TASK-A09, TASK-C08 |
| **FR** | FR-CAD-017 | TASK-A01, TASK-B02, TASK-C10 |
| **FR** | FR-CAD-018 | TASK-A08, TASK-B02, TASK-B03, TASK-C10 |
| **FR** | FR-CAD-019 | TASK-B01, TASK-B05 |
| **FR** | FR-CAD-020 | TASK-B07 |
| **FR** | FR-CAD-021 | TASK-A01, TASK-A08 |
| **FR** | FR-CAD-022 | TASK-A02, TASK-A09 |
| **FR** | FR-CAD-023 | TASK-A02, TASK-A09, TASK-C08 |
| **NFR** | NFR-CAD-001 | TASK-A02, TASK-D04, TASK-E03, TASK-E04 |
| **NFR** | NFR-CAD-002 | TASK-B01, TASK-B05 |
| **NFR** | NFR-CAD-003 | TASK-B07 |
| **NFR** | NFR-CAD-004 | TASK-A10, TASK-C06 |
| **NFR** | NFR-CAD-005 | TASK-B01, TASK-C12 |
| **NFR** | NFR-CAD-006 | TASK-A06 |
| **ADR** | ADR-LOCAL-01 | TASK-A01, TASK-A08, TASK-B03, TASK-B07, TASK-C10, TASK-D02 |
| **ADR** | ADR-LOCAL-02 | TASK-A10, TASK-C06 |
| **ADR** | ADR-LOCAL-03 | TASK-A01, TASK-B02, TASK-E01 |
| **ADR** | ADR-LOCAL-04 | TASK-A02, TASK-A09 |
