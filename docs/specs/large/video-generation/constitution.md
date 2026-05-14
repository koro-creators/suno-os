---
spec-id: SPEC-002
slug: video-generation
artefato: constitution
atualizada: 2026-04-28
versao: 1.0
escopo:
  projeto: sunos
  stack: "Frontend: Next.js 14 + TypeScript | Backend: FastAPI + LangGraph + Python 3.11"
  autor: Heitor Miranda
  papel: Tech Lead
  branch: master
  contexto: Adicionar geração de vídeo via Vertex AI Veo 3.1 (Phase 16 do ROADMAP)
---

# Constitution — Video Generation

Princípios imutáveis para a feature de geração de vídeo do sunOS. Reaproveita 100% das convenções já estabelecidas em SPEC-001 (sunohub-tools-integration) e estende para suportar operações assíncronas longas (geração de vídeo leva minutos, não segundos).

## Princípios de Arquitetura

1. **Espelhar ImageGenPanel** — UI/UX/visual idênticos ao painel de imagem; só muda o que é estritamente diferente para vídeo (mode toggle T2V/I2V, polling, audio toggle).
2. **Async-first via polling** — geração de vídeo retorna `operationName` imediato; cliente faz polling em `GET /chat/video-status/{op}` até completar. Sem WebSockets, sem long-polling complexo.
3. **2 endpoints, não 1** — `POST /chat/generate-video` (start) + `GET /chat/video-status/{op}` (poll). Separação clara de responsabilidades.
4. **VisualCreator agent owns it** — a tool `generate_video` é registrada no `VisualCreator` agent (já existente), seguindo padrão SPEC-001.
5. **Backward compatible** — não quebra nenhum endpoint, painel ou rota existente.
6. **Mock-first** — backend tool é mockado primeiro (mesmo padrão de `image_tools.py`), Vertex AI Veo plugado depois.

## Princípios de Qualidade

1. **Fallback obrigatório** — se `apiAvailable() === false`, painel mostra mensagem "Requer backend" (mesmo padrão do `ImageGenPanel`).
2. **Progress visível** — barra de progresso simulada com base em estimativa de tempo (~15s por segundo de vídeo gerado). Usuário nunca olha pra tela parada.
3. **Cancelável** — usuário pode cancelar a operação durante polling (cleanup do interval no unmount).
4. **Erros tratados com UX** — toasts/banners com mensagens claras, nunca stack traces.
5. **Latência transparente** — exibir tempo decorrido + ETA durante polling.

## Princípios de Segurança

1. **Nenhuma API key no frontend** — chave Vertex AI fica no backend (Secret Manager).
2. **Auth via Firebase JWT** — mesmo `getAuthToken()` do `lib/api.ts`.
3. **Validação no backend** — duração máxima, resolução, modelo permitido validados em Pydantic schema.
4. **Rate limiting** — respeitar quotas Vertex AI Veo no backend; retornar 429 com `retry_after`.

## Padrões Obrigatórios

### Frontend (sunOS)
- **Linguagem**: TypeScript strict
- **Componente**: `'use client'`, função default export, props tipadas
- **Estilo**: inline styles + CSS variables (`--void`, `--sun`, `--nebula`, `--text-primary`, etc.)
- **Icons**: Lucide React, `size={14}`, `strokeWidth={1.5}` (exceto onde já estabelecido diferente)
- **Border radius**: 12px cards, 8px inputs, 9999px pills
- **Focus ring**: `boxShadow: '0 0 0 2px rgba(255,200,1,0.15)'`
- **Loading**: `Loader2` com `animate-spin`
- **API client**: usar `lib/api.ts` (estender, não recriar)
- **Polling**: hook custom `useVideoPolling()` em `hooks/useVideoPolling.ts`

### Backend (sunos-api)
- **Linguagem**: Python 3.11+
- **Framework**: FastAPI (router em `api/chat/router.py`, estender)
- **Tool**: `api/chat/tools/video_tools.py` seguindo padrão de `image_tools.py`
- **Schemas**: `api/chat/schemas/chat.py` (estender com `VideoGenRequest`, `VideoGenStartResponse`, `VideoStatusResponse`)
- **LLM default**: Gemini 2.5 Flash (não usado para Veo, mas mantido como padrão do projeto para enhance_prompt)
- **Vertex AI**: `google-cloud-aiplatform` (já aprovado em SPEC-001 constitution)
- **Async**: `async def` em endpoints, `httpx.AsyncClient` se necessário

## Dependências Aprovadas

### Frontend
- **ZERO dependências novas** — feature é construída só com fetch nativo, React 18, lucide-react (já presentes).

### Backend
- `google-cloud-aiplatform` — Vertex AI Veo (já aprovada em SPEC-001).
- Nenhuma dependência nova.

## Anti-patterns Proibidos

1. **Não usar WebSocket** para status — polling simples com `setInterval` cobre 100% do caso.
2. **Não bloquear o request HTTP** esperando o vídeo gerar — sempre retornar `operationName` em < 1s.
3. **Não fazer polling sem backoff** — se backend retornar erro 3x consecutivas, parar e mostrar erro.
4. **Não persistir vídeos no frontend** — URLs apontam para GCS/Vertex; cliente só guarda referência.
5. **Não duplicar lógica de `ImageGenPanel`** — extrair primitivos compartilhados em `components/chat/shared/` se necessário.
6. **Não inventar modelos** — apenas Veo 3.0/3.1 (fast e standard) e Veo 2 conforme spec; resto é fora de escopo.
7. **Não tornar a feature "smart"** — sem auto-troca de modelo, sem auto-prompt enhancement por padrão. Usuário decide.

## Referências Obrigatórias

- Padrão visual: `components/chat/ImageGenPanel.tsx` (480 linhas, estabelece o template)
- Padrão de cliente HTTP: `lib/api.ts` (`generateImage`, `consumeSSE`)
- Padrão de tool backend: `api/chat/tools/image_tools.py` (mock comentado, ready for Vertex)
- Padrão de schema: `api/chat/schemas/chat.py` (`ImageGenRequest/Response`)
- Princípios herdados: `docs/specs/large/sunohub-tools-integration/constitution.md`
- ROADMAP item: Phase 16 (`docs/ROADMAP.md`)
