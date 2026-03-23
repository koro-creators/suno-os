# Phase 2: AI UX Patterns — Design Spec

## Overview

Enrich the sunOS chat experience (Level 4) with 3 AI UX patterns: Prompt Templates, Result Actions, and Result Variations. All data remains mocked — no backend integration.

## Pattern 1: Prompt Templates

### What

When the chat is empty (no messages), show a grid of template cards that pre-fill the input with relevant prompts.

### Data Model

```typescript
interface PromptTemplate {
  id: string;
  label: string;    // short display name
  prompt: string;   // full text sent to chat
}
```

Templates come from 2 hierarchical sources (merged, deduplicated):
- `templatesBySkill[skillSlug]` — generic templates for the skill type (2-3 per skill)
- `templatesByMoon[moonSlug]` — specific templates for the sub-area (2-3 per moon)

Moon-specific templates display first, skill-generic after. Total visible: 4-6 cards.

### Data File

Create `data/prompt-templates.ts` exporting `templatesBySkill` and `templatesByMoon` as `Record<string, PromptTemplate[]>`.

Example:
```
templatesBySkill['texto-de-radio'] = [
  { id: 'tr-1', label: 'Adaptar tom para público específico', prompt: 'Adapte o tom deste texto para o público...' },
  { id: 'tr-2', label: 'Versão mais curta (15s)', prompt: 'Crie uma versão reduzida de 15 segundos...' },
]

templatesByMoon['spot-30'] = [
  { id: 'sp-1', label: 'Spot 30s para campanha', prompt: 'Gere um spot de rádio de 30 segundos para a campanha...' },
  { id: 'sp-2', label: 'Spot com CTA direto', prompt: 'Crie um spot de 30s com chamada para ação clara...' },
]
```

Provide templates for ALL skills and ALL moons of Santander (the demo client). Other clients can share generic skill templates.

### Component: `PromptTemplateBar`

Create `components/chat/PromptTemplateBar.tsx`.

Props:
- `templates: PromptTemplate[]`
- `onSelect: (prompt: string) => void`

Renders:
- Title: "Comece com um template" in 0.7rem text-muted
- Grid: 2 columns, gap 8px
- Each card:
  - Background: transparent, border `var(--border-subtle)`
  - Hover: background `var(--surface-hover)`, border slightly brighter
  - Padding: 10px 14px
  - Label: 0.75rem text-secondary
  - Border-radius: 8px
  - Cursor pointer
  - `role="button"`, `tabIndex={0}`, keyboard support

Behavior:
- On click/enter: calls `onSelect(template.prompt)` which fills the input AND auto-sends
- Disappears when `messages.length > 0`

### Integration

In `ChatInterface.tsx`:
- Import `PromptTemplateBar` and template data
- Merge `templatesBySkill[skillSlug] + templatesByMoon[moonSlug]` (moon first)
- Render `PromptTemplateBar` when `messages.length === 0`
- `onSelect` calls `handleSend(prompt)`

ChatInterface needs to receive `skillSlug` as an additional prop (currently only has `moonSlug` and `clientSlug`). Update the Level 4 page to pass it.

## Pattern 2: Result Actions

### What

Each assistant message gets an action bar after streaming completes: Copy, Generate Variation, Save.

### Component: `ResultActions`

Create `components/chat/ResultActions.tsx`.

Props:
- `content: string` — the full message text to copy
- `highlightBody?: string` — additional text from highlight block
- `onGenerateVariation: () => void`
- `onSave: () => void`
- `isSaved: boolean`

Renders a horizontal row of 3 buttons:

| Action | Icon (Lucide) | Label | Behavior |
|--------|--------------|-------|----------|
| Copy | `Copy` → `Check` (2s) | "Copiar" | `navigator.clipboard.writeText(content + highlightBody)`. Icon changes to Check for 2s then reverts. |
| Variation | `Shuffle` | "Gerar variação" | Calls `onGenerateVariation()` |
| Save | `Bookmark` (outline) → `BookmarkCheck` (filled) | "Salvar" | Toggles `isSaved`. Shows toast-like text "Salvo na Biblioteca" for 2s. |

Style:
- Flex row, gap 16px, margin-top 8px
- Each button: inline-flex, gap 4px between icon (14px) and label (0.65rem)
- Color: text-muted, hover text-secondary
- No background, no border
- Transition 150ms
- Cursor pointer, focus ring

Appears with `opacity 0 → 1` animation (200ms) after streaming completes.

### Integration

In `MessageBubble.tsx`:
- Add optional props: `showActions?: boolean`, `onCopy`, `onGenerateVariation`, `onSave`, `isSaved`
- When `showActions` is true, render `ResultActions` below the message content
- Only assistant messages after streaming get `showActions={true}`

In `ChatInterface.tsx`:
- Track `savedMessages: Set<number>` state (set of message indices)
- Pass action handlers to each assistant MessageBubble
- `onGenerateVariation` triggers variation flow (see Pattern 3)
- `onSave` toggles the message index in `savedMessages`

## Pattern 3: Result Variations

### What

When "Gerar variação" is clicked, show 3 cards side by side: the original + 2 alternatives.

### Data Model

Extend `MockChatResponse`:
```typescript
interface MockChatResponse {
  content: string;
  highlight?: { label: string; body: string };
  variants?: string[];  // NEW: 2 alternative texts
}
```

Add `variants` to Santander's mock responses in `data/chat-responses.ts`. Each variant is a full alternative text (not a diff). Only need variants for Santander's moons that will be demoed.

### Component: `VariationCards`

Create `components/chat/VariationCards.tsx`.

Props:
- `original: string` — V1 text
- `originalHighlight?: { label: string; body: string }`
- `variants: string[]` — V2, V3 texts
- `selectedIndex: number` — which is selected (default 0 = original)
- `onSelect: (index: number) => void`

Renders:
- Container: full width (breaks out of the 75% max-width), margin-top 12px
- Grid: 3 columns, gap 12px
- Each card:
  - Header: "V1 · Original" / "V2" / "V3" in 0.6rem uppercase tracked text-muted
  - Body: text in 0.8rem text-secondary, max 5 lines with `line-clamp-5` + "ver mais" toggle
  - Footer: "Usar esta" button — pill, 0.65rem, border `var(--border-subtle)`, hover brighter
  - Background: `var(--deep)`
  - Border: `var(--border-subtle)`, border-radius 10px
  - Padding: 14px
  - Selected card: `border-color: var(--sun)`, small sun-colored dot badge top-right "Selecionada" in 0.5rem

### State in ChatInterface

```typescript
// Map of message index → variation state
const [variations, setVariations] = useState<Record<number, {
  variants: string[];
  selectedIndex: number;
  originalHighlight?: { label: string; body: string };
}>>({});
```

When "Gerar variação" is clicked for message at index `i`:
1. Look up the original response's `variants` from mock data
2. If no variants in data, generate simple alternatives (append "Versão alternativa:" prefix)
3. Set `variations[i] = { variants, selectedIndex: 0, originalHighlight }`
4. Show brief streaming indicator (500ms delay) then reveal the VariationCards

Render `VariationCards` right after the message's `MessageBubble` when `variations[i]` exists.

## File Changes Summary

### New Files
- `data/prompt-templates.ts` — template data by skill and moon
- `components/chat/PromptTemplateBar.tsx` — template grid component
- `components/chat/ResultActions.tsx` — action buttons component
- `components/chat/VariationCards.tsx` — side-by-side variation cards

### Modified Files
- `components/chat/ChatInterface.tsx` — integrate all 3 patterns, add skillSlug prop
- `components/chat/MessageBubble.tsx` — add ResultActions rendering
- `data/chat-responses.ts` — add `variants` to Santander responses
- `app/[clientSlug]/[skillSlug]/[moonSlug]/page.tsx` — pass skillSlug to ChatInterface
- `lib/types.ts` — add `PromptTemplate` type, extend `MockChatResponse` with `variants`

## Accessibility

- All template cards: `role="button"`, `tabIndex={0}`, keyboard enter/space
- Result action buttons: proper `aria-label` on each
- Copy feedback: visual only (icon change) — no screen reader announcement needed for prototype
- Variation cards: `role="radiogroup"` on container, `role="radio"` + `aria-checked` on each card
- Focus ring (sun color) on all interactive elements

## Constraints

- All data mocked — no API calls
- Variants only needed for Santander demo moons (6 skills × moons)
- Templates for all 8 skills + Santander moons
- No localStorage persistence for saved items (prototype only)
- Streaming simulation reused for variation generation (same delay pattern)
