---
spec-id: SPEC-003
slug: workflow-builder
artefato: design
atualizada: 2026-04-13
versao: 1.0
---

# Design — Workflow Builder (v1)

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────────┐
│ Frontend: sunOS (Next.js 14)                                        │
│                                                                     │
│  /workflows               → Catálogo de workflows (grid cards)      │
│  /workflows/new            → Builder UI (steps + config + schedule)  │
│  /workflows/[id]           → Editar workflow existente               │
│  /workflows/[id]/runs      → Histórico de execuções (timeline)       │
│                                                                     │
│  components/workflows/                                               │
│  ├── WorkflowCard.tsx          Card com nome, steps, status, cron    │
│  ├── WorkflowBuilder.tsx       Lista de steps add/remove/reorder     │
│  ├── WorkflowStepEditor.tsx    Configurar um step (tool, prompt)     │
│  ├── WorkflowRunTimeline.tsx   Timeline de execuções com logs        │
│  └── WorkflowTemplates.tsx     Templates pré-construídos             │
│                                                                     │
│  contexts/WorkflowsContext.tsx  (fetch + CRUD state)                 │
│  lib/workflow-types.ts          (TypeScript types)                   │
│  hooks/useWorkflowRun.ts        (polling de execução via SSE)        │
└───────────────────────┬─────────────────────────────────────────────┘
                        │ HTTPS / SSE
                        │
┌───────────────────────▼─────────────────────────────────────────────┐
│ Backend: sunos-api (FastAPI + LangGraph)                            │
│                                                                     │
│  workflows/router.py       API endpoints (CRUD + run + resume)      │
│       │                                                             │
│       ▼                                                             │
│  workflows/compiler.py     WorkflowDefinition JSON → StateGraph     │
│       │                                                             │
│       ▼                                                             │
│  workflows/executor.py     Executa StateGraph compilado              │
│       │                    Salva output de cada step em WorkflowState│
│       │                    Emite SSE events durante execução         │
│       │                                                             │
│       ├── Step type "tool"      → resolve tool + chama              │
│       ├── Step type "llm"       → prompt + LLM call                 │
│       ├── Step type "condition"  → avalia condição, branching        │
│       ├── Step type "action"    → send_slack, send_email, etc.      │
│       └── Step type "hitl"      → interrupt() + aguarda resume      │
│                                                                     │
│  workflows/scheduler.py    Cloud Scheduler integration              │
│       │                    Cria/atualiza/remove jobs no GCP          │
│       │                    Job chama POST /api/workflows/{id}/run   │
│       │                    com service account token                 │
│                                                                     │
│  workflows/schemas.py      Pydantic models (request/response)       │
│  workflows/models.py       SQLAlchemy models (Workflow, WorkflowRun)│
│                                                                     │
│  chat/tools/               Tools compartilhadas (já existentes)     │
│  ├── chat_tools.py         generate_text, search_knowledge          │
│  ├── text_tools.py         geração por tipo/tom                     │
│  ├── image_tools.py        generate_image                           │
│  ├── search_tools.py       web search                               │
│  └── (futuras)             send_slack, send_email, fetch_url        │
│                                                                     │
│  PostgreSQL (Cloud SQL)  ← workflows, workflow_runs, step_logs      │
│  Cloud Scheduler         ← cron jobs para execução automática       │
│  MLflow                  ← traces de cada execução                  │
└─────────────────────────────────────────────────────────────────────┘
```

## Fluxo de Compilação: WorkflowDefinition → StateGraph

```
WorkflowDefinition (JSON no PostgreSQL)
  │
  │ Em runtime, compiler.py lê a definição:
  │
  ▼
compiler.compile(definition) → StateGraph
  │
  │ Para cada step na definição:
  │   1. Cria um node genérico (generic_step_executor)
  │   2. O node lê step.type e step.config
  │   3. Resolve a tool via tool_name (tool registry)
  │   4. Executa e salva output em state.steps_output[step.id]
  │
  │ Edges:
  │   - Linear: step_1 → step_2 → step_3 → END
  │   - Condicional: step.condition define branching
  │   - HITL: step type "hitl" insere interrupt()
  │
  ▼
CompiledStateGraph (LangGraph)
  │
  │ executor.run(compiled_graph, initial_state)
  │
  ▼
WorkflowRun (resultado salvo no PostgreSQL)
```

**Decisao critica**: Compilacao em runtime (NOT pre-compiled). Permite hot-update de workflows sem redeploy. O usuario edita a definicao JSON e a proxima execucao ja usa a versao atualizada.

## WorkflowState

```python
class WorkflowState(TypedDict):
    """State compartilhado entre todos os nodes de um workflow."""

    # Identificadores
    workflow_id: str
    run_id: str

    # Outputs de cada step (step_id → output dict)
    steps_output: dict[str, Any]

    # Controle de execucao
    current_step: str
    status: str                    # "running" | "paused" | "completed" | "failed"

    # Mensagens LangGraph (para steps LLM)
    messages: Annotated[list[BaseMessage], add_messages]

    # Input do usuario (para HITL resume)
    human_input: str | None

    # Metadata
    started_at: str
    model: str
    error: str | None
```

O `steps_output` e o mecanismo central de passagem de dados entre steps. Cada step pode referenciar outputs anteriores via template: `{{steps.step_1.output}}`.

## Decisoes Tecnicas

### 1. Compiler Pattern — WorkflowDefinition → StateGraph

```python
# workflows/compiler.py
class WorkflowCompiler:
    def __init__(self, tool_registry: dict[str, Callable]):
        self.tool_registry = tool_registry

    def compile(self, definition: WorkflowDefinition) -> CompiledStateGraph:
        graph = StateGraph(WorkflowState)

        # Registra um node para cada step
        for step in definition.steps:
            node_fn = self._make_step_node(step)
            graph.add_node(step.id, node_fn)

        # Edges lineares (step.next_step) ou condicionais
        graph.add_edge(START, definition.steps[0].id)
        for step in definition.steps:
            if step.condition:
                graph.add_conditional_edges(step.id, self._make_condition(step))
            elif step.next_step:
                graph.add_edge(step.id, step.next_step)
            else:
                graph.add_edge(step.id, END)

        return graph.compile()

    def _make_step_node(self, step: WorkflowStep) -> Callable:
        """Cria uma funcao node que executa o step."""
        async def node_fn(state: WorkflowState) -> WorkflowState:
            state["current_step"] = step.id

            if step.type == "tool":
                tool = self.tool_registry[step.tool_name]
                result = await tool.ainvoke(step.config)
            elif step.type == "llm":
                result = await self._run_llm(step, state)
            elif step.type == "action":
                result = await self._run_action(step, state)
            elif step.type == "hitl":
                # Pausa execucao e aguarda input humano
                result = interrupt({"step_id": step.id, "prompt": step.prompt})

            state["steps_output"][step.id] = result
            return state

        return node_fn
```

### 2. Cloud Scheduler Integration

```python
# workflows/scheduler.py
from google.cloud import scheduler_v1

class WorkflowScheduler:
    def __init__(self, project_id: str, location: str, api_base_url: str):
        self.client = scheduler_v1.CloudSchedulerClient()
        self.parent = f"projects/{project_id}/locations/{location}"
        self.api_base_url = api_base_url

    def create_or_update(self, workflow: WorkflowDefinition) -> str:
        """Cria/atualiza job no Cloud Scheduler."""
        if not workflow.schedule or not workflow.schedule.enabled:
            return self.delete(workflow.id)

        job = scheduler_v1.Job(
            name=f"{self.parent}/jobs/workflow-{workflow.id}",
            schedule=workflow.schedule.cron,
            time_zone=workflow.schedule.timezone,
            http_target=scheduler_v1.HttpTarget(
                uri=f"{self.api_base_url}/api/workflows/{workflow.id}/run",
                http_method=scheduler_v1.HttpMethod.POST,
                oidc_token=scheduler_v1.OidcToken(
                    service_account_email=settings.SCHEDULER_SA_EMAIL,
                ),
            ),
        )
        return self.client.create_job(parent=self.parent, job=job)

    def delete(self, workflow_id: str) -> None:
        """Remove job do Cloud Scheduler."""
        job_name = f"{self.parent}/jobs/workflow-{workflow_id}"
        try:
            self.client.delete_job(name=job_name)
        except Exception:
            pass  # Job nao existe, ok
```

### 3. HITL — Interrupt e Resume

```python
# Dentro do executor, um step tipo "hitl":
from langgraph.types import interrupt, Command

# No node:
async def hitl_node(state: WorkflowState) -> WorkflowState:
    human_response = interrupt({
        "step_id": step.id,
        "question": step.prompt,
        "context": state["steps_output"],
    })
    state["steps_output"][step.id] = {"human_input": human_response}
    return state

# Resume via API:
# POST /api/workflows/{id}/runs/{run_id}/resume
# Body: {"input": "aprovado, pode continuar"}
# → executor carrega checkpoint, faz Command(resume=input)
```

### 4. Step Executor Generico

Cada node do graph e um executor generico que:
1. Le `step.type` e `step.config` da definicao
2. Resolve templates em config (ex: `{{steps.briefing.output}}`)
3. Chama a tool ou LLM apropriada
4. Salva resultado em `state.steps_output[step.id]`
5. Loga step no banco (step_logs)

```python
async def _resolve_templates(config: dict, steps_output: dict) -> dict:
    """Substitui {{steps.X.output}} pelos valores reais."""
    resolved = {}
    for key, value in config.items():
        if isinstance(value, str) and "{{steps." in value:
            # Extrai step_id e campo
            # {{steps.briefing.output}} → steps_output["briefing"]["output"]
            resolved[key] = _extract_ref(value, steps_output)
        else:
            resolved[key] = value
    return resolved
```

### 5. Notificacoes como Action Tools

`send_slack` e `send_email` sao steps tipo "action" que usam tools dedicadas:

```python
# tools/action_tools.py (futuro)
@tool
async def send_slack(channel: str, message: str) -> dict:
    """Envia mensagem para canal Slack via webhook."""
    ...

@tool
async def send_email(to: str, subject: str, body: str) -> dict:
    """Envia email via SendGrid/SMTP."""
    ...
```

Resultados vao para `steps_output` e `step_logs` como qualquer outro step.

### 6. Error Handling

```python
# No executor:
try:
    result = await node_fn(state)
    log_step(run_id, step.id, status="completed", output=result)
except Exception as e:
    state["status"] = "failed"
    state["error"] = str(e)
    log_step(run_id, step.id, status="failed", error=str(e))

    # Notifica se configurado
    if definition.on_error_notify:
        await send_slack(channel=definition.on_error_notify, message=f"Workflow {definition.name} falhou no step {step.name}: {e}")

    # NAO continua para proximos steps
    return state
```

### 7. Tool Registry

```python
# workflows/compiler.py
from chat.tools.chat_tools import generate_text_tool
from chat.tools.text_tools import text_generation_tool
from chat.tools.image_tools import generate_image_tool
from chat.tools.search_tools import web_search_tool

TOOL_REGISTRY: dict[str, BaseTool] = {
    "generate_text": generate_text_tool,
    "generate_image": generate_image_tool,
    "search_knowledge": web_search_tool,
    "text_generation": text_generation_tool,
    # futuras:
    # "send_slack": send_slack_tool,
    # "send_email": send_email_tool,
    # "query_data": query_data_tool,
    # "fetch_url": fetch_url_tool,
    # "export_ppt": export_ppt_tool,
    # "analyze_data": analyze_data_tool,
}
```

## Estrutura de Arquivos

### Backend

```
api/
  workflows/
    __init__.py            # Module init
    router.py              # API endpoints (CRUD + run + resume)
    schemas.py             # Pydantic models (WorkflowDefinition, WorkflowStep, etc.)
    compiler.py            # WorkflowDefinition → StateGraph
    executor.py            # Executa workflow compilado + SSE streaming
    scheduler.py           # Cloud Scheduler integration
    models.py              # SQLAlchemy models (Workflow, WorkflowRun, StepLog)
  chat/tools/              # Tools compartilhadas (existentes)
    chat_tools.py
    text_tools.py
    image_tools.py
    search_tools.py
    prompt_tools.py
    (futuro) action_tools.py   # send_slack, send_email
  main.py                  # ← mount workflows router
```

### Frontend

```
app/workflows/
  page.tsx                       # Catalogo (grid de WorkflowCards)
  new/page.tsx                   # Builder (criar novo workflow)
  [workflowId]/page.tsx          # Editar workflow existente
  [workflowId]/runs/page.tsx     # Historico de execucoes

components/workflows/
  WorkflowCard.tsx               # Card com nome, n steps, schedule, status
  WorkflowBuilder.tsx            # Lista de steps com add/remove/reorder/configure
  WorkflowStepEditor.tsx         # Modal/panel para configurar um step
  WorkflowRunTimeline.tsx        # Timeline visual de execucoes com status por step
  WorkflowTemplates.tsx          # Grid de templates pre-construidos

contexts/WorkflowsContext.tsx    # Provider com estado + CRUD
lib/workflow-types.ts            # TypeScript types
hooks/useWorkflowRun.ts          # Hook SSE para acompanhar execucao
```

### Arquivos Modificados

| Arquivo | Mudanca |
|---------|---------|
| `components/layout/Sidebar.tsx` | Adicionar item "Workflows" na navegacao |
| `components/layout/Providers.tsx` | Registrar `WorkflowsProvider` (se necessario) |
| `api/main.py` | Mount `workflows.router` com prefix `/api/workflows` |

## Endpoints da API

| Metodo | Path | Descricao |
|--------|------|-----------|
| `GET` | `/api/workflows` | Listar workflows |
| `POST` | `/api/workflows` | Criar workflow |
| `GET` | `/api/workflows/{id}` | Detalhe do workflow |
| `PUT` | `/api/workflows/{id}` | Atualizar workflow |
| `DELETE` | `/api/workflows/{id}` | Remover workflow |
| `POST` | `/api/workflows/{id}/run` | Executar workflow (manual ou scheduler) |
| `GET` | `/api/workflows/{id}/runs` | Listar execucoes |
| `GET` | `/api/workflows/{id}/runs/{run_id}` | Detalhe de execucao + step logs |
| `POST` | `/api/workflows/{id}/runs/{run_id}/resume` | Resumir workflow pausado (HITL) |
| `GET` | `/api/workflows/{id}/runs/{run_id}/stream` | SSE stream de execucao em andamento |
| `POST` | `/api/workflows/{id}/schedule` | Criar/atualizar schedule no Cloud Scheduler |
| `DELETE` | `/api/workflows/{id}/schedule` | Remover schedule |
| `GET` | `/api/workflows/templates` | Listar templates disponiveis |

## Modelos de Dados (PostgreSQL)

```sql
-- Workflow definition
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_by VARCHAR(255) NOT NULL,
    definition JSONB NOT NULL,          -- WorkflowDefinition completa
    schedule_cron VARCHAR(100),
    schedule_timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    schedule_enabled BOOLEAN DEFAULT FALSE,
    client_scope TEXT[],                -- clientes que podem usar
    default_model VARCHAR(50) DEFAULT 'gemini-flash',
    max_execution_time INT DEFAULT 300,
    on_error_notify VARCHAR(255),       -- canal Slack para erros
    is_template BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow execution
CREATE TABLE workflow_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending|running|paused|completed|failed
    trigger VARCHAR(20) NOT NULL DEFAULT 'manual',  -- manual|scheduler|api
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error TEXT,
    steps_output JSONB DEFAULT '{}',
    checkpoint_data JSONB,              -- LangGraph checkpoint para HITL resume
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step execution log
CREATE TABLE step_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES workflow_runs(id) ON DELETE CASCADE,
    step_id VARCHAR(100) NOT NULL,
    step_name VARCHAR(255),
    status VARCHAR(20) NOT NULL,        -- running|completed|failed|skipped
    input JSONB,
    output JSONB,
    error TEXT,
    duration_ms INT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_workflow_runs_workflow ON workflow_runs(workflow_id);
CREATE INDEX idx_workflow_runs_status ON workflow_runs(status);
CREATE INDEX idx_step_logs_run ON step_logs(run_id);
```

## Impacto no Codigo Existente

| Componente | Impacto |
|-----------|---------|
| `chat/tools/*` | Nenhum. Tools sao reutilizadas via import. |
| `chat/graph/*` | Nenhum. Workflow Builder usa `StateGraph` diretamente, nao o chat graph. |
| `models/` | Adiciona `workflow.py` com novos modelos SQLAlchemy. |
| `main.py` | Adiciona `app.include_router(workflow_router)`. |
| `components/layout/Sidebar.tsx` | Adiciona link "/workflows". |

O Workflow Builder e um modulo independente que reutiliza tools existentes mas tem seu proprio graph, state e executor.

<!-- REVIEW -->
**Checkpoint**: A separacao entre chat graph e workflow graph esta clara? O compiler pattern faz sentido para hot-update?

## Changelog

| Versao | Data | Mudanca |
|--------|------|---------|
| 1.0 | 2026-04-13 | Design inicial. Compiler pattern, WorkflowState, HITL, Cloud Scheduler. |
