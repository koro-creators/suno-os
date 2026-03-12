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
├── config.js                  # AGENTS, CLIENTS, API_BASE extraidos
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

---

## Hook: useUpload

### Estado de cada item na fila

```javascript
{
  id: string,              // uuid local
  file: File,              // referencia ao File object
  clientId: string,
  campaignName: string,
  status: "queued" | "uploading" | "processing" | "completed" | "error",
  progress: number,        // 0-100 (upload HTTP = 0-30, processing Gemini = 30-100)
  jobId: string | null,    // retornado pelo backend apos upload
  error: string | null,
  thumbnailUrl: string,    // URL.createObjectURL() para preview local
  fileName: string,
  fileSize: number,        // bytes
  addedAt: Date,
}
```

### Fluxo

1. Usuario seleciona/dropa arquivo(s) → `useUpload.addFiles(files, clientId, campaignName)`
2. Validacao: mime (`video/*`), tamanho (<=2GB). Gera thumbnail via `<video>` + `<canvas>`
3. Adiciona a fila com status `queued`
4. Fila processa automaticamente (max 2 uploads simultaneos)
5. Status → `uploading`, `POST /ingest/upload` (multipart, XMLHttpRequest com onUploadProgress)
6. Progress 0-30% = upload HTTP
7. Backend retorna `{ job_id }`, status → `processing`
8. Inicia polling `GET /ingest/status/{job_id}` a cada 3s
9. Progress 30-100% = mapeado do campo `progress` do backend
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

---

## Hook: useIngestStatus

Polling de videos ja indexados para a tela de ingestao.

```javascript
const {
  videos,    // VideoStatus[] — lista de videos do backend
  loading,   // boolean
  refresh,   // () => void — força refresh imediato
} = useIngestStatus(clientId);
```

- Faz `GET /videos?client_id=X` ao montar e a cada 5s enquanto houver videos `processing`/`queued`
- Para o polling quando todos estao `completed` ou `error`

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

### Restricoes

- Apenas no agente VideoRAG (outros agentes nao mostram o botao)
- Upload falhou → card mostra erro + "Tentar novamente"

---

## Tela de Ingestao (IngestView)

### Secoes

1. **Header** — Titulo, cliente selecionado, contadores (indexados, em processamento)
2. **UploadZone** — Drag & drop com destaque visual ao arrastar. File picker ao clicar
3. **Campo Campanha** — Input de texto, aplica `campaign_name` aos uploads novos
4. **Fila de Upload** — Uploads em andamento/aguardando. VideoCard com progresso. Botao X para cancelar
5. **Videos Indexados** — Lista de videos processados via `GET /videos?client_id=X`. Badge de status. Retry em erros
6. **Placeholder Google Drive** — Botao desabilitado "Conectar Google Drive" com "Em breve"

### Polling

- Enquanto houver videos `processing`/`queued`, polling a cada 5s
- Todos `completed`/`error` → polling para

---

## Preparacao para Google Drive (Fase 2)

### Pattern de Sources

```javascript
const SOURCES = [
  { id: "local", label: "Upload Local", icon: Upload, enabled: true },
  { id: "google-drive", label: "Google Drive", icon: HardDrive, enabled: false },
];
```

### O que existe na fase 1 para facilitar fase 2

1. **VideoCard generico** — Funciona igual para upload local e Drive
2. **useIngestStatus separado** — Independente da fonte
3. **Secao de videos indexados unica** — Todos juntos, badge pequeno de fonte
4. **Placeholder de Drive** — Botao desabilitado, habilitar na fase 2

### O que NAO fazer na fase 1

- Nao criar abstracoes de "connector" no backend
- Nao adicionar rotas `/drive/*`
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

## Endpoints Backend Utilizados (sem mudancas)

| Endpoint | Metodo | Uso |
|----------|--------|-----|
| `/ingest/upload` | POST (multipart) | Upload de video com `file`, `client_id`, `campaign_name` |
| `/ingest/status/{job_id}` | GET | Polling de status/progresso de um job |
| `/videos` | GET `?client_id=X` | Lista videos indexados por cliente |
| `/agent/chat` | POST (SSE) | Chat com agente apos ingestao concluida |
| `/health` | GET | Status da API |

---

## Validacoes de Upload

| Aspecto | Regra | Mensagem de Erro |
|---------|-------|------------------|
| Tipo | `video/mp4`, `video/quicktime`, `video/x-msvideo`, `video/webm` | "Formato nao suportado. Use MP4, MOV, AVI ou WebM" |
| Tamanho | <= 2GB (2147483648 bytes) | "Arquivo muito grande. Maximo 2GB" |
| Quantidade | Sem limite, fila gerenciada | - |
| Duplicata | Permite (mesmo nome, job_id diferente pelo timestamp) | - |
