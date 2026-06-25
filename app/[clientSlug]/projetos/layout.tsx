// Layout da Projetos POR CLIENTE (/{clientSlug}/projetos). O AppShell (sidebar)
// vem do root layout; aqui montamos o provider da feature compartilhada já
// escopado ao cliente da rota (ProjetosClient lê o clientSlug e trava no
// workspace do Venus correspondente).
import ProjetosClient from "./ProjetosClient";

export default function ProjetosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProjetosClient>{children}</ProjetosClient>;
}
