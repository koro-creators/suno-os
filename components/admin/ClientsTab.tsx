'use client';

import { SkillAdmin } from '@/lib/admin-types';
import { useClients } from '@/contexts/ClientsContext';

interface ClientsTabProps {
  data: SkillAdmin;
  onChange: (patch: Partial<SkillAdmin>) => void;
}

export default function ClientsTab({ data, onChange }: ClientsTabProps) {
  const { clients: allClients } = useClients();
  const count = data.assignedClients.length;

  const toggleClient = (slug: string) => {
    const assigned = data.assignedClients.includes(slug)
      ? data.assignedClients.filter((c) => c !== slug)
      : [...data.assignedClients, slug];
    onChange({ assignedClients: assigned });
  };

  return (
    <div style={{ maxWidth: 480 }}>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 16 }}>
        Atribuído a {count} de {allClients.length} clientes
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {allClients.map((client) => {
          const isOn = data.assignedClients.includes(client.slug);
          return (
            <div
              key={client.slug}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                borderRadius: 8,
                transition: 'background-color 150ms ease',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--surface-hover)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent'; }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: client.color,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{client.name}</span>
              </div>

              <button
                role="switch"
                aria-checked={isOn}
                aria-label={`${client.name} ${isOn ? 'ativado' : 'desativado'}`}
                onClick={() => toggleClient(client.slug)}
                style={{
                  width: 36,
                  height: 20,
                  borderRadius: 10,
                  border: 'none',
                  backgroundColor: isOn ? 'var(--sun)' : 'var(--nebula)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background-color 200ms ease',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: isOn ? 18 : 2,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    backgroundColor: isOn ? 'var(--void)' : 'var(--text-muted)',
                    transition: 'left 200ms ease, background-color 200ms ease',
                  }}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
