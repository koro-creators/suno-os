---
name: new-admin-page
description: Scaffold a complete admin CRUD feature with catalog, editor, context, and mock data
---

# New Admin Page

Generate the full boilerplate for a new admin CRUD feature following the established pattern (Skills, Biblioteca, Clientes).

## Arguments

- `name` (required): Feature name in singular PascalCase (e.g., `Campanha`)
- `slug` (required): URL slug (e.g., `campanhas`)

## What Gets Generated

### Files to Create

1. **`lib/{slug}-types.ts`** — TypeScript interfaces for the entity
2. **`data/{slug}-admin.ts`** — Mock data (5-10 items)
3. **`contexts/{Name}Context.tsx`** — React Context with CRUD (create, update, delete)
4. **`components/{slug}/{Name}Card.tsx`** — Card for catalog grid
5. **`components/{slug}/{Name}Editor.tsx`** — Tab-based editor with save/discard
6. **`components/{slug}/{Name}EditorTabs.tsx`** — Tab navigation
7. **`app/{slug}/page.tsx`** — Catalog page with grid + search
8. **`app/{slug}/new/page.tsx`** — Create page
9. **`app/{slug}/[{name}Id]/page.tsx`** — Edit page

### Files to Modify

1. **`components/layout/Sidebar.tsx`** — Add nav item with href
2. **`components/layout/Providers.tsx`** — Wrap with new Provider

## Patterns to Follow

### Context Pattern (from `contexts/SkillsContext.tsx`)
```typescript
interface {Name}ContextValue {
  items: {Name}[];
  createItem: (data: Omit<{Name}, 'id' | 'createdAt' | 'updatedAt'>) => {Name};
  updateItem: (id: string, data: Partial<{Name}>) => void;
  deleteItem: (id: string) => void;
}
```

### Catalog Page Pattern (from `app/skills/page.tsx`)
- AppHeader with breadcrumb
- Title (2rem, weight 300) + subtitle (text-muted) + "Novo {Name}" button (sun, pill)
- Search input (pill shape)
- Grid: `repeat(auto-fill, minmax(280px, 1fr))`, gap 16px
- Empty state: "Nenhum item encontrado."

### Card Pattern (from `components/admin/SkillCard.tsx`)
- bg `var(--deep)`, border `var(--border-subtle)`, radius 12px, padding 16px
- `role="link"`, tabIndex 0, Enter key, hover border, focus ring
- Click navigates to editor

### Editor Pattern (from `components/admin/SkillEditor.tsx`)
- Inline-editable name (1.5rem, weight 300)
- Tab navigation with sun underline
- "Descartar" (ghost) + "Salvar" (sun) buttons
- Toast on save via `components/ui/Toast.tsx`
- Validation with inline errors

### Input Styles
- bg transparent, border `var(--border-subtle)`, radius 8px
- padding 8px 12px, fontSize 0.8rem, color var(--text-primary)
- Focus: borderColor var(--sun), boxShadow 0 0 0 2px rgba(255,200,1,0.15)

### Label Styles
- fontSize 0.7rem, color var(--text-secondary), marginBottom 4px, fontWeight 500
