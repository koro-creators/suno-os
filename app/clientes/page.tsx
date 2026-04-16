'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search } from 'lucide-react';
import AppHeader from '@/components/layout/AppHeader';
import ClientCard from '@/components/clientes/ClientCard';
import ClientDrawer from '@/components/clientes/ClientDrawer';
import { useClients } from '@/contexts/ClientsContext';
import { useBiblioteca } from '@/contexts/BibliotecaContext';
import { ClientAdmin } from '@/lib/client-types';

export default function ClientesPage() {
  const router = useRouter();
  const { clients, deleteClient } = useClients();
  const { documents } = useBiblioteca();
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<ClientAdmin | null>(null);

  const filtered = useMemo(() => {
    return clients.filter((c) => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [clients, search]);

  function handleDelete(client: ClientAdmin) {
    deleteClient(client.id);
    setSelectedClient(null);
  }

  return (
    <>
      <AppHeader
        breadcrumbs={[{ label: 'Clientes', href: '/clientes' }]}
        rightLabel="Admin"
      />
      <main
        id="main-content"
        className="page-enter"
        style={{ flex: 1, overflow: 'auto', padding: 24 }}
      >
        {/* Title section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 300, color: 'var(--text-primary)', margin: 0, lineHeight: 1.2 }}>
              Clientes
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              {filtered.length} {filtered.length === 1 ? 'cliente' : 'clientes'}
            </p>
          </div>
          <button
            onClick={() => router.push('/clientes/new')}
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
            Novo Cliente
          </button>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', maxWidth: 320, marginBottom: 20 }}>
          <Search
            size={14}
            strokeWidth={1.5}
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
            placeholder="Buscar cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              border: '1px solid var(--border-subtle)',
              borderRadius: 9999,
              padding: '8px 12px 8px 32px',
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

        {/* Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 16,
          }}
        >
          {filtered.map((client) => {
            const documentCount = documents.filter((doc) => doc.scope.includes(client.slug)).length;
            return (
              <ClientCard
                key={client.id}
                client={client}
                documentCount={documentCount}
                onSelect={setSelectedClient}
              />
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 48 }}>
            Nenhum cliente encontrado.
          </p>
        )}
      </main>

      <ClientDrawer
        client={selectedClient}
        onClose={() => setSelectedClient(null)}
        onDelete={handleDelete}
      />
    </>
  );
}
