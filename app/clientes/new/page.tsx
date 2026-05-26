'use client';

/**
 * SPEC-015 — New Client page: replaced by 4-step Wizard with Oráculo.
 * T-34: Wizard de Onboarding de Cliente.
 */

import AppHeader from '@/components/layout/AppHeader';
import WizardContainer from '@/components/onboarding/WizardContainer';

export default function CreateClientPage() {
  return (
    <>
      <AppHeader
        breadcrumbs={[
          { label: 'Clientes', href: '/clientes' },
          { label: 'Novo Cliente', href: '/clientes/new' },
        ]}
      />
      <WizardContainer />
    </>
  );
}
