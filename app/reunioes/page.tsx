import { redirect } from 'next/navigation';

// Reuniões foi integrada à Biblioteca como filtro de tipo (SPEC-016 / SPEC-022 decisão 2026-05-26)
// Acesso direto a /reunioes/[id] ainda funciona para detalhes de reunião
export default function ReunioesPage() {
  redirect('/biblioteca');
}
