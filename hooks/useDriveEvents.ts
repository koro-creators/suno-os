'use client';

import { useEffect, useRef } from 'react';
import { apiAvailable } from '@/lib/api';

const DRIVE_EVENTS_PATH = '/api/drive/events';

/**
 * Subscribes to the backend SSE stream for Drive Push Notifications.
 * Calls onFolderChanged whenever Google Drive notifies of a change
 * in any watched folder.
 *
 * Only active when:
 *   - enabled === true (caller controls this — typically "folder connected")
 *   - NEXT_PUBLIC_API_URL is set (apiAvailable())
 *
 * EventSource auto-reconnects on network drops; the backend sends
 * keepalive comments every 30 s to prevent proxy timeouts.
 */
export function useDriveEvents(onFolderChanged: () => void, enabled: boolean): void {
  const callbackRef = useRef(onFolderChanged);
  useEffect(() => { callbackRef.current = onFolderChanged; });

  useEffect(() => {
    if (!enabled || !apiAvailable()) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';
    const es = new EventSource(`${apiUrl}${DRIVE_EVENTS_PATH}`);

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data as string) as { type: string };
        if (data.type === 'folder_changed') {
          callbackRef.current();
        }
      } catch { /* ignore malformed frames */ }
    };

    return () => es.close();
  }, [enabled]);
}
