import { useState, useRef, useCallback, useEffect } from "react";
import {
  API_BASE,
  MAX_CONCURRENT_UPLOADS,
  GOOGLE_PICKER_API_KEY,
  GOOGLE_OAUTH_CLIENT_ID,
  GOOGLE_DRIVE_SCOPES,
} from "../config";
import usePolling from "./usePolling";

const GIS_URL = "https://accounts.google.com/gsi/client";
const GAPI_URL = "https://apis.google.com/js/api.js";
const VIDEO_MIMES = "video/mp4,video/quicktime,video/x-msvideo,video/webm";

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function createDriveItem(doc, clientId, campaignName) {
  return {
    id: crypto.randomUUID(),
    driveFileId: doc.id,
    fileName: doc.name,
    fileSize: doc.sizeBytes || 0,
    mimeType: doc.mimeType,
    clientId,
    campaignName,
    status: "queued",
    progress: 0,
    jobId: null,
    error: null,
    thumbnailUrl: doc.iconUrl || null,
    source: "drive",
  };
}

export default function useDriveUpload() {
  const [queue, setQueue] = useState([]);
  const [isPickerLoading, setIsPickerLoading] = useState(false);
  const tokenRef = useRef(null);
  const processingRef = useRef(new Set());

  const updateItem = useCallback((id, updates) => {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  }, []);

  const { startPolling, stopPolling } = usePolling(updateItem);

  const openDrivePicker = useCallback(async (clientId, campaignName) => {
    if (!GOOGLE_OAUTH_CLIENT_ID) {
      console.error("GOOGLE_OAUTH_CLIENT_ID not configured");
      return;
    }

    setIsPickerLoading(true);

    try {
      // Load scripts in parallel
      await Promise.all([loadScript(GIS_URL), loadScript(GAPI_URL)]);

      // Load Picker module
      await new Promise((resolve) => window.gapi.load("picker", resolve));

      // Get OAuth token
      const token = await new Promise((resolve, reject) => {
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_OAUTH_CLIENT_ID,
          scope: GOOGLE_DRIVE_SCOPES,
          callback: (response) => {
            if (response.error) {
              reject(new Error(response.error));
            } else {
              resolve(response.access_token);
            }
          },
        });
        client.requestAccessToken();
      });

      tokenRef.current = token;

      // Build and show Picker
      const view = new window.google.picker.DocsView(window.google.picker.ViewId.DOCS)
        .setMimeTypes(VIDEO_MIMES)
        .setMode(window.google.picker.DocsViewMode.LIST);

      const picker = new window.google.picker.PickerBuilder()
        .addView(view)
        .setOAuthToken(token)
        .setDeveloperKey(GOOGLE_PICKER_API_KEY)
        .enableFeature(window.google.picker.Feature.MULTISELECT_ENABLED)
        .setTitle("Selecionar vídeos do Google Drive")
        .setCallback((data) => {
          if (data.action === window.google.picker.Action.PICKED) {
            const items = data.docs.map((doc) => createDriveItem(doc, clientId, campaignName));
            setQueue((prev) => [...prev, ...items]);
          }
        })
        .build();

      picker.setVisible(true);
    } catch (err) {
      console.error("Drive Picker error:", err);
    } finally {
      setIsPickerLoading(false);
    }
  }, []);

  // Process queued items
  useEffect(() => {
    const uploading = queue.filter((i) => i.status === "processing" && !processingRef.current.has(i.id)).length;
    const available = MAX_CONCURRENT_UPLOADS - uploading;
    if (available <= 0) return;

    const queued = queue.filter((i) => i.status === "queued" && !processingRef.current.has(i.id));
    queued.slice(0, available).forEach(async (item) => {
      processingRef.current.add(item.id);
      updateItem(item.id, { status: "processing", progress: 10 });

      try {
        const res = await fetch(`${API_BASE}/ingest/drive/request`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            drive_file_id: item.driveFileId,
            drive_file_name: item.fileName,
            mime_type: item.mimeType,
            access_token: tokenRef.current,
            client_id: item.clientId,
            campaign_name: item.campaignName,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || `HTTP ${res.status}`);
        }

        const { job_id } = await res.json();
        updateItem(item.id, { jobId: job_id, status: "processing", progress: 30 });
        startPolling(item.id, job_id);
      } catch (err) {
        processingRef.current.delete(item.id);
        updateItem(item.id, { status: "error", error: err.message });
      }
    });
  }, [queue, updateItem, startPolling]);

  const cancelDriveItem = useCallback(
    (id) => {
      const item = queue.find((i) => i.id === id);
      if (!item) return;
      stopPolling(id);
      processingRef.current.delete(id);
      setQueue((prev) => prev.filter((i) => i.id !== id));
    },
    [queue, stopPolling]
  );

  const retryDriveItem = useCallback(
    (id) => {
      const item = queue.find((i) => i.id === id && i.status === "error");
      if (!item) return;
      processingRef.current.delete(id);
      updateItem(id, { status: "queued", progress: 0, error: null });
    },
    [queue, updateItem]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      queue.forEach((item) => stopPolling(item.id));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { driveQueue: queue, openDrivePicker, cancelDriveItem, retryDriveItem, isPickerLoading };
}
