"use client";

import { usePathname } from "next/navigation";
import {
  ProjetosProvider,
  WorkspaceProvider,
  useWorkspace,
  type NodeType,
} from "@koro-creators/projetos";

// Token do Firebase do sunOS (mesmo projeto do Venus → valida no backend do
// Venus). Definido fora do componente: não depende de props e evita recriar a
// cada render. getIdToken(force) renova quando o token (~1h) expira.
async function tokenProvider(force?: boolean): Promise<string | null> {
  try {
    const { getFirebase } = await import("@/lib/firebase");
    const { auth } = getFirebase();
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken(force);
  } catch {
    return null;
  }
}

// Todos os tipos de nó MENOS "skill" — o nó Skill é um conceito do Venus
// (receitas de prompt por cliente) que não existe no sunOS. Os demais nós ficam
// disponíveis na paleta; canvases salvos com Skill ainda renderizam.
const ENABLED_NODES: NodeType[] = [
  "source", "reframe", "variation", "edit", "background", "upscale", "copy",
  "compose", "imageInput", "imageOutput", "export", "router", "split",
  "element", "label", "action", "batch", "cutout", "separate", "banner",
  "prompt", "storyboard", "animate",
];

// Seletor de cliente (workspace do Venus). A lista vem do useWorkspace() do
// pacote — já filtrada pela BU do usuário no backend do Venus (admin vê todos).
// Trocar aqui re-escopa as telas (WorkflowsList lê o mesmo selected do contexto).
function WorkspaceSwitcher() {
  const { workspaces, selected, select, loading } = useWorkspace();

  if (loading) {
    return <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Carregando clientes…</span>;
  }
  if (!workspaces.length) {
    return <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Nenhum cliente disponível</span>;
  }
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, color: "var(--text-muted)" }}>
        Cliente
      </span>
      <select
        value={selected ?? ""}
        onChange={(e) => select(e.target.value)}
        style={{
          background: "var(--deep)",
          color: "var(--text-primary)",
          border: "1px solid var(--twilight)",
          borderRadius: 8,
          padding: "6px 10px",
          fontSize: 13,
          outline: "none",
          cursor: "pointer",
        }}
      >
        {workspaces.map((w) => (
          <option key={w.id} value={w.id}>{w.name}</option>
        ))}
      </select>
    </label>
  );
}

// Chrome das rotas /projetos: barra com o seletor de cliente. NÃO renderiza a
// barra no editor de canvas (/projetos/workflow), que usa 100vh e quebraria com
// um header acima.
function ProjetosChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/projetos/workflow")) return <>{children}</>;
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 12,
          padding: "10px 24px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <WorkspaceSwitcher />
      </div>
      {children}
    </>
  );
}

export default function ProjetosClient({ children }: { children: React.ReactNode }) {
  return (
    // ProjetosProvider injeta base/token ANTES do WorkspaceProvider (que chama
    // listWorkspaces no backend do Venus). O WorkspaceProvider é obrigatório: as
    // telas do pacote usam useWorkspace() — escopado às rotas /projetos.
    <ProjetosProvider
      apiBaseUrl="/venus"
      tokenProvider={tokenProvider}
      enabledNodes={ENABLED_NODES}
    >
      <WorkspaceProvider>
        <ProjetosChrome>{children}</ProjetosChrome>
      </WorkspaceProvider>
    </ProjetosProvider>
  );
}
