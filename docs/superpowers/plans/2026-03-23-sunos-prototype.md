# sunOS Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a navigable 4-level Next.js 14 prototype of sunOS with solar system visualization, mock data, and simulated chat streaming.

**Architecture:** Next.js 14 App Router with dynamic route segments for 4 navigation levels. Solar system rendered with CSS-positioned divs + trigonometry. Design tokens via CSS variables extended through Tailwind. All data mocked in TypeScript files.

**Tech Stack:** Next.js 14, TypeScript (strict), Tailwind CSS, Lucide React, Inter font (Google Fonts)

**Spec:** `docs/superpowers/specs/2026-03-23-sunos-prototype-design.md`

---

## Task 1: Project Scaffold + Design Tokens

**Files:**
- Create: `package.json`
- Create: `next.config.mjs`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `app/globals.css`
- Create: `app/layout.tsx`
- Create: `.gitignore`
- Create: `lib/types.ts`

- [ ] **Step 1: Initialize Next.js project**

```bash
cd /Users/heitormiranda/projects/koro/sunos
npx create-next-app@14 . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```

Accept defaults. This creates package.json, tsconfig, tailwind.config, next.config, app/layout.tsx, app/page.tsx, app/globals.css.

- [ ] **Step 2: Install dependencies**

```bash
npm install lucide-react
```

- [ ] **Step 3: Write design tokens in globals.css**

Replace `app/globals.css` with CSS variables from spec: `--void`, `--deep`, `--nebula`, `--twilight`, `--sun`, skill type colors, text colors, orbit line colors. Add base styles: body background, font-family stack, reduced-motion media query. Import Inter from Google Fonts.

- [ ] **Step 4: Configure Tailwind to extend design tokens**

Update `tailwind.config.ts`: extend colors to reference CSS variables (e.g., `void: 'var(--void)'`), add font family with Inter + Helvetica Neue stack, add spacing scale, add border-radius tokens.

- [ ] **Step 5: Write TypeScript types**

Create `lib/types.ts` with interfaces: `Client`, `Skill`, `Moon`, `BibliotecaItem`, `MockChatResponse`, `SkillType` union type. Exactly as spec defines.

- [ ] **Step 6: Update root layout**

Update `app/layout.tsx`: set `<html lang="pt-BR">` with dark class, add Inter font via `next/font/google`, set metadata title "sunOS", render `{children}` with full-height body.

- [ ] **Step 7: Verify scaffold runs**

```bash
npm run dev
```

Open http://localhost:3000 — should show dark navy background with no errors.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold Next.js 14 project with design tokens"
```

---

## Task 2: Mock Data

**Files:**
- Create: `data/clients.ts`
- Create: `data/biblioteca.ts`
- Create: `data/chat-responses.ts`
- Create: `lib/utils.ts`

- [ ] **Step 1: Create client + skills + moons data**

Create `data/clients.ts` exporting `clients: Client[]` with all 7 clients. Each client has `id`, `name`, `slug`, `color`, and `skills[]`. Each skill has `id`, `name`, `slug`, `type`, and `moons[]`. Each moon has `id`, `name`, `slug`, `description`. Follow spec exactly for which skills each client has. Generate moon data for ALL clients (not just Santander). Use realistic sub-specialty names.

- [ ] **Step 2: Create biblioteca data**

Create `data/biblioteca.ts` exporting `bibliotecaByClient: Record<string, BibliotecaItem[]>`. 4-6 items per client. Categories: `tom_voz`, `restricoes`, `dados`, `historico`. First item per client is `active: true`.

- [ ] **Step 3: Create chat responses**

Create `data/chat-responses.ts` exporting `chatResponsesByMoon: Record<string, MockChatResponse[]>`. 1-2 responses per moon. Include `highlight` block on at least half the responses (formatted output like radio scripts, media plans, etc.). Only need responses for Santander's moons in detail — other clients can share generic responses keyed by skill type.

- [ ] **Step 4: Create utility helpers**

Create `lib/utils.ts` with:
- `getClientBySlug(slug: string): Client | undefined`
- `getSkillBySlug(clientSlug: string, skillSlug: string): Skill | undefined`
- `getMoonBySlug(clientSlug: string, skillSlug: string, moonSlug: string): Moon | undefined`
- `getSkillTypeColor(type: SkillType): string` — returns CSS variable name
- `cn(...classes: string[]): string` — class name merger (Tailwind)

- [ ] **Step 5: Commit**

```bash
git add data/ lib/utils.ts
git commit -m "feat: add mock data for 7 clients with skills, moons, biblioteca"
```

---

## Task 3: Layout Components (Header, Logo, Breadcrumb)

**Files:**
- Create: `components/layout/Logo.tsx`
- Create: `components/layout/Breadcrumb.tsx`
- Create: `components/layout/AppHeader.tsx`
- Create: `components/layout/BackButton.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Create Logo component**

`components/layout/Logo.tsx`: renders `sun` (font-weight 300) + `OS` (font-weight 600) + `.` (color: var(--sun)). Wrapped in Next.js `Link` to `/`. Font size as prop with default `text-lg`.

- [ ] **Step 2: Create Breadcrumb component**

`components/layout/Breadcrumb.tsx`: receives `items: { label: string; href: string }[]`. Renders each with `/` separator. Last item gets `text-primary` color, others get `text-muted` with hover. Each item is a `Link`. Use `usePathname()` to auto-generate from URL if no items passed.

- [ ] **Step 3: Create AppHeader component**

`components/layout/AppHeader.tsx`: flex row with Logo (left), Breadcrumb (center), right section (LevelIndicator badge + avatar circle). Sticky top, backdrop-blur, border-bottom. Receives `breadcrumbs` and `rightLabel` as props.

- [ ] **Step 4: Create BackButton component**

`components/layout/BackButton.tsx`: small button with `ArrowLeft` icon from Lucide + label text. Uses Next.js `Link`. Positioned absolute top-left below header.

- [ ] **Step 5: Add AppHeader to root layout**

Update `app/layout.tsx` to NOT include AppHeader globally — each page will compose its own header with appropriate breadcrumbs. Just keep the providers and body wrapper.

- [ ] **Step 6: Verify components render**

Create a temporary test in `app/page.tsx` that renders AppHeader with sample breadcrumbs. Check in browser.

- [ ] **Step 7: Commit**

```bash
git add components/layout/ app/
git commit -m "feat: add layout components — Logo, Breadcrumb, AppHeader, BackButton"
```

---

## Task 4: Solar System Core Components

**Files:**
- Create: `hooks/useOrbitalLayout.ts`
- Create: `components/solar/OrbitRing.tsx`
- Create: `components/solar/CenterNode.tsx`
- Create: `components/solar/PlanetNode.tsx`
- Create: `components/solar/TinyMoon.tsx`
- Create: `components/solar/SkillGroup.tsx`
- Create: `components/solar/MoonNode.tsx`
- Create: `components/solar/OrbitalSystem.tsx`
- Create: `components/solar/FilterPills.tsx`

- [ ] **Step 1: Create useOrbitalLayout hook**

`hooks/useOrbitalLayout.ts`: receives `items[]` with `orbitIndex` and optional `angle`. Returns `positions: { id, x, y }[]` calculated via trigonometry. Each orbit has a fixed radius (configurable). Distributes items evenly around orbit if no angle specified. Export `calculatePosition(centerX, centerY, radius, angleDeg): { x, y }`.

- [ ] **Step 2: Create OrbitRing component**

`components/solar/OrbitRing.tsx`: absolute-positioned div with `border-radius: 50%`, `border: 1px solid var(--orbit-line)`. Props: `radius: number`, `highlighted?: boolean` (increases opacity on hover). Centered via `top: 50%; left: 50%; transform: translate(-50%, -50%)`.

- [ ] **Step 3: Create CenterNode component**

`components/solar/CenterNode.tsx`: circular div centered in parent. Props: `label: string`, `color: string`, `size: number` (px). Applies glow box-shadow from spec (Active/Center state). Text inside centered, uppercase, tiny font.

- [ ] **Step 4: Create PlanetNode component**

`components/solar/PlanetNode.tsx`: circular div with absolute positioning. Props: `color`, `size`, `label`, `labelPosition` (top/bottom/left/right), `x`, `y`, `onClick`. Hover state: `scale(1.08)` + colored glow. Label is positioned relative to planet, uppercase, tracked. `cursor: pointer`.

- [ ] **Step 5: Create TinyMoon component**

`components/solar/TinyMoon.tsx`: very small circle (8-10px) with reduced opacity. No label. Props: `color`, `size`, `x`, `y` (relative to parent SkillGroup).

- [ ] **Step 6: Create SkillGroup component**

`components/solar/SkillGroup.tsx`: wrapper that renders a PlanetNode + micro orbit ring + TinyMoons around it. Props: `skill: Skill`, `x`, `y`, `color`, `onClick`. Positions tiny moons at equal angles around the skill planet at a small radius (~35-40px).

- [ ] **Step 7: Create MoonNode component**

`components/solar/MoonNode.tsx`: like PlanetNode but for labeled moons in level 3. Slightly smaller (22-28px), with label always visible. Same hover glow behavior. `cursor: pointer`.

- [ ] **Step 8: Create OrbitalSystem component**

`components/solar/OrbitalSystem.tsx`: the container. Props: `center`, `orbits`, `items[]`, `onItemClick`, `renderItem` (render prop for customization). Uses `useOrbitalLayout` to calculate positions. Renders: orbit rings, center node, and maps items to their render function. Container is `position: relative` with configurable `width`/`height`.

- [ ] **Step 9: Create FilterPills component**

`components/solar/FilterPills.tsx`: horizontal bar with pill buttons. Props: `types: SkillType[]`, `activeType: string | null`, `onFilter: (type) => void`. "Todos" pill always first. Active pill gets sun border + background. Positioned absolute bottom-center.

- [ ] **Step 10: Verify solar components render**

Create a test in `app/page.tsx` that renders an OrbitalSystem with 3 orbits, a center node, and 5 test planets. Verify in browser: orbits render as circles, planets positioned on rings, hover shows glow.

- [ ] **Step 11: Commit**

```bash
git add hooks/useOrbitalLayout.ts components/solar/
git commit -m "feat: add solar system components — OrbitalSystem, PlanetNode, OrbitRing, SkillGroup, MoonNode"
```

---

## Task 5: Level 1 — Home Page (Client Solar System)

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Build Home page**

Replace `app/page.tsx`. Import `clients` from data. Render `AppHeader` with breadcrumbs `[{ label: 'Home', href: '/' }]` and rightLabel `"7 biomas"`. Render `OrbitalSystem` with:
- Center: Suno label, sun color, 52px
- 3 orbits
- 7 client planets distributed across orbits (2 on inner, 3 on middle, 2 on outer)
- Each planet sized 28-36px based on number of skills (more skills = bigger)
- `onItemClick` navigates to `/${client.slug}` via `useRouter().push()`

Use `'use client'` directive since it needs interactivity.

- [ ] **Step 2: Verify navigation**

Click a planet — should navigate to `/:clientSlug` (will show 404, that's expected). Verify hover glow, labels, orbit alignment.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add Level 1 Home page with client solar system"
```

---

## Task 6: Level 2 — Client Page (Skills + Tiny Moons)

**Files:**
- Create: `app/[clientSlug]/page.tsx`

- [ ] **Step 1: Build Client page**

Create `app/[clientSlug]/page.tsx`. Use `'use client'`. Extract `clientSlug` from params. Look up client via `getClientBySlug()`. If not found, redirect to `/`.

Render `AppHeader` with breadcrumbs `Home / {client.name}`, rightLabel `"{n} skills"`.

Render `OrbitalSystem` with:
- Center: client name, client color, 60px
- 3 orbits
- Skills as `SkillGroup` components (planet + tiny moons, no moon labels)
- Each skill colored by type (criacao/midia/planejamento)
- `onItemClick` navigates to `/${clientSlug}/${skill.slug}`

Render `FilterPills` at bottom. State: `activeFilter`. When filter is set, only show skills of that type. "Todos" shows all.

- [ ] **Step 2: Verify page**

Navigate from Home to a client. Verify: client is center, skills orbit with tiny moons, filter pills work, click skill navigates to level 3.

- [ ] **Step 3: Commit**

```bash
git add app/[clientSlug]/
git commit -m "feat: add Level 2 Client page with skills and tiny moons"
```

---

## Task 7: Level 3 — Skill Page (Moons with Labels)

**Files:**
- Create: `app/[clientSlug]/[skillSlug]/page.tsx`

- [ ] **Step 1: Build Skill page**

Create `app/[clientSlug]/[skillSlug]/page.tsx`. Use `'use client'`. Extract params. Look up client + skill. If not found, redirect.

Render `AppHeader` with breadcrumbs `Home / {client.name} / {skill.name}`. Right section shows skill type dot + type label.

Render `BackButton` pointing to `/${clientSlug}` with client name as label.

Render `OrbitalSystem` with:
- Center: skill name (2 lines if needed), skill type color, 56px
- 2 orbits
- Moons as `MoonNode` components with labels always visible
- `onItemClick` navigates to `/${clientSlug}/${skillSlug}/${moon.slug}`

Render skill type badge below center: "{type} · {n} areas".

- [ ] **Step 2: Verify page**

Navigate from client to skill. Verify: skill is center with correct color, moons show with labels, back button works, click moon navigates to chat.

- [ ] **Step 3: Commit**

```bash
git add app/[clientSlug]/[skillSlug]/
git commit -m "feat: add Level 3 Skill page with labeled moons"
```

---

## Task 8: Streaming Hook

**Files:**
- Create: `hooks/useStreamingText.ts`

- [ ] **Step 1: Create useStreamingText hook**

`hooks/useStreamingText.ts`:

```typescript
export function useStreamingText() {
  // Returns: { text, isStreaming, startStreaming }
  // startStreaming(fullText, delay?) — splits text into tokens (words),
  // sets isStreaming=true, yields one token every `delay` ms (default 40ms),
  // sets isStreaming=false when complete.
  // Uses requestAnimationFrame + setTimeout for smooth rendering.
  // Cleanup on unmount via useEffect return.
}
```

- [ ] **Step 2: Verify hook works**

Create a temporary test component that calls `startStreaming("Hello world this is a test")` on mount and displays `text`. Verify tokens appear one by one.

- [ ] **Step 3: Commit**

```bash
git add hooks/useStreamingText.ts
git commit -m "feat: add useStreamingText hook for simulated streaming"
```

---

## Task 9: Chat Components

**Files:**
- Create: `components/chat/MessageBubble.tsx`
- Create: `components/chat/StreamingIndicator.tsx`
- Create: `components/chat/ChatInput.tsx`
- Create: `components/chat/ContextSidebar.tsx`
- Create: `components/chat/ChatInterface.tsx`

- [ ] **Step 1: Create MessageBubble**

`components/chat/MessageBubble.tsx`: renders a chat message. Props: `role: 'user' | 'assistant'`, `content: string`, `highlight?: { label, body }`. User messages: right-aligned, nebula background, rounded with flat bottom-right. Assistant: left-aligned, subtle background, flat bottom-left. If highlight present, render a formatted block with sun-colored left border.

- [ ] **Step 2: Create StreamingIndicator**

`components/chat/StreamingIndicator.tsx`: 3 dots with staggered blink animation. Wrapped in an assistant-style bubble. Renders when `isStreaming` is true.

- [ ] **Step 3: Create ChatInput**

`components/chat/ChatInput.tsx`: pill-shaped container with text input + circular send button (sun color, arrow icon). Props: `onSend: (text: string) => void`, `disabled?: boolean`. Placeholder: "Como posso ajudar?". Submit on Enter or click. Clear input after send.

- [ ] **Step 4: Create ContextSidebar**

`components/chat/ContextSidebar.tsx`: 3 sections with headers — Biblioteca (list of items, first active with sun border), Agentes (simple labels), Validação (HumanInTheLoop badge with pulsing green dot). Props: `biblioteca: BibliotecaItem[]`, `agentes: string[]`. Fixed width 280px.

- [ ] **Step 5: Create ChatInterface**

`components/chat/ChatInterface.tsx`: grid layout `1fr 280px`. Left: MessageList + ChatInput. Right: ContextSidebar. Manages messages state array. On user send: adds user message, looks up mock response for current moon, calls `startStreaming()`, adds assistant message with streaming text. Props: `moonSlug: string`, `clientSlug: string`, `biblioteca: BibliotecaItem[]`.

- [ ] **Step 6: Commit**

```bash
git add components/chat/
git commit -m "feat: add chat components — MessageBubble, ChatInput, ContextSidebar, ChatInterface"
```

---

## Task 10: Level 4 — Chat Page

**Files:**
- Create: `app/[clientSlug]/[skillSlug]/[moonSlug]/page.tsx`

- [ ] **Step 1: Build Chat page**

Create `app/[clientSlug]/[skillSlug]/[moonSlug]/page.tsx`. Use `'use client'`. Extract all 3 params. Look up client, skill, moon. If not found, redirect.

Render `AppHeader` with full breadcrumb: `Home / {client} / {skill} / {moon}`. Right section: skill type dot + type label.

Render `ChatInterface` with `moonSlug`, `clientSlug`, and biblioteca data for this client.

Full height layout: header + chat fills viewport.

- [ ] **Step 2: Verify full flow**

Navigate Home → Client → Skill → Moon → Chat. Type a message, verify:
- Mock response streams token by token
- Highlight blocks render correctly
- Sidebar shows biblioteca + agentes + HITL
- Breadcrumb navigates back to any level

- [ ] **Step 3: Commit**

```bash
git add app/[clientSlug]/[skillSlug]/[moonSlug]/
git commit -m "feat: add Level 4 Chat page with streaming simulation"
```

---

## Task 11: Polish + Animations

**Files:**
- Modify: `app/globals.css`
- Modify: `components/solar/PlanetNode.tsx`
- Modify: `components/solar/OrbitalSystem.tsx`

- [ ] **Step 1: Add orbit-appear animation**

In `globals.css`, add `@keyframes orbit-appear` that scales from 0 to 1 with fade-in. In `OrbitalSystem.tsx`, apply staggered animation-delay (50ms per item) to each planet on mount.

- [ ] **Step 2: Add reduced-motion support**

In `globals.css`, add `@media (prefers-reduced-motion: reduce)` that disables all animations and transitions. Set `animation: none !important; transition: none !important;` on all elements.

- [ ] **Step 3: Add orbit-pulse animation**

Subtle shimmer on orbit rings — very low opacity breathing animation (4s cycle). Only on the ring closest to a hovered planet.

- [ ] **Step 4: Verify animations**

Check in browser: planets appear with stagger on page load, hover glow is smooth, orbit rings pulse subtly. Toggle `prefers-reduced-motion` in dev tools to verify it disables everything.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css components/solar/
git commit -m "feat: add animations — orbit-appear, orbit-pulse, reduced-motion support"
```

---

## Task 12: Final Integration + Cleanup

**Files:**
- Modify: various (cleanup)

- [ ] **Step 1: Full navigation test**

Walk through the complete flow for 3 different clients:
1. Home → Santander → Texto de Rádio → Spot 30" → Chat
2. Home → Vivo → Plano de Mídia → Digital → Chat
3. Home → BMG → Report Performance → Mensal → Chat

Verify all pages render, navigation works forward and backward via breadcrumbs.

- [ ] **Step 2: Check filter pills**

On Level 2, test each filter pill. Verify planets hide/show by type with smooth transitions.

- [ ] **Step 3: Check responsive behavior**

Resize browser to 768px and 1024px. Solar system should remain centered and readable. Chat sidebar should stack below on small screens.

- [ ] **Step 4: Cleanup**

Remove any temporary test code. Ensure no console errors. Verify all TypeScript strict mode passes with `npx tsc --noEmit`.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete sunOS prototype — 4-level navigation with solar system UI"
```
