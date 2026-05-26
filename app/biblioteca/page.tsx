'use client';

import { useState, useMemo, useCallback } from 'react';
import { Add, Book, Dashboard, Search, Task } from '@carbon/icons-react';
import AppHeader from '@/components/layout/AppHeader';
import BibliotecaCard from '@/components/biblioteca/BibliotecaCard';
import BibliotecaTable from '@/components/biblioteca/BibliotecaTable';
import BibliotecaSidebar from '@/components/biblioteca/BibliotecaSidebar';
import BibliotecaDrawer from '@/components/biblioteca/BibliotecaDrawer';
import BibliotecaModal from '@/components/biblioteca/BibliotecaModal';
import EmptyState from '@/components/ui/EmptyState';
import Toast from '@/components/ui/Toast';
import { useBiblioteca } from '@/contexts/BibliotecaContext';
import { BibliotecaDocument } from '@/lib/biblioteca-types';

type ViewMode = 'table' | 'grid';

/** Map sidebar type filter keys to file types */
const TYPE_KEY_TO_EXTENSIONS: Record<string, string[]> = {
  pdf: ['pdf'],
  image: ['png', 'jpg', 'webp'],
  audio: ['mp3', 'wav'],
  video: ['mp4', 'mov'],
  text: ['txt', 'md', 'docx'],
};

export default function BibliotecaPage() {
  const { documents, createDocument, updateDocument, deleteDocument, allTags } = useBiblioteca();

  // Filters
  const [search, setSearch] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // View
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  // Card expand (grid mode)
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Drawer (table mode)
  const [drawerDoc, setDrawerDoc] = useState<BibliotecaDocument | null>(null);

  // Modal (create/edit)
  const [modalDoc, setModalDoc] = useState<BibliotecaDocument | null | undefined>(undefined);

  // Toast + delete confirm
  const [toast, setToast] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ---------- Filtering ----------
  const filtered = useMemo(() => {
    return documents.filter((doc) => {
      // Search
      if (search) {
        const q = search.toLowerCase();
        if (!doc.title.toLowerCase().includes(q) && !doc.content.toLowerCase().includes(q))
          return false;
      }
      // Scope
      if (selectedScopes.length > 0) {
        if (!doc.scope.some((s) => selectedScopes.includes(s))) return false;
      }
      // Tags
      if (selectedTags.length > 0) {
        if (!doc.tags.some((t) => selectedTags.includes(t))) return false;
      }
      // File type / docType
      if (selectedTypes.length > 0) {
        const includesReuniao = selectedTypes.includes('reuniao');
        const extensionKeys = selectedTypes.filter((k) => k !== 'reuniao');
        const allowedExtensions = extensionKeys.flatMap((k) => TYPE_KEY_TO_EXTENSIONS[k] ?? []);
        const isReuniao = doc.docType === 'reuniao';
        const matchesReuniao = isReuniao && includesReuniao;
        const matchesExtension =
          !isReuniao &&
          allowedExtensions.length > 0 &&
          !!doc.fileType &&
          allowedExtensions.includes(doc.fileType.toLowerCase());
        if (!matchesReuniao && !matchesExtension) return false;
      }
      return true;
    });
  }, [documents, search, selectedScopes, selectedTags, selectedTypes]);

  // Popular tags derived from filtered results
  const popularTags = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((doc) =>
      doc.tags.forEach((t) => {
        if (t.trim()) counts[t] = (counts[t] || 0) + 1;
      }),
    );
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);
  }, [filtered]);

  const activeFilterCount = selectedScopes.length + selectedTypes.length + selectedTags.length;

  // ---------- Handlers ----------
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

  const handleDelete = (doc: BibliotecaDocument) => {
    if (deleteConfirmId === doc.id) {
      deleteDocument(doc.id);
      setDeleteConfirmId(null);
      setExpandedId(null);
      setDrawerDoc(null);
      setToast('Item excluido');
    } else {
      setDeleteConfirmId(doc.id);
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  const handleDeleteById = (id: string) => {
    const doc = documents.find((d) => d.id === id);
    if (doc) handleDelete(doc);
  };

  const handleEdit = (doc: BibliotecaDocument) => {
    setDrawerDoc(null);
    setModalDoc(doc);
  };

  const handleCloseToast = useCallback(() => setToast(null), []);

  return (
    <>
      <AppHeader breadcrumbs={[{ label: 'Biblioteca', href: '/biblioteca' }]} />

      <main
        id="main-content"
        className="page-enter"
        style={{ display: 'flex', flex: 1, overflow: 'hidden' }}
      >
        {/* Sidebar */}
        <BibliotecaSidebar
          selectedScopes={selectedScopes}
          onScopesChange={setSelectedScopes}
          selectedTypes={selectedTypes}
          onTypesChange={setSelectedTypes}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
          popularTags={popularTags}
        />

        {/* Main content area */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header row: title + search + toggle + upload */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1
                style={{
                  fontSize: '2rem',
                  fontWeight: 300,
                  color: 'var(--text-primary)',
                  margin: 0,
                  lineHeight: 1.2,
                }}
              >
                Biblioteca
              </h1>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                Base de conhecimento
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {/* Search */}
              <div style={{ position: 'relative', width: 220 }}>
                <Search
                  size={13}
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    pointerEvents: 'none',
                  }}
                />
                <input
                  type="text"
                  placeholder="Buscar documento..."
                  aria-label="Buscar documento"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: '100%',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 9999,
                    padding: '7px 12px 7px 32px',
                    fontSize: '0.8rem',
                    color: 'var(--text-primary)',
                    outline: 'none',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--sun)';
                    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(255,200,1,0.15)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-subtle)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              {/* View toggle */}
              <div
                style={{
                  display: 'flex',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                <button
                  onClick={() => setViewMode('table')}
                  aria-pressed={viewMode === 'table'}
                  aria-label="Visualizacao em tabela"
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '6px 8px',
                    cursor: 'pointer',
                    color: viewMode === 'table' ? 'var(--sun)' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'color 150ms ease',
                  }}
                >
                  <Task size={16} />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  aria-pressed={viewMode === 'grid'}
                  aria-label="Visualizacao em grade"
                  style={{
                    background: 'none',
                    border: 'none',
                    borderLeft: '1px solid var(--border-subtle)',
                    padding: '6px 8px',
                    cursor: 'pointer',
                    color: viewMode === 'grid' ? 'var(--sun)' : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'color 150ms ease',
                  }}
                >
                  <Dashboard size={16} />
                </button>
              </div>

              {/* Upload button */}
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
                  whiteSpace: 'nowrap',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = '0.9';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.opacity = '1';
                }}
              >
                <Add size={14} />
                Novo Item
              </button>
            </div>
          </div>

          {/* Active filter indicator (inline) */}
          {activeFilterCount > 0 && (
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              {activeFilterCount} {activeFilterCount === 1 ? 'filtro ativo' : 'filtros ativos'} aplicados a {filtered.length} documentos
            </div>
          )}

          {/* No data at all — rich empty state with CTA */}
          {documents.length === 0 && (
            <EmptyState
              icon={Book}
              title="Biblioteca vazia"
              description="Adicione documentos, briefings e referências para enriquecer suas skills."
              action={{ label: 'Adicionar documento', onClick: () => setModalDoc(null) }}
            />
          )}

          {/* Content: table or grid */}
          {documents.length > 0 && filtered.length === 0 ? (
            <p
              style={{
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                marginTop: 48,
              }}
            >
              Nenhum item encontrado.
            </p>
          ) : documents.length > 0 && viewMode === 'table' ? (
            <BibliotecaTable
              documents={filtered}
              onRowClick={(doc) => setDrawerDoc(doc)}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ) : (
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
                  onToggleExpand={() =>
                    setExpandedId(expandedId === doc.id ? null : doc.id)
                  }
                  onEdit={() => handleEdit(doc)}
                  onDelete={() => handleDeleteById(doc.id)}
                  isDeleteConfirm={deleteConfirmId === doc.id}
                />
              ))}
            </div>
          )}

          {/* Pagination info */}
          {filtered.length > 0 && (
            <div
              style={{
                fontSize: '0.65rem',
                color: 'var(--text-muted)',
                textAlign: 'right',
                paddingTop: 8,
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              Mostrando 1-{filtered.length} de {filtered.length} documentos
            </div>
          )}
        </div>
      </main>

      {/* Drawer */}
      <BibliotecaDrawer
        doc={drawerDoc}
        onClose={() => setDrawerDoc(null)}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

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

      {/* Responsive: hide sidebar on mobile */}
      <style>{`
        @media (max-width: 768px) {
          main > aside {
            display: none !important;
          }
        }
      `}</style>
    </>
  );
}
