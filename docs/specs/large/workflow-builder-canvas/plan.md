---
spec-id: SPEC-005
slug: workflow-builder-canvas
artefato: plan
atualizada: 2026-04-30
versao: 1.0
status: rascunho
---

# Plan — Workflow Builder Canvas (SPEC-005)

Plano de implementação. Pré-requisito: ler `constitution.md`, `spec.md`, `design.md`. As tarefas atômicas vivem em `tasks.md`.

## 1. Stack Tecnológica

| Camada | Tecnologia | Versão | Status | Justificativa |
|--------|-----------|--------|--------|---------------|
| Frontend pages | Next.js 14 App Router | 14.x | já no projeto | Padrão sunOS |
| Frontend lang | TypeScript strict | 5.x | já no projeto | Padrão sunOS |
| Frontend canvas | `reactflow` | `^12.0.0` | **NOVA** | ADR-LOCAL-01; lazy-load |
| Frontend layout | `dagre` | `^0.8.5` | **NOVA** | ADR-LOCAL-01; lazy-load junto com reactflow |
| Frontend UI | CSS variables + inline styles + Lucide icons | — | já no projeto | Design system sunOS |
| Backend API | FastAPI | já no projeto | — | Padrão |
| Backend lang | Python 3.11 + uv | — | — | Padrão |
| Workflow engine | LangGraph StateGraph | já no projeto | — | ADR-001 / SPEC-003 (mantido) |
| Auto-layout backend | Python puro (~100 LoC) | — | NOVO (zero dep) | ADR-LOCAL-02 |
| DB | PostgreSQL 16 + SQLAlchemy + Alembic | — | já no projeto | — |
| Tracing | MLflow | — | já no projeto | — |
| Testes backend | pytest, pytest-asyncio, httpx | — | já no projeto | — |
| Testes frontend | Vitest + React Testing Library + Playwright + axe-core | — | já no projeto | — |
| Lint enforcement | ESLint custom rule | NOVO | — | ADR-LOCAL-05 |
| Bundle audit | `@next/bundle-analyzer` ou script com `next build --profile` | já no projeto / NOVA | — | NFR-WBC-02 |
| CI | GitHub Actions (existente) | — | — | — |
| Deploy | Cloud Run (frontend + backend) | — | — | — |

## 2. Fases

5 fases mergeáveis independentemente. Cada uma roda em staging antes da próxima. Estimativa total: 25–35 dias úteis para 1 eng frontend + 1 eng backend + 0.3 designer.

```
Fase A: Foundation (DB + endpoints + ESLint rule + bundle audit)
   ↓
Fase B: Backend DAG (compiler v2 + executor fan-out/merge + validator + migration)
   ↓
Fase C: Frontend Canvas (canvas + nodes + drawer + auto-save + auto-layout)
   ↓
Fase D: Migration de produção + sunset legacy
   ↓
Fase E: Polish (bundle audit, perf, a11y, E2E, sunset definitivo)
```

### Fase A — Foundation (3–5 dias)

**Objetivo.** Schema de DB, contratos de API, plumbing comum. Frontend e backend prontos para receber código novo sem ainda mudar comportamento.

**Pré-requisitos.**
- SPEC-003 em produção sem incidentes.
- CI rodando.
- Acesso a Cloud SQL staging.

**Entregáveis.**
1. Alembic migration `2026XXXX_workflow_canvas_v2.py` (ENT novos: `workflow_edges`; colunas `position_x/y`, `merge_policy` em `workflow_steps`; CHECK constraints).
2. SQLAlchemy ORM atualizado em `api/workflows/models.py`.
3. Schemas Pydantic novos em `api/workflows/schemas.py` (`WorkflowEdge`, `WorkflowStepV2`, `ValidationError`).
4. Skeleton de endpoints novos em `router.py`: GET/POST/DELETE `/edges`, POST `/auto-layout`, POST `/validate`, POST `/migrate-v2`. Retornam 501 Not Implemented inicialmente.
5. Frontend types em `lib/workflow-types.ts` (extensão).
6. Cliente HTTP em `lib/api.ts` com stubs para os novos endpoints.
7. ESLint custom rule `no-reactflow-outside-canvas.js` em `eslint-rules/`.
8. Bundle audit script `scripts/bundle-audit.sh` que falha se delta em rotas não-canvas exceder 30KB.

**Verificação.**
- Migration roda em staging + rollback limpo.
- `import { useNodesState } from 'reactflow'` em `app/page.tsx` falha o lint.
- `npm run build` mantém bundle sizes; bundle audit passa.

### Fase B — Backend DAG (5–7 dias)

**Objetivo.** Compiler aceita edges, executor faz fan-out + merge, validator detecta erros, migration JIT funciona. Tudo testado isoladamente.

**Entregáveis.**
1. `api/workflows/edges.py` — CRUD bulk com validação inline.
2. `api/workflows/validator.py` — DFS para ciclo + checks (fan_in_without_merge, merge_with_zero_inputs, edge_to_nonexistent_handle, unauthorized_tool, max_nodes_exceeded, **no_entry_node**). `validator.hard_validate_for_put()` retorna subset bloqueante para o handler do PUT.
3. `api/workflows/auto_layout.py` — layered layout em Python puro, ~100 LoC, determinístico.
4. `api/workflows/compiler.py` estendido com `_compile_v2_with_edges` + `_compile_v1_legacy` fallback.
5. `api/workflows/executor.py` estendido com wrapper para `merge_policy='any'` (cancela tasks) e error-handle routing.
6. `api/workflows/migration_v1_v2.py` — server-side JIT migration, idempotente.
7. Endpoints implementados (substituir 501 stubs).
8. Testes pytest cobrindo:
   - Compiler v1 vs v2 byte-equivalência (CA-26).
   - Fan-out 1→3 com latências diferentes (CA-09, CA-10).
   - Merge `all` agrega outputs (CA-11).
   - Merge `any` cancela tasks (CA-12).
   - Error handle routing (CA-13, CA-14).
   - Migration v1 → v2 idempotente + determinística (CA-24, CA-25, CA-30).
   - Validator detecta ciclo + fan_in_without_merge.

**Verificação.**
- Rodar workflow linear v1 existente via `_compile_v1_legacy` → executa igual.
- Rodar mesmo workflow após migration JIT via `_compile_v2_with_edges` → mesmo resultado.
- Workflow novo com fan-out + merge `all` executa em paralelo.

### Fase C — Frontend Canvas (10–15 dias)

**Objetivo.** Canvas funcional na rota `/workflows/[id]`. Todas as 7 categorias de node renderizam e editam. Auto-save e auto-layout funcionam. Validação visual.

**Entregáveis.**
1. `app/workflows/[workflowId]/page.tsx` reescrito como wrapper de `<WorkflowCanvas>`.
2. `app/workflows/new/page.tsx` reescrito para abrir `<WorkflowCanvas>` em modo novo.
3. `components/workflows/canvas/WorkflowCanvas.tsx` — raiz React Flow com `<ReactFlowProvider>`, custom node types, custom edge type.
4. 7 nodes em `components/workflows/canvas/nodes/`: ToolNode, LLMNode, ConditionNode, ActionNode, HITLNode, SubWorkflowNode, MergeNode.
5. `components/workflows/canvas/edges/CustomEdge.tsx` — cor por handle.
6. `components/workflows/canvas/panels/NodePalette.tsx` — sidebar drag source com filtro RBAC server-side.
7. `components/workflows/canvas/panels/NodeConfigDrawer.tsx` — substitui `WorkflowStepEditor` modal (mesmos campos, agora em drawer lateral).
8. `components/workflows/canvas/panels/CanvasToolbar.tsx` — zoom, fit, "Reorganizar", "Validar", "Executar".
9. Hooks: `useWorkflowAutoSave` (debounce 500ms + retry exponential 3x), `useGraphValidation` (DFS local), `useAutoLayout` (dagre wrapper, dynamic import).
10. `WorkflowsContext` (existente) atualizado para edges + positions.
11. Banner top do canvas com estado salvo/salvando/erro/validando.
12. Banner amber "Outro usuário editou há Xmin" (FR-WBC-13).
13. Testes Vitest cobrindo nodes individuais + hooks.

**Verificação.**
- Abrir workflow v2 com 5 nodes → renderiza em ≤500ms (Lighthouse local).
- Arrastar tool do palette → node criado.
- Conectar 2 nodes → edge persistido.
- Tentar criar ciclo → bloqueado localmente com toast.
- Editar campo no drawer → 500ms depois banner muda para "Salvo".
- Auto-layout reorganiza grafo determinísticamente.

### Fase D — Migration de produção + sunset legacy (3–5 dias)

**Objetivo.** Todos os workflows em produção migrados. Compiler v1 ainda como fallback (ainda não removido).

**Entregáveis.**
1. Script `api/scripts/migrate_workflows_v1_to_v2.py` — itera todos workflows, chama `migration_v1_v2.migrate(workflow_id)` em batch. Flag `--dry-run` e `--workflow-id` para teste isolado.
2. Run em staging → validar 100% migrados, abrir cada um manualmente para sanity check.
3. Run em produção (off-hours).
4. Dashboard MLflow query: `compiler_version=v1_fallback` deve cair para 0 após N horas.
5. Documentação operacional em `docs/specs/large/workflow-builder-canvas/runbook-migration.md`.

**Verificação.**
- 100% dos workflows com `metadata.canvas_v2_migrated=true`.
- Métrica `workflow_compile_total{version="v1_fallback"}` em zero por 1 sprint.
- Templates atuais abrem corretamente no canvas com layout coerente.

### Fase E — Polish (4–6 dias)

**Objetivo.** SPEC pronta para piloto pleno. Acessibilidade auditada. Bundle aprovado. E2E rodando.

**Entregáveis.**
1. Testes E2E Playwright em `e2e/workflow-canvas.spec.ts`:
   - Happy path: criar workflow novo → arrastar 3 tools → conectar com fan-out → merge all → executar → ver resultado.
   - Migration JIT: abrir workflow v1 → migration acontece → canvas renderiza.
   - Validation: criar grafo com ciclo → "Validar" exibe erro → corrigir → exibe OK.
2. Auditoria axe-core Level AA em T-21, T-22 — 0 violations.
3. Performance test: workflow com 50 nodes + 70 edges → render p95 ≤500ms.
4. Performance test: auto-save p95 ≤800ms.
5. Bundle audit: rotas não-canvas ≤30KB delta confirmado em PR.
6. CLAUDE.md (raiz) atualizado com seção sobre `components/workflows/canvas/` + lazy-load enforcement + sunset planejado.
7. README do módulo `components/workflows/canvas/README.md` com diagrama + como adicionar novo node type.
8. Handoff de fim de SPEC: `docs/handoff/sessions/YYYY-MM-DD-workflow-canvas-impl.md`.
9. **Sunset legacy** (após confirmação Heitor + 1 sprint sem fallback usado): migration que dropa colunas `next_step`, e remove `condition.then/else` (substitui por edges definitivamente). Compiler v1 removido. Esta sub-task vai pra V2.1 — agendar `/schedule` para 30 dias depois do deploy.

**Verificação.**
- DoD da SPEC (constitution §9) 100% checada.
- Lighthouse perf score ≥90 em `/workflows/[id]`.
- 0 violations axe.

## 3. Sequência e Dependências

```
        Fase A (Foundation)
              │
              ▼
        Fase B (Backend DAG)
              │
              ├──────────────┐
              │              │ (frontend pode começar com API mockada)
              ▼              ▼
        Fase C (Frontend Canvas) ◄── (dep mole de B)
              │
              ▼
        Fase D (Migration produção) ◄── exige B + C estáveis
              │
              ▼
        Fase E (Polish + sunset agendado)
```

**Paralelismos:**
- Designer trabalha em finetuning visual de nodes (cores, hierarquia, animações) durante Fase C.
- Backend pode iniciar testes de fan-out durante Fase B sem esperar frontend.
- Bundle audit + ESLint rule (Fase A) entram cedo no CI mesmo antes do canvas existir.

## 4. Riscos e Mitigações

| Risco | P | I | Mitigação |
|-------|---|---|-----------|
| Migration corrompe workflow em produção | B | A | Idempotente + transação atômica + backup pré-fase-D + dry-run obrigatório |
| Auto-layout produz layout horrível em DAG complexo | M | B | Aceitar para migração; usuário tem botão "Reorganizar" no canvas (dagre JS) |
| Bundle de reactflow vaza para outras rotas | M | M | ESLint rule + bundle audit CI; ambos enforced em pre-commit |
| Compiler v2 quebra retrocompat em workflow exótico | B | A | Teste de invariância (CA-26) + 1 release de fallback v1 |
| User com sessão concorrente perde alterações | M | M | Banner amber documentado em FR-WBC-13 + recomendação no docs |
| LangGraph não suporta cancelamento limpo de tasks | B | M | ADR-LOCAL-04 com wrapper externo via asyncio.wait |
| ESLint custom rule tem bugs e bloqueia código legítimo | M | B | Testar a própria regra; whitelist de paths |
| Migration JIT lenta para workflows muito grandes (raros) | B | B | Cap de 20 steps; auto-layout simples; tempo aceitável |
| Cliente piloto reclama de UX no canvas | M | M | Designer em Fase C; iteração rápida em staging com Heitor antes de prod |

## 5. Definição de Pronto (Definition of Done)

A SPEC só é "pronta para piloto pleno" quando:

- [ ] Todos os CAs do `spec.md` §7 passam em staging (testes automatizados).
- [ ] Migration de produção completa (Fase D); `metadata.canvas_v2_migrated=true` em 100%.
- [ ] Métrica `workflow_compile_total{version="v1_fallback"}` em zero por 1 sprint.
- [ ] Bundle audit passa em CI.
- [ ] axe-core Level AA: 0 violations.
- [ ] Lighthouse perf ≥90 em `/workflows/[id]`.
- [ ] CLAUDE.md atualizado.
- [ ] Templates atuais (4 em produção) abrem e executam no canvas.
- [ ] Handoff documentado.
- [ ] `/schedule` para sunset legacy criado (30 dias após deploy).

## 6. Definição de Pronto por Fase (gates)

| Fase | Gate |
|------|------|
| A | Migration roda + endpoints respondem 501; ESLint rule bloqueia import errado; bundle audit no CI |
| B | Compiler v1↔v2 byte-equivalente; fan-out paraleliza; merge `any` cancela; CA-09..14, 24..30 passam |
| C | Canvas renderiza; CA-01..23 passam; auto-save e auto-layout funcionam |
| D | 100% workflows migrados; métrica `v1_fallback` zera; templates OK |
| E | DoD (§5) 100%; piloto liberado |

## 7. Equipe sugerida

| Papel | Alocação | Foco |
|-------|----------|------|
| Eng Backend Sr | 100% | Fases A, B, D — compiler/executor/migration |
| Eng Frontend Sr | 100% | Fases A, C, E — canvas + nodes + auto-save + a11y |
| Designer | 30% | Fase C — visual de nodes, hierarquia, microinterações |
| QA / SRE | 20% | Fase E — E2E, perf test, bundle audit, dashboard |

## 8. Cronograma estimado

```
Sprint 1 (sem 1):    Fase A
Sprint 2 (sem 2):    Fase B (backend DAG)
Sprint 3 (sem 3):    Fase C parte 1 (nodes + canvas básico)
Sprint 4 (sem 4):    Fase C parte 2 (drawer + auto-save + auto-layout)
Sprint 5 (sem 5):    Fase D (migration produção)
Sprint 6 (sem 6):    Fase E (polish)
                       └── Piloto pleno

Sprint 10 (mês 2.5): /schedule dispara — sunset legacy (drop colunas v1)
```

6 semanas calendário ≈ 30 dias úteis. Bate com estimativa preliminar.

## 9. Dependências externas

| Dep | O que precisa | Quando |
|-----|---------------|--------|
| FA-09 RBAC | Roles disponíveis no JWT/contexto | já existe |
| Cloud SQL staging | Acesso para migration testing | já existe |
| Cloud Scheduler | Sem mudança | já configurado |
| MLflow | Tags novas (compiler_version, parallel_group_id) | Fase B |
| Designer disponível | Fase C visual review | confirmar antes |

## 10. Changelog

| Versão | Data | Mudança |
|--------|------|---------|
| 1.0 | 2026-04-30 | Versão inicial — 5 fases A–E mapeadas; DoD + gates por fase; cronograma 6 sprints |
