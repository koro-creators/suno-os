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

  const updateItem = useCallback((id, updates) => {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }, []);

  const removeItem = useCallback((id) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // --- Polling for backend processing status ---
  const stopPolling = useCallback((id) => {
    const timer = pollingMap.current.get(id);
    if (timer) {
      clearTimeout(timer);
      pollingMap.current.delete(id);
    }
    failureCountMap.current.delete(id);
  }, []);

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

        const failures = failureCountMap.current.get(id) || 0;
        const interval = failures >= POLL_FAILURE_BACKOFF_THRESHOLD ? POLL_INTERVAL_BACKOFF : POLL_INTERVAL_NORMAL;
        const timer = setTimeout(poll, interval);
        pollingMap.current.set(id, timer);
      };

      const timer = setTimeout(poll, POLL_INTERVAL_NORMAL);
      pollingMap.current.set(id, timer);
    },
    [updateItem, stopPolling]
  );

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
