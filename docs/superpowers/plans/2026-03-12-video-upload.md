# Video Upload Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add video upload to Koro Studio with chat attachment (VideoRAG agent) and dedicated ingest view with drag & drop, thumbnails, and progress tracking.

**Architecture:** Componentized React app with view switching via state. Extract monolithic App.jsx into shell + views. Shared hooks (useUpload, useIngestStatus) power both surfaces. No backend changes — all endpoints already exist.

**Tech Stack:** React 19, Vite 8, lucide-react, vanilla CSS with design tokens. No test framework (verification via `npm run build` + `npm run dev`).

**Spec:** `docs/superpowers/specs/2026-03-12-video-upload-design.md`

**Working directory:** `/Users/heitormiranda/projects/koro/koro-studio`

---

## Chunk 1: Foundation — Tokens, Config, Helpers, UI Primitives

### Task 1: Add status tokens to index.css

**Files:**
- Modify: `src/index.css:3-33`

- [ ] **Step 1: Add status color tokens**

Add after line 16 (`--color-offline: #EF4444;`):

```css
  --color-status-queued: #A1A1AA;
  --color-status-uploading: #3B82F6;
  --color-status-processing: #F59E0B;
  --color-status-completed: #22C55E;
  --color-status-error: #EF4444;
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/heitormiranda/projects/koro/koro-studio && npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat: add status color tokens to design system"
```

---

### Task 2: Extract config.js from App.jsx

**Files:**
- Create: `src/config.js`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create config.js**

Create `src/config.js` with all constants extracted from App.jsx. Icons are stored as string keys to avoid React dependency in config:

```javascript
export const API_BASE = "https://videorag-api-mx3edyv2za-uc.a.run.app";

export const AGENTS = [
  {
    id: "videorag",
    label: "VideoRAG",
    iconName: "Play",
    system:
      "Você é um assistente especializado em análise de vídeos publicitários indexados. Responda com base nos vídeos disponíveis, citando timestamps e elementos visuais relevantes.",
    placeholder: "Pergunte sobre os vídeos indexados...",
    hint: "Análise de campanhas em vídeo",
  },
  {
    id: "copy",
    label: "Copy",
    iconName: "PenTool",
    system:
      "Você é um redator publicitário sênior especializado em campanhas brasileiras. Gere copies impactantes, diretos e adequados ao canal solicitado. Entregue sempre variações.",
    placeholder: "Descreva o produto, tom e canal...",
    hint: "Geração de textos publicitários",
  },
  {
    id: "persona",
    label: "Persona",
    iconName: "UserRound",
    system:
      "Você é um simulador de personas sintéticas para pesquisa de marketing. Incorpore completamente a persona descrita e responda como ela — com suas dores, linguagem, objeções e desejos reais. Nunca quebre o personagem.",
    placeholder: "Descreva a persona ou solicite uma simulação...",
    hint: "Simulação de consumidor sintético",
  },
  {
    id: "roteiro",
    label: "Roteiro",
    iconName: "Clapperboard",
    system:
      "Você é um diretor criativo e roteirista especializado em filmes publicitários brasileiros. Crie roteiros estruturados com cenas numeradas, diálogos, direção de arte, trilha sonora sugerida e indicações técnicas de câmera.",
    placeholder: "Descreva o conceito, produto e duração...",
    hint: "Roteiros e filmes publicitários",
  },
  {
    id: "brief",
    label: "Brief",
    iconName: "FileSearch",
    system:
      "Você é um estrategista de marketing especializado em análise e destrinchamento de briefs. Identifique gaps, oportunidades não exploradas, públicos-alvo, tom de voz ideal, KPIs relevantes e proponha perguntas que o cliente ainda não fez.",
    placeholder: "Cole ou descreva o brief aqui...",
    hint: "Análise e estruturação de briefs",
  },
];

export const CLIENTS = [
  "santander",
  "vivo",
  "americanas",
  "mrv",
  "sicredi",
  "bmg",
  "stone",
];

export const FALLBACKS = {
  videorag:
    "Com base nos vídeos indexados, a campanha estrutura sua narrativa em três arcos emocionais com paleta cromática consistente.",
  copy: 'Aqui estão três variações para mídia social:\n\n**Emocional:** "Você não está comprando um apartamento. Está construindo o lugar onde sua família vai crescer."\n\n**Racional:** "Crédito Imobiliário: taxa a partir de 8,99% a.a. + TR. Simule em 2 minutos."\n\n**Urgência:** "Condições especiais só até 31/03. Simule agora."',
  persona:
    "Oi. Sou a Fernanda, 41 anos, professora em Campinas. Quero sair do aluguel, mas toda vez que pesquiso sobre financiamento, fico perdida.",
  roteiro:
    '**ROTEIRO — "O DIA QUE SEMPRE FOI SEU"**\n*Filme 30" · Crédito Imobiliário*\n\n**CENA 1** — Close de chave de aluguel sendo devolvida.\n**CENA 2** — A mesma mão abre uma porta diferente. Chave nova.\n**CENA 3** — Família entra, olha ao redor. Silêncio. Sorriso.',
  brief:
    "**DIAGNÓSTICO DO BRIEF**\n\nGaps identificados:\n— Nenhuma diferenciação competitiva declarada\n— Tom genérico, sem voz de marca definida\n— Público-alvo amplo demais\n\nOportunidade: o medo de endividamento é o maior freio de conversão — o brief não o endereça.",
};

export const VALID_VIDEO_MIMES = [
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/webm",
];

export const MAX_FILE_SIZE = 524288000; // 500MB
export const MAX_CONCURRENT_UPLOADS = 2;
export const POLL_INTERVAL_NORMAL = 3000;
export const POLL_INTERVAL_BACKOFF = 15000;
export const POLL_FAILURE_BACKOFF_THRESHOLD = 3;
export const POLL_FAILURE_STOP_THRESHOLD = 10;
export const INGEST_POLL_INTERVAL = 5000;
```

- [ ] **Step 2: Update App.jsx to import from config.js**

Replace the config section (lines 1-85) of App.jsx. Remove the inline constants and import from config. Create an icon map to resolve string names to components:

```javascript
import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  PenTool,
  UserRound,
  Clapperboard,
  FileSearch,
  Menu,
  X,
} from "lucide-react";
import { API_BASE, AGENTS, CLIENTS, FALLBACKS } from "./config";
import "./App.css";

const ICON_MAP = { Play, PenTool, UserRound, Clapperboard, FileSearch };
function getAgentIcon(agent) {
  return ICON_MAP[agent.iconName] || Play;
}
```

Then update all references:
- Replace `agent.icon` with `getAgentIcon(agent)` wherever used
- Line 265: `const AgentIcon = getAgentIcon(agent);`
- Line 354: `const Icon = getAgentIcon(ag);`

- [ ] **Step 3: Verify build and dev server**

Run: `npm run build && npm run dev`
Expected: Build succeeds. Dev server starts. App behaves identically to before.

- [ ] **Step 4: Commit**

```bash
git add src/config.js src/App.jsx
git commit -m "refactor: extract config constants from App.jsx"
```

---

### Task 3: Extract helpers/markdown.js

**Files:**
- Create: `src/helpers/markdown.js`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create helpers/markdown.js**

```javascript
export function parseMarkdown(text) {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");
}
```

- [ ] **Step 2: Update App.jsx**

Remove the `parseMarkdown` function (lines 89-99) and add import:
```javascript
import { parseMarkdown } from "./helpers/markdown";
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/helpers/markdown.js src/App.jsx
git commit -m "refactor: extract parseMarkdown to helpers/markdown.js"
```

---

### Task 4: Create UI primitives — ProgressBar and StatusBadge

**Files:**
- Create: `src/components/ui/ProgressBar.jsx`
- Create: `src/components/ui/StatusBadge.jsx`
- Create: `src/components/ui/ui.css`

- [ ] **Step 1: Create ProgressBar.jsx**

```jsx
import "./ui.css";

const STATUS_COLORS = {
  queued: "var(--color-status-queued)",
  uploading: "var(--color-status-uploading)",
  processing: "var(--color-status-processing)",
  completed: "var(--color-status-completed)",
  error: "var(--color-status-error)",
};

export default function ProgressBar({ progress = 0, status = "queued" }) {
  const color = STATUS_COLORS[status] || STATUS_COLORS.queued;
  return (
    <div className="progress-bar" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}>
      <div
        className="progress-bar-fill"
        data-status={status}
        style={{ width: `${Math.min(100, Math.max(0, progress))}%`, backgroundColor: color }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Create StatusBadge.jsx**

```jsx
import "./ui.css";

const STATUS_LABELS = {
  queued: "Na fila",
  uploading: "Enviando",
  processing: "Processando",
  completed: "Concluído",
  error: "Erro",
};

export default function StatusBadge({ status = "queued", label }) {
  return (
    <span className="status-badge" data-status={status}>
      <span className="status-badge-dot" data-status={status} />
      <span className="status-badge-label">{label || STATUS_LABELS[status]}</span>
    </span>
  );
}
```

- [ ] **Step 3: Create ui.css**

```css
/* ── ProgressBar ────────────────────────────────────────────── */

.progress-bar {
  width: 100%;
  height: 4px;
  background: var(--color-border-light);
  border-radius: 2px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 300ms ease;
}

.progress-bar-fill[data-status="processing"] {
  animation: progressPulse 1.5s ease-in-out infinite;
}

@keyframes progressPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* ── StatusBadge ────────────────────────────────────────────── */

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.status-badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-badge-dot[data-status="queued"] { background: var(--color-status-queued); }
.status-badge-dot[data-status="uploading"] { background: var(--color-status-uploading); }
.status-badge-dot[data-status="processing"] {
  background: var(--color-status-processing);
  animation: dotPulse 1.2s ease-in-out infinite;
}
.status-badge-dot[data-status="completed"] { background: var(--color-status-completed); }
.status-badge-dot[data-status="error"] { background: var(--color-status-error); }

.status-badge-label {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.3px;
  color: var(--color-muted);
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds (components not yet mounted, just importable).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/
git commit -m "feat: add ProgressBar and StatusBadge UI components"
```

---

## Chunk 2: Hooks — useUpload and useIngestStatus

### Task 5: Create helpers for thumbnail generation and file validation

**Files:**
- Create: `src/helpers/video.js`

- [ ] **Step 1: Create video.js**

```javascript
import { VALID_VIDEO_MIMES, MAX_FILE_SIZE } from "../config";

export function validateVideoFile(file) {
  if (!VALID_VIDEO_MIMES.includes(file.type)) {
    return { valid: false, error: "Formato não suportado. Use MP4, MOV, AVI ou WebM." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: "Arquivo muito grande. Máximo 500MB." };
  }
  return { valid: true, error: null };
}

export function generateThumbnail(file) {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    const cleanup = () => {
      URL.revokeObjectURL(objectUrl);
      video.remove();
    };

    video.onloadeddata = () => {
      video.currentTime = Math.min(1, video.duration / 4);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 240;
        canvas.height = 136;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        cleanup();
        resolve(dataUrl);
      } catch {
        cleanup();
        resolve(null);
      }
    };

    video.onerror = () => {
      cleanup();
      resolve(null);
    };

    // Timeout fallback for formats browsers can't play (e.g., AVI)
    setTimeout(() => {
      if (!video.seekable.length) {
        cleanup();
        resolve(null);
      }
    }, 3000);
  });
}

export function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/helpers/video.js
git commit -m "feat: add video validation, thumbnail generation, and size formatting helpers"
```

---

### Task 6: Create useUpload hook

**Files:**
- Create: `src/hooks/useUpload.js`

This is the core hook. It manages the upload queue, XMLHttpRequest uploads with progress, and polling for backend processing status.

- [ ] **Step 1: Create useUpload.js**

```javascript
import { useState, useCallback, useRef, useEffect } from "react";
import {
  API_BASE,
  MAX_CONCURRENT_UPLOADS,
  POLL_INTERVAL_NORMAL,
  POLL_INTERVAL_BACKOFF,
  POLL_FAILURE_BACKOFF_THRESHOLD,
  POLL_FAILURE_STOP_THRESHOLD,
} from "../config";
import { validateVideoFile, generateThumbnail } from "../helpers/video";

function createUploadItem(file, clientId, campaignName) {
  return {
    id: crypto.randomUUID(),
    file,
    clientId,
    campaignName,
    status: "queued",
    progress: 0,
    jobId: null,
    error: null,
    thumbnailUrl: null,
    fileName: file.name,
    fileSize: file.size,
    addedAt: new Date(),
  };
}

export default function useUpload() {
  const [queue, setQueue] = useState([]);
  const xhrMap = useRef(new Map());
  const pollingMap = useRef(new Map());
  const failureCountMap = useRef(new Map());

  // --- Helpers to update a single item in the queue ---
  const updateItem = useCallback((id, updates) => {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }, []);

  const removeItem = useCallback((id) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // --- Polling for backend processing status ---
  const startPolling = useCallback(
    (id, jobId) => {
      if (pollingMap.current.has(id)) return;
      failureCountMap.current.set(id, 0);

      const poll = async () => {
        try {
          const res = await fetch(`${API_BASE}/ingest/status/${jobId}`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();

          failureCountMap.current.set(id, 0);

          const backendProgress = data.progress || 0;
          const mappedProgress = 30 + Math.round(backendProgress * 0.7);

          if (data.status === "completed") {
            updateItem(id, { status: "completed", progress: 100 });
            stopPolling(id);
            return;
          }

          if (data.status === "error") {
            updateItem(id, { status: "error", error: data.error || "Erro no processamento", progress: mappedProgress });
            stopPolling(id);
            return;
          }

          updateItem(id, { progress: mappedProgress });
        } catch {
          const failures = (failureCountMap.current.get(id) || 0) + 1;
          failureCountMap.current.set(id, failures);

          if (failures >= POLL_FAILURE_STOP_THRESHOLD) {
            updateItem(id, { status: "error", error: "Conexão perdida. Tente novamente." });
            stopPolling(id);
            return;
          }
        }

        // Schedule next poll
        const failures = failureCountMap.current.get(id) || 0;
        const interval = failures >= POLL_FAILURE_BACKOFF_THRESHOLD ? POLL_INTERVAL_BACKOFF : POLL_INTERVAL_NORMAL;
        const timer = setTimeout(poll, interval);
        pollingMap.current.set(id, timer);
      };

      const timer = setTimeout(poll, POLL_INTERVAL_NORMAL);
      pollingMap.current.set(id, timer);
    },
    [updateItem]
  );

  const stopPolling = useCallback((id) => {
    const timer = pollingMap.current.get(id);
    if (timer) {
      clearTimeout(timer);
      pollingMap.current.delete(id);
    }
    failureCountMap.current.delete(id);
  }, []);

  // --- Upload via XMLHttpRequest ---
  const uploadFile = useCallback(
    (item) => {
      updateItem(item.id, { status: "uploading", progress: 0 });

      const xhr = new XMLHttpRequest();
      xhrMap.current.set(item.id, xhr);

      const formData = new FormData();
      formData.append("file", item.file);
      formData.append("client_id", item.clientId);
      formData.append("campaign_name", item.campaignName);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 30);
          updateItem(item.id, { progress: pct });
        }
      };

      xhr.onload = () => {
        xhrMap.current.delete(item.id);
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            updateItem(item.id, { status: "processing", progress: 30, jobId: data.job_id });
            startPolling(item.id, data.job_id);
          } catch {
            updateItem(item.id, { status: "error", error: "Resposta inválida do servidor" });
          }
        } else {
          updateItem(item.id, { status: "error", error: `Erro HTTP ${xhr.status}` });
        }
      };

      xhr.onerror = () => {
        xhrMap.current.delete(item.id);
        updateItem(item.id, { status: "error", error: "Erro de rede ao enviar" });
      };

      xhr.onabort = () => {
        xhrMap.current.delete(item.id);
      };

      xhr.open("POST", `${API_BASE}/ingest/upload`);
      xhr.send(formData);
    },
    [updateItem, startPolling]
  );

  // --- Queue processor: auto-start uploads when slots available ---
  useEffect(() => {
    const uploading = queue.filter((i) => i.status === "uploading").length;
    const available = MAX_CONCURRENT_UPLOADS - uploading;
    if (available <= 0) return;

    const queued = queue.filter((i) => i.status === "queued");
    queued.slice(0, available).forEach((item) => {
      uploadFile(item);
    });
  }, [queue, uploadFile]);

  // --- Cleanup on unmount ---
  useEffect(() => {
    return () => {
      xhrMap.current.forEach((xhr) => xhr.abort());
      pollingMap.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  // --- Public API ---
  const addFiles = useCallback(async (files, clientId, campaignName) => {
    const newItems = [];
    for (const file of Array.from(files)) {
      const validation = validateVideoFile(file);
      if (!validation.valid) {
        newItems.push({
          ...createUploadItem(file, clientId, campaignName),
          status: "error",
          error: validation.error,
        });
        continue;
      }
      const item = createUploadItem(file, clientId, campaignName);
      newItems.push(item);

      // Generate thumbnail in background (don't block queue)
      generateThumbnail(file).then((url) => {
        if (url) {
          setQueue((prev) => prev.map((i) => (i.id === item.id ? { ...i, thumbnailUrl: url } : i)));
        }
      });
    }
    setQueue((prev) => [...prev, ...newItems]);
  }, []);

  const cancelItem = useCallback(
    (id) => {
      const item = queue.find((i) => i.id === id);
      if (!item) return;

      if (item.status === "uploading") {
        const xhr = xhrMap.current.get(id);
        if (xhr) xhr.abort();
        xhrMap.current.delete(id);
      }

      if (item.status === "queued" || item.status === "uploading") {
        stopPolling(id);
        removeItem(id);
      }
    },
    [queue, stopPolling, removeItem]
  );

  const retryItem = useCallback(
    (id) => {
      const item = queue.find((i) => i.id === id);
      if (!item || item.status !== "error") return;
      updateItem(id, { status: "queued", progress: 0, error: null });
    },
    [queue, updateItem]
  );

  const clearCompleted = useCallback(() => {
    setQueue((prev) => prev.filter((i) => i.status !== "completed"));
  }, []);

  return { queue, addFiles, cancelItem, retryItem, clearCompleted };
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useUpload.js
git commit -m "feat: add useUpload hook with queue, XHR progress, and polling"
```

---

### Task 7: Create useIngestStatus hook

**Files:**
- Create: `src/hooks/useIngestStatus.js`

- [ ] **Step 1: Create useIngestStatus.js**

```javascript
import { useState, useEffect, useCallback, useRef } from "react";
import {
  API_BASE,
  INGEST_POLL_INTERVAL,
  POLL_INTERVAL_BACKOFF,
  POLL_FAILURE_BACKOFF_THRESHOLD,
  POLL_FAILURE_STOP_THRESHOLD,
} from "../config";

export default function useIngestStatus(clientId) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  const failuresRef = useRef(0);

  const fetchVideos = useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/videos?client_id=${encodeURIComponent(clientId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setVideos(Array.isArray(data) ? data : []);
      setError(null);
      failuresRef.current = 0;
    } catch (e) {
      failuresRef.current += 1;
      if (failuresRef.current >= POLL_FAILURE_STOP_THRESHOLD) {
        setError("Conexão perdida. Tente novamente.");
      } else if (failuresRef.current >= POLL_FAILURE_BACKOFF_THRESHOLD) {
        setError("Conexão instável, tentando reconectar...");
      }
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Polling: active while there are processing/queued videos
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    const hasActive = videos.some((v) => v.status === "processing" || v.status === "queued");
    if (!hasActive && failuresRef.current === 0) return;

    if (failuresRef.current >= POLL_FAILURE_STOP_THRESHOLD) return;

    const interval = failuresRef.current >= POLL_FAILURE_BACKOFF_THRESHOLD
      ? POLL_INTERVAL_BACKOFF
      : INGEST_POLL_INTERVAL;

    timerRef.current = setInterval(fetchVideos, interval);
    return () => clearInterval(timerRef.current);
  }, [videos, fetchVideos]);

  // Reset on clientId change
  useEffect(() => {
    setVideos([]);
    setError(null);
    failuresRef.current = 0;
  }, [clientId]);

  const refresh = useCallback(() => {
    failuresRef.current = 0;
    setError(null);
    fetchVideos();
  }, [fetchVideos]);

  return { videos, loading, error, refresh };
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useIngestStatus.js
git commit -m "feat: add useIngestStatus hook with polling and error backoff"
```

---

## Chunk 3: Components — VideoCard, UploadZone, UploadQueue

### Task 8: Create VideoCard component

**Files:**
- Create: `src/components/upload/VideoCard.jsx`
- Create: `src/components/upload/upload.css`

- [ ] **Step 1: Create upload.css**

```css
/* ── VideoCard ──────────────────────────────────────────────── */

.video-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: box-shadow var(--transition-fast), border-color var(--transition-fast);
  animation: fadeUp 0.25s ease;
}

.video-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-subtle);
}

.video-card[data-status="error"] {
  border-left: 4px solid var(--color-status-error);
}

.video-card-thumb {
  width: 120px;
  height: 68px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
  background: var(--color-hover);
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-card-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-card-thumb-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.2);
  color: white;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.video-card-thumb:hover .video-card-thumb-overlay {
  opacity: 1;
}

.video-card-thumb-placeholder {
  color: var(--color-subtle);
}

.video-card-body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.video-card-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.video-card-meta {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-subtle);
  letter-spacing: 0.3px;
}

.video-card-error {
  font-size: 11px;
  color: var(--color-status-error);
  margin-top: 2px;
}

.video-card-actions {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex-shrink: 0;
}

.video-card-btn {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.3px;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  color: var(--color-muted);
  transition: all var(--transition-fast);
}

.video-card-btn:hover {
  background: var(--color-hover);
  border-color: var(--color-subtle);
  color: var(--color-secondary);
}

.video-card-btn-cancel {
  border: none;
  padding: 4px;
  color: var(--color-subtle);
}

.video-card-btn-cancel:hover {
  color: var(--color-status-error);
  background: transparent;
  border: none;
}

/* ── UploadZone ─────────────────────────────────────────────── */

.upload-zone {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-lg);
  padding: 40px 24px;
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-base);
  background: var(--color-bg);
}

.upload-zone:hover {
  border-color: var(--color-subtle);
}

.upload-zone[data-dragover="true"] {
  border-color: var(--color-accent);
  border-style: solid;
  background: rgba(236, 72, 153, 0.03);
  animation: zonePulse 1.5s ease-in-out infinite;
}

@keyframes zonePulse {
  0%, 100% { border-color: var(--color-accent); }
  50% { border-color: rgba(236, 72, 153, 0.4); }
}

.upload-zone-icon {
  color: var(--color-subtle);
  margin-bottom: 12px;
}

.upload-zone-title {
  font-size: 14px;
  color: var(--color-secondary);
  margin-bottom: 4px;
}

.upload-zone-hint {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-subtle);
  letter-spacing: 0.3px;
}

/* ── UploadQueue ────────────────────────────────────────────── */

.upload-queue {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.upload-queue-header {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  color: var(--color-subtle);
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 4px 0;
}

/* ── Responsive ─────────────────────────────────────────────── */

@media (max-width: 768px) {
  .video-card-thumb {
    width: 80px;
    height: 45px;
  }

  .upload-zone {
    padding: 28px 16px;
  }
}
```

- [ ] **Step 2: Create VideoCard.jsx**

```jsx
import { Play, Film, X, RotateCcw } from "lucide-react";
import ProgressBar from "../ui/ProgressBar";
import StatusBadge from "../ui/StatusBadge";
import { formatFileSize } from "../../helpers/video";
import "./upload.css";

export default function VideoCard({ item, onCancel, onRetry }) {
  const showCancel = item.status === "queued" || item.status === "uploading";
  const showRetry = item.status === "error";
  const showProgress = item.status === "uploading" || item.status === "processing";
  const chunksInfo = item.chunks_indexed ? ` · ${item.chunks_indexed} chunks` : "";

  return (
    <div className="video-card" data-status={item.status}>
      <div className="video-card-thumb">
        {item.thumbnailUrl ? (
          <>
            <img src={item.thumbnailUrl} alt="" />
            <div className="video-card-thumb-overlay">
              <Play size={20} />
            </div>
          </>
        ) : (
          <span className="video-card-thumb-placeholder">
            <Film size={24} />
          </span>
        )}
      </div>

      <div className="video-card-body">
        <div className="video-card-name" title={item.fileName || item.video}>
          {item.fileName || item.video}
        </div>
        <div className="video-card-meta">
          {item.campaignName || item.campaign_name || ""}
          {item.fileSize ? ` · ${formatFileSize(item.fileSize)}` : item.size_mb ? ` · ${item.size_mb} MB` : ""}
          {chunksInfo}
        </div>
        {showProgress && <ProgressBar progress={item.progress} status={item.status} />}
        {item.error && <div className="video-card-error">{item.error}</div>}
      </div>

      <div className="video-card-actions">
        <StatusBadge status={item.status} />
        {showCancel && onCancel && (
          <button className="video-card-btn video-card-btn-cancel" onClick={() => onCancel(item.id)} aria-label="Cancelar">
            <X size={14} />
          </button>
        )}
        {showRetry && onRetry && (
          <button className="video-card-btn" onClick={() => onRetry(item.id)} aria-label="Tentar novamente">
            <RotateCcw size={12} /> Retry
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/upload/
git commit -m "feat: add VideoCard component with thumbnail, progress, and status"
```

---

### Task 9: Create UploadZone component

**Files:**
- Create: `src/components/upload/UploadZone.jsx`

- [ ] **Step 1: Create UploadZone.jsx**

```jsx
import { useState, useRef } from "react";
import { Upload } from "lucide-react";
import "./upload.css";

export default function UploadZone({ onFiles, disabled = false }) {
  const [dragover, setDragover] = useState(false);
  const inputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragover(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragover(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragover(false);
    if (disabled) return;
    const files = e.dataTransfer.files;
    if (files.length > 0) onFiles(files);
  };

  const handleClick = () => {
    if (!disabled) inputRef.current?.click();
  };

  const handleChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) onFiles(files);
    e.target.value = "";
  };

  return (
    <div
      className="upload-zone"
      data-dragover={dragover}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label="Zona de upload de vídeos"
    >
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
        multiple
        onChange={handleChange}
        style={{ display: "none" }}
      />
      <div className="upload-zone-icon">
        <Upload size={32} />
      </div>
      <div className="upload-zone-title">
        {dragover ? "Solte para enviar" : "Arraste vídeos aqui ou clique para selecionar"}
      </div>
      <div className="upload-zone-hint">MP4, MOV, AVI, WebM · Máx 500MB por arquivo</div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/upload/UploadZone.jsx
git commit -m "feat: add UploadZone component with drag & drop"
```

---

### Task 10: Create UploadQueue component

**Files:**
- Create: `src/components/upload/UploadQueue.jsx`

- [ ] **Step 1: Create UploadQueue.jsx**

```jsx
import VideoCard from "./VideoCard";
import "./upload.css";

export default function UploadQueue({ items, onCancel, onRetry }) {
  if (items.length === 0) return null;

  const active = items.filter((i) => i.status !== "completed");
  const completed = items.filter((i) => i.status === "completed");

  return (
    <div className="upload-queue">
      {active.length > 0 && (
        <>
          <div className="upload-queue-header">
            Fila de Upload ({active.length})
          </div>
          {active.map((item) => (
            <VideoCard key={item.id} item={item} onCancel={onCancel} onRetry={onRetry} />
          ))}
        </>
      )}
      {completed.length > 0 && (
        <>
          <div className="upload-queue-header">
            Enviados ({completed.length})
          </div>
          {completed.map((item) => (
            <VideoCard key={item.id} item={item} />
          ))}
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/upload/UploadQueue.jsx
git commit -m "feat: add UploadQueue component"
```

---

## Chunk 4: Views — Refactor App.jsx, Create ChatView, IngestView, ChatAttachment

### Task 11: Refactor App.jsx into shell + ChatView

This is the largest refactoring step. Extract all chat logic from App.jsx into ChatView.jsx, leaving App.jsx as a thin shell with sidebar + view switching.

**Files:**
- Create: `src/views/ChatView.jsx`
- Create: `src/views/ChatView.css`
- Modify: `src/App.jsx`
- Modify: `src/App.css`

- [ ] **Step 1: Create ChatView.css**

Move chat-specific styles from App.css to ChatView.css. This includes everything from `/* ── Chat Header */` through `/* ── Chat Input */` — specifically: `.chat-header`, `.chat-header-info`, `.chat-header-title`, `.chat-header-client`, `.chat-header-hint`, `.btn-clear`, `.messages`, `.messages-inner`, `.msg-greeting`, `.msg-greeting-label`, `.msg-greeting-text`, `.msg-user`, `.msg-label`, `.msg-user-text`, `.msg-divider`, `.msg-assistant`, `.msg-assistant-content`, `.msg-cursor`, `.loading-dots`, `.loading-dot`, `.chat-input`, `.chat-input-inner`, `.chat-input-row`, `.chat-textarea`, `.btn-send`, `.chat-input-hint`, and their responsive variants.

Keep in App.css: `.app`, `.sidebar*`, `.mobile-header`, `.btn-menu`, `.overlay`, `.main`, and animations (`fadeUp`, `dotPulse`, `blink`). Also keep responsive sidebar rules.

- [ ] **Step 2: Create ChatView.jsx**

Extract all chat state and logic from App.jsx into ChatView. ChatView receives props from App.jsx:

```jsx
import { useState, useRef, useEffect, useCallback } from "react";
import { API_BASE, FALLBACKS } from "../config";
import { parseMarkdown } from "../helpers/markdown";
import "./ChatView.css";

function LoadingDots() {
  return (
    <div className="loading-dots" role="status" aria-label="Carregando resposta">
      <div className="loading-dot" />
      <div className="loading-dot" />
      <div className="loading-dot" />
    </div>
  );
}

export default function ChatView({ agent, clientId, AgentIcon }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState(() => `${clientId}:user-${Date.now()}`);

  const endRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setMessages([
      { id: 0, role: "system-greeting", agent: agent.id, content: agent.hint },
    ]);
    setThreadId(`${clientId}:user-${Date.now()}`);
    inputRef.current?.focus();
  }, [agent, clientId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const resetChat = useCallback(() => {
    setMessages([
      { id: 0, role: "system-greeting", agent: agent.id, content: agent.hint },
    ]);
    setThreadId(`${clientId}:user-${Date.now()}`);
  }, [agent, clientId]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput("");
    setLoading(true);

    const userMsg = { id: Date.now(), role: "user", content: text };
    const asstId = Date.now() + 1;
    const asstMsg = { id: asstId, role: "assistant", content: "", streaming: true };
    setMessages((p) => [...p, userMsg, asstMsg]);

    const simulateStream = async (full) => {
      const words = full.split(" ");
      let built = "";
      for (let i = 0; i < words.length; i++) {
        built += (i > 0 ? " " : "") + words[i];
        if (i % 2 === 0) {
          const snap = built;
          setMessages((p) => p.map((m) => (m.id === asstId ? { ...m, content: snap } : m)));
          await new Promise((r) => setTimeout(r, 16));
        }
      }
      setMessages((p) => p.map((m) => (m.id === asstId ? { ...m, content: full, streaming: false } : m)));
    };

    try {
      const res = await fetch(`${API_BASE}/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          thread_id: threadId,
          client_id: clientId,
          agent_id: agent.id,
          message: text,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let full = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of dec.decode(value).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const d = line.slice(6);
          if (d === "[DONE]") break;
          try {
            const p = JSON.parse(d);
            if (p.text) {
              full += p.text;
              const snap = full;
              setMessages((prev) => prev.map((m) => (m.id === asstId ? { ...m, content: snap } : m)));
            }
          } catch { /* ignore parse errors */ }
        }
      }
      setMessages((p) => p.map((m) => (m.id === asstId ? { ...m, streaming: false } : m)));
    } catch {
      await simulateStream(FALLBACKS[agent.id] || "Erro ao conectar.");
    }

    setLoading(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      <header className="chat-header">
        <div>
          <div className="chat-header-info">
            <span className="chat-header-title">{agent.label}</span>
            <span className="chat-header-client">{clientId.toUpperCase()}</span>
          </div>
          <div className="chat-header-hint">{agent.hint}</div>
        </div>
        <button className="btn-clear" onClick={resetChat} aria-label="Limpar conversa">
          limpar
        </button>
      </header>

      <div className="messages" role="log" aria-live="polite" aria-label="Mensagens da conversa">
        <div className="messages-inner">
          {messages.map((msg) => {
            if (msg.role === "system-greeting") {
              return (
                <div key={msg.id} className="msg-greeting">
                  <div className="msg-greeting-label">
                    <AgentIcon size={12} aria-hidden="true" />
                    {agent.label.toUpperCase()}
                  </div>
                  <div className="msg-greeting-text">{msg.content}</div>
                </div>
              );
            }
            if (msg.role === "user") {
              return (
                <div key={msg.id} className="msg-user">
                  <div className="msg-label">Você</div>
                  <div className="msg-user-text">{msg.content}</div>
                  <hr className="msg-divider" />
                </div>
              );
            }
            if (msg.role === "assistant") {
              return (
                <article key={msg.id} className="msg-assistant">
                  <div className="msg-label">
                    <AgentIcon size={12} aria-hidden="true" />
                    {agent.label.toUpperCase()}
                  </div>
                  {msg.content ? (
                    <div className="msg-assistant-content">
                      <p
                        dangerouslySetInnerHTML={{
                          __html:
                            parseMarkdown(msg.content) +
                            (msg.streaming ? '<span class="msg-cursor" aria-hidden="true"></span>' : ""),
                        }}
                      />
                    </div>
                  ) : (
                    <LoadingDots />
                  )}
                </article>
              );
            }
            return null;
          })}
          <div ref={endRef} />
        </div>
      </div>

      <footer className="chat-input">
        <div className="chat-input-inner">
          <div className="chat-input-row" data-active={loading}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={agent.placeholder}
              rows={1}
              className="chat-textarea"
              aria-label="Sua mensagem"
            />
            <button className="btn-send" onClick={send} disabled={loading || !input.trim()} aria-label="Enviar mensagem">
              Enviar
            </button>
          </div>
          <div className="chat-input-hint">
            <kbd>Enter</kbd> enviar &middot; <kbd>Shift+Enter</kbd> nova linha
          </div>
        </div>
      </footer>
    </>
  );
}
```

- [ ] **Step 3: Rewrite App.jsx as shell**

App.jsx becomes a thin shell with sidebar + view switching:

```jsx
import { useState, useEffect } from "react";
import {
  Play,
  PenTool,
  UserRound,
  Clapperboard,
  FileSearch,
  Upload,
  Menu,
  X,
} from "lucide-react";
import { API_BASE, AGENTS, CLIENTS } from "./config";
import ChatView from "./views/ChatView";
import IngestView from "./views/IngestView";
import "./App.css";

const ICON_MAP = { Play, PenTool, UserRound, Clapperboard, FileSearch };
function getAgentIcon(agent) {
  return ICON_MAP[agent.iconName] || Play;
}

export default function KoroStudio() {
  const [agent, setAgent] = useState(AGENTS[0]);
  const [clientId, setClientId] = useState("santander");
  const [apiOnline, setApiOnline] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [view, setView] = useState("chat");

  useEffect(() => {
    fetch(`${API_BASE}/health`)
      .then((r) => r.json())
      .then((d) => setApiOnline(d.status === "healthy"))
      .catch(() => setApiOnline(false));
  }, []);

  const AgentIcon = getAgentIcon(agent);
  const statusLabel = apiOnline === true ? "online" : apiOnline === false ? "offline" : "loading";
  const statusText = apiOnline === true ? "API Online" : apiOnline === false ? "API Offline" : "Verificando...";

  return (
    <div className="app">
      <header className="mobile-header">
        <button className="btn-menu" onClick={() => setSidebarOpen(true)} aria-label="Abrir menu">
          <Menu size={18} />
        </button>
        <h1>Koro Studio</h1>
      </header>

      <div className="overlay" data-open={sidebarOpen} onClick={() => setSidebarOpen(false)} aria-hidden="true" />

      <aside className="sidebar" data-open={sidebarOpen} role="complementary" aria-label="Painel de navegação">
        <div className="sidebar-brand">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h1>Koro Studio</h1>
            <button className="btn-menu" onClick={() => setSidebarOpen(false)} aria-label="Fechar menu" style={{ display: sidebarOpen ? "flex" : "none" }}>
              <X size={16} />
            </button>
          </div>
          <div className="sidebar-status">
            <div className="sidebar-status-dot" data-status={statusLabel} />
            <span className="sidebar-status-label">{statusText}</span>
          </div>
        </div>

        <div className="sidebar-section">
          <label className="sidebar-section-label" htmlFor="client-select">Cliente</label>
          <select
            id="client-select"
            className="client-select"
            value={clientId}
            onChange={(e) => { setClientId(e.target.value); setSidebarOpen(false); }}
          >
            {CLIENTS.map((c) => (
              <option key={c} value={c}>{c.toUpperCase()}</option>
            ))}
          </select>
        </div>

        <nav className="sidebar-agents" aria-label="Agentes">
          <div className="sidebar-section-label">Agentes</div>
          {AGENTS.map((ag) => {
            const Icon = getAgentIcon(ag);
            const active = view === "chat" && agent.id === ag.id;
            return (
              <button
                key={ag.id}
                className="agent-btn"
                data-active={active}
                onClick={() => { setAgent(ag); setView("chat"); setSidebarOpen(false); }}
                aria-current={active ? "page" : undefined}
                aria-label={`Agente ${ag.label}`}
              >
                <span className="agent-btn-icon" aria-hidden="true"><Icon size={16} /></span>
                <span className="agent-btn-label">{ag.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-ingest">
          <div className="sidebar-section-label">Ferramentas</div>
          <button
            className="agent-btn"
            data-active={view === "ingest"}
            onClick={() => { setView("ingest"); setSidebarOpen(false); }}
            aria-current={view === "ingest" ? "page" : undefined}
            aria-label="Ingestão de vídeos"
          >
            <span className="agent-btn-icon" aria-hidden="true"><Upload size={16} /></span>
            <span className="agent-btn-label">Ingestão</span>
          </button>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-footer-text">
            VideoRAG &middot; Gemini 2.5 Pro<br />Prototype &middot; v0.3
          </div>
        </div>
      </aside>

      <main className="main">
        {view === "chat" ? (
          <ChatView agent={agent} clientId={clientId} AgentIcon={AgentIcon} />
        ) : (
          <IngestView clientId={clientId} />
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Update App.css**

Remove all chat-specific styles from App.css (`.chat-header*`, `.messages*`, `.msg-*`, `.loading-*`, `.chat-input*`, `.btn-clear`, `.btn-send`). Keep sidebar, layout, mobile, overlay, and animation styles. Add `.sidebar-ingest` style:

```css
.sidebar-ingest {
  padding: 4px 12px 8px;
  border-top: 1px solid var(--color-border);
}
```

- [ ] **Step 5: Create stub IngestView.jsx**

Create a temporary stub so the build passes:

```jsx
export default function IngestView({ clientId }) {
  return <div style={{ padding: 32 }}>Ingestão — {clientId.toUpperCase()} (em construção)</div>;
}
```

Save to `src/views/IngestView.jsx`.

- [ ] **Step 6: Verify build and visual**

Run: `npm run build && npm run dev`
Expected: Build succeeds. App loads. Sidebar shows "Ingestão" button under "Ferramentas". Clicking agents shows chat. Clicking "Ingestão" shows stub. Chat functionality works identically to before.

- [ ] **Step 7: Commit**

```bash
git add src/App.jsx src/App.css src/views/
git commit -m "refactor: extract App.jsx into shell + ChatView, add IngestView stub"
```

---

### Task 12: Create IngestView

**Files:**
- Modify: `src/views/IngestView.jsx`
- Create: `src/views/IngestView.css`

- [ ] **Step 1: Create IngestView.css**

```css
.ingest-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.ingest-header {
  padding: 16px 32px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-surface);
  flex-shrink: 0;
}

.ingest-header-info {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.ingest-header-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-primary);
}

.ingest-header-client {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-subtle);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.ingest-header-stats {
  font-size: 13px;
  color: var(--color-muted);
  margin-top: 2px;
}

.ingest-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
}

.ingest-content-inner {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.ingest-campaign-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ingest-campaign-label {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-subtle);
  letter-spacing: 0.5px;
  text-transform: uppercase;
  flex-shrink: 0;
}

.ingest-campaign-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-secondary);
  font-size: 13px;
  font-family: var(--font-sans);
  transition: border-color var(--transition-fast);
}

.ingest-campaign-input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.ingest-campaign-input::placeholder {
  color: var(--color-subtle);
}

.ingest-section-header {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  color: var(--color-subtle);
  letter-spacing: 1px;
  text-transform: uppercase;
  padding: 4px 0;
}

.ingest-video-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ingest-drive-placeholder {
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ingest-drive-label {
  font-size: 13px;
  color: var(--color-subtle);
}

.ingest-drive-btn {
  font-family: var(--font-mono);
  font-size: 10px;
  letter-spacing: 0.3px;
  padding: 6px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-subtle);
  cursor: not-allowed;
  opacity: 0.5;
}

.ingest-error-banner {
  padding: 8px 12px;
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--color-status-error);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ingest-error-banner button {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-status-error);
  text-decoration: underline;
}

@media (max-width: 768px) {
  .ingest-header { padding: 12px 16px; }
  .ingest-content { padding: 16px; }
  .ingest-campaign-row { flex-direction: column; align-items: stretch; }
}
```

- [ ] **Step 2: Implement IngestView.jsx**

```jsx
import { useState } from "react";
import { HardDrive } from "lucide-react";
import useUpload from "../hooks/useUpload";
import useIngestStatus from "../hooks/useIngestStatus";
import UploadZone from "../components/upload/UploadZone";
import UploadQueue from "../components/upload/UploadQueue";
import VideoCard from "../components/upload/VideoCard";
import "./IngestView.css";

export default function IngestView({ clientId }) {
  const [campaignName, setCampaignName] = useState("");
  const { queue, addFiles, cancelItem, retryItem } = useUpload();
  const { videos, loading, error, refresh } = useIngestStatus(clientId);

  const handleFiles = (files) => {
    addFiles(files, clientId, campaignName);
  };

  const completedVideos = videos.filter((v) => v.status === "completed");
  const processingVideos = videos.filter((v) => v.status === "processing" || v.status === "queued");
  const errorVideos = videos.filter((v) => v.status === "error");

  const totalIndexed = completedVideos.length;
  const totalProcessing = processingVideos.length + queue.filter((i) => i.status !== "completed" && i.status !== "error").length;

  return (
    <div className="ingest-view">
      <header className="ingest-header">
        <div className="ingest-header-info">
          <span className="ingest-header-title">Ingestão de Vídeos</span>
          <span className="ingest-header-client">{clientId.toUpperCase()}</span>
        </div>
        <div className="ingest-header-stats">
          {totalIndexed} vídeo{totalIndexed !== 1 ? "s" : ""} indexado{totalIndexed !== 1 ? "s" : ""}
          {totalProcessing > 0 && ` · ${totalProcessing} em processamento`}
        </div>
      </header>

      <div className="ingest-content">
        <div className="ingest-content-inner">
          <UploadZone onFiles={handleFiles} />

          <div className="ingest-campaign-row">
            <span className="ingest-campaign-label">Campanha</span>
            <input
              className="ingest-campaign-input"
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="Nome da campanha (opcional)"
            />
          </div>

          <UploadQueue items={queue} onCancel={cancelItem} onRetry={retryItem} />

          {error && (
            <div className="ingest-error-banner">
              <span>{error}</span>
              <button onClick={refresh}>Tentar novamente</button>
            </div>
          )}

          {(completedVideos.length > 0 || errorVideos.length > 0) && (
            <>
              <div className="ingest-section-header">
                Vídeos Indexados ({completedVideos.length + errorVideos.length})
              </div>
              <div className="ingest-video-list">
                {errorVideos.map((v) => (
                  <VideoCard key={v.job_id || v.video} item={v} />
                ))}
                {completedVideos.map((v) => (
                  <VideoCard key={v.job_id || v.video} item={v} />
                ))}
              </div>
            </>
          )}

          {processingVideos.length > 0 && (
            <>
              <div className="ingest-section-header">
                Em Processamento ({processingVideos.length})
              </div>
              <div className="ingest-video-list">
                {processingVideos.map((v) => (
                  <VideoCard key={v.job_id || v.video} item={v} />
                ))}
              </div>
            </>
          )}

          <div className="ingest-drive-placeholder">
            <span className="ingest-drive-label">
              <HardDrive size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
              Google Drive
            </span>
            <button className="ingest-drive-btn" disabled title="Em breve">
              Conectar Pasta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build and visual**

Run: `npm run build && npm run dev`
Expected: Build succeeds. Clicking "Ingestão" in sidebar shows the full ingest view with upload zone, campaign input, and Google Drive placeholder. Drag & drop should trigger file selection. Uploaded files appear in the queue.

- [ ] **Step 4: Commit**

```bash
git add src/views/IngestView.jsx src/views/IngestView.css
git commit -m "feat: implement IngestView with upload zone, queue, and video list"
```

---

### Task 13: Create ChatAttachment component and integrate into ChatView

**Files:**
- Create: `src/components/chat/ChatAttachment.jsx`
- Create: `src/components/chat/chat-attachment.css`
- Modify: `src/views/ChatView.jsx`

- [ ] **Step 1: Create chat-attachment.css**

```css
.chat-attachment-btn {
  color: var(--color-subtle);
  padding: 4px;
  flex-shrink: 0;
  transition: color var(--transition-fast);
}

.chat-attachment-btn:hover {
  color: var(--color-secondary);
}

.chat-attachment-previews {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding-bottom: 8px;
}

.chat-attachment-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  animation: fadeUp 0.2s ease;
}

.chat-attachment-preview-thumb {
  width: 36px;
  height: 20px;
  border-radius: 3px;
  object-fit: cover;
  background: var(--color-hover);
}

.chat-attachment-preview-name {
  font-size: 11px;
  color: var(--color-secondary);
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-attachment-preview-size {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-subtle);
}

.chat-attachment-preview-remove {
  color: var(--color-subtle);
  padding: 2px;
}

.chat-attachment-preview-remove:hover {
  color: var(--color-status-error);
}

/* Upload progress card in chat */
.chat-upload-card {
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  margin-bottom: 8px;
  animation: fadeUp 0.25s ease;
}

.chat-upload-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.chat-upload-card-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-secondary);
}

.chat-upload-card-size {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-subtle);
}

.chat-upload-card-status {
  font-size: 11px;
  color: var(--color-muted);
  margin-top: 6px;
}
```

- [ ] **Step 2: Create ChatAttachment.jsx**

```jsx
import { useRef } from "react";
import { Paperclip, X, Film } from "lucide-react";
import { formatFileSize } from "../../helpers/video";
import "./chat-attachment.css";

export function AttachButton({ onFiles, visible }) {
  const inputRef = useRef(null);

  if (!visible) return null;

  const handleChange = (e) => {
    if (e.target.files.length > 0) onFiles(e.target.files);
    e.target.value = "";
  };

  return (
    <>
      <button className="chat-attachment-btn" onClick={() => inputRef.current?.click()} aria-label="Anexar vídeo">
        <Paperclip size={16} />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
        multiple
        onChange={handleChange}
        style={{ display: "none" }}
      />
    </>
  );
}

export function AttachmentPreviews({ files, onRemove }) {
  if (files.length === 0) return null;

  return (
    <div className="chat-attachment-previews">
      {files.map((f) => (
        <div key={f.id} className="chat-attachment-preview">
          {f.thumbnailUrl ? (
            <img src={f.thumbnailUrl} alt="" className="chat-attachment-preview-thumb" />
          ) : (
            <Film size={14} style={{ color: "var(--color-subtle)" }} />
          )}
          <span className="chat-attachment-preview-name" title={f.fileName}>{f.fileName}</span>
          <span className="chat-attachment-preview-size">{formatFileSize(f.fileSize)}</span>
          <button className="chat-attachment-preview-remove" onClick={() => onRemove(f.id)} aria-label="Remover">
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Integrate ChatAttachment into ChatView**

Modify `src/views/ChatView.jsx`. Add attachment state and video upload flow. Key changes:

1. Import hooks and components:
```javascript
import { useState, useRef, useEffect, useCallback } from "react";
import useUpload from "../hooks/useUpload";
import { AttachButton, AttachmentPreviews } from "../components/chat/ChatAttachment";
import ProgressBar from "../components/ui/ProgressBar";
import StatusBadge from "../components/ui/StatusBadge";
import { validateVideoFile, generateThumbnail, formatFileSize } from "../helpers/video";
import { Film } from "lucide-react";
```

2. Add state for pending attachments:
```javascript
const [pendingFiles, setPendingFiles] = useState([]);
const { queue: uploadQueue, addFiles: uploadFiles } = useUpload();
```

3. Add file handling:
```javascript
const isVideoRAG = agent.id === "videorag";

const handleAttachFiles = async (fileList) => {
  const files = Array.from(fileList);
  const items = [];
  for (const f of files) {
    const validation = validateVideoFile(f);
    if (!validation.valid) continue;
    const thumb = await generateThumbnail(f);
    items.push({ id: crypto.randomUUID(), file: f, fileName: f.name, fileSize: f.size, thumbnailUrl: thumb });
  }
  setPendingFiles((prev) => [...prev, ...items]);
};

const removePendingFile = (id) => {
  setPendingFiles((prev) => prev.filter((f) => f.id !== id));
};
```

4. Modify `send()` to handle attachments. When there are pending files, the flow is:
   - Upload files via useUpload
   - Add an "upload-progress" message to chat
   - When upload completes (watch `uploadQueue`), send the chat message with `[Video: filename]` prefix

5. In the footer render, add the attachment button before textarea and previews above the input row:

```jsx
<footer className="chat-input">
  <div className="chat-input-inner">
    {pendingFiles.length > 0 && (
      <AttachmentPreviews files={pendingFiles} onRemove={removePendingFile} />
    )}
    <div className="chat-input-row" data-active={loading}>
      <AttachButton onFiles={handleAttachFiles} visible={isVideoRAG} />
      <textarea ... />
      <button className="btn-send" ... >Enviar</button>
    </div>
    ...
  </div>
</footer>
```

6. Add upload progress message rendering in the messages list:
```jsx
if (msg.role === "upload-progress") {
  return (
    <div key={msg.id} className="chat-upload-card">
      <div className="chat-upload-card-header">
        <Film size={14} />
        <span className="chat-upload-card-name">{msg.fileName}</span>
        <span className="chat-upload-card-size">{msg.fileSize}</span>
      </div>
      <ProgressBar progress={msg.progress} status={msg.uploadStatus} />
      <div className="chat-upload-card-status">
        <StatusBadge status={msg.uploadStatus} />
      </div>
    </div>
  );
}
```

The full modified send function with attachment support:

```javascript
const send = async () => {
  const hasText = input.trim();
  const hasFiles = pendingFiles.length > 0;
  if ((!hasText && !hasFiles) || loading) return;

  const text = hasText ? input.trim() : (hasFiles ? "Analise este vídeo em detalhes" : "");
  setInput("");
  setLoading(true);

  if (hasFiles) {
    // Upload flow: upload files, then send message after completion
    const filesToUpload = [...pendingFiles];
    setPendingFiles([]);

    // Add user message with file references
    const fileNames = filesToUpload.map((f) => f.fileName).join(", ");
    const userMsg = { id: Date.now(), role: "user", content: `${text}\n📎 ${fileNames}` };
    setMessages((p) => [...p, userMsg]);

    // Add upload progress messages
    const uploadMsgs = filesToUpload.map((f, i) => ({
      id: Date.now() + i + 1,
      role: "upload-progress",
      fileName: f.fileName,
      fileSize: formatFileSize(f.fileSize),
      progress: 0,
      uploadStatus: "queued",
      uploadId: f.id,
    }));
    setMessages((p) => [...p, ...uploadMsgs]);

    // Start uploads
    const files = filesToUpload.map((f) => f.file);
    const fileList = new DataTransfer();
    files.forEach((f) => fileList.items.add(f));
    uploadFiles(fileList.files, clientId, "");

    // Wait for all uploads to complete by polling uploadQueue
    const checkCompletion = () => {
      return new Promise((resolve) => {
        const interval = setInterval(() => {
          // Check if all relevant items are done
          const allDone = uploadQueue.every(
            (item) => item.status === "completed" || item.status === "error"
          );
          if (allDone || uploadQueue.length === 0) {
            clearInterval(interval);
            resolve();
          }
        }, 1000);
        // Safety timeout: 10 minutes
        setTimeout(() => { clearInterval(interval); resolve(); }, 600000);
      });
    };

    await checkCompletion();

    // Now send the agent message with video prefix
    const videoPrefix = filesToUpload.map((f) => `[Video: ${f.fileName}]`).join(" ");
    const agentMessage = `${videoPrefix} ${text}`;

    // Continue with normal agent chat...
    const asstId = Date.now() + 100;
    const asstMsg = { id: asstId, role: "assistant", content: "", streaming: true };
    setMessages((p) => [...p, asstMsg]);

    try {
      const res = await fetch(`${API_BASE}/agent/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ thread_id: threadId, client_id: clientId, agent_id: agent.id, message: agentMessage }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // ... same SSE reading logic as existing send() ...
    } catch {
      // ... same fallback logic ...
    }

    setLoading(false);
    return;
  }

  // Normal text-only send (existing logic, unchanged)
  // ... keep all existing send logic for non-attachment case ...
};
```

**Implementation note:** The full ChatView.jsx with attachment integration is complex. The implementer should:
1. Keep the existing text-only send path intact
2. Add the attachment path as a new branch at the top of `send()`
3. The upload progress messages should be updated via a `useEffect` that watches `uploadQueue` changes

- [ ] **Step 4: Verify build and visual**

Run: `npm run build && npm run dev`
Expected: Build succeeds. In VideoRAG agent, a paperclip button appears next to textarea. Selecting a video shows preview above input. Other agents don't show the button. Sending with attachment triggers upload + agent chat.

- [ ] **Step 5: Commit**

```bash
git add src/components/chat/ src/views/ChatView.jsx
git commit -m "feat: add ChatAttachment with upload + auto-query flow"
```

---

### Task 14: Final cleanup and build verification

**Files:**
- Verify all files compile
- Remove any dead code from App.css

- [ ] **Step 1: Clean build**

Run: `npm run build`
Expected: Build succeeds with zero errors and zero warnings about unused code.

- [ ] **Step 2: Visual verification checklist**

Run: `npm run dev` and verify:

1. Sidebar: agents list, "Ingestão" button, client selector — all work
2. ChatView: text chat works for all 5 agents
3. ChatView (VideoRAG): paperclip button visible, file picker opens, preview appears
4. ChatView (Copy/Persona/etc): no paperclip button
5. IngestView: upload zone visible, drag & drop works, files appear in queue
6. IngestView: campaign name input present
7. IngestView: Google Drive placeholder disabled
8. Mobile: sidebar toggle works, responsive layout

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete video upload feature — chat attachment + ingest view"
```

---

## Dependency Graph

```
Task 1 (tokens)
Task 2 (config.js) ────────────────┐
Task 3 (markdown.js)                │
Task 4 (ProgressBar, StatusBadge)   │
Task 5 (video helpers) ────────┐    │
Task 6 (useUpload) ←───────────┘    │
Task 7 (useIngestStatus)            │
Task 8 (VideoCard) ←── Task 4       │
Task 9 (UploadZone)                 │
Task 10 (UploadQueue) ←── Task 8    │
Task 11 (App.jsx refactor) ←───────┘ ←── Task 3
Task 12 (IngestView) ←── Tasks 6,7,8,9,10
Task 13 (ChatAttachment) ←── Tasks 6,8,11
Task 14 (cleanup) ←── all
```

Tasks 1-5 can be done in parallel.
Tasks 6-7 can be done in parallel.
Tasks 8-10 can be done in parallel (after Task 4).
Task 11 depends on Tasks 2, 3.
Tasks 12, 13 depend on Tasks 6-10, 11.
