---
spec-id: SPEC-003
slug: image-editor
artefato: tasks
atualizada: 2026-04-28
versao: 1.0
---

# Tasks — Image Editor

## Resumo

| Total | A Fazer | Em Progresso | Concluídas |
|-------|---------|--------------|------------|
| 24 | 24 | 0 | 0 |

## Tasks

### Fase 1 — Backend Foundation

#### TASK-001: Estender schemas com tipos de edit
- **Fase**: 1
- **Escopo**: Adicionar `InpaintRequest`, `OutpaintRequest`, `EnhanceRequest`, `EditImageResponse` em `api/chat/schemas/chat.py` conforme seção 6.1 do `spec.md`. Usar `Literal[...]` para enums.
- **Arquivos**:
  - Modificar: `api/chat/schemas/chat.py`
- **Depende de**: nenhuma
- **Critérios de aceite**: CA-21 a CA-26 (validação)
- **Estimativa**: P
- **Status**: ⬜

#### TASK-002: Criar tool `edit_tools.py` com 3 funções mock
- **Fase**: 1
- **Escopo**: Criar `api/chat/tools/edit_tools.py` com 3 funções: `inpaint_image`, `outpaint_image`, `enhance_image`. Todas mockadas — retornam placeholder URL e dimensões calculadas (outpaint cresce na direção, enhance multiplica). Comentário `# TODO: Replace mock with real Vertex AI`.
- **Arquivos**:
  - Criar: `api/chat/tools/edit_tools.py`
- **Depende de**: TASK-001
- **Critérios de aceite**: CA-21, CA-23
- **Estimativa**: M
- **Status**: ⬜

#### TASK-003: Adicionar `Pillow` em pyproject.toml (se ausente)
- **Fase**: 1
- **Escopo**: Verificar se `Pillow` está em `api/pyproject.toml`. Se não, adicionar. `uv lock` para fixar versão.
- **Arquivos**:
  - Modificar: `api/pyproject.toml`
- **Depende de**: nenhuma
- **Critérios de aceite**: (precondição para TASK-004)
- **Estimativa**: P
- **Status**: ⬜

#### TASK-004: Helpers de validação de imagem com PIL
- **Fase**: 1
- **Escopo**: Criar `api/chat/tools/image_validation.py` (ou função dentro de `edit_tools.py`) que decode base64 → PIL Image, valida formato (PNG/JPG/WebP), tamanho (≤ 20MB), retorna dimensões. Levanta exceção tipada para handler de endpoint mapear para HTTP 413/415.
- **Arquivos**:
  - Criar: `api/chat/tools/image_validation.py`
- **Depende de**: TASK-003
- **Critérios de aceite**: CA-22, CA-25, CA-26
- **Estimativa**: M
- **Status**: ⬜

#### TASK-005: Adicionar 3 endpoints no router
- **Fase**: 1
- **Escopo**: Estender `api/chat/router.py` com `POST /chat/edit-image`, `POST /chat/outpaint-image`, `POST /chat/enhance-image`. Cada um valida com PIL (TASK-004), chama tool, mapeia exceções para HTTPException. Regra extra do enhance: rejeitar 422 se source > 2048px maior dim E scale=4.
- **Arquivos**:
  - Modificar: `api/chat/router.py`
- **Depende de**: TASK-002, TASK-004
- **Critérios de aceite**: CA-21, CA-22, CA-23, CA-24
- **Estimativa**: M
- **Status**: ⬜

#### TASK-006: Registrar 3 tools no VisualCreator
- **Fase**: 1
- **Escopo**: Adicionar `inpaint_image`, `outpaint_image`, `enhance_image` à lista de tools do `VisualCreator` em `api/chat/agents/visual_creator.py`. Permite que o chat agent dispare edits via ReAct quando usuário pedir.
- **Arquivos**:
  - Modificar: `api/chat/agents/visual_creator.py`
- **Depende de**: TASK-002
- **Critérios de aceite**: (cobre integração SPEC-001)
- **Estimativa**: P
- **Status**: ⬜

#### TASK-007: Tests pytest dos 3 endpoints
- **Fase**: 1
- **Escopo**: Criar `api/tests/test_edit_endpoints.py` cobrindo: (1) inpaint happy path, (2) inpaint com source > 20MB → 413, (3) inpaint com formato TIFF → 415, (4) outpaint happy path, (5) enhance happy path, (6) enhance scale=4 com source > 2048 → 422, (7) inpaint com prompt vazio + intent=insertion → 400, (8) inpaint com mask vazio → 400.
- **Arquivos**:
  - Criar: `api/tests/test_edit_endpoints.py`
- **Depende de**: TASK-005
- **Critérios de aceite**: CA-21 a CA-26
- **Estimativa**: G
- **Status**: ⬜

### Fase 2 — Frontend Foundation

#### TASK-008: Estender `lib/api.ts` com 3 funções
- **Fase**: 2
- **Escopo**: Adicionar tipos `InpaintParams`, `OutpaintParams`, `EnhanceParams`, `EditImageResponse` e funções `editImage()`, `outpaintImage()`, `enhanceImage()`. Padrão: `getHeaders()`, `getApiUrl()`, fetch POST, parse JSON, throw em !ok. Timeout via `AbortController` 60s.
- **Arquivos**:
  - Modificar: `lib/api.ts`
- **Depende de**: TASK-001
- **Critérios de aceite**: precondição para CA-06, CA-10, CA-12
- **Estimativa**: M
- **Status**: ⬜

#### TASK-009: Criar `lib/mask-utils.ts`
- **Fase**: 2
- **Escopo**: Implementar `extractMaskAsBase64(canvas, w, h)` (renderiza camada "mask" do Fabric em canvas off-screen branco/preto e retorna base64), `maskHasContent(canvas, minPixels=10)`, `clearMask(canvas)`. Importa tipos Fabric mas NÃO importa Fabric runtime (para não vazar bundle).
- **Arquivos**:
  - Criar: `lib/mask-utils.ts`
- **Depende de**: nenhuma
- **Critérios de aceite**: CA-07
- **Estimativa**: M
- **Status**: ⬜

#### TASK-010: Hook `useCanvasHistory`
- **Fase**: 2
- **Escopo**: Criar `hooks/useCanvasHistory.ts` conforme pseudocódigo seção 4.2 do `design.md`. Stack max 20. `push()`, `undo()`, `redo()`, `canUndo`, `canRedo`. Drop forward history quando `push` após `undo`.
- **Arquivos**:
  - Criar: `hooks/useCanvasHistory.ts`
- **Depende de**: nenhuma
- **Critérios de aceite**: CA-15, CA-16
- **Estimativa**: M
- **Status**: ⬜

#### TASK-011: Testes unitários `useCanvasHistory` + `mask-utils`
- **Fase**: 2
- **Escopo**: Vitest. `useCanvasHistory`: push 3x → undo 3x → cursor=0; push após undo dropa forward; max 20 enforced. `mask-utils`: `maskHasContent` retorna false em canvas vazio.
- **Arquivos**:
  - Criar: `hooks/useCanvasHistory.test.ts`
  - Criar: `lib/mask-utils.test.ts`
- **Depende de**: TASK-009, TASK-010
- **Critérios de aceite**: CA-15, CA-16
- **Estimativa**: M
- **Status**: ⬜

### Fase 3 — Fabric Setup + EditorCanvas

#### TASK-012: Adicionar Fabric.js como dependência
- **Fase**: 3
- **Escopo**: `npm install fabric@^6` no frontend. Atualizar `package.json` + `package-lock.json`. Confirmar que TypeScript types vêm via `fabric/dist/fabric` ou pacote `@types/fabric` se necessário (Fabric v6 traz types nativos).
- **Arquivos**:
  - Modificar: `package.json`
  - Modificar: `package-lock.json`
- **Depende de**: nenhuma
- **Critérios de aceite**: precondição para TASK-013
- **Estimativa**: P
- **Status**: ⬜

#### TASK-013: Componente `EditorCanvas`
- **Fase**: 3
- **Escopo**: Criar `components/editor/EditorCanvas.tsx`. `'use client'`. Inicializa Fabric canvas no `useEffect`, expõe ref-based API: `loadImage(url)`, `setMode('inpaint'|'outpaint'|'enhance'|'view')`, `setBrush({size,shape,eraser})`, `getCanvas()`, `clear()`. Layer "image" para source, layer "mask" para drawing (rosa #ff00ff @ 40%). Cleanup obrigatório no unmount.
- **Arquivos**:
  - Criar: `components/editor/EditorCanvas.tsx`
- **Depende de**: TASK-012
- **Critérios de aceite**: CA-01, CA-09 (eraser)
- **Estimativa**: G
- **Status**: ⬜

#### TASK-014: Zoom + Pan no canvas
- **Fase**: 3
- **Escopo**: Adicionar handlers no `EditorCanvas`: wheel = zoom no ponto cursor (range 10%-800%), spacebar+drag = pan. Função `fitToScreen()` exposta no ref.
- **Arquivos**:
  - Modificar: `components/editor/EditorCanvas.tsx`
- **Depende de**: TASK-013
- **Critérios de aceite**: CA-17, CA-18
- **Estimativa**: M
- **Status**: ⬜

### Fase 4 — Toolbar + Mode Panels

#### TASK-015: `EditorToolbar` lateral
- **Fase**: 4
- **Escopo**: Criar `components/editor/EditorToolbar.tsx` (vertical, ~60px wide). Botões: 3 modes (inpaint/outpaint/enhance), undo, redo, fit, save (abre modal). Inline styles + CSS vars. Tooltips com atalhos (Cmd+Z etc).
- **Arquivos**:
  - Criar: `components/editor/EditorToolbar.tsx`
- **Depende de**: nenhuma (UI puro)
- **Critérios de aceite**: CA-16, CA-18
- **Estimativa**: M
- **Status**: ⬜

#### TASK-016: `BrushSettings` (modo inpaint)
- **Fase**: 4
- **Escopo**: Criar `components/editor/BrushSettings.tsx`. Slider size 5-200, toggle shape (círculo/quadrado), toggle eraser, textarea prompt, toggle intent (removal/insertion), botão "Aplicar Inpaint" (disabled se mask vazia ou loading ou (intent=insertion E prompt vazio)).
- **Arquivos**:
  - Criar: `components/editor/BrushSettings.tsx`
- **Depende de**: nenhuma
- **Critérios de aceite**: CA-06, CA-07, CA-08, CA-09
- **Estimativa**: M
- **Status**: ⬜

#### TASK-017: `OutpaintControls`
- **Fase**: 4
- **Escopo**: Criar `components/editor/OutpaintControls.tsx`. 4 botões direção (left/right/top/bottom, default right), 4 botões amount (25/50/75/100, default 50), textarea prompt opcional, botão "Aplicar Outpaint". Quando direção+amount selecionados, emitir evento para canvas mostrar borda tracejada de preview.
- **Arquivos**:
  - Criar: `components/editor/OutpaintControls.tsx`
- **Depende de**: nenhuma
- **Critérios de aceite**: CA-10, CA-11
- **Estimativa**: M
- **Status**: ⬜

#### TASK-018: `EnhanceControls`
- **Fase**: 4
- **Escopo**: Criar `components/editor/EnhanceControls.tsx`. Toggle x2/x4 (default x2), label dimensão preview ("1024×1024 → 2048×2048"), botão "Aplicar Enhance". Bloquear x4 se source > 2048px com mensagem inline.
- **Arquivos**:
  - Criar: `components/editor/EnhanceControls.tsx`
- **Depende de**: nenhuma
- **Critérios de aceite**: CA-12, CA-13, CA-14
- **Estimativa**: M
- **Status**: ⬜

#### TASK-019: `SaveOptionsModal`
- **Fase**: 4
- **Escopo**: Criar `components/editor/SaveOptionsModal.tsx`. Toggle PNG/JPG; se JPG, slider quality (0.6/0.8/0.95). Botão "Baixar" gera blob via `canvas.toDataURL` + anchor download com nome `sunos-edit-{timestamp}.{ext}`.
- **Arquivos**:
  - Criar: `components/editor/SaveOptionsModal.tsx`
- **Depende de**: nenhuma
- **Critérios de aceite**: CA-19, CA-20
- **Estimativa**: M
- **Status**: ⬜

### Fase 5 — Integração na página

#### TASK-020: `app/editor/page.tsx` — orquestração completa
- **Fase**: 5
- **Escopo**: Criar `app/editor/page.tsx`. `'use client'` + `dynamic` import de `EditorCanvas` (ssr:false). Layout: header (logo + back + filename) + toolbar + canvas + right panel (banner offline + ModeContextPanel que renderiza um dos 3 controls). Lógica: ler `?src` → loadImage no canvas, ou empty state com botão upload (validação 20MB / formato). Atalhos Cmd+Z / Cmd+Shift+Z. Wire de cada "Aplicar X" → chama API → atualiza canvas → push snapshot. Banner backend offline desabilita "Aplicar X" mas mantém canvas usável.
- **Arquivos**:
  - Criar: `app/editor/page.tsx`
- **Depende de**: TASK-008, TASK-009, TASK-010, TASK-014, TASK-015, TASK-016, TASK-017, TASK-018, TASK-019
- **Critérios de aceite**: CA-01, CA-02, CA-03, CA-04, CA-05, CA-15
- **Estimativa**: G
- **Status**: ⬜

#### TASK-021: ProcessingOverlay + tratamento de erros
- **Fase**: 5
- **Escopo**: Adicionar overlay durante "Aplicar X" (Loader2 + mensagem). Toast handlers para cada erro 4xx/5xx. Timeout 60s via AbortController.
- **Arquivos**:
  - Modificar: `app/editor/page.tsx`
- **Depende de**: TASK-020
- **Critérios de aceite**: precondição para retry / UX completa
- **Estimativa**: M
- **Status**: ⬜

### Fase 6 — Integração com ImageGenPanel

#### TASK-022: Botão "Editar" no `ImageGenPanel`
- **Fase**: 6
- **Escopo**: Em `components/chat/ImageGenPanel.tsx`, próximo ao botão Download, adicionar botão "Editar" (icon: `Pencil`) que chama `router.push('/editor?src=' + encodeURIComponent(imageUrl))`. Usar `useRouter` de `next/navigation`.
- **Arquivos**:
  - Modificar: `components/chat/ImageGenPanel.tsx`
- **Depende de**: TASK-020
- **Critérios de aceite**: CA-01 (deep link funciona)
- **Estimativa**: P
- **Status**: ⬜

### Fase 7 — Bundle Audit + Doc

#### TASK-023: Bundle analyze + verificação Fabric isolado
- **Fase**: 7
- **Escopo**: Rodar `next build` com analyze. Confirmar que Fabric chunk só aparece em `/editor`. Documentar tamanho do chunk no PR description. Se vazar, debugar import indireto.
- **Arquivos**:
  - (sem mudança de arquivo, apenas validação)
- **Depende de**: TASK-022
- **Critérios de aceite**: CA-27, CA-28
- **Estimativa**: P
- **Status**: ⬜

#### TASK-024: Atualizar ROADMAP, CLAUDE.md, frontmatter
- **Fase**: 7
- **Escopo**: `docs/ROADMAP.md` Phase 16: marcar "Image editor com inpainting/outpainting" e "Image enhance (upscale x2/x4)" como `[x]`. `CLAUDE.md`: atualizar nota sobre dependências (Fabric agora aprovada). `spec.md` frontmatter: `status: implementada` + lista `arquivos-relacionados`.
- **Arquivos**:
  - Modificar: `docs/ROADMAP.md`
  - Modificar: `CLAUDE.md`
  - Modificar: `docs/specs/large/image-editor/spec.md`
- **Depende de**: TASK-023
- **Critérios de aceite**: (governança SDD)
- **Estimativa**: P
- **Status**: ⬜

### Fase 8 — Vertex AI Real (opcional v1)

#### TASK-025: Plugar Vertex AI Imagen edit/upscaler
- **Fase**: 8
- **Escopo**: Em `api/chat/tools/edit_tools.py`, substituir mocks por chamadas reais a `vertexai.preview.vision_models.ImageGenerationModel`. Para inpaint: usar `edit_image(...)` com `mask` parameter. Para outpaint: similar com `mask` derivado da direção/amount. Para enhance: usar upscaler model. Upload do resultado para `gs://sunos-edit-output/{user_id}/{uuid}/result.png`. Retornar signed URL v4. Configurar `GCP_PROJECT_ID`, `VERTEX_LOCATION`, `GCS_EDIT_OUTPUT_BUCKET` em `.env.example`.
- **Arquivos**:
  - Modificar: `api/chat/tools/edit_tools.py`
  - Modificar: `api/.env.example`
- **Depende de**: TASK-024 + GCP setup
- **Critérios de aceite**: smoke E2E real para 3 modos
- **Estimativa**: G
- **Status**: ⬜

<!-- REVIEW: As tarefas são implementáveis e testáveis isoladamente? -->

## Prompt para Agente (template)

Cada task pode ser enviada individualmente ao agente:

> Implemente TASK-XXX: <título>.
>
> **Spec**: `docs/specs/large/image-editor/spec.md`
> **Design**: `docs/specs/large/image-editor/design.md`
> **Constitution**: `docs/specs/large/image-editor/constitution.md` (princípios obrigatórios — leia antes)
> **Plan**: `docs/specs/large/image-editor/plan.md`
>
> **Escopo desta task**: <colar do tasks.md>
> **Arquivos**: <colar do tasks.md>
> **Critérios de aceite a verificar**: <colar IDs do tasks.md>
>
> **Restrições da constitution a respeitar**:
> - Inline styles + CSS vars (`--void`, `--sun`, `--nebula`, etc), não Tailwind
> - Lucide icons size=14 strokeWidth=1.5 (toolbar pode usar 18 com bom motivo)
> - Fabric.js APENAS importado dentro de `EditorCanvas.tsx` (lazy load via `next/dynamic`)
> - Operações síncronas (sem polling) — diferente de SPEC-002 (vídeo)
> - Mock-first no backend
> - Snapshots em memória (não localStorage)
> - Mesmo padrão visual do `components/chat/ImageGenPanel.tsx` para toolbar/banners
>
> Após implementar, rode `npx tsc --noEmit` (frontend) e/ou `pytest` (backend) e reporte resultado.
