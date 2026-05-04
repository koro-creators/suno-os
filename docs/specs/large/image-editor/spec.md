---
spec-id: SPEC-003
slug: image-editor
artefato: spec
nivel-sdd: spec-anchored
tamanho: large
status: rascunho
criada: 2026-04-28
atualizada: 2026-04-28
versao: 1.0
---

# Especificação — Image Editor

## 1. Visão Geral

**O quê**: Adicionar editor de imagem ao sunOS com 3 operações: inpainting (edição com máscara), outpainting (expansão direcional) e enhance/upscale (x2/x4). Frontend ganha nova rota `/editor` com canvas Fabric.js; backend ganha 3 endpoints síncronos + tool `edit_tools.py`.

**Por quê**: Roadmap Phase 16 explicitamente lista 2 itens cobertos por esta spec: "Image editor com inpainting/outpainting" e "Image enhance (upscale x2/x4)". Hoje o produto gera imagens, mas não permite refinar — o que limita drasticamente o uso real (todo criativo precisa retocar).

**Para quem**:
- **P2 — Criativo**: refina detalhes (remover objeto indesejado, expandir composição, melhorar resolução para entrega final).
- **P3 — Estrategista**: ajustes finais antes de apresentação a cliente.

**Escopo incluído**:
- Rota `app/editor/page.tsx` com 3 modos de operação (inpaint/outpaint/enhance)
- Componentes em `components/editor/`: `EditorCanvas`, `EditorToolbar`, `BrushSettings`, `OutpaintControls`, `EnhanceControls`, `SaveOptionsModal`
- 3 endpoints backend: `POST /chat/edit-image` (inpaint), `POST /chat/outpaint-image`, `POST /chat/enhance-image`
- Tool `api/chat/tools/edit_tools.py` (3 funções, mock-first)
- Helpers `lib/mask-utils.ts` para serialização de máscara
- Inpaint: pintar máscara + prompt + intent (`removal` | `insertion`)
- Outpaint: 4 direções (left/right/top/bottom) + amount (25/50/75/100%) + prompt opcional
- Enhance: scale factor x2 ou x4
- Undo/redo (mínimo 20 níveis)
- Zoom/pan no canvas
- Source de imagem: upload local OU URL (vinda de imagem gerada anteriormente, via query string `?src=URL`)
- Download do resultado
- Fabric.js como dep nova (justificada na constitution)

**Escopo excluído** (fora desta spec):
- Editor de vídeo
- Layers, blend modes, filtros (brilho/contraste/saturação)
- Style transfer, remove background, face restoration (futuras specs)
- Persistência de edições (cada edit é stateless)
- Colaboração multi-user no canvas
- Export para formatos além de PNG/JPG
- Preset de máscaras automáticas (object detection)
- Histórico de versões da imagem
- Integração com Biblioteca (selecionar imagem direto da Biblioteca) — futura

## 2. Personas e Jornadas

### Persona: Criativo refinando geração
- **Perfil**: redator/diretor de arte que acabou de gerar imagem no `ImageGenPanel`
- **Objetivo**: remover objeto indesejado em 2 minutos
- **Jornada**:
  1. Gera imagem no `ImageGenPanel`
  2. Clica botão "Editar" → navega para `/editor?src=<url>`
  3. Editor carrega imagem no canvas
  4. Seleciona ferramenta "Inpaint", brush size 50px
  5. Pinta máscara sobre objeto a remover
  6. Digita prompt: "céu limpo, luz natural" + intent="removal"
  7. Clica "Aplicar" → loading 8s → resultado substitui canvas
  8. Se gostar: clica "Baixar". Se não: undo + ajusta máscara + tenta de novo.

### Persona: Criativo expandindo composição
- **Perfil**: mesmo P2
- **Objetivo**: estender imagem para a direita (transformar 1:1 em 16:9)
- **Jornada**:
  1. Carrega imagem (upload ou via `?src=`)
  2. Seleciona ferramenta "Outpaint", direção "right", amount "100%"
  3. (Opcional) digita prompt: "continuação natural da paisagem"
  4. Clica "Aplicar" → loading → canvas expande para direita
  5. Repete para outras direções se necessário

### Persona: Criativo finalizando para entrega
- **Perfil**: mesmo P2, fluxo final
- **Objetivo**: imagem 4K para apresentação
- **Jornada**:
  1. Imagem carregada (1024x1024)
  2. Seleciona ferramenta "Enhance", scale "x4"
  3. Clica "Aplicar" → loading → canvas mostra 4096x4096
  4. Baixa

<!-- REVIEW: A especificação captura o que você realmente quer construir? -->

## 3. Requisitos Funcionais

### RF-01: Página `/editor` com canvas
- **Descrição**: Rota `app/editor/page.tsx` que renderiza canvas Fabric.js + toolbar.
- **Prioridade**: Alta
- **Regras de negócio**:
  - RN-01: SE query param `?src=<url>` ENTÃO carregar imagem dessa URL no canvas ao montar.
  - RN-02: SE não houver `?src` E não houver upload ENTÃO mostrar empty state com botão "Carregar imagem".
  - RN-03: SE imagem > 20MB ENTÃO toast erro e não carrega.
  - RN-04: SE formato não for PNG/JPG/WebP ENTÃO toast erro e não carrega.

### RF-02: Toolbar com 3 modos
- **Descrição**: Toolbar lateral com seleção de modo (Inpaint | Outpaint | Enhance) + ferramentas contextuais.
- **Prioridade**: Alta
- **Regras de negócio**:
  - RN-05: Default mode = `inpaint`.
  - RN-06: Trocar modo limpa máscara/preview do modo anterior (sem perder imagem source).
  - RN-07: Quando `mode === 'inpaint'` mostrar BrushSettings (size, shape, eraser toggle).
  - RN-08: Quando `mode === 'outpaint'` mostrar OutpaintControls (direção + amount).
  - RN-09: Quando `mode === 'enhance'` mostrar EnhanceControls (x2 | x4).

### RF-03: Inpaint — pintar máscara + aplicar
- **Descrição**: Usuário pinta máscara sobre área a editar, fornece prompt e intent, aplica.
- **Prioridade**: Alta
- **Regras de negócio**:
  - RN-10: Brush size: 5-200px.
  - RN-11: Brush shape: círculo (default) ou quadrado.
  - RN-12: Eraser toggle remove pixels da máscara.
  - RN-13: Máscara renderizada com overlay rosa semi-transparente (`#ff00ff` @ 40% opacity).
  - RN-14: Intent: `removal` (default) ou `insertion`.
  - RN-15: Prompt obrigatório quando intent = `insertion`.
  - RN-16: Botão "Aplicar Inpaint" disabled se máscara vazia ou loading.

### RF-04: Outpaint — direção + amount + aplicar
- **Descrição**: Usuário escolhe 1 das 4 direções e quantidade, aplica.
- **Prioridade**: Alta
- **Regras de negócio**:
  - RN-17: Direção: `left | right | top | bottom`. Default = `right`.
  - RN-18: Amount: `25 | 50 | 75 | 100` (% da dimensão na direção). Default = `50`.
  - RN-19: Prompt opcional. Se vazio, modelo usa contexto.
  - RN-20: Preview visual no canvas: área expandida fica com borda tracejada antes de aplicar.

### RF-05: Enhance — scale + aplicar
- **Descrição**: Usuário escolhe x2 ou x4, aplica.
- **Prioridade**: Alta
- **Regras de negócio**:
  - RN-21: Scale: `2 | 4`. Default = `2`.
  - RN-22: Mostrar preview de dimensão resultante (e.g. "1024×1024 → 4096×4096").
  - RN-23: Bloquear x4 se imagem source > 2048px na maior dimensão (resultado > 8K é proibido para evitar custos absurdos).

### RF-06: Undo / Redo
- **Descrição**: Stack de snapshots do canvas.
- **Prioridade**: Alta
- **Regras de negócio**:
  - RN-24: Cada operação aplicada (inpaint/outpaint/enhance) gera snapshot.
  - RN-25: Pintar máscara NÃO gera snapshot (seria muito).
  - RN-26: Stack máximo: 20 snapshots. Mais antigos descartados.
  - RN-27: Atalhos: `Cmd+Z` undo, `Cmd+Shift+Z` redo.
  - RN-28: Botões na toolbar com estado disabled quando stack vazia.

### RF-07: Zoom / Pan
- **Descrição**: Navegação no canvas para imagens grandes.
- **Prioridade**: Média
- **Regras de negócio**:
  - RN-29: Wheel = zoom no ponto do cursor.
  - RN-30: Spacebar + drag = pan.
  - RN-31: Botão "Fit" = volta para zoom-to-fit + centralizado.
  - RN-32: Zoom range: 10% - 800%.

### RF-08: Salvar / Baixar
- **Descrição**: Exportar imagem editada.
- **Prioridade**: Alta
- **Regras de negócio**:
  - RN-33: Botão "Baixar" abre `SaveOptionsModal` com escolha de formato (PNG | JPG) e qualidade (se JPG: 0.6/0.8/0.95).
  - RN-34: Download via blob (anchor com `download` attribute).
  - RN-35: Nome padrão: `sunos-edit-{timestamp}.{ext}`.

## 4. Comportamento Especificado

### 4.1 Fluxos Principais

**Fluxo 1: Inpaint**
1. Usuário em `/editor` com imagem carregada (via upload ou `?src=`)
2. Toolbar default = inpaint, brush size 30
3. Usuário pinta máscara (Fabric layer "mask")
4. Digita prompt + escolhe intent
5. Clica "Aplicar Inpaint" → `setLoading(true)`
6. Frontend serializa máscara para PNG base64 (preto = manter, branco = editar)
7. Frontend chama `editImage({ source_image_base64, mask_base64, prompt, intent })` → POST `/chat/edit-image`
8. Backend valida, chama tool `inpaint_image` → Vertex Imagen edit (mock retorna placeholder)
9. Backend retorna `{ result_url, model, prompt }` em 5-30s
10. Frontend baixa imagem do `result_url`, cria nova layer no Fabric, push snapshot, limpa máscara
11. `setLoading(false)`

**Fluxo 2: Outpaint**
1. Usuário escolhe modo outpaint, direção, amount
2. Canvas mostra preview da nova dimensão (borda tracejada)
3. Clica "Aplicar Outpaint"
4. Frontend serializa imagem atual + parâmetros
5. POST `/chat/outpaint-image` → backend gera, retorna `{ result_url, new_dimensions }`
6. Frontend substitui canvas pela imagem expandida, snapshot

**Fluxo 3: Enhance**
1. Usuário escolhe modo enhance, scale
2. Clica "Aplicar Enhance"
3. POST `/chat/enhance-image` → backend upscale, retorna `{ result_url, new_dimensions }`
4. Frontend substitui canvas pela versão upscalada, snapshot

**Fluxo 4: Backend offline**
1. `apiAvailable()` retorna false
2. Página renderiza com banner "Requer backend"
3. Botões "Aplicar X" todos desabilitados
4. Canvas/drawing/zoom/pan/download continuam funcionando localmente

### 4.2 Fluxos de Erro

| Código | Condição | Resposta ao usuário | Ação do sistema |
|--------|----------|---------------------|-----------------|
| 400 | Prompt vazio em insertion / máscara vazia em inpaint | Toast "Pinte a área a editar" / "Descreva a inserção" | Não chama API |
| 401 | JWT expirado | Toast + redirect login | — |
| 413 | Imagem > 20MB | Toast "Imagem muito grande (max 20MB)" | Bloqueia upload |
| 415 | Formato não suportado | Toast "Use PNG, JPG ou WebP" | Bloqueia upload |
| 422 | Validação Imagen (e.g. policy violation) | Banner com mensagem | Mantém canvas, oferece retry |
| 429 | Rate limit | Toast "Limite atingido, tente em N s" | — |
| 500 | Erro genérico | Toast "Falha ao aplicar edit" | Log no console |
| Timeout (60s) | Resposta não chega | Toast "Tempo esgotado, tente de novo" | Cancela request |

### 4.3 Estados e Transições do Canvas

```
[empty] --upload/?src--> [loaded] --pinta máscara--> [masked] --aplicar--> [processing]
                                                                              │
                            ◄--snapshot--                                     │
                                                                              ▼
                                                                            [done]
                                                                              │
                                                                              └--undo--> [loaded] (snapshot anterior)
```

## 5. Requisitos Não-Funcionais

### RNF-01: Performance
- Canvas renderiza < 16ms (60fps) ao desenhar máscara em imagens até 4096×4096.
- Inpaint backend P95 < 30s.
- Outpaint backend P95 < 30s.
- Enhance backend P95 < 20s para x2, < 60s para x4.
- Bundle de Fabric.js NÃO impacta outras rotas (lazy-load via `dynamic` import com `ssr: false`).

### RNF-02: Segurança
- Auth Firebase JWT obrigatório nos 3 endpoints.
- Backend valida formato (PNG/JPG/WebP) e tamanho (≤ 20MB) via PIL.
- Rate limit no backend: max 10 edits simultâneos por usuário.
- Vertex AI keys em GCP Secret Manager.

### RNF-03: Confiabilidade
- Timeout client de 60s nos 3 endpoints.
- Cleanup de Fabric canvas no `useEffect` cleanup (sem memory leak).
- Snapshots em memória (não localStorage) — refresh perde, é trade-off aceito.

### RNF-04: Acessibilidade
- Inputs com labels.
- Botões icon-only com `aria-label`.
- Atalhos (Cmd+Z, Cmd+Shift+Z) documentados em tooltip.
- Canvas tem `role="img"` com `aria-label` descritivo.

### RNF-05: Compatibilidade de browser
- Chrome 110+, Firefox 110+, Safari 16+, Edge 110+.
- Fabric.js v6 cobre todos.

## 6. Interface & Contratos

### 6.1 APIs

#### `POST /chat/edit-image` (Inpaint)

**Request** (`InpaintRequest`):
```python
class InpaintRequest(BaseModel):
    source_image_base64: str            # PNG/JPG/WebP base64
    mask_base64: str                     # PNG base64, mesmo tamanho do source, branco=editar, preto=manter
    prompt: str = ""                     # obrigatório se intent=insertion
    intent: Literal["removal", "insertion"] = "removal"
    model: str = "imagen-3-edit"
```

**Response 200** (`EditImageResponse`):
```python
class EditImageResponse(BaseModel):
    result_url: str                      # GCS signed URL, TTL 7d
    width: int
    height: int
    model: str
    prompt: str                          # prompt final usado (com tokens auxiliares)
```

**Errors**: 400, 401, 413, 415, 422, 429, 500.

#### `POST /chat/outpaint-image`

**Request** (`OutpaintRequest`):
```python
class OutpaintRequest(BaseModel):
    source_image_base64: str
    direction: Literal["left", "right", "top", "bottom"]
    amount_percent: Literal[25, 50, 75, 100]
    prompt: str | None = None
    model: str = "imagen-3-edit"
```

**Response 200**: mesmo `EditImageResponse` (com `width`/`height` novos).

#### `POST /chat/enhance-image`

**Request** (`EnhanceRequest`):
```python
class EnhanceRequest(BaseModel):
    source_image_base64: str
    scale: Literal[2, 4] = 2
    model: str = "imagen-upscaler"
```

**Response 200**: mesmo `EditImageResponse`.

**Validação extra**: backend rejeita 422 se source > 2048px na maior dimensão E `scale=4`.

### 6.2 Tipos Compartilhados (Frontend)

```typescript
// lib/api.ts (adicionar)
export interface InpaintParams {
  source_image_base64: string;
  mask_base64: string;
  prompt?: string;
  intent?: 'removal' | 'insertion';
  model?: string;
}

export interface OutpaintParams {
  source_image_base64: string;
  direction: 'left' | 'right' | 'top' | 'bottom';
  amount_percent: 25 | 50 | 75 | 100;
  prompt?: string | null;
  model?: string;
}

export interface EnhanceParams {
  source_image_base64: string;
  scale?: 2 | 4;
  model?: string;
}

export interface EditImageResponse {
  result_url: string;
  width: number;
  height: number;
  model: string;
  prompt: string;
}

export async function editImage(params: InpaintParams): Promise<EditImageResponse>;
export async function outpaintImage(params: OutpaintParams): Promise<EditImageResponse>;
export async function enhanceImage(params: EnhanceParams): Promise<EditImageResponse>;
```

### 6.3 API do helper de máscara

```typescript
// lib/mask-utils.ts
import type { Canvas as FabricCanvas } from 'fabric';

/** Extrai máscara binária do canvas Fabric (camada nomeada "mask") como PNG base64. */
export function extractMaskAsBase64(canvas: FabricCanvas, width: number, height: number): string;

/** Verifica se a máscara tem ao menos N pixels pintados (para validar antes de submit). */
export function maskHasContent(canvas: FabricCanvas, minPixels?: number): boolean;

/** Limpa apenas a camada de máscara, preservando a imagem source. */
export function clearMask(canvas: FabricCanvas): void;
```

## 7. Critérios de Aceite

### Frontend — Página e Carregamento
- [ ] **CA-01**: DADO `/editor?src=https://...` QUANDO página monta ENTÃO imagem aparece no canvas.
- [ ] **CA-02**: DADO `/editor` sem `?src` QUANDO página monta ENTÃO empty state com botão "Carregar" aparece.
- [ ] **CA-03**: DADO upload de arquivo > 20MB QUANDO selecionado ENTÃO toast erro e canvas continua vazio.
- [ ] **CA-04**: DADO upload de `.tiff` QUANDO selecionado ENTÃO toast erro e canvas continua vazio.
- [ ] **CA-05**: DADO `apiAvailable() === false` QUANDO página monta ENTÃO banner "Requer backend" aparece e botões "Aplicar X" ficam disabled.

### Frontend — Inpaint
- [ ] **CA-06**: DADO modo inpaint ativo QUANDO usuário pinta E aplica ENTÃO canvas atualiza com resultado e snapshot é criado.
- [ ] **CA-07**: DADO máscara vazia QUANDO usuário tenta aplicar inpaint ENTÃO botão fica disabled.
- [ ] **CA-08**: DADO intent=insertion E prompt vazio QUANDO usuário tenta aplicar ENTÃO botão fica disabled.
- [ ] **CA-09**: DADO eraser toggle ativo QUANDO usuário "pinta" sobre máscara ENTÃO pixels são removidos.

### Frontend — Outpaint
- [ ] **CA-10**: DADO modo outpaint, direção=right, amount=50 QUANDO aplicar ENTÃO canvas expande lateralmente e snapshot criado.
- [ ] **CA-11**: DADO modo outpaint QUANDO direção e amount selecionados ENTÃO preview visual com borda tracejada aparece.

### Frontend — Enhance
- [ ] **CA-12**: DADO imagem 1024×1024 e scale=2 QUANDO aplicar ENTÃO canvas vira 2048×2048.
- [ ] **CA-13**: DADO imagem > 2048px e scale=4 QUANDO usuário tenta aplicar ENTÃO toast informa limite e backend rejeita 422.
- [ ] **CA-14**: DADO modo enhance QUANDO scale selecionado ENTÃO label mostra dimensão resultante (e.g. "1024×1024 → 4096×4096").

### Frontend — Undo/Redo + Zoom
- [ ] **CA-15**: DADO 3 operações aplicadas QUANDO usuário pressiona Cmd+Z 3x ENTÃO canvas volta ao estado original.
- [ ] **CA-16**: DADO stack vazia QUANDO usuário pressiona Cmd+Z ENTÃO nada acontece (botão disabled).
- [ ] **CA-17**: DADO wheel scroll no canvas QUANDO usuário rola ENTÃO zoom acontece no ponto do cursor.
- [ ] **CA-18**: DADO zoom 800% QUANDO usuário clica "Fit" ENTÃO canvas volta para fit-to-screen.

### Frontend — Save
- [ ] **CA-19**: DADO clique em "Baixar" QUANDO modal abre e PNG selecionado ENTÃO download começa com nome `sunos-edit-{timestamp}.png`.
- [ ] **CA-20**: DADO JPG quality 0.8 selecionado QUANDO baixa ENTÃO arquivo é JPG comprimido.

### Backend
- [ ] **CA-21**: DADO `POST /chat/edit-image` com source válido + máscara + prompt QUANDO requisitado ENTÃO retorna 200 com `result_url` em ≤ 30s (mock retorna placeholder).
- [ ] **CA-22**: DADO `POST /chat/edit-image` com source > 20MB QUANDO requisitado ENTÃO retorna 413.
- [ ] **CA-23**: DADO `POST /chat/outpaint-image` com direção/amount válidos QUANDO requisitado ENTÃO retorna 200.
- [ ] **CA-24**: DADO `POST /chat/enhance-image` com source 2049px+ E scale=4 QUANDO requisitado ENTÃO retorna 422 com mensagem clara.
- [ ] **CA-25**: DADO format=PNG enviado em base64 QUANDO backend valida com PIL ENTÃO aceita.
- [ ] **CA-26**: DADO format=TIFF enviado QUANDO backend valida ENTÃO retorna 415.

### Constitution checks
- [ ] **CA-27**: Bundle inicial das outras rotas NÃO inclui Fabric (verificar via `next build` analyze).
- [ ] **CA-28**: Página `/editor` faz lazy load de Fabric (verificar Network tab carrega chunk só ao entrar em `/editor`).

## 8. Fora de Escopo

- Layers, blend modes, color adjustments (brilho, contraste, saturação, hue).
- Style transfer / face restoration / remove background (futuras specs separadas).
- Editor de vídeo.
- Persistência de edições / histórico de versões / save-as-project.
- Colaboração multi-user no canvas.
- Integração com Biblioteca para selecionar imagem source (futura).
- Export de PSD, PDF, SVG.
- Preset de máscaras automáticas (object detection / segmentation).
- Geração de máscara via prompt ("máscara automática para o céu").
- Ajustes manuais de cor/brilho (não-AI).
- Processamento batch (múltiplas imagens de uma vez).

## Changelog

| Versão | Data | Mudança |
|--------|------|---------|
| 1.0 | 2026-04-28 | Versão inicial |
