'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import AppHeader from '@/components/layout/AppHeader';
import SkillCard from '@/components/admin/SkillCard';
import SkillFilters from '@/components/admin/SkillFilters';
import { useSkills } from '@/contexts/SkillsContext';
import { SkillType } from '@/lib/types';

export default function SkillCatalogPage() {
  const router = useRouter();
  const { skills } = useSkills();
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState<SkillType | null>(null);
  const [activeStatus, setActiveStatus] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return skills.filter((s) => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (activeType && s.type !== activeType) return false;
      if (activeStatus && s.status !== activeStatus) return false;
      return true;
    });
  }, [skills, search, activeType, activeStatus]);

  return (
    <>
      <AppHeader
        breadcrumbs={[{ label: 'Skills', href: '/skills' }]}
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
              Skills
            </h1>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Gestão de Skills
            </p>
          </div>
          <button
            onClick={() => router.push('/skills/new')}
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
            Novo Skill
          </button>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: 20 }}>
          <SkillFilters
            search={search}
            onSearchChange={setSearch}
            activeType={activeType}
            onTypeChange={setActiveType}
            activeStatus={activeStatus}
            onStatusChange={setActiveStatus}
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
          {filtered.map((skill) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
        </div>

        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 48 }}>
            Nenhum skill encontrado.
          </p>
        )}
      </main>
    </>
  );
}
