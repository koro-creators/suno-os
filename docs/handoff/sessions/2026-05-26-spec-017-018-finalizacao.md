# Handoff — 2026-05-26 — SPEC-017 e SPEC-018 finalizados

**Duração aproximada:** ~3h (2 sessões)
**Foco:** Criação das SPEC-017 (skills-admin) e SPEC-018 (clientes-admin) — 10 artefatos no total (5 por SPEC), seguido de correção de issues identificados pelo advisor.

## O que foi feito

- Criados todos os 10 artefatos (commit `89788f5`):
  - `docs/specs/large/skills-admin/` — constitution, spec, design, plan, tasks
  - `docs/specs/large/clientes-admin/` — constitution, spec, design, plan, tasks
- Corrigidos 3 issues do advisor (commit `1ce987c`):
  - SPEC-017 upstream: adicionadas refs SPEC-003 e SPEC-005 (donos de `workflow_steps`)
  - SPEC-018 design.md: view `client_metrics` reescrita em 2 fases (stub Fase A / view Fase C+), tabela real é `conversations` não `conversation_runs`
  - SPEC-018 design.md: ADR-LOCAL-05 adicionado documentando split intencional EN (API) / PT (UI)

## Decisões tomadas

- **system_prompt em `skills.system_prompt`** (ADR-LOCAL-01 SPEC-017): coluna direta na tabela `skills`, protegida por serializer dual (`SkillPublic` / `SkillAdmin`). Nunca exposta para P1/P2.
- **junction `skill_clients` compartilhada** (ADR-LOCAL-02): fonte única de verdade entre Skills Admin e Clientes Admin.
- **status enum PRE_ACTIVE/ACTIVE/ARCHIVED** (ADR-LOCAL-03 SPEC-018): prepara para FA-15 (Onboarding Automatizado).
- **client_metrics em 2 fases**: Fase A stub (zeros), Fase C+ view real aguarda `client_id` em `conversations` (TASK-A02 SPEC-018) e spec HITL para tabela `feedbacks`.
- **EN/PT naming split** (ADR-LOCAL-05 SPEC-018): `/api/clients` (EN) + `/clientes` UI (PT) — consistente com `api/main.py` existente.

## Arquivos modificados

- `docs/specs/large/skills-admin/constitution.md`
- `docs/specs/large/skills-admin/spec.md`
- `docs/specs/large/skills-admin/design.md`
- `docs/specs/large/skills-admin/plan.md`
- `docs/specs/large/skills-admin/tasks.md`
- `docs/specs/large/clientes-admin/constitution.md`
- `docs/specs/large/clientes-admin/spec.md`
- `docs/specs/large/clientes-admin/design.md`
- `docs/specs/large/clientes-admin/plan.md`
- `docs/specs/large/clientes-admin/tasks.md`

## Pendências

- `settings.FRONTEND_BASE_URL` e `settings.API_BASE_URL` ainda não adicionados em `api/config.py` (pendência de sessão anterior, não relacionada a estas SPECs)
- Worktree `research-sim-workflow` pode ser deletado após confirmação
- Proposta de adicionar `parcialmente-implementada` como valor válido em spec-conventions.md (opcional, commit separado)
- SPEC-018 Fase C precisa de uma spec HITL/Chat antes de criar a view `client_metrics` real — não bloqueante para Fases A/B/C do admin

## Próximo passo natural

Com SPEC-017 e SPEC-018 aprovadas, a Fase A de SPEC-017 (backend skills: migration + endpoints CRUD) pode começar. SPEC-018 Fase A tem dependência hard em SPEC-017 Fase A (junction `skill_clients`).

## Aprendizados / pegadinhas

- `workflow_steps` não tem `CREATE TABLE` explícito em nenhuma SPEC — SPEC-003 usa JSONB e SPEC-005 faz `ALTER TABLE`. Tratar SPEC-005 como dono funcional da estrutura relacional.
- Tabela `conversations` existe em `api/models/conversation.py` com nome `conversations` (não `conversation_runs`), sem `client_id`. Métricas de sessão requerem migração + spec futura.
- `feedbacks` não existe no backend ainda — nunca mencionada em models.
