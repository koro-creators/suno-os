# Bioma Zero — Design Spec

## Overview

Admin area for persona P4 to manage skills: create, edit, version, and assign to clients. Accessible via sidebar + header icon. All data managed in React Context (session persistence, no backend).

## Routes

```
/skills              → Skill catalog (grid of all skills)
/skills/new          → Create new skill
/skills/[skillId]    → Edit skill (tabs: Identity, Config, Moons, Clients)
```

## Data Model

### SkillAdmin (extends Skill)

```typescript
interface SkillAdmin {
  id: string;
  name: string;
  slug: string;
  type: SkillType;
  description: string;
  icon: string;             // Lucide icon name
  status: 'active' | 'draft' | 'archived';
  systemPrompt: string;
  model: string;            // 'gemini-pro' | 'gemini-flash' | 'gpt-4o' | 'claude'
  temperature: number;      // 0-1
  maxTokens: number;
  moons: Moon[];
  assignedClients: string[];  // client slugs
  versions: SkillVersion[];
  updatedAt: string;         // ISO date
  createdBy: string;
}

interface SkillVersion {
  version: number;
  date: string;
  author: string;
  summary: string;
}
```

### SkillsProvider (React Context)

```typescript
interface SkillsContextValue {
  skills: SkillAdmin[];
  updateSkill: (id: string, data: Partial<SkillAdmin>) => void;
  createSkill: (data: Omit<SkillAdmin, 'id'>) => SkillAdmin;
  deleteSkill: (id: string) => void;
}
```

Initialized with 10 mocked skills (8 existing + 2 drafts: "Análise Competitiva", "Roteiro de Podcast"). Mutations persist during session only.

## Page 1: Skill Catalog (`/skills`)

### Layout
- AppHeader with breadcrumb: "Bioma Zero"
- Title section: "Bioma Zero" (h1, 32px, weight 300) + "Gestão de Skills" (subtitle, text-muted) + "Novo Skill" button (sun color, pill, navigates to /skills/new)
- Filter bar: search input (pill shape) + type pills (Criação/Mídia/Planejamento) + status pills (Ativo/Rascunho/Arquivado)
- Grid: 3 columns desktop, 2 tablet, 1 mobile. Gap 16px. Padding 24px.

### Skill Card
- Background: `var(--deep)`, border: `var(--border-subtle)`, border-radius 12px, padding 16px
- Header: type dot (6px, colored) + skill name (0.875rem, font-weight 500)
- Type label: 0.6rem, uppercase, tracked, colored by type
- Status badge: pill, 0.55rem
  - Active: green text + border
  - Draft: sun text + border
  - Archived: muted text + border
- Counters: "X clientes · Y moons" in 0.7rem text-muted
- Footer: "Editado há 2d" + "v3" in 0.65rem text-muted
- Hover: border brighter, cursor pointer
- Click: navigate to `/skills/[skillId]`
- Focus ring, role="link", keyboard enter

## Page 2: Skill Editor (`/skills/[skillId]`)

### Header
- Breadcrumb: Bioma Zero / {skill name}
- Skill name: inline-editable (click to edit, blur to save)
- Type dot colored + status badge (dropdown to change)
- Right side: version link "v3" (opens version modal) + "Descartar" (ghost button) + "Salvar" (sun button)

### Tab Navigation
4 tabs: Identidade, Configuração, Moons, Clientes. Active tab has sun underline.

### Tab 1: Identidade
| Field | Type | Notes |
|-------|------|-------|
| Nome | text input | required |
| Slug | text, read-only | auto-generated from name |
| Tipo | select | Criação/Mídia/Planejamento |
| Descrição | textarea (3 lines) | |
| Ícone | select | 8-10 Lucide icon options |
| Status | select | Ativo/Rascunho/Arquivado |

### Tab 2: Configuração
| Field | Type | Notes |
|-------|------|-------|
| System Prompt | textarea (15 lines, monospace) | The IP-protected prompt |
| Modelo | select | Gemini Pro, Gemini Flash, GPT-4o, Claude |
| Temperatura | slider 0-1 | Shows value label, default 0.7 |
| Max Tokens | number input | Default 4096 |

Note text below: "Configurações protegidas — não visíveis no frontend público" in text-muted with Shield icon.

### Tab 3: Moons
- Editable list of moons
- Each row: drag handle (visual only) + name input + description input + delete button (X, Trash2 icon)
- "Adicionar moon" button at bottom (plus icon, ghost style)
- Empty state: "Nenhuma moon configurada"

### Tab 4: Clientes
- List of all 7 clients
- Each row: client color dot (8px) + name + toggle switch (on/off)
- On = skill assigned to this client
- Counter at top: "Atribuído a X de 7 clientes"
- Toggle updates `assignedClients` in context

### Save Behavior
"Salvar" button calls `updateSkill()` on context. Shows toast "Skill atualizado" for 2s. "Descartar" resets form to last saved state.

## Page 3: Create New Skill (`/skills/new`)

Same editor layout but:
- Empty fields, status default "Rascunho"
- Breadcrumb: Bioma Zero / Novo Skill
- Button: "Criar Skill" instead of "Salvar"
- On create: generates UUID, calls `createSkill()`, redirects to `/skills/[newId]`
- Validation: name required, type required. Show inline error on empty required fields.

## Version History Modal

Triggered by clicking version link in editor header.

- Overlay modal (centered, max-width 500px, max-height 70vh)
- Title: "Histórico de Versões — {skill name}"
- Close button (X) top-right
- Timeline: vertical line on left, entries on right
- Each entry:
  - Version number badge (circle, 24px)
  - Current version: sun background
  - Date + author in 0.7rem text-muted
  - Summary text in 0.8rem text-secondary
  - "Restaurar" button (ghost, 0.65rem) — shows toast "Versão restaurada"
- 3-5 mocked versions per skill

## Navigation Access

### Sidebar
Add "Bioma Zero" to NAV_ITEMS with `Shield` icon from Lucide. Position after "Biblioteca". Click navigates to `/skills`.

### Header
Add Settings icon (Lucide `Settings`) button next to theme toggle in AppHeader. Navigates to `/skills`. Tooltip: "Bioma Zero". Only visible globally (no role-based filtering in prototype).

## Styling

Follow existing design system:
- Dark/light theme via CSS variables
- All form inputs: bg transparent, border `var(--border-subtle)`, border-radius 8px, padding 8px 12px, text-text-primary, focus ring sun color
- Buttons: sun color for primary, ghost (border only) for secondary
- Cards: bg `var(--deep)`, border `var(--border-subtle)`, radius 12px
- Toast: fixed bottom-center, bg `var(--deep)`, border, text-text-primary, auto-dismiss 2s

## File Structure

### New Files
- `app/skills/page.tsx` — Skill catalog
- `app/skills/new/page.tsx` — Create skill
- `app/skills/[skillId]/page.tsx` — Edit skill
- `components/admin/SkillCard.tsx` — Card for catalog grid
- `components/admin/SkillEditor.tsx` — Tab-based editor form
- `components/admin/SkillEditorTabs.tsx` — Tab navigation
- `components/admin/IdentityTab.tsx` — Identity fields
- `components/admin/ConfigTab.tsx` — Config fields (prompt, model, temp)
- `components/admin/MoonsTab.tsx` — Editable moons list
- `components/admin/ClientsTab.tsx` — Client assignment toggles
- `components/admin/VersionHistoryModal.tsx` — Version timeline modal
- `components/admin/SkillFilters.tsx` — Search + type/status filter bar
- `components/ui/Toast.tsx` — Reusable toast notification
- `contexts/SkillsContext.tsx` — SkillsProvider + useSkills hook
- `data/skills-admin.ts` — Initial mocked SkillAdmin data (10 skills)
- `lib/admin-types.ts` — SkillAdmin, SkillVersion interfaces

### Modified Files
- `app/layout.tsx` — Wrap with SkillsProvider
- `components/layout/Sidebar.tsx` — Add Bioma Zero nav item
- `components/layout/AppHeader.tsx` — Add Settings icon

## Accessibility
- All form inputs: proper `<label>` with `htmlFor`
- Tabs: `role="tablist"`, `role="tab"`, `aria-selected`, keyboard arrow keys
- Modal: `role="dialog"`, `aria-modal`, focus trap, Escape to close
- Cards: `role="link"`, keyboard enter
- Toggle switches: `role="switch"`, `aria-checked`
- Toast: `role="status"`, `aria-live="polite"`

## Constraints
- No backend — all Context state, resets on refresh
- No actual file upload for prompts
- No real role-based access (P4 restriction is informational only)
- Version "Restaurar" is visual only (toast, no actual revert)
- Drag-and-drop on moons is visual handle only (no actual reorder logic)
