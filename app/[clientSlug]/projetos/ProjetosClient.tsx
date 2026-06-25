"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, usePathname } from "next/navigation";
import {
  ProjetosProvider,
  WorkspaceProvider,
  useWorkspace,
  type NodeType,
} from "@koro-creators/projetos";
import { useClients } from "@/contexts/ClientsContext";
import { useAuth } from "@/contexts/AuthContext";

// Token do Firebase do sunOS (mesmo projeto do Venus → valida no backend do
// Venus). Fora do componente: não depende de props e evita recriar a cada render.
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

// Todos os tipos de nó MENOS "skill" (conceito do Venus que não existe no sunOS).
const ENABLED_NODES: NodeType[] = [
  "source", "reframe", "variation", "edit", "background", "upscale", "copy",
  "compose", "imageInput", "imageOutput", "export", "router", "split",
  "element", "label", "action", "batch", "cutout", "separate", "banner",
  "prompt", "storyboard", "animate",
];

// Combining diacritical marks (U+0300–U+036F). Regex via string p/ não deixar
// caracteres invisíveis no source.
const DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

// Espelha o _slugify do Venus: NFKD → remove acentos → não-alfanumérico vira "-"
// → trim "-" → lowercase. O workspace do Venus é criado a partir do nome do
// cliente, então seu slug == venusSlug(nome).
function venusSlug(text: string): string {
  const s = (text || "")
    .normalize("NFKD")
    .replace(DIACRITICS, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return s || "cliente";
}

function errMsg(e: unknown): string {
  const raw = e instanceof Error ? e.message : "";
  try {
    const j = JSON.parse(raw) as { detail?: unknown; message?: unknown };
    const m = j.detail ?? j.message;
    if (typeof m === "string" && m) return m;
  } catch {
    /* não era JSON */
  }
  return raw || "Falha ao provisionar.";
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        minHeight: "60vh",
        padding: 24,
        textAlign: "center",
        color: "var(--text-secondary)",
        fontSize: 13,
      }}
    >
      {children}
    </div>
  );
}

// Escopa a Projetos ao cliente da ROTA (/{clientSlug}/projetos). Resolve o
// cliente do sunOS pelo slug, casa com o workspace do Venus por venusSlug(nome) e
// trava a seleção nele. Se o workspace não existe no Venus, mostra o estado de
// provisionamento (admin cria; creator pede a um admin). Sem seletor cross-client.
function ClientScopedProjetos({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const clientSlug = typeof params.clientSlug === "string" ? params.clientSlug : "";
  const pathname = usePathname() || "";
  const isEditor = pathname.includes("/projetos/workflow");

  const { clients } = useClients();
  const { isAdmin } = useAuth();
  const { workspaces, selected, select, loading, create } = useWorkspace();

  const [provisioning, setProvisioning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const client = useMemo(
    () => (clients ?? []).find((c) => c.slug === clientSlug),
    [clients, clientSlug]
  );
  const targetSlug = useMemo(() => (client ? venusSlug(client.name) : ""), [client]);
  const ws = useMemo(
    () => workspaces.find((w) => (w.slug || "").toLowerCase() === targetSlug),
    [workspaces, targetSlug]
  );

  // Trava a seleção no workspace do cliente atual.
  useEffect(() => {
    if (ws && selected !== ws.id) select(ws.id);
  }, [ws, selected, select]);

  const clientsReady = clients && clients.length > 0;

  if (loading || !clientsReady) {
    return <Centered>Carregando…</Centered>;
  }
  if (!client) {
    return <Centered>Cliente “{clientSlug}” não encontrado no sunOS.</Centered>;
  }
  if (!ws) {
    // Cliente do sunOS ainda sem workspace no Venus.
    return (
      <Centered>
        <div>
          O cliente <b style={{ color: "var(--text-primary)" }}>{client.name}</b> ainda
          não está disponível na Projetos.
        </div>
        {isAdmin ? (
          <>
            <button
              onClick={async () => {
                setError(null);
                setProvisioning(true);
                try {
                  await create(client.name); // POST /venus/api/workspaces (admin-only)
                } catch (e) {
                  setError(errMsg(e));
                } finally {
                  setProvisioning(false);
                }
              }}
              disabled={provisioning}
              style={{
                background: "var(--sun)",
                color: "var(--void)",
                border: "none",
                borderRadius: 9999,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 600,
                cursor: provisioning ? "default" : "pointer",
              }}
            >
              {provisioning ? "Provisionando…" : `Provisionar ${client.name} no Venus`}
            </button>
            {error && <div style={{ color: "#f87171" }}>{error}</div>}
          </>
        ) : (
          <div>Peça a um admin para provisionar este cliente.</div>
        )}
      </Centered>
    );
  }

  // Provisionado, mas espera a seleção efetivar p/ não mostrar dados de outro
  // cliente (o WorkspaceProvider auto-seleciona o 1º workspace ao carregar).
  if (selected !== ws.id) {
    return <Centered>Carregando {client.name}…</Centered>;
  }

  // Editor de canvas usa 100vh → sem barra de contexto.
  if (isEditor) return <>{children}</>;

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 24px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, color: "var(--text-muted)" }}>
          Cliente
        </span>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
          {client.name}
        </span>
        <a
          href={`/${clientSlug}`}
          style={{ marginLeft: 8, fontSize: 12, color: "var(--text-muted)", textDecoration: "none" }}
        >
          ← voltar ao cliente
        </a>
      </div>
      {children}
    </>
  );
}

export default function ProjetosClient({ children }: { children: React.ReactNode }) {
  return (
    <ProjetosProvider
      apiBaseUrl="/venus"
      tokenProvider={tokenProvider}
      enabledNodes={ENABLED_NODES}
    >
      <WorkspaceProvider>
        <ClientScopedProjetos>{children}</ClientScopedProjetos>
      </WorkspaceProvider>
    </ProjetosProvider>
  );
}
