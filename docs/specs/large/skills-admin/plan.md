---
spec-id: SPEC-017
slug: skills-admin
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
  contexto: "Plano de implementação faseado A–E para Skills Admin, partindo do protótipo UI existente até MVP em produção."
upstream:
  - docs/prd/parte1-feature-map.md (FA-12-01)
---

# Plan — SPEC-017 — Skills Admin

## 1. Visão de Fases

| Fase | Marco | Entrega |
|------|-------|---------|
| **A** | Foundation backend | Schema DB + endpoints CRUD básicos + Pydantic schemas |
| **B** | RBAC + Caixa-preta | Middleware auth, serializer com role, audit log, bloqueio de archive |
| **C** | Frontend persistência | Componentes migrados de Context para SWR+API; mock-mode fallback |
| **D** | Piloto | Deploy produção, runbook, smoke tests, feedback real |
| **E** | MVP estabilizado | Versionamento completo, histórico UI, métricas de uso, polish |

Cada fase tem **gate** explícito — não avançar sem gate aprovado.

---

## 2. Fase A — Foundation Backend

**Objetivo:** Backend com schema PostgreSQL e endpoints CRUD sem RBAC enforcement (auth básico token).

### Tarefas

| ID | Tarefa | Estimativa |
|----|--------|:----------:|
| TASK-A01 | Migration: criar tabelas `skills`, `skill_versions`, `skill_clients`, `moon_skills`, `skill_prompt_audit` | 1d |
| TASK-A02 | Pydantic schemas: `SkillCreate`, `SkillUpdate`, `SkillPublic`, `SkillAdmin`, `SkillSummary` | 0.5d |
| TASK-A03 | `GET /api/skills` com query params (type, status, q, sort) | 0.5d |
| TASK-A04 | `GET /api/skills/{id}` sem filtro de role (Fase B adiciona) | 0.25d |
| TASK-A05 | `POST /api/skills` com validação slug unique | 0.5d |
| TASK-A06 | `PATCH /api/skills/{id}` com auto-increment version_number e snapshot em skill_versions | 1d |
| TASK-A07 | `POST /api/skills/{id}/archive` com dependency check (workflows ativos) | 0.5d |
| TASK-A08 | Endpoints moons: GET/POST/DELETE/PATCH reorder | 1d |
| TASK-A09 | Endpoints clientes: GET/POST/DELETE | 0.5d |
| TASK-A10 | `GET /api/skills/{id}/versions` | 0.25d |

**Gate A:** `curl http://localhost:8080/api/skills` retorna lista vazia 200 OK sem auth. Todos endpoints respondem sem erro 5xx.

---

## 3. Fase B — RBAC e Caixa-preta

**Objetivo:** Enforcement de permissões + proteção de `system_prompt` + audit log.

### Tarefas

| ID | Tarefa | Estimativa |
|----|--------|:----------:|
| TASK-B01 | Dependency `require_skill_access` com role check + 404 para P1/P2 | 0.5d |
| TASK-B02 | Serializer role-aware: `system_prompt` omitido para P1/P2 | 0.5d |
| TASK-B03 | Audit log: hook em `PATCH /api/skills/{id}` para system_prompt changes → `skill_prompt_audit` | 0.5d |
| TASK-B04 | Dependency check no archive: query `workflow_steps` com `skill_id` + status active | 0.5d |
| TASK-B05 | Middleware Next.js: redirecionar P1/P2 de `/skills*` para `/404` | 0.25d |
| TASK-B06 | Teste de integração: P2 `GET /api/skills/{id}` → 404 | 0.25d |
| TASK-B07 | Teste de integração: P3 edita system_prompt → audit log criado | 0.25d |
| TASK-B08 | Teste de integração: archive skill em workflow ativo → 409 | 0.25d |

**Gate B:** NFR-SKA-002, NFR-SKA-003, NFR-SKA-004 verificados por testes automatizados. Zero falsos negativos.

---

## 4. Fase C — Frontend Persistência

**Objetivo:** Migrar componentes de React Context para chamadas API; mock-mode fallback preservado.

### Tarefas

| ID | Tarefa | Estimativa |
|----|--------|:----------:|
| TASK-C01 | Criar `lib/skills-api.ts` com funções fetch wrappers (getSkills, getSkill, createSkill, updateSkill, archiveSkill) | 0.5d |
| TASK-C02 | Atualizar `SkillsContext` para despachar para API se `apiAvailable()`, senão mock-mode | 0.5d |
| TASK-C03 | `SkillsTable` — SWR para listagem com filtros sidebar | 0.5d |
| TASK-C04 | `IdentidadeTab` — salvar via API; error handling inline | 0.5d |
| TASK-C05 | `ConfiguracaoTab` — condicional system_prompt por role (useUserRole hook) | 0.5d |
| TASK-C06 | `MoonsTab` — reorder via PATCH + optimistic UI | 1d |
| TASK-C07 | `ClientesTab` — toggle via POST/DELETE + state sync | 0.5d |
| TASK-C08 | `SkillDrawer` — preview com dados API | 0.25d |
| TASK-C09 | Toast feedback em todas as operações de escrita (sucesso + erro) | 0.25d |
| TASK-C10 | TypeScript `npx tsc --noEmit` sem erros novos | 0.25d |

**Gate C:** Fluxo end-to-end manual: criar skill → editar system_prompt → adicionar moon → atribuir cliente — tudo persiste após refresh da página. Mock-mode funciona sem `NEXT_PUBLIC_API_URL`.

---

## 5. Fase D — Piloto

**Objetivo:** Deploy em produção com acesso controlado (PX-01 + PX-04 apenas).

### Tarefas

| ID | Tarefa | Estimativa |
|----|--------|:----------:|
| TASK-D01 | Migration produção (Cloud SQL) via Alembic | 0.5d |
| TASK-D02 | Runbook: criar skill, editar, arquivar, verificar audit log | 0.5d |
| TASK-D03 | Smoke tests manuais por Líder real (PX-01) | 0.5d |
| TASK-D04 | Monitorar logs de erro nas primeiras 48h | ongoing |

**Gate D:** Líder confirma que fluxo completo funciona em produção. Zero erros 5xx em 48h de uso controlado.

---

## 6. Fase E — MVP Estabilizado

**Objetivo:** Polish, versionamento completo na UI, observabilidade.

### Tarefas

| ID | Tarefa | Estimativa |
|----|--------|:----------:|
| TASK-E01 | `HistoricoVersoes` component: lista versões com data, número e diff de nome/status | 1d |
| TASK-E02 | MLflow tracing: logar criação/edição/archive de skills com tags `skill_id`, `user_id` | 0.5d |
| TASK-E03 | Busca full-text por slug (FR-SKA-003): adicionar índice GIN em `skills.name` + `skills.slug` | 0.25d |
| TASK-E04 | Paginação na listagem (>200 skills) | 0.5d |
| TASK-E05 | Validação de vocabulário UI (RN-016): rodar validador contra labels/placeholders de `/skills` | 0.5d |

**Gate E:** Todas as CAs do spec.md passam em testes automatizados ou manuais documentados. DoD da constitution verificado.
