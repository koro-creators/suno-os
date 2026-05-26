'use client';

import { useState } from 'react';
import { TrashCan } from '@carbon/icons-react';
import { useClients } from '@/contexts/ClientsContext';
import { useAgents } from '@/contexts/AgentsContext';
import { Agent, AgentPermission } from '@/lib/agents-types';

interface Props {
  agent: Agent;
}

export default function ClientesTab({ agent }: Props) {
  const { clients } = useClients();
  const { addPermission, removePermission } = useAgents();
  const permissions = agent.permissions ?? [];

  const [selectedClientId, setSelectedClientId] = useState('');

  const authorizedClientIds = permissions.map((p) => p.client_id);
  const availableClients = clients.filter((c) => !authorizedClientIds.includes(c.id));

  function handleAuthorize() {
    if (!selectedClientId) return;
    const client = clients.find((c) => c.id === selectedClientId);
    if (!client) return;

    const permission: AgentPermission = {
      client_id: client.id,
      client_name: client.name,
      granted_by_name: 'Admin',
      granted_at: new Date().toISOString(),
    };
    addPermission(agent.id, permission);
    setSelectedClientId('');
  }

  function handleRevoke(clientId: string) {
    removePermission(agent.id, clientId);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 600 }}>
      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
        Clientes autorizados podem executar este agente. Autorização é explícita e individual.
      </p>

      {/* Authorize client */}
      {availableClients.length > 0 && (
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
            style={{
              flex: 1,
              backgroundColor: 'var(--nebula)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              padding: '8px 10px',
              fontSize: '0.85rem',
              color: 'var(--text-primary)',
              outline: 'none',
              cursor: 'pointer',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--sun)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)';
            }}
          >
            <option value="">Selecionar cliente...</option>
            {availableClients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAuthorize}
            disabled={!selectedClientId}
            style={{
              padding: '8px 16px',
              fontSize: '0.8rem',
              backgroundColor: selectedClientId ? 'var(--sun)' : 'var(--nebula)',
              color: selectedClientId ? 'var(--void)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 8,
              cursor: selectedClientId ? 'pointer' : 'not-allowed',
              fontWeight: 500,
              transition: 'all 150ms ease',
            }}
          >
            Autorizar
          </button>
        </div>
      )}

      {/* Permissions list */}
      {permissions.length === 0 ? (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Nenhum cliente autorizado.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {permissions.map((perm) => (
            <PermissionRow
              key={perm.client_id}
              permission={perm}
              onRevoke={() => handleRevoke(perm.client_id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function PermissionRow({
  permission,
  onRevoke,
}: {
  permission: AgentPermission;
  onRevoke: () => void;
}) {
  const grantedDate = new Date(permission.granted_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        backgroundColor: 'var(--deep)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 8,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
          {permission.client_name}
        </div>
        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          Autorizado por {permission.granted_by_name} em {grantedDate}
        </div>
      </div>
      <button
        type="button"
        onClick={onRevoke}
        aria-label={`Revogar acesso de ${permission.client_name}`}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          padding: 4,
          display: 'flex',
          borderRadius: 4,
          transition: 'color 150ms ease',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; }}
      >
        <TrashCan size={14} />
      </button>
    </div>
  );
}
