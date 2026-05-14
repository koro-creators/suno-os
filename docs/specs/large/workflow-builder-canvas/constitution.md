---
spec-id: SPEC-005
slug: workflow-builder-canvas
artefato: constitution
atualizada: 2026-04-30
versao: 1.0
status: rascunho
substitui: SPEC-003 (docs/specs/large/workflow-builder/)
escopo:
  projeto: sunos
  stack: "Frontend: Next.js 14 + TypeScript + React Flow | Backend: FastAPI + LangGraph + Python 3.11"
  autor: Heitor Miranda
  papel: Tech Lead
  branch: master
  contexto: Substituir UI do Workflow Builder (lista linear de steps) por canvas drag-and-drop com React Flow + estender data model + compiler + executor para DAG paralelo (fan-out + merge + handles tipados).
upstream:
  - docs/prd/parte1-feature-map.md (FA-05)
  - docs/ux/parte1-inventario-telas.md (T-21, T-22, T-23)
  - docs/srd/parte6-arch-to-be.md (CTM-02 — Knowledge & Skills inclui workflow compiler/executor)
  - docs/specs/large/workflow-builder/ (SPEC-003 substituída — princípios herdados + reversão da decisão "não é DnD")
predecessor_decision_reversed:
  - "SPEC-003 constitution §'O Que NAO E', linha 81: 'Nao e drag-and-drop visual de nodes. E uma lista de steps configuraveis.' — esta SPEC reverte essa decisão."
---

# Constitution — Workflow Builder Canvas (SPEC-005)

Princípios imutáveis. Esta SPEC **reverte** uma decisão histórica da SPEC-003 (lista linear → canvas DnD) e **estende** o data model de workflows para DAG genuíno. O resto da SPEC-003 (engine LangGraph única, tools compartilhadas, HITL nativo, schedule-first, MLflow desde dia zero) **continua valendo** — o canvas é uma reescrita de UI + extensão de capacidade, não um produto novo.

## 1. Princípios herdados da SPEC-003 (continuam valendo, sem mudança)

1. **LangGraph é a única engine.** Cada workflow definition compila para um `StateGraph`. Nada de orquestrador alternativo, nada de runtime customizado. Se o canvas não consegue ser expresso em LangGraph, o canvas perde — não o LangGraph.
2. **Tools são compartilhadas com o chat.** As tools do `api/chat/tools/*` são as mesmas disponíveis no builder. Nova tool no chat ⇒ nova tool no canvas automaticamente, sem nova rota nova de cadastro.
3. **Workflows são dados, não código.** Definições JSON em PostgreSQL → compiler em runtime. Sem code-gen, sem deploy por workflow.
4. **HITL nativo.** `interrupt()` + `Command(resume=...)` do LangGraph. HITL é um tipo de node como outro qualquer no canvas.
5. **Schedule-first.** A maioria dos workflows roda via Cloud Scheduler. Execução manual ("rodar agora") é secundária.
6. **Templates aceleram adoção.** Os templates atuais (Report Mensal, Plano de Mídia, Monitor de Anomalias) sobrevivem à migração e abrem direto no canvas.
7. **Eval e logging desde o dia zero.** MLflow trace por execução, log por step. Nada falha silenciosamente.

## 2. Princípios novos desta SPEC

1. **Edge é cidadão de primeira classe.** Era implícito (`step.next_step` + `condition.then/else`). Agora é uma tabela `workflow_edges` separada com `source_handle` e `target_handle` explícitos. Se o usuário desenha 3 edges saindo do mesmo node = 3 linhas em `workflow_edges`. Não há "next_step implícito" no schema novo.
2. **Coordenadas são parte do workflow.** `position_x/y` em `workflow_steps` não é cosmético — é a fonte de verdade do layout. Sem coordenadas, o canvas precisa rodar auto-layout, que não é determinístico em todos os casos. Um workflow salvo em coordenadas A,B é renderizado **idêntico** em qualquer abertura.
3. **Compiler aceita só DAGs acíclicos.** Detecção de ciclo é validação síncrona no save (frontend faz pré-check com `useGraphValidation`; backend re-valida no compiler). Workflow com ciclo retorna 400 com lista de edges que formam o ciclo. Loops são fora-de-escopo (V2).
4. **Handle `out` é universal.** Todo node tem um handle de saída padrão chamado `out` (verde). Tools/LLMs/Actions/SubWorkflows têm um handle adicional opcional `error` (vermelho) para roteamento de exceção. Conditions têm `then`/`else` no lugar de `out` (não coexistem). HITL tem `approved`/`rejected`/`modified` no lugar de `out`. MergeNode usa `out` único. Migration v1→v2 converte `next_step` em edge com `source_handle='out'` para qualquer tipo (sem special-case por tipo).
5. **Fan-out paralelo usa `asyncio.gather`.** N edges saindo do mesmo `source_handle` (tipicamente `out`) de um node ⇒ executor faz `await asyncio.gather(*next_steps)`. Latência de fan-out = `max(latencies)`, não soma.
6. **Merge é explícito.** `MergeNode` (novo step type `merge`) com `merge_policy ∈ {'all', 'any'}`. `all` = `asyncio.gather` (espera todos); `any` = `asyncio.wait(..., FIRST_COMPLETED)` (primeiro vence; outros são cancelados). Sem merge implícito; se um node recebe N edges sem ser MergeNode, é erro de validação.
7. **Handle `error` em tool/llm/action/workflow steps é opcional.** Por default (sem edge saindo de `error`), exceção sobe e mata o run. Se houver edge saindo de `error`, executor captura e roteia em vez de falhar. Isso **não** é try/catch genérico (V2) — é só roteamento.
8. **Canvas é a única UI do builder.** A lista linear da SPEC-003 sai. Não há "modo lista" como fallback. Mobile é V2 (canvas em telas <768px mostra read-only com aviso).
9. **React Flow lazy-loaded.** Bundle só carrega na rota `/workflows/[workflowId]`. Demais rotas têm delta ≤30KB. Validação obrigatória no CI (bundle audit).
10. **Auto-layout é open-source.** `dagre` (MIT, ~80KB) cobre 100% dos casos do MVP. Sem `xyflow Pro` (paywall + lock-in).
11. **Migration é one-shot + retrocompat de 1 release.** Workflows existentes ganham coordenadas e edges via script idempotente. Compiler aceita ambos formatos por 1 release; depois remove fallback. Ninguém perde workflow no caminho.

## 3. Princípios de Segurança e Governança

1. **RBAC do FA-09 vale.** Quem pode criar/editar/deletar workflows hoje é o mesmo conjunto após canvas. Nenhuma elevação implícita.
2. **Cross-client guard.** `workflow.client_id` filtra todas as queries; usuário não vê workflow de cliente fora do scope. 404 (não 403) para acesso indevido.
3. **Limites continuam valendo.** Max 20 nodes por workflow (era max 20 steps). Max 5min de execução. Budget por execução continua na SPEC-003.
4. **Não vazar tools privadas no canvas.** O `NodePalette` (lista de tools arrastáveis) respeita RBAC: tools restritas a roles específicas só aparecem para esses roles.
5. **Imutabilidade de runs.** `workflow_runs` e `workflow_step_logs` continuam imutáveis após conclusão. Canvas não toca nisso.

## 4. Princípios de Vocabulário (Suno)

- **Usar:** Workflow, Canvas, Node, Edge, Handle, Fan-out, Merge, Validador, Aprovador (quando HITL é aprovação), Operacional, Líder, Sócio.
- **Nunca usar em copy de UI:** "gerar", "otimizar", "eficiência", "accelerator", "smart", "AI-powered". Sempre **Koro com K**.
- "Drag-and-drop" e "canvas" são jargões técnicos aceitáveis em docs internos; nas copies de UI preferir "arraste" / "tela do workflow" / "área de edição".

## 5. Padrões Obrigatórios

### 5.1. Frontend (`app/workflows/`, `components/workflows/canvas/`)

- **Linguagem:** TypeScript strict.
- **Framework:** Next.js 14 App Router. Canvas é Client Component (precisa de DOM/animações).
- **Lib canvas:** `reactflow@^12` (MIT, free) + `dagre@^0.8.5` (auto-layout). Carregadas via `next/dynamic` apenas em `app/workflows/[workflowId]/page.tsx`.
- **Estilização:** CSS variables do design system sunOS. React Flow estiliza via classNames + CSS — sem Tailwind classes novas. Tema dark por default; light mode honra `--void/--deep/--nebula` etc.
- **Estado:** estado do grafo via hooks do React Flow (`useNodesState` / `useEdgesState`). Zustand é detalhe interno da lib — não importar `zustand` diretamente. `WorkflowsContext` (existente) continua para listagem/CRUD de meta-info do workflow.
- **Persistência:** debounced save (500ms após última edição) via PUT no backend. Banner "Salvando…" / "Salvo às hh:mm" no canvas.
- **Acessibilidade:** keyboard nav obrigatória (Tab para focar nodes, Enter para abrir drawer, Delete para remover). React Flow já tem suporte; apenas validar e não desabilitar.

### 5.2. Backend (`api/workflows/`)

- **Linguagem:** Python 3.11+, type hints completos.
- **Framework:** FastAPI. Endpoints existentes mantidos; novos endpoints para edges (`/edges`) e auto-layout (`/auto-layout`).
- **DB:** PostgreSQL via SQLAlchemy 2.0 + asyncpg + Alembic. Nova migration adiciona `workflow_edges` e colunas em `workflow_steps`; **não dropa** `next_step` ou `condition.then/else` ainda.
- **Compiler.** `api/workflows/compiler.py` evolui: lê edges (preferência) ou cai para `next_step`/`condition` (fallback de 1 release). Erro de ciclo retornado como `WorkflowValidationError` com lista de edges.
- **Executor.** `api/workflows/executor.py` usa `asyncio.gather` para fan-out, `asyncio.wait` com FIRST_COMPLETED para `merge_policy='any'`, `asyncio.gather` para `merge_policy='all'`. Cancela tasks pendentes em `any`.
- **Tracing:** MLflow span por node. Tags: `workflow_id`, `run_id`, `step_id`, `step_type`. Fan-out aparece como spans paralelos (validar visualmente no dashboard).
- **Testes:** pytest com cobertura 90% no compiler, 85% no executor. Teste explícito para cada combinação (linear, fan-out, merge-all, merge-any, error-handle, condition).

### 5.3. Convenções de nomes

- **Frontend:** `components/workflows/canvas/` para tudo do canvas. Subdirs: `nodes/`, `edges/`, `panels/`, `hooks/`. Componentes em PascalCase.
- **Backend:** `api/workflows/edges.py` (CRUD edges), `api/workflows/auto_layout.py` (chamada server-side ao dagre via Python alternativo, ou frontend-only — ver design.md ADR-LOCAL-02), `api/workflows/migration_v1_to_v2.py` (script).
- **Migration script:** `api/scripts/migrate_workflows_v1_to_v2.py` — idempotente, com flag `--dry-run`.

## 6. Dependências Aprovadas

### Frontend (NOVAS — exigem ADR explícito em `design.md`)

| Lib | Versão | Tamanho gz | Motivo | Mitigação |
|-----|--------|-----------|--------|-----------|
| `reactflow` | `^12.0.0` | ~50KB | Canvas DnD com nodes/edges customizados, panning/zoom/minimap | `next/dynamic` lazy-load apenas em `/workflows/[workflowId]`; bundle audit no CI |
| `dagre` | `^0.8.5` | ~80KB | Auto-layout determinístico (Sugiyama/layered) | Lazy-load junto com reactflow |

### Frontend (continuam valendo)

- Lucide React (icons) — já em uso.
- Sem novas deps de form/state — usar Zustand interno do React Flow.

### Backend (continua valendo)

- Tudo que SPEC-003 já listou: `fastapi`, `langgraph`, `langchain-*`, `sqlalchemy`, `asyncpg`, `mlflow`, `google-cloud-scheduler`, `croniter`. Nenhuma dependência nova nesta SPEC.

## 7. Anti-patterns Proibidos

1. **Não introduzir loops no canvas.** Tier 1 explicitamente exclui loops (decisão #3 do brainstorming). Se a UI permitir desenhar uma volta para um node anterior, validador rejeita no save com erro claro.
2. **Não permitir merge implícito.** Um node com 2 edges entrando que **não seja** MergeNode é erro de validação. Forçar o usuário a colocar Merge explícito quando há fan-in.
3. **Não usar `xyflow Pro`** mesmo quando uma feature tentadora aparecer. Open source cobre tudo do MVP; lock-in não vale.
4. **Não bypassar lazy-load do React Flow.** Importar `from 'reactflow'` em qualquer arquivo fora de `components/workflows/canvas/` é erro de lint (regra ESLint custom obrigatória).
5. **Não dropar colunas legadas (`next_step`, `condition.then/else`) na mesma release.** Drop é fase posterior, depois de 1 release de retrocompat.
6. **Não fazer auto-save sem debounce.** 500ms mínimo. Cada movimento de mouse do usuário não é um POST.
7. **Não permitir undo/redo nesta SPEC.** É V2 (decisão #3 do brainstorming). Mudanças estruturais (add/remove node, criar edge) e movimentos de node NÃO têm undo no MVP. Se React Flow expuser undo nativo de positions em release futura, OK aceitar; do contrário, não implementar manualmente.
8. **Não permitir colaboração realtime entre múltiplos usuários.** Lock pessimista no save (último write wins por default; banner de aviso "Outro usuário editando" se outro user abriu há <5min).
9. **Não exibir tools indisponíveis para o user no NodePalette.** RBAC server-side filtra; frontend não pode mostrar e depois falhar no save.
10. **Não mudar shape do `StateGraph` produzido pelo compiler para workflows linear.** Workflow sem fan-out deve compilar para o mesmo `StateGraph` que produzia antes — invariante de retrocompat. Teste explícito.

## 8. Compatibilidade com SPEC-004 (FA-13 Aprovação Hierárquica)

Workflows podem ser submetidos para aprovação como `subject_type='workflow_output'` (SPEC-004 já cobre isso). O canvas não muda nada disso — apenas garante que o `workflow_output` produzido contém metadata suficiente (workflow_id, run_id) para o BrandValidator/PortuguêsValidator não falharem ao buscar contexto.

## 9. Critérios de Pronto (DoD da SPEC)

A SPEC só é "pronta para piloto" quando:

- [ ] Migration aplicada em staging; 100% dos workflows pre-existentes abrem no canvas sem corrupção.
- [ ] Os 4 templates atuais abrem no canvas e executam com mesmo resultado de antes.
- [ ] Compiler tem teste de equivalência: para um workflow linear, o compiler v2 (lendo `workflow_edges`) produz `StateGraph` estruturalmente equivalente ao compiler v1 (lendo `next_step` / `condition.then|else`). "Estruturalmente equivalente" = mesma lista de tuplas `(source_node, target_node)` no builder do `StateGraph`.
- [ ] Executor tem teste de fan-out: workflow com 3 branches paralelas executa em `max(t1,t2,t3)`, não soma.
- [ ] Bundle audit: rotas que **não** são `/workflows/[workflowId]` têm delta ≤30KB no bundle.
- [ ] Auto-layout determinístico: mesmo workflow → mesmas coordenadas em 100% das runs.
- [ ] Canvas com 50 nodes + 70 edges renderiza em ≤500ms (perf budget).
- [ ] Acessibilidade: 0 violations axe-core Level AA.
- [ ] CLAUDE.md atualizado com nota sobre lazy-load enforcement.
- [ ] SPEC-003 marcada como substituída em todos os 5 artefatos (✅ feito hoje).
- [ ] Handoff de fim de SPEC criado.

---

**Tudo o que vier a seguir (`spec.md`, `design.md`, `plan.md`, `tasks.md`) deve obedecer literalmente este documento.**
