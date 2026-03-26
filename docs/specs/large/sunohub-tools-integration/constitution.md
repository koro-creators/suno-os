---
spec-id: SPEC-001
slug: sunohub-tools-integration
artefato: constitution
atualizada: 2026-03-26
escopo:
  projeto: sunos
  stack: Next.js 14 + TypeScript + Supabase Edge Functions
  autor: Heitor Miranda
  papel: Tech Lead
  branch: master
  contexto: Integrar ferramentas de IA do sunohub como tools consumíveis pelos skills do sunOS
---

# Constitution — sunohub Tools Integration

Princípios imutáveis que guiam a integração das ferramentas de IA do sunohub no sunOS.

## Princípios de Arquitetura

1. **Tools são funções atômicas, Skills são orquestradores** — cada tool (Chat, ImageGen, VideoGen, TextGen) é uma função isolada com I/O definido. Skills combinam tools em workflows.
2. **Supabase Edge Functions como backend** — toda interação com APIs de IA passa por Edge Functions do Supabase (já existentes no sunohub). O frontend NUNCA fala diretamente com Google/OpenAI.
3. **Streaming-first** — respostas de chat usam Server-Sent Events (SSE). O frontend consome streams, não respostas batch.
4. **Protótipo primeiro, otimização depois** — a integração inicial pode ser simplificada. Não precisa replicar 100% do sunohub — apenas o core funcional.
5. **Backward compatible** — o sistema solar existente e as 3 áreas admin (Skills, Biblioteca, Clientes) não devem ser afetadas.

## Princípios de Qualidade

1. **Toda tool tem fallback para mock** — se Supabase não está disponível, o sistema volta ao comportamento mocado atual
2. **Erros são tratados com UX** — nunca mostrar stack traces. Toasts com mensagens claras.
3. **Latência visível** — streaming indicators, progress bars, estados de loading explícitos

## Princípios de Segurança

1. **Nenhuma API key no frontend** — todas as chaves ficam nas Edge Functions do Supabase
2. **Variáveis de ambiente via `.env.local`** — `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` apenas
3. **Rate limiting** — respeitar limits das APIs (Gemini, OpenAI, Veo)

## Padrões Obrigatórios

- **Linguagem**: TypeScript (strict)
- **Frontend**: Next.js 14 App Router, React 18
- **Backend**: Supabase Edge Functions (Deno)
- **Estilo**: Inline styles + CSS variables (design system sunOS)
- **Icons**: Lucide React
- **Estado**: React Context para estado local
- **Nomenclatura**: camelCase para variáveis, PascalCase para componentes, kebab-case para arquivos

## Dependências Aprovadas

- `@supabase/supabase-js` — cliente Supabase (NOVA dependência a instalar)
- `lucide-react` — já instalado
- `next`, `react`, `typescript` — já instalados
- NÃO instalar: fabric (canvas), mermaid, recharts, react-hook-form — não necessários nesta fase

## Tools do sunohub a Integrar

| Tool | Prioridade | Edge Function Source |
|------|-----------|---------------------|
| Chat (streaming) | P0 | `supabase/functions/chat-stream/index.ts` |
| TextGen | P0 | `supabase/functions/generate-text/index.ts` |
| ImageGen | P1 | `supabase/functions/generate-image/index.ts` |
| VideoGen | P2 | `supabase/functions/generate-video/index.ts` |
| ImageEnhance | P3 | `supabase/functions/enhance-image/index.ts` |
| ImageEdit | P3 | `supabase/functions/edit-image/index.ts` |
| Prompt Assistant | P1 | `supabase/functions/prompt-assistant/index.ts` |
| Document Processing | P2 | `supabase/functions/process-document/index.ts` |
