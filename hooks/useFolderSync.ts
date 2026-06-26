'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useBiblioteca } from '@/contexts/BibliotecaContext';
import { KnowledgeStatus } from '@/lib/biblioteca-types';

const STORAGE_KEY = 'sunos-folder-sync-reuniao';
const POLL_MS = 3000;
const DB_NAME = 'sunos-folder-sync';
const DB_STORE = 'handles';

export type FolderSyncStatus = 'idle' | 'connecting' | 'connected' | 'error';

// ---------- IndexedDB helpers to persist the directory handle ----------

function openHandleDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(DB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveHandleToDB(handle: FileSystemDirectoryHandle): Promise<void> {
  const db = await openHandleDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(DB_STORE, 'readwrite');
    const req = tx.objectStore(DB_STORE).put(handle, 'reuniao');
    req.onsuccess = () => { db.close(); resolve(); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

async function loadHandleFromDB(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openHandleDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readonly');
      const req = tx.objectStore(DB_STORE).get('reuniao');
      req.onsuccess = () => { db.close(); resolve((req.result as FileSystemDirectoryHandle) ?? null); };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  } catch {
    return null;
  }
}

// ---------- Sync map in localStorage (filename → { id, status }) ----------

interface SyncEntry { id: string; status: KnowledgeStatus; }
type SyncMap = Record<string, SyncEntry>;

function getSyncMap(): SyncMap {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Record<string, unknown>;
    const result: SyncMap = {};
    for (const [k, v] of Object.entries(raw)) {
      // Migrate old format (string docId) to new format
      if (typeof v === 'string') result[k] = { id: v, status: 'novo' };
      else result[k] = v as SyncEntry;
    }
    return result;
  } catch { return {}; }
}

function saveSyncMap(map: SyncMap) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

function stripExtension(filename: string): string {
  return filename.replace(/\.[^.]+$/, '');
}

// ---------- Hook ----------

type FSHandleWithPerm = FileSystemDirectoryHandle & {
  queryPermission?: (o: { mode: 'read' }) => Promise<PermissionState>;
  requestPermission?: (o: { mode: 'read' }) => Promise<PermissionState>;
};

export function useFolderSync(): { status: FolderSyncStatus; connect: () => void } {
  const { documents, createDocument, removeLocalDocument } = useBiblioteca();
  const [status, setStatus] = useState<FolderSyncStatus>('idle');
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);

  const createRef = useRef(createDocument);
  const removeRef = useRef(removeLocalDocument);
  const documentsRef = useRef(documents);

  useEffect(() => { createRef.current = createDocument; });
  useEffect(() => { removeRef.current = removeLocalDocument; });
  useEffect(() => { documentsRef.current = documents; });

  // On mount: try to restore persisted handle
  useEffect(() => {
    loadHandleFromDB().then(async (handle) => {
      if (!handle) return;
      const h = handle as FSHandleWithPerm;
      try {
        const perm = await h.queryPermission?.({ mode: 'read' });
        if (perm === 'granted') {
          setDirHandle(handle);
          setStatus('connecting');
        }
      } catch {
        // ignore — will remain 'idle'
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // User-triggered: pick or reconnect folder
  const connect = useCallback(async () => {
    const saved = await loadHandleFromDB();
    if (saved) {
      const h = saved as FSHandleWithPerm;
      try {
        const perm = await h.requestPermission?.({ mode: 'read' });
        if (perm === 'granted') {
          setDirHandle(saved);
          setStatus('connecting');
          return;
        }
      } catch {
        // fall through to showDirectoryPicker
      }
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handle = await (window as any).showDirectoryPicker({
        mode: 'read',
        startIn: 'desktop',
      }) as FileSystemDirectoryHandle;
      await saveHandleToDB(handle);
      setDirHandle(handle);
      setStatus('connecting');
    } catch {
      // User cancelled
    }
  }, []);

  // Polling loop
  useEffect(() => {
    if (!dirHandle) return;
    let cancelled = false;

    async function poll() {
      if (cancelled || !dirHandle) return;
      try {
        // 1. Read current files from folder
        const files: string[] = [];
        for await (const [name, entry] of dirHandle.entries()) {
          if (!name.startsWith('.') && entry.kind === 'file') files.push(name);
        }
        if (cancelled) return;
        setStatus('connected');

        const currentFiles = new Set(files);
        const map = getSyncMap();

        // 2. Add docs for files not yet tracked; persist status for already-tracked ones
        for (const filename of files) {
          const entry = map[filename];
          const prevId = entry?.id;
          const existingDoc = prevId ? documentsRef.current.find((d) => d.id === prevId) : undefined;
          if (existingDoc) {
            // Keep stored status in sync so it survives page reload
            if (existingDoc.status && existingDoc.status !== entry.status) {
              map[filename] = { id: prevId, status: existingDoc.status };
            }
            continue;
          }
          // Lê o conteúdo textual do arquivo para passar ao agente via trigger_doc.
          let fileContent = '';
          try {
            const fh = await dirHandle.getFileHandle(filename);
            const f = await fh.getFile();
            // Lê apenas arquivos de texto (txt, md, csv). Binários retornam string vazia.
            if (/\.(txt|md|csv|json|xml|html|htm)$/i.test(filename)) {
              fileContent = await f.text();
            }
          } catch { /* arquivo removido entre iterações */ }

          const doc = createRef.current({
            title: stripExtension(filename),
            content: fileContent,
            tags: ['reuniao'],
            scope: ['suno'],
            links: [],
            files: [{ name: filename, type: 'Reunião', size: '' }],
            docType: 'reuniao',
            status: entry?.status ?? 'novo',
          });
          map[filename] = { id: doc.id, status: entry?.status ?? 'novo' };
        }

        // 3. Remove docs for files no longer in folder
        Object.entries(map).forEach(([filename, entry]) => {
          if (!currentFiles.has(filename)) {
            removeRef.current(entry.id);
            delete map[filename];
          }
        });

        saveSyncMap(map);
      } catch {
        if (!cancelled) setStatus('error');
      }
    }

    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => { cancelled = true; clearInterval(timer); };
  }, [dirHandle]); // eslint-disable-line react-hooks/exhaustive-deps

  return { status, connect };
}
