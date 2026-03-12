# Spec — Video Upload no Koro Studio

---
spec-id: KORO-STUDIO-001
slug: video-upload
status: aprovada
data: 2026-03-12
---

## Resumo

**O que:** Implementar upload de videos no Koro Studio com duas superficies: (1) botao de anexo no chat do agente VideoRAG, que permite enviar video + mensagem e receber analise automatica, e (2) tela dedicada de ingestao acessivel pela sidebar, com drag & drop, fila de uploads, thumbnails, status em tempo real e preparacao para Google Drive (fase 2).

**Por que:** Hoje o upload de videos so e possivel via curl/API direta (`POST /ingest/upload`). O frontend nao tem nenhuma interface para enviar videos — o usuario precisa usar o terminal. Isso bloqueia a adocao pelo time criativo e clientes piloto.

**Para quem:** Time Koro Creators + clientes piloto (Santander, Vivo).

**Escopo:** Apenas frontend (React). O backend ja tem todos os endpoints necessarios. Nenhuma mudanca no backend nesta fase.

---

## Decisoes Arquiteturais

| Decisao | Escolha | Alternativa | Justificativa |
|---------|---------|-------------|---------------|
| Estrutura de arquivos | Componentizada com Views | Monolitica (tudo em App.jsx) | App.jsx ja tem ~500 linhas. Componentizar prepara para Google Drive fase 2 |
| Navegacao | View switching via state | React Router | Apenas 2 views. Router e over-engineering agora, migracao futura e simples |
| Thumbnails | Gerados no browser via `<video>` + `<canvas>` | Backend serve thumbs | Zero mudanca no backend. Drive API fornece thumbs na fase 2 |
| Validacao de arquivos | Frontend-only | Backend + Frontend | Backend ja aceita qualquer UploadFile. Validacao frontend para UX rapido |
| Concorrencia de upload | Max 2 simultaneos, fila local | Sem limite | Evita saturar conexao. Backend processa 1 por vez (Gemini rate limits) |
| Progresso | XMLHttpRequest onUploadProgress + polling | Fetch API | Fetch nao suporta upload progress nativo |

---

## Estrutura de Arquivos

```
src/
├── App.jsx                    # Shell: sidebar + view switching
├── App.css                    # Estilos do shell e sidebar (refatorado)
├── index.css                  # Design tokens (existente, expandido)
├── config.js                  # Constantes extraidas do App.jsx
├── views/
│   ├── ChatView.jsx           # Chat atual extraido do App.jsx
│   ├── ChatView.css
│   ├── IngestView.jsx         # Tela dedicada de ingestao
│   └── IngestView.css
├── components/
│   ├── upload/
│   │   ├── UploadZone.jsx     # Drag & drop + file picker
│   │   ├── UploadQueue.jsx    # Lista de uploads em andamento
│   │   ├── VideoCard.jsx      # Card de video (thumbnail, status, progresso)
│   │   └── upload.css
│   ├── chat/
│   │   ├── ChatAttachment.jsx # Botao de anexo no input + card inline
│   │   └── chat-attachment.css
│   └── ui/
│       ├── ProgressBar.jsx    # Barra de progresso reutilizavel
│       └── StatusBadge.jsx    # Badge colorido por status
├── hooks/
│   ├── useUpload.js           # Logica de upload: fila, progress, polling
│   └── useIngestStatus.js     # Polling de status via /ingest/status
└── helpers/
    └── markdown.js            # parseMarkdown() extraido
```

### config.js — Exports

```javascript
// config.js — extraido do App.jsx
export const API_BASE = "https://videorag-api-mx3edyv2za-uc.a.run.app";

export const AGENTS = [
  { id: "videorag", label: "VideoRAG", icon: "Play", system: "...", placeholder: "...", hint: "..." },
  { id: "copy",     label: "Copy",     icon: "PenTool", ... },
  { id: "persona",  label: "Persona",  icon: "UserRound", ... },
  { id: "roteiro",  label: "Roteiro",  icon: "Clapperboard", ... },
  { id: "brief",    label: "Brief",    icon: "FileSearch", ... },
];

export const CLIENTS = ["santander", "vivo", "americanas", "mrv", "sicredi", "bmg", "stone"];

export const FALLBACKS = {
  videorag: "...",
  copy: "...",
  persona: "...",
  roteiro: "...",
  brief: "...",
};
```

**Nota:** Os icons sao referenciados como strings em config.js e resolvidos para componentes lucide-react no App.jsx via mapeamento. Isso permite que config.js nao tenha dependencia de React.

### App.jsx — View Switching

```javascript
// Novo state no App.jsx
const [view, setView] = useState("chat"); // "chat" | "ingest"

// No render, a area principal alterna:
{view === "chat" ? <ChatView ... /> : <IngestView ... />}
```

---

## Hook: useUpload

### Estado de cada item na fila

```javascript
{
  id: string,              // uuid local (crypto.randomUUID())
  file: File,              // referencia ao File object
  clientId: string,
  campaignName: string,
  status: "queued" | "uploading" | "processing" | "completed" | "error",
  progress: number,        // 0-100 (upload HTTP = 0-30, processing Gemini = 30-100)
  jobId: string | null,    // retornado pelo backend apos upload
  error: string | null,
  thumbnailUrl: string,    // URL.createObjectURL() ou null para formatos sem suporte
  fileName: string,
  fileSize: number,        // bytes
  addedAt: Date,
}
```

**Nota sobre status:** `"uploading"` e um estado exclusivamente do frontend, representando a fase de transferencia HTTP. O backend nunca retorna este status — seus valores possiveis sao: `"queued"`, `"processing"`, `"completed"`, `"error"`.

### Fluxo

1. Usuario seleciona/dropa arquivo(s) → `useUpload.addFiles(files, clientId, campaignName)`
2. Validacao: mime (`video/*`), tamanho (<=500MB — ver secao Validacoes). Gera thumbnail via `<video>` + `<canvas>` (fallback para icone generico se browser nao suportar o formato)
3. Adiciona a fila com status `queued`
4. Fila processa automaticamente (max 2 uploads simultaneos)
5. Status → `uploading`, `POST /ingest/upload` (multipart, XMLHttpRequest com onUploadProgress)
6. Progress 0-30% = upload HTTP
7. Backend retorna resposta completa (ver secao Contratos Backend), status → `processing`
8. Inicia polling `GET /ingest/status/{job_id}` a cada 3s
   - **Nota:** `job_id` contem dois-pontos (formato `{client_id}:{video_stem}`). O backend usa `{job_id:path}` que aceita este formato sem necessidade de encoding especial.
9. Progress 30-100% = mapeado do campo `progress` do backend (backend reporta 0-100, frontend mapeia para 30-100)
10. Polling detecta `completed` ou `error`, para o polling desse job

### API do hook

```javascript
const {
  queue,           // UploadItem[]
  addFiles,        // (files: FileList, clientId: string, campaignName: string) => void
  cancelItem,      // (id: string) => void
  retryItem,       // (id: string) => void
  clearCompleted,  // () => void
} = useUpload();
```

### Comportamento de cancelItem

| Status do item | Acao |
|---------------|------|
| `queued` | Remove da fila local. Nenhuma chamada ao backend. |
| `uploading` | Aborta o XMLHttpRequest (`xhr.abort()`), remove da fila. |
| `processing` | **Nao cancelavel.** O backend nao tem endpoint de cancelamento. Esconder o botao de cancelar quando status e `processing`. |
| `completed` / `error` | N/A — botao de cancelar nao aparece. |

### Comportamento de retryItem

- Disponivel apenas para itens com status `error`.
- Re-enfileira o item usando a referencia original ao `File` object.
- Reseta `progress` para 0, `status` para `queued`, `error` para `null`.
- Preserva `jobId` anterior (o backend sobrescreve o job no Firestore com o mesmo `job_id`).

### Estrategia de Polling com Erro

- Se o polling de `/ingest/status/{job_id}` falhar (rede, 5xx), incrementa contador de falhas.
- Apos **3 falhas consecutivas**: reduz frequencia para 15s e mostra aviso nao-bloqueante ("Conexao instavel, tentando reconectar...").
- Ao recuperar (resposta 200): reseta contador, volta para 3s, remove aviso.
- Apos **10 falhas consecutivas**: para o polling e mostra mensagem com botao "Tentar novamente".

---

## Hook: useIngestStatus

Polling de videos ja indexados para a tela de ingestao.

```javascript
const {
  videos,    // VideoStatus[] — lista de videos do backend
  loading,   // boolean
  error,     // string | null — mensagem de erro de polling
  refresh,   // () => void — forca refresh imediato
} = useIngestStatus(clientId);
```

- Faz `GET /videos?client_id=X` ao montar e a cada 5s enquanto houver videos `processing`/`queued`
- Para o polling quando todos estao `completed` ou `error`
- Mesma estrategia de erro do useUpload: backoff apos 3 falhas, parada apos 10

---

## Contratos Backend (endpoints existentes, sem mudancas)

### POST /ingest/upload

**Request:** Multipart form data
- `file`: arquivo de video (UploadFile)
- `client_id`: string (form field, default "default")
- `campaign_name`: string (form field, default "")

**Response (200):**
```json
{
  "job_id": "santander:campanha-verao-30s",
  "filename": "campanha-verao-30s.mp4",
  "size_mb": 45.2,
  "status": "queued"
}
```

### GET /ingest/status/{job_id}

**Response (200):**
```json
{
  "status": "processing",
  "video": "campanha-verao-30s.mp4",
  "client_id": "santander",
  "campaign_name": "Campanha Verao 2026",
  "progress": 70,
  "ingested_at": null,
  "error": null
}
```

### GET /videos?client_id=X

**Response (200):** Array de objetos com mesma shape do ingest/status.

### POST /agent/chat

**Request:**
```json
{
  "thread_id": "santander:user-1710259200000",
  "client_id": "santander",
  "agent_id": "videorag",
  "message": "[Video: campanha-verao-30s.mp4] Analise os pontos fortes desse filme"
}
```

**Response:** StreamingResponse (SSE) com chunks `data: {"text": "..."}\n\n` e `data: [DONE]\n\n`.

---

## Botao de Anexo no Chat (ChatAttachment)

### Comportamento

- Aparece apenas quando o agente ativo e **VideoRAG**
- Icone de clipe a esquerda do textarea
- Ao selecionar arquivo(s), cards de preview aparecem acima do textarea (removiveis com X)
- Ao enviar:
  1. Mensagem do usuario aparece no chat com referencia ao video
  2. Card de progresso aparece como mensagem do sistema
  3. Upload HTTP → Processing → Completed
  4. Ao completar, dispara `POST /agent/chat` com a mensagem do usuario
  5. Resposta do agente em streaming
- Se nenhuma mensagem escrita, usa default: "Analise este video em detalhes"

### Referencia ao video na mensagem do agente

Apos a ingestao completar, o video esta indexado no Qdrant. O agente VideoRAG usa RAG para buscar chunks relevantes. Para garantir que a pergunta do usuario esteja semanticamente ligada ao video recem-ingerido, o frontend **prepende o nome do arquivo a mensagem**:

```
[Video: campanha-verao-30s.mp4] Analise os pontos fortes desse filme
```

O agente VideoRAG busca chunks no Qdrant por similaridade semantica. Como o nome do arquivo e parte do payload indexado (`video_id`), isso aumenta a relevancia dos resultados para o video correto.

### Restricoes

- Apenas no agente VideoRAG (outros agentes nao mostram o botao)
- Upload falhou → card mostra erro + "Tentar novamente"

---

## Tela de Ingestao (IngestView)

### Secoes

1. **Header** — Titulo, cliente selecionado, contadores (indexados, em processamento)
2. **UploadZone** — Drag & drop com destaque visual ao arrastar. File picker ao clicar
3. **Campo Campanha** — Input de texto, aplica `campaign_name` aos uploads novos
4. **Fila de Upload** — Uploads em andamento/aguardando. VideoCard com progresso. Botao X para cancelar (apenas status `queued` e `uploading`)
5. **Videos Indexados** — Lista de videos processados via `GET /videos?client_id=X`. Badge de status. Retry em erros
6. **Placeholder Google Drive** — Botao desabilitado "Conectar Google Drive" com tooltip "Em breve"

### Polling

- Enquanto houver videos `processing`/`queued`, polling a cada 5s
- Todos `completed`/`error` → polling para
- Estrategia de erro: backoff apos 3 falhas, parada apos 10 (mesma do useUpload)

---

## Preparacao para Google Drive (Fase 2)

### Abordagem

Em vez de criar uma abstracao de "sources" prematuramente, a fase 1 implementa apenas um botao desabilitado "Conectar Google Drive" na IngestView. Quando a fase 2 for implementada, a estrutura de componentes (VideoCard, useIngestStatus) ja e reutilizavel, e o DriveSection pode ser adicionado como componente independente sem necessidade de refatorar.

### O que existe na fase 1 para facilitar fase 2

1. **VideoCard generico** — Funciona igual para upload local e Drive
2. **useIngestStatus separado** — Independente da fonte
3. **Secao de videos indexados unica** — Todos juntos, badge pequeno de fonte
4. **Placeholder de Drive** — Botao desabilitado, habilitar na fase 2

### O que NAO fazer na fase 1

- Nao criar abstracoes de "connector" ou "source provider" no frontend
- Nao criar rotas `/drive/*` no backend
- Nao adicionar `google-api-python-client`

---

## Design Visual

### Tokens de Status (adicionar a index.css)

```css
--color-status-queued: #A1A1AA;
--color-status-uploading: #3B82F6;
--color-status-processing: #F59E0B;
--color-status-completed: #22C55E;
--color-status-error: #EF4444;
```

### VideoCard

- Thumbnail: 120x68px (16:9), `radius-md`, icone play centralizado com overlay
- Fallback: se browser nao suportar o formato de video para gerar thumb (ex: AVI), mostrar icone de video generico com background `--color-hover`
- Status badge: dot colorido + texto
- Barra de progresso: 4px altura, cor muda com status (azul → amarelo → verde)
- Hover: `shadow-md`, border muda
- Erro: borda esquerda vermelha 4px, botao "Retry"

### UploadZone

- Padrao: border 2px dashed `--color-border`, background `--color-bg`
- Drag-over: border 2px solid `--color-accent`, background `rgba(accent, 0.04)`, border pulsa

### Animacoes

- Upload progress: `transition: width 300ms ease`
- Processing: dot pulsa (reutiliza `dotPulse`)
- Completed: fade-in check verde
- Card de fila: `fadeUp` ao entrar, collapse suave ao completar
- Drag-over: border pulsa com keyframes

### Responsivo (mobile)

- UploadZone: full-width, botao mais proeminente
- VideoCard: thumbnail menor (80x45px), info em 2 linhas
- Fila e lista: scroll vertical, cards empilhados

---

## Validacoes de Upload

| Aspecto | Regra | Mensagem de Erro |
|---------|-------|------------------|
| Tipo | `video/mp4`, `video/quicktime`, `video/x-msvideo`, `video/webm` | "Formato nao suportado. Use MP4, MOV, AVI ou WebM" |
| Tamanho | <= 500MB (524288000 bytes) | "Arquivo muito grande. Maximo 500MB" |
| Quantidade | Sem limite, fila gerenciada | - |
| Duplicata | Permite — ver nota abaixo | - |

### Nota sobre tamanho maximo

O limite e 500MB (nao 2GB) porque o backend le o arquivo inteiro em memoria (`await file.read()` no endpoint `/ingest/upload`). Cloud Run com 2GB de memoria nao comporta uploads de 2GB. Para suportar arquivos maiores no futuro, o backend precisaria de streaming file reception (chunked upload), o que esta fora do escopo desta spec.

### Nota sobre duplicatas

O backend gera `job_id` como `{client_id}:{filename_stem}` — sem timestamp ou UUID. Dois uploads do mesmo arquivo para o mesmo cliente produzem o **mesmo job_id**, e o segundo sobrescreve o status do primeiro no Firestore. O frontend deve mostrar um aviso nao-bloqueante quando o usuario tentar enviar um arquivo cujo nome ja existe na lista de videos indexados: "Um video com este nome ja foi processado. Enviar novamente vai substituir a analise anterior." O usuario pode prosseguir mesmo assim.

---

## Limitacoes Conhecidas

| Limitacao | Impacto | Mitigacao futura |
|-----------|---------|------------------|
| Tamanho max 500MB | Videos longos (>5 min em 4K) podem exceder | Backend streaming upload |
| Sem thumbnail para AVI | Icone generico em vez de preview | Converter AVI no backend ou gerar thumb server-side |
| job_id sem UUID | Duplicatas sobrescrevem | Backend: append timestamp ao job_id |
| Sem preview de video inline | Usuario nao pode assistir o video na plataforma | Player de video na IngestView (fase futura) |
