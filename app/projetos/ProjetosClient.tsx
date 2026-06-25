"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ProjetosProvider,
  WorkspaceProvider,
  useWorkspace,
  type NodeType,
} from "@koro-creators/projetos";
import { useClients } from "@/contexts/ClientsContext";
import { useAuth } from "@/contexts/AuthContext";

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

// Combining diacritical marks (U+0300–U+036F). Regex via string para não deixar
// caracteres invisíveis no source.
const DIACRITICS = new RegExp("[\\u0300-\\u036f]", "g");

// Espelha o _slugify do Venus (api/venus/repository.py): NFKD → remove acentos →
// não-alfanumérico vira "-" → trim "-" → lowercase. Usado para casar cliente do
// sunOS ↔ workspace do Venus de forma robusta (o workspace é criado a partir do
// nome do cliente, então seu slug == venusSlug(nome)).
function venusSlug(text: string): string {
  const s = (text || "")
    .normalize("NFKD")
    .replace(DIACRITICS, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return s || "cliente";
}

// Extrai uma mensagem legível de um erro de API (o createWorkspace lança
// new Error(res.text()), e o FastAPI responde {"detail": "..."}).
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

// Interseção e diferença entre clientes do sunOS e workspaces do Venus, casados
// por venusSlug(nome do cliente) == slug do workspace.
function useVenusMatch() {
  const { workspaces } = useWorkspace();
  const { clients } = useClients();
  return useMemo(() => {
    const wsSlugs = new Set(workspaces.map((w) => (w.slug || "").toLowerCase()));
    const clientSlugs = new Set((clients ?? []).map((c) => venusSlug(c.name)));
    const visible = workspaces.filter((w) => clientSlugs.has((w.slug || "").toLowerCase()));
    const missing = (clients ?? []).filter((c) => !wsSlugs.has(venusSlug(c.name)));
    return { visible, missing };
  }, [workspaces, clients]);
}

// Seletor de cliente (workspace do Venus), AMARRADO aos clientes do sunOS: só
// aparecem os workspaces do Venus que também existem como cliente no sunOS. A
// lista do Venus já vem filtrada pela BU do usuário no backend (admin vê todos).
function WorkspaceSwitcher() {
  const { selected, select, loading } = useWorkspace();
  const { clients } = useClients();
  const { visible } = useVenusMatch();

  // Corrige a seleção: o WorkspaceProvider auto-seleciona o 1º workspace do Venus,
  // que pode ser um cliente que não existe no sunOS. Se o selecionado não está na
  // interseção, troca pro 1º visível.
  useEffect(() => {
    if (!visible.length) return;
    if (!selected || !visible.some((w) => w.id === selected)) {
      select(visible[0].id);
    }
  }, [visible, selected, select]);

  // Espera o Venus E a lista de clientes do sunOS carregarem antes de decidir
  // "nenhum cliente" (clients vazio = ainda carregando; ClientsContext não expõe
  // flag de loading).
  const clientsReady = clients && clients.length > 0;
  if (loading || !clientsReady) {
    return <span style={{ fontSize: 12, color: "var(--text-muted)" }}>Carregando clientes…</span>;
  }
  if (!visible.length) {
    return (
      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
        Nenhum cliente do sunOS encontrado no Venus
      </span>
    );
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
        {visible.map((w) => (
          <option key={w.id} value={w.id}>{w.name}</option>
        ))}
      </select>
    </label>
  );
}

// Painel admin-only: provisiona no Venus (cria workspace) os clientes do sunOS
// que ainda não têm workspace. POST /api/workspaces é admin-only no Venus — daí
// o gate por isAdmin; se o usuário for admin no sunOS mas não no Venus, a chamada
// retorna 403 e mostramos a mensagem. Idempotente na prática: só lista faltantes
// e o create deriva slug = venusSlug(nome), que volta a casar na interseção.
function ProvisionarClientes() {
  const { loading, create } = useWorkspace();
  const { clients } = useClients();
  const { isAdmin } = useAuth();
  const { missing } = useVenusMatch();

  const [open, setOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Só admin; e só depois que Venus (workspaces) E sunOS (clients) carregaram —
  // senão "missing" viria inflado e provisionaria duplicado.
  if (!isAdmin) return null;
  if (loading || !(clients && clients.length)) return null;
  if (!missing.length) return null;

  async function provisionOne(name: string, id: string) {
    setError(null);
    setBusyId(id);
    try {
      await create(name); // POST /venus/api/workspaces (admin-only); atualiza o contexto
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusyId(null);
    }
  }

  async function provisionAll() {
    setError(null);
    for (const c of missing) {
      setBusyId(c.id);
      try {
        await create(c.name);
      } catch (e) {
        // 403 (não-admin no Venus) ou falha → para e mostra; duplicado é raro
        // (só lista faltantes), mas se ocorrer, a mensagem aparece.
        setError(errMsg(e));
        break;
      }
    }
    setBusyId(null);
  }

  const busy = busyId !== null;

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        style={{
          background: "transparent",
          color: "var(--text-secondary)",
          border: "1px solid var(--twilight)",
          borderRadius: 8,
          padding: "6px 10px",
          fontSize: 12,
          cursor: busy ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
        title="Clientes do sunOS ainda sem workspace no Venus"
      >
        Provisionar no Venus ({missing.length})
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 1000,
            width: 320,
            maxHeight: 360,
            overflowY: "auto",
            background: "var(--deep)",
            border: "1px solid var(--twilight)",
            borderRadius: 12,
            boxShadow: "0 12px 36px rgba(0,0,0,0.55)",
            padding: 8,
          }}
          className="venus-scroll"
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 8px 8px" }}>
            <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.6, color: "var(--text-muted)" }}>
              Faltam no Venus
            </span>
            <button
              onClick={provisionAll}
              disabled={busy}
              style={{
                background: "var(--sun)",
                color: "var(--void)",
                border: "none",
                borderRadius: 9999,
                padding: "4px 10px",
                fontSize: 11,
                fontWeight: 600,
                cursor: busy ? "default" : "pointer",
              }}
            >
              Provisionar todos
            </button>
          </div>

          {error && (
            <div style={{ fontSize: 11, color: "#f87171", padding: "0 8px 8px" }}>{error}</div>
          )}

          {missing.map((c) => (
            <div
              key={c.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
                padding: "6px 8px",
                borderRadius: 8,
              }}
            >
              <span style={{ fontSize: 13, color: "var(--text-primary)", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {c.name}
              </span>
              <button
                onClick={() => provisionOne(c.name, c.id)}
                disabled={busy}
                style={{
                  background: "transparent",
                  color: busyId === c.id ? "var(--text-muted)" : "var(--sun)",
                  border: "1px solid var(--twilight)",
                  borderRadius: 8,
                  padding: "4px 10px",
                  fontSize: 11,
                  cursor: busy ? "default" : "pointer",
                  flexShrink: 0,
                }}
              >
                {busyId === c.id ? "Provisionando…" : "Provisionar"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Chrome das rotas /projetos: barra com o painel de provisionamento (esq.) e o
// seletor de cliente (dir.). NÃO renderiza a barra no editor de canvas
// (/projetos/workflow), que usa 100vh e quebraria com um header acima.
function ProjetosChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/projetos/workflow")) return <>{children}</>;
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "10px 24px",
          borderBottom: "1px solid var(--border-subtle)",
        }}
      >
        <ProvisionarClientes />
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
