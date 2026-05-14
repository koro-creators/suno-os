# ADR-001: Agent Builder — Aceito (Revisado)

**Data:** 2026-04-14
**Status:** ~~Rejeitado~~ → ~~Aceito~~ → **Superseded por ADR-003 (2026-05-14)**
**Decisores:** Heitor Miranda, José Lucas, William (Carioca)

> **NOTA DE SUPERSEDÊNCIA (2026-05-14):** Esta decisão foi superseded por [ADR-003: Workflow Builder Visual Drag-and-Drop como Paradigma Operacional](./ADR-003-workflow-builder-visual.md). O contexto que motivava a rejeição de drag-and-drop visual mudou: o sponsor executivo (Guga) formalizou em 07/05 e 14/05/2026 a direção de "software estruturado com paradigmas visuais explícitos", e a feature de Workflows do sunOS já evoluiu para implementação com drag-and-drop. Esta ADR é mantida apenas para histórico.


## Contexto Original (2026-04-14)

Na primeira análise, o Agent Builder foi rejeitado por:
- Falta de demanda validada
- Escopo desproporcional ao time de 4 devs
- Skill Editor já cobria 90% da necessidade

## Por Que Revisamos

1. **A lista de atividades não é exaustiva.** O levantamento inicial identificou 48 atividades não implementadas (de 136 mapeadas), mas entrevistas em andamento com os times de Mídia, BI, Financeiro, Planejamento e Growth estão revelando muito mais. O volume real de automações necessárias justifica um builder.

2. **Time pequeno = mais motivo, não menos.** Com 4 devs, o time de engenharia será sempre gargalo se toda automação depender deles. Empoderar analistas de mídia, BI e financeiro a criar seus próprios workflows é a única forma de escalar.

3. **Os usuários são técnicos.** Não são diretores — são analistas sêniores, coordenadores, e plenos que já usam ferramentas como SmartSheet, BigQuery, Meta Ads Manager. Sabem encadear lógica.

4. **LangGraph dá escalabilidade do momento zero.** Cada workflow criado no builder é um `StateGraph` compilado. Não estamos inventando orquestração — estamos usando a mesma infraestrutura do chat. Novo workflow = novo graph, mesmo engine, mesmo deploy.

## Decisão Revisada

**Implementar Agent/Workflow Builder usando LangGraph como engine.** Cada workflow criado pelo usuário compila para um `StateGraph` que roda no mesmo backend.

## Arquitetura

```
Agent Builder (UI no sunOS)
  │
  │ User configura: steps, tools, schedule, inputs
  │
  ▼
Workflow Definition (JSON/YAML no PostgreSQL)
  │
  │ Em runtime, compila para:
  │
  ▼
LangGraph StateGraph (mesmo engine do chat)
  │
  ├── Node 1: Tool call (query_data, generate_text, etc.)
  ├── Node 2: LLM processing (Gemini/GPT)
  ├── Node 3: Action (send_slack, send_email, save_file)
  └── Conditional edges, loops, HITL interrupts
  │
  ▼
Execution (Cloud Run) + Scheduling (Cloud Scheduler)
```

### Por que LangGraph é a resposta certa

| Aspecto | Benefício |
|---------|-----------|
| **Já temos** | Backend sunOS já roda LangGraph. Mesmo deploy, mesmo monitoring. |
| **StateGraph compilado** | Cada workflow vira um graph otimizado. Não interpreta YAML em runtime. |
| **Tools reutilizáveis** | As tools do chat (chat_tools, text_tools, image_tools, search) são as mesmas do builder. |
| **HITL nativo** | LangGraph tem `interrupt()` e `Command(resume=...)` built-in. |
| **Streaming** | Resultados parciais via SSE, mesmo padrão do chat. |
| **Persistence** | Checkpointer salva estado. Workflow pode pausar e retomar. |
| **Eval** | Mesmo MLflow tracing. Cada execução é rastreável. |

### Definição de Workflow (schema)

```python
class WorkflowDefinition(BaseModel):
    id: str
    name: str
    description: str
    created_by: str
    
    # Steps
    steps: list[WorkflowStep]
    
    # Schedule (optional)
    schedule: CronSchedule | None = None
    
    # Scope
    client_scope: list[str] = []     # clientes que podem usar
    
    # Config
    default_model: str = "gemini-flash"
    max_execution_time: int = 300    # seconds

class WorkflowStep(BaseModel):
    id: str
    name: str
    type: str                        # "tool" | "llm" | "condition" | "action"
    tool_name: str | None = None     # qual tool chamar
    prompt: str | None = None        # para steps LLM
    config: dict = {}                # parâmetros do step
    next_step: str | None = None     # próximo step (linear)
    condition: dict | None = None    # para branching

class CronSchedule(BaseModel):
    cron: str                        # "0 9 * * 1" = segunda 9h
    timezone: str = "America/Sao_Paulo"
    enabled: bool = True
```

### Tools Disponíveis no Builder

| Tool | O que faz | Áreas que usam |
|------|-----------|----------------|
| `generate_text` | Gera texto com LLM | Todas |
| `search_knowledge` | Busca na Biblioteca | Planejamento, Mídia |
| `query_data` | Consulta BigQuery (futuro) | BI, Mídia, Financeiro |
| `send_slack` | Notifica canal Slack | Todas |
| `send_email` | Envia email | Financeiro, Operações |
| `generate_image` | Gera imagem com IA | Planejamento, Growth |
| `analyze_data` | Analisa dados com LLM | BI, Growth |
| `export_ppt` | Gera apresentação (futuro) | Planejamento, Mídia |
| `fetch_url` | Busca dados de API externa | Growth, BI |

### Interface do Builder (Frontend)

```
/workflows              → Catálogo de workflows (grid)
/workflows/new          → Builder visual (steps + config)
/workflows/[id]         → Editar workflow
/workflows/[id]/runs    → Histórico de execuções
```

## O que NÃO é

- **Não é criação de agents from scratch.** É composição de tools existentes em sequências.
- **Não é visual drag-and-drop de nodes.** É uma lista de steps configuráveis (similar ao GitHub Actions YAML, mas com UI).
- **Não substitui o chat.** Workflows rodam em background. Chat é interativo.

## Fases de Implementação

| Fase | O que | Quando |
|------|-------|--------|
| **1** | Backend: WorkflowDefinition model + executor que compila para StateGraph | Sprint 1 |
| **2** | Backend: Cloud Scheduler integration para cron | Sprint 1 |
| **3** | Frontend: `/workflows` catálogo + builder UI (steps + config) | Sprint 2 |
| **4** | Frontend: histórico de execuções + logs | Sprint 2 |
| **5** | Tools adicionais: send_slack, send_email, fetch_url | Sprint 3 |
| **6** | Templates pré-configurados (Report Mensal, Plano de Mídia, etc.) | Sprint 3 |

## Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Workflows mal construídos falham silenciosamente | Eval + logging em cada step. Toast/Slack de erro. |
| Custo de LLM explode com schedules mal configurados | Rate limit por workflow. Budget máximo por execução. |
| Usuários criam workflows duplicados | Templates como ponto de partida. Catálogo mostra existentes. |
| Segurança: acesso a dados sensíveis via tools | RBAC por tool. Financeiro não acessa send_slack do marketing. |

## Critérios de Sucesso

- [ ] 5+ workflows criados por não-engenheiros em 30 dias
- [ ] 10+ execuções automáticas semanais sem intervenção de eng
- [ ] Tempo médio de criação de workflow < 15 minutos
- [ ] Zero workflows falhando silenciosamente (todos logados)

## Changelog

| Data | Mudança |
|------|---------|
| 2026-04-14 (v2) | **Aceito.** Revisado com contexto de 48+ atividades pendentes, entrevistas em andamento, e LangGraph como engine. Reframed de "Agent Builder genérico" para "Workflow Builder com LangGraph". |
| 2026-05-14 (v3) | **Superseded** por ADR-003. Reorientação do sponsor executivo (Guga) em 07/05 e 14/05/2026 sobre paradigma "software, não chat". Feature de Workflows já implementa drag-and-drop visual em código. |
| 2026-04-14 (v1) | Rejeitado. Sem demanda validada, escopo desproporcional. |
