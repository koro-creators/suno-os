# Competitive Intelligence — simstudioai/sim
**Data:** 2026-05-21
**Analista:** Claude Sonnet 4.6 (subagent research + síntese)
**Repo analisado:** https://github.com/simstudioai/sim
**Contexto:** Análise crítica e exaustiva para subsidiar a implementação da SPEC-005 (Workflow Builder Canvas) do sunOS.

---

## Aviso Estratégico (ler antes do resto)

**1 — Nenhum LangGraph.** O sim não usa LangGraph. O executor é TypeScript customizado (DAGExecutor + NodeOrchestrator + LoopOrchestrator + ParallelOrchestrator + BlockExecutor + EdgeManager). Os *conceitos* são portáveis, o *código* não. Para o sunOS (Python + LangGraph), o executor precisa ser reimplementado do zero — mas o sim é referência arquitetural excelente para o *quê* implementar, não para o *como* copiar.

**2 — ReactFlow v11 vs. v12.** O sim usa `reactflow@^11.11.4` (pacote legado). O sunOS já decidiu usar `@xyflow/react` (v12+, SPEC-005). São a mesma lib com renaming e breaking changes de API. Padrões de implementação portam; imports e alguns hooks não. Nunca copiar imports diretamente.

**3 — Escopo superior ao nosso MVP.** O sim tem colaboração realtime, loops de 4 tipos, 350+ block types, undo/redo, sandbox de código, versionamento de deploy, billing. Tudo isso é V2 ou fora-de-escopo explícito do sunOS MVP (SPEC-005 frontmatter `fora_escopo`). Use o sim como referência de *onde chegaremos*, não como spec do que entregar agora.

---

## 1. Stack Tecnológico

### 1.1 Comparativo

| Camada | simstudioai/sim | sunOS SPEC-005 | Gap / Decisão |
|--------|-----------------|----------------|---------------|
| Framework frontend | Next.js (App Router) | Next.js 14 (App Router) | Alinhado |
| Canvas lib | `reactflow@^11.11.4` | `@xyflow/react@^12` | Sim usa versão legada; sunOS correto |
| State (canvas) | Zustand v5 (7 stores) | hooks nativos React Flow | **Gap crítico** — 7 stores cobre casos que useNodesState não cobre |
| State (server) | TanStack Query | — | sunOS não tem; pode precisar para polling de execuções |
| UI components | Radix UI + Tailwind | CSS variables + Lucide | Abordagens diferentes, ambas OK |
| Auto-layout | Server-side (algoritmo oculto) | dagre client-side | sunOS: transparência via dagre é vantagem de controle |
| ORM/DB | Drizzle ORM + PostgreSQL | SQLAlchemy 2 + PostgreSQL | Stacks diferentes, schema portável |
| Execução | TypeScript DAGExecutor (customizado) | LangGraph StateGraph | Reimplementação total necessária — mas LangGraph já entrega 70% |
| Background jobs | Trigger.dev | Cloud Scheduler (existente) | sunOS já tem scheduler; sem gap para MVP |
| Realtime/collab | Socket.io + Redis adapter | Não existe (V2 explícito) | Não bloqueante para MVP |
| LLMs | OpenAI, Anthropic, Google, Groq, AWS Bedrock, Azure, Ollama, vLLM | Gemini Flash default, GPT-4o, Claude | Mesmo padrão multi-provider |
| Tracing | Custom instrumentation | MLflow | sunOS: vantagem — MLflow é mais robusto |
| Tests | Vitest (arquivos 30–114KB por módulo) | pytest 90% compiler, 85% executor | Sim tem cobertura séria; ver estrutura em §7.2 |
| Monorepo | Turborepo 2.9 | — | Não relevante |
| Linter | Biome 2.0 | TypeScript strict + next lint | Biome é mais rápido; avaliar em ADR futuro |

### 1.2 Dependências do sim não decididas no sunOS

- `framer-motion` — animações de nodes/panels. sunOS usa 150ms CSS transitions. Para MVP: desnecessário.
- `TanStack Query` — server state com polling. Para canvas com execuções em andamento (colorir nodes durante run): pode ser necessário.
- `Socket.io` — collaborative editing. SPEC-005 `fora_escopo`. Sem impacto no MVP.
- `E2B` + `isolated-vm` — sandbox de código para function blocks. sunOS não tem function blocks no MVP.

---

## 2. Arquitetura de Workflows — O Mais Importante

### 2.1 Data Model Comparado

**Schema do sim (`workflow_blocks` + `workflow_edges`):**
```sql
workflow_blocks:
  id, workflowId, type, name
  positionX, positionY, height
  enabled, horizontalHandles, isWide, advancedMode
  subBlocks (JSONB)   -- parâmetros configurados pelo usuário
  outputs (JSONB)
  data (JSONB)

workflow_edges:
  id, workflowId
  sourceBlockId, targetBlockId
  sourceHandle, targetHandle
```

**Schema do sunOS SPEC-005 (planejado):**
```sql
workflow_steps:
  id, workflow_id, step_type, name
  position_x, position_y          -- NOVO nesta SPEC
  merge_policy                    -- NOVO nesta SPEC
  [campos existentes: tool_id, config, next_step (legado)]

workflow_edges:                   -- NOVA tabela
  id, workflow_id
  source_step_id, target_step_id
  source_handle, target_handle
```

**Avaliação crítica:** Os schemas são quase idênticos no que importa. O sim usa `subBlocks JSONB` (sem colunas de configuração individuais), o que dá mais flexibilidade para block types heterogêneos — adicionar um novo campo a um block type não exige migration. O sunOS tem colunas mais rígidas. **ADR-CAND-006: Avaliar migração de config de steps para JSONB** à medida que o número de step types crescer.

### 2.2 Serialization Format — Padrão Mais Valioso para Copiar

O sim tem formato de serialização intermediário entre UI state e execução:

```typescript
// SerializedWorkflow (sim)
{
  version: "1.0",
  blocks: [{
    id: string,
    position: { x, y },
    config: { tool: string, params: Record<string, unknown> },
    inputs: Record<string, ParamType>,
    outputs: Record<string, ParamType>,
    metadata: { id, name, category, color },
    enabled: boolean
  }],
  connections: [{
    source: string,
    target: string,
    sourceHandle?: string,
    targetHandle?: string,
    condition?: { type: 'if'|'else'|'else-if', expression?: string }
  }],
  loops: Record<string, SerializedLoop>,       // sunOS: fora-de-escopo MVP
  parallels?: Record<string, SerializedParallel>
}
```

O sunOS tem o equivalente no `WorkflowDefinition` atual, mas sem separação clara entre estado da UI e payload de execução. O sim tem um `Serializer` dedicado (`serializer/index.ts`) que faz essa conversão com testes próprios (30KB de testes). **FR-CAND-001: Serializer dedicado** que converte graph state para payload de execução.

### 2.3 Handles e Tipos de Edges — Comparativo Direto

O sim define handles como constantes em `executor/constants.ts`:

| Handle (sim) | Equivalente sunOS SPEC-005 | Decisão |
|---|---|---|
| `SOURCE` | `out` (universal) | sunOS: nomenclatura mais clara |
| `ERROR` | `error` | Idêntico |
| `CONDITION_TRUE`, `CONDITION_FALSE`, `condition-{id}` | `then`, `else` | sunOS: mais semântico |
| `router-{routeId}` | — | sunOS não tem router block no MVP |
| `LOOP_CONTINUE`, `LOOP_EXIT` | — | Fora-de-escopo |
| `PARALLEL_CONTINUE`, `PARALLEL_EXIT` | — | sunOS usa MergeNode explícito — design superior |
| `DEFAULT` | — | sunOS usa `out` universal |

**Achado crítico:** O sim usa `PARALLEL_CONTINUE`/`PARALLEL_EXIT` como handles especiais de container de paralelo — conceito abstrato que o usuário precisa entender. O sunOS usa `MergeNode` explícito, que é *mais legível* e *mais ensinável*. **O design do sunOS é superior aqui** — o usuário vê um node "Merge" no canvas, não um conceito invisível de "container de paralelo".

### 2.4 Pipeline de Execução — Referência para LangGraph

O pipeline do sim tem 5 etapas sequenciais:

```
UI State
   ↓ Serializer (converte subBlocks JSONB → SerializedWorkflow)
SerializedWorkflow
   ↓ DAGBuilder (constrói grafo, processa loop/parallel containers)
DAG (nodes + edges estruturados)
   ↓ DAGExecutor (monta pipeline: VariableResolver + BlockExecutor + Orchestrators)
ExecutionContext
   ↓ ExecutionEngine (queue-based, nodes executam quando incoming edges satisfeitas)
NormalizedBlockOutput[] por node
   ↓ EdgeManager (cascade deactivation, determina próximos nodes)
Próxima rodada do scheduler
```

**Mapeamento para o sunOS (Python + LangGraph):**

| Componente sim | Equivalente sunOS | Status |
|---|---|---|
| `Serializer` | `api/workflows/compiler.py` (estendido) | Já existe, estender |
| `DAGBuilder` | LangGraph `StateGraph` builder | Já existe |
| `DAGExecutor` / `ExecutionEngine` | LangGraph runtime | Já existe |
| `EdgeManager` | Condição de roteamento em cada nó do StateGraph | **Falta cascade deactivation** |
| `ParallelOrchestrator` | `asyncio.gather` | SPEC-005 §5.2 já especifica |
| `LoopOrchestrator` | — | Fora-de-escopo |

**O sim confirma que a arquitetura do sunOS está correta.** LangGraph já entrega 70% do que o sim construiu em TypeScript customizado.

### 2.5 Cascade Deactivation — Gap Crítico Não Documentado

O `EdgeManager` do sim tem um conceito ausente da SPEC-005: **cascade deactivation**. Quando um `condition` block toma o ramo `then`, todos os nodes reachable *apenas* pelo ramo `else` são marcados como `deactivated` — não executam, mas são reportados no log com status `skipped`. Isso permite visualizar qual branch foi tomada na UI sem ambiguidade.

Sem isso, o canvas de execução do sunOS não consegue colorir nodes "não-executados" — eles simplesmente não aparecem no log, e o usuário não sabe se foram pulados ou se falharam silenciosamente.

**ADR-CAND-001: Implementar cascade deactivation no executor.** O executor do sunOS precisa, ao resolver um `condition`, marcar todos os nodes downstream do branch não-tomado com `status: skipped` e registrar `step_logs` com motivo `"condition not met"`.

### 2.6 Tipos de Block/Node Disponíveis no sim (350+)

Categorias relevantes para o sunOS MVP comparadas com o que temos:

| Categoria | sim | sunOS MVP | Gap |
|---|---|---|---|
| Triggers | `api_trigger`, `chat_trigger`, `manual_trigger`, `start_trigger` | start node (manual) | sem `chat_trigger` ainda |
| Control Flow | `condition`, `router`, `parallel_ai`, `wait` | `condition`, `MergeNode` | sem `wait` (time-based pause) |
| AI/LLM | `agent` (multi-turn, tools, streaming, memory) | LLM node | Alinhado |
| Utility | `function` (JS/Python sandbox), `workflow` (sub-workflow), `knowledge` (RAG), `variables` | `workflow` (parcial) | Faltam `function`, `knowledge`, `variables` |
| Integrações | 100+ (Slack, Google, Meta, Salesforce, Jira, etc.) | tools da Biblioteca | Modelo diferente — sunOS usa biblioteca de skills |

---

## 3. Frontend Canvas — Padrões Copiáveis

### 3.1 Custom Node (WorkflowBlock) — Arquivo de Referência Máxima

O `workflow-block.tsx` do sim (57KB) é a referência mais completa que existe para custom nodes com React Flow em produção. Padrões diretamente portáveis:

**3.1.1 Dimensões determinísticas (sem ResizeObserver)**

```typescript
// sim: cálculo determinístico, sem jitter, sem re-render contínuo
const dimensions = calculateWorkflowBlockDimensions({ subBlocks, isWide, advancedMode })
node.style = { width: dimensions.width, height: dimensions.height }
// NÃO usar ResizeObserver — causa loop de re-render durante auto-layout
```

**FR-CAND-002: Usar cálculo determinístico de dimensões.** Sem isso, o auto-layout vai causar jitter visual porque cada ResizeObserver trigger causa um re-render que pode mudar a dimensão que causa outro trigger.

**3.1.2 Handle positioning por índice**

Para nodes com múltiplos handles (condition, HITL), o sim posiciona via constantes:
```typescript
const handleY = CONDITION_START_Y + (index * CONDITION_ROW_HEIGHT)
```

O sunOS precisa do mesmo para handles `then`/`else` de condition nodes e `approved`/`rejected`/`modified` de HITL nodes. **Copiar este padrão verbatim** na implementação do `ConditionNode` e `HitlNode`.

**3.1.3 `updateNodeInternals()` quando handle orientation muda**

O sim chama `updateNodeInternals()` do React Flow quando `horizontalHandles` muda — força recálculo de posições de handles. O sunOS precisará do mesmo se handles forem opcionais (ex: handle `error` que aparece/desaparece quando o usuário conecta ou não).

**3.1.4 Drag handle via classe CSS (não prop do React Flow)**

```tsx
<div className="workflow-drag-handle" style={{ cursor: 'grab' }}>
  {/* header do node */}
</div>
```

Usar classe CSS dedicada permite definir exatamente qual área é draggable (só o header, não o body com inputs).

**3.1.5 Self-connection guard no `onConnect`**

O sim tem `wouldCreateCycle()` chamado antes de aceitar uma edge — detecção de ciclo síncrona, client-side, antes de chamar o backend. A SPEC-005 especifica detecção de ciclo mas não onde. **Implementar no `onConnect` handler do React Flow, síncrono.**

### 3.2 Custom Edge (WorkflowEdge)

**3.2.1 `getSmoothStepPath` com offsets explícitos**
```typescript
getSmoothStepPath({
  sourceX, sourceY, sourcePosition,
  targetX, targetY, targetPosition,
  borderRadius: 8,
  offset: { horizontal: 30, vertical: 20 }
})
```
Valores bons para o sunOS. Copiar.

**3.2.2 Delete button via EdgeLabelRenderer**
```tsx
// Posicionado no midpoint da edge, aparece apenas quando edge está selecionada
<EdgeLabelRenderer>
  <button
    style={{ transform: `translate(-50%, -50%) translate(${midX}px,${midY}px)` }}
    onClick={() => deleteEdge(id)}
  >
    <X size={14} />  {/* Lucide, strokeWidth 1.5, alinhado com design system sunOS */}
  </button>
</EdgeLabelRenderer>
```

Este é o padrão correto para o sunOS. Renderizar no DOM via `EdgeLabelRenderer`, não no SVG (que tem limitações de eventos de mouse).

**3.2.3 Error edge styling**
```typescript
const isErrorEdge = sourceHandle === 'error'
const stroke = isErrorEdge ? 'var(--text-error)' : 'var(--workflow-edge)'
const strokeDasharray = isErrorEdge ? '6 3' : undefined
```

Handles `error` em vermelho/dashed, handles `out` na cor do design system.

### 3.3 State Management — Gap Crítico da SPEC-005

O sim usa **7 Zustand stores especializadas**:

| Store | Responsabilidade | sunOS: onde vai? |
|-------|-----------------|-----------------|
| `useWorkflowStore` | Positions, dimensions, edges, loops, parallels | `useNodesState` + `useEdgesState` do React Flow |
| `useExecutionStore` | Estados por node durante execução (running/pending/completed/error) | **Falta** — Context ou Zustand necessário |
| `useCanvasModeStore` | Modo de interação (hand vs. select) | useState local na page |
| `usePanelEditorStore` | Node atualmente editado no side panel | useState local ou Context |
| `useUndoRedoStore` | Stacks de undo/redo | Fora-de-escopo MVP |
| `useWorkflowDiffStore` | Diff visualization state | V2 |
| `useNotificationStore` | Toast notifications | useToast existente |

A SPEC-005 §5.1 diz: *"estado do grafo via hooks do React Flow. Zustand é detalhe interno da lib — não importar zustand diretamente."*

Isso está correto para geometria, mas **não cobre `useExecutionStore`**. Durante a execução de um workflow, o frontend precisa colorir cada node com seu status atual (running = amarelo pulsando, completed = verde, error = vermelho). Esse estado não é geometria — não cabe em `useNodesState`. Sem um lugar definido para esse estado, a implementação vai improvisar.

**ADR-CAND-002: Arquitetura de state do canvas além de useNodesState/useEdgesState.** Incluir no design.md SPEC-005 a seguinte separação:
- Geometria → React Flow hooks ✓
- Execução por node → Context local `ExecutionStateContext` em `app/workflows/[workflowId]/`
- Node em edição → useState local da page
- Modo de canvas → useState local

### 3.4 Auto-Save vs. Auto-Connect

**Auto-save:** O sim NÃO tem auto-save por debounce — mudanças estruturais persistem via Socket.io (persist-first, 0ms). O sunOS SPEC-005 tem debounced save de 500ms. **O design do sunOS é mais simples e adequado para MVP sem realtime collaboration.** Manter como está.

**Auto-connect:** O sim tem `tryCreateAutoConnectEdge()` — quando um node é dropado no canvas com um outro node próximo com handle livre, conecta automaticamente. Algoritmo: `findClosestOutput()` por distância geométrica.

**FR-CAND-003: Auto-connect ao dropar node do palette.** Reduz atrito em workflows lineares. Risco: pode criar conexões indesejadas em canvas complexo. Mitigação: só auto-conectar quando há exatamente 1 node candidato dentro de raio de X pixels.

### 3.5 NodePalette (Toolbar)

O sim organiza em 3 seções: Triggers, Regular Blocks, Tools. Com search em tempo real e resize de seções via divider draggable.

**Sugestão de organização para o sunOS (design.md):**

| Seção | Conteúdo | Prioridade |
|---|---|---|
| Início | Start node (1 por workflow, obrigatório) | MVP |
| Controle | Condition, MergeNode, HITL | MVP |
| IA | LLM node com tool calling | MVP |
| Tools | Tools do cliente (Biblioteca de skills) | MVP |
| Ações | Action nodes (webhook, notificação) | V2 |

**FR-CAND-004: Search em tempo real no NodePalette.** O sim filtra por nome enquanto digita — essencial quando o palette cresce além de 10 items.

### 3.6 Performance de Drag — Padrão Crítico

O sim usa padrão específico durante drag de nodes:

> *"Mudanças de posição durante drag vão apenas para `displayNodes` (React state local), sem trigger de store global por frame. Store update acontece só no commit (mouseup)."*

Com 50+ nodes, atualizar o store global a cada pixel de drag vai dropar frames. **Padrão para o sunOS:**
- `onNodeDrag`: atualizar apenas um `ref` local com a posição atual
- `onNodeDragStop`: commitar para `useNodesState` e disparar debounced save
- Nunca chamar `setNodes()` dentro de `onNodeDrag`

### 3.7 Side Panel — Conjunto Mínimo de Input Types

O sim tem 33 tipos de sub-block inputs. Para o sunOS MVP, o conjunto mínimo necessário:

| Input type | Necessidade sunOS | Casos de uso |
|---|---|---|
| `short-input` | Obrigatório | Nome, títulos |
| `long-input` | Obrigatório | System prompt, descrições |
| `dropdown` | Obrigatório | LLM model, step type |
| `combobox` | Obrigatório | Tool selecionável com search |
| `switch` | Obrigatório | Enable/disable, toggles |
| `slider-input` | Desejável | Temperature, max_tokens |
| `messages-input` | Obrigatório | System + user message config |
| `variables-input` | Obrigatório | Referência a outputs de nodes anteriores (ex: `{{step1.output}}`) |
| `workflow-selector` | Obrigatório | Sub-workflow node |
| `tool-input` | Obrigatório | Seleção de tool da Biblioteca |
| `condition-input` | Obrigatório | Expressão booleana do condition node |
| `credential-selector` | V2 | API keys por tool |
| `code` | V2 | Function block |

**ADR-CAND-003: Definir conjunto mínimo de input types para NodeConfigDrawer antes da implementação.** Sem isso, cada desenvolvedor cria um input ad-hoc incompatível com os outros.

---

## 4. Execution Engine — Achados para LangGraph

### 4.1 Fan-out Paralelo

O sim usa `Promise`-based concorrência com `batchSize` configurável via `ParallelOrchestrator`. Em Python/LangGraph, o sunOS já especificou `asyncio.gather` — correto. O `batchSize` (limitar quantas branches executam simultaneamente) é V2.

```python
# sunOS MVP: fan-out sem batchSize
await asyncio.gather(
    execute_branch(state, "branch_a"),
    execute_branch(state, "branch_b"),
    execute_branch(state, "branch_c"),
)
```

### 4.2 HITL — PauseMetadata e Resume Tokens

O sim salva o estado completo da execução em `pausedExecutions.executionSnapshot (JSONB)`. O sunOS usa `interrupt()` do LangGraph com checkpointer — que já faz o equivalente automaticamente.

**Vantagem do sunOS:** o checkpointer do LangGraph persiste o `StateGraph` state sem serialização manual. **Não reimplementar `pausedExecutions` do sim — usar o checkpointer do LangGraph.**

O que o sim tem que o sunOS precisa implementar é o **resume token** para HITL externo:

```python
# Resume token — sunOS precisa gerar ao pausar
{
  "thread_id": str,     # thread_id do LangGraph checkpointer
  "execution_id": str,
  "workflow_id": str,
  "resume_url": str,    # POST /api/workflows/{id}/executions/{eid}/resume
  "ui_url": str         # https://sunos.suno.com.br/workflows/{id}/runs/{eid}
}
```

**FR-CAND-005: Resume token para HITL com `ui_url` e `resume_url`.** O Aprovador precisa receber um link direto (via Slack/email) para retomar a execução sem navegar manualmente na UI. Hoje a SPEC-004 não especifica como o Aprovador acessa o item pendente.

### 4.3 Cancelamento Distribuído

O sim usa AbortSignal (local) + pub/sub Redis (distribuído entre pods) para cancelamento. Para o sunOS MVP em Cloud Run (single pod por execução via LangGraph): AbortSignal é suficiente. Redis pub/sub é V2 se houver escalabilidade horizontal.

### 4.4 Snapshot de Execução

O sim tem `workflowExecutionSnapshots` — JSONB imutável do estado completo de cada execução para replay/debug. O sunOS tem `workflow_step_logs` (granular por step). Para debug de workflows complexos (20+ steps), logs granulares são suficientes no MVP. Snapshot completo para replay é V2.

**FR-CAND-006: Execution snapshot para replay/debug** — V2, não bloqueia MVP.

---

## 5. Integrações e Block Registry

### 5.1 Arquitetura de uma Tool (sim)

```typescript
interface Tool {
  id: string
  name: string
  description: string
  params: Record<string, ToolParam>
  request: {
    url: string | ((params) => string)
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
    headers: Record<string, string> | ((params) => Record<string, string>)
    body?: (params) => unknown
  }
  transformResponse: (response) => unknown
  transformError: (error) => string
}
```

O sunOS tem `api/chat/tools/*` com interface própria. O modelo do sim é mais declarativo (config-driven) vs. o sunOS que é mais imperativo (Python functions). Ambos funcionam; o sim escala melhor para 100+ integrações sem código custom por tool.

### 5.2 Bloco `knowledge` (RAG Inline)

O sim tem um bloco `knowledge` que faz busca RAG diretamente no canvas. No sunOS, a Biblioteca (FA-01, SPEC-002) é o equivalente mas não há bloco nativo de RAG no canvas ainda.

**FR-CAND-008: Knowledge block no canvas** que busca na Biblioteca do cliente com filtros de scope e tag. Sinergiza com FA-01 e com o ADR-008 (RAG + AlloyDB pgvector).

### 5.3 Bloco `evaluator` (Auto-avaliação LLM)

O sim tem um bloco dedicado para avaliação de qualidade de outputs por LLM — sem intervenção humana. No sunOS, avaliação passa por HITL (FA-13). Para workflows de volume alto onde HITL é impraticável, um evaluator automático é essencial.

**FR-CAND-009: LLM Evaluator block** — V2.

---

## 6. Multi-tenancy e Segurança

### 6.1 Alinhamento com caixa-preta sunOS

O sim implementa o mesmo padrão do sunOS:

```typescript
// sim: filtro por workspaceId em toda query, 404 (não 403)
const workflow = await db.query.workflows.findFirst({
  where: and(
    eq(workflows.id, workflowId),
    eq(workflows.workspaceId, currentWorkspaceId)  // sempre filtrado
  )
})
if (!workflow) return notFound()  // 404 genérico
```

Valida o padrão do `.claude/rules/caixa-preta.md`. Sem gap.

### 6.2 BYOK — Credenciais Encriptadas por Workspace

O sim tem `workspaceBYOKKeys` — credenciais de API encriptadas com `ENCRYPTION_KEY` env var (AES-256). O sunOS não tem isso ainda. Quando tools externas (Meta, Google, Slack) forem adicionadas, cada cliente precisará de suas próprias API keys.

**ADR-CAND-004: Encriptação de credenciais de API por workspace (BYOK pattern).** Blocker de segurança para V2 com tools de terceiros.

### 6.3 RBAC por Recurso Individual

O sim tem tabela `permissions` com `entityType + entityId + permissionType (admin|write|read)` — permite RBAC fine-grained por workflow individual. O sunOS tem RBAC por role geral (FA-09). Para workflows sensíveis (ex: aprovação de campanha), RBAC por recurso é desejável no V2.

---

## 7. Qualidade de Código — Lições

### 7.1 Zod Contracts / Pydantic Schema-first

O sim tem contratos Zod centralizados em `lib/api/contracts/**`. Script CI valida que nenhum endpoint tem schema ad-hoc. O equivalente no sunOS é Pydantic models em `api/workflows/schemas.py`.

**ADR-CAND-005: Convenção schema-first para endpoints de workflow.** Documentar em `api/CLAUDE.md`: todo endpoint novo importa request/response model de `api/workflows/schemas.py`, nunca define inline.

### 7.2 Estrutura de Testes do Executor — Template para sunOS

Os arquivos de teste do sim são o template mais útil para o sunOS:

| Arquivo (sim) | Equivalente sunOS | O que testa |
|---|---|---|
| `engine.test.ts` (53KB) | `test_executor.py` | Scheduling, concorrência, abort |
| `edge-manager.test.ts` (114KB) | `test_edge_routing.py` | Cada combinação de handle + cascade deactivation |
| `condition-handler.test.ts` (35KB) | `test_condition.py` | Cada branch + expressões |
| `serializer/index.test.ts` (30KB) | `test_compiler.py` | Equivalência compiler v1 → v2 |
| `agent-handler.test.ts` (73KB) | `test_llm_node.py` | Multi-provider, tool calling, streaming |

A SPEC-005 especifica 90% de cobertura no compiler e 85% no executor. A estrutura de arquivos do sim é o template exato do que cobrir.

---

## 8. Pontos Fortes do sim (que o sunOS deveria adotar)

### 8.1 Diff Visualization entre Versões de Workflow

O `useWorkflowDiffStore` do sim renderiza edges deletadas como linhas dashed/vermelhas e edges novas como accent — visualização de diff entre versões de workflow.

**FR-CAND-010: Diff visualization de workflows no contexto de aprovação (FA-13).** O BrandValidator precisa ver o que mudou num workflow antes de aprovar uma nova versão. Sem diff visual, o aprovador tem que abrir duas abas e comparar manualmente.

### 8.2 Deploy Version Snapshot (draft vs. deployed)

O sim tem `workflowDeploymentVersion` — snapshots imutáveis de workflows publicados. Draft e versão publicada são separados. O sunOS não tem essa distinção — um workflow editado substitui imediatamente a definição em produção, o que pode interromper execuções agendadas em andamento.

**FR-CAND-011: Workflow versioning (draft vs. deployed).** Quando um workflow está em execução agendada, editar o draft não deve afetar execuções em andamento.

### 8.3 Variables Block (Constantes Visíveis no Canvas)

O sim tem bloco `variables` para definir constantes e acumuladores como nodes visíveis no canvas. O sunOS tem `workflow.variables (JSONB)` escondido — o usuário não sabe que existe sem abrir um painel de settings.

**FR-CAND-012: Variables block no canvas** — V2.

### 8.4 Copilot de Configuração de Node

O sim tem tab "Copilot" no side panel — um LLM que configura o node a partir de linguagem natural. Product-fit perfeito para o sunOS (plataforma de IA para criação de conteúdo).

**FR-CAND-013: Copilot de configuração de node.** Usuário escreve "buscar posts do Instagram dos últimos 30 dias" e o LLM preenche os campos do node automaticamente. Pós-MVP mas alta prioridade.

---

## 9. Gaps do sim (onde o sunOS está à frente)

| Limitação do sim | Posição do sunOS |
|---|---|
| ReactFlow v11 (legado) | sunOS usa v12 — correto |
| Auto-layout server-side com algoritmo oculto | sunOS usa dagre client-side — mais transparente |
| Loops de 4 tipos (complexidade desnecessária para usuário não-técnico) | sunOS exclui loops do MVP — decisão correta |
| Collaborative editing "último escritor vence" sem CRDT | sunOS MVP igual — OK |
| Executor TypeScript ad-hoc (sem ecosistema) | sunOS usa LangGraph — menos código a manter |
| Sem MLflow tracing | sunOS tem MLflow desde dia zero — vantagem de observabilidade |
| `workflowDeploymentVersion` sem histórico editável | ambos sem git-like history |
| Auto-connect pode criar edges indesejadas | sunOS pode implementar com threshold configurável |
| Nenhum Gemini Flash como provider default | sunOS: Gemini Flash default conforme ADR-009 |

---

## 10. Candidatos Extraídos

### FR-CAND

| # | Título | Relevância | Status |
|---|---|---|---|
| FR-CAND-001 | Serializer dedicado workflow state → execution payload | Alta | A validar vs. compiler existente |
| FR-CAND-002 | Dimensões determinísticas de nodes (sem ResizeObserver) | Alta | Incluir no design.md SPEC-005 |
| FR-CAND-003 | Auto-connect ao dropar node do palette | Média | A validar (risco de edges indesejadas) |
| FR-CAND-004 | Search em tempo real no NodePalette | Alta | Incluir no spec.md SPEC-005 |
| FR-CAND-005 | Resume token para HITL com `ui_url` e `resume_url` | Alta | Incluir no design.md SPEC-004 |
| FR-CAND-006 | Execution snapshot completo para replay/debug | Média | V2 |
| FR-CAND-007 | Function block (JS/Python em sandbox) | Baixa MVP / Alta V2 | V2 |
| FR-CAND-008 | Knowledge block no canvas (RAG inline via Biblioteca) | Alta | A validar se MVP ou V2 |
| FR-CAND-009 | LLM Evaluator block (auto-avaliação sem HITL) | Média | V2 |
| FR-CAND-010 | Diff visualization de workflows (para FA-13 aprovação) | Alta | Incluir no design.md SPEC-004 |
| FR-CAND-011 | Workflow versioning (draft vs. deployed snapshot) | Alta | Incluir como fase D/E da SPEC-005 |
| FR-CAND-012 | Variables block no canvas | Média | V2 |
| FR-CAND-013 | Copilot de configuração de node (LLM preenche campos) | Alta | Pós-MVP, alta prioridade |

### ADR-CAND

| # | Título | Relevância | Status |
|---|---|---|---|
| ADR-CAND-001 | Cascade deactivation no executor (nodes skipped em branch não-tomada) | Alta | **Incluir no design.md SPEC-005 antes de Fase A** |
| ADR-CAND-002 | Arquitetura de state do canvas além de useNodesState/useEdgesState | Alta | **Incluir no design.md SPEC-005 antes de Fase A** |
| ADR-CAND-003 | Conjunto mínimo de input types para NodeConfigDrawer | Alta | **Incluir no design.md SPEC-005 antes de Fase A** |
| ADR-CAND-004 | Encriptação de credenciais de API por workspace (BYOK pattern) | Alta | V2 — blocker de segurança para tools externas |
| ADR-CAND-005 | Schema-first para endpoints de workflow com Pydantic | Média | Documentar em `api/CLAUDE.md` |
| ADR-CAND-006 | Avaliar migração de config de steps para JSONB | Baixa | Backlog técnico |

---

## 11. Recomendações Prioritizadas

### Fazer antes de começar implementação da SPEC-005 (design.md)

1. **ADR-CAND-001** — cascade deactivation: fundamental para UX de execução, ausente da spec.
2. **ADR-CAND-002** — arquitetura de state do canvas: sem isso a implementação vai improvisar.
3. **ADR-CAND-003** — conjunto mínimo de input types para NodeConfigDrawer.
4. **FR-CAND-002** — dimensões determinísticas: incluir no design.md.
5. **FR-CAND-005** — resume token HITL: incluir no design.md SPEC-004.

### Fazer na implementação do canvas (Fase C da SPEC-005)

6. Padrão de edge delete button via `EdgeLabelRenderer`.
7. Handle positioning por índice para condition e HITL nodes.
8. Drag performance pattern: `ref` local durante drag, commit no `mouseup`.
9. Error edge styling: `error` em vermelho/dashed, `out` em cor do design system.
10. Self-connection guard síncrono no `onConnect`.

### Fazer no V2

11. FR-CAND-010 (diff visualization) — importante para FA-13.
12. FR-CAND-011 (draft vs. deployed versioning).
13. ADR-CAND-004 (BYOK encriptado por workspace).
14. FR-CAND-008 (Knowledge block no canvas).
15. FR-CAND-013 (Copilot de configuração de node).

---

## 12. Arquivos do sim para Bookmarking

| Arquivo | Por que ler | Prioridade |
|---|---|---|
| `packages/db/schema.ts` (133KB) | Schema de referência mais completo para workflow em produção | Alta |
| `apps/sim/serializer/types.ts` | `SerializedWorkflow` — template para payload de execução sunOS | Alta |
| `apps/sim/executor/constants.ts` | Todos os handles e tipos — referência para `validator.py` sunOS | Alta |
| `apps/sim/executor/execution/engine.ts` | Como o scheduler de execução funciona — referência para LangGraph | Alta |
| `apps/sim/executor/execution/edge-manager.ts` | Cascade deactivation — o conceito mais importante para copiar | Alta |
| `apps/sim/executor/orchestrators/parallel.ts` | Fan-out com batchSize — referência para asyncio.gather no sunOS | Média |
| `apps/sim/executor/handlers/human-in-the-loop/human-in-the-loop-handler.ts` | PauseMetadata + resume tokens | Alta |
| `apps/sim/app/workspace/.../workflow-block/workflow-block.tsx` (57KB) | Custom node completo — ler antes de implementar qualquer node | Alta |
| `apps/sim/app/workspace/.../workflow-edge/workflow-edge.tsx` | Custom edge — ler antes de implementar edges | Alta |
| `apps/sim/app/workspace/.../workflow.tsx` (162KB) | Canvas completo — referência máxima, leitura seletiva | Alta |
| `apps/realtime/src/handlers/operations.ts` (19KB) | Collaborative editing pattern — referência para V2 sunOS | Baixa |
| `apps/sim/executor/execution/engine.test.ts` (53KB) | Template de testes do executor | Alta |
| `apps/sim/executor/execution/edge-manager.test.ts` (114KB) | Template de testes de roteamento | Alta |

---

*Gerado em 2026-05-21. Próxima revisão recomendada após implementação da Fase B da SPEC-005.*
