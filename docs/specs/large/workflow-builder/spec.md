---
spec-id: SPEC-003
slug: workflow-builder
artefato: spec
nivel-sdd: spec-anchored
tamanho: large
status: rascunho
criada: 2026-04-13
atualizada: 2026-04-13
versao: 1.0
escopo:
  projeto: sunos
  stack: "Frontend: Next.js 14 | Backend: FastAPI + LangGraph"
  autor: Heitor Miranda
  papel: Tech Lead
  branch: master
  contexto: Empoderar times nao-engenharia a criar automacoes de AI usando tools existentes do LangGraph
---

# Spec — Workflow Builder

## Resumo

Construir um Workflow Builder no sunOS que permite times nao-engenharia (Midia, BI, Financeiro, Planejamento, Growth, Operacoes) criar workflows automatizados usando as mesmas tools do chat. Cada workflow definition e JSON armazenado no PostgreSQL, compilado em runtime para um LangGraph `StateGraph`. Suporte a HITL (pause/resume), scheduling via Cloud Scheduler, templates pre-configurados, e logging completo de cada execucao.

**O que**: Builder de workflows visuais que compilam para LangGraph StateGraph
**Por que**: Time de engenharia (4 devs) nao escala como gargalo de toda automacao. Empoderar analistas.
**Para quem**: Analistas seniors, coordenadores e plenos de Midia, BI, Financeiro, Planejamento, Growth e Operacoes

## Data Model

### WorkflowDefinition

```python
class WorkflowDefinition(BaseModel):
    id: str                              # UUID
    name: str                            # "Report Mensal de Midia"
    description: str                     # descricao do que faz
    created_by: str                      # user ID (Firebase)
    
    # Steps
    steps: list[WorkflowStep]            # lista ordenada de steps
    
    # Schedule (optional)
    schedule: CronSchedule | None = None
    
    # Scope
    client_scope: list[str] = []         # clientes que podem usar
    
    # Config
    default_model: str = "gemini-flash"  # LLM default para steps tipo "llm"
    max_execution_time: int = 300        # max 5 minutos (em segundos)
    
    # Status
    status: str = "draft"                # "draft" | "active" | "paused"
    
    # Timestamps
    created_at: datetime
    updated_at: datetime
```

### WorkflowStep

```python
class WorkflowStep(BaseModel):
    id: str                              # UUID
    name: str                            # "Buscar dados de performance"
    type: str                            # "tool" | "llm" | "condition" | "action" | "hitl"
    
    # Tool config (type = "tool")
    tool_name: str | None = None         # "generate_text", "search_knowledge", etc.
    
    # LLM config (type = "llm")
    prompt: str | None = None            # prompt template com {{previous_output}}
    
    # General config
    config: dict = {}                    # parametros especificos do step
    
    # Flow control
    next_step: str | None = None         # ID do proximo step (linear)
    condition: dict | None = None        # para branching (type = "condition")
    # condition format: {"field": "anomaly_detected", "operator": "eq", "value": true, "then": "step_id_true", "else": "step_id_false"}
```

### CronSchedule

```python
class CronSchedule(BaseModel):
    cron: str                            # "0 9 * * 1" = segunda 9h
    timezone: str = "America/Sao_Paulo"
    enabled: bool = True
```

### WorkflowRun

```python
class WorkflowRun(BaseModel):
    id: str                              # UUID
    workflow_id: str                     # FK para WorkflowDefinition
    status: str                          # "running" | "completed" | "failed" | "paused"
    started_at: datetime
    completed_at: datetime | None = None
    steps_completed: int = 0             # quantos steps executou
    results: dict = {}                   # output final do workflow
    error: str | None = None             # mensagem de erro se falhou
    trigger: str = "manual"              # "manual" | "schedule"
```

### WorkflowStepLog

```python
class WorkflowStepLog(BaseModel):
    id: str                              # UUID
    run_id: str                          # FK para WorkflowRun
    step_id: str                         # FK para WorkflowStep
    step_name: str                       # nome do step para display
    status: str                          # "running" | "completed" | "failed" | "skipped"
    input: dict                          # input recebido pelo step
    output: dict                         # output produzido pelo step
    duration_ms: int                     # duracao em milliseconds
    tokens_used: int = 0                 # tokens consumidos (steps LLM/tool)
    started_at: datetime
    completed_at: datetime | None = None
```

## API Endpoints

```
POST   /api/workflows                          # criar workflow
GET    /api/workflows                          # listar (filter: creator, status)
GET    /api/workflows/{id}                     # detalhe com steps
PUT    /api/workflows/{id}                     # atualizar
DELETE /api/workflows/{id}                     # deletar

POST   /api/workflows/{id}/run                 # executar agora
GET    /api/workflows/{id}/runs                # historico de execucoes
GET    /api/workflows/{id}/runs/{run_id}       # detalhe do run com step logs
POST   /api/workflows/{id}/runs/{run_id}/resume # retomar run pausado (HITL)

POST   /api/workflows/{id}/schedule            # ativar/atualizar schedule
DELETE /api/workflows/{id}/schedule            # desativar schedule
```

### Endpoint: Criar Workflow

**POST /api/workflows**

```python
class CreateWorkflowRequest(BaseModel):
    name: str
    description: str
    steps: list[WorkflowStep]
    schedule: CronSchedule | None = None
    client_scope: list[str] = []
    default_model: str = "gemini-flash"
    max_execution_time: int = 300

class CreateWorkflowResponse(BaseModel):
    id: str
    name: str
    status: str
    created_at: datetime
```

### Endpoint: Executar Workflow

**POST /api/workflows/{id}/run**

```python
class RunWorkflowRequest(BaseModel):
    input_overrides: dict = {}           # sobrescrever config de steps
    model_override: str | None = None    # usar modelo diferente do default

class RunWorkflowResponse(BaseModel):
    run_id: str
    status: str                          # "running"
    started_at: datetime
```

### Endpoint: Retomar Run Pausado (HITL)

**POST /api/workflows/{id}/runs/{run_id}/resume**

```python
class ResumeRunRequest(BaseModel):
    approved: bool                       # aprovar ou rejeitar o step pausado
    feedback: str | None = None          # feedback opcional do reviewer
    modifications: dict = {}             # alteracoes no output antes de continuar

class ResumeRunResponse(BaseModel):
    run_id: str
    status: str                          # "running" (retomou)
    resumed_at: datetime
```

### Endpoint: Listar Workflows

**GET /api/workflows**

Query params: `creator`, `status`, `page`, `per_page`

```python
class WorkflowListItem(BaseModel):
    id: str
    name: str
    description: str
    status: str
    schedule: CronSchedule | None
    steps_count: int
    last_run: WorkflowRunSummary | None
    created_by: str
    created_at: datetime
    updated_at: datetime

class WorkflowRunSummary(BaseModel):
    run_id: str
    status: str
    completed_at: datetime | None
```

## Workflow Compiler

O compiler transforma um `WorkflowDefinition` em um LangGraph `StateGraph` em runtime. Nao gera codigo — constroi o graph programaticamente.

### WorkflowState

```python
class WorkflowState(TypedDict):
    """Estado compartilhado entre nodes do workflow."""
    workflow_id: str
    run_id: str
    current_step: str                    # ID do step atual
    step_outputs: dict[str, Any]         # {step_id: output} — resultados acumulados
    final_output: Any                    # output do ultimo step
    error: str | None                    # erro se falhou
    model: str                           # LLM default
    config_overrides: dict               # overrides de runtime
```

### Compilacao: Step Type → Node

| Step Type | Comportamento do Node |
|-----------|----------------------|
| `tool` | Chama a tool nomeada em `tool_name` com `config` como argumentos. Output salvo em `step_outputs[step_id]`. |
| `llm` | Chama LLM com `prompt` formatado + output do step anterior como contexto. Usa `default_model` ou override. |
| `condition` | Avalia condicao sobre output do step anterior. Retorna `Command(goto=then_step)` ou `Command(goto=else_step)`. |
| `action` | Executa side effect: `send_slack`, `send_email`, `save_file`. Nao retorna output significativo. |
| `hitl` | Chama `interrupt({"step_id": ..., "output_to_review": ...})`. Pausa execucao. Resume via API com `Command(resume={"approved": True, ...})`. |

### Fluxo de Compilacao

```python
def compile_workflow(definition: WorkflowDefinition) -> CompiledStateGraph:
    """Compila WorkflowDefinition em StateGraph executavel."""
    graph = StateGraph(WorkflowState)
    
    for step in definition.steps:
        # Criar node function baseada no type
        node_fn = _build_node(step, definition.default_model)
        graph.add_node(step.id, node_fn)
    
    # Conectar edges
    first_step = definition.steps[0]
    graph.add_edge(START, first_step.id)
    
    for step in definition.steps:
        if step.type == "condition":
            # Conditional edges
            graph.add_conditional_edges(
                step.id,
                _build_condition_router(step.condition),
                {
                    "then": step.condition["then"],
                    "else": step.condition["else"],
                }
            )
        elif step.next_step:
            graph.add_edge(step.id, step.next_step)
        else:
            # Ultimo step → END
            graph.add_edge(step.id, END)
    
    return graph.compile(checkpointer=PostgresSaver(...))
```

### Exemplo: Node tipo "tool"

```python
def _build_tool_node(step: WorkflowStep, tools_registry: dict) -> Callable:
    """Cria node que chama uma tool registrada."""
    
    async def node(state: WorkflowState) -> WorkflowState:
        tool = tools_registry[step.tool_name]
        
        # Merge config com output do step anterior
        args = {**step.config}
        if state["step_outputs"]:
            last_output = list(state["step_outputs"].values())[-1]
            args["context"] = str(last_output)
        
        result = await tool.ainvoke(args)
        
        return {
            **state,
            "current_step": step.id,
            "step_outputs": {**state["step_outputs"], step.id: result},
            "final_output": result,
        }
    
    return node
```

### Exemplo: Node tipo "hitl"

```python
def _build_hitl_node(step: WorkflowStep) -> Callable:
    """Cria node que pausa para revisao humana."""
    
    async def node(state: WorkflowState) -> WorkflowState:
        last_output = state.get("final_output")
        
        # Pausa execucao — LangGraph salva estado no checkpointer
        human_review = interrupt({
            "step_id": step.id,
            "step_name": step.name,
            "output_to_review": last_output,
            "instructions": step.config.get("review_instructions", "Revise o output abaixo."),
        })
        
        # Retomado via Command(resume=...) — human_review contem a decisao
        if not human_review.get("approved", False):
            return {**state, "error": "Rejeitado na revisao humana"}
        
        # Se aprovado com modificacoes, usar output modificado
        modified_output = human_review.get("modifications", last_output)
        return {
            **state,
            "current_step": step.id,
            "step_outputs": {**state["step_outputs"], step.id: modified_output},
            "final_output": modified_output,
        }
    
    return node
```

## Tools Disponiveis no Builder

Tools compartilhadas com o chat. Mesmas funcoes, mesma infraestrutura.

| Tool | Descricao | Areas que Usam | Status |
|------|-----------|----------------|--------|
| `generate_text` | Gera texto com LLM (tipo, tom, tamanho) | Todas | Implementada |
| `chat_completion` | Chat completion generico com LLM | Todas | Implementada |
| `search_knowledge` | Busca na Biblioteca (RAG) | Planejamento, Midia | Implementada |
| `query_data` | Consulta BigQuery | BI, Midia, Financeiro | Futura |
| `send_slack` | Notifica canal Slack | Todas | Futura |
| `send_email` | Envia email | Financeiro, Operacoes | Futura |
| `generate_image` | Gera imagem com IA (Imagen/DALL-E) | Planejamento, Growth | Parcial |
| `analyze_data` | Analisa dados com LLM | BI, Growth | Futura |
| `export_ppt` | Gera apresentacao PowerPoint | Planejamento, Midia | Futura |
| `fetch_url` | Busca dados de API/URL externa | Growth, BI | Futura |

## Frontend Pages

### /workflows — Catalogo

Grid de workflow cards. Filtros por status (Rascunho/Ativo/Pausado) e criador.

**Workflow Card:**

```
+--------------------------------------------------+
| [Status Badge: Ativo]              [3 steps]     |
|                                                   |
| Report Mensal de Midia                           |
| Gera report de performance e envia para Slack     |
|                                                   |
| Schedule: Seg 9h           Criado por: Ana Costa |
| Ultimo run: 07/04 09:01 [Sucesso]               |
+--------------------------------------------------+
```

Campos do card:
- **Nome** e descricao preview (max 2 linhas)
- **Status badge**: Rascunho (cinza), Ativo (verde), Pausado (amarelo)
- **Schedule info**: ex. "Seg 9h", "Diario 8h", ou "Manual"
- **Ultimo run**: timestamp + status (Sucesso/Falhou/Pausado)
- **Step count**: numero de steps no workflow
- **Criador**: nome do usuario que criou

### /workflows/new — Builder

Interface de criacao de workflow com lista de steps configuraveis.

```
+--------------------------------------------------+
| <- Voltar          Novo Workflow         [Salvar] |
+--------------------------------------------------+
| Nome: [________________________]                  |
| Descricao: [________________________]            |
| Modelo default: [gemini-flash v]                 |
+--------------------------------------------------+
| STEPS                                   [+ Step] |
|                                                   |
| 1. [Buscar dados]                          [x]   |
|    Tipo: [Tool v]  Tool: [query_data v]          |
|    Config: { "query": "SELECT ..." }             |
|                                                   |
| 2. [Analisar resultados]                   [x]   |
|    Tipo: [LLM v]                                 |
|    Prompt: "Analise os dados: {{previous}}"      |
|                                                   |
| 3. [Revisar analise]                       [x]   |
|    Tipo: [HITL v]                                |
|    Instrucoes: "Revise a analise antes de enviar"|
|                                                   |
| 4. [Enviar para Slack]                     [x]   |
|    Tipo: [Action v]  Action: [send_slack v]      |
|    Config: { "channel": "#midia" }               |
+--------------------------------------------------+
| SCHEDULE                                         |
| [x] Ativar schedule                              |
| Cron: [0 9 * * 1]  Timezone: [America/SP v]     |
+--------------------------------------------------+
```

### /workflows/[id] — Editar Workflow

Mesma interface do builder, pre-populada com dados existentes. Botao "Executar Agora" no header.

### /workflows/[id]/runs — Historico de Execucoes

Timeline de execucoes com status, duracao, e drill-down para step logs.

```
+--------------------------------------------------+
| Historico — Report Mensal de Midia               |
+--------------------------------------------------+
| Run #12  |  07/04 09:01  |  Sucesso  |  47s     |
|   Step 1: query_data .............. OK (12s)     |
|   Step 2: generate_text ........... OK (23s)     |
|   Step 3: HITL review ............. Aprovado     |
|   Step 4: send_slack .............. OK (2s)      |
+--------------------------------------------------+
| Run #11  |  31/03 09:01  |  Falhou   |  15s     |
|   Step 1: query_data .............. OK (12s)     |
|   Step 2: generate_text ........... ERRO         |
|   Erro: Rate limit exceeded                      |
+--------------------------------------------------+
```

### Templates

Secao dentro de `/workflows` com templates pre-configurados. Botao "Usar Template" cria uma copia editavel.

## Templates Pre-Configurados

### 1. Report Mensal

**Objetivo**: Gerar report de performance e distribuir automaticamente.
**Schedule**: `0 9 1 * *` (dia 1 de cada mes, 9h)
**Steps**:

| # | Nome | Tipo | Tool/Config |
|---|------|------|-------------|
| 1 | Buscar dados | tool | `query_data` — query de metricas do mes anterior |
| 2 | Gerar analise | llm | Prompt: "Analise os dados de performance: {{previous}}. Destaque tendencias, anomalias e recomendacoes." |
| 3 | Enviar para Slack | action | `send_slack` — canal #reports |

### 2. Plano de Midia

**Objetivo**: Pesquisar contexto e gerar plano de midia com revisao humana.
**Schedule**: Manual
**Steps**:

| # | Nome | Tipo | Tool/Config |
|---|------|------|-------------|
| 1 | Pesquisar benchmark | tool | `search_knowledge` — buscar benchmarks de CPM/CTR na Biblioteca |
| 2 | Gerar plano | llm | Prompt: "Com base nos benchmarks: {{previous}}, gere um plano de midia para o cliente {{client_name}}." |
| 3 | Revisao humana | hitl | Instrucoes: "Revise o plano de midia antes de finalizar. Ajuste orcamento e canais se necessario." |

### 3. Monitor de Anomalias

**Objetivo**: Detectar anomalias em metricas e alertar via Slack.
**Schedule**: `0 8 * * *` (diario, 8h)
**Steps**:

| # | Nome | Tipo | Tool/Config |
|---|------|------|-------------|
| 1 | Buscar metricas | tool | `query_data` — metricas das ultimas 24h |
| 2 | Analisar anomalias | tool | `analyze_data` — detectar desvios > 2 sigma |
| 3 | Verificar anomalia | condition | `{"field": "anomaly_detected", "operator": "eq", "value": true, "then": "step_4", "else": "END"}` |
| 4 | Alertar time | action | `send_slack` — canal #alertas com detalhes da anomalia |

### 4. Pesquisa de Mercado

**Objetivo**: Coletar dados externos, cruzar com conhecimento interno e gerar report.
**Schedule**: Manual
**Steps**:

| # | Nome | Tipo | Tool/Config |
|---|------|------|-------------|
| 1 | Coletar dados externos | tool | `fetch_url` — URLs de fontes de mercado configuradas |
| 2 | Sintetizar dados | llm | Prompt: "Sintetize os dados coletados: {{previous}}. Destaque tendencias relevantes." |
| 3 | Buscar contexto interno | tool | `search_knowledge` — cruzar com Biblioteca do cliente |
| 4 | Gerar report final | llm | Prompt: "Com base na sintese ({{step_2}}) e contexto interno ({{step_3}}), gere um report de pesquisa de mercado completo." |

## Criterios de Aceite

### Criar Workflow
- [ ] DADO um usuario autenticado com papel builder, QUANDO acessa /workflows/new, ENTAO ve formulario com nome, descricao, steps e schedule
- [ ] DADO steps validos configurados, QUANDO clica Salvar, ENTAO workflow e criado com status "draft"
- [ ] DADO mais de 20 steps, QUANDO tenta salvar, ENTAO recebe erro de validacao

### Executar Workflow
- [ ] DADO workflow com status "active", QUANDO clica "Executar Agora", ENTAO run e criado e steps executam em sequencia
- [ ] DADO step tipo "tool", QUANDO executa, ENTAO chama a tool nomeada e passa config como argumentos
- [ ] DADO step tipo "llm", QUANDO executa, ENTAO chama LLM com prompt formatado + output do step anterior
- [ ] DADO step tipo "condition", QUANDO avalia, ENTAO roteia para branch correta baseado no output anterior
- [ ] DADO execucao excedendo 5 minutos, QUANDO timeout, ENTAO run e marcado como "failed" com erro de timeout

### HITL Pause/Resume
- [ ] DADO step tipo "hitl" no workflow, QUANDO execucao chega nesse step, ENTAO run pausa com status "paused"
- [ ] DADO run pausado, QUANDO reviewer aprova via API, ENTAO execucao retoma do proximo step
- [ ] DADO run pausado, QUANDO reviewer rejeita, ENTAO run e marcado como "failed" com motivo
- [ ] DADO run pausado, QUANDO reviewer envia modifications, ENTAO output modificado e usado como input do proximo step

### Schedule
- [ ] DADO workflow com schedule configurado, QUANDO status muda para "active", ENTAO job e criado no Cloud Scheduler
- [ ] DADO schedule ativado, QUANDO cron dispara, ENTAO run e criado automaticamente com trigger="schedule"
- [ ] DADO schedule desativado, QUANDO usuario remove schedule, ENTAO job e deletado do Cloud Scheduler

### Historico de Execucoes
- [ ] DADO workflow com runs, QUANDO acessa /workflows/{id}/runs, ENTAO ve timeline com status, duracao e step logs
- [ ] DADO run com step logs, QUANDO expande run, ENTAO ve input/output de cada step, duracao e tokens usados

### Templates
- [ ] DADO catalogo de templates, QUANDO usuario clica "Usar Template", ENTAO cria copia editavel do template
- [ ] DADO template criado, QUANDO usuario edita steps, ENTAO pode customizar sem afetar template original

### Step Logging
- [ ] DADO qualquer step executado, QUANDO completa, ENTAO WorkflowStepLog e criado com input, output, duracao e tokens
- [ ] DADO step que falhou, QUANDO logado, ENTAO status e "failed" e erro e registrado
- [ ] DADO run completo, QUANDO consulta MLflow, ENTAO trace completo esta disponivel

## Restricoes Tecnicas

1. **LangGraph StateGraph como engine** — nao criar runtime customizado. Cada workflow compila para `StateGraph`.
2. **Cloud Scheduler para cron** — nao cron interno. Usar `google-cloud-scheduler` para criar/deletar jobs.
3. **Max 20 steps por workflow** — validacao no backend (CreateWorkflowRequest).
4. **Max 5 minutos de execucao por run** — timeout no executor. Run marcado como "failed" se exceder.
5. **RBAC** — builders podem criar/editar workflows. Viewers podem ver runs e logs. Baseado em claims do Firebase JWT.
6. **Tools compartilhadas com chat** — mesmas funcoes de `chat/tools/`. Nenhuma tool exclusiva do builder.
7. **PostgreSQL para definicoes** — WorkflowDefinition, WorkflowRun, WorkflowStepLog no mesmo Cloud SQL.
8. **Checkpointer para HITL** — LangGraph `PostgresSaver` para persistir estado entre pause e resume.

## Fases de Implementacao

| Fase | O que | Sprint |
|------|-------|--------|
| **1** | Backend: models (WorkflowDefinition, Run, StepLog) + CRUD endpoints | Sprint 1 |
| **2** | Backend: compiler (definition → StateGraph) + executor com logging | Sprint 1 |
| **3** | Backend: Cloud Scheduler integration (create/delete jobs) | Sprint 1 |
| **4** | Frontend: `/workflows` catalogo + builder UI (steps + config) | Sprint 2 |
| **5** | Frontend: `/workflows/[id]/runs` historico de execucoes + step logs | Sprint 2 |
| **6** | Backend: HITL (interrupt + resume endpoint) | Sprint 2 |
| **7** | Tools adicionais: `send_slack`, `send_email`, `fetch_url` | Sprint 3 |
| **8** | Templates pre-configurados + secao de templates no frontend | Sprint 3 |

## Notas de Implementacao

1. **Compiler vive em `api/workflows/compiler.py`** — separado do chat graph builder
2. **Tools registry** — `api/chat/tools/` e o registro central. Compiler importa de la.
3. **WorkflowState e separado de SunosChatState** — workflows nao usam messages/conversation
4. **Cloud Scheduler callback** — POST para `/api/workflows/{id}/run` com header de autenticacao interna
5. **Frontend reutiliza design system** — CSS variables (`--void`, `--deep`, `--sun`, etc.), mesmos patterns de card/badge

<!-- REVIEW -->
**Checkpoint**: A especificacao captura o que voce realmente quer construir?

## Changelog

| Versao | Data | Mudanca |
|--------|------|---------|
| 1.0 | 2026-04-13 | Versao inicial baseada em ADR-001 (revisado). Data model, API, compiler, templates, criterios de aceite. |
