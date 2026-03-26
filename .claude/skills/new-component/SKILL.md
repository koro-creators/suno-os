---
name: new-component
description: Scaffold a new React component following sunOS design patterns
---

# New Component

Create a new React component following sunOS conventions.

## Arguments

- `name` (required): Component name in PascalCase (e.g., `StatusBadge`)
- `dir` (optional): Subdirectory under `components/` (e.g., `admin`, `biblioteca`, `ui`). Defaults to `ui`.

## Template

Generate the file at `components/{dir}/{name}.tsx` with:

```tsx
'use client';

// Import from lucide-react if icons needed
// import { IconName } from 'lucide-react';

interface {name}Props {
  // Define props
}

export default function {name}({ }: {name}Props) {
  return (
    <div
      style={{
        backgroundColor: 'var(--deep)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
        padding: 16,
      }}
    >
      {/* Component content */}
    </div>
  );
}
```

## Conventions to Follow

- Always use `'use client'` for interactive components
- Use **inline styles** (not Tailwind classes) for layout — this is the project convention
- Use CSS variables from the design system:
  - Backgrounds: `var(--void)`, `var(--deep)`, `var(--nebula)`
  - Borders: `var(--border-subtle)`, `var(--twilight)`
  - Text: `var(--text-primary)`, `var(--text-secondary)`, `var(--text-muted)`
  - Accent: `var(--sun)` (#FFC801)
  - Skill types: `var(--criacao)`, `var(--midia)`, `var(--planejamento)`
- Border radius: 12px for cards, 8px for inputs, 9999px for pills
- Transitions: `150ms ease` for hover/color, `200ms ease` for layout
- Icons: `lucide-react`, size 14, strokeWidth 1.5
- Focus rings: `boxShadow: '0 0 0 2px rgba(255,200,1,0.15)'`
- Hover on cards: `borderColor: 'var(--twilight)'`
- Both themes must work (dark + light via `data-theme` attribute)
