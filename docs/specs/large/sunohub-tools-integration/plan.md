---
spec-id: SPEC-001
slug: sunohub-tools-integration
artefato: plan
atualizada: 2026-03-26
---

# Plan — sunohub Tools Integration

## Sequência de Implementação

```
Phase A: Foundation (tools layer + supabase client)
    ↓
Phase B: Chat Real (substituir mock por streaming real)
    ↓
Phase C: TextGen (geração de conteúdo por tipo/tom)
    ↓
Phase D: ImageGen + Prompt Assistant
    ↓
Phase E: Polish (fallback, error handling, env setup)
```

## Phase A: Foundation

**Objetivo**: Criar a layer de tools e o cliente Supabase.

1. `npm install @supabase/supabase-js`
2. Criar `lib/supabase.ts` — cliente + helpers (callEdgeFunction, streamEdgeFunction)
3. Criar `lib/tools/types.ts` — interfaces de todas as tools
4. Criar `lib/tools/registry.ts` — registry com getTool/listTools
5. Criar `.env.example` com template de variáveis
6. Atualizar `.gitignore` para incluir `.env.local`

**Verificação**: `npx tsc --noEmit` passa

## Phase B: Chat Real

**Objetivo**: Substituir mock streaming por chat real via Supabase.

1. Criar `lib/tools/chat-tool.ts` — implementação com stream via fetch + fallback mock
2. Refatorar `hooks/useStreamingText.ts` → `hooks/useToolStream.ts` — aceitar stream real
3. Atualizar `components/chat/ChatInterface.tsx`:
   - Importar ChatTool em vez de mock data
   - Montar context a partir de BibliotecaContext + SkillAdmin.systemPrompt
   - Usar useToolStream para rendering
4. Garantir que HITL feedback continua funcionando com respostas reais
5. Testar com Supabase real E com fallback mock

**Verificação**: Chat funciona com Gemini Flash (se Supabase configurado) e com mock (se não)

## Phase C: TextGen

**Objetivo**: Tool de geração de texto com tipos e variações.

1. Criar `lib/tools/textgen-tool.ts`
2. Criar `components/chat/TextGenPanel.tsx` — UI para selecionar contentType, tone, length
3. Integrar no ChatInterface como ação alternativa (botão "Gerar Texto" no input area)
4. Variações aparecem como VariationCards (componente já existe)

**Verificação**: Gera texto com tom e formato corretos, variações funcionam

## Phase D: ImageGen + Prompt Assistant

**Objetivo**: Geração de imagens e aprimoramento de prompts.

1. Criar `lib/tools/imagegen-tool.ts`
2. Criar `lib/tools/prompt-tool.ts`
3. Criar `components/chat/ImageGenPanel.tsx` — UI com aspect ratio, estilo, quantidade
4. Integrar Prompt Assistant como ícone ✨ no ChatInput (click para aprimorar prompt antes de enviar)
5. Imagens geradas aparecem inline no chat como cards de resultado

**Verificação**: Gera imagem, exibe inline, prompt assistant melhora prompts

## Phase E: Polish

**Objetivo**: Error handling, fallbacks, documentação.

1. Error handling robusto em todas as tools (timeout, rate limit, API errors)
2. Toast messages para erros com mensagens claras
3. Loading states explícitos (shimmer/skeleton enquanto gera)
4. Atualizar CLAUDE.md com info sobre ferramentas
5. Atualizar ROADMAP.md
6. `npx tsc --noEmit` + `npm run build` limpos
7. Commit + push

**Verificação**: Build limpo, todas as rotas funcionam, fallback mock funciona
