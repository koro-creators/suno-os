'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useBiblioteca } from '@/contexts/BibliotecaContext';
import { apiAvailable } from '@/lib/api';
import { loadGapi, loadGis } from '@/lib/drive-scripts';
import { useDriveEvents } from './useDriveEvents';

const STORAGE_KEY = 'sunos-drive-sync-reuniao';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const MAX_FILES = 50;

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID ?? '';
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '';

export type DriveSyncStatus = 'idle' | 'stored' | 'connecting' | 'connected' | 'error';

interface StoredFolder { id: string; name: string }

function getStored(): StoredFolder | null {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'); }
  catch { return null; }
}
function setStored(f: StoredFolder | null) {
  if (f) localStorage.setItem(STORAGE_KEY, JSON.stringify(f));
  else localStorage.removeItem(STORAGE_KEY);
}

// ---------- Drive API helpers ----------

async function listFolderFiles(folderId: string, token: string): Promise<Array<{
  id: string; name: string; mimeType: string; modifiedTime: string; webViewLink?: string;
}>> {
  const params = new URLSearchParams({
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'files(id,name,mimeType,modifiedTime,webViewLink)',
    pageSize: String(MAX_FILES),
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
  });
  const res = await fetch(`${DRIVE_API}/files?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Drive API ${res.status}`);
  const data = await res.json() as { files: Array<{ id: string; name: string; mimeType: string; modifiedTime: string; webViewLink?: string }> };
  return data.files ?? [];
}

const EXPORT_MIME: Record<string, string> = {
  'application/vnd.google-apps.document': 'text/plain',
  'application/vnd.google-apps.spreadsheet': 'text/csv',
  'application/vnd.google-apps.presentation': 'text/plain',
};

async function fetchFileText(file: { id: string; mimeType: string }, token: string): Promise<string | null> {
  try {
    const headers = { Authorization: `Bearer ${token}` };
    if (file.mimeType in EXPORT_MIME) {
      const res = await fetch(
        `${DRIVE_API}/files/${file.id}/export?mimeType=${encodeURIComponent(EXPORT_MIME[file.mimeType])}`,
        { headers },
      );
      if (!res.ok) return null;
      return (await res.text()).trim() || null;
    }
    if (file.mimeType.startsWith('text/') || file.mimeType === 'application/json') {
      const res = await fetch(`${DRIVE_API}/files/${file.id}?alt=media&supportsAllDrives=true`, { headers });
      if (!res.ok) return null;
      return (await res.text()).trim() || null;
    }
    return null;
  } catch {
    return null;
  }
}

function stripExtension(name: string) { return name.replace(/\.[^.]+$/, ''); }

// ---------- Status persistence por título (sobrevive reload) ----------
// Necessário porque docs de reunião são locais (não persistidos no backend).
// Ao recriar um doc após reload, restauramos o status em vez de sempre usar 'novo'.

const STATUS_KEY = 'sunos-reuniao-file-status';

function getStoredStatus(title: string): 'novo' | 'utilizado' {
  try {
    const map = JSON.parse(localStorage.getItem(STATUS_KEY) ?? '{}') as Record<string, string>;
    return map[title] === 'utilizado' ? 'utilizado' : 'novo';
  } catch { return 'novo'; }
}

function clearStoredStatus(title: string): void {
  try {
    const map = JSON.parse(localStorage.getItem(STATUS_KEY) ?? '{}') as Record<string, string>;
    delete map[title];
    localStorage.setItem(STATUS_KEY, JSON.stringify(map));
  } catch {}
}

export function markReuniaoFileUtilizado(title: string): void {
  try {
    const map = JSON.parse(localStorage.getItem(STATUS_KEY) ?? '{}') as Record<string, string>;
    map[title] = 'utilizado';
    localStorage.setItem(STATUS_KEY, JSON.stringify(map));
  } catch {}
}

// ---------- Drive Watch registration — delegado ao backend ----------
// O backend descobre a URL pública automaticamente (cloudflared em dev, env var em prod).

async function registerDriveWatch(folderId: string, token: string): Promise<void> {
  if (!apiAvailable()) return;
  try {
    const base = process.env.NEXT_PUBLIC_API_URL ?? '';
    await fetch(`${base}/api/drive/watch/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder_id: folderId, access_token: token }),
    });
  } catch { /* non-blocking */ }
}

// ---------- Hook ----------

export function useDriveSync(): {
  status: DriveSyncStatus;
  connect: () => void;
  changeFolder: () => void;
  folderName: string | null;
} {
  const { createDocument, removeLocalDocument, documents } = useBiblioteca();
  const [status, setStatus] = useState<DriveSyncStatus>('idle');
  const [folder, setFolder] = useState<StoredFolder | null>(null);
  const tokenRef = useRef<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tokenClientRef = useRef<any>(null);
  // When true, the next token callback opens the picker instead of re-syncing
  const pendingPickerRef = useRef(false);
  const createRef = useRef(createDocument);
  const removeRef = useRef(removeLocalDocument);
  const documentsRef = useRef(documents);
  useEffect(() => { createRef.current = createDocument; });
  useEffect(() => { removeRef.current = removeLocalDocument; });
  useEffect(() => { documentsRef.current = documents; });
  // Guard: evita chamadas concorrentes de syncFolder (SSE + auto-connect em paralelo
  // causam triplicatas pois todas lêem documentsRef antes de qualquer criar o doc).
  const syncInProgressRef = useRef(false);

  // ---------- syncFolder ----------

  const syncFolder = useCallback(async (folderId: string, token: string) => {
    if (syncInProgressRef.current) return;
    syncInProgressRef.current = true;
    setStatus('connecting');
    try {
      const files = await listFolderFiles(folderId, token);
      // Compara sempre por título sem extensão (Drive pode retornar "ata.docx" mas
      // o doc fica armazenado como "ata"). Sem esse strip o remove nunca acerta.
      const currentTitles = new Set(files.map((f) => stripExtension(f.name)));
      const existing = documentsRef.current.filter((d) => d.docType === 'reuniao');

      existing.forEach((d) => {
        if (!currentTitles.has(d.title)) {
          removeRef.current(d.id);
          clearStoredStatus(d.title);
        }
      });

      // Calcula quais títulos sobrevivem após o remove para não pular re-adições
      const survivingTitles = new Set(
        existing.filter((d) => currentTitles.has(d.title)).map((d) => d.title),
      );

      for (const file of files) {
        const title = stripExtension(file.name);
        if (survivingTitles.has(title)) continue;
        const content = (await fetchFileText(file, token)) ?? '';
        createRef.current({
          title,
          content,
          tags: ['reuniao'],
          scope: ['suno'],
          links: file.webViewLink ? [{ label: 'Ver no Drive', url: file.webViewLink }] : [],
          files: [{ name: file.name, type: 'Reunião', size: '' }],
          docType: 'reuniao',
          status: getStoredStatus(title),
        });
      }
      setStatus('connected');
    } catch {
      setStatus('error');
    } finally {
      syncInProgressRef.current = false;
    }
  }, []);

  // ---------- openFolderPicker (extracted so changeFolder can call it directly) ----------

  // Keep a stable ref so the token-client callback (created once) always calls the latest version
  const openFolderPickerRef = useRef<(token: string) => void>(() => { /* noop until init */ });

  const openFolderPicker = useCallback((token: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google;
    const view = new google.picker.DocsView(google.picker.ViewId.FOLDERS)
      .setSelectFolderEnabled(true)
      .setMimeTypes('application/vnd.google-apps.folder');

    new google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(token)
      .setDeveloperKey(API_KEY)
      .setTitle('Selecione a pasta de reuniões')
      .setCallback(async (data: { action: string; docs?: Array<{ id: string; name: string }> }) => {
        if (data.action !== google.picker.Action.PICKED) {
          if (data.action === google.picker.Action.CANCEL) {
            // Reads from localStorage — always accurate, no stale closure risk
            setStatus(getStored() ? 'connected' : 'idle');
          }
          return;
        }
        const picked = data.docs?.[0];
        if (!picked) return;
        const newFolder = { id: picked.id, name: picked.name };
        setFolder(newFolder);
        setStored(newFolder);
        tokenRef.current = token;
        await syncFolder(picked.id, token);
        void registerDriveWatch(picked.id, token);
      })
      .build()
      .setVisible(true);
  }, [syncFolder]);

  useEffect(() => { openFolderPickerRef.current = openFolderPicker; }, [openFolderPicker]);

  // ---------- Token client (created once; callback uses refs so it's always fresh) ----------

  const ensureTokenClient = useCallback(() => {
    if (tokenClientRef.current) return tokenClientRef.current;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google;
    tokenClientRef.current = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: DRIVE_SCOPE,
      callback: (resp: { access_token?: string; error?: string }) => {
        if (resp.error || !resp.access_token) {
          pendingPickerRef.current = false;
          setStatus(getStored() ? 'stored' : 'idle');
          return;
        }
        tokenRef.current = resp.access_token;
        // changeFolder sets this flag so the callback opens the picker instead of re-syncing
        if (pendingPickerRef.current) {
          pendingPickerRef.current = false;
          openFolderPickerRef.current(resp.access_token);
          return;
        }
        const stored = getStored();
        if (stored) {
          void syncFolder(stored.id, resp.access_token);
          void registerDriveWatch(stored.id, resp.access_token);
        } else {
          openFolderPickerRef.current(resp.access_token);
        }
      },
    });
    return tokenClientRef.current;
  }, [syncFolder]);

  // ---------- connect — reconnect to stored folder or first-time setup ----------

  const connect = useCallback(async () => {
    setStatus('connecting');
    try {
      await Promise.all([loadGapi(), loadGis()]);
      const stored = getStored();
      if (stored && tokenRef.current) {
        // Token still valid — re-sync directly without any popup
        await syncFolder(stored.id, tokenRef.current);
        void registerDriveWatch(stored.id, tokenRef.current);
      } else if (stored) {
        // Token expired — silent refresh (no popup if Google session is alive)
        ensureTokenClient().requestAccessToken({ prompt: '' });
      } else {
        // First time — need both auth + folder selection
        ensureTokenClient().requestAccessToken({ prompt: 'consent' });
      }
    } catch {
      setStatus('error');
    }
  }, [syncFolder, ensureTokenClient]);

  // ---------- changeFolder — open picker without clearing the current folder ----------

  const changeFolder = useCallback(async () => {
    setStatus('connecting');
    try {
      await Promise.all([loadGapi(), loadGis()]);
      if (tokenRef.current) {
        // Happy path: token still valid, open picker immediately (no auth popup)
        openFolderPickerRef.current(tokenRef.current);
      } else {
        // Token expired — get a new one silently, then open picker via the flag
        pendingPickerRef.current = true;
        ensureTokenClient().requestAccessToken({ prompt: '' });
      }
    } catch {
      pendingPickerRef.current = false;
      setStatus('error');
    }
  }, [ensureTokenClient]);

  // ---------- Restore folder name on mount (auto-connect is triggered by DriveSyncContext after base connects) ----------

  useEffect(() => {
    const stored = getStored();
    if (stored) {
      setFolder(stored);
      setStatus('stored');
    }
  }, []);

  // ---------- Real-time SSE sync ----------

  const folderRef = useRef(folder);
  useEffect(() => { folderRef.current = folder; }, [folder]);
  const handleFolderChanged = useCallback(() => {
    if (folderRef.current && tokenRef.current) {
      void syncFolder(folderRef.current.id, tokenRef.current);
    }
  }, [syncFolder]);
  useDriveEvents(handleFolderChanged, status === 'connected');


  return { status, connect, changeFolder, folderName: folder?.name ?? null };
}
