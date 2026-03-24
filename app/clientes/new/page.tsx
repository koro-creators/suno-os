'use client';

import { useRouter } from 'next/navigation';
import AppHeader from '@/components/layout/AppHeader';
import ClientEditor from '@/components/clientes/ClientEditor';
import { useClients } from '@/contexts/ClientsContext';
import { ClientAdmin } from '@/lib/client-types';

const RANDOM_COLORS = ['#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#22C55E', '#F472B6', '#A3E635'];

const EMPTY_CLIENT: ClientAdmin = {
  id: '',
  name: '',
  slug: '',
  color: RANDOM_COLORS[Math.floor(Math.random() * RANDOM_COLORS.length)],
  description: '',
  contact: '',
  assignedSkills: [],
  metrics: {
    totalSessions: 0,
    totalFeedbacks: 0,
    averageScore: 0,
    topSkill: '',
    lastActivity: '',
  },
  createdAt: '',
  updatedAt: '',
};

export default function CreateClientPage() {
  const router = useRouter();
  const { createClient } = useClients();

  const handleCreate = (data: ClientAdmin) => {
    const { id: _, ...rest } = data;
    const created = createClient(rest);
    router.push(`/clientes/${created.id}`);
  };

  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: 'Clientes', href: '/clientes' },
          { label: 'Novo Cliente', href: '/clientes/new' },
        ]}
      />
      <ClientEditor
        initial={EMPTY_CLIENT}
        onSave={handleCreate}
        isNew
      />
    </>
  );
}
