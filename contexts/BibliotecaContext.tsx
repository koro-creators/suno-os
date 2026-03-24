'use client';

import { createContext, useContext, useState, useMemo, ReactNode } from 'react';
import { BibliotecaDocument } from '@/lib/biblioteca-types';
import { initialDocuments } from '@/data/biblioteca-docs';

interface BibliotecaContextValue {
  documents: BibliotecaDocument[];
  createDocument: (data: Omit<BibliotecaDocument, 'id' | 'updatedAt' | 'createdBy'>) => BibliotecaDocument;
  updateDocument: (id: string, data: Partial<BibliotecaDocument>) => void;
  deleteDocument: (id: string) => void;
  allTags: string[];
}

const BibliotecaContext = createContext<BibliotecaContextValue | null>(null);

export function BibliotecaProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<BibliotecaDocument[]>(initialDocuments);

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
      createdBy: 'Você',
    };
    setDocuments((prev) => [newDoc, ...prev]);
    return newDoc;
  }

  function updateDocument(id: string, data: Partial<BibliotecaDocument>) {
    setDocuments((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...data, updatedAt: new Date().toISOString() } : d))
    );
  }

  function deleteDocument(id: string) {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <BibliotecaContext.Provider value={{ documents, createDocument, updateDocument, deleteDocument, allTags }}>
      {children}
    </BibliotecaContext.Provider>
  );
}

export function useBiblioteca() {
  const ctx = useContext(BibliotecaContext);
  if (!ctx) throw new Error('useBiblioteca must be used within BibliotecaProvider');
  return ctx;
}
