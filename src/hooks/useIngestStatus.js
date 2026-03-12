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
    } catch {
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
