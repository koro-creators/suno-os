---
spec-id: SPEC-012
slug: workflow-chaining
nivel-sdd: spec-anchored
tamanho: medium
status: rascunho
criada: 2026-04-14
atualizada: 2026-04-14
versao: 1.0
escopo:
  projeto: sunos
  stack: "Frontend: Next.js 14 | Backend: FastAPI + LangGraph"
  autor: Heitor Miranda
  papel: Tech Lead
  branch: master
  contexto: Permitir que workflows encadeiem outros workflows como steps
arquivos-relacionados:
  - api/workflows/compiler.py
  - api/workflows/executor.py
  - api/workflows/schemas.py
  - api/workflows/router.py
  - lib/workflow-types.ts
  - components/workflows/WorkflowStepEditor.tsx
  - components/workflows/WorkflowBuilder.tsx
notas:
  - "Frontend refs (WorkflowBuilder.tsx, WorkflowStepEditor.tsx) são pré-canvas — atualizar para SPEC-005 canvas components quando implementar"
  - "Handle vocabulary para step type workflow: source=out/error (canvas-conventions.md)"
---

# Workflow Chaining — Encadeamento de Workflows

## 1. Resumo

**O quê**: Novo step type `"workflow"` que executa outro workflow como sub-step, passando output do step anterior como input e retornando o resultado final do sub-workflow.
**Por quê**: Equipes criam workflows atômicos (ex: "Gerar briefing", "Analisar sentimento") e precisam compô-los em fluxos maiores sem duplicar steps. Isso habilita reuso, modularidade e orquestração de pipelines complexos.
**Para quem**: Analistas e coordenadores que já usam o Workflow Builder.
**Tamanho estimado**: ~8 arquivos (4 backend + 4 frontend)

## 2. Comportamento Especificado

### 2.1 Fluxo Principal — Execução de Sub-Workflow

1. Usuário cria um workflow "pai" com um step tipo `workflow`
2. No step, seleciona qual workflow será executado (por `workflow_id`)
3. Opcionalmente configura `input_mapping` — quais campos do output anterior viram input do sub-workflow
4. Ao executar o workflow pai, quando chega no step `workflow`:
   a. Compiler cria o node com referência ao sub-workflow
   b. Executor busca a definition do sub-workflow referenciado
   c. Executor compila e executa o sub-workflow como um graph nested
   d. O `final_output` do sub-workflow vira o output do step no workflow pai
   e. Execução do pai continua normalmente com o próximo step
5. Step logs do sub-workflow são registrados como filhos do step log do pai

### 2.2 Fluxos Alternativos

**FA-01: Sub-workflow com HITL**
- Condição: o sub-workflow contém um step tipo `hitl`
- Comportamento: a execução do workflow pai pausa junto. O run do pai fica com status `paused`. Ao resumir o HITL do sub-workflow, a execução do pai continua automaticamente.

**FA-02: Sub-workflow com schedule próprio**
- Condição: o workflow referenciado tem schedule ativo
- Comportamento: irrelevante — quando usado como sub-workflow, o schedule é ignorado. O sub-workflow executa inline, não via Cloud Scheduler.

**FA-03: Encadeamento multi-nível (workflow → workflow → workflow)**
- Condição: um sub-workflow também contém steps tipo `workflow`
- Comportamento: permitido até **3 níveis de profundidade**. No 4º nível, falha com erro `max_depth_exceeded`.

**FA-04: Input override do pai para o filho**
- Condição: step config contém `input_mapping`
- Comportamento: os campos mapeados são injetados como `config_overrides` no state inicial do sub-workflow. Steps do sub-workflow podem acessar via `{{config.campo}}`.

### 2.3 Fluxos de Erro

| Condição de Erro | Resposta Esperada | Comportamento |
|------------------|-------------------|---------------|
| `workflow_id` referencia workflow inexistente | Step falha com `workflow_not_found` | Run do pai marcado como `failed` |
| `workflow_id` referencia o próprio workflow (recursão direta) | Rejeitar na validação (create/update) | HTTP 422 com mensagem `circular_reference` |
| Recursão indireta (A→B→A) | Detectar em runtime, abort | Step falha com `circular_reference_detected` |
| Sub-workflow falha em algum step | Output do step `workflow` = `{error: ...}` | Workflow pai pode continuar (se step seguinte existir) ou falhar |
| Profundidade > 3 níveis | Step falha com `max_depth_exceeded` | Run marcado como `failed` |
| Sub-workflow excede timeout do pai | Timeout aplicado ao tempo total | Run do pai marcado como `failed` com `timeout` |

## 3. Interface & Contratos

### 3.1 Novo Step Type no Schema

**Backend (Pydantic)**:
```python
class WorkflowStep(BaseModel):
    id: str
    name: str
    type: str  # "tool" | "llm" | "condition" | "action" | "hitl" | "workflow"  ← NOVO
    tool_name: str | None = None
    prompt: str | None = None
    workflow_id: str | None = None       # ← NOVO: ID do sub-workflow
    input_mapping: dict | None = None    # ← NOVO: {campo_sub: "{{steps.X.campo}}"}
    config: dict = {}
    next_step: str | None = None
    condition: dict | None = None
```

**Frontend (TypeScript)**:
```typescript
export interface WorkflowStep {
  id: string;
  name: string;
  type: 'tool' | 'llm' | 'condition' | 'action' | 'hitl' | 'workflow';  // ← NOVO
  tool_name?: string;
  prompt?: string;
  workflow_id?: string;         // ← NOVO
  input_mapping?: Record<string, string>;  // ← NOVO
  config: Record<string, unknown>;
  next_step?: string;
  condition?: { field: string; operator: string; value: unknown; then: string; else: string };
}
```

### 3.2 Validação no Create/Update

No endpoint `POST /api/workflows` e `PUT /api/workflows/{id}`, para steps tipo `workflow`:

1. `workflow_id` é obrigatório
2. `workflow_id` não pode ser o próprio workflow (recursão direta)
3. `workflow_id` deve referenciar um workflow existente
4. Validação de profundidade: percorrer sub-workflows até 3 níveis

### 3.3 Compiler — Novo Node Type

No `WorkflowCompiler._make_step_node()`, adicionar handler para `step_type == "workflow"`:

```python
elif step_type == "workflow":
    target_workflow_id = step.get("workflow_id")
    input_mapping = step.get("input_mapping", {})
    # 1. Buscar definition do sub-workflow (in-memory store ou DB)
    # 2. Resolver input_mapping com template refs do state atual
    # 3. Compilar sub-workflow via WorkflowCompiler()
    # 4. Executar sub-workflow com state inicial
    # 5. Retornar final_output como resultado do step
```

### 3.4 Executor — Profundidade

O executor passa `depth` como parâmetro. Cada sub-workflow incrementa `depth + 1`. Se `depth >= 3`, abort.

```python
class WorkflowExecutor:
    async def run(self, workflow_id, run_id, definition, overrides={}, depth=0):
        if depth >= 3:
            raise ValueError("max_depth_exceeded: maximum nesting depth is 3")
        # ... execução normal ...
```

### 3.5 Frontend — StepEditor para tipo "workflow"

Quando o usuário seleciona tipo `workflow` no StepEditor:

- Mostrar select com lista de workflows existentes (excluindo o workflow sendo editado)
- Mostrar campo de input_mapping (JSON ou form simplificado)
- Preview: nome e steps_count do sub-workflow selecionado

## 4. Restrições Técnicas

### 4.1 Stack & Padrões

- Backend: Python 3.11+, FastAPI, LangGraph StateGraph
- Frontend: Next.js 14, TypeScript, inline styles, CSS variables
- Padrão: mesmo do módulo workflows existente (SPEC-003)

### 4.2 Performance

- Sub-workflow é executado inline (não cria WorkflowRun separado) — simplifica UX e evita race conditions
- Timeout do workflow pai se aplica ao tempo total incluindo sub-workflows
- Sem paralelização de sub-workflows na v1 (execução sequencial)

### 4.3 Segurança

- Validação de referência circular obrigatória (estática em create/update + runtime)
- Sub-workflow herda o contexto de auth do workflow pai
- Limite de profundidade = 3 (hardcoded, não configurável na v1)

### 4.4 Limites e Dependências

- Depende do CRUD de workflows existente (SPEC-003)
- Sub-workflow reutiliza o mesmo `WorkflowCompiler` e `WorkflowExecutor`
- In-memory store: buscar definition do sub-workflow do mesmo store
- Na v2 com PostgreSQL: buscar via query

## 5. Critérios de Aceite

### Critérios Funcionais

- [ ] **CA-01**: DADO workflow "Pai" com step tipo `workflow` referenciando "Filho", QUANDO executo "Pai", ENTÃO step `workflow` executa todos os steps de "Filho" e retorna o output final
- [ ] **CA-02**: DADO step `workflow` com `input_mapping: {"query": "{{steps.s1.output}}"}`, QUANDO executa, ENTÃO o sub-workflow recebe o valor mapeado como config_override
- [ ] **CA-03**: DADO sub-workflow com step `hitl`, QUANDO execução chega nesse step, ENTÃO run do workflow pai fica `paused`
- [ ] **CA-04**: DADO sub-workflow com 3 steps (tool → llm → action), QUANDO todos completam, ENTÃO output do step `workflow` no pai = output do último step do filho
- [ ] **CA-05**: DADO workflow_id que aponta para o próprio workflow, QUANDO tento salvar, ENTÃO recebo erro 422 `circular_reference`
- [ ] **CA-06**: DADO encadeamento A → B → C → D (4 níveis), QUANDO executo A, ENTÃO falha com `max_depth_exceeded` no nível 4
- [ ] **CA-07**: DADO workflow_id de workflow inexistente, QUANDO executa, ENTÃO step falha com `workflow_not_found`

### Critérios Não-Funcionais

- [ ] **CA-NF-01**: Timeout do workflow pai se aplica ao tempo total (incluindo sub-workflows)
- [ ] **CA-NF-02**: Step logs do sub-workflow são visíveis no detalhe do run do pai

### Critérios de Regressão

- [ ] Workflows sem steps tipo `workflow` continuam funcionando normalmente
- [ ] Steps tipo `tool`, `llm`, `condition`, `action`, `hitl` não são afetados
- [ ] Frontend: builder e catalog continuam renderizando workflows existentes
- [ ] `npx tsc --noEmit` + `npm run build` — zero errors

## 6. Tasks

### TASK-01: Atualizar schemas e types
- **Escopo**: Adicionar `workflow_id` e `input_mapping` nos schemas Pydantic e TypeScript
- **Arquivos**: `api/workflows/schemas.py`, `lib/workflow-types.ts`
- **Depende de**: nenhuma
- **Critérios**: suporte ao novo tipo nos schemas

### TASK-02: Implementar node `workflow` no compiler
- **Escopo**: Handler para `step_type == "workflow"` que busca, compila e executa sub-workflow
- **Arquivos**: `api/workflows/compiler.py`
- **Depende de**: TASK-01
- **Critérios**: CA-01, CA-02, CA-04

### TASK-03: Controle de profundidade + detecção de ciclo
- **Escopo**: Parâmetro `depth` no executor, validação circular em create/update
- **Arquivos**: `api/workflows/executor.py`, `api/workflows/router.py`
- **Depende de**: TASK-02
- **Critérios**: CA-05, CA-06, CA-07

### TASK-04: Frontend — StepEditor para tipo "workflow"
- **Escopo**: Select de workflow no StepEditor, preview de sub-workflow, input_mapping field
- **Arquivos**: `components/workflows/WorkflowStepEditor.tsx`
- **Depende de**: TASK-01
- **Critérios**: UI permite selecionar sub-workflow e configurar mapping

### TASK-05: Frontend — Visual de step "workflow" no Builder
- **Escopo**: Badge visual diferenciado para steps tipo `workflow`, cor distinta, ícone de link/chain
- **Arquivos**: `components/workflows/WorkflowBuilder.tsx`
- **Depende de**: TASK-04
- **Critérios**: Step tipo workflow visualmente distinguível dos outros tipos

### TASK-06: Verificação e build
- **Escopo**: tsc, build, teste manual de criação e execução
- **Arquivos**: nenhum novo
- **Depende de**: TASK-01 a TASK-05
- **Critérios**: CA-NF-01, CA-NF-02, todos os critérios de regressão

## 7. Notas de Implementação

- **Reutilizar WorkflowCompiler**: o node `workflow` cria uma nova instância de `WorkflowCompiler` e chama `compile()` + `ainvoke()` inline. Isso é simples e evita complexidade de subgraphs do LangGraph.
- **In-memory store**: buscar a definition do sub-workflow do mesmo dict `_workflows` do router. Na v2 com DB, trocar por query.
- **Step logs de sub-workflow**: na v1, o output consolidado aparece no step log do pai. Na v2, expandir para mostrar step-by-step.
- **Não criar WorkflowRun separado** para sub-workflows — a execução é inline, como uma function call. Isso simplifica o modelo e evita runs "órfãos".
- **Cor do step no builder**: sugestão `#EC4899` (pink/magenta) para diferenciar de tool (azul), llm (roxo), etc.
- **Ícone**: `GitBranch` ou `Workflow` do lucide-react.
- **Recursão indireta**: na v1, a detecção em runtime (via depth) é suficiente. Detecção estática completa (grafo de dependências) pode vir na v2.

## 8. Prompt para Agente

Implementar encadeamento de workflows no sunOS. Novo step type `"workflow"` que executa outro workflow como sub-step.

**Stack**: Python 3.11, FastAPI, LangGraph / Next.js 14, TypeScript, inline styles.

**Backend — Modificar**:

1. `api/workflows/schemas.py` — Adicionar campos `workflow_id: str | None` e `input_mapping: dict | None` ao WorkflowStep schema

2. `api/workflows/compiler.py` — No `_make_step_node()`, adicionar handler para `step_type == "workflow"`:
   - Buscar definition do sub-workflow via `_workflows` store (import do router)
   - Resolver `input_mapping` templates com `_resolve_templates()`
   - Criar novo `WorkflowCompiler().compile(sub_definition)`
   - Executar via `await sub_graph.ainvoke(initial_state)` com `depth + 1`
   - Se `depth >= 3`, raise `ValueError("max_depth_exceeded")`
   - Retornar `final_output` do sub-workflow como resultado do step

3. `api/workflows/executor.py` — Adicionar parâmetro `depth: int = 0` ao `run()` e `run_stream()`

4. `api/workflows/router.py` — Na validação de create/update, rejeitar se algum step tipo `workflow` tem `workflow_id` igual ao próprio workflow

**Frontend — Modificar**:

5. `lib/workflow-types.ts` — Adicionar `'workflow'` ao union type de `WorkflowStep.type`, adicionar `workflow_id?: string` e `input_mapping?: Record<string, string>`

6. `components/workflows/WorkflowStepEditor.tsx` — Quando `type === 'workflow'`:
   - Mostrar select com workflows disponíveis (via `useWorkflows()`, excluindo o atual)
   - Mostrar campo de input_mapping como textarea JSON
   - Preview: nome + steps_count do sub-workflow selecionado

7. `components/workflows/WorkflowBuilder.tsx` — Adicionar cor `workflow: '#EC4899'` e label `'Workflow'` nos dicts de step types. Ícone: `GitBranch` do lucide-react.

**Restrições**:
- Max 3 níveis de nesting
- Sub-workflow executa inline (sem WorkflowRun separado)
- Validar referência circular no create/update (self-reference)
- Timeout do pai se aplica ao total

<!-- REVIEW -->
**Checkpoint**: A especificação captura o que você realmente quer construir? Algum cenário de encadeamento que está faltando?
