---
spec-id: SPEC-003
slug: image-editor
artefato: constitution
atualizada: 2026-04-28
versao: 1.0
escopo:
  projeto: sunos
  stack: "Frontend: Next.js 14 + TypeScript | Backend: FastAPI + LangGraph + Python 3.11"
  autor: Heitor Miranda
  papel: Tech Lead
  branch: master
  contexto: Adicionar editor de imagem (inpaint, outpaint, upscale) — Phase 16 do ROADMAP
---

# Constitution — Image Editor

Princípios imutáveis para a feature de edição de imagem do sunOS. Esta feature é **maior em escopo de UI** que SPEC-002 (vídeo) porque envolve canvas drawing (Fabric.js), por isso ganha rota dedicada `app/editor/page.tsx` em vez de painel embutido no chat.

## Princípios de Arquitetura

1. **Página standalone, não painel** — editor vive em `app/editor/page.tsx` (rota dedicada). Razão: canvas exige espaço de tela, ferramentas em toolbar lateral, undo/redo, etc. Não cabe em painel direito do chat.
2. **3 operações, 3 endpoints** — `inpaint` (edição com máscara), `outpaint` (expansão direcional), `enhance` (upscale x2/x4). Cada uma é stateless e síncrona (resposta direta, sem polling — diferente do vídeo).
3. **Síncrono, não assíncrono** — Imagen edit/outpaint/upscale completa em 5-30s. Cliente espera com loading state. Sem polling.
4. **VisualCreator agent owns it** — tools registradas no `VisualCreator` agent (já existente), mesmo padrão de `image_tools.py` e `video_tools.py`.
5. **Fabric.js é exceção justificada** — única dependência nova permitida. Não há substituto razoável: Konva é igualmente pesado, Canvas API cru exigiria reimplementar drawing/zoom/undo. Custo: ~250KB minificado. Lazy-loaded apenas na rota `/editor`.
6. **Mock-first** — todos os 3 tools backend são mockados primeiro (mesmo padrão SPEC-001/002), Vertex AI Imagen plugado depois.
7. **Backward compatible** — não toca chat, painéis existentes, sistema solar, admin areas.

## Princípios de Qualidade

1. **Fallback obrigatório** — sem backend, página `/editor` mostra banner "Requer backend" e desabilita botões de aplicar; canvas continua usável (drawing local, mas sem aplicar edits).
2. **Undo/redo profundo** — mínimo 20 níveis de undo. Usuário deve poder errar.
3. **Máscara persistente entre edits** — usuário pinta máscara, aplica inpaint, ajusta máscara, aplica de novo. Sem perder o trabalho.
4. **Zoom/pan no canvas** — wheel zoom, drag pan. Imagens raramente cabem 1:1 na tela.
5. **Erros tratados com UX** — toasts/banners com mensagens claras.
6. **Performance**: canvas renderiza < 16ms (60fps) ao desenhar máscara em imagens até 4K.

## Princípios de Segurança

1. **Nenhuma API key no frontend** — chave Vertex AI fica no backend (Secret Manager).
2. **Auth via Firebase JWT** — mesmo `getAuthToken()` do `lib/api.ts`.
3. **Validação de tamanho no backend** — max 20MB por imagem source.
4. **Validação de formato** — apenas PNG, JPG, WebP. Backend rejeita resto.
5. **Sanitização de prompt** — backend remove tokens de jailbreak conhecidos antes de chamar Imagen.

## Padrões Obrigatórios

### Frontend (sunOS)
- **Linguagem**: TypeScript strict
- **Página**: `app/editor/page.tsx` — `'use client'` no topo (canvas é client-only)
- **Estilo**: inline styles + CSS variables (`--void`, `--sun`, `--nebula`, `--text-primary`, etc.)
- **Icons**: Lucide React, `size={14}`, `strokeWidth={1.5}` (toolbar pode usar 18 onde fizer sentido visual)
- **Border radius**: 12px cards, 8px inputs, 9999px pills
- **Loading**: `Loader2` com `animate-spin`
- **Canvas**: Fabric.js v6, lazy-loaded via dynamic import
- **API client**: `lib/api.ts` (estender com `editImage`, `outpaintImage`, `enhanceImage`)
- **Helpers**: `lib/mask-utils.ts` (serialização da máscara para envio)

### Backend (sunos-api)
- **Linguagem**: Python 3.11+
- **Framework**: FastAPI (router em `api/chat/router.py`, estender)
- **Tool**: `api/chat/tools/edit_tools.py` (3 funções: `inpaint_image`, `outpaint_image`, `enhance_image`)
- **Schemas**: `api/chat/schemas/chat.py` (estender com 3 request/response pares)
- **Vertex AI**: `google-cloud-aiplatform` + `vertexai.preview.vision_models.ImageGenerationModel` (Imagen 3 edit/outpaint/upscale)

## Dependências Aprovadas

### Frontend
- **fabric** (`fabric@^6.x`) — **NOVA**, justificada: única lib madura para canvas drawing com mask, undo/redo, zoom/pan. Alternativas avaliadas:
  - **Konva**: similar em peso, API menos amigável para masking
  - **Canvas API cru**: viável mas exigiria reimplementar 60% do que Fabric oferece (custo de manutenção alto)
  - **react-konva**: wrapper React em Konva, mesmo overhead de Konva
  - **Decisão**: Fabric oferece melhor relação peso/funcionalidade. ~250KB minified. Lazy-loaded → não impacta bundle inicial das outras rotas.
- Demais: ZERO deps novas (lucide, react, next-built-ins).

### Backend
- `google-cloud-aiplatform` — já aprovada em SPEC-001.
- `Pillow` (PIL) — para validação de imagem, já vem com várias libs Python; adicionar em `pyproject.toml` se ausente.
- Nenhuma outra dependência nova.

## Anti-patterns Proibidos

1. **Não persistir Fabric canvas state em localStorage** — risco de perder em refresh é aceito; complexidade de serialização não compensa.
2. **Não usar Fabric.js fora da rota `/editor`** — bundle bloat noutras páginas inaceitável.
3. **Não implementar editor de máscara from scratch** — usar Fabric. Não tentar otimização prematura.
4. **Não fazer polling para inpaint/outpaint/upscale** — operações são síncronas (5-30s); polling é overkill.
5. **Não suportar formatos exóticos** — PNG, JPG, WebP é suficiente. TIFF, HEIC, etc. fora.
6. **Não inventar operações** — apenas inpaint, outpaint (4 direções, 25/50/75/100%), upscale (x2, x4). "Style transfer", "remove background" e similares são fora de escopo.
7. **Não fazer auto-save de edições** — usuário decide quando aplicar / baixar / descartar.
8. **Não criar histórico de edits no backend** — operações são efêmeras, output só vive como GCS signed URL retornado na response.

## Referências Obrigatórias

- Padrão visual: `components/chat/ImageGenPanel.tsx` (toolbar e CSS vars)
- Padrão de cliente HTTP: `lib/api.ts` (`generateImage`, `consumeSSE`)
- Padrão de tool backend: `api/chat/tools/image_tools.py` (mock comentado)
- Padrão de schema: `api/chat/schemas/chat.py` (`ImageGenRequest/Response`)
- Princípios herdados: `docs/specs/large/sunohub-tools-integration/constitution.md`
- ROADMAP item: Phase 16 ("Image editor com inpainting/outpainting" + "Image enhance (upscale x2/x4)")
- Fabric.js docs: https://fabricjs.com/docs/
