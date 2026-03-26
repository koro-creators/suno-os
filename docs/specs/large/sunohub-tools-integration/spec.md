---
spec-id: SPEC-001
slug: sunohub-tools-integration
artefato: spec
nivel-sdd: spec-anchored
tamanho: large
status: rascunho
criada: 2026-03-26
atualizada: 2026-03-26
versao: 1.0
escopo:
  projeto: sunos
  stack: Next.js 14 + TypeScript + Supabase
  autor: Heitor Miranda
  papel: Tech Lead
  branch: master
  contexto: Substituir mock streaming por IA real, integrar tools do sunohub
---

# Spec — sunohub Tools Integration

## Resumo

Integrar 4 ferramentas de IA do sunohub (Chat, TextGen, ImageGen, Prompt Assistant) como tools consumíveis pelos skills do sunOS. Substituir o mock streaming atual no chat por respostas reais via Supabase Edge Functions. Cada tool é uma função TypeScript isolada com interface clara que skills podem orquestrar.

**O quê**: Layer de tools entre frontend e APIs de IA
**Por quê**: Transformar o protótipo em produto funcional, permitindo que o time de criação use skills com IA real
**Para quem**: Time de criação da Suno (P2: criativo, P3: estrategista)

## Comportamento Especificado

### Tool 1: Chat (P0)

**Input:**
```typescript
interface ChatToolInput {
  message: string;
  model: string;                    // 'gemini-flash' | 'gemini-pro' | 'gpt-4o' | 'claude'
  systemPrompt?: string;           // do SkillAdmin.systemPrompt
  temperature?: number;            // do SkillAdmin.temperature
  maxTokens?: number;              // do SkillAdmin.maxTokens
  context?: string[];              // conteúdo dos BibliotecaDocuments ativos
  conversationHistory?: Message[]; // mensagens anteriores da sessão
  webSearch?: boolean;             // habilitar busca web
}
```

**Output (streaming):**
```typescript
interface ChatToolOutput {
  type: 'text' | 'sources' | 'done' | 'error';
  content?: string;               // chunk de texto (streaming)
  sources?: { title: string; url: string }[];  // se web search
  error?: string;
}
```

**Fluxo:**
1. Frontend monta input com systemPrompt do skill + context da Biblioteca ativa
2. Chama Supabase Edge Function `chat-stream` via fetch com streaming
3. Processa SSE events, atualiza UI em tempo real
4. Ao receber `done`, salva mensagem completa no state
5. Se erro, mostra toast + volta ao fallback mock

**Mapeamento de modelos:**
| sunOS (SkillAdmin.model) | Supabase model_id |
|--------------------------|-------------------|
| `gemini-pro` | `gemini-3-pro` |
| `gemini-flash` | `gemini-3-flash` |
| `gpt-4o` | `gpt-4o` |
| `claude` | `claude-sonnet-4` |

### Tool 2: TextGen (P0)

**Input:**
```typescript
interface TextGenToolInput {
  prompt: string;
  contentType: 'social_post' | 'article' | 'caption' | 'email' | 'script' | 'custom';
  tone: 'formal' | 'casual' | 'professional' | 'creative' | 'friendly';
  length: 'short' | 'medium' | 'long';
  variations?: number;            // quantas versões gerar (1-4)
  model?: string;
  context?: string[];             // contexto da Biblioteca
}
```

**Output:**
```typescript
interface TextGenToolOutput {
  texts: string[];                // array de variações
  model: string;
  tokensUsed: number;
}
```

**Fluxo:**
1. Monta prompt com contentType + tone + length como instruções
2. Se variations > 1, gera N versões em sequência (ou paralelo se API suportar)
3. Retorna array de textos

### Tool 3: ImageGen (P1)

**Input:**
```typescript
interface ImageGenToolInput {
  prompt: string;
  model: string;                  // 'imagen-4-standard' | 'imagen-4-fast' | 'dall-e-3'
  aspectRatio?: string;           // '1:1' | '16:9' | '9:16' | '4:3'
  resolution?: string;            // '1024' | '2048'
  quantity?: number;              // 1-4
  style?: string;                 // nome do estilo (cinematic, minimalist, etc.)
  referenceImages?: string[];     // URLs de imagens de referência
}
```

**Output:**
```typescript
interface ImageGenToolOutput {
  images: { url: string; width: number; height: number }[];
  model: string;
  enhancedPrompt?: string;        // prompt melhorado pelo modelo
}
```

### Tool 4: Prompt Assistant (P1)

**Input:**
```typescript
interface PromptAssistantInput {
  prompt: string;
  targetTool: 'chat' | 'image' | 'video' | 'text';
  context?: string;               // contexto adicional (tom de voz, briefing)
}
```

**Output:**
```typescript
interface PromptAssistantOutput {
  enhancedPrompt: string;
  suggestions: string[];          // alternativas
  reasoning: string;              // por que melhorou assim
}
```

## Interface & Contratos

### Supabase Client

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

### Tool Registry

```typescript
// lib/tools/registry.ts
interface Tool<TInput, TOutput> {
  name: string;
  description: string;
  execute: (input: TInput) => Promise<TOutput>;
  stream?: (input: TInput) => AsyncGenerator<TOutput>;
}

const toolRegistry: Record<string, Tool<unknown, unknown>>;

function getTool(name: string): Tool;
function listTools(): string[];
```

### Skill → Tool Connection

Cada `SkillAdmin` no sunOS já tem `model`, `temperature`, `maxTokens`, `systemPrompt`. Ao abrir um chat:

1. Busca o skill do SkillsContext
2. Busca documentos ativos do BibliotecaContext
3. Monta `ChatToolInput` com systemPrompt + context
4. Chama `chatTool.stream(input)`
5. Renderiza resposta em tempo real

### Fallback para Mock

```typescript
// lib/tools/chat-tool.ts
async function* chatStream(input: ChatToolInput) {
  if (!supabaseAvailable()) {
    // Fallback: usa mock streaming existente
    yield* mockStream(input.message);
    return;
  }
  // Real: chama Supabase Edge Function
  yield* supabaseStream(input);
}
```

## Restrições Técnicas

1. **Stack**: Next.js 14 + TypeScript. Edge Functions em Deno (já existem no sunohub)
2. **Única dependência nova**: `@supabase/supabase-js`
3. **Env vars**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. **Sem autenticação nesta fase** — acesso anônimo via anon key (protótipo interno)
5. **Edge Functions**: reutilizar as do sunohub sem modificação (apenas apontar para o mesmo projeto Supabase)
6. **Streaming**: usar `fetch` com `ReadableStream` para SSE (não WebSocket)
7. **Porta**: dev server continua na 3003
8. **Não quebrar**: mock streaming deve continuar funcionando se Supabase não configurado

## Critérios de Aceite

### Chat Real
- [ ] DADO um skill com systemPrompt configurado, QUANDO o usuário envia mensagem no chat, ENTÃO a resposta vem do modelo de IA real (não mock)
- [ ] DADO streaming ativo, QUANDO chunks chegam via SSE, ENTÃO o texto aparece progressivamente na tela
- [ ] DADO context da Biblioteca ativo, QUANDO o usuário pergunta, ENTÃO a IA usa o contexto dos documentos ativos
- [ ] DADO Supabase indisponível, QUANDO o usuário envia mensagem, ENTÃO o sistema usa fallback mock com toast informativo
- [ ] DADO web search habilitado, QUANDO a IA busca na web, ENTÃO sources aparecem na resposta

### TextGen
- [ ] DADO contentType "social_post" e tone "creative", QUANDO gera texto, ENTÃO o output segue tom e formato corretos
- [ ] DADO variations=3, QUANDO gera, ENTÃO retorna exatamente 3 variações diferentes
- [ ] DADO model do skill, QUANDO gera texto, ENTÃO usa o modelo configurado

### ImageGen
- [ ] DADO um prompt, QUANDO gera imagem, ENTÃO retorna URL da imagem gerada
- [ ] DADO aspectRatio "16:9", QUANDO gera, ENTÃO imagem tem proporção correta
- [ ] DADO quantity=2, QUANDO gera, ENTÃO retorna 2 imagens

### Prompt Assistant
- [ ] DADO um prompt curto, QUANDO aprimora, ENTÃO retorna versão expandida com detalhes
- [ ] DADO targetTool "image", QUANDO aprimora, ENTÃO adiciona descritores visuais ao prompt

### Integração com Chat UI
- [ ] DADO o chat existente, QUANDO integrado com chat tool, ENTÃO a UI não muda (mesma aparência, streaming real)
- [ ] DADO o ContextSidebar, QUANDO documentos ativos mudam, ENTÃO o próximo chat usa novo contexto
- [ ] DADO o HITL feedback, QUANDO o usuário avalia resposta real, ENTÃO funciona igual ao mock

## Notas de Implementação

1. **Reutilizar `useStreamingText` hook** — adaptar para aceitar stream real além de mock
2. **ChatInterface precisa de refactor mínimo** — trocar chamada mock por chamada à tool
3. **Edge Functions do sunohub** já lidam com multi-model routing — não reinventar
4. **Créditos**: nesta fase, ignorar sistema de créditos. Toda chamada é livre.
5. **Rate limits**: Gemini tem 15 RPM free tier, GPT-4o tem 3 RPM. Implementar backoff simples.
6. **Imagens geradas**: armazenar URL temporária (Supabase Storage). Sem CDN nesta fase.

<!-- REVIEW -->
**Checkpoint de revisão**: A especificação captura o que você realmente quer construir?

## Prompt para Agente

Integre ferramentas de IA do sunohub no sunOS conforme esta especificação:

**Contexto**: sunOS é um protótipo Next.js 14 com skills de IA por cliente. Hoje usa mock streaming. Precisa virar IA real via Supabase Edge Functions.

**O que implementar**:
- Layer de tools em `lib/tools/` com ChatTool, TextGenTool, ImageGenTool, PromptAssistantTool
- Supabase client em `lib/supabase.ts`
- Adaptar `ChatInterface` para usar ChatTool em vez de mock
- Fallback para mock quando Supabase indisponível
- Manter toda a UI existente (design system, HITL, Biblioteca)

**Restrições**:
- Única dependência nova: `@supabase/supabase-js`
- Não quebrar sistema solar nem áreas admin
- Streaming via fetch + ReadableStream, não WebSocket
- Sem autenticação (anon key), sem créditos nesta fase

**Testes esperados**:
- Chat com Gemini Flash retorna resposta real em streaming
- TextGen com variações retorna N textos diferentes
- ImageGen retorna URL de imagem válida
- Fallback mock funciona quando Supabase não configurado
