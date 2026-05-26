'use client';

import { useState, useMemo } from 'react';
import { Plus, Video } from 'lucide-react';
import AppHeader from '@/components/layout/AppHeader';
import ReuniaoCard from '@/components/reunioes/ReuniaoCard';
import ReuniaoFiltros from '@/components/reunioes/ReuniaoFiltros';
import OptInModal from '@/components/reunioes/OptInModal';
import { useMeetings } from '@/contexts/MeetingsContext';
import { MeetingStatus, MeetingCreateData } from '@/lib/meeting-types';

export default function ReunioesPage() {
  const { meetings, createMeeting } = useMeetings();
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<MeetingStatus | ''>('');
  const [showOptIn, setShowOptIn] = useState(false);

  const availableClients = useMemo(() => {
    const set = new Set(meetings.map((m) => m.client_id));
    return Array.from(set).sort();
  }, [meetings]);

  const filtered = useMemo(() => {
    return meetings.filter((m) => {
      if (search && !m.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (clientFilter && m.client_id !== clientFilter) return false;
      if (statusFilter && m.status !== statusFilter) return false;
      return true;
    });
  }, [meetings, search, clientFilter, statusFilter]);

  function handleOptInSubmit(data: MeetingCreateData) {
    createMeeting(data);
    setShowOptIn(false);
  }

  const pendingCount = meetings.filter((m) => m.status === 'pending_review').length;
  const curatedCount = meetings.filter((m) => m.status === 'curated').length;

  return (
    <>
      <AppHeader
        breadcrumbs={[{ label: 'Reunioes', href: '/reunioes' }]}
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
              Reunioes
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              {meetings.length} {meetings.length === 1 ? 'reuniao' : 'reunioes'}
              {pendingCount > 0 && (
                <span style={{ marginLeft: 8, color: '#FFC801' }}>
                  {pendingCount} aguardando curadoria
                </span>
              )}
              {curatedCount > 0 && (
                <span style={{ marginLeft: 8, color: '#4ade80' }}>
                  {curatedCount} curada{curatedCount > 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowOptIn(true)}
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
            Opt-in Nova Reuniao
          </button>
        </div>

        {/* Filters */}
        <ReuniaoFiltros
          search={search}
          onSearchChange={setSearch}
          clientFilter={clientFilter}
          onClientChange={setClientFilter}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          availableClients={availableClients}
        />

        {/* Grid */}
        {filtered.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 16,
            }}
          >
            {filtered.map((meeting) => (
              <ReuniaoCard key={meeting.id} meeting={meeting} />
            ))}
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 24px',
              gap: 12,
            }}
          >
            <Video size={32} strokeWidth={1} style={{ color: 'var(--text-muted)' }} />
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
              {search || clientFilter || statusFilter
                ? 'Nenhuma reuniao encontrada com esses filtros.'
                : 'Nenhuma reuniao capturada ainda.'}
            </p>
            {!search && !clientFilter && !statusFilter && (
              <button
                onClick={() => setShowOptIn(true)}
                style={{
                  padding: '8px 16px',
                  fontSize: '0.8rem',
                  borderRadius: 9999,
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  marginTop: 4,
                }}
              >
                Iniciar primeira captura
              </button>
            )}
          </div>
        )}
      </main>

      {showOptIn && (
        <OptInModal
          availableClients={availableClients.length > 0 ? availableClients : ['vivo', 'americanas', 'claro']}
          onClose={() => setShowOptIn(false)}
          onSubmit={handleOptInSubmit}
        />
      )}
    </>
  );
}
