'use client';

import { useParams, useRouter } from 'next/navigation';
import AppHeader from '@/components/layout/AppHeader';
import SkillEditor from '@/components/admin/SkillEditor';
import { useSkills } from '@/contexts/SkillsContext';

export default function SkillEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { skills, updateSkill } = useSkills();

  const skillId = params.skillId as string;
  const skill = skills.find((s) => s.id === skillId);

  if (!skill) {
    return (
      <>
        <AppHeader
          breadcrumbs={[
            { label: 'Skills', href: '/skills' },
            { label: 'Não encontrado', href: '#' },
          ]}
        />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 12 }}>Skill não encontrado</p>
            <button
              onClick={() => router.push('/skills')}
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
          { label: 'Skills', href: '/skills' },
          { label: skill.name, href: `/skills/${skill.id}` },
        ]}
      />
      <SkillEditor
        initial={skill}
        onSave={(data) => updateSkill(skill.id, data)}
        breadcrumbLabel={skill.name}
      />
    </>
  );
}
