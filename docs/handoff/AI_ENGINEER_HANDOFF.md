# sunOS — AI Engineer & Harness Engineer Handoff

**Data:** 2026-04-16
**De:** Heitor Miranda (Tech Lead)
**Para:** AI Engineer, Harness Engineer, ML Engineer
**Repo:** https://github.com/koro-creators/suno-os (path: `api/`)

---

## 1. Visão da Arquitetura de Agentes

### O que é o sunOS (perspectiva AI)

Um **harness de agentes de marketing** construído com LangGraph que orquestra LLMs para executar skills criativas (Copy Social, Plano de Mídia, etc.) com context injection por cliente e avaliação contínua. Equivalente a um "Claude Code para marketing" — um engine único que se adapta via contexto, não via instâncias separadas (ver ADR-002).

### Diagrama de Agentes

```
User Message + Skill Slug + Context Documents
                    │
                    ▼
         ┌─────────────────────┐
         │   TopSupervisor      │ Routing (LLM ou short-circuit)
         │   Detecta intenção:  │
         │   criacao │ midia │  │
         │   planejamento │     │
         │   conversation       │
         └────────┬────────────┘
                  │ conditional_edges
     ┌────────────┼────────────────┐
     ▼            ▼                ▼
┌─────────┐ ┌───────────┐  ┌──────────────┐
│Orchestr.│ │Conversation│  │   respond     │
│         │ │(sem tools)  │  │(fallback msg)│
│ Loads:  │ └─────────────┘  └──────────────┘
│ Skill   │
│ Agent   │
└────┬────┘
     │
     ├── ContentCreator (ReAct: chat, text, search, image)
     └── VisualCreator (ReAct: image)
           │
           ▼
     ReAct Loop (max 5 rounds):
       LLM decide tool → executa → observa → repete
           │
           ▼
     AIMessage (resposta final) → SSE streaming → Frontend
```

### Princípio Fundamental: Engine Único com Context Injection

```
NÃO:  N deep agents (um por cliente)
SIM:  1 engine + N contextos (injetados por request)

Context = skill_slug + context_documents + system_prompt + model config

Mesmo código, mesma infra, personalização por dados.
```

---

## 2. Componentes do Harness

### 2.1 BaseAgent (ABC)

**Arquivo:** `api/chat/agents/base.py`

Interface que todo agent deve implementar:

```python
class BaseAgent(ABC):
    @property
    @abstractmethod
    def name(self) -> str: ...              # ID único ("content_creator")

    @property
    @abstractmethod
    def system_prompt(self) -> str: ...     # Persona base do agent

    @abstractmethod
    def get_tools(self) -> list: ...        # Tools LangChain disponíveis

    def get_skill_references(self) -> list[str]: ...  # Skills a carregar

    @abstractmethod
    async def invoke(self, state: SunosChatState) -> SunosChatState: ...

    # Built-in:
    def _build_system_prompt_with_skills(self, skill_content): ...
    async def run_react(self, state, llm, *, skill_content, extra_context): ...
```

**ReAct Loop** (`run_react`):
1. LLM recebe: system prompt + skill knowledge + messages
2. LLM decide tool calls (ou responde direto)
3. Para cada tool call: executa → ToolMessage → próximo round
4. Max 5 rounds, depois retorna última AIMessage
5. Retorna `(final_text, tool_results)`

**Como criar um novo agent:**

```python
# api/chat/agents/meu_agent.py
class MeuAgent(BaseAgent):
    def __init__(self, llm):
        self._llm = llm

    @property
    def name(self) -> str:
        return "meu_agent"

    @property
    def system_prompt(self) -> str:
        return "Você é um especialista em X..."

    def get_tools(self):
        return [tool_a, tool_b]

    async def invoke(self, state):
        from chat.skills import skill_loader
        skill = skill_loader.load(state.get("active_skill"))
        context = "\n".join(state.get("context_documents", []))

        text, tools = await self.run_react(
            state, self._llm,
            skill_content=skill,
            extra_context=f"Contexto da Biblioteca:\n{context}"
        )

        from langchain_core.messages import AIMessage
        return {**state, "messages": [AIMessage(content=text)]}
```

### 2.2 Agents Existentes

| Agent | Arquivo | Tools | Quando é chamado |
|-------|---------|-------|-----------------|
| **ContentCreator** | `agents/content_creator.py` | chat_completion, generate_text, search_knowledge, generate_image | Intenções: criacao, midia, planejamento |
| **VisualCreator** | `agents/visual_creator.py` | generate_image | Intenções com geração visual |
| **Conversational** | `agents/conversational.py` | Nenhuma | Intenção: conversation |

### 2.3 SunosChatState

**Arquivo:** `api/chat/graph/state.py`

```python
class SunosChatState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]  # Conversação (append-only)
    current_intent: str        # "criacao" | "midia" | "planejamento" | "conversation"
    current_agent: str         # agent ativo
    active_skill: str | None   # "copy-social" | "plano-de-midia" | etc.
    skill_references: list[str]  # Conteúdo carregado dos references/
    context_documents: list[str] # Docs da Biblioteca injetados
    system_prompt: str | None    # Override do SkillAdmin
    conversation_id: str
    model: str                   # "gemini-flash" | "gpt-4o" | "claude"
    temperature: float
    max_tokens: int
    web_search: bool
    generated_images: list[dict]
    generated_texts: list[str]
```

### 2.4 Graph Builder

**Arquivo:** `api/chat/graph/builder.py`

```
Topology:
    START → top_supervisor
              │ conditional_edges
              ├── criacao/midia/planejamento → orchestrator → respond → END
              ├── conversation → conversation_node → respond → END
              └── respond → END
```

**Decisão importante:** Orchestrator e Conversation vão para `respond → END` (não voltam ao supervisor). Isso evita recursion limit.

### 2.5 TopSupervisor

**Arquivo:** `api/chat/graph/top_supervisor.py`

**Routing em 2 modos:**

1. **Short-circuit** (sem LLM): se `skill_slug` está no `_SKILL_INTENT_MAP`, retorna intent diretamente. Zero latência.

2. **LLM classification** (fallback): se skill não mapeado, LLM classifica intent do user message em JSON: `{"intent": "criacao"}`. Parsing robusto com fallback de keyword.

```python
_SKILL_INTENT_MAP = {
    "copy-social": "criacao",
    "texto-de-radio": "criacao",
    "plano-de-midia": "midia",
    # ...
}
```

### 2.6 Orchestrator

**Arquivo:** `api/chat/graph/orchestrator.py`

1. Recebe intent do supervisor
2. Mapeia intent → agent name (`_INTENT_AGENT_MAP`)
3. Carrega skill via `SkillLoader`
4. Injeta skill references no state
5. Chama `agent.invoke(state)`

### 2.7 Skills System

**Arquivo:** `api/chat/skills/__init__.py`

```python
class SkillContent:
    slug: str              # "copy-social"
    overview: str          # Conteúdo do SKILL.md
    references: list[str]  # Conteúdo dos references/*.md

class SkillLoader:
    def load(slug) -> SkillContent | None  # Lê do filesystem
    def list_skills() -> list[str]         # Lista slugs disponíveis
```

**Progressive Disclosure:** Skill é carregado APENAS quando o orchestrator precisa. Não entra no prompt por padrão.

**Como criar um novo skill:**
```bash
mkdir -p api/chat/skills/meu-skill/references
# SKILL.md: overview, quando usar, persona
# references/*.md: conhecimento específico (brand voice, guidelines, etc.)
```

### 2.8 Model Routing + Fallback

**Arquivo:** `api/chat/graph/runner.py` → `_get_llm()`
**Arquivo:** `api/chat/tools/chat_tools.py` → `_get_llm()`

```python
MODEL_MAP = {
    "gemini-flash": "gemini-2.5-flash",  # Default
    "gemini-pro": "gemini-2.5-pro",
    "gpt-4o": "gpt-4o",
    "claude": "claude-sonnet-4",
}
```

**Lógica de fallback:**
1. Tenta modelo solicitado
2. Se API key ausente → fallback para Gemini Flash (com warning log)
3. Se nenhuma key → ValueError

**Retry:** `chat/tools/retry.py` — decorator `@retry_on_error(max_retries=3, base_delay=1.0)` com exponential backoff.

---

## 3. Tools

### 3.1 Inventário

| Tool | Arquivo | Input | Output | Status |
|------|---------|-------|--------|--------|
| `chat_completion` | `tools/chat_tools.py` | message, model, temperature, system_prompt | string (LLM response) | Ativo |
| `generate_text` | `tools/text_tools.py` | prompt, content_type, tone, length, model | string (texto gerado) | Ativo |
| `generate_image` | `tools/image_tools.py` | prompt, model, aspect_ratio, style | JSON (url, width, height) | Mock |
| `enhance_prompt` | `tools/prompt_tools.py` | prompt, target_tool, context | JSON (enhanced, suggestions) | Ativo |
| `web_search` | `tools/search_tools.py` | query | string (resultados) | Mock |
| `search_knowledge` | `knowledge/document_search.py` | query, scope?, file_type?, limit | string (chunks formatados) | Ativo (pgvector) |
| `read_full_document` | `knowledge/document_search.py` | doc_id | string (doc completo) | Ativo |
| `find_related_documents` | `knowledge/document_search.py` | doc_id, limit | string (docs similares) | Ativo |

### 3.2 Como criar uma nova Tool

```python
# api/chat/tools/minha_tool.py
from langchain_core.tools import tool
from chat.tools.retry import retry_on_error

@tool
def minha_tool(param1: str, param2: int = 10) -> str:
    """Docstring clara — o LLM usa isso pra decidir quando chamar."""

    @retry_on_error(max_retries=3)
    def _call():
        # implementação
        return resultado

    try:
        return _call()
    except Exception as exc:
        return f"[minha_tool error] {exc}"
```

**Registrar no agent:**
```python
# api/chat/agents/content_creator.py
from chat.tools.minha_tool import minha_tool

def get_tools(self):
    return [...existing..., minha_tool]
```

**A docstring é CRÍTICA** — é o que o LLM usa pra decidir se chama a tool. Docstrings vagas = tool chamada no momento errado.

---

## 4. Knowledge / RAG Architecture

### 4.1 Três Camadas de Conhecimento

| Camada | Latência | Quando usar | Onde vive |
|--------|----------|-------------|-----------|
| **Context** (Layer 1) | 0ms | Sempre — está no prompt | Skill references + context_documents |
| **Retrieval** (Layer 2) | ~100ms | Quando agent precisa buscar | pgvector (search_knowledge tool) |
| **Processing** (Layer 3) | Async | Upload de novos docs | Ingestion pipeline |

### 4.2 Embeddings

**Arquivo:** `api/chat/knowledge/embeddings.py`

| Propriedade | Valor |
|-------------|-------|
| Modelo | `text-embedding-004` (Gemini) |
| Dimensões | 768 |
| Task type (doc) | `retrieval_document` |
| Task type (query) | `retrieval_query` |
| Fallback | Zero vector quando API indisponível |

### 4.3 Vector Store (pgvector)

**Arquivo:** `api/chat/knowledge/vector_store.py`

```sql
-- Tabelas
knowledge_documents (id, title, file_type, file_url, content_text, tags[], scope[], status, ...)
knowledge_chunks (id, document_id, chunk_index, content, embedding vector(768), metadata jsonb)

-- Índice
CREATE INDEX ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

**Busca:**
```python
# Cosine similarity search com filtros
SELECT kc.*, kd.title, kd.file_type,
       1 - (kc.embedding <=> :query_embedding) AS score
FROM knowledge_chunks kc
JOIN knowledge_documents kd ON kc.document_id = kd.id
WHERE kd.scope && :scope_filter  -- array overlap
ORDER BY kc.embedding <=> :query_embedding
LIMIT :limit
```

### 4.4 Ingestion Pipeline

**Diretório:** `api/chat/ingestion/`

```
Upload → processor.py (dispatcher por tipo)
  ├── pdf_processor.py    → pdfplumber → text → chunk_by_section → embed
  ├── audio_processor.py  → Gemini transcribe → chunk_by_segment → embed
  ├── video_processor.py  → Gemini multimodal → transcribe + keyframes → embed
  ├── image_processor.py  → Gemini Vision caption → embed
  └── text_processor.py   → chunk_by_paragraph → embed
                              │
                              ▼
                     thumbnail.py → Pillow resize → WebP
```

**Chunking strategies:**
- PDF: por seção/heading. Fallback: 1000 tokens com 200 overlap.
- Áudio/Vídeo: por segmentos de ~2min com overlap de 15s.
- Texto: por parágrafo. Merge parágrafos < 100 tokens.

### 4.5 Agentic RAG

Três tools no LangGraph que o agent pode chamar:

| Tool | Quando o agent usa |
|------|-------------------|
| `search_knowledge(query)` | Busca semântica por query — maioria dos casos |
| `read_full_document(doc_id)` | Precisa do contexto completo de um doc |
| `find_related_documents(doc_id)` | Precisa cruzar informações entre docs |

---

## 5. Workflow Engine

### 5.1 Arquitetura

```
WorkflowDefinition (JSON no PostgreSQL)
     │
     ▼
WorkflowCompiler.compile(definition) → LangGraph StateGraph
     │
     ▼
WorkflowExecutor.run_stream(workflow_id, run_id, definition) → SSE events
```

**Princípio:** Workflows são dados (JSON), não código. O compiler transforma em StateGraph em runtime.

### 5.2 WorkflowState

```python
class WorkflowState(TypedDict):
    workflow_id: str
    run_id: str
    steps_output: dict[str, Any]     # {step_id: output} — dados passam entre steps
    current_step: str
    status: str                       # running | completed | failed | paused
    messages: Annotated[list, add_messages]
    human_input: str | None           # Input do HITL resume
    model: str
    error: str | None
    _depth: int                       # Controle de nesting (max 3)
    config_overrides: dict            # Input mapping para sub-workflows
```

### 5.3 Step Types

| Type | O que faz | Node gerado |
|------|-----------|-------------|
| `tool` | Chama tool do registry | `tool_fn.ainvoke(config)` |
| `llm` | Chama LLM com prompt | `ChatGoogleGenerativeAI.ainvoke()` |
| `hitl` | Pausa para revisão humana | `interrupt()` → resume via API |
| `condition` | Branching condicional | Conditional edge (then/else) |
| `action` | Side effect (Slack, email) | `tool_fn.ainvoke()` |
| `workflow` | Chama outro workflow | Sub-compile + sub-execute (max depth 3) |

### 5.4 Template Resolution

Steps podem referenciar outputs de steps anteriores:

```
{{steps.step_1.output}}   → Output do step_1
{{steps.step_2.field}}    → Campo específico do output do step_2
{{previous}}              → Output do step imediatamente anterior
```

### 5.5 HITL (Interrupt/Resume)

```python
# Step type "hitl" chama:
result = interrupt({
    "step_id": step_id,
    "output_to_review": last_output,
    "instructions": "Revise o output abaixo.",
})

# Resume via API:
POST /api/workflows/{id}/runs/{run_id}/resume
Body: {"approved": true, "feedback": "OK"}
```

### 5.6 Rate Limiting & Safety

- Max 30 execuções/hora por workflow (in-memory counter)
- Max 300s por execução (configurable)
- Max nesting depth 3 (sub-workflows)
- Retry com exponential backoff em steps tool/action

---

## 6. Evaluation Framework

### 6.1 Três Camadas de Eval

| Camada | O que mede | Quando | Arquivo |
|--------|-----------|--------|---------|
| **Tracing** | Latência, tokens, routing, tools | Cada request | `eval/tracing.py` |
| **Quality Scorers** | Output é bom? | CI + ad hoc | `eval/scorers.py` |
| **Trajectory** | Agent seguiu o fluxo certo? | CI + ad hoc | `eval/trajectory.py` |

### 6.2 MLflow Tracing

**Decorator:** `@trace_chat_turn` no `run_chat_stream()`

Logga: message, skill_slug, model, conversation_id, latency_ms.

No-op se MLflow indisponível.

### 6.3 Scorers

| Scorer | Input | Output | Método atual |
|--------|-------|--------|-------------|
| `tone_scorer` | output, expected_tone | ScoreResult (0-1) | Heurístico (keyword matching) |
| `format_scorer` | output, expected_format | ScoreResult (0-1) | Heurístico (length, keywords) |
| `routing_scorer` | actual_intent, expected_intent | ScoreResult (0-1) | Exact match |
| `context_scorer` | output, context_docs | ScoreResult (0-1) | Word overlap |

**TODO crítico:** Migrar scorers de heurístico para **LLM-as-Judge** (Gemini Flash como avaliador). Heurísticos atuais são frágeis.

### 6.4 Trajectory Evaluation

Verifica se o graph percorreu o caminho correto:

```python
# Esperado para skill "copy-social":
["top_supervisor", "orchestrator", "content_creator", "respond"]

# Esperado para conversa geral:
["top_supervisor", "conversation", "respond"]
```

### 6.5 Eval Datasets

20 casos em `api/chat/eval/datasets/`:
- `routing_decisions.json` — 10 casos de routing
- `tone_evaluations.json` — 5 casos de tom
- `format_evaluations.json` — 5 casos de formato

**Como adicionar um caso:**
```json
{
  "input": "Crie um post para Instagram sobre...",
  "skill_slug": "copy-social",
  "expected_intent": "criacao",
  "expected_tone": "creative",
  "expected_format": "social_post"
}
```

---

## 7. O que Precisa Evoluir (para o AI Engineer)

### Prioridade Alta

| Item | Onde | Por que |
|------|------|---------|
| **Scorers → LLM-as-Judge** | `eval/scorers.py` | Heurísticos são frágeis. Usar Gemini Flash como juiz. |
| **Conversation persistence** | `conversation_store.py` | Sem memória entre sessões. Agent começa do zero toda vez. |
| **ImageGen real** | `tools/image_tools.py` | Mock atualmente. Precisa Vertex AI Imagen 4. |
| **Web Search real** | `tools/search_tools.py` | Mock. Integrar Tavily ou SerpAPI. |

### Prioridade Média

| Item | Onde | Por que |
|------|------|---------|
| **Streaming por token** (não por mensagem) | `graph/runner.py` | Hoje emite texto inteiro de uma vez. Streaming mais granular melhoraria UX. |
| **Multi-turn memory** | `graph/state.py` | Context window é reset por request. Implementar window sliding ou summarization. |
| **Tool call visualization** | Frontend | User não vê quando agent chama tools. Deveria mostrar "Buscando na Biblioteca..." |
| **Cost tracking** | `eval/tracing.py` | Não rastreia custo em $ por request. |

### Prioridade Baixa

| Item | Onde | Por que |
|------|------|---------|
| **A/B testing de prompts** | Skills system | Testar variações de system prompt automaticamente |
| **Agent autônomo** | Novo agent type | Agent que planeja + executa sem interação humana |
| **Multi-agent collaboration** | Graph builder | Agents que colaboram entre si (ex: pesquisador → redator → revisor) |

---

## 8. Onboarding Tasks (AI Engineer)

### Dia 1 — Entenda o harness

1. **Trace uma request completa:** Coloque `print()` em `top_supervisor.py`, `orchestrator.py`, `content_creator.py`. Envie mensagem pelo chat. Siga o fluxo.

2. **Leia o BaseAgent:** Entenda `run_react()` — é o coração do sistema. Cada agent é um loop ReAct sobre tools.

3. **Mude um skill:** Edite `api/chat/skills/copy-social/SKILL.md`. Adicione uma instrução ("Sempre inclua emoji no início"). Teste no chat.

### Dia 2 — Entenda as tools

4. **Crie uma tool dummy:** Crie `api/chat/tools/hello_tool.py` com `@tool` que retorna "Hello". Registre no ContentCreator. Peça para o LLM usá-la.

5. **Teste search_knowledge:** Uploade um doc na Biblioteca via API. Depois peça ao agent: "O que diz o documento X?" Veja se `search_knowledge` é chamada.

6. **Rode um eval:** Execute os scorers contra os datasets em `chat/eval/datasets/`. Interprete os scores.

### Dia 3 — Entenda os workflows

7. **Crie um workflow:** Use a API para criar um workflow com 2 steps (LLM → action). Execute. Veja os SSE events.

8. **Teste HITL:** Crie workflow com step tipo "hitl". Execute. Veja o interrupt. Resume via API.

9. **Melhore um scorer:** Pegue `tone_scorer` e implemente versão com LLM-as-Judge em vez de keyword matching. Compare resultados.

---

## 9. Referência Rápida

### Paths importantes

```
api/chat/agents/base.py          # BaseAgent ABC — interface de todo agent
api/chat/graph/state.py          # SunosChatState — estado compartilhado
api/chat/graph/builder.py        # Monta o StateGraph
api/chat/graph/runner.py         # Executa graph + SSE streaming
api/chat/graph/top_supervisor.py # Routing (short-circuit + LLM)
api/chat/graph/orchestrator.py   # Carrega skill + delega ao agent
api/chat/skills/__init__.py      # SkillLoader — carrega SKILL.md + references/
api/chat/tools/                  # Todas as tools (LangChain @tool)
api/chat/knowledge/              # pgvector, embeddings, search tools
api/chat/ingestion/              # Pipeline de processamento multimodal
api/chat/eval/                   # Tracing, scorers, trajectory
api/workflows/compiler.py        # WorkflowDefinition → StateGraph
api/workflows/executor.py        # Executa workflow com SSE + rate limit
```

### Comandos úteis

```bash
# Rodar backend
cd api && uv run uvicorn main:app --port 8080 --reload

# Testar chat
curl -X POST localhost:8080/api/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message":"Olá","skill_slug":"copy-social"}'

# Testar text gen
curl -X POST localhost:8080/api/chat/generate-text \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Post sobre investimentos","content_type":"social_post","tone":"creative","length":"short"}'

# Listar skills
python3 -c "from chat.skills import skill_loader; print(skill_loader.list_skills())"

# Rodar eval scorer
python3 -c "
from chat.eval.scorers import tone_scorer
r = tone_scorer('input', 'Imagine um mundo...', 'creative')
print(r)
"
```

### Links

| Doc | Path |
|-----|------|
| Backend conventions | `api/CLAUDE.md` |
| ADR-001 (Workflow Builder) | `docs/adr/ADR-001-agent-builder-deferred.md` |
| ADR-002 (Engine único) | `docs/adr/ADR-002-single-engine-not-deep-agent-per-client.md` |
| SPEC-001 (Backend + Chat) | `docs/specs/large/sunohub-tools-integration/` |
| SPEC-002 (Knowledge + RAG) | `docs/specs/large/knowledge-biblioteca-v2/` |
| SPEC-003 (Workflow Builder) | `docs/specs/large/workflow-builder/` |
| SPEC-004 (Workflow Chaining) | `docs/specs/large/workflow-chaining/` |
| Meridian reference | `/Users/heitormiranda/projects/koro/meridian-api/` |
