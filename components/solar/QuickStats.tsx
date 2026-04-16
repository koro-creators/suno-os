'use client';

import { useSkills } from '@/contexts/SkillsContext';
import { useBiblioteca } from '@/contexts/BibliotecaContext';
import { useClients } from '@/contexts/ClientsContext';

export default function QuickStats() {
  const { skills } = useSkills();
  const { documents } = useBiblioteca();
  const { clients } = useClients();

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', gap: 16,
      padding: '8px 0', fontSize: '0.6rem', color: 'var(--text-muted)',
      letterSpacing: '0.05em',
    }}>
      <span>{clients.length} clientes</span>
      <span style={{ opacity: 0.3 }}>·</span>
      <span>{skills.filter(s => s.status === 'active').length} skills ativos</span>
      <span style={{ opacity: 0.3 }}>·</span>
      <span>{documents.length} documentos</span>
    </div>
  );
}
