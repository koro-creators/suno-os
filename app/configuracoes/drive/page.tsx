import { redirect } from 'next/navigation';

// Drive OAuth foi movido para aba no editor de cliente — SPEC-022 (2026-05-26)
export default function ConfiguracoesDrivePage() {
  redirect('/configuracoes');
}
