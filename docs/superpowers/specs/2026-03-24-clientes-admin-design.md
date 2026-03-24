# Clientes Admin — Design Spec

## Overview

CRUD completo de clientes no sunOS. Catálogo com grid de cards, editor com 4 tabs (Identidade, Skills, Biblioteca, Métricas), criação de novos clientes. Coexiste com `data/clients.ts` sem afetar o sistema solar existente. Dados em React Context (sem backend).

## Data Model

### ClientAdmin

```typescript
interface ClientAdmin {
  id: string;
  name: string;
  slug: string;
  color: string;
  description: string;
  contact: string;
  assignedSkills: string[];
  metrics: ClientMetrics;
  createdAt: string;        // ISO 8601
  updatedAt: string;        // ISO 8601
}

interface ClientMetrics {
  totalSessions: number;
  totalFeedbacks: number;
  averageScore: number;
  topSkill: string;
  lastActivity: string;     // ISO 8601
}
```

- `assignedSkills` references skill IDs from SkillsContext
- `metrics` are static mocked data, not computed
- Coexists with `data/clients.ts` — no impact on solar system pages

### ClientsContext

```typescript
interface ClientsContextValue {
  clients: ClientAdmin[];
  createClient: (data: Omit<ClientAdmin, 'id' | 'createdAt' | 'updatedAt'>) => ClientAdmin;
  updateClient: (id: string, data: Partial<ClientAdmin>) => void;
  deleteClient: (id: string) => void;
}
```

Initialized with 7 mocked clients. Mutations persist during session only.

## Routes

```
/clientes              → Client catalog (grid of cards)
/clientes/new          → Create new client
/clientes/[clientId]   → Edit client (4 tabs)
```

## Page 1: Client Catalog (`/clientes`)

### Header
- Breadcrumb: "Clientes"
- Title: "Clientes" (h1, 2rem, weight 300) + "Gestão de contas" (subtitle, text-muted)
- "Novo Cliente" button (sun, pill) top-right

### Filter
- Search input (pill, Search icon): filters by name

### Card Grid
- 3 columns desktop, 2 tablet, 1 mobile. Gap 16px. Padding 24px.

### ClientCard
- Background: `var(--deep)`, border: `var(--border-subtle)`, border-radius 12px, padding 16px
- Header: color dot (10px, client color) + name (0.875rem, font-weight 500)
- Description: 1 line, 0.75rem, text-secondary, overflow ellipsis
- Counters: "X skills · Y documentos" (0.7rem, text-muted). Document count derived from BibliotecaContext (documents with this client in scope).
- Metrics: "★ {averageScore} · {totalSessions} sessões" (0.65rem). Color logic same as SkillCard: score >= 4.0 sun, >= 3.0 text-secondary, < 3.0 text-muted.
- Footer: "Contato: {contact}" (0.65rem, text-muted)
- Hover: border `var(--twilight)`
- Click: navigate to `/clientes/[id]`
- `role="link"`, tabIndex 0, Enter key, focus ring

### Empty State
"Nenhum cliente encontrado." (centered, text-muted, 0.85rem)

## Page 2: Client Editor (`/clientes/[clientId]`)

### Header
- Breadcrumb: Clientes / {client name}
- Color dot (10px) + inline-editable name (1.5rem, weight 300)
- Right: "Descartar" (ghost) + "Salvar" (sun)

### Tab Navigation
4 tabs: Identidade, Skills, Biblioteca, Métricas. Active tab has sun underline. Same component pattern as SkillEditorTabs.

### Tab 1: Identidade

| Field | Type | Notes |
|-------|------|-------|
| Nome | text input | required |
| Slug | text, read-only | auto-generated from name |
| Cor | color input | `<input type="color">` with preview dot. Default colors: #EF4444, #8B5CF6, #F97316, #06B6D4, #22C55E, #F472B6, #A3E635 |
| Descrição | textarea (3 lines) | |
| Contato | text input | nome do contato principal |

### Tab 2: Skills
- List of all skills from SkillsContext
- Each row: type dot (colored by skill type) + skill name + status badge (Ativo/Rascunho) + toggle switch (on/off)
- Toggle updates `assignedSkills` array
- Counter at top: "X de Y skills atribuídos"
- Draft skills shown but visually muted

### Tab 3: Biblioteca
- Read-only list of documents from BibliotecaContext where `scope` includes this client's slug
- Each row: document title + tags as small pills
- Footer link: "Ver na Biblioteca →" navigates to `/biblioteca`
- Empty state: "Nenhum documento atribuído a este cliente"
- No edit capability — user goes to Biblioteca to manage documents

### Tab 4: Métricas
- Static mocked data, displayed as key-value pairs
- Layout: 2-column grid of metric cards (bg `var(--deep)`, border, radius 8px, padding 12px)

| Metric | Display |
|--------|---------|
| Total Sessões | number, large (1.2rem) + label "sessões" (0.65rem, text-muted) |
| Total Feedbacks | number + label "feedbacks" |
| Score Médio | "★ {score}" with color logic + label "score médio" |
| Skill Mais Usado | skill name + label "mais usado" |
| Última Atividade | relative time + label "última atividade" |

### Save Behavior
"Salvar" calls `updateClient()`. Toast "Cliente atualizado" (2s). "Descartar" resets form.

## Page 3: Create Client (`/clientes/new`)

Same editor layout but:
- Empty fields, random default color
- Breadcrumb: Clientes / Novo Cliente
- Button: "Criar Cliente" instead of "Salvar"
- On create: generates UUID, calls `createClient()`, redirects to `/clientes/[newId]`
- Validation: name required, color required. Inline errors.
- Metrics tab shows "Sem dados" for all fields

## Navigation

### Sidebar
Add `href: '/clientes'` to existing "Clientes" nav item (Users icon).

## File Structure

### New Files (8)
- `app/clientes/page.tsx` — Client catalog page
- `app/clientes/new/page.tsx` — Create client
- `app/clientes/[clientId]/page.tsx` — Edit client
- `components/clientes/ClientCard.tsx` — Card for catalog grid
- `components/clientes/ClientEditor.tsx` — Tab-based editor with save/discard
- `components/clientes/ClientEditorTabs.tsx` — Tab navigation
- `contexts/ClientsContext.tsx` — ClientsProvider + useClients hook
- `data/clients-admin.ts` — 7 mocked ClientAdmin items with metrics

### Modified Files (2)
- `components/layout/Sidebar.tsx` — Add href to Clientes nav item
- `components/layout/Providers.tsx` — Add ClientsProvider

### Unchanged Files
- `data/clients.ts` — Solar system data remains untouched
- All existing pages (/, /[clientSlug], etc.) — No changes

## Mock Data (7 clients)

| Client | Color | Skills | Score | Sessions | Top Skill | Contact |
|--------|-------|--------|-------|----------|-----------|---------|
| Santander | #EF4444 | 6 | 4.3 | 142 | Copy Social | Marina Santos |
| Vivo | #8B5CF6 | 5 | 4.1 | 98 | Plano de Mídia | Ricardo Oliveira |
| Americanas | #F97316 | 4 | 3.8 | 67 | Copy Social | Fernanda Lima |
| MRV | #06B6D4 | 3 | 4.0 | 45 | Brief Builder | Carlos Mendes |
| Sicredi | #22C55E | 5 | 4.5 | 89 | Análise de Mercado | Paulo Ferreira |
| BMG | #F472B6 | 4 | 3.6 | 38 | Report Performance | Juliana Costa |
| Stone | #A3E635 | 4 | 4.2 | 76 | Copy Social | André Souza |

`assignedSkills` for each client matches the existing `clientSkillMap` in `data/clients.ts`.

## Styling

Follow existing design system:
- Cards: bg `var(--deep)`, border `var(--border-subtle)`, radius 12px
- Inputs: bg transparent, border `var(--border-subtle)`, radius 8px, focus ring sun
- Tabs: sun underline on active, same as SkillEditorTabs
- Toggle switches: same as ClientsTab in Skills admin
- Color input: native `<input type="color">` with border-radius and preview dot
- Toast: reuse existing `components/ui/Toast.tsx`

## Accessibility
- Tabs: `role="tablist"`, `role="tab"`, `aria-selected`, keyboard arrow keys
- Cards: `role="link"`, keyboard Enter
- Toggle switches: `role="switch"`, `aria-checked`
- Color input: `aria-label="Cor do cliente"`
- Form inputs: proper `<label>` with `htmlFor`
- Toast: `role="status"`, `aria-live="polite"`

## Constraints
- No backend — all Context state, resets on refresh
- Coexists with `data/clients.ts` — no integration with solar system pages
- Metrics are static mocked, not computed from actual usage
- Document count in ClientCard requires reading BibliotecaContext
- Delete has no confirmation in this spec (can add if needed)
