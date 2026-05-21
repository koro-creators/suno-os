---
spec-id: SPEC-008
slug: image-editor
artefato: design
atualizada: 2026-05-15
status: rascunho
versao: 1.0
---

# Design — Image Editor

## 1. Arquitetura

### 1.1 Visão de Contexto (C4 Nível 1)

```
┌─────────────┐         ┌────────────────┐         ┌──────────────┐
│   Usuário   │ ──HTTPS │  sunOS Frontend│ ──HTTPS │  sunos-api   │
│  (Criativo) │         │  (Next.js 14)  │         │  (FastAPI)   │
└─────────────┘         └────────────────┘         └──────┬───────┘
                                                          │
                                                          │ Vertex AI SDK
                                                          ▼
                                                 ┌────────────────┐
                                                 │ Vertex AI      │
                                                 │ Imagen 3 Edit  │
                                                 │ + Upscaler     │
                                                 └────────────────┘
```

### 1.2 Visão de Containers (C4 Nível 2)

```
┌───────────────────────────────────────────────────────────────────┐
│ Frontend: sunOS                                                   │
│                                                                   │
│  app/editor/page.tsx ('use client')                               │
│      │                                                            │
│      ▼                                                            │
│  components/editor/                                               │
│      ├── EditorCanvas.tsx          (Fabric.js wrapper)            │
│      ├── EditorToolbar.tsx         (mode + tools)                 │
│      ├── BrushSettings.tsx         (size, shape, eraser)          │
│      ├── OutpaintControls.tsx      (dir + amount)                 │
│      ├── EnhanceControls.tsx       (scale x2/x4)                  │
│      └── SaveOptionsModal.tsx      (format + quality)             │
│                                                                   │
│  lib/api.ts                                                       │
│      editImage(), outpaintImage(), enhanceImage()                 │
│  lib/mask-utils.ts                                                │
│      extractMaskAsBase64(), maskHasContent(), clearMask()         │
│  hooks/useCanvasHistory.ts (snapshots stack)                      │
└────────────────────────────┬──────────────────────────────────────┘
                             │ HTTPS / JSON (base64 payload)
                             │
┌────────────────────────────▼──────────────────────────────────────┐
│ Backend: sunos-api                                                │
│                                                                   │
│  api/chat/router.py                                               │
│      ├── POST /chat/edit-image       ──┐                          │
│      ├── POST /chat/outpaint-image   ──┼──► tools/edit_tools.py   │
│      └── POST /chat/enhance-image    ──┘                          │
│                                              │                    │
│  api/chat/schemas/chat.py                    │                    │
│      InpaintRequest / OutpaintRequest /      │                    │
│      EnhanceRequest / EditImageResponse      │                    │
│                                              ▼                    │
│  api/chat/agents/visual_creator.py ──► inpaint_image,             │
│                                         outpaint_image,           │
│                                         enhance_image (3 tools)   │
│                                              │                    │
│                                              ▼                    │
│                                      ┌──────────────────┐         │
│                                      │ Vertex AI Imagen │         │
│                                      │  Edit / Upscaler │         │
│                                      └──────────────────┘         │
└───────────────────────────────────────────────────────────────────┘
```

### 1.3 Visão de Componentes (C4 Nível 3)

**Página `/editor` — composição**:

```
EditorPage
├── EditorHeader (logo + back button + filename)
├── EditorMain (flex layout)
│   ├── EditorToolbar (left, ~60px wide)
│   │   ├── ModeButton (inpaint / outpaint / enhance)
│   │   ├── UndoButton / RedoButton
│   │   ├── ZoomFitButton
│   │   └── SaveButton (abre SaveOptionsModal)
│   │
│   ├── EditorCanvas (center, fills space)
│   │   └── <canvas /> mounted by Fabric
│   │
│   └── EditorRightPanel (right, ~300px wide)
│       ├── BackendUnavailableBanner (condicional)
│       ├── ModeContextPanel (renderiza um dos 3 abaixo)
│       │   ├── BrushSettings (mode=inpaint)
│       │   │   ├── Brush size slider
│       │   │   ├── Brush shape toggle
│       │   │   ├── Eraser toggle
│       │   │   ├── Prompt textarea
│       │   │   ├── Intent toggle (removal | insertion)
│       │   │   └── ApplyButton "Aplicar Inpaint"
│       │   │
│       │   ├── OutpaintControls (mode=outpaint)
│       │   │   ├── Direction picker (4 botões)
│       │   │   ├── Amount selector (25/50/75/100)
│       │   │   ├── Prompt textarea (opcional)
│       │   │   └── ApplyButton "Aplicar Outpaint"
│       │   │
│       │   └── EnhanceControls (mode=enhance)
│       │       ├── Scale toggle (x2 | x4)
│       │       ├── Dimension preview label
│       │       └── ApplyButton "Aplicar Enhance"
│       │
│       └── ProcessingOverlay (condicional, mode=loading)
└── SaveOptionsModal (condicional)
```

**Backend — fluxo do tool**:

```
router.py:edit_image_endpoint
    ↓ valida InpaintRequest (PIL valida formato + tamanho)
    ↓
tools/edit_tools.py:inpaint_image
    ↓ decode base64 → PIL Image (source + mask)
    ↓ chama Vertex AI Imagen edit model (mock retorna placeholder)
    ↓ recebe bytes do resultado
    ↓ upload → GCS bucket
    ↓ gera signed URL v4 (7d)
    ↓ retorna EditImageResponse
```

(Análogo para `outpaint_image` e `enhance_image`.)

## 2. Modelo de Dados

### 2.1 Entidades

Esta feature é **stateless no backend** — não persiste no PostgreSQL. Cada request é independente. O resultado é guardado em GCS apenas pelo TTL da signed URL (7 dias).

### 2.2 GCS Bucket Layout

```
gs://sunos-edit-output/
├── {user_id}/{operation_uuid}/result.png
└── {user_id}/{operation_uuid}/result.jpg

(buckets `staging` não necessários — payload é base64 inline na request HTTP)
```

URLs retornadas: signed v4, validade 7 dias.

### 2.3 Snapshots Frontend (em memória)

```typescript
// hooks/useCanvasHistory.ts
interface CanvasSnapshot {
  id: string;             // uuid
  imageDataUrl: string;   // PNG dataURL do canvas inteiro (sem máscara)
  width: number;
  height: number;
  timestamp: number;
}

// State em memória, max 20
const snapshots: CanvasSnapshot[];
const cursor: number;     // index do snapshot atual
```

## 3. Decisões Técnicas (ADRs)

### ADR-01: Fabric.js como dep nova (justificada)

- **Status**: Aceita
- **Contexto**: Editor precisa de canvas com drawing, mask layers, undo/redo, zoom/pan. Construir do zero exigiria 800-1200 linhas de código de canvas + 200 de utilities. CLAUDE.md proíbe deps novas sem justificativa.
- **Decisão**: Adotar `fabric@^6.x` — única dep nova no frontend desta spec.
- **Alternativas consideradas**:
  - **Konva**: peso similar (~250KB), API menos amigável para mask layer
  - **react-konva**: wrapper React, mas mesmo overhead
  - **Canvas API cru**: viável, custo de manutenção alto
  - **excalidraw**: focado em diagramas, não em raster editing
- **Consequências**:
  - ✅ Reduz tempo de implementação em ~5 dias
  - ✅ Suporta tudo que precisamos out-of-the-box
  - ⚠️ Bundle +250KB. Mitigação: lazy load via `next/dynamic` com `ssr: false`
  - ⚠️ Lock-in em Fabric. Mitigação: `EditorCanvas` é o único arquivo que importa Fabric — refatorar é local

### ADR-02: Página dedicada `/editor`, não painel embutido no chat

- **Status**: Aceita
- **Contexto**: Editor exige espaço — toolbar + canvas + painel direito. Painel direito do chat é estreito (300-400px).
- **Decisão**: Rota standalone `app/editor/page.tsx`. Acesso via botão "Editar" no `ImageGenPanel` (passa imagem via `?src=`).
- **Alternativas consideradas**:
  - Modal fullscreen sobre o chat: complica navegação, atalhos, deep-link
  - Painel direito redimensionável: UX confusa em telas < 1440px
- **Consequências**:
  - ✅ Espaço de tela suficiente
  - ✅ URL deep-link (`/editor?src=...`) funciona como bookmark
  - ⚠️ Saída do contexto do chat — usuário usa back button para voltar

### ADR-03: Operações síncronas (sem polling) — diferente do vídeo

- **Status**: Aceita
- **Contexto**: Inpaint/outpaint/upscale Vertex AI completam em 5-30s. Geração de vídeo é 60-300s.
- **Decisão**: 3 endpoints retornam resultado direto na response HTTP (síncrono), com timeout client de 60s. Sem polling.
- **Alternativas consideradas**: Polling como SPEC-002. Rejeitado: overhead desnecessário para latências curtas.
- **Consequências**:
  - ✅ Código FE/BE muito mais simples
  - ✅ UX direta: spinner durante request, resultado aparece
  - ⚠️ Cloud Run timeout default = 5 min, suficiente. Configurar timeout específico se necessário

### ADR-04: Payload base64 inline (sem upload prévio para GCS)

- **Status**: Aceita
- **Contexto**: Source image vai do client para o backend. Mask também (no inpaint).
- **Decisão**: Enviar inline base64 no JSON body. Tamanho médio: ~3-5MB para 1024×1024 PNG (após base64 inflation).
- **Alternativas consideradas**:
  - Upload para GCS staging primeiro, enviar URL: 2 round-trips, mais complexo
  - Multipart upload: mistura JSON + binário, mais código
- **Consequências**:
  - ✅ Simples, 1 request
  - ⚠️ Body HTTP até ~10MB para inpaint (source + mask + prompt)
  - ⚠️ Limite max 20MB no body — backend valida e rejeita 413

### ADR-05: Máscara como PNG branco/preto (binário)

- **Status**: Aceita
- **Contexto**: Como representar a máscara para o Vertex AI Imagen edit?
- **Decisão**: PNG mesmo tamanho do source, **branco = editar, preto = manter**. Convenção do Imagen.
- **Alternativas consideradas**:
  - JSON com coordenadas de polígonos: complexo, perde fidelidade do brush
  - Alpha channel: confuso, Vertex prefere binário
- **Consequências**:
  - ✅ Compatível direto com Vertex AI Imagen edit
  - ✅ Helper `extractMaskAsBase64` faz a conversão Fabric → PNG binário

### ADR-06: Sem persistência de histórico no backend

- **Status**: Aceita
- **Contexto**: SPEC-002 também é stateless. Esta segue o mesmo princípio.
- **Decisão**: Cada edit é stateless. Snapshots são in-memory no client. Refresh perde.
- **Alternativas consideradas**: Tabela `image_edits` com versionamento. Rejeitado: prematuro.
- **Consequências**:
  - ✅ Menos código, menos migration
  - ⚠️ Documentar que refresh perde histórico
  - 🔮 Spec futura pode integrar com Biblioteca para persistir versões

<!-- REVIEW: A arquitetura faz sentido para as restrições do projeto? -->

## 4. Diagramas de Fluxo

### 4.1 Sequência: Inpaint Completo

```
User    Browser   /editor (FE)    sunos-api    Vertex Imagen   GCS
 │         │           │              │              │           │
 │--upload-►           │              │              │           │
 │         │--load img-►              │              │           │
 │         │           │ canvas: image layer                     │
 │         │           │                                          │
 │--paint--►           │ canvas: mask layer (rosa)               │
 │--prompt-►           │                                          │
 │--apply-►│           │                                          │
 │         │--extract mask + base64 source--                     │
 │         │           │--POST /chat/edit-image---►              │
 │         │           │              │--Imagen.edit------------►│
 │         │           │              │              │ (5-30s)   │
 │         │           │              │◄--bytes-------------------│
 │         │           │              │--upload to GCS-----------►│
 │         │           │              │◄--signed_url--------------│
 │         │           │◄--{result_url, dims}--                  │
 │         │--load result--                                       │
 │         │           │ canvas: substitui image layer           │
 │         │           │ snapshot push                           │
 │         │           │ mask cleared                            │
 │◄--ver---│           │                                          │
```

### 4.2 Lógica de `useCanvasHistory` (pseudocódigo)

```typescript
function useCanvasHistory(canvas: FabricCanvas | null) {
  const [snapshots, setSnapshots] = useState<CanvasSnapshot[]>([]);
  const [cursor, setCursor] = useState(-1);

  const push = useCallback(() => {
    if (!canvas) return;
    const dataUrl = canvas.toDataURL({ format: 'png' });
    const snap: CanvasSnapshot = { id: uuid(), imageDataUrl: dataUrl, width: canvas.getWidth(), height: canvas.getHeight(), timestamp: Date.now() };
    // Drop forward history if user pushed after undo
    const newSnapshots = [...snapshots.slice(0, cursor + 1), snap].slice(-20);
    setSnapshots(newSnapshots);
    setCursor(newSnapshots.length - 1);
  }, [canvas, snapshots, cursor]);

  const undo = useCallback(() => {
    if (cursor <= 0) return;
    const target = snapshots[cursor - 1];
    loadSnapshotIntoCanvas(canvas!, target);
    setCursor(cursor - 1);
  }, [canvas, snapshots, cursor]);

  const redo = useCallback(() => {
    if (cursor >= snapshots.length - 1) return;
    const target = snapshots[cursor + 1];
    loadSnapshotIntoCanvas(canvas!, target);
    setCursor(cursor + 1);
  }, [canvas, snapshots, cursor]);

  return { push, undo, redo, canUndo: cursor > 0, canRedo: cursor < snapshots.length - 1 };
}
```

### 4.3 Lazy Load do Fabric

```typescript
// app/editor/page.tsx
'use client';
import dynamic from 'next/dynamic';

const EditorCanvas = dynamic(() => import('@/components/editor/EditorCanvas'), {
  ssr: false,
  loading: () => <div>Carregando editor...</div>,
});

export default function EditorPage() {
  return <EditorLayout><EditorCanvas /></EditorLayout>;
}
```

`fabric` só é importado dentro de `EditorCanvas.tsx`, garantindo que webpack faça split do chunk.

## 5. Estratégia de Testes

| Nível | Escopo | Framework | Cobertura alvo |
|-------|--------|-----------|----------------|
| Unitário (FE) | `useCanvasHistory` (push/undo/redo limites), `mask-utils` (extract/clear/hasContent) | Vitest | 100% das branches |
| Unitário (BE) | Validação Pydantic, mock dos 3 tools | pytest | Schemas + fluxo mock |
| Integração (BE) | 3 endpoints com tool mockado, validações de tamanho/formato via PIL | pytest + httpx | Happy path + 6 erros |
| Manual / Smoke | Página `/editor` end-to-end com mock | — | Cada modo aplica e mostra placeholder |
| Bundle audit | Confirmar que Fabric não vaza para outras rotas | `next build` + `--analyze` | Chunk separado para `/editor` |
| E2E (futuro) | Integração real com Vertex AI | Playwright | Pós-pluggar Vertex |

## 6. Observabilidade

- **Tracing (MLflow)**: cada chamada aos 3 tools cria run com tags `user_id`, `operation` (inpaint/outpaint/enhance), `model`, `intent`, `direction`, `scale`, `latency_total`, `source_dims`, `result_dims`.
- **Logs estruturados**: backend loga JSON com `operation_uuid`, `status`, `error_message`.
- **Métricas (futuro)**: taxa de sucesso por operação, P95 latência, distribuição de scale factors.

## 7. Migração / Compatibilidade

Aditiva. Não toca:
- Endpoints existentes
- Schemas existentes
- Sistema solar / Skills / Biblioteca / Clientes / Workflows
- Auth / Firebase config

Adições neutras ao bundle das outras rotas (Fabric é lazy-loaded só em `/editor`).
