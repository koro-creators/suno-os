'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useBiblioteca } from '@/contexts/BibliotecaContext';
import { KnowledgeStatus } from '@/lib/biblioteca-types';
import { getPdfClienteScope } from '@/lib/drive-upload';

const STORAGE_KEY = 'sunos-folder-sync-base';
const POLL_MS = 3000;
const DB_NAME = 'sunos-folder-sync';
const DB_STORE = 'handles';

export type BaseFolderSyncStatus = 'idle' | 'connecting' | 'connected' | 'error';

// ---------- IndexedDB helpers (mesmo DB que useFolderSync, chave 'base') ----------

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
    const req = tx.objectStore(DB_STORE).put(handle, 'base');
    req.onsuccess = () => { db.close(); resolve(); };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

async function loadHandleFromDB(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openHandleDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(DB_STORE, 'readonly');
      const req = tx.objectStore(DB_STORE).get('base');
      req.onsuccess = () => { db.close(); resolve((req.result as FileSystemDirectoryHandle) ?? null); };
      req.onerror = () => { db.close(); reject(req.error); };
    });
  } catch {
    return null;
  }
}

// ---------- Sync map em localStorage (filename → { id, status }) ----------

interface SyncEntry { id: string; status: KnowledgeStatus; }
type SyncMap = Record<string, SyncEntry>;

function getSyncMap(): SyncMap {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as SyncMap;
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
  queryPermission?: (o: { mode: string }) => Promise<PermissionState>;
  requestPermission?: (o: { mode: string }) => Promise<PermissionState>;
};

export function useBaseFolderSync(): { status: BaseFolderSyncStatus; connect: () => void } {
  const { documents, createDocument, removeLocalDocument } = useBiblioteca();
  const [status, setStatus] = useState<BaseFolderSyncStatus>('idle');
  const [dirHandle, setDirHandle] = useState<FileSystemDirectoryHandle | null>(null);

  const createRef = useRef(createDocument);
  const removeRef = useRef(removeLocalDocument);
  const documentsRef = useRef(documents);

  useEffect(() => { createRef.current = createDocument; });
  useEffect(() => { removeRef.current = removeLocalDocument; });
  useEffect(() => { documentsRef.current = documents; });

  // Restaura handle persistido ao montar
  useEffect(() => {
    loadHandleFromDB().then(async (handle) => {
      if (!handle) return;
      const h = handle as FSHandleWithPerm;
      try {
        const perm = await h.queryPermission?.({ mode: 'readwrite' });
        if (perm === 'granted') {
          setDirHandle(handle);
          setStatus('connecting');
        }
      } catch { /* sem permissão — permanece idle */ }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const connect = useCallback(async () => {
    const saved = await loadHandleFromDB();
    if (saved) {
      const h = saved as FSHandleWithPerm;
      try {
        const perm = await h.requestPermission?.({ mode: 'readwrite' });
        if (perm === 'granted') {
          setDirHandle(saved);
          setStatus('connecting');
          return;
        }
      } catch { /* cai no picker */ }
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const handle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'desktop',
      }) as FileSystemDirectoryHandle;
      await saveHandleToDB(handle);
      setDirHandle(handle);
      setStatus('connecting');
    } catch {
      // Usuário cancelou
    }
  }, []);

  // Polling loop — sincroniza arquivos da pasta base com a Biblioteca
  useEffect(() => {
    if (!dirHandle) return;
    let cancelled = false;

    async function poll() {
      if (cancelled || !dirHandle) return;
      try {
        const files: string[] = [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for await (const [name, entry] of (dirHandle as any).entries() as AsyncIterable<[string, FileSystemHandle]>) {
          if (!name.startsWith('.') && entry.kind === 'file') files.push(name);
        }
        if (cancelled) return;
        setStatus('connected');

        const currentFiles = new Set(files);
        const map = getSyncMap();

        for (const filename of files) {
          const entry = map[filename];
          const prevId = entry?.id;
          const existingDoc = prevId ? documentsRef.current.find((d) => d.id === prevId) : undefined;
          if (existingDoc) {
            if (existingDoc.status && existingDoc.status !== entry.status) {
              map[filename] = { id: prevId, status: existingDoc.status };
            }
            continue;
          }

          let fileContent = '';
          try {
            const fh = await dirHandle.getFileHandle(filename);
            const f = await fh.getFile();
            if (/\.(txt|md|csv|json|xml|html|htm)$/i.test(filename)) {
              fileContent = await f.text();
            }
          } catch { /* arquivo removido entre iterações */ }

          const doc = createRef.current({
            title: stripExtension(filename),
            content: fileContent,
            tags: ['base'],
            scope: [getPdfClienteScope(filename)],
            links: [],
            files: [{ name: filename, type: 'Base', size: '' }],
            docType: 'base',
            status: entry?.status ?? 'gerado',
          });
          map[filename] = { id: doc.id, status: entry?.status ?? 'gerado' };
        }

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
