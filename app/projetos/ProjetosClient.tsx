"use client";

import { ProjetosProvider, type NodeType } from "@koro-creators/projetos";

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

export default function ProjetosClient({ children }: { children: React.ReactNode }) {
  return (
    <ProjetosProvider
      apiBaseUrl="/venus"
      tokenProvider={tokenProvider}
      enabledNodes={ENABLED_NODES}
    >
      {children}
    </ProjetosProvider>
  );
}
