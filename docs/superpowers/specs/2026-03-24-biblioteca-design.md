# Biblioteca — Design Spec

## Overview

Base de conhecimento flat do sunOS com itens de texto, links e arquivos. Cada item tem tags livres e escopo (Suno global ou clientes específicos). Alimenta os skills automaticamente por tags e permite seleção manual no chat. Todos os dados em React Context (sem backend).

## Data Model

### BibliotecaDocument

```typescript
interface BibliotecaDocument {
  id: string;
  title: string;
  content: string;
  tags: string[];
  scope: string[];              // ["suno"] ou ["santander", "vivo"], etc.
  links: { label: string; url: string }[];
  files: { name: string; type: string; size: string }[];
  createdBy: string;
  updatedAt: string;
}
```

- `scope` com `["suno"]` = conhecimento global
- `scope` com slugs de clientes = específico deles
- Um item pode ter múltiplos scopes
- Tags são livres, autocomplete sugere tags existentes

### BibliotecaProvider (React Context)

```typescript
interface BibliotecaContextValue {
  documents: BibliotecaDocument[];
  createDocument: (data: Omit<BibliotecaDocument, 'id'>) => BibliotecaDocument;
  updateDocument: (id: string, data: Partial<BibliotecaDocument>) => void;
  deleteDocument: (id: string) => void;
  allTags: string[];            // computed: unique tags across all docs
}
```

Initialized with ~30 mocked documents. Mutations persist during session only.

## Route

```
/biblioteca    → Biblioteca catalog (single page, no sub-routes)
```

## Page Layout (`/biblioteca`)

### Header
- Breadcrumb: "Biblioteca"
- Title: "Biblioteca" (h1, 2rem, weight 300) + "Base de conhecimento" (subtitle, text-muted)
- "Novo Item" button (sun, pill) top-right

### Filter Bar
- **Scope pills** (multi-select): `Suno · Santander · Vivo · Americanas · MRV · Sicredi · BMG · Stone`. Toggle on/off. Suno always first. Each pill shows client color dot (8px). Suno uses sun color dot.
- **Search input** (pill, Search icon): filters by title and content
- **Tag cloud**: below scope+search. Shows most frequent tags as small pills. Click to toggle filter. Only shows tags present in currently filtered results.

### Card Grid
- 2 columns desktop, 1 mobile. Gap 12px. Padding 24px.
- Cards are expandable inline (click to expand/collapse).

### BibliotecaCard
**Collapsed state:**
- Background: `var(--deep)`, border: `var(--border-subtle)`, border-radius 12px, padding 16px
- Title: 0.875rem, font-weight 500
- Content preview: 2 lines, 0.75rem, text-secondary, overflow ellipsis
- Scope indicators: row of colored dots (6px each) — client color for clients, sun color for Suno. Tooltip on hover showing name.
- Tags: row of small chips (0.6rem, border-subtle, text-muted, pill shape, max 3 visible + "+N" overflow)
- Footer: "X links · Y arquivos" (0.65rem, text-muted) + "Editado há Xd" (0.65rem, text-muted)
- Hover: border brighter
- Click: expands inline

**Expanded state:**
- Card grows to show full content (preserving position in grid — spans full row)
- Full content text (0.8rem, text-primary, white-space pre-wrap)
- Links section: list of links, each with label + URL (clickable, text-secondary, 0.75rem)
- Files section: list of files, each with icon (FileText/Image/File) + name + type + size (0.75rem, text-secondary)
- Scope: full names listed (not just dots)
- All tags visible
- "Editar" button (ghost) + "Fechar" button (ghost, X icon) at top-right of expanded area
- Click "Editar": opens modal

### BibliotecaModal (Create/Edit)
- Overlay centered, max-width 600px, max-height 80vh, overflow auto
- Background: `var(--deep)`, border: `var(--border-subtle)`, radius 12px, padding 24px
- Close button (X) top-right
- Focus trap, Escape to close, `role="dialog"`, `aria-modal`

**Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Título | text input | required |
| Conteúdo | textarea (10 lines) | main body text |
| Escopo | multi-select pills | Suno + 7 clients, toggle on/off, at least 1 required |
| Tags | tag input | type to add, autocomplete from existing tags, Enter/comma to add, X to remove |
| Links | editable list | each row: label input + URL input + delete button. "Adicionar link" button at bottom |
| Arquivos | editable list | each row: name input + type select (PDF/Imagem/Deck/Outro) + size input + delete. "Adicionar arquivo" button. All mocked, no real upload |

**Buttons:** "Cancelar" (ghost) + "Salvar"/"Criar" (sun)
**Validation:** title required, at least 1 scope required. Inline errors.
**Toast:** "Item salvo" / "Item criado" (2s)

## Integration with Chat (ContextSidebar)

### Auto-selection Logic (mocked)
When user enters a chat (level 4: client → skill → moon):
1. Items with scope including current client → candidates
2. Items with scope "suno" → always candidates
3. From candidates, items with tags matching skill type (criacao/midia/planejamento) → activated by default
4. Items tagged "tom-de-voz" for current client → always activated by default
5. Remaining candidates → available but off

### ContextSidebar Evolution
- Replace current flat `BibliotecaItem[]` with `BibliotecaDocument[]`
- Each item shows: title + toggle switch (on/off)
- Active items: sun left border (as today)
- New "+ Adicionar contexto" button at top of Biblioteca section
- Click opens a popover/mini-search: text input to search by title/tag, shows matching items from Biblioteca, click to add to active context
- Toggle persists during chat session only

## Navigation

### Sidebar
Add `href: '/biblioteca'` to existing "Biblioteca" nav item (BookOpen icon). Currently decorative — will now navigate.

## File Structure

### New Files (9)
- `app/biblioteca/page.tsx` — Biblioteca catalog page
- `components/biblioteca/BibliotecaCard.tsx` — Expandable card
- `components/biblioteca/BibliotecaFilters.tsx` — Scope pills + search + tag cloud
- `components/biblioteca/BibliotecaModal.tsx` — Create/edit modal
- `components/biblioteca/ScopePills.tsx` — Multi-select scope component
- `components/biblioteca/TagInput.tsx` — Tag input with autocomplete
- `contexts/BibliotecaContext.tsx` — BibliotecaProvider + useBiblioteca hook
- `data/biblioteca-docs.ts` — ~30 mocked BibliotecaDocument items
- `lib/biblioteca-types.ts` — BibliotecaDocument interface

### Modified Files (3)
- `components/layout/Sidebar.tsx` — Add href to Biblioteca nav item
- `components/layout/Providers.tsx` — Add BibliotecaProvider
- `components/chat/ContextSidebar.tsx` — Evolve to use BibliotecaDocument, toggles, add-context button

### Removed Files (1)
- `data/biblioteca.ts` — Replaced by `data/biblioteca-docs.ts`

## Mock Data (~30 items)

### Suno (global) — ~10 items
- "Tendências Marketing Digital 2026" (tags: tendencias, digital)
- "Cases Cannes Lions 2025 — Destaques" (tags: cannes, premiacao, referencia)
- "Análise Concorrência — Agências IA Brasil" (tags: concorrencia, mercado)
- "Benchmark CPM Digital Brasil Q1 2026" (tags: benchmark, midia, dados)
- "Guia de Tom para Marcas Premium" (tags: tom-de-voz, criacao)
- "Framework PESTEL — Template" (tags: planejamento, framework)
- "Regulamentações Publicidade Digital CONAR" (tags: restricoes, legal)
- "Tendências IA Generativa em Publicidade" (tags: tendencias, ia, criacao)
- "Referências Visuais — Direção de Arte 2026" (tags: referencia, criacao)
- "Estudo: Atenção em Vídeo Curto vs Longo" (tags: dados, midia, video)

### Per-client — ~3 items each (21 total)
Each client gets: tom de voz, 1 historical/data item, 1 restriction/specific item. Tags include client-relevant categories.

## Styling

Follow existing design system:
- Dark/light theme via CSS variables
- Cards: bg `var(--deep)`, border `var(--border-subtle)`, radius 12px
- Inputs: bg transparent, border `var(--border-subtle)`, radius 8px, focus ring sun
- Pills/tags: border `var(--border-subtle)`, radius 9999px, 0.6-0.7rem
- Modal: bg `var(--deep)`, border `var(--border-subtle)`, radius 12px
- Toast: fixed bottom-center, pill, auto-dismiss 2s
- Expanded card: smooth transition (height auto, 200ms ease)

## Accessibility
- Modal: `role="dialog"`, `aria-modal`, focus trap, Escape to close
- Cards: `role="button"`, keyboard Enter to expand/collapse
- Toggle switches: `role="switch"`, `aria-checked`
- Tag input: `aria-label`, keyboard Enter/comma to add, Backspace to remove last
- Scope pills: `aria-pressed` for toggle state
- Toast: `role="status"`, `aria-live="polite"`
- Search: `aria-label="Buscar na biblioteca"`

## Constraints
- No backend — all Context state, resets on refresh
- No real file upload — files are mocked (name + type + size only)
- No real link preview/fetch
- Auto-selection in ContextSidebar is mocked logic, not ML-driven
- Tag autocomplete is simple substring match, not fuzzy
