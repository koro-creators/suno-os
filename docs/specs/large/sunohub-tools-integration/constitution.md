---
spec-id: SPEC-001
slug: sunohub-tools-integration
artefato: constitution
atualizada: 2026-03-26
versao: 2.0
escopo:
  projeto: sunos
  stack: "Frontend: Next.js 14 + TypeScript | Backend: FastAPI + LangGraph + Python"
  autor: Heitor Miranda
  papel: Tech Lead
  branch: master
  contexto: Integrar ferramentas de IA do sunohub via backend LangGraph, seguindo padrão Meridian Chat V2
---

# Constitution — sunohub Tools Integration (v2)

Princípios imutáveis que guiam a integração. **Pivotado de Supabase Edge Functions para FastAPI + LangGraph**, alinhando com o padrão estabelecido no Meridian Chat V2.

## Princípios de Arquitetura

1. **Padrão Koro** — mesma stack do Meridian: FastAPI + LangGraph StateGraph + ReAct agents. Consistência entre projetos.
2. **Skills = Prompt + Tools + References** — padrão LangChain multi-agent skills. Cada skill é um diretório com SKILL.md + references/. Progressive disclosure.
3. **2 níveis de routing** — TopSupervisor (detecta intenção: criacao | midia | planejamento | conversation) → Orchestrator (executa skills/tools). Simples, não degrada.
4. **BaseAgent ABC** — mesma interface do Meridian para todos os agents. `name`, `system_prompt`, `get_tools()`, `get_skill_references()`, `invoke()`.
5. **Streaming-first** — respostas de chat via SSE (Server-Sent Events). Frontend consome stream via fetch + ReadableStream.
6. **Backward compatible** — sistema solar + áreas admin (Skills, Biblioteca, Clientes) não são afetados.

## Princípios de Qualidade

1. **Toda tool tem fallback para mock** — se API backend não disponível, frontend volta ao mock streaming atual
2. **Erros tratados com UX** — toasts com mensagens claras, nunca stack traces
3. **Latência visível** — streaming indicators, progress bars, loading states
4. **Eval 3 camadas** — MLflow tracing (cada request) + Trajectory eval (fluxo correto?) + Quality eval (output bom?)

## Princípios de Segurança

1. **Nenhuma API key no frontend** — todas as chaves ficam no backend (Secret Manager)
2. **Auth via Firebase JWT** — padrão Toolbox, mesmo que Meridian
3. **Rate limiting** — respeitar limits das APIs (Gemini, OpenAI, Veo) no backend
4. **CORS no Load Balancer** — não no app (ADR-001 Meridian)

## Padrões Obrigatórios

### Frontend (sunOS)
- **Linguagem**: TypeScript (strict)
- **Framework**: Next.js 14 App Router, React 18
- **Estilo**: Inline styles + CSS variables (design system sunOS)
- **Icons**: Lucide React
- **Estado**: React Context para estado local
- **Nomenclatura**: camelCase vars, PascalCase components, kebab-case files

### Backend (sunos-api — novo)
- **Linguagem**: Python 3.11+
- **Framework**: FastAPI
- **Agents**: LangGraph StateGraph
- **Agent pattern**: ReAct (LLM decide tools)
- **LLM**: Gemini 2.5 Flash via langchain-google-genai (default), GPT-4o, Claude como alternativas
- **DB**: PostgreSQL (shared Cloud SQL, mesmo do Toolbox/Meridian)
- **Tracing**: MLflow GenAI
- **Eval**: OpenEvals + AgentEvals
- **Deploy**: Cloud Run (GitHub Actions CI/CD)
- **Secrets**: GCP Secret Manager
- **Package manager**: uv

## Dependências Aprovadas

### Frontend
- Nenhuma dependência nova — comunicação via fetch nativo
- NÃO instalar `@supabase/supabase-js` (removido do v1)

### Backend
- `fastapi`, `uvicorn` — API framework
- `langgraph`, `langchain-core`, `langchain-google-genai` — agent framework
- `langchain-openai` — alternativa GPT
- `langchain-anthropic` — alternativa Claude
- `mlflow` — tracing e eval
- `openevals`, `agentevals` — evaluation
- `google-cloud-aiplatform` — Vertex AI (imagem/vídeo)
- `httpx` — HTTP client async
- `firebase-admin` — auth
- `sqlalchemy`, `asyncpg` — DB

## Tools do sunohub a Integrar

| Tool | Prioridade | Implementação Backend |
|------|-----------|----------------------|
| Chat (streaming) | P0 | LangGraph agent com ReAct + SSE |
| TextGen | P0 | Tool do ContentCreator agent |
| ImageGen | P1 | Tool do VisualCreator agent (Vertex AI Imagen) |
| Prompt Assistant | P1 | Tool transversal (aprimora prompt antes de enviar) |
| VideoGen | P2 | Tool do VisualCreator agent (Vertex AI Veo) |
| Document Processing | P2 | Tool para processar docs da Biblioteca |
| ImageEnhance | P3 | Tool do VisualCreator agent |
| ImageEdit | P3 | Tool do VisualCreator agent |
