# sunOS Prototype — Design Spec

## Overview

Protótipo navegável do sunOS, plataforma interna de IA da Suno United Creators. Organiza skills de IA por cliente usando metáfora de sistema solar. Reescrita completa do koro-studio (React+Vite) em Next.js 14 + TypeScript.

## Navigation Model — 4 Levels

```
Level 1: /                          → Home (sistema solar de clientes)
Level 2: /:clientSlug               → Cliente (skills com luas sem label)
Level 3: /:clientSlug/:skillSlug    → Skill expandido (luas com labels)
Level 4: /:clientSlug/:skillSlug/:moonSlug → Chat contextualizado
```

Transition between levels: morph/expand animation. Clicked element moves to center and grows, new elements animate outward from orbits. 500ms cubic-bezier(0.4, 0, 0.2, 1).

## Design System

### Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--void` | `#080D14` | Background principal (deep navy) |
| `--deep` | `#0F1923` | Surface level 1 (cards, panels) |
| `--nebula` | `#1B2B3A` | Surface level 2 (hover, inputs) |
| `--twilight` | `#263A4D` | Borders, separators, orbit lines |
| `--sun` | `#FFC801` | Accent (centro solar, CTAs, active) |
| `--criacao` | `#FFC801` | Skill type: criação |
| `--midia` | `#3B82F6` | Skill type: mídia |
| `--planejamento` | `#10B981` | Skill type: planejamento |
| `--text-primary` | `#F1F5F9` | Headings, primary text |
| `--text-secondary` | `#94A3B8` | Body text, descriptions |
| `--text-muted` | `#475569` | Labels, hints, inactive |
| `--orbit-line` | `rgba(255,255,255,0.07)` | Orbit rings at rest |
| `--orbit-hover` | `rgba(255,255,255,0.12)` | Orbit rings on hover |

Client colors (assigned per client):

| Client | Color | Hex |
|--------|-------|-----|
| Santander | Red | `#EF4444` |
| Vivo | Purple | `#8B5CF6` |
| Americanas | Orange | `#F97316` |
| MRV | Cyan | `#06B6D4` |
| Sicredi | Green | `#22C55E` |
| BMG | Pink | `#F472B6` |
| Stone | Lime | `#A3E635` |

### Typography

Font stack: `'Helvetica Neue', 'Inter', -apple-system, sans-serif`. Inter loaded from Google Fonts as web fallback.

| Element | Size | Weight | Extras |
|---------|------|--------|--------|
| Logo display | — | sun(300) OS(600) | + dot amarelo |
| H1 (page title) | 32px | 300 | letter-spacing: -0.01em |
| H2 (section) | 20px | 500 | — |
| Label (orbit/planet) | 11px | 500 | uppercase, letter-spacing: 0.12em |
| Body | 14px | 400 | line-height: 1.6 |
| Chat message | 15px | 400 | line-height: 1.65 |
| Moon label | 10.5px | 400 | letter-spacing: 0.04em |

### Spacing Scale (4px base)

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Inner padding |
| `sm` | 8px | Element gaps |
| `md` | 16px | Card padding |
| `lg` | 24px | Section gaps |
| `xl` | 32px | Page margins |
| `2xl` | 48px | Hero spacing |
| `3xl` | 64px | Section breaks |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `full` | 50% | Planets, avatars, moons |
| `card` | 12px | Cards, panels |
| `input` | 8px | Inputs, buttons |
| `pill` | 9999px | Filter pills, badges, chat input |

### Glow System

Glow replaces traditional borders/shadows as primary visual feedback.

| State | Effect |
|-------|--------|
| Rest | Solid color, no shadow |
| Hover | `box-shadow: 0 0 20px color/0.4, 0 0 60px color/0.15` + `scale(1.08)` |
| Active/Center | `box-shadow: 0 0 30px color/0.5, 0 0 80px color/0.2, 0 0 120px color/0.08` |
| Tiny moon (rest) | Reduced opacity (0.4-0.5), no shadow |

### Animation Tokens

| Token | Duration | Easing | Usage |
|-------|----------|--------|-------|
| `hover` | 200ms | ease-out | Planet scale + glow |
| `morph` | 500ms | cubic-bezier(0.4, 0, 0.2, 1) | Level transitions |
| `orbit-appear` | 300ms | ease-out (staggered 50ms) | Planets entering orbits |
| `label-fade` | 150ms | ease | Labels appearing |
| `orbit-pulse` | 4s | ease-in-out infinite | Subtle orbit shimmer (very subtle) |

All animations respect `prefers-reduced-motion: reduce`.

## Architecture — CSS + HTML (no Canvas)

System solar rendered with HTML/CSS: positioned divs with `transform`, orbits via `border-radius: 50%` + `border`, animations via CSS transitions + requestAnimationFrame for morph. No Canvas/WebGL/SVG needed — max 30 elements per level.

## Component Tree

```
AppLayout
├── AppHeader
│   ├── Logo ("sunOS.")
│   ├── Breadcrumb (clickable levels)
│   ├── LevelIndicator (count badge)
│   └── UserAvatar
├── Pages
│   ├── HomePage (Level 1)
│   │   └── OrbitalSystem
│   │       ├── CenterNode (Suno)
│   │       ├── OrbitRing × 3
│   │       └── PlanetNode × 7 (clients)
│   ├── ClientPage (Level 2)
│   │   └── OrbitalSystem
│   │       ├── CenterNode (client)
│   │       ├── OrbitRing × 3
│   │       ├── SkillGroup × 8
│   │       │   ├── PlanetNode (skill)
│   │       │   ├── MoonOrbitRing (micro)
│   │       │   └── TinyMoon × 2-3 (no labels)
│   │       └── FilterPills
│   ├── SkillPage (Level 3) — NEW
│   │   └── OrbitalSystem
│   │       ├── CenterNode (skill)
│   │       ├── OrbitRing × 2
│   │       ├── MoonNode × 2-4 (with labels)
│   │       ├── SkillTypeBadge
│   │       └── BackButton
│   └── ChatPage (Level 4)
│       ├── ChatMain
│       │   ├── MessageList
│       │   │   ├── MessageBubble (user/assistant)
│       │   │   └── StreamingIndicator (3 dots)
│       │   └── ChatInput (pill shape + send button)
│       └── ContextSidebar
│           ├── BibliotecaSection
│           ├── AgentesSection
│           └── HumanInTheLoopBadge
```

## Reusable Components

### OrbitalSystem

Core visualization. Receives `centerNode`, `orbitCount`, and `items[]` as props. Calculates positions via trigonometry. Used in levels 1, 2, and 3 with different data.

Props:
- `center: { label, color, size }` — what renders at center
- `orbits: number` — how many rings (2-3)
- `items: { id, label, color, size, orbitIndex, angle, children? }[]` — planets/moons
- `onItemClick: (id) => void`
- `showChildLabels: boolean` — false in level 2, true in level 3

### PlanetNode

Circular element with color, hover glow, optional label. Sizes: 24-36px for planets, 8-12px for tiny moons, 22-28px for labeled moons.

### OrbitRing

Circle border with configurable radius. Subtle opacity, increases on corresponding planet hover.

### CenterNode

Larger circle at center with glow. Renders label text inside.

### FilterPills

Horizontal pill bar for skill type filtering. Types: Todos, Criação, Mídia, Planejamento. Active state with sun border.

### ChatInterface

Split layout: chat main (messages + input) | context sidebar. Chat input is pill-shaped with "Como posso ajudar?" placeholder and circular send button.

### StreamingSimulator

Hook/utility that takes a full response string and yields it token-by-token with configurable delay (30-50ms per token). Creates realistic typing effect for mocked responses.

## Mock Data Structure

```typescript
interface Client {
  id: string;
  name: string;
  slug: string;
  color: string;
  skills: Skill[];
}

interface Skill {
  id: string;
  name: string;
  slug: string;
  type: 'criacao' | 'midia' | 'planejamento';
  moons: Moon[];
}

interface Moon {
  id: string;
  name: string;
  slug: string;
  description: string;
}

interface BibliotecaItem {
  id: string;
  label: string;
  category: string;
  active: boolean;
}

interface MockChatResponse {
  content: string;
  highlight?: { label: string; body: string }; // formatted output block
}
```

### Mock Data — 7 Clients × Skills × Moons

**Santander** (6 skills, ~18 moons):
- Texto de Rádio (criação): Spot 30", Jingle, Institucional
- Copy Social (criação): Feed/Carrossel, Stories/Reels, X/Twitter
- Roteiro de Vídeo (criação): TVC 30", Digital Pre-roll
- Plano de Mídia (mídia): Digital, OOH, TV/Rádio
- Report Performance (mídia): Semanal, Mensal
- Persona Sintética (planejamento): Jovem 18-25, Premium 35+, MEI/PJ

**Vivo** (5 skills): Texto de Rádio, Copy Social, Plano de Mídia, Brief Builder, Análise de Mercado

**Americanas** (4 skills): Copy Social, Roteiro de Vídeo, Report Performance, Persona Sintética

**MRV** (3 skills): Copy Social, Plano de Mídia, Brief Builder

**Sicredi** (5 skills): Texto de Rádio, Copy Social, Plano de Mídia, Persona Sintética, Análise de Mercado

**BMG** (4 skills): Copy Social, Report Performance, Brief Builder, Análise de Mercado

**Stone** (4 skills): Copy Social, Roteiro de Vídeo, Plano de Mídia, Persona Sintética

Each client gets Biblioteca items (4-6 entries) and 1-2 pre-configured mock chat responses per moon (enough to demo the streaming effect).

Note: grid fallback for 12+ elements is out of scope for this prototype (max client has 6 skills). Back navigation on Level 3 uses both breadcrumb (clickable) and explicit BackButton — both are intentional.

## File Structure

```
sunos/
├── app/
│   ├── layout.tsx                    # AppLayout + providers
│   ├── page.tsx                      # Level 1: Home
│   ├── [clientSlug]/
│   │   ├── page.tsx                  # Level 2: Client
│   │   └── [skillSlug]/
│   │       ├── page.tsx              # Level 3: Skill expanded
│   │       └── [moonSlug]/
│   │           └── page.tsx          # Level 4: Chat
│   └── globals.css                   # CSS variables + base styles
├── components/
│   ├── solar/
│   │   ├── OrbitalSystem.tsx
│   │   ├── CenterNode.tsx
│   │   ├── PlanetNode.tsx
│   │   ├── OrbitRing.tsx
│   │   ├── SkillGroup.tsx           # Planet + tiny moons
│   │   ├── MoonNode.tsx
│   │   └── FilterPills.tsx
│   ├── chat/
│   │   ├── ChatInterface.tsx
│   │   ├── MessageBubble.tsx
│   │   ├── ChatInput.tsx
│   │   ├── StreamingIndicator.tsx
│   │   └── ContextSidebar.tsx
│   ├── layout/
│   │   ├── AppHeader.tsx
│   │   ├── Logo.tsx
│   │   ├── Breadcrumb.tsx
│   │   └── BackButton.tsx
│   └── ui/
│       └── FilterPill.tsx
├── data/
│   ├── clients.ts                   # Mock client data
│   ├── skills.ts                    # Skills + moons per client
│   ├── biblioteca.ts                # Context items per client
│   └── chat-responses.ts            # Mock responses per moon
├── hooks/
│   ├── useStreamingText.ts          # Token-by-token streaming sim
│   └── useOrbitalLayout.ts          # Trigonometry calculations
├── lib/
│   ├── types.ts                     # TypeScript interfaces
│   └── utils.ts                     # Slug helpers, color utils
├── next.config.mjs
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .gitignore
```

## Tech Stack

| Layer | Choice | Reason |
|-------|--------|--------|
| Framework | Next.js 14 (App Router) | Production routing, SSR-ready |
| Language | TypeScript (strict) | Type safety for data model |
| Styling | Tailwind CSS + CSS variables | Design tokens + utility classes |
| Font | Inter (Google Fonts) | Helvetica Neue fallback for web |
| Icons | Lucide React | Consistent, lightweight |
| Animation | CSS transitions + requestAnimationFrame | No heavy libs needed |
| State | React state + URL params | No external state lib needed for prototype |

## Constraints

1. Prompts/skill configs never appear in frontend
2. Biblioteca loads automatically on biome entry (simulated)
3. Solar system as primary visualization (grid fallback for 12+ elements)
4. Chat placeholder always "Como posso ajudar?"
5. No gradients as primary element (Suno is flat/typographic)
6. No generic UI kit icons (language is dots + typography)
7. `prefers-reduced-motion` respected on all animations
8. All clickable elements have `cursor: pointer`
9. Minimum 4.5:1 contrast ratio for text
10. Touch targets minimum 44×44px for planets/moons
