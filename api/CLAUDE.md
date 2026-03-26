# sunOS API — Project Conventions

## Overview

Backend multi-agent (FastAPI + LangGraph) para ferramentas de IA do sunohub. Expõe chat streaming, text gen, image gen e prompt enhancement via API REST + SSE.

## Stack

- Python 3.11+
- FastAPI (API framework)
- LangGraph StateGraph (agent orchestration)
- LangChain (LLM integrations)
- Gemini 2.5 Flash (default LLM)
- PostgreSQL (Cloud SQL, shared)
- MLflow (tracing + eval)
- Cloud Run (deploy)
- uv (package manager)
- Port: **8080**

## Architecture

```
Request → chat/router.py
  → graph/top_supervisor.py (detecta intenção)
  → graph/orchestrator.py (carrega skill + agent)
  → agents/*.py (ReAct loop com tools)
  → SSE streaming response
```

### 2 Levels of Routing

1. **TopSupervisor** — detecta intenção: `criacao | midia | planejamento | conversation`
2. **Orchestrator** — carrega skill references + executa agent

### Agent Pattern

- Todos os agents herdam de `BaseAgent` ABC (`chat/agents/base.py`)
- Interface: `name`, `system_prompt`, `get_tools()`, `get_skill_references()`, `invoke()`
- ReAct loop: LLM decide quais tools chamar

### Skills System

Cada skill é um diretório:
```
chat/skills/<slug>/
  SKILL.md           # Overview, quando usar, tools
  references/*.md    # Domain knowledge
```

`SkillLoader` carrega SKILL.md + references/ e injeta no system prompt do agent.

## Project Structure

```
main.py                 # FastAPI app entry point
config.py               # Pydantic Settings
chat/
  router.py             # API endpoints
  schemas/              # Pydantic request/response models
  agents/               # BaseAgent + sub-agents
    base.py             # ABC
  graph/                # LangGraph
    state.py            # SunosChatState TypedDict
    top_supervisor.py   # Routing por intenção
    orchestrator.py     # Executa agent + skill
    builder.py          # Monta StateGraph
    runner.py           # Executa graph com streaming
  tools/                # LangChain tools
  skills/               # Skill directories (SKILL.md + references/)
  eval/                 # MLflow tracing + scorers
models/                 # SQLAlchemy models
```

## Conventions

- **Padrão Koro** — mesma stack/patterns do meridian-api
- **CORS no Load Balancer** — não no app (ADR-001)
- **Auth via Firebase JWT** — padrão Toolbox
- **Streaming via SSE** — FastAPI StreamingResponse
- **Skills = Prompt + Tools + References** — progressive disclosure
- **BaseAgent ABC** — interface consistente para todos os agents
- Sempre rodar `ruff check .` e `ruff format .` antes de commit

## Restrictions

- **NÃO adicione CORS middleware** — Load Balancer gerencia
- **NÃO exponha API keys** — ficam em Secret Manager
- **NÃO mude a interface BaseAgent** sem atualizar todos os agents
- **NÃO instale dependências** fora do pyproject.toml aprovado
