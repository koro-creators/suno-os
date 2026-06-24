// Layout do hub Projetos no sunOS. O AppShell (sidebar etc.) já vem do root
// layout; aqui só montamos o provider da feature compartilhada e importamos os
// estilos do canvas (tokens/keyframes vivem no globals.css do sunOS).
import ProjetosClient from "./ProjetosClient";

export default function ProjetosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ProjetosClient>{children}</ProjetosClient>;
}
