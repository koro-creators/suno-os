---
spec-id: SPEC-001
slug: sunohub-tools-integration
artefato: design
atualizada: 2026-03-26
---

# Design — sunohub Tools Integration

## Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (Next.js 14)                                       │
│                                                             │
│  ChatInterface ──→ ChatTool.stream() ──→ Supabase Edge Fn  │
│  SkillAdmin    ──→ TextGenTool.execute()──→ generate-text   │
│  ResultActions ──→ ImageGenTool.execute()──→ generate-image │
│  ChatInput     ──→ PromptAssistant.execute()──→ prompt-asst │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ lib/tools/                                           │   │
│  │ ├── registry.ts      (tool registry + factory)       │   │
│  │ ├── chat-tool.ts     (streaming chat)                │   │
│  │ ├── textgen-tool.ts  (content generation)            │   │
│  │ ├── imagegen-tool.ts (image generation)              │   │
│  │ ├── prompt-tool.ts   (prompt enhancement)            │   │
│  │ └── types.ts         (shared tool types)             │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                   │
│  lib/supabase.ts ────────┘                                  │
│  (Supabase client)                                          │
└────────────────────────────────────────────────────────────┘
                           │
                    HTTPS / SSE
                           │
┌──────────────────────────▼──────────────────────────────────┐
│ Supabase Edge Functions (Deno) — já existentes no sunohub   │
│                                                             │
│  chat-stream/index.ts    ──→ Google Gemini / OpenAI GPT     │
│  generate-text/index.ts  ──→ Google Gemini / OpenAI GPT     │
│  generate-image/index.ts ──→ Google Imagen 4 / DALL-E 3     │
│  prompt-assistant/index.ts ──→ Gemini Flash                 │
└─────────────────────────────────────────────────────────────┘
```

## Modelo de Dados

### Tool Types (`lib/tools/types.ts`)

```typescript
// Base tool interface
interface Tool<TInput, TOutput> {
  name: string;
  description: string;
  execute: (input: TInput) => Promise<TOutput>;
}

interface StreamingTool<TInput, TChunk> extends Tool<TInput, TChunk[]> {
  stream: (input: TInput) => AsyncGenerator<TChunk>;
}

// Chat
interface ChatInput { message, model, systemPrompt?, temperature?, maxTokens?, context?, history?, webSearch? }
interface ChatChunk { type: 'text'|'sources'|'done'|'error', content?, sources?, error? }

// TextGen
interface TextGenInput { prompt, contentType, tone, length, variations?, model?, context? }
interface TextGenOutput { texts: string[], model, tokensUsed }

// ImageGen
interface ImageGenInput { prompt, model, aspectRatio?, resolution?, quantity?, style?, referenceImages? }
interface ImageGenOutput { images: {url,width,height}[], model, enhancedPrompt? }

// Prompt Assistant
interface PromptAssistantInput { prompt, targetTool, context? }
interface PromptAssistantOutput { enhancedPrompt, suggestions, reasoning }
```

### Supabase Config

```typescript
// lib/supabase.ts
const supabase = createClient(url, anonKey);

// Helper para chamar Edge Functions
async function callEdgeFunction<T>(name: string, body: object): Promise<T>;
async function* streamEdgeFunction(name: string, body: object): AsyncGenerator<string>;
```

## Decisões Técnicas

### 1. Streaming via Fetch (não WebSocket)

O sunohub usa `fetch` com `ReadableStream` para SSE. Mantemos o mesmo approach:

```typescript
const response = await fetch(`${supabaseUrl}/functions/v1/chat-stream`, {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${anonKey}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(input),
});

const reader = response.body!.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value);
  // Parse SSE events
  yield parseSSEChunk(chunk);
}
```

### 2. Fallback Strategy

```
supabaseAvailable() ?
  → real tool execution
  → mock execution (existing behavior)
```

`supabaseAvailable()` verifica se `NEXT_PUBLIC_SUPABASE_URL` está setada e faz um health check leve no primeiro uso.

### 3. Context Injection

Ao abrir chat, o frontend monta o contexto:

```typescript
const systemPrompt = skill.systemPrompt;
const contextDocs = activeDocuments.map(d => `## ${d.title}\n${d.content}`).join('\n\n');
const fullContext = `${systemPrompt}\n\n---\nContexto da Biblioteca:\n${contextDocs}`;
```

Isso é passado como `system` message para a Edge Function.

### 4. Hook Refactor: useStreamingText → useToolStream

O hook `useStreamingText` atual simula streaming com `setTimeout`. Evoluir para:

```typescript
function useToolStream() {
  // Se Supabase disponível: usa stream real
  // Se não: usa mock streaming existente
  // Interface idêntica para o ChatInterface
}
```

### 5. Model Mapping

O `SkillAdmin.model` do sunOS mapeia para o `model_id` do Supabase:

```typescript
const MODEL_MAP: Record<string, string> = {
  'gemini-pro': 'gemini-3-pro',
  'gemini-flash': 'gemini-3-flash',
  'gpt-4o': 'gpt-4o',
  'claude': 'claude-sonnet-4',
};
```

## Impacto em Arquivos Existentes

| Arquivo | Mudança |
|---------|---------|
| `hooks/useStreamingText.ts` | Refactor para suportar stream real + mock |
| `components/chat/ChatInterface.tsx` | Usar tool em vez de mock direto |
| `package.json` | Adicionar `@supabase/supabase-js` |
| `.env.local` (novo) | Supabase URL + anon key |
| `.env.example` (novo) | Template de env vars |
| `.gitignore` | Garantir `.env.local` ignorado |

## Diagrama de Sequência — Chat Real

```
User → ChatInput → ChatInterface → ChatTool.stream()
                                        │
                                        ├→ supabaseAvailable()?
                                        │   YES → fetch(chat-stream) → SSE chunks
                                        │   NO  → mockStream() (existing)
                                        │
                                  ChatInterface ← chunks
                                        │
                                  MessageBubble (progressive render)
                                        │
                                  ContextSidebar (feedback available)
```

<!-- REVIEW -->
**Checkpoint de revisão**: A arquitetura faz sentido para as restrições do projeto?
