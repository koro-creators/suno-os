---
spec-id: SPEC-009
slug: video-generation
artefato: tasks
atualizada: 2026-05-15
status: rascunho
versao: 1.0
---

# Tasks — Video Generation

## Resumo

| Total | A Fazer | Em Progresso | Concluídas |
|-------|---------|--------------|------------|
| 18 | 18 | 0 | 0 |

## Tasks

### Fase 1 — Backend Foundation

#### TASK-001: Estender schemas Pydantic com tipos de vídeo
- **Fase**: 1
- **Escopo**: Adicionar `VideoGenRequest`, `VideoGenStartResponse`, `VideoStatusResponse` em `api/chat/schemas/chat.py`. Tipos exatos vêm da seção 6.1 do `spec.md`.
- **Arquivos**:
  - Modificar: `api/chat/schemas/chat.py`
- **Depende de**: nenhuma
- **Critérios de aceite**: CA-09, CA-10, CA-11, CA-12, CA-13 (validação)
- **Estimativa**: P
- **Status**: ⬜

#### TASK-002: Criar tool `video_tools.py` com mock
- **Fase**: 1
- **Escopo**: Criar `api/chat/tools/video_tools.py` com `generate_video` e `get_video_status`. Mock retorna `https://placeholder.com/generated.mp4` e simula progresso baseado em tempo decorrido vs `estimated_seconds`. Cache em memória (`_operation_cache`) com TTL 1h.
- **Arquivos**:
  - Criar: `api/chat/tools/video_tools.py`
- **Depende de**: TASK-001
- **Critérios de aceite**: CA-14
- **Estimativa**: M
- **Status**: ⬜

#### TASK-003: Adicionar endpoints no router
- **Fase**: 1
- **Escopo**: Estender `api/chat/router.py` com `POST /chat/generate-video` e `GET /chat/video-status/{operation_name}`. Validação via Pydantic, chamada à tool, mapeamento de erros para HTTPException com status apropriado.
- **Arquivos**:
  - Modificar: `api/chat/router.py`
- **Depende de**: TASK-002
- **Critérios de aceite**: CA-09 a CA-13
- **Estimativa**: M
- **Status**: ⬜

#### TASK-004: Registrar `generate_video` no VisualCreator agent
- **Fase**: 1
- **Escopo**: Adicionar `generate_video` à lista de tools do `VisualCreator` em `api/chat/agents/visual_creator.py`. Permite que o chat agent dispare geração via ReAct quando usuário pede vídeo no chat.
- **Arquivos**:
  - Modificar: `api/chat/agents/visual_creator.py`
- **Depende de**: TASK-002
- **Critérios de aceite**: (cobre fluxo de chat — não há CA explícito, mas valida integração com SPEC-001)
- **Estimativa**: P
- **Status**: ⬜

#### TASK-005: Tests pytest dos endpoints
- **Fase**: 1
- **Escopo**: Criar `api/tests/test_video_endpoints.py` cobrindo: (1) POST happy path retorna `operation_name`, (2) POST com prompt vazio retorna 400, (3) POST i2v sem source retorna 400, (4) POST com modelo inválido retorna 400, (5) GET com op desconhecido retorna 404, (6) GET happy path retorna status válido.
- **Arquivos**:
  - Criar: `api/tests/test_video_endpoints.py`
- **Depende de**: TASK-003
- **Critérios de aceite**: CA-09 a CA-13
- **Estimativa**: M
- **Status**: ⬜

### Fase 2 — Frontend Foundation

#### TASK-006: Estender `lib/api.ts` com vídeo
- **Fase**: 2
- **Escopo**: Adicionar tipos `VideoGenParams`, `VideoGenStartResponse`, `VideoStatusResponse` e funções `generateVideo()`, `getVideoStatus()`. Seguir exatamente o padrão de `generateImage()`. Usar `getHeaders()` e `getApiUrl()` existentes.
- **Arquivos**:
  - Modificar: `lib/api.ts`
- **Depende de**: TASK-001 (precisa do schema definido)
- **Critérios de aceite**: (precondição para CA-04, CA-06)
- **Estimativa**: P
- **Status**: ⬜

#### TASK-007: Criar catálogo de modelos
- **Fase**: 2
- **Escopo**: Criar `components/chat/video-models.ts` com `VIDEO_MODELS` (5 entradas) e `VIDEO_PRESETS` (4 entradas) conforme seção 6.3 do spec. Exportar tipos `VideoModelSpec` e `VideoPreset`.
- **Arquivos**:
  - Criar: `components/chat/video-models.ts`
- **Depende de**: nenhuma
- **Critérios de aceite**: CA-02, CA-03 (capabilities consultadas pelo painel)
- **Estimativa**: P
- **Status**: ⬜

#### TASK-008: Hook `useVideoPolling`
- **Fase**: 2
- **Escopo**: Criar `hooks/useVideoPolling.ts` conforme pseudocódigo na seção 4.2 do `design.md`. Aceitar `operationName: string | null` e `intervalMs = 5000`. Retornar `{ status, errorCount, isPolling }`. Cleanup obrigatório no unmount.
- **Arquivos**:
  - Criar: `hooks/useVideoPolling.ts`
- **Depende de**: TASK-006
- **Critérios de aceite**: CA-05
- **Estimativa**: M
- **Status**: ⬜

#### TASK-009: Teste unitário do `useVideoPolling`
- **Fase**: 2
- **Escopo**: Teste com Vitest + `vi.useFakeTimers()` validando: (1) cleanup chama `clearInterval`, (2) para após 3 erros, (3) para quando status === 'completed', (4) para quando status === 'failed'.
- **Arquivos**:
  - Criar: `hooks/useVideoPolling.test.ts`
- **Depende de**: TASK-008
- **Critérios de aceite**: CA-05
- **Estimativa**: M
- **Status**: ⬜

### Fase 3 — VideoGenPanel UI

#### TASK-010: Esqueleto do `VideoGenPanel`
- **Fase**: 3
- **Escopo**: Criar `components/chat/VideoGenPanel.tsx` com estrutura mínima: header, banner backend offline, prompt input, botão Gerar (sem lógica). Inline styles + CSS vars + lucide icon `Film`. Espelhar 100% o estilo de `ImageGenPanel.tsx`.
- **Arquivos**:
  - Criar: `components/chat/VideoGenPanel.tsx`
- **Depende de**: TASK-006, TASK-007
- **Critérios de aceite**: CA-01
- **Estimativa**: M
- **Status**: ⬜

#### TASK-011: ModeToggle + ModelSelector + capabilities lock
- **Fase**: 3
- **Escopo**: Adicionar ao `VideoGenPanel`: toggle T2V/I2V (RN-09 a RN-11), seletor de modelo (RN-06 a RN-08), com lógica de filtragem por `mode` e desabilitar audio quando modelo não suporta.
- **Arquivos**:
  - Modificar: `components/chat/VideoGenPanel.tsx`
- **Depende de**: TASK-010
- **Critérios de aceite**: CA-02, CA-03
- **Estimativa**: M
- **Status**: ⬜

#### TASK-012: Configurações + Presets + Advanced
- **Fase**: 3
- **Escopo**: Adicionar AspectRatioSelector (RN-12), DurationSlider 4-8s (RN-13), ResolutionSelector com cap por modelo (RN-14), AudioToggle (RN-15), PresetSelector horizontal (RN-16), AdvancedSettings em accordion (RN-17) com MotionIntensity + Seed.
- **Arquivos**:
  - Modificar: `components/chat/VideoGenPanel.tsx`
- **Depende de**: TASK-011
- **Critérios de aceite**: (cobre RNs 12-17)
- **Estimativa**: M
- **Status**: ⬜

#### TASK-013: ReferenceUploader para I2V
- **Fase**: 3
- **Escopo**: Componente que aceita drop de PNG/JPG, valida 10MB, converte para base64, exibe preview. Aparece apenas quando `mode === 'i2v'`. Reusar lógica de upload se já existir em `components/chat/ChatInput.tsx`.
- **Arquivos**:
  - Modificar: `components/chat/VideoGenPanel.tsx`
  - (Considerar: extrair `components/chat/shared/ImageDropper.tsx` se houver duplicação útil)
- **Depende de**: TASK-011
- **Critérios de aceite**: RN-10 (não tem CA explícito; smoke test manual)
- **Estimativa**: M
- **Status**: ⬜

#### TASK-014: Fluxo de geração + polling + estados
- **Fase**: 3
- **Escopo**: Implementar `handleGenerate()`: chama `generateVideo()`, armazena `operation_name`, dispara `useVideoPolling`. Renderizar 5 estados: idle / starting / polling (com ProgressBar + ETA + Cancel) / done (player + ações) / error (banner + retry). Cancel = limpa `operationName`.
- **Arquivos**:
  - Modificar: `components/chat/VideoGenPanel.tsx`
- **Depende de**: TASK-008, TASK-012
- **Critérios de aceite**: CA-04, CA-06, CA-07
- **Estimativa**: G
- **Status**: ⬜

#### TASK-015: ResultViewer com Download/Variation/New
- **Fase**: 3
- **Escopo**: Após `status === 'completed'`, mostrar `<video controls src={video_url} />` + 3 botões: Baixar (fetch + blob + anchor download), Gerar variação (limpa result, troca seed, mantém form), Novo (limpa tudo).
- **Arquivos**:
  - Modificar: `components/chat/VideoGenPanel.tsx`
- **Depende de**: TASK-014
- **Critérios de aceite**: CA-08
- **Estimativa**: M
- **Status**: ⬜

### Fase 4 — Integração

#### TASK-016: Botão "Animar esta imagem" no ImageGenPanel
- **Fase**: 4
- **Escopo**: Adicionar botão no `components/chat/ImageGenPanel.tsx` (próximo ao Download), que abre o `VideoGenPanel` (via prop callback ou URL state) com `mode='i2v'` e `sourceImage` pré-carregada. Decidir mecanismo no PR review (prop drilling vs context vs URL).
- **Arquivos**:
  - Modificar: `components/chat/ImageGenPanel.tsx`
  - Modificar: `components/chat/VideoGenPanel.tsx` (aceitar `initialMode` e `initialSourceImage` como props)
  - Possivelmente modificar: `components/chat/ChatInterface.tsx` (orquestração)
- **Depende de**: TASK-015
- **Critérios de aceite**: CA-16
- **Estimativa**: M
- **Status**: ⬜

#### TASK-017: Atualizar ROADMAP e marcar spec implementada
- **Fase**: 4
- **Escopo**: Em `docs/ROADMAP.md`, marcar item "Integrar Vertex AI Veo 3.1 para geração de vídeo" da Phase 16 como `[x]` ou em progresso. No frontmatter de `spec.md`, mudar `status: rascunho` → `status: implementada`. Adicionar arquivos relacionados no frontmatter.
- **Arquivos**:
  - Modificar: `docs/ROADMAP.md`
  - Modificar: `docs/specs/large/video-generation/spec.md` (frontmatter)
- **Depende de**: TASK-016
- **Critérios de aceite**: (governança SDD)
- **Estimativa**: P
- **Status**: ⬜

### Fase 5 — Vertex AI Real (opcional na v1)

#### TASK-018: Plugar Vertex AI Veo no `video_tools.py`
- **Fase**: 5
- **Escopo**: Substituir mock em `video_tools.py` por chamadas reais a `google.cloud.aiplatform`. Implementar: (1) submit de operação Veo com payload correto, (2) consulta de status com polling Vertex, (3) cópia do output para GCS bucket público, (4) sign URL v4 para retorno. Configurar `GCP_PROJECT_ID`, `VERTEX_LOCATION`, `GCS_VIDEO_OUTPUT_BUCKET`, `GCS_VIDEO_STAGING_BUCKET` em `.env.example`. Adicionar lifecycle rule no staging (TTL 24h).
- **Arquivos**:
  - Modificar: `api/chat/tools/video_tools.py`
  - Modificar: `api/.env.example`
  - Criar: `api/scripts/setup_gcs_buckets.sh` (opcional, doc bash com gsutil)
- **Depende de**: TASK-017 + GCP project + service account com Vertex AI User + GCS Admin
- **Critérios de aceite**: smoke E2E gera vídeo de 4s real
- **Estimativa**: G
- **Status**: ⬜

<!-- REVIEW: As tarefas são implementáveis e testáveis isoladamente? -->

## Prompt para Agente (template)

Cada task pode ser enviada individualmente ao agente:

> Implemente TASK-XXX: <título>.
>
> **Spec**: `docs/specs/large/video-generation/spec.md`
> **Design**: `docs/specs/large/video-generation/design.md`
> **Constitution**: `docs/specs/large/video-generation/constitution.md` (princípios obrigatórios — leia antes)
> **Plan**: `docs/specs/large/video-generation/plan.md`
>
> **Escopo desta task**: <colar do tasks.md>
> **Arquivos**: <colar do tasks.md>
> **Critérios de aceite a verificar**: <colar IDs do tasks.md>
>
> **Restrições da constitution a respeitar**:
> - Inline styles + CSS vars (`--void`, `--sun`, etc), não Tailwind
> - Lucide icons size=14 strokeWidth=1.5
> - Zero deps novas no frontend
> - Mock-first no backend
> - Polling client-side com cleanup obrigatório
> - Mesmo padrão visual do `components/chat/ImageGenPanel.tsx`
>
> Após implementar, rode `npx tsc --noEmit` (frontend) e/ou `pytest` (backend) e reporte resultado.
