import { useState, useCallback, useRef, useEffect } from "react";
import { API_BASE, MAX_CONCURRENT_UPLOADS } from "../config";
import { validateVideoFile, generateThumbnail } from "../helpers/video";
import usePolling from "./usePolling";

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
  const queueRef = useRef(queue);
  const xhrMap = useRef(new Map());
  const uploadingRef = useRef(new Set());

  // Keep ref in sync for external consumers (avoids stale closures)
  useEffect(() => { queueRef.current = queue; }, [queue]);

  const updateItem = useCallback((id, updates) => {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }, []);

  const removeItem = useCallback((id) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  }, []);

  // --- Polling for backend processing status ---
  const { startPolling, stopPolling, pollingMap } = usePolling(updateItem);

  // --- Upload via GCS signed URL (3-step) ---
  const uploadFile = useCallback(
    async (item) => {
      updateItem(item.id, { status: "uploading", progress: 0 });

      try {
        // Step 1: Request signed URL from backend
        const urlRes = await fetch(`${API_BASE}/ingest/request-upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: item.file.name,
            content_type: item.file.type || "video/mp4",
            client_id: item.clientId,
            campaign_name: item.campaignName,
          }),
        });

        if (!urlRes.ok) {
          const err = await urlRes.json().catch(() => ({}));
          throw new Error(err.detail || `Erro ao solicitar URL: HTTP ${urlRes.status}`);
        }

        const { signed_url, job_id } = await urlRes.json();
        updateItem(item.id, { jobId: job_id });

        // Step 2: Upload directly to GCS via XHR (for progress tracking)
        await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhrMap.current.set(item.id, xhr);

          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const pct = Math.round((e.loaded / e.total) * 30);
              updateItem(item.id, { progress: pct });
            }
          };

          xhr.onload = () => {
            xhrMap.current.delete(item.id);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error(`Erro no upload para GCS: HTTP ${xhr.status}`));
            }
          };

          xhr.onerror = () => {
            xhrMap.current.delete(item.id);
            reject(new Error("Erro de rede no upload"));
          };

          xhr.onabort = () => {
            xhrMap.current.delete(item.id);
            reject(new Error("Upload cancelado"));
          };

          xhr.open("PUT", signed_url);
          xhr.setRequestHeader("Content-Type", item.file.type || "video/mp4");
          xhr.send(item.file);
        });

        // Step 3: Notify backend to start processing
        const confirmRes = await fetch(`${API_BASE}/ingest/complete-upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            job_id,
            client_id: item.clientId,
            campaign_name: item.campaignName,
          }),
        });

        if (!confirmRes.ok) {
          const err = await confirmRes.json().catch(() => ({}));
          throw new Error(err.detail || `Erro ao confirmar upload: HTTP ${confirmRes.status}`);
        }

        uploadingRef.current.delete(item.id);
        updateItem(item.id, { status: "processing", progress: 30, jobId: job_id });
        startPolling(item.id, job_id);

      } catch (err) {
        uploadingRef.current.delete(item.id);
        xhrMap.current.delete(item.id);
        if (err.message !== "Upload cancelado") {
          updateItem(item.id, { status: "error", error: err.message });
        }
      }
    },
    [updateItem, startPolling]
  );

  // --- Queue processor: auto-start uploads when slots available ---
  useEffect(() => {
    const uploading = queue.filter((i) => i.status === "uploading").length;
    const available = MAX_CONCURRENT_UPLOADS - uploading;
    if (available <= 0) return;

    const queued = queue.filter((i) => i.status === "queued" && !uploadingRef.current.has(i.id));
    queued.slice(0, available).forEach((item) => {
      uploadingRef.current.add(item.id);
      uploadFile(item);
    });
  }, [queue, uploadFile]);

  // --- Cleanup on unmount ---
  useEffect(() => {
    return () => {
      xhrMap.current.forEach((xhr) => xhr.abort());
      pollingMap.current.forEach((timer) => clearTimeout(timer));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      uploadingRef.current.delete(id);
      updateItem(id, { status: "queued", progress: 0, error: null });
    },
    [queue, updateItem]
  );

  const clearCompleted = useCallback(() => {
    setQueue((prev) => prev.filter((i) => i.status !== "completed"));
  }, []);

  return { queue, queueRef, addFiles, cancelItem, retryItem, clearCompleted };
}
