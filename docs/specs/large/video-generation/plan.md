---
spec-id: SPEC-009
slug: video-generation
artefato: plan
atualizada: 2026-05-15
status: rascunho
versao: 1.0
---

# Plano de Implementação — Video Generation

## 1. Stack Tecnológica

| Camada | Tecnologia | Versão | Justificativa |
|--------|-----------|--------|---------------|
| Frontend Component | React + TypeScript | 18 / 5.x | Padrão sunOS |
| HTTP client | fetch nativo | — | Zero dep nova; padrão `lib/api.ts` |
| Polling | `setInterval` em hook | — | ADR-01 |
| Icons | lucide-react | 0.468 | Padrão sunOS |
| Backend API | FastAPI | 0.115+ | Padrão sunos-api |
| Validação | Pydantic v2 | 2.x | Padrão sunos-api |
| Vertex AI SDK | `google-cloud-aiplatform` | latest | Já aprovado SPEC-001 |
| Storage | GCS | — | Sign URLs v4 |
| Tracing | MLflow | já em uso | Padrão sunos-api |

## 2. Fases de Implementação

### Fase 1: Backend Foundation (Estimativa: 1.5 dias)

- **Objetivo**: Schemas Pydantic + tool mock + 2 endpoints rodando
- **Pré-requisitos**: SPEC-001 implementada (estrutura `api/` existe)
- **Entregáveis**:
  - `api/chat/schemas/chat.py` estendido com `VideoGenRequest`, `VideoGenStartResponse`, `VideoStatusResponse`
  - `api/chat/tools/video_tools.py` com `generate_video` e `get_video_status` (mock retornando placeholder)
  - `api/chat/router.py` estendido com `POST /chat/generate-video` e `GET /chat/video-status/{op}`
  - `api/tests/test_video_endpoints.py` (happy path + erros)
  - `uvicorn main:app` responde nos novos endpoints

### Fase 2: Frontend Foundation (Estimativa: 1 dia)

- **Objetivo**: HTTP client + hook de polling com testes
- **Pré-requisitos**: Fase 1 entregável (endpoints respondendo)
- **Entregáveis**:
  - `lib/api.ts` estendido: `generateVideo()`, `getVideoStatus()`, tipos `VideoGenParams`, `VideoGenStartResponse`, `VideoStatusResponse`
  - `hooks/useVideoPolling.ts` com cleanup correto
  - `components/chat/video-models.ts` com `VIDEO_MODELS` e `VIDEO_PRESETS`
  - Teste unitário do hook (mocking timers)

### Fase 3: VideoGenPanel UI (Estimativa: 2 dias)

- **Objetivo**: Painel completo funcionando contra backend mock
- **Pré-requisitos**: Fases 1 + 2
- **Entregáveis**:
  - `components/chat/VideoGenPanel.tsx` (espelhando `ImageGenPanel.tsx`)
  - Sub-componentes inline ou em `components/chat/video/` se ficar > 500 linhas
  - Mode toggle T2V/I2V, ModelSelector, ConfigGrid, PresetSelector, AdvancedSettings
  - Estados: idle / starting / polling / done / error
  - Player de vídeo + Download/Variação/Novo
  - `npx tsc --noEmit` + lint passando

### Fase 4: Integração com ImageGenPanel (Estimativa: 0.5 dia)

- **Objetivo**: Botão "Animar esta imagem" no `ImageGenPanel` abre `VideoGenPanel` em I2V
- **Pré-requisitos**: Fase 3
- **Entregáveis**:
  - Mecanismo de comunicação entre painéis (via prop, context ou URL state — decidir no design review)
  - Pré-carregamento da imagem no `VideoGenPanel` em modo I2V
  - Smoke test manual: clicar gera o fluxo completo

### Fase 5: Vertex AI Real (Estimativa: 2 dias) — opcional v1

- **Objetivo**: Substituir mock por chamada real ao Vertex AI Veo
- **Pré-requisitos**: Fases 1-4 + GCP Service Account com permissão Vertex AI User + GCS buckets criados
- **Entregáveis**:
  - `api/chat/tools/video_tools.py` com `# TODO: Replace mock` removido
  - Configuração `GCP_PROJECT_ID`, `VERTEX_LOCATION`, `GCS_VIDEO_OUTPUT_BUCKET`, `GCS_VIDEO_STAGING_BUCKET` em `api/.env.example`
  - Lifecycle rule no GCS staging bucket (TTL 24h)
  - Smoke test E2E com geração real de 4s
  - MLflow tracing capturando latência total

## 3. Sequência e Dependências

```
Fase 1 (BE) ──► Fase 2 (FE foundation) ──► Fase 3 (UI) ──► Fase 4 (integração)
                                                                  │
                                                                  ▼
                                                          Fase 5 (Vertex real, opcional)
```

Fases 1 e 2 podem ter overlap pequeno (FE pode começar tipos quando BE schema estiver definido).

## 4. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Vertex AI Veo demora mais que esperado para gerar | Alta | Médio | ETA conservadora (15s/seg), polling 5s, cancelamento sempre disponível |
| Quota Vertex AI insuficiente no projeto GCP | Média | Alto | Validar quota antes da Fase 5; documentar como pedir aumento |
| Drift entre catálogo TS e Pydantic allow-list | Média | Baixo | PR template lembra de atualizar ambos; integration test compara |
| Bundle size do FE cresce demais com novo painel | Baixa | Baixo | Painel é < 600 linhas; nenhuma dep nova; lazy-load se necessário |
| GCS signed URL expira durante visualização longa | Baixa | Baixo | TTL de 7 dias é suficiente; cliente pode pedir refresh via novo `GET /video-status/{op}` |
| I2V com imagem muito grande estoura limite Veo | Média | Médio | Validação client (10MB) + backend rejeita 413 |
| Polling ativo quando usuário fecha tab gera carga inútil | Baixa | Baixo | Polling só roda se componente montado; backend é stateless (não há custo extra) |

## 5. Critérios de Pronto (Definition of Done)

- [ ] Todos os critérios de aceite da `spec.md` (CA-01 a CA-16) verificáveis
- [ ] `npx tsc --noEmit` retorna 0 erros
- [ ] `npm run build` (frontend) passa
- [ ] `pytest api/tests/test_video_endpoints.py` passa
- [ ] Painel renderiza com backend offline (fallback) e online (mock)
- [ ] Player de vídeo reproduz placeholder do mock
- [ ] Download funciona em Chrome + Firefox + Safari
- [ ] Documentação atualizada:
  - [ ] `docs/ROADMAP.md` — Phase 16 item "VideoGen" marcado em progresso/completo
  - [ ] `api/CLAUDE.md` — endpoints listados se houver seção de endpoints
  - [ ] Spec marcada como `status: implementada` no frontmatter
- [ ] PR aprovado por 1 revisor humano + code-reviewer agent
- [ ] (Fase 5) Smoke test E2E com Vertex real captura vídeo de 4s e exibe no player
