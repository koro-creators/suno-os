---
spec-id: SPEC-001
slug: sunohub-tools-integration
artefato: design
atualizada: 2026-03-26
versao: 2.0
---

# Design — sunohub Tools Integration (v2)

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend: sunOS (Next.js 14)                                │
│                                                             │
│  ChatInterface ──→ fetch(/api/chat/stream) ──→ SSE         │
│  ResultActions ──→ fetch(/api/chat/generate-text)           │
│  ChatInput     ──→ fetch(/api/chat/enhance-prompt)          │
│                                                             │
│  lib/api.ts (HTTP client)                                   │
│  hooks/useToolStream.ts (SSE consumer)                      │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS / SSE
                        │
┌───────────────────────▼─────────────────────────────────────┐
│ Backend: sunos-api (FastAPI + LangGraph)                    │
│                                                             │
│  chat/router.py (endpoints)                                 │
│       │                                                     │
│       ▼                                                     │
│  graph/top_supervisor.py                                    │
│  ┌─ Detecta intenção: criacao | midia | planejamento | conv │
│  │                                                          │
│  ├──→ Orchestrator (criacao)                                │
│  │     ├── ContentCreator agent (ReAct)                     │
│  │     │   tools: chat, text_gen, image_gen                 │
│  │     │   skill: copy-social/ (loaded references)          │
│  │     └── VisualCreator agent (ReAct)                      │
│  │         tools: image_gen, video_gen, enhance             │
│  │                                                          │
│  ├──→ Orchestrator (midia)                                  │
│  │     └── ContentCreator agent (ReAct)                     │
│  │         tools: chat, text_gen, web_search                │
│  │         skill: plano-de-midia/ (loaded references)       │
│  │                                                          │
│  ├──→ Orchestrator (planejamento)                           │
│  │     └── ContentCreator + VisualCreator                   │
│  │         skill: persona-sintetica/ etc.                   │
│  │                                                          │
│  └──→ ConversationalAgent                                   │
│        Perguntas gerais, onboarding                         │
│                                                             │
│  tools/                                                     │
│  ├── chat_tools.py      (Gemini/GPT streaming)              │
│  ├── text_tools.py      (geração por tipo/tom)              │
│  ├── image_tools.py     (Vertex AI Imagen 4)                │
│  ├── video_tools.py     (Vertex AI Veo 3.1)                 │
│  ├── search_tools.py    (web search)                        │
│  └── prompt_tools.py    (aprimoramento de prompt)           │
│                                                             │
│  skills/                                                    │
│  ├── copy-social/SKILL.md + references/                     │
│  ├── plano-de-midia/SKILL.md + references/                  │
│  └── ... (1 dir por skill do sunOS)                         │
│                                                             │
│  eval/                                                      │
│  ├── tracing.py         (MLflow GenAI decorator)            │
│  ├── scorers.py         (tone, format, routing, context)    │
│  └── datasets/          (eval JSON files)                   │
│                                                             │
│  PostgreSQL (Cloud SQL) ←── conversations, sessions         │
│  MLflow (GCS) ←── traces, eval results                      │
└─────────────────────────────────────────────────────────────┘
                        │
              Google Cloud APIs
                        │
          ┌─────────────┼──────────────┐
          ▼             ▼              ▼
     Gemini API    Vertex AI      OpenAI API
     (chat, text)  (Imagen, Veo)  (GPT, DALL-E)
```

## State (LangGraph)

```python
class SunosChatState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]

    # Routing
    current_intent: str              # "criacao" | "midia" | "planejamento" | "conversation"
    current_agent: str               # agent ativo

    # Skill context
    active_skill: str | None         # "copy-social" | "plano-de-midia" | etc.
    skill_references: list[str]      # conteúdo carregado dos references/

    # Context
    context_documents: list[str]     # documentos da Biblioteca ativos
    system_prompt: str | None        # systemPrompt do SkillAdmin

    # Session
    conversation_id: str
    model: str
    temperature: float
    max_tokens: int
    web_search: bool

    # Results
    generated_images: list[dict]     # imagens geradas na sessão
    generated_texts: list[str]       # textos gerados na sessão
```

## Decisões Técnicas

### 1. Streaming via FastAPI StreamingResponse

```python
from fastapi.responses import StreamingResponse

@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    async def event_generator():
        async for chunk in graph_runner.astream(request):
            yield f"event: {chunk.type}\ndata: {json.dumps(chunk.data)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"}
    )
```

### 2. Frontend SSE Consumer

```typescript
// hooks/useToolStream.ts
async function* consumeSSE(url: string, body: object) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split('\n\n');
    buffer = events.pop()!;
    for (const event of events) {
      yield parseSSEEvent(event);
    }
  }
}
```

### 3. Fallback Strategy

```typescript
// lib/api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

function apiAvailable(): boolean {
  return !!API_URL;
}

// ChatInterface.tsx
if (apiAvailable()) {
  // Stream real via backend
  yield* consumeSSE(`${API_URL}/api/chat/stream`, input);
} else {
  // Mock streaming existente
  yield* mockStream(input.message);
}
```

### 4. Skill Loading (Backend)

```python
# chat/skills/__init__.py
class SkillLoader:
    def load(self, skill_slug: str) -> SkillContent:
        skill_dir = SKILLS_DIR / skill_slug
        skill_md = (skill_dir / "SKILL.md").read_text()
        references = []
        ref_dir = skill_dir / "references"
        if ref_dir.exists():
            for f in ref_dir.glob("*.md"):
                references.append(f.read_text())
        return SkillContent(overview=skill_md, references=references)
```

### 5. Model Mapping

```python
MODEL_MAP = {
    "gemini-flash": "gemini-2.5-flash",
    "gemini-pro": "gemini-2.5-pro",
    "gpt-4o": "gpt-4o",
    "claude": "claude-sonnet-4",
}
```

### 6. BaseAgent (padrão Meridian)

```python
class BaseAgent(ABC):
    @property
    @abstractmethod
    def name(self) -> str: ...

    @property
    @abstractmethod
    def system_prompt(self) -> str: ...

    @abstractmethod
    def get_tools(self) -> list: ...

    def get_skill_references(self) -> list[str]:
        return []

    @abstractmethod
    async def invoke(self, state: SunosChatState) -> SunosChatState: ...

    def _build_system_prompt_with_skills(self, skill_content: SkillContent) -> str:
        base = self.system_prompt
        refs = "\n\n---\n\n".join(skill_content.references)
        return f"{base}\n\n## Skill Knowledge\n\n{skill_content.overview}\n\n{refs}"
```

## Repos e Deploy

| Componente | Repo | Deploy |
|-----------|------|--------|
| Frontend (sunOS) | `koro-creators/suno-os` | Cloud Run (existente) |
| Backend (sunos-api) | `koro-creators/sunos-api` **(novo)** | Cloud Run |
| DB | Cloud SQL (shared) | Já existe |
| MLflow | GCS (shared) | Já existe |

## Impacto no Frontend

| Arquivo | Mudança |
|---------|---------|
| `lib/api.ts` (novo) | Cliente HTTP com helpers para API |
| `hooks/useToolStream.ts` (novo ou refactor) | Consome SSE real + fallback mock |
| `components/chat/ChatInterface.tsx` | Usa API em vez de mock direto |
| `.env.example` | Adicionar `NEXT_PUBLIC_API_URL` |

**Nenhum arquivo admin/Biblioteca/Clientes é afetado.**

<!-- REVIEW -->
**Checkpoint**: A arquitetura faz sentido para as restrições do projeto?

## Changelog

| Versão | Data | Mudança |
|--------|------|---------|
| 2.0 | 2026-03-26 | Pivot para FastAPI + LangGraph. Arquitetura 2 níveis com BaseAgent. |
| 1.0 | 2026-03-26 | Supabase Edge Functions |
