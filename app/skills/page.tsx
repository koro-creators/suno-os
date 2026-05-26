'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, LayoutGrid, List, Sparkles } from 'lucide-react';
import AppHeader from '@/components/layout/AppHeader';
import SkillCard from '@/components/admin/SkillCard';
import SkillsTable from '@/components/admin/SkillsTable';
import SkillsSidebar from '@/components/admin/SkillsSidebar';
import SkillDrawer from '@/components/admin/SkillDrawer';
import EmptyState from '@/components/ui/EmptyState';
import { useSkills } from '@/contexts/SkillsContext';
import { SkillType } from '@/lib/types';
import { SkillAdmin } from '@/lib/admin-types';

type ViewMode = 'table' | 'grid';

export default function SkillCatalogPage() {
  const router = useRouter();
  const { skills, updateSkill, deleteSkill } = useSkills();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [selectedTypes, setSelectedTypes] = useState<SkillType[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [drawerSkill, setDrawerSkill] = useState<SkillAdmin | null>(null);

  const filtered = useMemo(() => {
    return skills.filter((s) => {
      if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (selectedTypes.length > 0 && !selectedTypes.includes(s.type)) return false;
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(s.status)) return false;
      return true;
    });
  }, [skills, search, selectedTypes, selectedStatuses]);

  const handleArchiveToggle = (skill: SkillAdmin) => {
    updateSkill(skill.id, {
      status: skill.status === 'archived' ? 'active' : 'archived',
    });
  };

  const handleDelete = (skill: SkillAdmin) => {
    deleteSkill(skill.id);
    if (drawerSkill?.id === skill.id) {
      setDrawerSkill(null);
    }
  };

  const handleEdit = (skill: SkillAdmin) => {
    router.push(`/skills/${skill.id}`);
  };

  const toggleBtnStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    border: `1px solid ${active ? 'var(--twilight)' : 'var(--border-subtle)'}`,
    backgroundColor: active ? 'var(--surface-hover)' : 'transparent',
    color: active ? 'var(--text-primary)' : 'var(--text-muted)',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 150ms ease',
  });

  return (
    <>
      <AppHeader
        breadcrumbs={[{ label: 'Skills', href: '/skills' }]}
        rightLabel="Admin"
      />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Sidebar */}
        <SkillsSidebar
          selectedTypes={selectedTypes}
          onTypesChange={setSelectedTypes}
          selectedStatuses={selectedStatuses}
          onStatusesChange={setSelectedStatuses}
        />

        {/* Main content */}
        <main
          id="main-content"
          className="page-enter"
          style={{ flex: 1, overflow: 'auto', padding: 24 }}
        >
          {/* Title section */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 24,
            }}
          >
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
                Skills
              </h1>
              <p
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  margin: '4px 0 0',
                }}
              >
                Mostrando {filtered.length} de {skills.length} skills
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
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.opacity = '1';
              }}
            >
              <Plus size={14} strokeWidth={2} />
              Novo Skill
            </button>
          </div>

          {/* Search + view toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 20,
            }}
          >
            <div style={{ position: 'relative', flex: '0 1 280px' }}>
              <Search
                size={13}
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
                placeholder="Buscar skill..."
                aria-label="Buscar skill"
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

            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              <button
                onClick={() => setViewMode('table')}
                style={toggleBtnStyle(viewMode === 'table')}
                aria-label="Visualizar como tabela"
                aria-pressed={viewMode === 'table'}
              >
                <List size={14} strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                style={toggleBtnStyle(viewMode === 'grid')}
                aria-label="Visualizar como grade"
                aria-pressed={viewMode === 'grid'}
              >
                <LayoutGrid size={14} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* No data at all — rich empty state with CTA */}
          {skills.length === 0 && (
            <EmptyState
              icon={Sparkles}
              title="Nenhuma skill criada"
              description="Crie sua primeira skill de IA para começar a trabalhar com clientes."
              action={{ label: 'Nova skill', onClick: () => router.push('/skills/new') }}
            />
          )}

          {/* Table view */}
          {skills.length > 0 && viewMode === 'table' && (
            <SkillsTable
              skills={filtered}
              onSelect={setDrawerSkill}
              onArchiveToggle={handleArchiveToggle}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          )}

          {/* Grid view */}
          {skills.length > 0 && viewMode === 'grid' && (
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
          )}

          {/* Filters narrowed to zero — softer message, no CTA */}
          {skills.length > 0 && filtered.length === 0 && (
            <p
              style={{
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                marginTop: 48,
              }}
            >
              Nenhum skill encontrado.
            </p>
          )}
        </main>
      </div>

      {/* Drawer */}
      <SkillDrawer
        skill={drawerSkill}
        onClose={() => setDrawerSkill(null)}
        onDelete={handleDelete}
      />
    </>
  );
}
