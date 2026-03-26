---
spec-id: SPEC-001
slug: sunohub-tools-integration
artefato: spec
nivel-sdd: spec-anchored
tamanho: large
status: rascunho
criada: 2026-03-26
atualizada: 2026-03-26
versao: 2.0
escopo:
  projeto: sunos
  stack: "Frontend: Next.js 14 | Backend: FastAPI + LangGraph"
  autor: Heitor Miranda
  papel: Tech Lead
  branch: master
  contexto: Substituir mock streaming por IA real via backend LangGraph (padrão Meridian)
---

# Spec — sunohub Tools Integration (v2)

## Resumo

Criar backend **sunos-api** (FastAPI + LangGraph) que expõe as ferramentas de IA do sunohub como agents com skills, seguindo o padrão estabelecido no Meridian Chat V2. O frontend sunOS consome via API REST + SSE streaming. Cada skill do sunOS (Copy Social, Plano de Mídia, etc.) mapeia para uma combinação de agent + tools + skill references no backend.

**O quê**: Backend multi-agent com LangGraph que orquestra tools de IA
**Por quê**: Transformar o protótipo em produto funcional com IA real, padrão Koro
**Para quem**: Time de criação da Suno (P2: criativo, P3: estrategista)

## Comportamento Especificado

### API Endpoints

```
POST /api/chat/stream          # Chat streaming (SSE)
POST /api/chat/generate-text   # Geração de texto (batch)
POST /api/chat/generate-image  # Geração de imagem (async)
POST /api/chat/enhance-prompt  # Aprimorar prompt
GET  /api/chat/conversations   # Listar conversas
GET  /api/health               # Health check
```

### Endpoint 1: Chat Stream (P0)

**Input:**
```python
class ChatRequest(BaseModel):
    message: str
    conversation_id: str | None = None
    skill_slug: str                    # "copy-social", "plano-de-midia", etc.
    model: str = "gemini-flash"        # "gemini-flash" | "gemini-pro" | "gpt-4o" | "claude"
    temperature: float = 0.7
    max_tokens: int = 4096
    system_prompt: str | None = None   # override do skill default
    context_documents: list[str] = []  # conteúdo dos BibliotecaDocuments ativos
    web_search: bool = False
```

**Output (SSE stream):**
```
event: text
data: {"content": "chunk de texto"}

event: sources
data: {"sources": [{"title": "...", "url": "..."}]}

event: tool_call
data: {"tool": "generate_image", "status": "started"}

event: tool_result
data: {"tool": "generate_image", "result": {"url": "..."}}

event: done
data: {"conversation_id": "...", "tokens_used": 150}

event: error
data: {"message": "Rate limit exceeded", "retry_after": 30}
```

**Fluxo interno (LangGraph):**
```
ChatRequest → TopSupervisor
  → detecta intenção (criacao | midia | planejamento | conversation)
  → seleciona skill baseado em skill_slug
  → roteia para Orchestrator
    → Orchestrator carrega skill references
    → Agent executa com ReAct (tools disponíveis)
    → Streaming via SSE
```

### Endpoint 2: Generate Text (P0)

**Input:**
```python
class TextGenRequest(BaseModel):
    prompt: str
    content_type: str              # "social_post" | "article" | "caption" | "email" | "script"
    tone: str                      # "formal" | "casual" | "professional" | "creative" | "friendly"
    length: str                    # "short" | "medium" | "long"
    variations: int = 1            # 1-4
    skill_slug: str | None = None  # contexto do skill
    model: str = "gemini-flash"
    context_documents: list[str] = []
```

**Output:**
```python
class TextGenResponse(BaseModel):
    texts: list[str]
    model: str
    tokens_used: int
```

### Endpoint 3: Generate Image (P1)

**Input:**
```python
class ImageGenRequest(BaseModel):
    prompt: str
    model: str = "imagen-4-standard"  # "imagen-4-standard" | "imagen-4-fast" | "dall-e-3"
    aspect_ratio: str = "1:1"         # "1:1" | "16:9" | "9:16" | "4:3"
    quantity: int = 1                  # 1-4
    style: str | None = None          # "cinematic" | "minimalist" | etc.
    enhance_prompt: bool = True
```

**Output:**
```python
class ImageGenResponse(BaseModel):
    images: list[ImageResult]       # url, width, height
    model: str
    enhanced_prompt: str | None
```

### Endpoint 4: Enhance Prompt (P1)

**Input:**
```python
class EnhancePromptRequest(BaseModel):
    prompt: str
    target_tool: str               # "chat" | "image" | "video" | "text"
    context: str | None = None     # tom de voz, briefing, etc.
```

**Output:**
```python
class EnhancePromptResponse(BaseModel):
    enhanced_prompt: str
    suggestions: list[str]
    reasoning: str
```

## Skills System (Backend)

### Estrutura de um Skill

```
sunos-api/chat/skills/
├── copy-social/
│   ├── SKILL.md                    # Overview, quando usar, tools que registra
│   └── references/
│       ├── tone_guides.md          # Guias de tom por plataforma
│       └── platform_specs.md       # Specs por rede social (chars, formatos)
├── plano-de-midia/
│   ├── SKILL.md
│   └── references/
│       ├── benchmark_cpm.md        # Dados de CPM por plataforma
│       └── channel_specs.md        # Specs de canais
├── roteiro-de-video/
│   ├── SKILL.md
│   └── references/
│       └── video_formats.md
├── texto-de-radio/
│   ├── SKILL.md
│   └── references/
│       └── radio_formats.md
├── persona-sintetica/
│   ├── SKILL.md
│   └── references/
│       └── persona_framework.md
├── brief-builder/
│   ├── SKILL.md
│   └── references/
│       └── brief_template.md
├── analise-de-mercado/
│   ├── SKILL.md
│   └── references/
│       └── analysis_frameworks.md
└── report-performance/
    ├── SKILL.md
    └── references/
        └── metrics_guide.md
```

### Mapeamento Skill → Agent → Tools

| Skill sunOS | Agent Backend | Tools Disponíveis |
|-------------|--------------|-------------------|
| copy-social | ContentCreator | chat, text_gen, image_gen |
| plano-de-midia | ContentCreator | chat, text_gen, web_search |
| roteiro-de-video | ContentCreator + VisualCreator | chat, text_gen, video_gen |
| texto-de-radio | ContentCreator | chat, text_gen |
| persona-sintetica | ContentCreator + VisualCreator | chat, text_gen, image_gen |
| brief-builder | ContentCreator | chat, text_gen |
| analise-de-mercado | ContentCreator | chat, text_gen, web_search |
| report-performance | ContentCreator | chat, text_gen |

### Progressive Disclosure

O agent NÃO carrega todas as skills. O TopSupervisor detecta o `skill_slug` e carrega apenas o necessário:

```python
# TopSupervisor routing
if skill_slug in ["copy-social", "texto-de-radio", "roteiro-de-video"]:
    intent = "criacao"
elif skill_slug in ["plano-de-midia", "report-performance"]:
    intent = "midia"
elif skill_slug in ["persona-sintetica", "brief-builder", "analise-de-mercado"]:
    intent = "planejamento"
else:
    intent = "conversation"
```

## Frontend Integration

### Mudanças no sunOS (mínimas)

O frontend muda apenas o `ChatInterface` e hooks:

1. **`lib/api.ts`** (novo) — cliente HTTP para o backend
2. **`hooks/useToolStream.ts`** (refactor de useStreamingText) — consome SSE real
3. **`ChatInterface.tsx`** — usa API em vez de mock
4. **Fallback**: se `NEXT_PUBLIC_API_URL` não configurada, usa mock existente

### Config Frontend

```
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8080  # sunos-api local
```

## Evaluation (Padrão Meridian)

### 3 Camadas

| Camada | O que mede | Quando | Ferramenta |
|--------|-----------|--------|------------|
| **Tracing** | Latência, tokens, routing, tools usadas | Cada request | MLflow GenAI |
| **Trajectory** | Agent seguiu fluxo correto? | Pós-sessão + CI | AgentEvals |
| **Quality** | Output é bom para o skill? | CI em eval datasets | OpenEvals LLM-as-Judge |

### Scorers Customizados

- **Tone scorer**: Output segue tom do skill? (formal para mídia, criativo para criação)
- **Format scorer**: Output segue formato esperado? (social post ≠ artigo)
- **Routing scorer**: Supervisor roteou para agent certo?
- **Context scorer**: Agent usou documentos da Biblioteca no output?

## Restrições Técnicas

1. **Backend**: FastAPI + LangGraph (Python 3.11+), deploy em Cloud Run
2. **LLM default**: Gemini 2.5 Flash (custo-benefício)
3. **DB**: PostgreSQL shared (Cloud SQL, mesmo do Toolbox/Meridian)
4. **Frontend**: ZERO dependências novas — só fetch nativo
5. **Auth**: Firebase JWT (mesmo do Toolbox) — fase 2, não fase 1
6. **Streaming**: SSE via FastAPI StreamingResponse
7. **Fallback**: Frontend funciona sem backend (mock existente)
8. **Porta**: Backend dev na 8080, frontend na 3003

## Critérios de Aceite

### Chat Real
- [ ] DADO um skill com systemPrompt, QUANDO usuário envia mensagem, ENTÃO resposta vem do LLM real via SSE
- [ ] DADO context da Biblioteca ativo, QUANDO usuário pergunta, ENTÃO IA usa contexto no output
- [ ] DADO backend indisponível, QUANDO usuário envia mensagem, ENTÃO fallback mock funciona
- [ ] DADO web_search=true, QUANDO IA busca, ENTÃO sources aparecem na resposta

### TextGen
- [ ] DADO content_type "social_post" e tone "creative", QUANDO gera, ENTÃO output segue formato
- [ ] DADO variations=3, QUANDO gera, ENTÃO retorna 3 textos diferentes

### ImageGen
- [ ] DADO prompt, QUANDO gera imagem, ENTÃO retorna URL válida
- [ ] DADO aspect_ratio "16:9", QUANDO gera, ENTÃO imagem tem proporção correta

### Skills
- [ ] DADO skill "copy-social", QUANDO carregado, ENTÃO agent tem references de tom e plataforma
- [ ] DADO novo skill dir criado, QUANDO usado, ENTÃO funciona sem mudança de código

### Eval
- [ ] DADO request processado, QUANDO logado, ENTÃO trace aparece no MLflow
- [ ] DADO eval dataset, QUANDO roda scorer, ENTÃO score é calculado

## Notas de Implementação

1. **sunos-api é um novo repo** — `koro-creators/sunos-api`, mesmo padrão do meridian-api
2. **BaseAgent ABC** — copiar padrão do Meridian (`chat/agents/base.py`)
3. **Skills references** — conteúdo vem da Biblioteca do sunOS + knowledge estático por skill
4. **Gemini Flash** como default — barato, rápido, suficiente para criação
5. **Sem créditos na fase 1** — toda chamada é livre
6. **Conversations** — armazenadas em PostgreSQL (mesmo schema pattern do Meridian)

<!-- REVIEW -->
**Checkpoint**: A especificação captura o que você realmente quer construir?

## Changelog

| Versão | Data | Mudança |
|--------|------|---------|
| 2.0 | 2026-03-26 | Pivot de Supabase Edge Functions para FastAPI + LangGraph (padrão Meridian) |
| 1.0 | 2026-03-26 | Versão inicial com Supabase |
