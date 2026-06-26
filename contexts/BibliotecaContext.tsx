'use client';

import { createContext, useContext, useState, useMemo, useEffect, ReactNode } from 'react';
import { BibliotecaDocument } from '@/lib/biblioteca-types';
import { initialDocuments } from '@/data/biblioteca-docs';
import { apiAvailable, getApiUrl } from '@/lib/api';

interface BibliotecaContextValue {
  documents: BibliotecaDocument[];
  createDocument: (data: Omit<BibliotecaDocument, 'id' | 'updatedAt' | 'createdBy'>) => BibliotecaDocument;
  updateDocument: (id: string, data: Partial<BibliotecaDocument>) => void;
  deleteDocument: (id: string) => Promise<void>;
  removeLocalDocument: (id: string) => void;
  uploadDocument: (file: File, title: string, tags: string[], scope: string[], description?: string) => Promise<BibliotecaDocument | null>;
  allTags: string[];
  isLoading: boolean;
}

const BibliotecaContext = createContext<BibliotecaContextValue | null>(null);

export function BibliotecaProvider({ children }: { children: ReactNode }) {
  // Com API (prod): começa vazio e carrega do banco. Sem API (mock-mode dev): usa o seed local.
  const [documents, setDocuments] = useState<BibliotecaDocument[]>(
    apiAvailable() ? [] : initialDocuments,
  );
  const [isLoading, setIsLoading] = useState(false);

  // Fetch from API when available
  useEffect(() => {
    if (!apiAvailable()) return;

    async function fetchDocuments() {
      try {
        setIsLoading(true);
        const response = await fetch(getApiUrl('/api/knowledge/documents'));
        if (!response.ok) return;
        const data = await response.json();
        if (data.documents) {
          const apiDocs: BibliotecaDocument[] = data.documents.map((d: Record<string, unknown>) => ({
            id: d.id as string,
            title: d.title as string,
            content: (d.description as string) || '',
            tags: (d.tags as string[]) || [],
            scope: (d.scope as string[]) || [],
            links: [],
            files: [],
            createdBy: (d.created_by as string) || 'API',
            updatedAt: (d.updated_at as string) || new Date().toISOString(),
            fileType: d.file_type as BibliotecaDocument['fileType'],
            fileUrl: d.file_url as string | undefined,
            thumbnailUrl: d.thumbnail_url as string | undefined,
            status: d.status as BibliotecaDocument['status'],
            fileSize: d.file_size as number | undefined,
          }));
          // Fonte é o banco — substitui (não mistura com o seed mocado).
          setDocuments(apiDocs);
        }
      } catch {
        // Fallback to mock data silently
      } finally {
        setIsLoading(false);
      }
    }

    fetchDocuments();
  }, []);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    documents.forEach((doc) => doc.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [documents]);

  function createDocument(data: Omit<BibliotecaDocument, 'id' | 'updatedAt' | 'createdBy'>): BibliotecaDocument {
    const id = `doc-${crypto.randomUUID()}`;
    const newDoc: BibliotecaDocument = {
      ...data,
      id,
      updatedAt: new Date().toISOString(),
      createdBy: 'Voce',
    };
    setDocuments((prev) => [newDoc, ...prev]);
    return newDoc;
  }

  function updateDocument(id: string, data: Partial<BibliotecaDocument>) {
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...data, updatedAt: new Date().toISOString() } : d))
    );
    // Persiste status no sync map do folder-sync imediatamente, sem aguardar o poll de 3s.
    // Garante que o status sobreviva a recarregamentos de página.
    if (data.status !== undefined) {
      persistFolderSyncStatus(id, data.status);
    }
  }

  function persistFolderSyncStatus(docId: string, status: string) {
    const FOLDER_SYNC_KEY = 'sunos-folder-sync-reuniao';
    try {
      const raw = JSON.parse(localStorage.getItem(FOLDER_SYNC_KEY) || '{}') as Record<string, unknown>;
      for (const [filename, entry] of Object.entries(raw)) {
        const entryId = typeof entry === 'string' ? entry : (entry as { id: string } | null)?.id;
        if (entryId === docId) {
          raw[filename] = { id: docId, status };
          localStorage.setItem(FOLDER_SYNC_KEY, JSON.stringify(raw));
          break;
        }
      }
    } catch { /* localStorage indisponível */ }
  }

  function removeLocalDocument(id: string) {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  async function deleteDocument(id: string) {
    // Persiste no backend (hard-delete do doc + chunks). Só remove da UI após
    // sucesso, para não dar a falsa impressão de exclusão e o doc reaparecer no
    // refresh. Em mock-mode (sem API) remove direto do estado local.
    if (apiAvailable()) {
      try {
        const res = await fetch(getApiUrl(`/api/knowledge/documents/${id}`), {
          method: 'DELETE',
        });
        // 404 = doc só existe localmente (ex: sync de pasta). Remove da UI normalmente.
        // 403/500 = backend rejeitou explicitamente — mantém na UI para não sumir sem deletar.
        if (!res.ok && res.status !== 404) return;
      } catch {
        // Backend fora do ar — remove da UI assim mesmo.
        // Doc criado localmente (folder sync) nunca chegou ao backend.
      }
    }
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  async function uploadDocument(
    file: File,
    title: string,
    tags: string[],
    scope: string[],
    description?: string,
  ): Promise<BibliotecaDocument | null> {
    if (!apiAvailable()) {
      // Mock upload — create local document
      const ext = file.name.split('.').pop()?.toLowerCase() || 'txt';
      const newDoc = createDocument({
        title,
        content: description || '',
        tags,
        scope,
        links: [],
        files: [{ name: file.name, type: ext.toUpperCase(), size: `${(file.size / 1024).toFixed(0)} KB` }],
        fileType: ext as BibliotecaDocument['fileType'],
        status: 'ready',
        fileSize: file.size,
      });
      return newDoc;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title);
      formData.append('tags', tags.join(','));
      formData.append('scope', scope.join(','));
      formData.append('description', description || '');

      const response = await fetch(getApiUrl('/api/knowledge/upload'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) return null;

      const data = await response.json();
      const ext = data.file_type || file.name.split('.').pop()?.toLowerCase() || 'txt';

      const newDoc: BibliotecaDocument = {
        id: data.id,
        title: data.title,
        content: description || '',
        tags,
        scope,
        links: [],
        files: [{ name: file.name, type: ext.toUpperCase(), size: `${(file.size / 1024).toFixed(0)} KB` }],
        createdBy: 'Voce',
        updatedAt: new Date().toISOString(),
        fileType: ext as BibliotecaDocument['fileType'],
        status: 'processing',
        fileSize: file.size,
      };

      setDocuments((prev) => [newDoc, ...prev]);
      return newDoc;
    } catch {
      return null;
    }
  }

  return (
    <BibliotecaContext.Provider value={{ documents, createDocument, updateDocument, deleteDocument, removeLocalDocument, uploadDocument, allTags, isLoading }}>
      {children}
    </BibliotecaContext.Provider>
  );
}

export function useBiblioteca() {
  const ctx = useContext(BibliotecaContext);
  if (!ctx) throw new Error('useBiblioteca must be used within BibliotecaProvider');
  return ctx;
}
