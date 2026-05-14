---
spec-id: SPEC-003
slug: workflow-builder
artefato: constitution
atualizada: 2026-04-30
versao: 1.0
status: substituido
substituido_por: SPEC-005 (docs/specs/large/workflow-builder-canvas/)
escopo:
  projeto: sunos
  stack: "Frontend: Next.js 14 + TypeScript | Backend: FastAPI + LangGraph + Python"
  autor: Heitor Miranda
  papel: Tech Lead
  branch: master
  contexto: Empoderar times nao-engenharia a criar automacoes de AI
---

> ⚠️ **Esta SPEC foi substituída em 2026-04-30 por SPEC-005 — `docs/specs/large/workflow-builder-canvas/`.**
> A nova SPEC reverte a decisão "não é drag-and-drop visual" (linha 81 abaixo) e estende o data model para DAG genuíno (fan-out paralelo + merge + handles tipados) com canvas React Flow. Os princípios de arquitetura (LangGraph engine único, tools compartilhadas, workflows como dados, HITL nativo, schedule-first, templates, eval) **continuam valendo** e foram herdados pela nova constitution. Backend (compiler/executor) é estendido, não substituído.

# Constitution — Workflow Builder

Principios imutaveis que guiam o Workflow Builder. Times de Midia, BI, Financeiro, Planejamento, Growth e Operacoes criam workflows automatizados usando as mesmas tools do chat, sem depender de engenharia.

## Principios de Arquitetura

1. **LangGraph e o engine** — cada workflow definition compila para um `StateGraph`. Mesma infraestrutura do chat. Nenhum sistema de orquestracao separado. Novo workflow = novo graph, mesmo engine, mesmo deploy.
2. **Tools sao compartilhadas** — as tools do chat (`generate_text`, `search_knowledge`, `chat_completion`, etc.) sao as mesmas tools disponiveis no builder. Nova tool adicionada ao chat beneficia automaticamente o builder, e vice-versa.
3. **Workflows sao dados, nao codigo** — definicoes de workflow sao JSON armazenadas no PostgreSQL. O compiler transforma em `StateGraph` em runtime. Nao existe codigo gerado, nao existe deploy por workflow.
4. **HITL nativo** — LangGraph tem `interrupt()` e `Command(resume=...)` built-in. Workflows podem pausar para revisao humana e retomar sem perder estado. Checkpointer garante persistencia entre pausa e retomada.
5. **Schedule-first** — a maioria dos workflows roda em schedule (cron via Cloud Scheduler). Execucao interativa ("rodar agora") e secundaria. Workflows sao automacoes, nao conversas.
6. **Templates aceleram adocao** — templates pre-configurados para padroes comuns (Report Mensal, Plano de Midia, Monitor de Anomalias) permitem que usuarios comecem de um exemplo funcional, nao de uma tela em branco.
7. **Eval e logging desde o dia zero** — cada execucao e traceada no MLflow. Cada step loga inputs, outputs, duracao e tokens. Nenhum workflow falha silenciosamente.

## Principios de Qualidade

1. **Todo step loga input/output** — `WorkflowStepLog` registra status, duracao, tokens usados. Rastreabilidade total.
2. **Erros tratados com UX** — toast com mensagens claras no frontend, notificacao Slack para falhas em workflows agendados. Nunca stack traces.
3. **Execucoes visiveis** — historico de runs com timeline, status por step, duracao total. Usuario sabe o que aconteceu sem pedir para engenharia.
4. **Limites explicitos** — max 20 steps por workflow, max 5 minutos por execucao. Guardrails que evitam workflows descontrolados.

## Principios de Seguranca

1. **Nenhuma API key no frontend** — todas as chaves ficam no backend (Secret Manager)
2. **Auth via Firebase JWT** — padrao Toolbox, mesmo que Meridian e chat
3. **RBAC por papel** — builders podem criar e editar workflows, viewers podem ver historico de execucoes
4. **Rate limiting por workflow** — evitar custo descontrolado com schedules mal configurados. Budget maximo por execucao.

## Padroes Obrigatorios

### Frontend (sunOS)
- **Linguagem**: TypeScript (strict)
- **Framework**: Next.js 14 App Router, React 18
- **Estilo**: Inline styles + CSS variables (design system sunOS)
- **Icons**: Lucide React
- **Estado**: React Context para estado local
- **Nomenclatura**: camelCase vars, PascalCase components, kebab-case files

### Backend (sunos-api)
- **Linguagem**: Python 3.11+
- **Framework**: FastAPI
- **Orquestracao**: LangGraph StateGraph (compiler de workflow)
- **LLM**: Gemini 2.5 Flash via langchain-google-genai (default)
- **DB**: PostgreSQL (shared Cloud SQL)
- **Scheduling**: Cloud Scheduler (cron externo, nao cron interno)
- **Tracing**: MLflow GenAI
- **Deploy**: Cloud Run (GitHub Actions CI/CD)
- **Secrets**: GCP Secret Manager
- **Package manager**: uv

## Dependencias Aprovadas

### Frontend
- Nenhuma dependencia nova — componentes com React + CSS variables existentes

### Backend
- `fastapi`, `uvicorn` — API framework (ja existente)
- `langgraph`, `langchain-core`, `langchain-google-genai` — agent framework (ja existente)
- `sqlalchemy`, `asyncpg` — DB (ja existente)
- `mlflow` — tracing (ja existente)
- `google-cloud-scheduler` — integracao com Cloud Scheduler (nova)
- `croniter` — validacao de cron expressions (nova)

## O Que NAO E

- **Nao e drag-and-drop visual de nodes.** E uma lista de steps configuraveis (similar ao GitHub Actions, mas com UI).
- **Nao substitui o chat.** Chat e interativo. Workflows rodam em background.
- **Nao e criacao de agents from scratch.** E composicao de tools existentes em sequencias.
- **Nao e um runtime customizado.** LangGraph `StateGraph` e o unico engine de execucao.
