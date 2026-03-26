---
spec-id: SPEC-001
slug: sunohub-tools-integration
artefato: tasks
atualizada: 2026-03-26
---

# Tasks — sunohub Tools Integration

## Phase A: Foundation

- [ ] **A1**: Instalar `@supabase/supabase-js` via npm
- [ ] **A2**: Criar `lib/supabase.ts` — createClient + callEdgeFunction helper + streamEdgeFunction helper + supabaseAvailable() check
- [ ] **A3**: Criar `lib/tools/types.ts` — ChatInput, ChatChunk, TextGenInput, TextGenOutput, ImageGenInput, ImageGenOutput, PromptAssistantInput, PromptAssistantOutput, Tool interface, StreamingTool interface
- [ ] **A4**: Criar `lib/tools/registry.ts` — tool registry map, getTool(), listTools()
- [ ] **A5**: Criar `.env.example` — NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] **A6**: Atualizar `.gitignore` — garantir `.env.local` e `.env` ignorados
- [ ] **A7**: Verificar `npx tsc --noEmit`

## Phase B: Chat Real

- [ ] **B1**: Criar `lib/tools/chat-tool.ts` — stream real via fetch SSE + parseSSEChunk + MODEL_MAP + fallback para mock
- [ ] **B2**: Refatorar `hooks/useStreamingText.ts` → suportar AsyncGenerator além de mock (ou criar `hooks/useToolStream.ts`)
- [ ] **B3**: Atualizar `ChatInterface.tsx` — importar ChatTool, montar context (systemPrompt + Biblioteca), usar tool.stream() em handleSend
- [ ] **B4**: Testar chat com Supabase configurado — verificar streaming real
- [ ] **B5**: Testar chat sem Supabase — verificar fallback mock funciona
- [ ] **B6**: Verificar HITL feedback funciona com respostas reais
- [ ] **B7**: Verificar `npx tsc --noEmit` + `npm run build`

## Phase C: TextGen

- [ ] **C1**: Criar `lib/tools/textgen-tool.ts` — execute com contentType/tone/length/variations
- [ ] **C2**: Criar `components/chat/TextGenPanel.tsx` — UI com selects de tipo/tom/tamanho + botão gerar
- [ ] **C3**: Integrar TextGenPanel no ChatInterface — toggle ou ação no input area
- [ ] **C4**: Variações renderizadas via VariationCards existente
- [ ] **C5**: Verificar `npx tsc --noEmit`

## Phase D: ImageGen + Prompt Assistant

- [ ] **D1**: Criar `lib/tools/imagegen-tool.ts` — execute com model/aspectRatio/quantity
- [ ] **D2**: Criar `lib/tools/prompt-tool.ts` — execute com targetTool + context
- [ ] **D3**: Criar `components/chat/ImageGenPanel.tsx` — UI com aspect ratio, estilo, quantidade
- [ ] **D4**: Integrar Prompt Assistant no ChatInput — ícone ✨ que aprimora prompt antes de enviar
- [ ] **D5**: Imagens inline no chat como cards de resultado
- [ ] **D6**: Verificar `npx tsc --noEmit`

## Phase E: Polish

- [ ] **E1**: Error handling em todas as tools (try/catch, timeout 30s, rate limit retry com backoff)
- [ ] **E2**: Toast messages para erros (modelo indisponível, timeout, rate limit)
- [ ] **E3**: Loading states (shimmer no MessageBubble enquanto gera, progress em ImageGen)
- [ ] **E4**: Atualizar CLAUDE.md com seção sobre tools
- [ ] **E5**: Atualizar docs/ROADMAP.md — marcar Phase 11 (Chat real) como concluída
- [ ] **E6**: `npx tsc --noEmit` + `npm run build` limpos
- [ ] **E7**: Commit organizado por phase + push

<!-- REVIEW -->
**Checkpoint de revisão**: As tarefas são implementáveis e testáveis isoladamente?

## Estimativa de Escopo

| Phase | Arquivos novos | Arquivos modificados | Complexidade |
|-------|---------------|---------------------|-------------|
| A | 4 | 2 | Baixa |
| B | 1-2 | 2 | Alta (streaming) |
| C | 2 | 1 | Média |
| D | 3 | 1 | Média |
| E | 0 | 4 | Baixa |
| **Total** | **10-11** | **~10** | — |
