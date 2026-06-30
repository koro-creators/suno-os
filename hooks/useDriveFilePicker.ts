'use client';

import { useCallback, useRef, useState } from 'react';
import { loadGapi, loadGis } from '@/lib/drive-scripts';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_ID ?? '';
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? '';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

export type DriveFilePickerStatus = 'idle' | 'loading' | 'picking' | 'error';

export interface DrivePickedFile {
  id: string;
  name: string;
  url?: string;
}

export function useDriveFilePicker(onPicked: (file: DrivePickedFile) => void) {
  const [status, setStatus] = useState<DriveFilePickerStatus>('idle');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tokenClientRef = useRef<any>(null);
  const tokenRef = useRef<string | null>(null);
  const onPickedRef = useRef(onPicked);
  onPickedRef.current = onPicked;

  const openPicker = useCallback((token: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google;
    // DOCS_IMAGES mostra o Drive filtrado por imagens — mesmo UX da Biblioteca.
    // setMimeTypes garante que .jpeg/.jpg/.png/.webp apareçam (o filtro padrão
    // do DOCS_IMAGES pode omitir extensões não-canônicas como .jpeg).
    const view = new google.picker.DocsView(google.picker.ViewId.DOCS_IMAGES);
    view.setMimeTypes('image/jpeg,image/jpg,image/png,image/webp,image/gif');

    new google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(token)
      .setDeveloperKey(API_KEY)
      .setTitle('Selecione uma imagem do Google Drive')
      .setCallback((data: { action: string; docs?: Array<{ id: string; name: string; url?: string }> }) => {
        if (data.action === google.picker.Action.PICKED) {
          const picked = data.docs?.[0];
          if (picked) onPickedRef.current({ id: picked.id, name: picked.name, url: picked.url });
        }
        if (data.action === google.picker.Action.PICKED || data.action === google.picker.Action.CANCEL) {
          setStatus('idle');
        }
      })
      .build()
      .setVisible(true);

    setStatus('picking');
  }, []);

  const openPickerRef = useRef(openPicker);
  openPickerRef.current = openPicker;

  const ensureTokenClient = useCallback(() => {
    if (tokenClientRef.current) return tokenClientRef.current;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google;
    tokenClientRef.current = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: DRIVE_SCOPE,
      callback: (resp: { access_token?: string; error?: string }) => {
        if (resp.error || !resp.access_token) { setStatus('error'); return; }
        tokenRef.current = resp.access_token;
        openPickerRef.current(resp.access_token);
      },
    });
    return tokenClientRef.current;
  }, []);

  const pick = useCallback(async () => {
    setStatus('loading');
    try {
      await Promise.all([loadGapi(), loadGis()]);
      // Reutiliza token em memória se ainda válido
      if (tokenRef.current) {
        openPickerRef.current(tokenRef.current);
      } else {
        ensureTokenClient().requestAccessToken({ prompt: '' });
      }
    } catch {
      setStatus('error');
    }
  }, [ensureTokenClient]);

  return { pick, status };
}
