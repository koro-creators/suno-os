'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useBiblioteca } from '@/contexts/BibliotecaContext';
import { apiAvailable } from '@/lib/api';
import { setDriveBaseAccess, clearDriveBaseAccess } from '@/lib/drive-token-store';
import { loadGapi, loadGis } from '@/lib/drive-scripts';
import { getPdfClienteScope } from '@/lib/drive-upload';
import { useDriveEvents } from './useDriveEvents';

const STORAGE_KEY = 'sunos-drive-sync-base';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file';
const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const MAX_FILES = 50;

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID ?? '';
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '';

export type BaseDriveSyncStatus = 'idle' | 'stored' | 'connecting' | 'connected' | 'error';

interface StoredFolder { id: string; name: string }

function getStored(): StoredFolder | null {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null'); }
  catch { return null; }
}
function setStored(f: StoredFolder | null) {
  if (f) localStorage.setItem(STORAGE_KEY, JSON.stringify(f));
  else localStorage.removeItem(STORAGE_KEY);
}

async function listFolderFiles(folderId: string, token: string) {
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

export function useBaseDriveSync(): {
  status: BaseDriveSyncStatus;
  connect: () => void;
  changeFolder: () => void;
  folderName: string | null;
} {
  const { createDocument, removeLocalDocument, documents } = useBiblioteca();
  const [status, setStatus] = useState<BaseDriveSyncStatus>('idle');
  const [folder, setFolder] = useState<StoredFolder | null>(null);
  const tokenRef = useRef<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tokenClientRef = useRef<any>(null);
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
      const currentTitles = new Set(files.map((f) => stripExtension(f.name)));
      const existing = documentsRef.current.filter((d) => d.docType === 'base');

      existing.forEach((d) => {
        if (!currentTitles.has(d.title)) removeRef.current(d.id);
      });

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
          tags: ['base'],
          scope: [getPdfClienteScope(file.name)],
          links: file.webViewLink ? [{ label: 'Ver no Drive', url: file.webViewLink }] : [],
          files: [{ name: file.name, type: 'Base', size: '' }],
          docType: 'base',
          status: 'gerado',
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
      .setTitle('Selecione a pasta base')
      .setCallback(async (data: { action: string; docs?: Array<{ id: string; name: string }> }) => {
        if (data.action !== google.picker.Action.PICKED) {
          if (data.action === google.picker.Action.CANCEL) {
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
        setDriveBaseAccess(token, picked.id);
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
          clearDriveBaseAccess();
          setStatus(getStored() ? 'stored' : 'idle');
          return;
        }
        tokenRef.current = resp.access_token;
        if (pendingPickerRef.current) {
          pendingPickerRef.current = false;
          openFolderPickerRef.current(resp.access_token);
          return;
        }
        const stored = getStored();
        if (stored) {
          setDriveBaseAccess(resp.access_token, stored.id);
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
        setDriveBaseAccess(tokenRef.current, stored.id);
        await syncFolder(stored.id, tokenRef.current);
        void registerDriveWatch(stored.id, tokenRef.current);
      } else if (stored) {
        ensureTokenClient().requestAccessToken({ prompt: '' });
      } else {
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
        openFolderPickerRef.current(tokenRef.current);
      } else {
        pendingPickerRef.current = true;
        ensureTokenClient().requestAccessToken({ prompt: '' });
      }
    } catch {
      pendingPickerRef.current = false;
      setStatus('error');
    }
  }, [ensureTokenClient]);

  // ---------- Auto-reconnect on mount ----------

  const connectRef = useRef(connect);
  useEffect(() => { connectRef.current = connect; }, [connect]);
  const didAutoConnectRef = useRef(false);
  useEffect(() => {
    const stored = getStored();
    if (!stored || didAutoConnectRef.current) return;
    didAutoConnectRef.current = true;
    setFolder(stored);
    void connectRef.current();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
