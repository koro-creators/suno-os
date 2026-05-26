# Handoff — 2026-05-26 — Análise competitiva sim + SPEC-005/004 v1.1

**Duração aproximada:** ~3h  
**Foco:** Análise exhaustiva do repo simstudioai/sim e propagação de insights para SPEC-005 (Workflow Builder Canvas) e SPEC-004 (Aprovação Hierárquica) como novas decisões locais.

## O que foi feito

- **Commit de 69 arquivos** pendentes (status do projeto + handoffs + ADRs + specs)
- **Análise competitiva simstudioai/sim** → `docs/research/competitive-analysis/competitive-intel-simstudioai-sim.md` (commit `0f49fbf` no main)
  - Stack: TypeScript DAGExecutor próprio (não LangGraph), reactflow@^11 (legacy), Zustand v5 com 7 stores
  - 13 FR-CANDs identificados, 6 ADR-CANDs
- **SPEC-005 design.md v1.1** (commit `a947af2` no main):
  - ADR-LOCAL-06: cascade deactivation (DFS `compute_skipped_steps`)
  - ADR-LOCAL-07: separação de estado canvas geometry vs. `ExecutionStateContext`
  - ADR-LOCAL-08: 11 tipos de input MVP para `NodeConfigDrawer`
  - §6.2: algoritmo DFS + `skip_reason: branch_not_taken`
  - §6.3: `HITLResumeToken` dataclass + `generate_resume_token()`
  - §6.4–6.6: renumerados (Validator, Migration, Auto-layout)
  - §8.1: tag `skip_reason` em MLflow tracing
- **SPEC-004 design.md v1.1** (commit `a947af2` no main):
  - ADR-LOCAL-07: links diretos `request_url` em notificações EV-31
  - §1.3: NotificationDispatcher atualizado

## Decisões tomadas

- **Cherry-pick vs merge direto**: worktree branch divergia do main (main tinha evoluído SPEC-004 com ADR-LOCAL-05/06 sobre validators e hierarchy); resolvido editando main diretamente via Python script após abortar cherry-pick conflitante
- **ADR numeração no main**: SPEC-004 já tinha ADR-LOCAL-01..06, então o novo ficou ADR-LOCAL-07; SPEC-005 tinha ADR-LOCAL-01..05, adicionados 06/07/08
- **HITLResumeToken compartilhado**: campo `settings.FRONTEND_BASE_URL` agora usado por SPEC-004 (approval) e SPEC-005 (HITL workflow) — documentado como shared concern nos dois docs

## Arquivos modificados

- `docs/research/competitive-analysis/competitive-intel-simstudioai-sim.md` (criado)
- `docs/specs/large/workflow-builder-canvas/design.md` (v1.0 → v1.1)
- `docs/specs/large/approval-hierarchy/design.md` (v1.0 → v1.1)

## Pendências (não abertas como TODO)

- SPEC-005 ainda sem implementação: Fase A (DB migration: tabela `workflow_edges` + colunas `position_x/y` + `merge_policy`) é o próximo passo natural
- `settings.FRONTEND_BASE_URL` + `settings.API_BASE_URL` precisam ser adicionados em `api/config.py` — nenhum dos dois existe ainda
- Worktree `research-sim-workflow` ainda tem commits extras (os design.md updates) que **não foram merged** no main via merge/rebase — ficaram apenas os commits cherry-picked. O worktree pode ser deletado se não for mais usado

## Próximo passo natural

Iniciar **Fase A da SPEC-005**: criar migration Alembic para `workflow_edges` + `position_x/y` em `workflow_steps` + `merge_policy` em `workflow_steps`. Ver `docs/specs/large/workflow-builder-canvas/tasks.md` para TASK-A01..A05.

## Aprendizados / pegadinhas

- O worktree isolado tem seu próprio estado de git; cherry-pick para main pode conflitar se main evoluiu entre a criação do worktree e o cherry-pick
- `settings.FRONTEND_BASE_URL` não existe em `api/config.py` — SPEC-005 e SPEC-004 assumem que existirá; precisa ser adicionado antes de implementar NotificationDispatcher + HITLResumeToken
- sim usa `reactflow@^11` (legacy), não `@xyflow/react@^12` — código de sim NÃO é diretamente portável para o canvas do sunOS
