# Phase 2: AI UX Patterns Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrich the sunOS chat (Level 4) with Prompt Templates, Result Actions (copy/variation/save), and Result Variations (side-by-side cards).

**Architecture:** Extend existing ChatInterface with 3 new components. Template and variant data mocked in TypeScript files. State managed locally in ChatInterface via useState. No backend integration.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Lucide React icons

**Spec:** `docs/superpowers/specs/2026-03-23-phase2-ai-ux-patterns-design.md`

---

## Task 1: Types + Template Data

**Files:**
- Modify: `lib/types.ts`
- Create: `data/prompt-templates.ts`

- [ ] **Step 1: Add PromptTemplate type and extend MockChatResponse**

In `lib/types.ts`, add:
```typescript
export interface PromptTemplate {
  id: string;
  label: string;
  prompt: string;
}
```

Extend `MockChatResponse`:
```typescript
export interface MockChatResponse {
  content: string;
  highlight?: { label: string; body: string };
  variants?: string[]; // 2 alternative texts
}
```

- [ ] **Step 2: Create prompt templates data**

Create `data/prompt-templates.ts` exporting:
```typescript
export const templatesBySkill: Record<string, PromptTemplate[]>
export const templatesByMoon: Record<string, PromptTemplate[]>
```

Provide 2-3 skill-level templates for ALL 8 skills:
- texto-de-radio, copy-social, roteiro-de-video (criação)
- plano-de-midia, report-performance (mídia)
- persona-sintetica, brief-builder, analise-de-mercado (planejamento)

Provide 2-3 moon-specific templates for ALL Santander moons:
- spot-30, jingle, institucional
- feed-carrossel, stories-reels, x-twitter
- tvc-30, digital-pre-roll
- digital, ooh, tv-radio
- semanal, mensal
- jovem-18-25, premium-35, mei-pj

Also add a helper function:
```typescript
export function getTemplatesForChat(skillSlug: string, moonSlug: string): PromptTemplate[]
```
That merges moon-specific (first) + skill-generic, max 6 total.

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add lib/types.ts data/prompt-templates.ts
git commit -m "feat: add PromptTemplate type and template data for all skills/moons"
```

---

## Task 2: Add variants to chat responses

**Files:**
- Modify: `data/chat-responses.ts`

- [ ] **Step 1: Add variants to Santander mock responses**

For each Santander moon response that has content, add a `variants` field with 2 alternative texts. These should be plausible alternatives — different tone, structure, or angle, but for the same brief. Focus on the moons that will be demoed: `spot-30`, `feed-carrossel`, `stories-reels`, `jingle`, `semanal`.

Example for spot-30:
```typescript
variants: [
  'LOC: "Seu dinheiro merece mais. Santander Select: investimentos com cashback, assessoria dedicada e benefícios exclusivos. Abra sua conta." TEC: Trilha Santander. LOC: "Santander. O que a gente pode fazer por você hoje?"',
  'LOC: "E se o seu banco entendesse o seu momento? Santander Select acompanha cada fase da sua vida com soluções sob medida. Venha para o Select." TEC: Sobe trilha. LOC: "Santander."',
]
```

At minimum, add variants to 5-6 responses. Others can have `variants: undefined`.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add data/chat-responses.ts
git commit -m "feat: add variant texts to Santander mock chat responses"
```

---

## Task 3: PromptTemplateBar Component

**Files:**
- Create: `components/chat/PromptTemplateBar.tsx`

- [ ] **Step 1: Create the component**

`components/chat/PromptTemplateBar.tsx`:

Props:
- `templates: PromptTemplate[]`
- `onSelect: (prompt: string) => void`

Renders:
- Wrapper div centered in the chat area
- Title: "Comece com um template" — 0.7rem, text-muted, margin-bottom 12px
- Grid: 2 columns, gap 8px, max-width 500px
- Each card:
  - `role="button"`, `tabIndex={0}`, keyboard enter/space support
  - Background: transparent
  - Border: `var(--border-subtle)`, border-radius 8px
  - Hover: background `var(--surface-hover)`, border brighter
  - Padding: 10px 14px
  - Label: 0.75rem, text-secondary
  - Cursor pointer
  - Focus ring: sun color
  - `aria-label={template.label}`
- On click: calls `onSelect(template.prompt)`

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/chat/PromptTemplateBar.tsx
git commit -m "feat: add PromptTemplateBar component for chat empty state"
```

---

## Task 4: ResultActions Component

**Files:**
- Create: `components/chat/ResultActions.tsx`

- [ ] **Step 1: Create the component**

`components/chat/ResultActions.tsx`:

Props:
- `content: string`
- `highlightBody?: string`
- `onGenerateVariation: () => void`
- `onSave: () => void`
- `isSaved: boolean`

Uses `useState` for:
- `copied: boolean` — true for 2s after copy
- `savedFlash: boolean` — true for 2s after save, shows "Salvo na Biblioteca" text

Renders a flex row with 3 buttons:

**Copy button:**
- Icon: `Copy` (14px) or `Check` (14px) when copied
- Label: "Copiar" or "Copiado!" when copied
- On click: `navigator.clipboard.writeText(content + (highlightBody ? '\n\n' + highlightBody : ''))`, set `copied=true`, setTimeout 2s to reset

**Variation button:**
- Icon: `Shuffle` (14px)
- Label: "Gerar variação"
- On click: calls `onGenerateVariation()`

**Save button:**
- Icon: `Bookmark` (14px) when not saved, `BookmarkCheck` when saved
- Label: "Salvar" or "Salvo"
- On click: calls `onSave()`, set `savedFlash=true` for 2s
- When savedFlash: show small "Salvo na Biblioteca" text below the button row in 0.55rem text-muted, fades in/out

All buttons: inline-flex, gap 4px, 0.65rem text, text-muted, hover text-secondary, no bg, no border, cursor-pointer, transition 150ms, focus ring.

Whole row: opacity 0 → 1 animation on mount (use CSS animation or `orbit-appear` class).

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/chat/ResultActions.tsx
git commit -m "feat: add ResultActions component — copy, variation, save"
```

---

## Task 5: VariationCards Component

**Files:**
- Create: `components/chat/VariationCards.tsx`

- [ ] **Step 1: Create the component**

`components/chat/VariationCards.tsx`:

Props:
- `original: string`
- `originalHighlight?: { label: string; body: string }`
- `variants: string[]`
- `selectedIndex: number`
- `onSelect: (index: number) => void`

Renders:
- Container: full width, margin-top 12px
- `role="radiogroup"`, `aria-label="Variações de resposta"`
- Grid: 3 columns (or `repeat(auto-fit, minmax(200px, 1fr))` for responsive), gap 12px
- Each card (index 0 = original, 1+ = variants):
  - `role="radio"`, `aria-checked={selectedIndex === i}`, `tabIndex={0}`, keyboard support
  - Header: "V1 · Original" / "V2" / "V3" — 0.6rem, uppercase, tracked, text-muted
  - Body: text in 0.8rem, text-secondary, line-clamp-5 with CSS `-webkit-line-clamp: 5`
  - If index 0 and `originalHighlight`: show highlight block (same style as MessageBubble)
  - Footer: "Usar esta" button — 0.65rem, border `var(--border-subtle)`, border-radius pill, padding 4px 12px, hover brighter
  - Background: `var(--deep)`
  - Border: `var(--border-subtle)`, border-radius 10px
  - Padding: 14px
  - Selected card: `border-color: var(--sun)`, small badge top-right with sun bg + "Selecionada" in 0.5rem void color
  - Cursor pointer on the whole card (clicking card = selecting it)
  - Focus ring on each card

`onSelect(index)` called when card or "Usar esta" button is clicked.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/chat/VariationCards.tsx
git commit -m "feat: add VariationCards component — side-by-side comparison"
```

---

## Task 6: Integrate into MessageBubble

**Files:**
- Modify: `components/chat/MessageBubble.tsx`

- [ ] **Step 1: Add ResultActions support**

Add new optional props to `MessageBubbleProps`:
```typescript
showActions?: boolean;
onCopy?: () => void;
onGenerateVariation?: () => void;
onSave?: () => void;
isSaved?: boolean;
```

When `showActions` is true and role is 'assistant', render `ResultActions` below the message content div. Pass through the handlers.

For `onCopy`: use the message `content` + `highlight?.body` as the text.

Keep existing rendering untouched — just add the optional actions section at the bottom.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add components/chat/MessageBubble.tsx
git commit -m "feat: integrate ResultActions into MessageBubble"
```

---

## Task 7: Integrate Everything into ChatInterface

**Files:**
- Modify: `components/chat/ChatInterface.tsx`
- Modify: `app/[clientSlug]/[skillSlug]/[moonSlug]/page.tsx`

- [ ] **Step 1: Add skillSlug prop to ChatInterface**

Add `skillSlug: string` to `ChatInterfaceProps`. Update the Level 4 page to pass it:
```typescript
<ChatInterface
  moonSlug={moonSlug}
  skillSlug={skillSlug}  // NEW
  clientSlug={clientSlug}
  biblioteca={...}
/>
```

- [ ] **Step 2: Integrate PromptTemplateBar**

In ChatInterface:
- Import `PromptTemplateBar` and `getTemplatesForChat`
- Get templates: `const templates = getTemplatesForChat(skillSlug, moonSlug)`
- When `messages.length === 0`, render `PromptTemplateBar` centered in the message area
- `onSelect` calls `handleSend(prompt)` — fills input and auto-sends

- [ ] **Step 3: Integrate ResultActions state**

Add state:
```typescript
const [savedMessages, setSavedMessages] = useState<Set<number>>(new Set());
const [variations, setVariations] = useState<Record<number, {
  variants: string[];
  selectedIndex: number;
  originalHighlight?: { label: string; body: string };
}>>();
```

For each completed assistant message (not currently streaming), pass to MessageBubble:
- `showActions={true}`
- `onCopy` — handled internally by ResultActions
- `onGenerateVariation={() => handleGenerateVariation(messageIndex)}`
- `onSave={() => toggleSave(messageIndex)}`
- `isSaved={savedMessages.has(messageIndex)}`

- [ ] **Step 4: Implement handleGenerateVariation**

```typescript
function handleGenerateVariation(msgIndex: number) {
  // Find the original response from mock data
  const msg = messages[msgIndex];
  const clientKey = `${clientSlug}-${moonSlug}`;
  const responses = chatResponsesByMoon[clientKey] ?? chatResponsesByMoon[moonSlug];

  // Find matching response by content
  const matchedResponse = responses?.find(r => msg.content.includes(r.content.substring(0, 50)));

  const variantTexts = matchedResponse?.variants ?? [
    `Versão alternativa: ${msg.content.substring(0, 100)}...`,
    `Outra abordagem: ${msg.content.substring(0, 100)}...`,
  ];

  setVariations(prev => ({
    ...prev,
    [msgIndex]: {
      variants: variantTexts,
      selectedIndex: 0,
      originalHighlight: msg.highlight,
    },
  }));
}
```

- [ ] **Step 5: Render VariationCards**

After each assistant MessageBubble, check if `variations[msgIndex]` exists. If yes, render `VariationCards` with the data.

```typescript
{variations[i] && (
  <VariationCards
    original={msg.content}
    originalHighlight={variations[i].originalHighlight}
    variants={variations[i].variants}
    selectedIndex={variations[i].selectedIndex}
    onSelect={(idx) => setVariations(prev => ({
      ...prev,
      [i]: { ...prev[i], selectedIndex: idx },
    }))}
  />
)}
```

- [ ] **Step 6: Verify full flow**

1. Navigate to `/santander/texto-de-radio/spot-30`
2. Verify: template cards show in empty state
3. Click a template — message sends, response streams
4. After streaming: action buttons appear (Copy, Gerar variação, Salvar)
5. Click Copy — icon changes to check for 2s
6. Click Salvar — icon changes to filled, "Salvo na Biblioteca" text appears
7. Click Gerar variação — 3 cards appear (V1 original + V2, V3)
8. Click a card — gets selected with sun border

- [ ] **Step 7: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 8: Commit**

```bash
git add components/chat/ChatInterface.tsx app/[clientSlug]/[skillSlug]/[moonSlug]/page.tsx
git commit -m "feat: integrate Prompt Templates, Result Actions, and Variation Cards into chat"
```

---

## Task 8: Polish + Cleanup

**Files:**
- Various (minor fixes)

- [ ] **Step 1: Verify all 3 patterns work together**

Full demo flow:
1. Home → Santander → Texto de Rádio → Spot 30"
2. Templates visible → click one → response with actions
3. Copy works → Variation generates 3 cards → Save toggles
4. Type a custom message → same actions on new response
5. Navigate to another moon → templates refresh

- [ ] **Step 2: Check theme compatibility**

Switch to light theme. Verify:
- Template cards readable
- Action buttons visible
- Variation cards have proper contrast
- Borders visible

- [ ] **Step 3: Check keyboard navigation**

Tab through template cards → enter to select. Tab to action buttons → enter to activate. Tab through variation cards → enter/space to select.

- [ ] **Step 4: Build check**

```bash
npm run build
```

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete Phase 2 — AI UX Patterns in chat"
```
