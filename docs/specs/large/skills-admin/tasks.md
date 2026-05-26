---
spec-id: SPEC-017
slug: skills-admin
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
  contexto: "Lista de tasks com estimativas e backward mapping FR/CA/ADR-LOCAL para Skills Admin."
upstream:
  - docs/specs/large/skills-admin/spec.md
  - docs/specs/large/skills-admin/design.md
  - docs/specs/large/skills-admin/plan.md
---

# Tasks — SPEC-017 — Skills Admin

## Fase A — Foundation Backend

| ID | Tarefa | Est. | FR/NFR coberto |
|----|--------|:----:|----------------|
| TASK-A01 | Migration: `skills`, `skill_versions`, `skill_clients`, `moon_skills`, `skill_prompt_audit` | 1d | FR-SKA-001, FR-SKA-014, FR-SKA-017, FR-SKA-020 |
| TASK-A02 | Pydantic schemas: `SkillCreate`, `SkillUpdate`, `SkillPublic`, `SkillAdmin`, `SkillSummary` | 0.5d | FR-SKA-007, FR-SKA-008, FR-SKA-009, NFR-SKA-003 |
| TASK-A03 | `GET /api/skills` com query params (type, status, q, sort, limit, offset) | 0.5d | FR-SKA-001, FR-SKA-002, FR-SKA-003, FR-SKA-004 |
| TASK-A04 | `GET /api/skills/{id}` retorna SkillAdmin (sem role filter ainda) | 0.25d | FR-SKA-007, FR-SKA-008, FR-SKA-009 |
| TASK-A05 | `POST /api/skills` com validação slug unique (409 se duplicado) | 0.5d | FR-SKA-007, FR-SKA-012, CA-SKA-005, NFR-SKA-006 |
| TASK-A06 | `PATCH /api/skills/{id}` com auto-increment version_number e snapshot em skill_versions | 1d | FR-SKA-014, CA-SKA-010 |
| TASK-A07 | `POST /api/skills/{id}/archive` com dependency check em workflow_steps | 0.5d | FR-SKA-018, FR-SKA-020, CA-SKA-004, CA-SKA-008 |
| TASK-A08 | Endpoints moons: GET / POST / DELETE / PATCH reorder | 1d | FR-SKA-010, CA-SKA-006 |
| TASK-A09 | Endpoints clientes: GET / POST / DELETE (junction skill_clients) | 0.5d | FR-SKA-011, CA-SKA-007, ADR-LOCAL-02 |
| TASK-A10 | `GET /api/skills/{id}/versions` retorna VersionEntry[] sem system_prompt | 0.25d | FR-SKA-015 |

**Total Fase A:** ~5.5d

---

## Fase B — RBAC e Caixa-preta

| ID | Tarefa | Est. | FR/NFR coberto |
|----|--------|:----:|----------------|
| TASK-B01 | Dependency `require_skill_access`: role check + 404 para P1/P2 | 0.5d | FR-SKA-016, NFR-SKA-002, CA-SKA-003, ADR-LOCAL-01 |
| TASK-B02 | Serializer role-aware: `system_prompt` omitido de SkillPublic, presente em SkillAdmin | 0.5d | FR-SKA-009, FR-SKA-016, NFR-SKA-003 |
| TASK-B03 | Audit log hook em PATCH para system_prompt: registra user_id, timestamp, prev_hash | 0.5d | FR-SKA-017, NFR-SKA-004 |
| TASK-B04 | Dependency check archive: query workflow_steps com skill_id + status active | 0.5d | FR-SKA-018, CA-SKA-004 |
| TASK-B05 | Middleware Next.js: `/skills*` redireciona P1/P2 para `/404` | 0.25d | CA-SKA-009 |
| TASK-B06 | Teste integração: P2 GET /api/skills/{id} → 404 | 0.25d | CA-SKA-003, NFR-SKA-002 |
| TASK-B07 | Teste integração: P3 edita system_prompt → audit log inserido | 0.25d | CA-SKA-002, NFR-SKA-004 |
| TASK-B08 | Teste integração: archive skill em workflow ativo → 409 | 0.25d | CA-SKA-004 |
| TASK-B09 | Teste integração: system_prompt ausente em payload para P2 | 0.25d | NFR-SKA-003 |

**Total Fase B:** ~3.25d

---

## Fase C — Frontend Persistência

| ID | Tarefa | Est. | FR/NFR coberto |
|----|--------|:----:|----------------|
| TASK-C01 | `lib/skills-api.ts`: funções fetch wrappers com mock-mode fallback | 0.5d | REST-SKA-02 |
| TASK-C02 | Atualizar `SkillsContext`: despachar para API se `apiAvailable()`, mock senão | 0.5d | FR-SKA-001 |
| TASK-C03 | `SkillsTable` com SWR para listagem e filtros sidebar | 0.5d | FR-SKA-001, FR-SKA-002, FR-SKA-003, FR-SKA-004, FR-SKA-005, FR-SKA-006 |
| TASK-C04 | `IdentidadeTab` salvar via API com error handling inline | 0.5d | FR-SKA-007, FR-SKA-012, CA-SKA-001 |
| TASK-C05 | `ConfiguracaoTab` com system_prompt condicional por role (useUserRole hook) | 0.5d | FR-SKA-008, FR-SKA-009, CA-SKA-002 |
| TASK-C06 | `MoonsTab` com reorder via PATCH e optimistic UI | 1d | FR-SKA-010, CA-SKA-006 |
| TASK-C07 | `ClientesTab` com toggle POST/DELETE e state sync | 0.5d | FR-SKA-011, CA-SKA-007 |
| TASK-C08 | `SkillDrawer` preview com dados vindos da API | 0.25d | FR-SKA-006 |
| TASK-C09 | Toast feedback: sucesso + erro em todas as operações de escrita | 0.25d | (UX transversal) |
| TASK-C10 | `npx tsc --noEmit` + `npx next lint` sem erros novos | 0.25d | NFR-SKA-005 |
| TASK-C11 | Auto-geração de slug no frontend (FR-SKA-013) + validação de formato | 0.25d | FR-SKA-013, ADR-LOCAL-03 |

**Total Fase C:** ~5d

---

## Fase D — Piloto

| ID | Tarefa | Est. | FR/NFR coberto |
|----|--------|:----:|----------------|
| TASK-D01 | Migration Alembic no Cloud SQL (produção) | 0.5d | — |
| TASK-D02 | Runbook: criar → editar system_prompt → arquivar → verificar audit log | 0.5d | DoD |
| TASK-D03 | Smoke tests manuais com Líder real | 0.5d | CA-SKA-001..010 |
| TASK-D04 | Monitorar logs 48h pós-deploy | ongoing | — |

**Total Fase D:** ~1.5d + ongoing

---

## Fase E — MVP Estabilizado

| ID | Tarefa | Est. | FR/NFR coberto |
|----|--------|:----:|----------------|
| TASK-E01 | `HistoricoVersoes` component: lista versions com data + número + preview | 1d | FR-SKA-015, CA-SKA-010 |
| TASK-E02 | MLflow tracing: log de criação/edição/archive | 0.5d | NFR-SKA-004 (extensão) |
| TASK-E03 | Índice GIN em skills.name + skills.slug para busca full-text | 0.25d | NFR-SKA-001 |
| TASK-E04 | Paginação na listagem com cursor/offset | 0.5d | NFR-SKA-001 |
| TASK-E05 | Validação vocabulário UI (RN-016) em labels/placeholders de /skills | 0.5d | RN-016 |

**Total Fase E:** ~2.75d

---

## Resumo de Estimativas

| Fase | Estimativa |
|------|:----------:|
| A — Foundation | 5.5d |
| B — RBAC | 3.25d |
| C — Frontend | 5d |
| D — Piloto | 1.5d + ongoing |
| E — MVP | 2.75d |
| **Total** | **~18d** |

---

## Mapa CA ↔ Tasks

| CA | Descrição curta | Tasks |
|----|-----------------|-------|
| CA-SKA-001 | Criar skill → aparece na listagem | TASK-A05, TASK-C04 |
| CA-SKA-002 | Editar system_prompt → audit log | TASK-B03, TASK-B07, TASK-C05 |
| CA-SKA-003 | P2 GET skill → 404 | TASK-B01, TASK-B06 |
| CA-SKA-004 | Archive skill em workflow ativo → 409 | TASK-A07, TASK-B04, TASK-B08 |
| CA-SKA-005 | Slug duplicado → erro inline | TASK-A05, TASK-C04, TASK-C11 |
| CA-SKA-006 | Adicionar moon → salva em moon_skills | TASK-A08, TASK-C06 |
| CA-SKA-007 | Atribuir cliente → salva em skill_clients | TASK-A09, TASK-C07 |
| CA-SKA-008 | Arquivar skill → some da listagem default | TASK-A07, TASK-C03 |
| CA-SKA-009 | Operacional navega /skills → /404 | TASK-B05 |
| CA-SKA-010 | Editar skill → version_number incrementa | TASK-A06, TASK-E01 |

---

## Mapa Tasks ↔ FR/NFR/ADR-LOCAL

| Grupo | ID | Tasks que cobrem |
|-------|----|-----------------|
| **FR** | FR-SKA-001 | TASK-A03, TASK-C02, TASK-C03 |
| **FR** | FR-SKA-002 | TASK-A03, TASK-C03 |
| **FR** | FR-SKA-003 | TASK-A03, TASK-C03 |
| **FR** | FR-SKA-004 | TASK-A03, TASK-C03 |
| **FR** | FR-SKA-005 | TASK-C03 |
| **FR** | FR-SKA-006 | TASK-C03, TASK-C08 |
| **FR** | FR-SKA-007 | TASK-A02, TASK-A04, TASK-C04 |
| **FR** | FR-SKA-008 | TASK-A02, TASK-A04, TASK-C05 |
| **FR** | FR-SKA-009 | TASK-A02, TASK-B02, TASK-C05 |
| **FR** | FR-SKA-010 | TASK-A08, TASK-C06 |
| **FR** | FR-SKA-011 | TASK-A09, TASK-C07 |
| **FR** | FR-SKA-012 | TASK-A05, TASK-C04 |
| **FR** | FR-SKA-013 | TASK-C11 |
| **FR** | FR-SKA-014 | TASK-A01, TASK-A06 |
| **FR** | FR-SKA-015 | TASK-A10, TASK-E01 |
| **FR** | FR-SKA-016 | TASK-B01, TASK-B02, TASK-B06 |
| **FR** | FR-SKA-017 | TASK-A01, TASK-B03, TASK-B07 |
| **FR** | FR-SKA-018 | TASK-A07, TASK-B04, TASK-B08 |
| **FR** | FR-SKA-019 | TASK-B01 |
| **FR** | FR-SKA-020 | TASK-A01, TASK-A07 |
| **NFR** | NFR-SKA-001 | TASK-E03, TASK-E04 |
| **NFR** | NFR-SKA-002 | TASK-B01, TASK-B06 |
| **NFR** | NFR-SKA-003 | TASK-A02, TASK-B02, TASK-B09 |
| **NFR** | NFR-SKA-004 | TASK-B03, TASK-B07, TASK-E02 |
| **NFR** | NFR-SKA-005 | TASK-B01, TASK-C10 |
| **NFR** | NFR-SKA-006 | TASK-A05 |
| **ADR** | ADR-LOCAL-01 | TASK-A01, TASK-A02, TASK-B01, TASK-B02 |
| **ADR** | ADR-LOCAL-02 | TASK-A01, TASK-A09, TASK-C07 |
| **ADR** | ADR-LOCAL-03 | TASK-A05, TASK-C11 |
| **ADR** | ADR-LOCAL-04 | TASK-A01, TASK-A07 |
