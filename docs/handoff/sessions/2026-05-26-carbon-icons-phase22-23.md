# Handoff — 2026-05-26 — Carbon Icons + Phase 22 (Agentes) + Phase 23 (Configurações)

**Duração aproximada:** ~4h
**Foco:** SPEC-021 Agentes (implementation), SPEC-022 Configurações Admin (implementation) + migração completa de ícones Lucide → Carbon Design System

## O que foi feito

### Phase 22 — Agentes (Fase A+B completa)
- `lib/agents-types.ts` — tipos completos (AgentStatus, Agent, AppConnection, MemoryFile, etc.)
- `data/agents-admin.ts` — 3 agentes mock (active/draft/inactive)
- `contexts/AgentsContext.tsx` — CRUD + sub-recursos com mock-mode
- `app/agentes/` — listagem + new + editor (`[agentId]`)
- `components/admin/agentes/` — AgentesCards, AgentDrawer, AgentNewForm, AgenteEditorTabs
- `components/admin/agentes/tabs/` — 7 tabs: Configuração, Skills, Apps, Memória, Agendamento, Atividade, Clientes
- `api/agents/` — router FastAPI in-memory + schemas + migration SQL (8 tabelas)
- Caixa-preta 404 no backend

### Phase 23 — Configurações Admin
- `app/configuracoes/page.tsx` — painel admin com 4 tabs (Usuários, Integrações, Skills/Modelos, Auditoria)
- `app/configuracoes/drive/page.tsx` — redirect 301 para `/configuracoes`
- `components/admin/configuracoes/` — 4 tabs
- `components/admin/clientes/tabs/DriveTab.tsx` — Drive tab para editor de cliente
- `components/clientes/ClientEditor.tsx` — Drive tab para admins
- `api/admin/` — stub endpoints caixa-preta + migration SQL

### Reuniões → sub-feature da Biblioteca
- `app/reunioes/page.tsx` → redirect para `/biblioteca`
- Sidebar: Reuniões removida, Agentes adicionada

### Migração completa: Lucide → @carbon/icons-react
- Instala `@carbon/icons-react` v11.81.0
- 89 arquivos TSX/TS migrados via script Python automático
- ~80 mapeamentos de nomes (Plus→Add, Trash2→TrashCan, X→Close, Workflow→Flow, etc.)
- `strokeWidth` removido de todos os usos de ícone
- `LucideIcon` type → `CarbonIconType` de `@carbon/icons-react`
- Correções manuais: AgentPersonaBadge (Crown→Badge, Eye→View, etc.), WorkflowDrawer (Brain→Idea, Hand→TouchInteraction)
- `npx tsc --noEmit` limpo ✓

## Decisões tomadas

- Agentes globais com permissão por cliente (confirmado pelo usuário)
- Channels = out-of-scope (confirmado pelo usuário)
- Reuniões = filtro de tipo em Biblioteca (não entidade separada)
- Configurações = painel admin com 4 features
- Drive OAuth → editor de cliente (não global) — ADR-LOCAL-01 SPEC-022
- Substituir Lucide por @carbon/icons-react (flat line IBM Carbon) — confirmação explícita
- `Workflow→Flow` no Carbon (Carbon não tem `Workflow`)
- `LucideIcon → CarbonIconType` exportado pelo pacote oficialmente

## Arquivos modificados

**Specs:** `docs/specs/large/agentes/`, `docs/specs/medium/configuracoes-admin.spec.md`, `docs/ROADMAP.md`

**Carbon Icons (89 arquivos):** todos os .tsx em `app/` e `components/`, `package.json`, `package-lock.json`

**Phase 22/23:** `app/agentes/`, `app/configuracoes/`, `components/admin/agentes/`, `components/admin/configuracoes/`, `contexts/AgentsContext.tsx`, `api/agents/`, `api/admin/`

## Pendências

- **Phase 22 Fase C (Execution)**: LangGraph runtime, execução manual, preview sandboxed — backend
- **Reuniões visual em Biblioteca**: redirect feito, mas filtro visual (MeetingsContext → BibliotecaPage) pendente
- **CLAUDE.md**: Atualizar referência de Lucide → @carbon/icons-react

## Próximo passo natural

`npm run dev -- -p 3005` para verificar visualmente os ícones Carbon no browser, depois Phase 22 Fase C.

## Aprendizados / pegadinhas

1. **Alias imports não mapeados**: `import { Workflow as WorkflowIcon }` → script não captura aliases; correção manual em NodePalette.tsx
2. **Carbon usa `ForwardRefExoticComponent`**: definição custom `React.FC<SVGProps<...>>` incompatível; `CarbonIconType` do pacote resolve
3. **`'use client'` deve ser primeira linha**: script adicionou import antes do directive em EmptyState.tsx; corrigido manualmente
4. **npm install necessário no repo principal**: pacote instalado no worktree não estava no main repo; tsc do main falhava
5. **Icons inexistentes no Carbon**: `Brain`, `Hand`, `Link2`, `Crown`, `Eye`, `Shapes`, etc. precisaram de mapeamento alternativo manual
