import { useRef, useCallback } from "react";
import {
  API_BASE,
  POLL_INTERVAL_NORMAL,
  POLL_INTERVAL_BACKOFF,
  POLL_FAILURE_BACKOFF_THRESHOLD,
  POLL_FAILURE_STOP_THRESHOLD,
} from "../config";

export default function usePolling(updateItem) {
  const pollingMap = useRef(new Map());
  const failureCountMap = useRef(new Map());

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

  return { startPolling, stopPolling, pollingMap };
}
