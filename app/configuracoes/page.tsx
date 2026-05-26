/**
 * /configuracoes — settings index.
 *
 * Redirects to /configuracoes/drive (the only settings sub-page today).
 * Forward-compatible: when more sub-pages are added, replace the redirect
 * with a settings hub page.
 */
import { redirect } from 'next/navigation';

export default function ConfiguracoesPage() {
  redirect('/configuracoes/drive');
}
