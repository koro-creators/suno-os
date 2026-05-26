---
spec-id: SPEC-008
slug: image-editor
artefato: plan
atualizada: 2026-05-15
status: rascunho
versao: 1.0
---

# Plano de Implementação — Image Editor

## 1. Stack Tecnológica

| Camada | Tecnologia | Versão | Justificativa |
|--------|-----------|--------|---------------|
| Frontend Page | Next.js App Router | 14 | Padrão sunOS |
| Canvas | **Fabric.js** | ^6.x | **Nova dep — ADR-01** |
| HTTP client | fetch nativo | — | Padrão `lib/api.ts` |
| Icons | lucide-react | 0.468 | Padrão sunOS |
| Backend API | FastAPI | 0.115+ | Padrão sunos-api |
| Validação | Pydantic v2 | 2.x | Padrão sunos-api |
| Vertex AI SDK | `google-cloud-aiplatform` | latest | Já aprovado SPEC-001 |
| Image processing | Pillow (PIL) | latest | Validação formato/tamanho |
| Storage | GCS | — | Sign URLs v4 |
| Tracing | MLflow | já em uso | Padrão sunos-api |

## 2. Fases de Implementação

### Fase 1: Backend Foundation (Estimativa: 2 dias)

- **Objetivo**: Schemas + 3 tools mockados + 3 endpoints + validação PIL
- **Pré-requisitos**: SPEC-001 implementada
- **Entregáveis**:
  - `api/chat/schemas/chat.py` estendido com `InpaintRequest`, `OutpaintRequest`, `EnhanceRequest`, `EditImageResponse`
  - `api/chat/tools/edit_tools.py` com `inpaint_image`, `outpaint_image`, `enhance_image` (mock retornando placeholder)
  - `api/chat/router.py` estendido com 3 endpoints
  - Validação PIL: formato (PNG/JPG/WebP), tamanho (≤ 20MB), dimensão para regra x4
  - `api/tests/test_edit_endpoints.py` (happy path + 6 erros)
  - `Pillow` adicionado em `pyproject.toml` se ausente

### Fase 2: Frontend Foundation — API + Helpers (Estimativa: 1 dia)

- **Objetivo**: HTTP client + helpers de máscara + hook de histórico
- **Pré-requisitos**: Fase 1
- **Entregáveis**:
  - `lib/api.ts` estendido: `editImage()`, `outpaintImage()`, `enhanceImage()` + tipos
  - `lib/mask-utils.ts` com `extractMaskAsBase64`, `maskHasContent`, `clearMask`
  - `hooks/useCanvasHistory.ts`
  - Teste unitário do hook (push/undo/redo)

### Fase 3: Fabric Setup + EditorCanvas (Estimativa: 2 dias)

- **Objetivo**: Componente canvas funcionando isoladamente — carrega imagem, suporta drawing, zoom/pan, lazy-loaded
- **Pré-requisitos**: Fase 2
- **Entregáveis**:
  - `npm install fabric@^6.x` (única dep nova)
  - `components/editor/EditorCanvas.tsx` (Fabric wrapper, ref-based API: `loadImage`, `enableMaskMode`, `disableMaskMode`, `getCanvas`)
  - Suporta zoom (wheel) + pan (spacebar+drag) + fit
  - Layer "image" (source) + Layer "mask" (drawing)
  - Cleanup correto no unmount
  - Standalone testável: criar página de teste `/editor-test` que carrega canvas e permite drawing

### Fase 4: Toolbar + Mode Panels (Estimativa: 2 dias)

- **Objetivo**: 3 painéis contextuais + toolbar funcionando
- **Pré-requisitos**: Fase 3
- **Entregáveis**:
  - `components/editor/EditorToolbar.tsx` (mode buttons + undo/redo + zoom-fit + save)
  - `components/editor/BrushSettings.tsx` (size, shape, eraser, prompt, intent, apply)
  - `components/editor/OutpaintControls.tsx` (direction, amount, prompt, apply)
  - `components/editor/EnhanceControls.tsx` (scale, dimension preview, apply)
  - `components/editor/SaveOptionsModal.tsx` (format, quality)
  - Estilos seguindo CSS vars + inline styles (padrão sunOS)

### Fase 5: Integração — `app/editor/page.tsx` (Estimativa: 2 dias)

- **Objetivo**: Página completa orquestrando tudo, com 3 fluxos funcionando contra mock
- **Pré-requisitos**: Fase 4
- **Entregáveis**:
  - `app/editor/page.tsx` com lazy-load do `EditorCanvas`
  - Carregamento via `?src=URL` ou upload local
  - Validação 20MB / formato PNG/JPG/WebP
  - Atalhos Cmd+Z / Cmd+Shift+Z
  - Estados: empty / loaded / processing / error
  - Banner backend offline
  - Smoke test manual: 3 fluxos completos com placeholder

### Fase 6: Integração com `ImageGenPanel` (Estimativa: 0.5 dia)

- **Objetivo**: Botão "Editar" no `ImageGenPanel` abre `/editor?src=<url>`
- **Pré-requisitos**: Fase 5
- **Entregáveis**:
  - Botão "Editar" no `ImageGenPanel` próximo ao Download
  - `router.push('/editor?src=' + encodeURIComponent(url))`
  - Smoke: gerar imagem → clicar Editar → editor abre com imagem carregada

### Fase 7: Bundle Audit + ROADMAP update (Estimativa: 0.5 dia)

- **Objetivo**: Confirmar que Fabric NÃO vaza para outras rotas
- **Pré-requisitos**: Fase 6
- **Entregáveis**:
  - `next build` com analyze; verificar Fabric chunk separado
  - Doc no PR description com tamanho do chunk
  - `docs/ROADMAP.md` Phase 16 itens marcados
  - `spec.md` frontmatter atualizado (`status: implementada`)

### Fase 8: Vertex AI Real (Estimativa: 3 dias) — opcional na v1

- **Objetivo**: Substituir mocks por chamadas reais ao Vertex AI Imagen
- **Pré-requisitos**: Fases 1-7 + GCP Service Account + GCS bucket
- **Entregáveis**:
  - `api/chat/tools/edit_tools.py` com `# TODO: Replace mock` removido
  - Configuração `GCP_PROJECT_ID`, `VERTEX_LOCATION`, `GCS_EDIT_OUTPUT_BUCKET` em `api/.env.example`
  - Smoke E2E: inpaint real funciona; outpaint real; enhance real
  - MLflow tracing capturando latência

## 3. Sequência e Dependências

```
Fase 1 (BE) ──► Fase 2 (FE foundation) ──► Fase 3 (Canvas) ──► Fase 4 (UI panels)
                                                                       │
                                                                       ▼
                                                                Fase 5 (page integration)
                                                                       │
                                                                       ▼
                                                                Fase 6 (ImageGen link)
                                                                       │
                                                                       ▼
                                                                Fase 7 (bundle audit)
                                                                       │
                                                                       ▼
                                                                Fase 8 (Vertex real, opcional)
```

## 4. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Fabric.js bundle vaza para outras rotas (regressão de performance) | Média | Alto | Lazy load com `next/dynamic`+`ssr:false`. Bundle analyze obrigatório no PR (Fase 7) |
| Aprovação da dep Fabric pelo time bloqueia spec | Baixa | Alto | Justificativa em ADR-01 explícita; alternativas analisadas |
| Latência Vertex AI Imagen edit excede 60s timeout | Baixa | Médio | Pode aumentar timeout client/server se medirmos > 30s P95 |
| Body 20MB excede limite default Cloud Run | Baixa | Alto | Cloud Run aceita até 32MB em request body; configurar limite explícito |
| Imagens grandes (4K+) travam canvas no client | Média | Médio | Validar dimensão no upload, oferecer "redimensionar para X" se > 4K |
| User pinta máscara muito grande, request fica lento | Média | Baixo | Compressão PNG da máscara é eficiente (alta entropia preto/branco) |
| Quota Vertex AI insuficiente | Baixa | Alto | Validar quota antes da Fase 8 |
| Drift entre allow-list de modelos FE/BE | Baixa | Baixo | Modelos são poucos e fixos (`imagen-3-edit`, `imagen-upscaler`) |

## 5. Critérios de Pronto (Definition of Done)

- [ ] Todos os critérios de aceite (CA-01 a CA-28) verificáveis
- [ ] `npx tsc --noEmit` retorna 0 erros
- [ ] `npm run build` (frontend) passa
- [ ] Bundle analyze confirma Fabric SÓ aparece em chunk de `/editor`
- [ ] `pytest api/tests/test_edit_endpoints.py` passa
- [ ] Página `/editor` renderiza com backend offline (fallback) e online (mock)
- [ ] 3 modos aplicam edits e exibem placeholder
- [ ] Undo/redo funcional (Cmd+Z, Cmd+Shift+Z, botões na toolbar)
- [ ] Zoom (wheel) e pan (spacebar+drag) funcionam
- [ ] Download em PNG e JPG (com quality) funcionam em Chrome + Firefox + Safari
- [ ] Botão "Editar" no `ImageGenPanel` abre `/editor` com imagem carregada
- [ ] Documentação atualizada:
  - [ ] `docs/ROADMAP.md` — itens Phase 16 marcados
  - [ ] `package.json` — `fabric` adicionado em dependencies
  - [ ] CLAUDE.md — atualizar lista de dependências aprovadas se necessário
  - [ ] Spec marcada como `status: implementada` no frontmatter
- [ ] PR aprovado por 1 revisor humano + code-reviewer agent
- [ ] (Fase 8) Smoke E2E com Vertex real para os 3 modos
