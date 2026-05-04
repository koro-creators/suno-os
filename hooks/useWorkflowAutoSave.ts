/**
 * useWorkflowAutoSave — debounced auto-save with race-safe retries (SPEC-005 TASK-C11).
 *
 * Why this is non-trivial:
 *
 *   1. Debounce 500ms after the last change (FR-WBC-08).
 *   2. While a save is in flight, *new* edits should NOT trigger a parallel
 *      PUT — race-condition flagged in the SPEC-005 critical review (I6).
 *      Solution: keep `latest` in a ref so the in-flight handler can pick up
 *      the most recent state when it returns, and re-fire if the data
 *      changed during the in-flight call.
 *   3. Retries on 5xx with exponential backoff (1s → 2s → 4s, max 3 tries).
 *      4xx are NOT retried (the canvas will revert via toast).
 *
 * State machine:
 *   idle → dirty → saving → saved | error
 *                ↑           ↓
 *                └───────────┘  (re-dirty mid-save → re-fire after current resolves)
 *
 * Returned API:
 *   markDirty(payload)  — call when user edits anything; debounced.
 *   forceSave()         — flush pending debounce immediately (toolbar "Salvar agora").
 *   state               — UI-facing state for the banner.
 *   lastError           — last 4xx/5xx response for debug panels.
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export type AutoSaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export interface UseWorkflowAutoSaveOptions<P> {
  debounceMs?: number;
  maxRetries?: number;
  saveFn: (payload: P) => Promise<void>;
}

export function useWorkflowAutoSave<P>({
  debounceMs = 500,
  maxRetries = 3,
  saveFn,
}: UseWorkflowAutoSaveOptions<P>) {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const [lastError, setLastError] = useState<Error | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  // `latest` always holds the most recent payload, written synchronously by
  // markDirty so a save that resolves can re-check whether the user changed
  // anything mid-flight (race-condition guard from review I6).
  const latest = useRef<P | null>(null);
  const inFlight = useRef<boolean>(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSerialised = useRef<string | null>(null);

  const performSave = useCallback(
    async (payload: P, attempt: number = 0): Promise<void> => {
      inFlight.current = true;
      setStatus('saving');
      setLastError(null);
      const serialised = JSON.stringify(payload);
      try {
        await saveFn(payload);
        lastSerialised.current = serialised;
        // If user edited something while we were saving, the snapshot we
        // just saved is stale — re-fire immediately for the *new* `latest`.
        if (latest.current !== null && JSON.stringify(latest.current) !== serialised) {
          inFlight.current = false;
          await performSave(latest.current!, 0);
          return;
        }
        setStatus('saved');
        setSavedAt(new Date());
        inFlight.current = false;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        // Heuristic: 4xx messages contain status codes we shouldn't retry.
        const is5xx = /5\d\d/.test(error.message);
        if (is5xx && attempt < maxRetries) {
          const delay = 1000 * 2 ** attempt;
          await new Promise((r) => setTimeout(r, delay));
          await performSave(payload, attempt + 1);
          return;
        }
        setStatus('error');
        setLastError(error);
        inFlight.current = false;
      }
    },
    [saveFn, maxRetries],
  );

  const markDirty = useCallback(
    (payload: P) => {
      latest.current = payload;
      setStatus((current) => (current === 'saving' ? 'saving' : 'dirty'));
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        if (inFlight.current) return; // performSave will handle the latest
        if (latest.current === null) return;
        // Skip if nothing changed since the last persisted snapshot.
        if (JSON.stringify(latest.current) === lastSerialised.current) {
          setStatus('saved');
          return;
        }
        void performSave(latest.current);
      }, debounceMs);
    },
    [debounceMs, performSave],
  );

  const forceSave = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    if (latest.current === null) return;
    await performSave(latest.current);
  }, [performSave]);

  // Cleanup timer on unmount.
  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  return {
    status,
    savedAt,
    lastError,
    markDirty,
    forceSave,
  };
}
