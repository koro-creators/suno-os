'use client';

import { useParams, useRouter } from 'next/navigation';
import AppHeader from '@/components/layout/AppHeader';
import ClientEditor from '@/components/clientes/ClientEditor';
import GerarOraculoPanel from '@/components/clientes/GerarOraculoPanel';
import { useClients } from '@/contexts/ClientsContext';

export default function ClientEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { clients, updateClient, deleteClient } = useClients();

  const clientId = params.clientId as string;
  const client = clients.find((c) => c.id === clientId);

  if (!client) {
    return (
      <>
        <AppHeader
          breadcrumbs={[
            { label: 'Clientes', href: '/clientes' },
            { label: 'Não encontrado', href: '#' },
          ]}
        />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 12 }}>Cliente não encontrado</p>
            <button
              onClick={() => router.push('/clientes')}
              style={{
                fontSize: '0.8rem',
                padding: '6px 14px',
                borderRadius: 8,
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'transparent',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
              }}
            >
              Voltar ao catálogo
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: 'Clientes', href: '/clientes' },
          { label: client.name, href: `/clientes/${client.id}` },
        ]}
      />
      <ClientEditor
        initial={client}
        onSave={(data) => updateClient(client.id, data)}
        onDelete={() => {
          deleteClient(client.id);
          router.push('/clientes');
        }}
      />
      <div style={{ padding: '0 24px 32px' }}>
        <GerarOraculoPanel slug={client.slug} />
      </div>
    </>
  );
}
