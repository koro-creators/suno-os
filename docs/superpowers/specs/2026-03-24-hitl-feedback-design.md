# Human in the Loop — Feedback Loop Design Spec

## Overview

Sistema de feedback em duas camadas para avaliação de outputs da IA no sunOS. Feedback rápido por mensagem (thumbs up/down + comentário) inline no chat + painel de validação no ContextSidebar que agrega os feedbacks da sessão. Score médio mocado visível nos SkillCards do catálogo. Inclui cleanup do sidebar (Dashboard → Home).

## Data Model

### MessageFeedback

```typescript
interface MessageFeedback {
  rating: 'up' | 'down' | null;
  comment: string;
}
```

Gerenciado no ChatInterface via `Record<number, MessageFeedback>` (message index → feedback). Session state only.

### SessionFeedback

```typescript
interface SessionFeedback {
  rating: number;        // 1-5
  comment: string;
  submittedAt: string;   // ISO 8601
}
```

Gerenciado no ChatInterface. Session state only.

### SkillAdmin extension

Add to existing `SkillAdmin` interface:

```typescript
averageScore: number;      // 0-5, 1 decimal
totalFeedbacks: number;
```

Mocked in `data/skills-admin.ts`. Active skills get scores between 3.2-4.8. Draft skills get `averageScore: 0, totalFeedbacks: 0`.

## Feature 1: Feedback Inline no Chat

### ResultActions Extension

The existing ResultActions component (Copy, Variação, Salvar) gets two new buttons appended at the end:

- **Thumbs Up** — `ThumbsUp` icon from Lucide. Default: text-muted. Active: `var(--planejamento)` (#10B981) fill.
- **Thumbs Down** — `ThumbsDown` icon from Lucide. Default: text-muted. Active: #EF4444 fill.
- Mutually exclusive toggle: selecting one deselects the other. Clicking active thumb deselects it (back to null).
- Same icon size and style as existing action buttons (12px, strokeWidth 1.5).

### FeedbackInline Component

Appears below the ResultActions row when a thumb is clicked:

- Animated expand (max-height transition, 150ms ease)
- Single-line text input, placeholder "Comentário opcional..."
- Style: bg transparent, border `var(--border-subtle)`, radius 8px, padding 6px 10px, fontSize 0.7rem
- Focus ring sun color
- Enter key or blur: saves comment to state
- Stays visible until next user message or until manually collapsed
- If comment exists: shows as subtle text below thumbs (0.65rem, text-muted, italic) when input is not focused

### ChatInterface State

New state in ChatInterface:

```typescript
const [feedbacks, setFeedbacks] = useState<Record<number, MessageFeedback>>({});
const [sessionFeedback, setSessionFeedback] = useState<SessionFeedback | null>(null);
```

Pass to ResultActions: `feedback={feedbacks[msgIndex]}`, `onFeedbackChange={(f) => updateFeedback(msgIndex, f)}`

Pass to ContextSidebar: `feedbacks`, `messages`, `sessionFeedback`, `onSessionFeedback`

## Feature 2: Validation Panel in ContextSidebar

The existing decorative "Validação" section evolves into a functional mini-dashboard.

### Layout (top to bottom)

**1. Header + HITL Badge (keep existing)**
- "Validação" section header with green dot
- "Human in the Loop" badge with pulsing green dot (unchanged visual)

**2. Session Score Bar**
- Text: `X de Y mensagens avaliadas` (0.7rem, text-secondary)
- Visual bar: thin progress bar (4px height, radius 2px). Fill = percentage of evaluated messages. Color: `var(--planejamento)` for evaluated portion, `var(--border-subtle)` for remaining.
- Counters below bar: `N aprovadas` (green dot + text) · `N rejeitadas` (red dot + text) · `N sem avaliação` (muted dot + text). All 0.6rem.
- Session status badge:
  - \> 50% approved: "Sessão positiva" (green border, green text, 0.55rem pill)
  - \> 50% rejected: "Precisa revisão" (red border, red text)
  - Otherwise: "Em progresso" (muted border, muted text)
  - No evaluations yet: no badge shown

**3. Feedback List**
- Shows messages that received evaluation in this session
- Each item (compact row, gap 6px):
  - Thumb icon (ThumbsUp or ThumbsDown, 10px, colored green/red)
  - Output preview: first 30 chars of message content, truncated with "..." (0.65rem, text-secondary)
  - Comment if exists: below preview, 0.6rem, text-muted, italic
- Click item: smooth scroll to that message in the chat (`element.scrollIntoView({ behavior: 'smooth' })`)
- Max 5 visible, overflow-y auto with scroll if more
- Empty state: "Nenhuma avaliação ainda" (0.65rem, text-muted)

**4. "Avaliar sessão" Button + Form**
- Ghost button: "Avaliar sessão" (0.7rem, border var(--border-subtle), radius 8px)
- Only visible when at least 1 message has been evaluated
- Click expands inline form:
  - Rating: 5 circles (12px each, gap 4px). Empty: border `var(--border-subtle)`. Filled: bg `var(--sun)`. Click to select 1-5. Hover fills up to hovered position.
  - Comment: textarea (2 rows, same input style, placeholder "Como foi essa sessão?")
  - "Salvar" button (sun, small) + "Cancelar" (ghost, small)
- On save: toast "Sessão avaliada" (2s). Button changes to "Sessão avaliada ★ X" (non-interactive, green text)
- Session feedback persists in ChatInterface state only

## Feature 3: Score on SkillCards

### SkillCard Extension

Between the counters line ("X clientes · Y moons") and the footer ("Editado há Xd"), add:

- Score line: `★ {averageScore} · {totalFeedbacks} feedbacks` (0.65rem)
- Star character: literal "★"
- Color logic:
  - score >= 4.0: `var(--sun)` (gold)
  - score >= 3.0: `var(--text-secondary)` (neutral)
  - score < 3.0: `var(--text-muted)` (low)
- If `totalFeedbacks === 0`: show "Sem avaliações" in text-muted instead

### Mock Data

Add to each skill in `data/skills-admin.ts`:

| Skill | averageScore | totalFeedbacks |
|-------|-------------|----------------|
| Texto de Rádio | 4.2 | 38 |
| Copy Social | 4.8 | 127 |
| Roteiro de Vídeo | 4.1 | 24 |
| Plano de Mídia | 3.9 | 56 |
| Report Performance | 4.5 | 42 |
| Persona Sintética | 3.6 | 19 |
| Brief Builder | 4.3 | 31 |
| Análise de Mercado | 3.2 | 15 |
| Análise Competitiva (draft) | 0 | 0 |
| Roteiro de Podcast (draft) | 0 | 0 |

## Feature 4: Sidebar Cleanup

### Remove Dashboard, Add Home

- Remove `{ label: 'Dashboard', icon: LayoutDashboard }` from NAV_ITEMS
- Add `{ label: 'Home', icon: Globe, href: '/' }` as first item
- Remove `LayoutDashboard` from lucide-react import, add `Globe`
- Default `activeItem` changes from `'Dashboard'` to `'Home'`

Final NAV_ITEMS order:
```typescript
const NAV_ITEMS: NavItemDef[] = [
  { label: 'Home', icon: Globe, href: '/' },
  { label: 'Clientes', icon: Users },
  { label: 'Skills', icon: Sparkles, href: '/skills' },
  { label: 'Biblioteca', icon: BookOpen, href: '/biblioteca' },
];
```

## File Structure

### New Files (2)
- `lib/feedback-types.ts` — MessageFeedback, SessionFeedback interfaces
- `components/chat/FeedbackInline.tsx` — thumbs + comment input, appears below ResultActions

### Modified Files (6)
- `components/chat/ResultActions.tsx` — add ThumbsUp/ThumbsDown buttons with toggle logic
- `components/chat/ChatInterface.tsx` — manage feedbacks state, pass to sidebar and ResultActions
- `components/chat/ContextSidebar.tsx` — evolve Validação section into functional panel
- `components/admin/SkillCard.tsx` — add score line
- `components/layout/Sidebar.tsx` — replace Dashboard with Home (Globe icon, href '/')
- `data/skills-admin.ts` — add averageScore + totalFeedbacks to mock data
- `lib/admin-types.ts` — add averageScore + totalFeedbacks to SkillAdmin interface

## Styling

Follow existing design system:
- Thumbs icons: same size as existing ResultActions buttons (12px)
- Feedback comment input: ghost style, subtle, doesn't dominate the chat
- Sidebar validation panel: compact, information-dense but readable
- Rating circles: 12px, sun color when filled, border-subtle when empty
- Progress bar: 4px height, thin and unobtrusive
- All transitions: 150ms ease

## Accessibility
- Thumbs buttons: `aria-pressed` for toggle state, `aria-label="Aprovar"` / `aria-label="Rejeitar"`
- Feedback comment: `aria-label="Comentário de feedback"`
- Rating circles: `role="radiogroup"`, each circle `role="radio"`, `aria-checked`, keyboard arrow keys
- Feedback list items: `role="button"`, keyboard Enter to scroll to message
- Session feedback form: proper labels, keyboard Enter to submit
- Toast: `role="status"`, `aria-live="polite"` (reuse existing Toast component)

## Constraints
- No backend — all React state, resets on refresh
- Feedback per message is ephemeral (session only)
- Session feedback is ephemeral (session only)
- Skill scores in catalog are static mock data, not computed from actual feedbacks
- Scroll-to-message uses DOM refs, not routing
- Reuse existing `components/ui/Toast.tsx`
