'use client';

import { useRouter } from 'next/navigation';
import AppHeader from '@/components/layout/AppHeader';
import SkillEditor from '@/components/admin/SkillEditor';
import { useSkills } from '@/contexts/SkillsContext';
import { SkillAdmin } from '@/lib/admin-types';

const EMPTY_SKILL: SkillAdmin = {
  id: '',
  name: '',
  slug: '',
  type: 'criacao',
  description: '',
  icon: 'FileText',
  status: 'draft',
  systemPrompt: '',
  model: 'gemini-pro',
  temperature: 0.7,
  maxTokens: 4096,
  moons: [],
  assignedClients: [],
  versions: [
    { version: 1, date: new Date().toISOString().split('T')[0], author: 'Você', summary: 'Versão inicial' },
  ],
  updatedAt: new Date().toISOString(),
  createdBy: 'Você',
  averageScore: 0,
  totalFeedbacks: 0,
};

export default function CreateSkillPage() {
  const router = useRouter();
  const { createSkill } = useSkills();

  const handleCreate = async (data: SkillAdmin) => {
    const { id: _, ...rest } = data;
    const created = await createSkill(rest);
    router.push(`/skills/${created.id}`);
  };

  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: 'Skills', href: '/skills' },
          { label: 'Novo Skill', href: '/skills/new' },
        ]}
      />
      <SkillEditor
        initial={EMPTY_SKILL}
        onSave={handleCreate}
        isNew
        breadcrumbLabel="Novo Skill"
      />
    </>
  );
}
