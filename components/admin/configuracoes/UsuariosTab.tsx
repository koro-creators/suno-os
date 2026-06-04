'use client';

import { useState, useCallback, useEffect } from 'react';
import Toast from '@/components/ui/Toast';
import {
  apiAvailable,
  inviteAdminUser,
  listAdminUsers,
  updateAdminUser,
  type AdminUser,
} from '@/lib/api';

function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return iso.slice(0, 10);
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'var(--sun)',
  creator: 'var(--text-secondary)',
  viewer: 'var(--text-muted)',
};

type StatusFilter = 'Todos' | 'Ativos' | 'Suspensos';

const STATUS_FILTERS: StatusFilter[] = ['Todos', 'Ativos', 'Suspensos'];

export default function UsuariosTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('Todos');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'creator' | 'viewer'>('creator');
  const [toast, setToast] = useState<string | null>(null);
  const handleCloseToast = useCallback(() => setToast(null), []);

  const reload = useCallback(async () => {
    setLoading(true);
    setUsers(await listAdminUsers());
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const filteredUsers = users.filter((u) => {
    if (statusFilter === 'Ativos') return u.is_active;
    if (statusFilter === 'Suspensos') return !u.is_active;
    return true;
  });

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    const res = await inviteAdminUser(inviteEmail.trim(), inviteRole);
    setInviteEmail('');
    setInviteRole('creator');
    setShowInviteModal(false);
    if (res) {
      setToast('Convite enviado');
      await reload();
    } else {
      setToast('Falha ao convidar (verifique acesso de admin / API)');
    }
  };

  const handleSuspend = async (uid: string) => {
    const res = await updateAdminUser(uid, { is_active: false });
    if (res) {
      setToast('Usuário suspenso');
      await reload();
    } else {
      setToast('Falha ao suspender');
    }
  };

  const handleRoleChange = async (uid: string, role: 'admin' | 'creator' | 'viewer') => {
    const res = await updateAdminUser(uid, { role });
    if (res) {
      setToast('Papel atualizado');
      await reload();
    } else {
      setToast('Falha ao atualizar papel');
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    backgroundColor: 'transparent',
    border: '1px solid var(--border-subtle)',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: '0.8rem',
    color: 'var(--text-primary)',
    outline: 'none',
    boxSizing: 'border-box',
  };

  return (
    <div>
      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        {/* Status filter pills */}
        <div style={{ display: 'flex', gap: 6 }}>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              style={{
                padding: '4px 12px',
                fontSize: '0.75rem',
                borderRadius: 9999,
                border: '1px solid var(--border-subtle)',
                backgroundColor: statusFilter === f ? 'var(--sun)' : 'transparent',
                color: statusFilter === f ? 'var(--void)' : 'var(--text-muted)',
                cursor: 'pointer',
                transition: 'background-color 150ms ease, color 150ms ease',
              }}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Invite button */}
        <button
          onClick={() => setShowInviteModal(true)}
          style={{
            padding: '6px 14px',
            fontSize: '0.8rem',
            borderRadius: 8,
            border: 'none',
            backgroundColor: 'var(--sun)',
            color: 'var(--void)',
            cursor: 'pointer',
            fontWeight: 500,
            transition: 'opacity 150ms ease',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = '0.9';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.opacity = '1';
          }}
        >
          Convidar
        </button>
      </div>

      {/* Table */}
      <div
        style={{
          border: '1px solid var(--border-subtle)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 120px 100px 120px 80px',
            padding: '8px 16px',
            backgroundColor: 'var(--deep)',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {['Nome', 'Email', 'Papel', 'Status', 'Último Acesso', ''].map((h) => (
            <span
              key={h}
              style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}
            >
              {h}
            </span>
          ))}
        </div>

        {/* Table rows */}
        {loading && (
          <div style={{ padding: '24px 16px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Carregando…</span>
          </div>
        )}
        {!loading && !apiAvailable() && (
          <div style={{ padding: '24px 16px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Configure NEXT_PUBLIC_API_URL para gerenciar usuários.
            </span>
          </div>
        )}
        {!loading && apiAvailable() && filteredUsers.length === 0 && (
          <div style={{ padding: '24px 16px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Nenhum usuário neste filtro
            </span>
          </div>
        )}
        {filteredUsers.map((user) => (
          <div
            key={user.uid}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 120px 100px 120px 80px',
              padding: '10px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              transition: 'background-color 150ms ease',
              opacity: user.is_active ? 1 : 0.6,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.backgroundColor = 'var(--nebula)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
            }}
          >
            <span
              style={{
                fontSize: '0.8rem',
                color: user.is_active ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
            >
              {user.name || user.email}
            </span>
            <span
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-secondary)',
              }}
            >
              {user.email}
            </span>

            {/* Role badge — clickable dropdown */}
            <div>
              <select
                value={user.role}
                onChange={(e) =>
                  handleRoleChange(user.uid, e.target.value as 'admin' | 'creator' | 'viewer')
                }
                style={{
                  fontSize: '0.7rem',
                  padding: '2px 8px',
                  borderRadius: 9999,
                  border: `1px solid ${ROLE_COLORS[user.role]}`,
                  backgroundColor: 'transparent',
                  color: ROLE_COLORS[user.role],
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                <option value="admin">Admin</option>
                <option value="creator">Creator</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>

            {/* Status */}
            <span
              style={{
                fontSize: '0.7rem',
                padding: '2px 8px',
                borderRadius: 9999,
                border: '1px solid var(--border-subtle)',
                color: user.is_active ? '#22C55E' : 'var(--text-muted)',
                display: 'inline-block',
                width: 'fit-content',
                alignSelf: 'center',
              }}
            >
              {user.is_active ? 'Ativo' : 'Suspenso'}
            </span>

            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {fmtDate(user.last_access)}
            </span>

            {/* Actions */}
            <div>
              {user.is_active && (
                <button
                  onClick={() => handleSuspend(user.uid)}
                  style={{
                    fontSize: '0.7rem',
                    padding: '2px 8px',
                    borderRadius: 6,
                    border: '1px solid var(--border-subtle)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'color 150ms ease, border-color 150ms ease',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = '#EF4444';
                    (e.currentTarget as HTMLButtonElement).style.borderColor = '#EF4444';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
                    (e.currentTarget as HTMLButtonElement).style.borderColor =
                      'var(--border-subtle)';
                  }}
                >
                  Suspender
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Invite modal */}
      {showInviteModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
          }}
          onClick={() => setShowInviteModal(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--deep)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 12,
              padding: 24,
              width: 360,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 400, color: 'var(--text-primary)' }}>
              Convidar Usuário
            </h2>

            <div>
              <label
                htmlFor="invite-email"
                style={{
                  display: 'block',
                  fontSize: '0.7rem',
                  color: 'var(--text-secondary)',
                  marginBottom: 4,
                  fontWeight: 500,
                }}
              >
                Email
              </label>
              <input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="usuario@suno.com.br"
                style={inputStyle}
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

            <div>
              <label
                htmlFor="invite-role"
                style={{
                  display: 'block',
                  fontSize: '0.7rem',
                  color: 'var(--text-secondary)',
                  marginBottom: 4,
                  fontWeight: 500,
                }}
              >
                Papel
              </label>
              <select
                id="invite-role"
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(e.target.value as 'admin' | 'creator' | 'viewer')
                }
                style={{
                  ...inputStyle,
                  cursor: 'pointer',
                }}
              >
                <option value="admin">Admin</option>
                <option value="creator">Creator</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={() => setShowInviteModal(false)}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleInvite}
                style={{
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  borderRadius: 8,
                  border: 'none',
                  backgroundColor: 'var(--sun)',
                  color: 'var(--void)',
                  cursor: 'pointer',
                  fontWeight: 500,
                }}
              >
                Convidar
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast || ''} visible={!!toast} onClose={handleCloseToast} />
    </div>
  );
}
