'use client';

import { useState, useMemo, useCallback } from 'react';
import { Plus } from 'lucide-react';
import AppHeader from '@/components/layout/AppHeader';
import BibliotecaCard from '@/components/biblioteca/BibliotecaCard';
import BibliotecaFilters from '@/components/biblioteca/BibliotecaFilters';
import BibliotecaModal from '@/components/biblioteca/BibliotecaModal';
import Toast from '@/components/ui/Toast';
import { useBiblioteca } from '@/contexts/BibliotecaContext';
import { BibliotecaDocument } from '@/lib/biblioteca-types';

export default function BibliotecaPage() {
  const { documents, createDocument, updateDocument, deleteDocument, allTags } = useBiblioteca();
  const [search, setSearch] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [modalDoc, setModalDoc] = useState<BibliotecaDocument | null | undefined>(undefined);
  const [toast, setToast] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      if (search) {
        const q = search.toLowerCase();
        if (!doc.title.toLowerCase().includes(q) && !doc.content.toLowerCase().includes(q)) return false;
      }
      if (selectedScopes.length > 0) {
        if (!doc.scope.some((s) => selectedScopes.includes(s))) return false;
      }
      if (selectedTags.length > 0) {
        if (!doc.tags.some((t) => selectedTags.includes(t))) return false;
      }
      return true;
    });
  }, [documents, search, selectedScopes, selectedTags]);

  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    filtered.forEach((doc) => doc.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [filtered]);

  const handleSave = (data: Omit<BibliotecaDocument, 'id' | 'updatedAt' | 'createdBy'>) => {
    if (modalDoc) {
      updateDocument(modalDoc.id, data);
      setToast('Item salvo');
    } else {
      createDocument(data);
      setToast('Item criado');
    }
    setModalDoc(undefined);
  };

  const handleDelete = (id: string) => {
    if (deleteConfirmId === id) {
      deleteDocument(id);
      setDeleteConfirmId(null);
      setExpandedId(null);
      setToast('Item excluído');
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  const handleCloseToast = useCallback(() => setToast(null), []);

  return (
    <>
      <AppHeader
        breadcrumbs={[{ label: 'Biblioteca', href: '/biblioteca' }]}
      />
      <main id="main-content" className="page-enter" style={{ flex: 1, overflow: 'auto', padding: 24 }}>
        {/* Title section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 300, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
              Biblioteca
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Base de conhecimento
            </p>
          </div>
          <button
            onClick={() => setModalDoc(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backgroundColor: 'var(--sun)',
              color: 'var(--void)',
              border: 'none',
              borderRadius: 9999,
              padding: '8px 16px',
              fontSize: '0.8rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'opacity 150ms ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
          >
            <Plus size={14} strokeWidth={2} />
            Novo Item
          </button>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: 20 }}>
          <BibliotecaFilters
            search={search}
            onSearchChange={setSearch}
            selectedScopes={selectedScopes}
            onScopesChange={setSelectedScopes}
            selectedTags={selectedTags}
            onTagsChange={setSelectedTags}
            availableTags={availableTags}
          />
        </div>

        {/* Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 12,
          }}
        >
          {filtered.map((doc) => (
            <BibliotecaCard
              key={doc.id}
              doc={doc}
              isExpanded={expandedId === doc.id}
              onToggleExpand={() => setExpandedId(expandedId === doc.id ? null : doc.id)}
              onEdit={() => setModalDoc(doc)}
              onDelete={() => handleDelete(doc.id)}
              isDeleteConfirm={deleteConfirmId === doc.id}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 48 }}>
            Nenhum item encontrado.
          </p>
        )}
      </main>

      {/* Modal */}
      {modalDoc !== undefined && (
        <BibliotecaModal
          document={modalDoc}
          onSave={handleSave}
          onClose={() => setModalDoc(undefined)}
          allTags={allTags}
        />
      )}

      <Toast message={toast || ''} visible={!!toast} onClose={handleCloseToast} />
    </>
  );
}
