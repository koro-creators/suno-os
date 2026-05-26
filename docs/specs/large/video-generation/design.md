---
spec-id: SPEC-009
slug: video-generation
artefato: design
atualizada: 2026-05-15
status: rascunho
versao: 1.0
---

# Design — Video Generation

## 1. Arquitetura

### 1.1 Visão de Contexto (C4 Nível 1)

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Usuário   │ ──HTTPS │   sunOS Frontend │ ──HTTPS │  sunos-api      │
│  (Criativo) │         │   (Next.js 14)   │         │  (FastAPI)      │
└─────────────┘         └──────────────────┘         └────────┬────────┘
                                                              │
                                                              │ Vertex AI SDK
                                                              ▼
                                                     ┌─────────────────┐
                                                     │  Vertex AI Veo  │
                                                     │   (Google Cloud)│
                                                     └─────────────────┘
```

### 1.2 Visão de Containers (C4 Nível 2)

```
┌──────────────────────────────────────────────────────────────────┐
│ Frontend: sunOS                                                  │
│                                                                  │
│  components/chat/VideoGenPanel.tsx ──┬─► lib/api.ts             │
│                                      │      generateVideo()      │
│                                      │      getVideoStatus()     │
│                                      └─► hooks/useVideoPolling.ts│
└──────────────────────────────┬───────────────────────────────────┘
                               │ HTTPS / JSON
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│ Backend: sunos-api                                               │
│                                                                  │
│  api/chat/router.py                                              │
│      ├── POST /chat/generate-video  ──► tools/video_tools.py     │
│      └── GET  /chat/video-status/{op}                            │
│                                            │                     │
│  api/chat/schemas/chat.py                  │                     │
│      VideoGenRequest                       │                     │
│      VideoGenStartResponse                 │                     │
│      VideoStatusResponse                   │                     │
│                                            ▼                     │
│  api/chat/agents/visual_creator.py ──► generate_video tool       │
│                                            │                     │
│                                            ▼                     │
│                                    ┌────────────────┐            │
│                                    │ Vertex AI Veo  │            │
│                                    │  (long-running)│            │
│                                    └────────────────┘            │
└──────────────────────────────────────────────────────────────────┘
```

### 1.3 Visão de Componentes (C4 Nível 3)

**Frontend — `VideoGenPanel`**:

```
VideoGenPanel
├── Header (icon Film + title)
├── BackendUnavailableBanner (condicional)
├── ModeToggle (T2V | I2V)
├── ModelSelector (5 modelos com badges)
├── PromptInput (textarea + char counter)
├── ReferenceUploader (condicional, só I2V)
├── ConfigGrid
│   ├── AspectRatioSelector
│   ├── DurationSlider (4-8s)
│   ├── ResolutionSelector
│   └── AudioToggle (condicional)
├── PresetSelector (chips horizontais)
├── AdvancedSettings (accordion)
│   ├── MotionIntensitySelector
│   └── SeedInput
├── GenerateButton (disabled states)
├── PollingProgress (durante geração)
│   ├── ProgressBar
│   ├── ETA / elapsed time
│   └── CancelButton
├── ResultViewer (após completar)
│   ├── <video controls />
│   ├── DownloadButton
│   ├── GenerateVariationButton
│   └── NewButton
└── ErrorBanner (condicional)
```

**Backend — fluxo do tool**:

```
router.py:generate_video_endpoint
    ↓ valida VideoGenRequest
    ↓
tools/video_tools.py:generate_video
    ↓ se mode='i2v', upload base64 → GCS staging
    ↓ chama Vertex AI Veo SDK (async)
    ↓ recebe operation_name
    ↓ retorna VideoGenStartResponse
    ↓
[client polls]
    ↓
router.py:video_status_endpoint
    ↓
tools/video_tools.py:get_video_status
    ↓ consulta Vertex AI operation
    ↓ se completo, copia output → GCS bucket público
    ↓ retorna VideoStatusResponse
```

## 2. Modelo de Dados

### 2.1 Entidades (transientes — sem persistência v1)

Esta feature não persiste em PostgreSQL na v1. Cada geração é stateless do ponto de vista do nosso backend (Vertex AI mantém o estado da operação durante minutos).

**Em memória (cache opcional)**:
```python
# api/chat/tools/video_tools.py
_operation_cache: dict[str, dict] = {}  # operation_name -> {started_at, request_payload}
# TTL: 1 hora; serve apenas para enriquecer logs e tracing
```

### 2.2 GCS Bucket Layout

```
gs://sunos-video-output/
├── {user_id}/{operation_name}/output.mp4
└── {user_id}/{operation_name}/thumbnail.jpg

gs://sunos-video-staging/  (para imagens I2V)
└── {user_id}/{operation_name}/source.png   # TTL 24h (lifecycle rule)
```

URLs retornadas ao cliente são **signed URLs** (`v4`, validade 7 dias).

## 3. Decisões Técnicas (ADRs)

### ADR-01: Polling client-side em vez de WebSocket

- **Status**: Aceita
- **Contexto**: Geração Veo dura 60-300s. Cliente precisa saber quando completou.
- **Decisão**: Polling HTTP a cada 5s via `setInterval` no React.
- **Alternativas consideradas**:
  - WebSocket via FastAPI: adiciona infra (sticky sessions no Cloud Run), complica fallback offline.
  - Long polling: mais complexo, sem ganho real.
  - SSE (já temos): viável mas overkill para 1 update a cada 5s.
- **Consequências**:
  - ✅ Simples, robusto, fallback óbvio.
  - ✅ Reusa `lib/api.ts` (zero infra nova).
  - ⚠️ ~12 requests por minuto por geração ativa — aceitável para volumes esperados (< 100 gerações/dia inicialmente).

### ADR-02: 2 endpoints separados (start + poll) em vez de 1 endpoint streaming

- **Status**: Aceita
- **Contexto**: Existem 2 padrões: (a) endpoint que dispara e retorna stream SSE com updates, (b) start + polling.
- **Decisão**: `POST /chat/generate-video` (start, < 1s) + `GET /chat/video-status/{op}` (poll).
- **Alternativas consideradas**:
  - Endpoint streaming SSE único: usuário fechar tab quebra geração na percepção do cliente; difícil resumir.
  - Webhook callback: requer URL pública do cliente, inviável para SPA.
- **Consequências**:
  - ✅ Resilente: usuário pode fechar tab e voltar (basta `GET /chat/video-status/{op}` com `operation_name` salvo).
  - ✅ Cache-friendly no GET status.
  - ⚠️ Cliente precisa orquestrar polling (encapsulado em `useVideoPolling`).

### ADR-03: Mock-first no backend, Vertex AI plugado depois

- **Status**: Aceita
- **Contexto**: Vertex AI Veo é caro e tem quota limitada. Frontend precisa funcionar antes do backend real.
- **Decisão**: Tool `video_tools.py` espelha estrutura de `image_tools.py` — retorna placeholder URL no v1, com `# TODO: Replace mock` comentado.
- **Alternativas consideradas**: Implementar Vertex AI direto. Rejeitado: bloqueia frontend.
- **Consequências**:
  - ✅ Frontend testável end-to-end sem custo de Vertex.
  - ✅ Mesmo padrão já estabelecido em SPEC-001.
  - ⚠️ Necessário backlog explícito (TASK-016) para plugar Vertex real.

### ADR-04: Catálogo de modelos no frontend (`video-models.ts`)

- **Status**: Aceita
- **Contexto**: Capabilities (audio, I2V, max resolution) precisam estar disponíveis no client para UX dinâmica (esconder toggle, filtrar modelos).
- **Decisão**: Catálogo em arquivo TS no frontend (`components/chat/video-models.ts`); backend valida contra mesmo allow-list em Pydantic.
- **Alternativas consideradas**:
  - Endpoint `/chat/video-models` que retorna catálogo: adiciona round-trip; modelos mudam raramente.
  - Catálogo só no backend: força round-trip a cada toggle do mode.
- **Consequências**:
  - ✅ UX reativa, sem fetch.
  - ⚠️ Risco de drift entre catálogo TS e validação Pydantic. Mitigação: documentar que ambos devem mudar juntos no PR; teste de integração simples.

### ADR-05: Sem persistência de histórico em PostgreSQL na v1

- **Status**: Aceita
- **Contexto**: SPEC-001 já tem `conversation_store` para chat. Vídeo poderia gravar gerações.
- **Decisão**: V1 é efêmero. Cliente segura operation_name em memória; URL fica viva 7 dias via signed URL.
- **Alternativas consideradas**: Tabela `video_generations` em Postgres. Rejeitado: prematuro, sem caso de uso claro de histórico.
- **Consequências**:
  - ✅ Menos código, menos migration.
  - ⚠️ Refresh de página perde a referência. Documentar em UX como expected behavior na v1.
  - 🔮 Spec futura pode adicionar persistência integrada à Biblioteca.

<!-- REVIEW: A arquitetura faz sentido para as restrições do projeto? -->

## 4. Diagramas de Fluxo

### 4.1 Sequência: Geração T2V Completa

```
User    Browser    sunOS-FE    sunos-api    Vertex Veo    GCS
 │         │          │           │              │           │
 │--prompt-►          │           │              │           │
 │         │--click--►            │              │           │
 │         │          │--POST /generate-video---►              │
 │         │          │           │--Veo.async_generate------►│
 │         │          │           │◄--operation_name----------│
 │         │          │◄--{op, eta:90s}--                      │
 │         │◄--showProgress--                                   │
 │         │          │                                         │
 │         │   [polling loop, every 5s]                        │
 │         │          │--GET /video-status/{op}---►            │
 │         │          │           │--get_op----►│              │
 │         │          │           │◄--running---│              │
 │         │          │◄--{status:running, progress:0.3}--     │
 │         │◄--update progress--                                │
 │         │          │           │                            │
 │         │   ... (poll N times) ...                          │
 │         │          │           │                            │
 │         │          │--GET /video-status/{op}---►            │
 │         │          │           │--get_op----►│              │
 │         │          │           │◄--done+url--│              │
 │         │          │           │--copy to bucket-----------►│
 │         │          │           │◄--signed_url--------------│
 │         │          │◄--{status:completed, video_url}--      │
 │         │◄--showVideo--                                     │
 │◄--play--│          │                                         │
```

### 4.2 Lógica do `useVideoPolling` (pseudocódigo)

```typescript
function useVideoPolling(operationName: string | null, intervalMs = 5000) {
  const [status, setStatus] = useState<VideoStatusResponse | null>(null);
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    if (!operationName) return;

    const interval = setInterval(async () => {
      try {
        const res = await getVideoStatus(operationName);
        setStatus(res);
        setErrorCount(0);
        if (res.status === 'completed' || res.status === 'failed') {
          clearInterval(interval);
        }
      } catch (e) {
        setErrorCount(c => c + 1);
        if (errorCount + 1 >= 3) {
          clearInterval(interval);
        }
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [operationName, intervalMs]);

  return status;
}
```

## 5. Estratégia de Testes

| Nível | Escopo | Framework | Cobertura alvo |
|-------|--------|-----------|----------------|
| Unitário (FE) | Lógica de `useVideoPolling`, validações de form | Vitest | Cleanup de interval, transições de estado |
| Unitário (BE) | Validação Pydantic, mock do tool | pytest | Schemas + fluxo mock |
| Integração (BE) | Endpoints `/generate-video` e `/video-status/{op}` com tool mockado | pytest + httpx | Happy path + 4 erros |
| Manual / Smoke | Painel completo end-to-end | — | Geração mock retorna placeholder e player renderiza |
| E2E (futuro) | Geração real com Vertex AI | Playwright | Pós-pluggar Vertex (fora desta spec) |

## 6. Observabilidade

- **Tracing (MLflow)**: cada chamada a `generate_video` cria run com tags `user_id`, `model`, `mode`, `duration_sec`, `latency_total`.
- **Logs estruturados**: backend loga JSON com `operation_name`, `status`, `error_message`.
- **Métricas (futuro)**: Prometheus em `/metrics` — taxa de sucesso, P95 de tempo total, taxa de cancelamento.

## 7. Migração / Compatibilidade

Nenhuma. Feature é puramente aditiva. Não toca:
- Endpoints existentes (`/chat/stream`, `/chat/generate-text`, `/chat/generate-image`, `/chat/enhance-prompt`, `/chat/conversations`).
- Schemas existentes.
- Sistema solar / Skills / Biblioteca / Clientes.
- Auth / Firebase config.
