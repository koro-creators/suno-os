---
spec-id: SPEC-002
slug: video-generation
artefato: spec
nivel-sdd: spec-anchored
tamanho: large
status: rascunho
criada: 2026-04-28
atualizada: 2026-04-28
versao: 1.0
---

# Especificação — Video Generation

## 1. Visão Geral

**O quê**: Adicionar geração de vídeo (text-to-video e image-to-video) via Vertex AI Veo 3.0/3.1 ao sunOS. Frontend ganha um novo painel `VideoGenPanel` análogo ao `ImageGenPanel`, e backend ganha tool `generate_video` + 2 endpoints REST (start + polling).

**Por quê**: Roadmap Phase 16 explicitamente lista "Integrar Vertex AI Veo 3.1 para geração de vídeo". Hoje o produto cobre texto e imagem; vídeo é o próximo eixo do funil de criação publicitária da Suno.

**Para quem**:
- **P2 — Criativo**: gera storyboards animados, mock-ups de filme publicitário, variações rápidas para alinhamento com cliente.
- **P3 — Estrategista**: testa hipóteses visuais antes de envolver agência de produção.

**Escopo incluído**:
- Painel `VideoGenPanel.tsx` em `components/chat/`
- 2 endpoints backend: `POST /chat/generate-video`, `GET /chat/video-status/{operation_name}`
- Tool `generate_video` em `api/chat/tools/video_tools.py` (mock primeiro, Vertex AI Veo depois)
- 5 modelos: Veo 3.1 fast/standard, Veo 3.0 fast/standard, Veo 2
- 2 modos: text-to-video (T2V) e image-to-video (I2V — só Veo 3.x)
- Audio toggle (Veo 3.x suporta áudio nativo)
- Presets de cinema/vlog (4-6 presets)
- Advanced settings (motion intensity, camera movement)
- Polling com progress bar simulada
- Fallback mock se backend offline (mesmo padrão `ImageGenPanel`)

**Escopo excluído** (fora desta spec):
- Editor de vídeo (cortes, transições, timeline)
- Geração de áudio standalone
- Upscale de vídeo
- Persistência de histórico de gerações (vai pra outra spec se necessário)
- Compartilhamento social
- Export para formatos diferentes do MP4 H.264

## 2. Personas e Jornadas

### Persona: Criativo (P2)
- **Perfil**: redator/diretor de arte usando sunOS para acelerar ideação visual
- **Objetivo**: gerar 1-3 mock-ups animados de uma cena descrita em texto, em < 5 minutos
- **Jornada principal**:
  1. Abre `VideoGenPanel` no chat (ou direto se for promovido a página)
  2. Seleciona modo T2V, modelo Veo 3.1 fast (mais rápido)
  3. Digita prompt: "Família abrindo a porta de um apartamento novo, luz dourada de fim de tarde, slow motion, cinematográfico"
  4. Escolhe preset "cinematic", aspect 16:9, duração 6s, audio on
  5. Clica "Gerar" → vê progress bar
  6. Ao completar, faz preview, baixa o MP4

### Persona: Criativo testando I2V
- **Perfil**: mesmo P2, mas já tem uma imagem-base gerada
- **Objetivo**: animar uma imagem existente
- **Jornada**:
  1. Já gerou uma imagem no `ImageGenPanel`
  2. Clica "Animar esta imagem" (ou cola URL no `VideoGenPanel`)
  3. Painel troca para modo I2V, modelo restringe-se a Veo 3.x
  4. Digita motion prompt: "Câmera faz dolly-in lento, vento move folhas ao fundo"
  5. Gera, aguarda, baixa

<!-- REVIEW: A especificação captura o que você realmente quer construir? -->

## 3. Requisitos Funcionais

### RF-01: Painel de Geração de Vídeo
- **Descrição**: Componente `VideoGenPanel.tsx` que permite ao usuário configurar e disparar geração de vídeo.
- **Prioridade**: Alta
- **Regras de negócio**:
  - RN-01: SE `apiAvailable() === false` ENTÃO exibir banner "Requer backend para funcionar. Configure NEXT_PUBLIC_API_URL." e desabilitar botão Gerar.
  - RN-02: SE `prompt.trim() === ''` ENTÃO botão Gerar fica disabled.
  - RN-03: SE `mode === 'i2v'` E `sourceImage === null` ENTÃO botão Gerar fica disabled.
  - RN-04: SE modelo selecionado não suporta áudio (Veo 2) ENTÃO toggle "Audio" fica disabled e forçado para `false`.
  - RN-05: SE `mode === 'i2v'` ENTÃO modelos disponíveis filtram-se para `supportsI2V === true` (apenas Veo 3.x).

### RF-02: Seleção de Modelo
- **Descrição**: Dropdown ou toggles para escolher entre 5 modelos Veo.
- **Prioridade**: Alta
- **Regras de negócio**:
  - RN-06: Default = `veo-3.1-fast`.
  - RN-07: Modelo determina capabilities (`supportsAudio`, `supportsI2V`, `maxResolution`, `maxDurationSec`).
  - RN-08: Se usuário trocar para modelo sem áudio com áudio ligado, áudio é forçado off com toast informativo.

### RF-03: Modo T2V vs I2V
- **Descrição**: Toggle binário no topo do painel.
- **Prioridade**: Alta
- **Regras de negócio**:
  - RN-09: Default = `text-to-video`.
  - RN-10: Em I2V, mostrar `ReferenceUploader` para `sourceImage` (PNG/JPG, max 10MB).
  - RN-11: Em I2V, label do prompt muda para "Motion prompt" e placeholder explica que descreve movimento, não conteúdo.

### RF-04: Configurações
- **Descrição**: Aspect ratio, duração, resolução, audio, preset, advanced.
- **Prioridade**: Alta
- **Regras de negócio**:
  - RN-12: Aspect ratio default = `16:9`. Opções: `16:9 | 9:16 | 1:1`.
  - RN-13: Duração default = 6s. Range: 4-8s (limite Veo).
  - RN-14: Resolução default = `1080p`. Cap pelo `maxResolution` do modelo (Veo 3.x suporta 1080p; Veo 2 cap em 720p).
  - RN-15: Audio toggle visível só se modelo suporta.
  - RN-16: Preset opcional (default = nenhum). Presets injetam tokens no prompt final.
  - RN-17: Advanced settings colapsado por default (accordion).

### RF-05: Geração e Polling
- **Descrição**: Fluxo de start + polling até completar.
- **Prioridade**: Alta
- **Regras de negócio**:
  - RN-18: SE `POST /chat/generate-video` retornar 200 ENTÃO armazenar `operationName` e iniciar polling a cada 5s.
  - RN-19: SE polling retornar `status === 'running'` ENTÃO atualizar progress bar (interpolação por tempo decorrido).
  - RN-20: SE polling retornar `status === 'completed'` ENTÃO mostrar resultado com `videoUrl`, parar polling.
  - RN-21: SE polling retornar `status === 'failed'` ENTÃO mostrar erro, parar polling.
  - RN-22: SE polling retornar erro HTTP 3x consecutivas ENTÃO parar com toast "Conexão perdida".
  - RN-23: SE usuário desmontar componente OU clicar "Cancelar" ENTÃO limpar interval (cleanup).

### RF-06: Resultado e Ações
- **Descrição**: Após completar, exibir vídeo + ações.
- **Prioridade**: Alta
- **Regras de negócio**:
  - RN-24: Player HTML5 nativo com `controls`, autoplay opcional.
  - RN-25: Botão "Baixar" (anchor com `download` attribute) — fetch + blob para forçar download mesmo cross-origin.
  - RN-26: Botão "Gerar variação" — limpa resultado e mantém form, só troca seed.
  - RN-27: Botão "Novo" — limpa tudo.

## 4. Comportamento Especificado

### 4.1 Fluxos Principais

**Fluxo 1: Text-to-Video bem-sucedido**
1. Usuário preenche prompt + escolhe configs
2. Clica "Gerar" → `setLoading(true)`, `setError(null)`, `setResult(null)`
3. Frontend chama `generateVideo(params)` → POST `/chat/generate-video`
4. Backend retorna `{ operation_name, estimated_seconds: 90 }` em < 1s
5. Frontend inicia polling: `useVideoPolling(operation_name, intervalMs=5000)`
6. Cada poll chama `getVideoStatus(operation_name)` → GET `/chat/video-status/{op}`
7. Backend retorna `{ status: 'running', progress: 0.42 }` (ou similar)
8. Frontend interpola progress baseado em tempo decorrido vs estimativa
9. Quando backend retorna `{ status: 'completed', video_url, duration, model, prompt }`, polling para
10. Frontend exibe `<video src={video_url} controls />` + ações

**Fluxo 2: Image-to-Video**
- Idêntico ao Fluxo 1, exceto que `params.mode = 'i2v'` e `params.source_image_base64` é enviado no POST.

**Fluxo 3: Backend offline**
1. `apiAvailable()` retorna false
2. Painel renderiza com banner aviso
3. Botão Gerar fica desabilitado
4. Inputs continuam editáveis (UX previsível)

### 4.2 Fluxos de Erro

| Código | Condição | Resposta ao usuário | Ação do sistema |
|--------|----------|---------------------|-----------------|
| 400 | Prompt vazio ou modelo inválido | Toast "Prompt obrigatório" / "Modelo inválido" | Não chama API; valida no client |
| 401 | JWT expirado | Toast "Sessão expirada" + redirect login | Limpa polling |
| 413 | Imagem I2V > 10MB | Toast "Imagem muito grande (max 10MB)" | Bloqueia submit |
| 429 | Rate limit Vertex Veo | Toast "Limite atingido. Tente em N segundos." | Para polling, mostra `retry_after` |
| 500 | Erro genérico backend | Toast "Falha ao gerar vídeo. Tente novamente." | Para polling, log no console |
| `failed` (status) | Falha do Veo (e.g. policy violation) | Banner com mensagem do backend | Para polling, oferece "Tentar de novo" |
| Polling timeout | > 10 minutos sem completar | Toast "Geração demorou demais" | Para polling, oferece "Continuar verificando" |

### 4.3 Estados e Transições

```
[idle] --click Gerar--> [starting] --POST ok--> [polling] --status=completed--> [done]
                              │                      │
                              │                      └--status=failed--> [error]
                              │                      │
                              │                      └--3x http err--> [error]
                              │                      │
                              │                      └--user cancel--> [idle]
                              │
                              └--POST err--> [error]
```

## 5. Requisitos Não-Funcionais

### RNF-01: Performance
- Endpoint `POST /chat/generate-video` responde em < 1s (apenas dispara operação Vertex).
- Endpoint `GET /chat/video-status/{op}` responde em < 500ms (consulta status Vertex, sem download).
- Polling client-side a cada 5s (não 1s — economiza requests sem prejudicar UX).
- Painel renderiza inicialmente em < 100ms (sem blocking calls).

### RNF-02: Segurança
- Backend valida `model in ALLOWED_MODELS`, `duration in [4, 8]`, `aspect_ratio in {16:9, 9:16, 1:1}`.
- Rate limit no backend: max 5 gerações simultâneas por usuário.
- API key Vertex AI fica em `GCP Secret Manager` (não em `.env`).
- Auth via Firebase JWT obrigatório (mesmo padrão SPEC-001).

### RNF-03: Confiabilidade
- Polling tem backoff: após 3 erros HTTP consecutivos, parar e notificar.
- Cleanup do `setInterval` no `useEffect` cleanup function (sem leaks).
- Cancelamento explícito disponível ao usuário a qualquer momento.

### RNF-04: Acessibilidade
- Inputs com `<label>` adequado.
- Botões com `aria-label` quando icon-only.
- Progress bar com `role="progressbar"` + `aria-valuenow`.
- Player de vídeo com `controls` nativo (a11y por default).

### RNF-05: Internacionalização
- Strings em pt-BR (padrão atual do projeto). Sem i18n nesta fase.

## 6. Interface & Contratos

### 6.1 APIs

#### `POST /chat/generate-video`

**Request body** (`VideoGenRequest`):
```python
class VideoGenRequest(BaseModel):
    prompt: str                              # obrigatório
    mode: Literal["t2v", "i2v"] = "t2v"
    model: str = "veo-3.1-fast"              # veo-3.1-fast | veo-3.1-standard | veo-3.0-fast | veo-3.0-standard | veo-2
    aspect_ratio: Literal["16:9", "9:16", "1:1"] = "16:9"
    duration_sec: int = 6                    # 4-8
    resolution: Literal["720p", "1080p"] = "1080p"
    audio_enabled: bool = False
    source_image_base64: str | None = None   # obrigatório se mode = "i2v"
    preset: str | None = None                # cinematic | vlog | documentary | etc
    motion_intensity: Literal["low", "medium", "high"] = "medium"
    seed: int | None = None
```

**Response 200** (`VideoGenStartResponse`):
```python
class VideoGenStartResponse(BaseModel):
    operation_name: str          # ID Vertex AI ou nosso UUID se mock
    status: Literal["queued", "running"] = "queued"
    estimated_seconds: int       # ETA aproximada
    model: str
```

**Errors**: 400 (validação), 401 (auth), 413 (imagem grande), 429 (rate limit), 500 (genérico).

#### `GET /chat/video-status/{operation_name}`

**Response 200** (`VideoStatusResponse`):
```python
class VideoStatusResponse(BaseModel):
    operation_name: str
    status: Literal["queued", "running", "completed", "failed"]
    progress: float = 0.0                # 0.0 - 1.0 (estimativa)
    video_url: str | None = None         # presente se status=completed
    thumbnail_url: str | None = None     # presente se status=completed
    duration_sec: int | None = None
    error_message: str | None = None     # presente se status=failed
    started_at: str                       # ISO 8601
    completed_at: str | None = None
```

**Errors**: 404 (operation_name desconhecido), 401, 500.

### 6.2 Tipos Compartilhados (Frontend)

```typescript
// lib/api.ts (adicionar)
export interface VideoGenParams {
  prompt: string;
  mode?: 't2v' | 'i2v';
  model?: string;
  aspect_ratio?: '16:9' | '9:16' | '1:1';
  duration_sec?: number;
  resolution?: '720p' | '1080p';
  audio_enabled?: boolean;
  source_image_base64?: string | null;
  preset?: string | null;
  motion_intensity?: 'low' | 'medium' | 'high';
  seed?: number | null;
}

export interface VideoGenStartResponse {
  operation_name: string;
  status: 'queued' | 'running';
  estimated_seconds: number;
  model: string;
}

export interface VideoStatusResponse {
  operation_name: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  video_url: string | null;
  thumbnail_url: string | null;
  duration_sec: number | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export async function generateVideo(params: VideoGenParams): Promise<VideoGenStartResponse>;
export async function getVideoStatus(operationName: string): Promise<VideoStatusResponse>;
```

### 6.3 Catálogo de Modelos (compartilhado)

```typescript
// components/chat/video-models.ts (novo)
export interface VideoModelSpec {
  id: string;
  label: string;
  badge?: string;            // "PRO", "FAST"
  supportsAudio: boolean;
  supportsI2V: boolean;
  maxResolution: '720p' | '1080p';
  maxDurationSec: number;
  estimatedSecPerVideoSec: number;  // pra ETA
}

export const VIDEO_MODELS: VideoModelSpec[] = [
  { id: 'veo-3.1-fast', label: 'Veo 3.1 Fast', badge: 'FAST', supportsAudio: true, supportsI2V: true, maxResolution: '1080p', maxDurationSec: 8, estimatedSecPerVideoSec: 10 },
  { id: 'veo-3.1-standard', label: 'Veo 3.1', supportsAudio: true, supportsI2V: true, maxResolution: '1080p', maxDurationSec: 8, estimatedSecPerVideoSec: 18 },
  { id: 'veo-3.0-fast', label: 'Veo 3.0 Fast', badge: 'FAST', supportsAudio: true, supportsI2V: true, maxResolution: '1080p', maxDurationSec: 8, estimatedSecPerVideoSec: 12 },
  { id: 'veo-3.0-standard', label: 'Veo 3.0', supportsAudio: true, supportsI2V: true, maxResolution: '1080p', maxDurationSec: 8, estimatedSecPerVideoSec: 20 },
  { id: 'veo-2', label: 'Veo 2', supportsAudio: false, supportsI2V: false, maxResolution: '720p', maxDurationSec: 6, estimatedSecPerVideoSec: 15 },
];

export const VIDEO_PRESETS = [
  { id: 'cinematic', label: 'Cinematográfico', tokens: 'cinematic lighting, anamorphic lens, shallow depth of field, film grain' },
  { id: 'vlog', label: 'Vlog', tokens: 'handheld camera, natural lighting, casual framing' },
  { id: 'documentary', label: 'Documentário', tokens: 'observational style, naturalistic, neutral color grade' },
  { id: 'commercial', label: 'Comercial', tokens: 'high contrast, polished, product-focused composition' },
];
```

## 7. Critérios de Aceite

### Frontend
- [ ] **CA-01**: DADO `apiAvailable() === false` QUANDO painel monta ENTÃO banner "Requer backend" aparece e botão Gerar fica desabilitado.
- [ ] **CA-02**: DADO modelo `veo-2` selecionado QUANDO usuário tenta ligar áudio ENTÃO toggle não funciona e tooltip explica.
- [ ] **CA-03**: DADO `mode='i2v'` selecionado QUANDO usuário lista modelos ENTÃO Veo 2 fica oculto (ou disabled).
- [ ] **CA-04**: DADO geração iniciada QUANDO `POST /chat/generate-video` retorna 200 ENTÃO progress bar começa em 0% e cresce ao longo do tempo.
- [ ] **CA-05**: DADO polling em andamento QUANDO usuário desmonta componente ENTÃO `clearInterval` é chamado (verificável via teste).
- [ ] **CA-06**: DADO `status === 'completed'` retornado QUANDO frontend processa ENTÃO `<video>` aparece com `src=video_url` e polling para.
- [ ] **CA-07**: DADO `status === 'failed'` retornado QUANDO frontend processa ENTÃO error banner aparece com `error_message`.
- [ ] **CA-08**: DADO clique em "Baixar" QUANDO vídeo completou ENTÃO download começa (verificar via download attribute).

### Backend
- [ ] **CA-09**: DADO `POST /chat/generate-video` com prompt válido QUANDO requisitado ENTÃO retorna `operation_name` em < 1s.
- [ ] **CA-10**: DADO `mode='i2v'` E `source_image_base64=null` QUANDO requisitado ENTÃO retorna 400 com mensagem clara.
- [ ] **CA-11**: DADO `model` não no allow-list QUANDO requisitado ENTÃO retorna 400.
- [ ] **CA-12**: DADO `GET /chat/video-status/{op}` com op válido QUANDO requisitado ENTÃO retorna status atual.
- [ ] **CA-13**: DADO `GET /chat/video-status/{op}` com op inexistente QUANDO requisitado ENTÃO retorna 404.
- [ ] **CA-14**: DADO tool em modo mock QUANDO chamada ENTÃO retorna URL placeholder válida (mesma estratégia de `image_tools.py`).

### Integração
- [ ] **CA-15**: DADO backend offline QUANDO usuário tenta gerar ENTÃO mensagem de fallback aparece sem crash.
- [ ] **CA-16**: DADO geração concluída QUANDO usuário clica "Animar esta imagem" no `ImageGenPanel` (P2 — opcional) ENTÃO `VideoGenPanel` abre em modo I2V com a imagem pré-carregada.

## 8. Fora de Escopo

- Editor de vídeo (corte, transição, timeline) — futura spec separada.
- Geração de áudio standalone (música, narração).
- Upscale de vídeo gerado (4K, etc.).
- Persistência de histórico de gerações no backend (cada geração é efêmera).
- Compartilhamento social (post direto pra Instagram/YouTube).
- Export de outros formatos além de MP4 H.264.
- Customização avançada de câmera (FOV, distortion) — `motion_intensity` cobre o suficiente para v1.
- Geração em batch (múltiplos vídeos por request).
- Integração com sistema solar / skill chips (vídeo é tool transversal, não skill específica).

## Changelog

| Versão | Data | Mudança |
|--------|------|---------|
| 1.0 | 2026-04-28 | Versão inicial |
