---
spec-id: SPEC-005
slug: workflow-builder-canvas
artefato: spec
nivel-sdd: spec-anchored
tamanho: large
status: rascunho
criada: 2026-04-30
atualizada: 2026-04-30
versao: 1.0
substitui: SPEC-003 (docs/specs/large/workflow-builder/)
escopo:
  projeto: sunos
  stack: "Frontend: Next.js 14 + React Flow | Backend: FastAPI + LangGraph"
  autor: Heitor Miranda
  papel: Tech Lead
  branch: master
  contexto: Substituir UI da SPEC-003 (lista linear de steps) por canvas drag-and-drop com React Flow. Estender data model + compiler + executor para DAG paralelo (fan-out via handle universal `out` + merge nodes + handle `error` opcional). Backend (engine LangGraph, tools, schedule, MLflow, HITL) preservado e estendido, não refeito.
cobertura:
  features: [FA-05]
  upstream_brs: [BR-002 (escala sem squad dedicado)]
  upstream_telas: [T-21 (substituída), T-22 (atualizada), T-23 (sem mudança nesta SPEC)]
  novos_subfeatures: [FA-05-01b (canvas DnD), FA-05-05 (fan-out paralelo), FA-05-06 (merge nodes), FA-05-07 (handles tipados)]
fora_escopo:
  - "Loops (iterar sobre lista, while)"
  - "Try/catch genérico (apenas roteamento por handle 'error', não captura por sub-DAG)"
  - "Undo/redo histórico de mudanças estruturais"
  - "Colaboração realtime multi-user no canvas"
  - "Mobile (read-only com aviso em <768px)"
  - "Visualização de runs em tempo real no canvas (V2)"
  - "Sub-graph collapse / expandir (V2)"
---

# Spec — Workflow Builder Canvas (SPEC-005)

Pré-requisito: ler `constitution.md` desta SPEC. Comportamento externo cobre o **que** o canvas faz; o **como** vive em `design.md`.

## 1. Visão Geral

**O quê.** Substituir a UI atual do Workflow Builder (lista linear de `WorkflowStep` com modal editor, em `components/workflows/WorkflowBuilder.tsx`) por um canvas visual drag-and-drop usando **React Flow**. Estender data model, compiler e executor para suportar DAG paralelo: fan-out (1 node → N branches concorrentes via handle universal `out`), merge/join (N branches → 1 `MergeNode`, política `all` ou `any`), e roteamento de erro opcional em tool/llm/action/workflow steps (handle `error`).

**Por quê.** Hoje workflows com branching são representados como lista linear com `condition.then/else` apontando para IDs — usuários não conseguem visualizar o fluxo, têm dificuldade em depurar, e qualquer pattern útil (buscar 3 fontes em paralelo, consolidar e gerar relatório) é impossível de expressar. O backend já suporta DAG via LangGraph; a UI virou o gargalo. Migrar para canvas + adicionar paralelismo desbloqueia 80% dos workflows reais que ficaram represados.

**Para quem.** Mesmas personas da SPEC-003: PX-01 (Líder/Curador) e PX-03 (Operador Processual). O canvas baixa a barreira de entrada para usuários menos técnicos e permite que líderes desenhem fluxos mais ricos sem depender de engenharia.

**Escopo incluído.**

- UI canvas substituindo `WorkflowBuilder.tsx` em `app/workflows/[workflowId]/page.tsx` e `app/workflows/new/page.tsx`.
- Novo data model: tabela `workflow_edges` + colunas `position_x/y` + `merge_policy` em `workflow_steps`.
- Compiler estendido lendo edges (com fallback para `next_step`/`condition.then/else` por 1 release).
- Executor com `asyncio.gather` para fan-out e `asyncio.wait` para merge `any`.
- Migração one-shot dos workflows em produção (auto-layout via `dagre` + conversão para edges explícitos).
- Endpoints novos: `GET/POST/DELETE /api/workflows/{id}/edges`, `POST /api/workflows/{id}/auto-layout`, `POST /api/workflows/{id}/validate`, `POST /api/workflows/{id}/migrate-v2`.
- Atualização de telas T-21 e T-22 no inventário UX.
- Novo step type `merge` (MergeNode).
- Lazy-load de React Flow + bundle audit no CI.

**Escopo excluído (explícito).** Lista no frontmatter `fora_escopo`. Adicionalmente:

- Não muda backend de schedule (`api/workflows/scheduler.py` permanece igual).
- Não muda HITL como capacidade — permanece como step type `hitl`, agora também desenhável como node.
- Não muda a interface SSE de stream de execução.
- Não muda T-23 (Histórico de Execuções).
- Não muda `models.py` para runs/step logs — apenas para definitions.

## 2. Personas e Jornadas

### 2.1. PX-01 Líder/Curador — autor de workflows complexos

- **Perfil.** Líder de mídia/BI. Hoje pede para o time de engenharia desenhar workflow com branching paralelo; depois copia/cola lógica entre workflows linear porque não consegue expressar fan-out.
- **Objetivo.** Desenhar workflow "buscar dados de Meta + Google + TikTok em paralelo, consolidar, gerar relatório, mandar para review humana, publicar" sem código.
- **Jornada principal.**
  1. `/workflows` → "Novo Workflow" → escolhe template "Em branco" ou um template existente.
  2. Canvas abre com nodes pré-configurados (se template) ou apenas um nó "Início".
  3. Arrasta tools do `NodePalette` (sidebar esquerda) para o canvas — cada drop cria um node configurável.
  4. Conecta nodes arrastando do handle de saída (lado direito) para handle de entrada (lado esquerdo) de outro node.
  5. Para fan-out: arrasta 3 edges saindo do mesmo handle para 3 nodes diferentes — sem precisar de "fan-out node".
  6. Para merge: arrasta `MergeNode` do palette, conecta 3 entradas, escolhe política `all` (espera todos).
  7. Clica em qualquer node → `NodeConfigDrawer` (lateral direita) abre com os campos do step (mesmos campos do antigo `WorkflowStepEditor`, agora em painel ao invés de modal).
  8. Salva: `Salvando…` → `Salvo às 14:32` (debounced 500ms após última edição).
  9. Clica "Validar" → backend valida ciclos, órfãos, fan-in sem merge. Se OK, "Executar" fica habilitado.
  10. "Executar agora" → run cria, redireciona para T-23 (existente) com timeline.

### 2.2. PX-03 Operador Processual — edita workflow existente

- **Perfil.** Analista que recebeu um workflow pronto e precisa ajustar (mudar tool, trocar prompt, adicionar step de revisão).
- **Objetivo.** Achar onde alterar sem ler XML/JSON e sem entender DAG inteiro.
- **Jornada principal.**
  1. `/workflows` → clica workflow existente → canvas abre com layout salvo.
  2. Acha o node visualmente (por nome ou tipo); clica → drawer abre.
  3. Edita campos no drawer; canvas atualiza visualmente.
  4. Salva debounce; banner muda para "Salvo às hh:mm".

### 2.3. Migration JIT — abrir workflow legado pela primeira vez

1. Workflow criado antes desta SPEC tem `next_step` / `condition.then/else` mas sem `position_x/y` nem registros em `workflow_edges`.
2. Frontend chama GET `/api/workflows/{id}` que retorna `metadata.canvas_v2_migrated`.
3. Se `false`: frontend dispara POST `/api/workflows/{id}/migrate-v2` (idempotente, server-side).
4. Backend: lê definition v1, infere topologia, roda dagre layered layout, popula `position_x/y` em cada step, cria registros em `workflow_edges` (handle `out`→`in` para `next_step`; handles `then`/`else` para `condition`), seta `metadata.canvas_v2_migrated=true`.
5. Frontend recarrega definition, renderiza canvas com layout estático.
6. Idempotência: chamada subsequente retorna 200 rapidamente sem reprocessar.

### 2.4. Fora-de-escopo: sessão multi-user concorrente

Se 2 usuários abrem o mesmo workflow ao mesmo tempo:

- Cada um vê seu canvas isolado; saves não são realtime.
- O 2º a salvar sobrescreve o 1º (last-write-wins).
- Banner amber "Outro usuário (Maria) editou há 3min" aparece se houver `updated_at > 5min` desde a abertura. **Sem lock pessimista, sem CRDT.**

<!-- REVIEW: As 4 jornadas cobrem o caminho real? Falta jornada de "criar a partir de template"? Falta jornada de "duplicar workflow"? -->

## 3. Requisitos Funcionais

Cada FR traz vínculo a CA(s) verificáveis em §7.

### FR-WBC-01 — Renderização de canvas a partir de definition

- **Comportamento.** Ao abrir `/workflows/{id}`, o canvas renderiza com nodes nas coordenadas `position_x/y` e edges conforme `workflow_edges`. Se o workflow ainda não foi migrado (v1), dispara migration JIT antes de renderizar.
- **CAs.** CA-01, CA-02, CA-03.

### FR-WBC-02 — Drag de tools do NodePalette para canvas

- **Comportamento.** Sidebar esquerda lista tools disponíveis (filtradas por RBAC do user) agrupadas por categoria (`tool`, `llm`, `condition`, `action`, `hitl`, `workflow`, `merge`). Arrastar um item para o canvas cria um node novo na posição do drop, com config default.
- **CAs.** CA-04, CA-05.

### FR-WBC-03 — Conectar nodes via edges

- **Comportamento.** Arrastar do handle de saída de um node para handle de entrada de outro cria um edge. Frontend valida em tempo real: bloqueia ciclos, bloqueia conectar handle de saída em handle de saída, bloqueia self-loop. Backend re-valida no save.
- **CAs.** CA-06, CA-07, CA-08.

### FR-WBC-04 — Fan-out paralelo

- **Comportamento.** Múltiplos edges saindo do mesmo `source_handle` de um node criam fan-out. Handle `out` é universal — todo node tem `out` como saída padrão (exceto `condition`, que tem `then`/`else` no lugar; e `hitl`, que tem `approved`/`rejected`/`modified`). Executor chama os next steps via `asyncio.gather`. Latência consolidada = `max(latencies)`.
- **CAs.** CA-09, CA-10, CA-26.

### FR-WBC-05 — Merge nodes com política `all` ou `any`

- **Comportamento.** `MergeNode` aceita N inputs. `merge_policy='all'`: espera todos, agrega outputs em dict `{step_id: output}`; `'any'`: primeiro a completar vence, demais são canceladas (`task.cancel()`).
- **CAs.** CA-11, CA-12, CA-27, CA-28.

### FR-WBC-06 — Handle `error` opcional em tool/llm/action/workflow steps

- **Comportamento.** Esses 4 tipos de node têm `out` (default, verde) e podem ter um handle adicional opcional `error` (vermelho). Sem edge saindo de `error` → exception sobe e mata o run (comportamento atual). Com edge saindo de `error` → executor encadeia para esse target em vez de falhar. Apenas estes 4 tipos têm `error`; condition/hitl/merge não.
- **CAs.** CA-13, CA-14, CA-29.

### FR-WBC-07 — NodeConfigDrawer (substitui WorkflowStepEditor modal)

- **Comportamento.** Click em node abre drawer lateral direito (não modal). Drawer mostra mesmos campos do `WorkflowStepEditor` antigo: nome, tool/prompt, config dict, etc. Mudanças marcam workflow dirty, dispara debounced save 500ms.
- **CAs.** CA-15, CA-16.

### FR-WBC-08 — Auto-save com debounce

- **Comportamento.** Após qualquer mudança (mover node, criar edge, editar campo no drawer), aguardar 500ms de inatividade e disparar PUT do workflow inteiro. Banner mostra estado: "Salvando…" → "Salvo às 14:32" → "Erro ao salvar (retry)".
- **CAs.** CA-17, CA-18, CA-19.

### FR-WBC-09 — Auto-layout (dagre)

- **Comportamento.** Botão "Reorganizar" na toolbar do canvas chama `useAutoLayout` que computa coordenadas via `dagre` (layered layout, top-to-bottom). Resultado é determinístico para o mesmo grafo. Persiste no save subsequente.
- **CAs.** CA-20.

### FR-WBC-10 — Validação pré-execução

- **Comportamento.** Botão "Validar" chama POST `/api/workflows/{id}/validate`. Backend retorna lista de problemas: ciclos, nodes órfãos (sem entrada), fan-in sem MergeNode, MergeNode com 0 ou 1 entrada, edge para handle inexistente. Frontend exibe erros como overlay no canvas (linha vermelha + tooltip).
- **CAs.** CA-21, CA-22, CA-23.

### FR-WBC-11 — Migration JIT v1 → v2

- **Comportamento.** Workflow legado é migrado server-side na primeira abertura (idempotente via flag em metadata). Conversão preserva semântica: workflow v1 e v2 produzem `StateGraph` equivalente (teste de invariância).
- **CAs.** CA-24, CA-25, CA-30.

### FR-WBC-12 — RBAC do NodePalette

- **Comportamento.** Tools restritas (ex: `delete_resource`) só aparecem no palette para roles que podem usar. Backend re-valida no save: tentar adicionar node com tool não autorizada retorna 403.
- **CAs.** CA-31.

### FR-WBC-13 — Banner de edição concorrente

- **Comportamento.** Ao abrir canvas, frontend compara `updated_at` do workflow com `now() - 5min`. Se mais recente, exibe banner "Outro usuário editou há Xmin" com nome (se disponível). Não bloqueia edição.
- **CAs.** CA-32.

### FR-WBC-14 — Limite de 20 nodes (preserva guardrail SPEC-003)

- **Comportamento.** Tentar criar 21º node retorna 400 com erro "Limite de 20 nodes por workflow atingido". Mesmo limite aplicado no backend.
- **CAs.** CA-33.

### FR-WBC-15 — Compatibilidade com SPEC-004 (FA-13)

- **Comportamento.** Ao concluir um run, executor produz um registro consumível por `subject_store.get_subject('workflow_output', ...)` da SPEC-004 (campos: `workflow_id`, `run_id`, `final_output` JSONB do steps_output). Schema exato segue o que `WorkflowRun` já produz hoje (não-mudança); esta SPEC apenas garante que mudanças de DAG não quebram esse contrato.
- **CAs.** CA-34.

## 4. Comportamento Especificado

### 4.1. Tipos de node

| Step type | UI no canvas | Handles entrada | Handles saída | Editor (drawer) |
|-----------|--------------|------------------|----------------|------------------|
| `tool` | Box azul (#3B82F6) com ícone + nome | `in` | `out` (verde, default), `error` (vermelho, opcional) | Tool select + config dict |
| `llm` | Box roxo (#8B5CF6) com ícone + prompt preview | `in` | `out`, `error` (opcional) | Prompt textarea + model select |
| `condition` | Diamante amarelo (#F59E0B) | `in` | `then` (verde), `else` (cinza) | Field + operator + value |
| `action` | Box verde (#22C55E) | `in` | `out`, `error` (opcional) | Action select + config |
| `hitl` | Box dourado (`var(--sun)`) com ícone humano | `in` | `approved` (verde), `rejected` (vermelho), `modified` (amber) | Review instructions textarea |
| `workflow` (sub-WF) | Box rosa (#EC4899) com ícone Git Branch | `in` | `out`, `error` (opcional) | Sub-workflow select + input mapping |
| `merge` (NOVO) | Hexágono cinza | múltiplas edges no handle único `in` (não múltiplos handles) | `out` | `merge_policy: all\|any` |

### 4.2. Diagrama de estado do canvas

```
[Vazio]
   │ (drop tool)
   ▼
[Editando]──────────┐
   │ (debounce 500ms)│ (validar)
   ▼                 ▼
[Salvando]      [Validando]
   │                 │
   ├─ ok ──→ [Salvo] ┤
   │                 ├─ ok ──→ [Pronto p/ executar]
   └─ erro ──→ [Erro: retry]   │
                               └─ erros ──→ [Editando + overlay erros]
                                                    │
                                              (corrige)
                                                    ▼
                                              [Editando]
```

### 4.3. Fluxos de erro (canvas + API)

| Origem | Condição | Resposta UI | Ação interna |
|--------|----------|--------------|---------------|
| Frontend tenta criar edge formando ciclo | local | Edge não cria + toast "Cria ciclo" | nada |
| Frontend tenta conectar `out`→`out` | local | Edge não cria | nada |
| Frontend tenta conectar self-loop | local | Edge não cria | nada |
| PUT `/api/workflows/{id}` com >20 nodes | 400 (`max_nodes_exceeded`) | Banner "Limite de 20 nodes atingido" | rollback local |
| PUT com ciclo no grafo | 400 (`cycle`) | Toast "Workflow tem ciclo — corrija antes de salvar" + edges vermelhas | rollback local |
| PUT com tool não-autorizada para o user | 400 (`unauthorized_tool`) | Toast "Sem permissão para usar a tool '%s'" | rollback local |
| PUT com edge para handle inexistente | 400 (`edge_to_nonexistent_handle`) | Toast "Edge inválido (handle '%s' não existe em '%s')" | rollback local |
| PUT com workflow sem entry node (todos nodes têm in-degree>0) | 400 (`no_entry_node`) | Toast "Workflow sem ponto de início" | rollback local |
| POST `/validate` retorna `cycle` | 200 | Edges do ciclo vermelhos + tooltip | "Executar" desabilitado |
| POST `/validate` retorna `fan_in_without_merge` | 200 | Node receptor vermelho + tooltip "Use MergeNode" | "Executar" desabilitado |
| POST `/validate` retorna `merge_with_zero_inputs` | 200 | MergeNode vermelho + tooltip "Conecte pelo menos 1 entrada" | "Executar" desabilitado |
| POST `/validate` retorna `unauthorized_tool` | 200 | Tool node vermelho + tooltip "Sem permissão" | "Executar" desabilitado |
| POST `/validate` retorna `max_nodes_exceeded` | 200 | Banner "Workflow excede 20 nodes" | "Executar" desabilitado |
| POST `/validate` retorna `no_entry_node` | 200 | Banner "Workflow sem ponto de início" | "Executar" desabilitado |
| POST `/migrate-v2` falha | 500 | Banner full-screen "Erro ao migrar; contate engenharia" + botão "Tentar de novo" | log + alert |
| Auto-save retorna 5xx | 500 | Banner "Erro ao salvar; tentando de novo em 5s" + retry exponential | retry 3x antes de dar up |
| Workflow não existe | 404 | Redirect para `/workflows` com toast "Workflow não encontrado" | nada |
| User sem acesso ao workflow | 404 (caixa-preta) | Mesma mensagem do 404 acima | RBAC enforcement |

> **Nota de validação no PUT.** Backend valida no PUT um **subset crítico** que bloqueia save: `cycle`, `unauthorized_tool`, `max_nodes_exceeded`, `edge_to_nonexistent_handle`, `no_entry_node`. Validações estruturais "trabalho-em-progresso" (`fan_in_without_merge`, `merge_with_zero_inputs`) **não bloqueiam o save** — usuário pode salvar parcialmente; "Executar" só fica habilitado quando `/validate` retorna `valid: true`.

### 4.4. Estados visuais

| Estado | Indicador |
|--------|-----------|
| Não salvo (dirty) | Banner topo: "● Alterações não salvas" |
| Salvando | Banner topo: "Salvando…" + spinner 14px |
| Salvo | Banner topo: "Salvo às 14:32" (cor `--text-muted`) |
| Erro de save | Banner topo: "Erro ao salvar — Tentar de novo" (vermelho, com botão) |
| Validando | Banner topo: "Validando…" |
| Validação OK | Banner topo: "Pronto para executar" + botão "Executar" habilitado |
| Validação falhou | Banner topo: "N problemas — Corrija antes de executar" |
| Migration JIT em andamento | Tela cheia: "Atualizando workflow para o novo formato…" + spinner |

## 5. Requisitos Não-Funcionais

### NFR-WBC-01 — Performance

- **Render inicial canvas (workflow real ≤20 nodes + ≤30 edges):** p95 ≤300ms.
- **Render canvas em stress test (50 nodes + 70 edges, futuro-proofing acima do limite atual de 20):** p95 ≤500ms. Não medido em produção; medido em fixture sintética no CI.
- **Drop tool no canvas:** ≤100ms feedback visual.
- **Auto-save (PUT):** p95 ≤800ms.
- **Auto-layout (dagre, 50 nodes):** ≤200ms.
- **Migration JIT (50 nodes):** p95 ≤2s.

### NFR-WBC-02 — Bundle

- **Delta de bundle em rotas que não são `/workflows/[id]`:** ≤30KB gzipped.
- **Delta de bundle em `/workflows/[id]`:** ≤180KB gzipped (reactflow ~50KB + dagre ~80KB + código próprio).
- **Bundle audit no CI:** falha o build se exceder.

### NFR-WBC-03 — Acessibilidade

- Tab-nav entre nodes; Enter abre drawer; Delete remove node selecionado.
- ARIA labels em todos os nodes (nome + tipo).
- Suficiente contraste WCAG AA em todos os tipos de node.
- `prefers-reduced-motion`: animações de drag/zoom reduzidas.
- 0 violations axe-core Level AA em CI.

### NFR-WBC-04 — Determinismo

- Auto-layout é determinístico: mesmo grafo input → mesmas coordenadas output.
- Migration JIT é determinístico: workflow v1 → mesmo conjunto de edges + coordenadas em qualquer execução.

### NFR-WBC-05 — Compatibilidade

- Compiler durante 1 release aceita ambos formatos (edges OR `next_step`/`condition.then/else`). Após sunset (decisão do Heitor + handoff), remove fallback.
- Workflow linear v1 → `StateGraph` byte-equivalente ao v2 (invariante testada).

### NFR-WBC-06 — Segurança

- RBAC enforced em GET (palette) e PUT (save).
- Cross-client guard em todas as queries.
- Lazy-load enforcement: rota fora de `/workflows/[id]` não pode importar `reactflow` (ESLint custom rule).

## 6. Interface & Contratos

### 6.1. Endpoints novos

#### POST /api/workflows/{id}/edges (substitui edição inline)

```json
// Request — bulk replace
{
  "edges": [
    { "edge_id": "uuid", "source_step_id": "uuid", "source_handle": "out|error|then|else|approved|rejected|modified", "target_step_id": "uuid", "target_handle": "in" }
  ]
}
```

```json
// 200 OK
{ "edges": [ /* mesma estrutura */ ] }
```

Errors: 400 (`cycle`, `edge_to_nonexistent_handle`, `no_entry_node`, `max_nodes_exceeded`), 404 (workflow não existe ou caixa-preta).

#### GET /api/workflows/{id}/edges

```json
{ "edges": [...] }
```

#### POST /api/workflows/{id}/auto-layout

Server-side dagre. Retorna positions calculadas; frontend aplica e dispara save.

```json
// 200 OK
{ "positions": [ { "step_id": "uuid", "position_x": 120, "position_y": 40 } ] }
```

#### POST /api/workflows/{id}/validate

```json
// 200 OK
{
  "valid": false,
  "errors": [
    { "kind": "cycle", "edges": [ "edge_id_1", "edge_id_2" ] },
    { "kind": "fan_in_without_merge", "step_id": "uuid", "incoming": 2 },
    { "kind": "merge_with_zero_inputs", "step_id": "uuid" },
    { "kind": "edge_to_nonexistent_handle", "edge_id": "uuid", "expected_handle": "in" }
  ]
}
```

#### POST /api/workflows/{id}/migrate-v2

Idempotente.

```json
// 200 OK
{
  "migrated": true,
  "previously_migrated": false,
  "steps_with_position": 12,
  "edges_created": 14
}
```

#### GET /api/tools?for_user=current

Endpoint **novo** que serve o `NodePalette` (FR-WBC-12). Retorna a lista de tools (com `tool_name`, `category`, `description`, `default_config`) filtradas pelo RBAC do user. Hoje o frontend não consulta isso — a lista é hardcoded em `WorkflowStepEditor.tsx`. Esta SPEC formaliza como API.

```json
// 200 OK
{
  "tools": [
    { "tool_name": "search_knowledge", "category": "tool", "description": "...", "default_config": {} },
    { "tool_name": "generate_text", "category": "tool", "description": "...", "default_config": {} }
  ]
}
```

Authorization: qualquer usuário autenticado. Tools restritas (definidas em config server-side por role) só aparecem para os roles autorizados.

### 6.2. Endpoints existentes — mudanças

#### PUT /api/workflows/{id} (existente — payload estendido)

`steps[].position_x`, `steps[].position_y`, `steps[].merge_policy` aceitos. Backend valida e persiste. Mantém aceitação de `next_step` / `condition.then/else` para retrocompat (1 release).

#### GET /api/workflows/{id} (existente — payload estendido)

Response inclui:
- `definition.steps[].position_x/y`
- `definition.steps[].merge_policy`
- `definition.edges` (lista)
- `metadata.canvas_v2_migrated` (bool)

### 6.3. Schemas Pydantic

```python
# api/workflows/schemas.py — adicionar:

class WorkflowEdge(BaseModel):
    edge_id: UUID
    source_step_id: UUID
    source_handle: Literal["out", "error", "then", "else", "approved", "rejected", "modified"]
    target_step_id: UUID
    target_handle: Literal["in"] = "in"

class WorkflowStepV2(WorkflowStep):  # extends existing
    position_x: int = 0
    position_y: int = 0
    merge_policy: Literal["all", "any"] | None = None  # apenas para type='merge'

class ValidationError(BaseModel):
    kind: Literal[
        "cycle",
        "fan_in_without_merge",
        "merge_with_zero_inputs",
        "edge_to_nonexistent_handle",
        "unauthorized_tool",
        "max_nodes_exceeded",
        "no_entry_node",
    ]
    edges: list[UUID] = []
    step_id: UUID | None = None
    detail: str | None = None
```

## 7. Critérios de Aceite

### 7.1. Renderização e edição (FR-01..03)

- [ ] **CA-01.** DADO workflow v2 com 5 nodes salvos, QUANDO usuário abre `/workflows/{id}`, ENTÃO canvas renderiza nodes nas coordenadas salvas em ≤500ms.
- [ ] **CA-02.** DADO workflow v1 não-migrado, QUANDO usuário abre `/workflows/{id}`, ENTÃO frontend chama `/migrate-v2`, recebe 200, e canvas renderiza com layout calculado.
- [ ] **CA-03.** DADO chamada repetida a `/migrate-v2`, ENTÃO 2ª chamada retorna `previously_migrated: true` em ≤100ms (idempotência).
- [ ] **CA-04.** DADO `NodePalette` aberto, QUANDO usuário arrasta tool "search_knowledge" para canvas, ENTÃO node tool é criado com `tool_name='search_knowledge'`, `position_x/y` no ponto do drop.
- [ ] **CA-05.** DADO user com role `Operacional`, QUANDO `NodePalette` carrega, ENTÃO tool restrita a Líder não aparece no palette (filtro RBAC).
- [ ] **CA-06.** DADO 2 nodes, QUANDO usuário arrasta de handle de saída do A para handle de entrada do B, ENTÃO edge é criado (frontend) e persistido (PUT).
- [ ] **CA-07.** DADO grafo com edges A→B, B→A, QUANDO usuário tenta criar edge B→A, ENTÃO frontend bloqueia (toast "Cria ciclo") e nada vai ao backend.
- [ ] **CA-08.** DADO usuário tenta conectar handle de saída em outro handle de saída, ENTÃO conexão é bloqueada localmente. (Implementação: callback `isValidConnection` do React Flow recebe `{source, sourceHandle, target, targetHandle}` e retorna false se `targetHandle !== 'in'`.)

### 7.2. Fan-out, merge, handles (FR-04..06)

- [ ] **CA-09.** DADO tool node A com 3 edges saindo do handle `out` para B, C, D, QUANDO workflow executa, ENTÃO B/C/D iniciam dentro de 50ms um do outro (paralelismo real).
- [ ] **CA-10.** DADO fan-out de A para B (lat 200ms), C (lat 800ms), D (lat 500ms), QUANDO consolidam, ENTÃO latência total ≈ 800ms (max), não 1500ms (soma).
- [ ] **CA-11.** DADO MergeNode M com `merge_policy='all'` recebendo edges de B, C, D, QUANDO B/C/D completam, ENTÃO M executa com `state.steps_output = {B: ..., C: ..., D: ...}`.
- [ ] **CA-12.** DADO MergeNode M com `merge_policy='any'`, QUANDO B completa primeiro (50ms), ENTÃO M executa após 50ms; C e D são canceladas (`task.cancel()` chamado, verificado no log).
- [ ] **CA-13.** DADO tool node A com handle `out` ligado a B e `error` ligado a C, QUANDO A retorna sucesso, ENTÃO B executa.
- [ ] **CA-14.** DADO mesmo grafo de CA-13, QUANDO A levanta exception, ENTÃO C executa em vez de a exception subir.

### 7.3. Drawer e auto-save (FR-07, FR-08)

- [ ] **CA-15.** DADO usuário clica node tool, QUANDO drawer abre, ENTÃO mostra mesmos campos do `WorkflowStepEditor` antigo (tool select, config dict).
- [ ] **CA-16.** DADO drawer aberto, QUANDO usuário muda tool select, ENTÃO node no canvas atualiza visualmente (label) e workflow fica dirty.
- [ ] **CA-17.** DADO 5 mudanças em sequência (intervalo 100ms cada), ENTÃO apenas 1 PUT é disparado (debounce 500ms).
- [ ] **CA-18.** DADO PUT em andamento, QUANDO sucede, ENTÃO banner muda para "Salvo às hh:mm".
- [ ] **CA-19.** DADO PUT retorna 5xx, QUANDO falha, ENTÃO frontend faz retry exponential (1s, 2s, 4s) e exibe banner "Erro ao salvar — Tentar de novo" se 3 tentativas falharem.

### 7.4. Auto-layout, validação (FR-09, FR-10)

- [ ] **CA-20.** DADO workflow com 10 nodes em posições aleatórias, QUANDO usuário clica "Reorganizar", ENTÃO POST `/auto-layout` retorna positions e canvas anima reorganização em ≤300ms.
- [ ] **CA-21.** DADO grafo com ciclo, QUANDO usuário clica "Validar", ENTÃO frontend recebe `errors=[{kind:"cycle", edges:[...]}]` e exibe edges em vermelho.
- [ ] **CA-22.** DADO node não-merge com 2 edges entrando, QUANDO `/validate`, ENTÃO `errors=[{kind:"fan_in_without_merge", step_id: ...}]` e node fica vermelho.
- [ ] **CA-23.** DADO MergeNode com 0 entradas, QUANDO `/validate`, ENTÃO `errors=[{kind:"merge_with_zero_inputs", ...}]`.

### 7.5. Migration (FR-11)

- [ ] **CA-24.** DADO workflow v1 com 5 steps lineares (`next_step` chain) — qualquer mistura de tipos (tool/llm/action), QUANDO `/migrate-v2`, ENTÃO `workflow_edges` ganha 4 registros com `source_handle='out'`, `target_handle='in'`, todos `position_y` ascendentes. (Migration usa `out` para todos os tipos; é handle universal — constituição §2.4.)
- [ ] **CA-25.** DADO workflow v1 com condition step (`then`/`else`), QUANDO `/migrate-v2`, ENTÃO `workflow_edges` ganha 2 registros com handles `then` e `else` apontando para os step_ids corretos.
- [ ] **CA-26.** DADO workflow v1 linear de 3 steps, QUANDO compilado v2 vs v1, ENTÃO `StateGraph` produzido é estruturalmente equivalente (mesmas edges no LangGraph).

### 7.6. Executor — fan-out e merge (FR-04, FR-05 backend)

- [ ] **CA-27.** DADO workflow com fan-out 1→3 + merge `all`, QUANDO executor roda, ENTÃO `WorkflowRun.status='completed'` e `step_logs` tem 5 entries (1 source + 3 paralelas + 1 merge) com timestamps mostrando paralelismo.
- [ ] **CA-28.** DADO `merge_policy='any'` e 3 branches lentas/rápidas, QUANDO executor roda, ENTÃO step_log mostra 1 dos 3 com `status='completed'` e 2 com `status='cancelled'`.
- [ ] **CA-29.** DADO tool step com edge saindo de `error` ligado a action node de notificação, QUANDO tool falha, ENTÃO action node executa e `WorkflowRun.status='completed'` (não failed).

### 7.7. Migration determinismo (NFR-04)

- [ ] **CA-30.** DADO workflow v1 idêntico migrado em duas instâncias diferentes, ENTÃO `position_x/y` resultantes batem byte-a-byte. (Determinismo depende de iteração estável de adjacências; código usa `dict` Python 3.7+ que preserva insertion order. Implementação tem que ordenar por `step_id` ASC ao construir adjacência para evitar drift por ordem do SELECT do DB.)

### 7.8. RBAC e edição concorrente (FR-12, FR-13)

- [ ] **CA-31.** DADO user `Operacional` tenta PUT com tool restrita, ENTÃO backend retorna 403, frontend reverte mudança local e exibe toast.
- [ ] **CA-32.** DADO Maria abre workflow X às 14:00 e Heitor abre o mesmo às 14:03, QUANDO Heitor abre, ENTÃO banner "Maria editou há 3min" aparece (não bloqueia).

### 7.9. Limites e compatibilidade (FR-14, FR-15)

- [ ] **CA-33.** DADO workflow com 20 nodes, QUANDO usuário arrasta o 21º, ENTÃO frontend mostra toast "Limite de 20 nodes" e drop não cria node.
- [ ] **CA-34.** DADO workflow v2 conclui com sucesso, ENTÃO `workflow_outputs` tem registro com `subject_type='workflow_output'` consumível pela API-130 (POST /api/approval/submit) da SPEC-004.

### 7.10. Validações no PUT (subset crítico)

- [ ] **CA-43.** DADO PUT com workflow contendo ciclo, QUANDO chega ao backend, ENTÃO retorna 400 com `kind="cycle"`. Frontend reverte mudança local e mostra toast.
- [ ] **CA-44.** DADO PUT com workflow sem entry node (todos têm in-degree>0), QUANDO chega, ENTÃO retorna 400 com `kind="no_entry_node"`.
- [ ] **CA-45.** DADO PUT com tool não autorizada para o user, QUANDO chega, ENTÃO retorna 400 com `kind="unauthorized_tool"`.
- [ ] **CA-46.** DADO PUT com workflow tendo `fan_in_without_merge` (problema "trabalho-em-progresso"), QUANDO chega, ENTÃO retorna 200 e persiste — save NÃO é bloqueado, mas botão "Executar" fica desabilitado até `/validate` retornar `valid: true`.

### 7.11. NFRs

- [ ] **CA-35.** Bundle audit CI: rotas que não são `/workflows/[id]` têm delta ≤30KB gzipped após merge.
- [ ] **CA-36.** Render inicial 50 nodes + 70 edges p95 ≤500ms (medido via Lighthouse + RUM em staging).
- [ ] **CA-37.** axe-core Level AA em T-21 (canvas), T-22 (novo workflow), 0 violations.
- [ ] **CA-38.** ESLint custom rule bloqueia `import 'reactflow'` fora de `components/workflows/canvas/`. Quebra build local.

## 8. Suposições

- **A1.** SPEC-003 está em produção; nenhum workflow ativo tem mais de 20 steps (limite atual).
- **A2.** Todos os workflows existentes têm `next_step` / `condition` válidos; não há edge case de step órfão sem entrada.
- **A3.** O time tem ≥1 designer disponível para validar visual dos nodes (cores, hierarquia, animações).
- **A4.** RBAC do FA-09 está estável e expõe roles por user via JWT/contexto.

## 9. Riscos

| Risco | P | I | Mitigação |
|-------|---|---|-----------|
| Migration JIT corrompe workflow legado | B | A | Migration é idempotente E não-destrutiva; legacy fields permanecem; rollback fácil |
| Bundle de reactflow + dagre vaza para outras rotas | M | M | Lazy-load + ESLint custom rule + bundle audit CI |
| Auto-layout produz layout ruim em DAGs complexos | M | B | Aceitar; usuário pode ajustar manualmente; retorna ao default com botão |
| Editor concorrente perde alterações por last-write-wins | M | M | Banner amber + recomendação no docs; CRDT é V2 |
| Compiler v2 quebra retrocompat com workflows linear | B | A | Teste de invariância (CA-26) obrigatório no CI |
| Performance ruim em workflow grande (50+ nodes) | M | M | Perf budget em NFR + perf test no CI |

## 10. Notas de Implementação

1. **React Flow v12+** — usar `<ReactFlowProvider>` na rota; `useNodesState` / `useEdgesState` para state; `onNodesChange` / `onEdgesChange` para captura de mudanças.
2. **Custom node types** — `nodeTypes={{ tool: ToolNode, llm: LLMNode, ... }}`; cada componente recebe `data` (props do step).
3. **Custom edge types** — `edgeTypes={{ default: CustomEdge }}` para suportar handles tipados com cores diferentes.
4. **Dagre integration** — `dagre.graphlib.Graph()` + `dagre.layout(g)` em hook `useAutoLayout`. Direção `TB` (top-bottom).
5. **Persistência de coordenadas** — `onNodesChange` captura `position` em cada drag; debounce + PUT.
6. **Migration server-side** — usar `dagre` em Python? Não — usar `igraph` ou implementar algoritmo simples manualmente (Sugiyama de 2 camadas é ~80 linhas). Alternativa: chamar Node.js via subprocess no migration script (mais fácil mas mais frágil). **Decisão preliminar**: implementar layered layout manual em Python (~100 linhas), determinístico, sem dep nova no backend. Documentar em ADR-LOCAL no design.md.
7. **Validação síncrona no frontend** — `useGraphValidation` hook que roda em cada `onConnect`; bloqueia se cria ciclo. DFS simples.
8. **Lazy import do reactflow** — `const ReactFlow = dynamic(() => import('reactflow').then(m => m.default), { ssr: false })`.

<!-- REVIEW: Os 38 CAs cobrem o que precisa ser testável? Faltou algum fluxo? Algum FR está mal especificado? -->

## 11. Prompt para Agente

> Você implementa **TASK-XXX** da SPEC `docs/specs/large/workflow-builder-canvas/`.
>
> **Leia primeiro:** `constitution.md`, este `spec.md`, `design.md`, `plan.md` (sua fase), e a task em `tasks.md`.
>
> **Restrições obrigatórias.**
> - **Lazy-load:** importar `reactflow` ou `dagre` apenas em arquivos sob `components/workflows/canvas/`. ESLint enforce.
> - **Cross-client guard:** filtrar por `client_id` em toda query. 404 (não 403) para usuários sem acesso.
> - **Imutabilidade:** não modifique `workflow_runs` ou `workflow_step_logs` retroativamente.
> - **Determinismo:** auto-layout e migration JIT devem produzir saída determinística para o mesmo input.
> - **Compatibilidade:** workflow linear v1 deve produzir `StateGraph` byte-equivalente ao v2.
> - **Vocabulário Suno:** sem "gerar"/"otimizar"/"eficiência"/"accelerator" em copies. Sempre **Koro com K**.
>
> Não amplie escopo. Marque task concluída só após CAs listados nela passarem.

## 12. Changelog

| Versão | Data | Mudança |
|--------|------|---------|
| 1.0 | 2026-04-30 | Versão inicial — substitui SPEC-003 (workflow-builder). Estende FA-05 com canvas DnD + DAG paralelo (fan-out, merge, handles tipados). 38 CAs, 15 FRs, 6 NFRs. |
