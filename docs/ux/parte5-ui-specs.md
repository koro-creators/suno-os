---
documento: UX Parte 5 — UI Specs (Microinterações, Animações, Responsividade, A11y fina)
projeto: sunOS
cliente: Suno United Creators (uso 100% interno)
bu: Tecnologia e Dados para Marketing
versao: 1.0
data_criacao: 2026-04-28
ultima_atualizacao: 2026-04-28
autor: Heitor Miranda + Claude (assistido)
status: Rascunho
escopo: Cobertura horizontal — não tela a tela
fonte_ux:
  - docs/ux/parte4-design-system.md (tokens, componentes, anti-patterns)
  - docs/ux/parte3-screen-specs.md (telas detalhadas T-XX)
  - docs/ux/parte1-inventario-telas.md (T-01 a T-28)
  - docs/ux/parte2-arquitetura-informacao.md (L0-L4)
fonte_brd:
  - docs/brd/parte4-regras.md (RN-014, RN-015, RN-016, RN-017)
  - docs/brd/parte2-glossario.md (vocabulário e anti-patterns §9)
fonte_codigo:
  - app/globals.css (animações existentes: pulse, orbit-appear, page-fade-in, float, etc.)
  - components/chat/StreamingIndicator.tsx (referência de pulse)
  - components/chat/FeedbackInline.tsx (referência de transition)
aprovacoes:
  - area: Tecnologia e Dados para Marketing
    aprovador: Heitor Miranda
    data: 2026-04-28
    status: Pendente
  - area: Patrocinador Sócio Criação
    aprovador: Bruno Prosperi
    data:
    status: Pendente
---

# UX Parte 5 — UI Specs sunOS v1.0

**Filosofia visual:** *"Microinterações como evidência de cuidado. Animações como ferramenta cognitiva, nunca decoração. Acessibilidade como direito, não opção."*

**Vocabulário (RN-016):** Devorar · Provocar · Faísca · Brasa · Sun · Planeta · Órbita · Moon · Skill · Biblioteca · Workflow · Bioma Zero/Job/Agentic · Caixa-preta · Creator · Koro Creators (sempre com K).

---

## 1. Escopo e Referências

### 1.1 Cobertura

Este documento especifica **microinterações, animações, responsividade, loading states, toasts, transições de tema e acessibilidade fina** do sunOS. É cobertura **horizontal** — atravessa todas as telas, complementando os layouts e estados de Parte 3 (Screen Specs).

### 1.2 Fontes canônicas

- **Tokens**: `app/globals.css` (`--void`, `--sun`, etc. em `:root`/`[data-theme="dark"]` e `[data-theme="light"]`)
- **Animações existentes**: `globals.css:125-219` (`pulse`, `orbit-appear`, `page-fade-in`, `float`, `orbit-pulse`, `pulse-glow`, `blink`, `spin`, `slow-rotate`, `connector-pulse`)
- **`prefers-reduced-motion`**: já implementado em `globals.css:231-258` — toda animação cai para 0.01ms, `orbit-appear` desliga, `pulse` para
- **Padrões textuais**: Design System Parte 4 §3 (tokens) e §6 (a11y)
- **Padrões de fluxo**: Screen Specs Parte 3 §13

### 1.3 Objetivo

Garantir que toda implementação no sunOS:
- (a) **Respeita prefers-reduced-motion** sem exceção;
- (b) Passa **WCAG 2.1 AA** explícito em contraste, foco, tamanho de target e ARIA;
- (c) Reforça a metáfora **Sistema Solar** com microinterações (orbit-appear, glow, dot-pulse) — sem rotação contínua decorativa;
- (d) Marca outputs de IA (RN-014) com animação de **Faísca → Brasa → Validado**;
- (e) Cria fricção intencional na **Forced Reflection** (RN-015) — animação que pausa, não fluida.

---

## 2. Fundamentos de Layout e Tipografia

### 2.1 Grid System

| Propriedade | Valor |
|-------------|-------|
| Colunas (Admin areas) | 12 com gutter `--space-md` (16px) |
| Gutter mobile | 12px |
| Max-width default | 1440px (`--page-max-wide` — sugerido) |
| Max-width admin pages | 900px (`--page-max-width`) |
| Max-width Mensuração | 1200px (mais largo para gráficos) |
| Full-bleed | Permitido apenas para OrbitalSystem (T-02/T-03/T-04) e charts em T-24/T-26 |

### 2.2 Breakpoints

| Nome | Min-width | Tipico | Comportamento principal |
|------|-----------|--------|--------------------------|
| `mobile` | 0 | < 768px | Sidebar vira drawer · ContextSidebar do chat vira drawer · cards 1col |
| `tablet` | 768px | 768-1024px | Sidebar colapsada (40px) · cards 2col · ContextSidebar 280px |
| `desktop` | 1024px | > 1024px | Sidebar expandida opcional · cards 3col · ContextSidebar 320px |
| `wide` | 1440px | > 1440px | Aumenta padding lateral · charts ganham altura · ContextSidebar 360px |

> **Implementação:** Tailwind defaults (`md:`, `lg:`, `xl:`) ou inline styles com media queries — convenção do projeto privilegia inline styles + `var(--token)` em componentes visuais (CLAUDE.md).

### 2.3 Densidade

| Modo | Padding card | Gap entre cards | Quando usar |
|------|--------------|------------------|-------------|
| Comfortable (default) | 16px | 16px | Catálogos Admin · Sun · Chat |
| Compact | 8-12px | 12px | Tabelas densas (T-10 SkillsTable, T-13 BibliotecaTable, T-23 WorkflowRunTimeline) |
| Spacious | 24-32px | 24px | Dashboards (T-24) · onboarding hero (T-27) |

### 2.4 Tipografia (referência rápida — detalhe em DS §3.3)

| Elemento | Size | Weight | Line-height | Tracking | Token cor |
|----------|------|--------|-------------|----------|-----------|
| H1 hero | 2.5rem (40px) | 300 | 1.2 | -0.02em | `--text-primary` |
| H1 page | 2rem (32px) | 300 | 1.2 | -0.02em | `--text-primary` |
| H2 seção | 1rem (16px) | 600 | 1.3 | 0.08em UPPER | `--text-muted` |
| H3 card title | 0.95rem (15.2px) | 500 | 1.3 | 0 | `--text-primary` |
| Body | 0.875rem (14px) | 400 | 1.5 | 0 | `--text-secondary` |
| Body small | 0.8rem (12.8px) | 400 | 1.5 | 0 | `--text-secondary` |
| Label | 0.75rem (12px) | 500 | 1.4 | 0 | `--text-secondary` |
| Metadata | 0.7rem (11.2px) | 400 | 1.4 | 0 | `--text-muted` |
| Caption | 0.6rem (9.6px) | 500 | 1.3 | 0.08em | `--text-muted` |
| Micro | 0.55rem (8.8px) | 500 | 1.3 | 0.14em UPPER | `--text-muted` |

**Anti-pattern ativo:** body text < 0.875rem (14px) em região de leitura sustentada — bloquear merge.

### 2.5 Cores e Sombras (resumo — full em DS §3.1 e §3.6)

- **Accent único**: `--sun` (#FFC801) — único amarelo com significado de marca/ação primária
- **Sombras**: minimalistas. Apenas: focus ring (`0 0 0 2px rgba(255,200,1,0.15)`), focus ring forte (`...0.20`), drawer overlay, modal overlay, glow Sun (`0 0 6px rgba(255,200,1,0.6)` no breadcrumb dot atual)
- **Bordas como elevação**: hover de card = mudar `border-color` para `--twilight`, NUNCA box-shadow decorativa
- **Focus**: outline `--sun` em todo interativo (ver §6.3)

### 2.6 Motion (transições padrão)

| Tipo | Duração | Easing | Uso |
|------|---------|--------|-----|
| Cor / Border | 150ms | `ease` | Hover de botão, link, pill |
| Layout / Width | 200ms | `ease` | Sidebar expand/collapse, drawer slide-in |
| Transform | 200ms | `ease` | Theme toggle (rotate 180deg), translate |
| Page enter | 300ms | `ease-out` | Page transitions (`.page-enter`) |
| Pulse / Breath | 1.5s infinite | `ease-in-out` | Skeleton loader |
| Orbit appear | 400ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` (overshoot) | Aparição de Planeta/Faísca |
| Modal scale-in | 200ms | `ease-out` | Modais (T-06, T-09) |
| Drawer slide-in | 200ms | `ease-out` | Drawers right (T-15, SkillDrawer) |

**Evitar:** Animações contínuas em dashboards · rotações infinitas em ícones decorativos · efeitos de "pulse" decorativo fora de loading.

---

## 3. Shell e Navegação

### 3.1 AppHeader (48px sticky, glassmorphism)

| Propriedade | Valor |
|-------------|-------|
| Altura | `--header-height` 48px |
| Posição | `position: sticky; top: 0; z-index: 50` |
| Background | `--header-bg` (rgba(8,13,20,0.7) dark / rgba(245,242,235,0.85) light) com `backdrop-filter: blur(12px)` |
| Border-bottom | `1px solid var(--border-subtle)` |

**Microinterações:**
- Theme toggle: rotate 180deg em 200ms ao trocar tema (ícone Sun ↔ Moon); `aria-label` muda dinamicamente
- BackButton: hover muda ícone de `--text-muted` para `--text-secondary` (150ms)
- Avatar/User Menu: dropdown com fade + slide-down 150ms
- Logo Sun: hover mostra glow sutil `0 0 12px rgba(255,200,1,0.3)` (150ms)

### 3.2 Sidebar (40 ↔ 260px)

| Propriedade | Expandida | Colapsada |
|-------------|-----------|-----------|
| Largura | `--sidebar-expanded` 260px | `--sidebar-collapsed` 40px |
| Toggle | ChevronLeft 14px | Hamburger 14px |
| Persistência | `localStorage` ('sidebar-state': 'open' \| 'closed') |
| Animação width | `transition: width 200ms ease` |

**Estados dos itens:**

| Estado | Visual |
|--------|--------|
| Default | Ícone + texto (se expandida) em `--text-muted` |
| Hover | bg `--surface-hover` · ícone em `--text-secondary` (150ms) |
| Active | bg `--nebula` · barra lateral 2px `--sun` (esquerda) · ícone em `--sun` |
| Focus | Focus ring Sun |

**Filtragem RBAC (RN-009 + RN-011):** items `adminOnly` filtrados antes de montar — não desabilitar, não renderizar. Operacional **nunca vê** "Biblioteca" (RN-011).

### 3.3 Breadcrumb

- Obrigatório em L1+ (todas as telas exceto T-02 Sun e T-01 Login e T-27 Onboarding first-run)
- Formato: `Home > [Cliente] > [Skill]` separador `/` ou `>`
- Item atual com **dot Sun glowing**: `width: 6px; height: 6px; border-radius: 50%; background: var(--sun); box-shadow: 0 0 6px rgba(255,200,1,0.6);`
- Click em níveis anteriores navega de volta
- `<nav aria-label="Navegação">` + `aria-current="page"` no último item

### 3.4 Command Palette (⌘K — futuro, P2/P3)

Conforme Parte 2 §8. Quando construído:

| Propriedade | Valor |
|-------------|-------|
| Atalho | `⌘K` (Mac) / `Ctrl+K` (Win/Linux) |
| Largura | 600px (desktop) / 100% - 32px (mobile) |
| Posição | Centro superior (top + 20%) |
| Animação abertura | scale-in 200ms ease-out + backdrop fade-in 150ms |
| `aria-label` | "Busca global" |
| Aplica RBAC + Caixa-preta (RN-011) na filtragem de resultados |

### 3.5 Tabs/Segmented Controls

- Padrão único em DS §4.8: border-bottom 1px subtle, tab ativa com border-bottom 2px `--sun`
- Transição de troca de tab: cor `150ms ease` (texto muted → primary) + indicator slide opcional
- Keyboard navigation: Arrow Left/Right (recomendado, futuro)
- `role="tablist"` no container; `role="tab"` + `aria-selected` em cada tab; `role="tabpanel"` no conteúdo

---

## 4. Microinterações por Módulo

### 4.1 Sistema Solar (T-02, T-03, T-04)

#### 4.1.1 PlanetNode hover

| Propriedade | Valor |
|-------------|-------|
| Trigger | `:hover` ou `:focus-visible` |
| Glow | `box-shadow: 0 0 20px ${planetColor}66` (40% opacity) |
| Escala | `transform: scale(1.08)` (200ms ease) |
| QuickStats overlay | Fade-in 150ms + slide-down 4px |
| Cursor | `pointer` |
| `aria-describedby` | id do tooltip QuickStats |

> **Anti-pattern proibido:** `planet-float` contínuo. Foi removido (`globals.css:212-215` — `.planet-float { /* no continuous animation */ }`). Hover glow é suficiente.

#### 4.1.2 Transição entre níveis (L0 → L1)

Quando usuário clica num Planeta em T-02:

1. **fade-out 150ms** dos outros Planetas (decay de oposição)
2. **scale-up + translate-to-center 250ms ease-out** do Planeta clicado (vira CenterNode local de T-03)
3. **Page transition** `.page-enter` 300ms ease-out
4. **orbit-appear 400ms** sequencial (delay 50ms por Skill) das Skills em torno do Planeta

**Total**: ~1s de transição encadeada. Em `prefers-reduced-motion`: cai para fade direto 100ms total.

#### 4.1.3 OrbitRing (anel de órbita)

| Propriedade | Valor |
|-------------|-------|
| Cor default | `--orbit-line` (12% opacity Sun) |
| Cor hover | `--orbit-hover` (22% opacity Sun) — quando hover sobre Skill na órbita |
| Stroke | 1px |
| **Animação contínua** | **NÃO** (rotação infinita removida — anti-pattern do MASTER) |
| `orbit-ring-pulse` | Permitida apenas no first-load (4s ease-in-out, 3 ciclos máximo) — depois congela |
| `aria-hidden` | `"true"` (decorativo) |

#### 4.1.4 FilterPills (filter de tipo de Skill)

| Propriedade | Valor |
|-------------|-------|
| Click | Toggle ativa; transição cor 150ms ease |
| Estado ativa | border colorida + bg `${color}18` (12% opacity hex) + texto colorido |
| Comportamento visual | Planetas que NÃO oferecem o tipo filtrado: `opacity: 0.3` (200ms) |
| `aria-pressed` | `true` na ativa |

### 4.2 Shoot for the Moon (T-06, T-07, T-08) — "Devorando"

#### 4.2.1 Animação "Devorando" (T-06 → T-07 transição)

Esta é a **microinteração de assinatura** do Shoot for the Moon — devorar o briefing visualmente:

```
Frame 0:    [Briefing textarea preenchida] (T-06)
            ↓ click "Provocar Faíscas"
Frame 1:    Texto do briefing começa a fade-out (200ms)
Frame 2:    Pequenos pontos de "Faísca" (3-5 dots Sun) emergem do texto e voam para borda direita
Frame 3:    Modal T-06 fade-out + Painel T-07 slide-in da direita (200ms)
Frame 4:    No painel: indicador "Devorando briefing..." com agente brasileiro ativo (Antropófaga / Carnavalesco / Anciã)
Frame 5:    Após ~3-8s: primeira FaiscaCard aparece com orbit-appear 400ms (overshoot bounce)
```

**Implementação**:
- Dots de Faísca: `<span>` com `position: absolute`, `width: 4px`, `height: 4px`, `background: var(--sun)`, `border-radius: 50%`, `box-shadow: 0 0 6px rgba(255,200,1,0.8)` — animação CSS `transform: translate(...)` + opacity em 600ms ease-in-out
- Devorar fade-out: `opacity: 1 → 0` em 200ms
- "Pensando" indicator: dot pulse triplo (reuso do `StreamingIndicator`) + texto "Devorando..." em `--text-muted`

**Em prefers-reduced-motion**: pula direto para "Devorando..." dot pulse + FaiscaCards aparecem instant (sem orbit-appear).

#### 4.2.2 Apresentação dos FaiscaCards (T-07)

Cada card aparece com **`orbit-appear`** (já existe em `globals.css:145`):

```css
@keyframes orbit-appear {
  0%   { opacity: 0; transform: scale(0); }
  60%  { opacity: 1; transform: scale(1.06); }  /* overshoot */
  100% { opacity: 1; transform: scale(1); }
}
.orbit-appear { animation: orbit-appear 400ms cubic-bezier(0.34, 1.56, 0.64, 1) both; }
```

**Stagger**: cada card subsequente recebe `animation-delay` de 100ms (card N → delay = N × 100ms, max 600ms).

**Persona ativa muda**: ao trocar agente (Antropófaga → Carnavalesco), badge faz cross-fade 200ms + ícone gira 180deg.

#### 4.2.3 Star em FaiscaCard

| Evento | Animação |
|--------|----------|
| Click ⭐ | Scale `1 → 1.3 → 1` em 250ms cubic-bezier(0.68, -0.55, 0.265, 1.55) |
| Cor | Outline → preenchido `--sun` em 150ms |
| Counter sessão | Incrementa com pequeno bounce (scale 1 → 1.15 → 1 em 200ms) |
| Trigger N stars (RN-015) | Após N=5 (sênior) ou N=3 (junior): MessageList desfoca via `filter: blur(2px)` em 200ms; abre T-09 |

#### 4.2.4 Refinar / Descartar

| Ação | Animação |
|------|----------|
| Refinar (↻) | Card pisca borda Sun · texto muda para "Refinando..." · spinner inline |
| Descartar (✕) | Slide-up + fade-out 200ms · log para Eval |

#### 4.2.5 Time-Boxing (T-08) — transição entre fases

| Fase | Visual de transição |
|------|---------------------|
| IA → Humano | Banner "Sua vez agora" fade-in 200ms · timer reseta · cor muda de `--sun` para `--planejamento` (verde) com transição 300ms |
| Humano → IA | Banner "IA assumindo" fade-in 200ms · timer reseta · cor muda para `--sun` |
| Últimos 10s | Timer ganha `pulse-glow` (reuso do `globals.css:140`) com cor da fase atual |
| Pausa | Timer congela com `--text-muted` · banner "Time-Boxing pausado" |

### 4.3 Chat (T-05) — Streaming, MessageBubble, Feedback HITL

#### 4.3.1 Streaming text (token-by-token)

Conforme `chat/StreamingIndicator.tsx:35-47`:

```css
animation: pulse 1.5s ease-in-out infinite;
animationDelay: 0s, 0.2s, 0.4s; /* 3 dots em sequência */
```

**Token streaming**: texto aparece progressivamente conforme SSE chunks (FR-117). Sem animação por token (evita flicker) — apenas atualização de string. Cursor pulsante opcional ao final do texto durante stream:

```css
.streaming-cursor {
  display: inline-block;
  width: 2px;
  height: 1em;
  background: var(--sun);
  animation: blink 1s steps(2) infinite;
  margin-left: 2px;
}
```

(reuso de `@keyframes blink` do `globals.css:125`).

#### 4.3.2 Typing indicator (3 dots)

Componente `StreamingIndicator` já implementado:
- 3 dots 6px em `--text-muted`
- Cada um com `pulse 1.5s ease-in-out infinite` + `animationDelay` 0s/0.2s/0.4s
- Visual: `● ○ ○` → `○ ● ○` → `○ ○ ●` (perceptual)

`aria-live="polite"`, `aria-busy="true"` — screen reader anuncia atividade.

#### 4.3.3 MessageBubble entrada

| Tipo | Animação |
|------|----------|
| User (após Send) | `transform: translateY(8px) → 0` + `opacity: 0 → 1` em 200ms ease-out |
| Assistant | Mesma animação; bubble cresce conforme tokens chegam (auto-resize do container) |
| Avatar Sun (24x24, "S") | Fade-in 150ms; sem animação contínua |

#### 4.3.4 ResultActions (Copy, Variar, Salvar, Thumbs)

| Ação | Microinteração |
|------|----------------|
| **Copy** | Click → ícone troca para `Check` 14px verde (`--planejamento`) por 1.5s · Toast 2s "Copiado para área de transferência" |
| **Variar** | Click → bubble atual fade para `opacity: 0.4` · `VariationsCarousel` aparece com 3 cards (orbit-appear) abaixo · usuário escolhe → escolhida fade-in para `opacity: 1`, demais fade-out 200ms |
| **Salvar** | Click → ícone Bookmark fica preenchido + cor `--sun` · Toast "Salvo" |
| **Thumbs up/down** | Scale 1 → 1.15 → 1 em 200ms · cor active 150ms · `aria-pressed` toggle |

#### 4.3.5 FeedbackInline

Conforme `chat/FeedbackInline.tsx:37`:

```css
transition: max-height 150ms ease;
```

- Abre: `max-height: 0 → 120px` em 150ms
- Fecha: inverso
- `aria-expanded` toggle
- Focus automático no textarea ao abrir
- Submit por Enter (sem Shift): commit + colapsa com fade

#### 4.3.6 Marcação visual de output IA (RN-014) — animação Faísca → Brasa → Validado

**Componente `AIBadge` (a criar — bloqueador Piloto)** com 3 estados:

| Estado | Visual | Animação |
|--------|--------|----------|
| **Faísca** (recém-gerado) | bg `rgba(255,200,1,0.12)` · border `rgba(255,200,1,0.3)` · ícone `Sparkle` 12px · texto "Faísca" | Fade-in 200ms ao aparecer · sem animação contínua (anti-pattern) |
| **Brasa** (em refinamento humano) | bg `rgba(245,158,11,0.12)` · border `rgba(245,158,11,0.3)` · ícone `Flame` 12px · texto "Brasa" | Cross-fade 200ms ao mudar de estado |
| **Validado por humano** (HITL confirmado) | bg `rgba(16,185,129,0.08)` · border `rgba(16,185,129,0.2)` · dot 6px verde + texto "Validado por humano" | Fade-in 200ms quando humano confirma · pequeno scale bounce (1 → 1.1 → 1 em 200ms) |

**Lógica (RN-014)**:
- Output IA nasce **Faísca**
- Humano edita/integra → **Brasa** (estado intermediário, opcional)
- Humano confirma uso final → **Validado por humano**
- Output compartilhado/publicado sem Validado: **bloqueado**

### 4.4 Forced Reflection (T-09) — fricção intencional

**Princípio**: a animação **NÃO** deve ser fluida. Deve interromper.

| Elemento | Microinteração |
|----------|----------------|
| **Backdrop** | Fade-in 200ms + `filter: blur(4px)` aplicado ao conteúdo de fundo |
| **Modal scale-in** | `transform: scale(0.95) → 1` + fade 200ms (sem overshoot — sem brincadeira) |
| **Ícone Pause** | Cor `--sun` · sem animação contínua (a fricção é o silêncio) |
| **Pergunta rotativa** | Fade-in 300ms ao montar; pergunta selecionada do pool curado conforme contexto |
| **Textarea** | Focus automático após 200ms (delay para usuário processar) |
| **CTA "Continuar"** | Habilita após qualquer resposta · transition cor 150ms |
| **Click no backdrop** | **NÃO fecha** (cursor `default` no backdrop · sem feedback de hover) |
| **Esc** | Equivale a "Pular" — sem contar como engajamento |

**`prefers-reduced-motion`**: blur cai para 0px; scale-in vira fade direto 100ms.

### 4.5 Feedback HITL — Thumbs e Rating Scale

#### 4.5.1 Thumbs (1-clique HITL inline)

| Estado | Visual | Animação |
|--------|--------|----------|
| Neutro | Outline ícone `--text-muted` | — |
| Hover | Cor `--text-secondary` | 150ms ease |
| Active up | Preenchido `--planejamento` (verde) | scale 1 → 1.15 → 1 em 200ms · `aria-pressed="true"` |
| Active down | Preenchido `#EF4444` (vermelho) | mesma animação · abre FeedbackInline |

#### 4.5.2 Rating 1-5 stars (final de sessão)

Componente `StarRating` (a criar/formalizar):

| Propriedade | Valor |
|-------------|-------|
| 5 estrelas inline | 24x24 cada · gap 4px |
| Hover | Estrelas até a hovered preenchem em cascata · cor `--sun` · stagger 50ms |
| Click | Persist · animação scale 1 → 1.2 → 1 (250ms) na clicada · demais até ela permanecem preenchidas |
| `aria-label` | "Avaliar sessão de 1 a 5 estrelas" · cada estrela com `aria-label="N estrela(s)"` |

#### 4.5.3 ScopePills / ScopeCheckboxes (multi-select)

| Estado | Visual |
|--------|--------|
| Default | border `--border-subtle` · dot 6px da cor do cliente · `aria-pressed="false"` |
| Hover | border-color → `--twilight` (150ms) |
| Active | border colorida + bg `${color}18` + texto colorido + `aria-pressed="true"` |
| Click | transição cor 150ms |

### 4.6 Skills Admin (T-10/T-11/T-12) e demais Catálogos

#### 4.6.1 SkillCard / BibliotecaCard / ClientCard / WorkflowCard

| Estado | Visual | Animação |
|--------|--------|----------|
| Default | bg `--deep` · border 1px `--border-subtle` · radius 12px | — |
| Hover | border-color → `--twilight` | 150ms ease |
| Focus | `box-shadow: 0 0 0 2px rgba(255,200,1,0.20)` | 150ms |
| Active (mantido em foco com seta) | mesma do focus | — |
| Click | navega ou abre Drawer com slide-in 200ms da direita | — |

> **Anti-pattern**: hover de card NUNCA via box-shadow. Apenas `border-color`.

#### 4.6.2 Drawer right (SkillDrawer, BibliotecaDrawer, etc.)

| Propriedade | Valor |
|-------------|-------|
| Largura | `--drawer-width` 480px (60% em mobile) |
| Animação abertura | `transform: translateX(100%) → 0` em 200ms ease-out |
| Backdrop | bg `rgba(0,0,0,0.4)` fade-in 150ms |
| Click backdrop | Fecha (drawer slide-out 200ms + backdrop fade-out 150ms) |
| Esc | Fecha |
| Focus inicial | Botão close (X) — escape rota a11y |
| Focus trap | Sim, mientras aberto |

#### 4.6.3 Modal centralizado (BibliotecaModal, T-06, T-09)

| Propriedade | Valor |
|-------------|-------|
| Max-width | `--modal-max-width` 600px (480px para T-09) |
| Animação | scale 0.95 → 1 + fade-in 200ms ease-out |
| Backdrop | `rgba(0,0,0,0.6)` |
| Centralizado | flexbox + `align-items: center; justify-content: center` |
| Esc / click backdrop | Fecha (exceto T-09 — fricção intencional) |
| Focus trap | Sim |

#### 4.6.4 Tabs (Editor 4-tabs)

| Estado | Visual |
|--------|--------|
| Default | border-bottom 2px transparent · texto `--text-muted` |
| Active | border-bottom 2px `--sun` · texto `--text-primary` |
| Hover | texto `--text-secondary` (150ms) |
| Transição troca de tab | cor 150ms · indicador slide opcional 200ms |
| Keyboard | Arrow Left/Right (futuro) · Tab Tab |

### 4.7 Workflows (T-21 Builder)

| Componente | Microinteração |
|------------|----------------|
| StepCard | hover muda border + revela botões `+` para inserir step antes/depois (fade-in 150ms) |
| Drag-and-drop entre steps | feedback de "destination preview" com ghost outline na posição alvo |
| HITL gate step | dot pulsante `--sun` indicando "aguardando humano" |
| Schedule humanizado | "Toda segunda às 9h" — input cron → renderiza humanizado abaixo em tempo real |

### 4.8 Mensuração (T-24/T-25/T-26)

#### 4.8.1 KPICard

| Microinteração | Especificação |
|----------------|---------------|
| Mount inicial | Fade-in + valor counter de 0 → valor real em 600ms ease-out (apenas no first-load) |
| Sparkline mini | Linha desenha em 600ms ease-out (left-to-right path animation) |
| Hover | border-color → `--twilight` · cursor pointer (drill-down) |
| Click | Page transition para T-25 ou T-26 |
| Flag de atenção (RN-005, >25%) | Badge ⚠ pulsa **3 vezes** (não infinito) `pulse-glow` ao mount; depois congela |

> **Anti-pattern**: animação contínua em dashboards. Counters só animam **uma vez** no first-load.

#### 4.8.2 TrendChart / DiversityChart

| Microinteração | Especificação |
|----------------|---------------|
| Linha desenha | `stroke-dasharray` animado em 600ms ease-out no mount |
| Hover ponto | dot 8px da cor da série · tooltip slide-in 100ms |
| Tooltip | bg `--deep` · border 1px subtle · radius 8px · padding 8px 12px |
| Em `prefers-reduced-motion` | Linhas aparecem instant; dots sem animação |

### 4.9 Onboarding (T-27)

| Step | Microinteração |
|------|----------------|
| Wizard avança | slide-left 200ms (current → out, next → in) com cross-fade 100ms |
| Wizard retorna | slide-right 200ms |
| Progress dots | dot atual cresce de 6px → 8px com cor `--sun` em 150ms |
| Card de track sugerida | fade-in + scale 0.96 → 1 em 250ms · badge "★ Sugerida" pulse-glow 3 vezes ao mount |
| CTA "Começar a Devorar" | hover muda opacity 0.9 + cursor pointer · click → loading spinner inline (300ms) → redirect para T-02 |

### 4.10 Aprovação Hierárquica (T-29 / T-30 / T-31) — FA-13

| Step | Microinteração |
|------|----------------|
| **T-31 — Submeter para aprovação** | Modal scale-in 200ms; botão `Submeter` em loading inline; sucesso → modal fecha com fade 150ms + toast "Enviado para aprovação" deslizando do topo |
| **Animação "Validators paralelos passando"** (após submit) | Banner inline temporário (3-5s ou até backend responder): 2 chips lado a lado `Brand Validator` e `Português Validator`, cada um com **shimmer horizontal** correndo da esquerda para direita (`animation: scan-shimmer 1.4s linear infinite`); ao concluir cada validator, o chip recebe checkmark `✓` em sun-yellow + scale 1 → 1.05 → 1 (200ms) + parar shimmer. Quando ambos concluem: chips agrupam visualmente (margin negativa 4px) e revelam "Pré-validação concluída" em fade-up 200ms |
| **T-30 — Carregamento da página** | Skeleton 2 colunas (Subject + Validators); chain stepper aparece com nós em fade sequencial (50ms stagger entre nós) |
| **T-30 — FindingHighlight** | Span em `<mark>` com `text-decoration: underline wavy` na cor de severidade (error `--error`, warning `--warning`); hover desliza tooltip de baixo (translateY 4px → 0 + opacity 0 → 1 em 150ms); click no span ou no card finding faz `scrollIntoView({behavior: 'smooth', block: 'center'})` + `pulse` no destino (box-shadow `0 0 0 4px rgba(255,200,1,0.3) → 0` em 600ms) |
| **T-30 — Decisão Aprovar** | Click `Aprovar` → modal de confirmação (scale-in 200ms); confirmar → footer mostra spinner inline (300ms); sucesso → tela transiciona para read-only com **carimbo "Validado/Aprovado"** em overlay |
| **Animação "Carimbo Validado"** | Stamp circular sun-yellow com texto "VALIDADO" + assinatura do aprovador, posicionado top-right do Subject Preview. Sequência: (1) entra de `scale: 2.4 + opacity: 0 + rotate: -12deg` para `scale: 1 + opacity: 1 + rotate: -8deg` em 350ms `cubic-bezier(0.34, 1.56, 0.64, 1)` (overshoot — tem peso de carimbo); (2) ao chegar, dispara `pulse` único (box-shadow `0 0 0 0 sun → 0 0 0 12px transparent` em 500ms); (3) som opcional curto "thump" baixo volume (a validar com UX) |
| **Animação "Solicitar ajustes em round 3"** | Banner âmbar pulsa suavemente 2x (`box-shadow: 0 0 0 0 → 0 0 0 6px warning-translucent → 0` em 800ms) ao foco do botão `Solicitar ajustes`, antes de revelar o modal de confirmação que exige novamente leitura |
| **T-29 — Auto-refresh inbox** | Polling a cada 30s; se houver novos itens, badge "3 novidades" aparece flutuante no topo direito do header com fade-up 200ms; click na badge faz refresh suave (lista anima fade-out → fade-in 250ms) |
| **`prefers-reduced-motion`** | Shimmer dos validators vira progress bar horizontal estática preenchida em transição linear; carimbo Validado aparece com fade-in simples (sem overshoot, sem pulse, sem rotate); polling badge sem fade |

### 4.11 Drive Sync Dashboard (T-32 / T-33) — FA-14

| Step | Microinteração |
|------|----------------|
| **T-32 — Sync card refresh após "Forçar sync agora"** | Botão entra em loading inline 300ms; toast "Sync enfileirado · job [id]"; durante execução, tempo "Última: ..." é substituído por animated dots (`. .. ...` em loop 800ms) até backend responder; ao concluir, contadores Métricas (descobertos/indexados/curados) animam de valor antigo → novo via tween numérico em 600ms (apenas se delta > 0; se delta = 0, sem animação) |
| **T-32 — OAuth expirado** | Banner âmbar persistente entra com slide-down 250ms + glow âmbar interno suave (`animation: oauth-warn-glow 3s ease-in-out infinite alternate` — opacity inner shadow 0 → 0.3) — chama atenção sem ser estridente |
| **T-32 — Banner "Apenas relatório"** | Sem animação inicial (calmo, presente, persistente); ícone info recebe pulse sutil 1x ao primeiro mount da sessão (anti-WTF para Líder) |
| **T-33 — Aceitar `IMPORT_TO_LIBRARY`** | Card recebe checkmark verde + scale 1 → 1.02 → 1 em 250ms; depois card `slide-up` para fora da lista (translateY 0 → -16px + opacity 1 → 0 em 300ms); toast "Importado para Biblioteca como `[título]`. Ver →" entra do topo |
| **T-33 — Rejeitar** | Card desliza para a direita (translateX 0 → 24px + opacity 1 → 0 em 250ms) e desaparece da lista |
| **T-33 — STALE** | Card cinza com badge "Documento mudou no Drive" entra com fade-in suave; sem ações disponíveis exceto `Descartar` |
| **`prefers-reduced-motion`** | Tween numérico vira mudança instantânea do valor; cards entram/saem com fade simples sem translate; OAuth glow estático |

---

## 5. Loading States Padronizados

### 5.1 Skeleton (`ui/Skeleton.tsx`)

| Propriedade | Valor |
|-------------|-------|
| Background | `--nebula` |
| Animação | `pulse 1.5s ease-in-out infinite` |
| Aceita | `width`, `height`, `radius` |
| `aria-busy` | `"true"` no container |
| Em `prefers-reduced-motion` | Animação para; mantém cor sólida |

**Padrões de uso por contexto:**

| Contexto | Skeleton |
|----------|----------|
| Listas/Tabelas | 3-6 rows com height equivalente · radius 8px |
| Cards | Container completo com bordas e padding simulados |
| MessageList (Chat) | 2-3 bubble ghosts alternados (user/assistant) com radius assimétrico |
| OrbitalSystem (T-02) | Sun ghost central + 6-8 planeta ghosts em posições aproximadas |
| KPICard | Label + valor + sparkline ghosts |
| Page-level | Skeleton do layout completo (header + sidebar + body) |

### 5.2 Button loading

| Variante | Loading |
|----------|---------|
| Primary | Spinner inline 14px (cor `--void` no fundo Sun) substituindo texto |
| Ghost | Spinner inline em `--text-muted` |
| Long operation | Progress bar abaixo do botão · texto "X% concluído" |

### 5.3 Streaming (Chat)

`StreamingIndicator` (3 dots) — ver §4.3.2.

### 5.4 Indicação de processamento (Biblioteca FR-100)

KnowledgeItem em ingestão exibe pill orange com:
- Texto "Processando..."
- Barra de progresso interna (granular se backend reporta % · indeterminada se não)
- Animação `pulse 1.5s ease-in-out infinite` na pill
- Após pronto: pill verde "Disponível" com fade 300ms · removida após 3s

---

## 6. Acessibilidade

### 6.1 Contraste (referência DS §6.1)

| Token vs Background | Ratio Dark | Ratio Light | Nível |
|---------------------|:---------:|:-----------:|:-----:|
| `--text-primary` vs `--void` | 15.8:1 | 14.7:1 | AAA |
| `--text-secondary` vs `--void` | 7.2:1 | 7.8:1 | AAA |
| `--text-muted` vs `--void` | 5.1:1 | 4.6:1 | AA ✅ |
| `--sun` vs `--void` (dark) | 10.8:1 | — | AAA |

> **Regra**: nunca introduzir cor que falhe AA (4.5:1 texto normal · 3:1 texto grande/controles). Validar com [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) antes de mergear.

### 6.2 Atalhos de Teclado

| Tecla | Ação |
|-------|------|
| `⌘K` / `Ctrl+K` | Abre Command Palette (futuro) |
| `Tab` | Próximo elemento focável |
| `Shift+Tab` | Anterior |
| `Enter` | Ativa link, botão, card-clicável |
| `Space` | Ativa botão, switch |
| `Esc` | Fecha Drawer/Modal/Toast/Edit (exceto T-09 Forced Reflection) |
| `Arrow keys` | Tabs (recomendado) · Navegação em FaiscaPanel · Listas em Command Palette |
| `Enter` em input de tag/comentário | Confirma e blur |
| `⌘⇧M` (futuro) | Atalho Shoot for the Moon |
| `/` (futuro) | Focus em search global |

**Skip link** (`<a href="#main">Pular para conteúdo</a>` visível em focus) — atualmente ausente, dívida documentada no DS §6.7.

### 6.3 Focus Visible (regra única)

```css
focus-visible: box-shadow: 0 0 0 2px rgba(255,200,1,0.15);  /* default */
focus-visible (cards): box-shadow: 0 0 0 2px rgba(255,200,1,0.20);  /* mais visível em cards */
focus-visible (input): box-shadow + border-color: var(--sun);
```

> **Anti-pattern**: `outline: none` sem substituir. Se remover outline default → **obrigatório** aplicar focus ring Sun.

### 6.4 ARIA Labels

| Elemento | Requerimento |
|----------|--------------|
| `<input>` | `<label>` associado OU `aria-label` |
| Icon button (sem texto visível) | `aria-label` descritivo (ex: "Fechar", "Sair", "Voltar") |
| Image decorativa | `aria-hidden="true"` |
| Toggle switch | `role="switch"` + `aria-checked` |
| Filter pill | `aria-pressed` |
| Modal/Drawer | `role="dialog"` + `aria-modal="true"` + `aria-label` |
| Toast | `role="status"` + `aria-live="polite"` |
| Loading container | `aria-busy="true"` |
| Validation error | `aria-invalid="true"` + `aria-describedby` apontando para mensagem de erro |
| Streaming text (Chat) | `aria-live="polite"` + `aria-busy="true"` durante stream |
| Forced Reflection (T-09) | `role="alertdialog"` (mais forte que `dialog` — interrupção urgente) |
| Breadcrumb | `<nav aria-label="Navegação">` + `aria-current="page"` no atual |
| Sidebar | `<aside role="complementary" aria-label="Menu lateral">` |

> **Importante**: placeholders **nunca** substituem `<label>`.

### 6.5 Tamanhos Mínimos (touch targets)

| Tipo | Mínimo recomendado | Mínimo aceito | Notas |
|------|---------------------|---------------|-------|
| Touch target (mobile) | 44x44px | 40x40px com justificativa | WCAG 2.5.5 AAA |
| Click target (desktop) | 40x40px | 32x32px com spacing 8px | — |
| Spacing entre targets | 8px mínimo | — | — |

> **Dívida ativa**: icon buttons no AppHeader (28x28) e theme toggle (28x28) — promover para 44x44 mantendo ícone visualmente pequeno via padding.

### 6.6 Screen Reader

| Padrão | Implementação |
|--------|---------------|
| Live regions | `aria-live="polite"` para atualizações dinâmicas (toasts, streaming) |
| Live regions urgentes | `aria-live="assertive"` para erros críticos (raríssimo) |
| Loading | `aria-busy="true"` no container |
| Errors | `aria-invalid="true"` + `aria-describedby` |
| Counters dinâmicos (ex: stars sessão) | `aria-live="polite"` |
| Forced Reflection abrindo | Foco automático no Modal · `role="alertdialog"` força anúncio |

### 6.7 Movimento e Animação

`prefers-reduced-motion: reduce` — implementação atual em `globals.css:231-258`:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  .orbit-appear { animation: none !important; opacity: 1 !important; transform: scale(1) !important; }
  .orbit-ring-pulse, .page-enter { animation: none !important; }
}
```

**Regras adicionais a respeitar:**
- Toda **nova animação** precisa do override em `prefers-reduced-motion`
- Animação contínua decorativa **proibida** (apenas loading: Skeleton pulse, StreamingIndicator)
- Orbit não rotaciona em loop (removido conforme decisão MASTER)
- Forced Reflection blur cai para 0 em reduced-motion
- Devorar dots de Faísca (T-06 → T-07) saltam para "Devorando..." direto

---

## 7. Responsividade

### 7.1 Breakpoint Behaviors

| Componente | Mobile (<768px) | Tablet (768-1024px) | Desktop (>1024px) | Wide (>1440px) |
|------------|-----------------|----------------------|---------------------|----------------|
| Sidebar | Drawer left (toggle hamburger) | 40px colapsada padrão | 40 ↔ 260px (user toggle, persiste) | Idem desktop + padding |
| AppHeader | Simplificado (logo + ⌘K + theme + avatar) | Completo | Completo | Completo |
| Tables (Admin) | Card view (1col) | Scroll horizontal | Full table | Full table |
| Modals (T-06, T-09) | Full screen com margem 16px | Centered max-width | Centered max-width | Centered max-width |
| Drawers (right) | Full screen com gestos swipe | 60% width | 480px | 480px |
| OrbitalSystem | 2 anéis · labels 0.75rem | 2-3 anéis · padding 16px | 3 anéis cheios · QuickStats popover 280px | 3 anéis · QuickStats 320px · distância orbital aumenta |
| ChatInterface | 1col · ContextSidebar vira drawer right · ChatInput sticky bottom | 2col (Chat + ContextSidebar 280px colapsável) | 3col (Sidebar + Chat + ContextSidebar 320px) | 3col com ContextSidebar 360px |
| Mensuração KPICards | 1col empilhada | 2col grid | 4col grid | 4col grid · charts mais altos |
| Forms | 1col 100% | 1col max-w 480px | 1-2col max-w 640px | Mesmo desktop |

### 7.2 Touch Considerations

- Targets ≥44x44px (com exceção justificada)
- Swipe gestures opcionais para fechar Drawer mobile (swipe-right)
- Pull-to-refresh em listas (Skills, Biblioteca) — futuro
- Sem hover-only para ação primária (sempre `onClick` é primary)

### 7.3 Mobile do Sistema Solar

| Adaptação | Especificação |
|-----------|---------------|
| Sun central | Reduz para ~80px (de 120px desktop) |
| Planetas | 2 anéis em vez de 3; size proporcional menor |
| Labels solar | `font-size: 0.75rem` (override `globals.css:223`) |
| Meta solar | `font-size: 0.65rem` |
| FilterPills | Scroll horizontal; tap-friendly |
| QuickStats | Em vez de popover, vira bottom sheet com swipe-up para fechar |

### 7.4 Mobile do Chat

| Adaptação | Especificação |
|-----------|---------------|
| ContextSidebar | Drawer right com toggle por ícone `Info` 18px no header |
| Moon chips | Scroll horizontal sem wrap |
| ChatInput | `position: sticky; bottom: 0; padding-bottom: env(safe-area-inset-bottom)` (safe area iOS) |
| Mensagens | Max-width 90vw |
| ResultActions | Wrap em 2 linhas se necessário |

---

## 8. Toasts e Notifications

### 8.1 Toast (`ui/Toast.tsx`)

| Propriedade | Valor |
|-------------|-------|
| Posição | Fixed bottom 32px center |
| Forma | Pill (border-radius 9999px) |
| Padding | 12px 20px |
| Background | `--deep` |
| Border | 1px `--border-subtle` |
| Auto-dismiss | 2000ms (curto) · 4000ms (com ação) |
| Animação | Fade + slide-up 200ms entrada · fade 200ms saída |
| `role` | `"status"` |
| `aria-live` | `"polite"` |
| Z-index | `--z-toast` 100 |

**Variantes:**

| Variante | Cor border | Cor texto | Uso |
|----------|------------|-----------|-----|
| **Default (success)** | `--planejamento` | `--text-primary` | Confirmação ação ("Salvo", "Copiado") |
| **Warning** | `#F59E0B` | `--text-primary` | RN-021 truncamento, atenção não bloqueante |
| **Error** | `#EF4444` | `--text-primary` | Falhas com retry button |
| **Neutral** | `--border-subtle` | `--text-secondary` | Informativo (RN-009 redirect "Página não disponível") |

**Anti-pattern**: modais de sucesso. Usar Toast em vez disso.

### 8.2 Banner inline (página)

| Tipo | Posição | Visual |
|------|---------|--------|
| Page-level error | Topo do conteúdo, abaixo do AppHeader | bg `rgba(239,68,68,0.08)` + border `rgba(239,68,68,0.3)` + ícone `AlertCircle` 16px + texto + botão "Tentar de novo" |
| Page-level warning | Idem | bg `rgba(245,158,11,0.08)` + border `rgba(245,158,11,0.3)` |
| RN-020 bloqueio export (T-24) | Topo do dashboard | bg warning + texto explicativo |
| Pipeline timeout (T-07) | Topo do painel | bg warning + botões "Cancelar" / "Esperar mais" |

### 8.3 Push notifications (futuro)

Quando suportadas:
- Permissão solicitada apenas em contexto explícito (ex: workflow recorrente prestes a executar)
- Conteúdo respeita Caixa-preta (RN-011) — Operacional não recebe notificação que mencione "Biblioteca"

---

## 9. Dark/Light Theme Transitions

### 9.1 Mecânica

- Atributo `data-theme="dark" | "light"` em `<html>`
- `ThemeProvider` (`layout/ThemeProvider.tsx`) gerencia + persiste em localStorage
- Toggle no AppHeader com ícone Sun (em dark) ↔ Moon (em light)
- `aria-label` muda: "Trocar para tema claro" ↔ "Trocar para tema escuro"

### 9.2 Animação de transição

| Propriedade | Valor |
|-------------|-------|
| Trigger | Click no toggle |
| Animação ícone | `transform: rotate(180deg)` em 200ms ease |
| Backgrounds | `transition: background-color 250ms ease` em `body`, `--void`, `--deep`, `--nebula` |
| Texto | `transition: color 250ms ease` em `--text-*` |
| Borders | `transition: border-color 250ms ease` em `--border-subtle`, `--twilight` |
| Star field (body bg image) | Fade-out 250ms ao trocar para light (gradient stars some) |
| Em `prefers-reduced-motion` | Cai para 10ms (instantâneo perceptual) |

### 9.3 O que muda

- Backgrounds invertem (#080D14 ↔ #F5F2EB)
- Text colors invertem (com `--text-muted` recalibrado em ambos para passar AA)
- `--midia` e `--planejamento` ficam mais escuros no light para preservar contraste
- `--sun` PRESERVADO em ambos (#FFC801) — é a marca
- Body background gradient (star field) some no light theme (`globals.css:82-84`)
- Cores de Cliente NÃO mudam entre temas (cor de marca do cliente é a mesma)

### 9.4 Charts (futuro)

Quando charts existirem (T-24):
- Manter mesmas cores de tipo (`--criacao`, `--midia`, `--planejamento`) para consistência
- Grid lines: `--border-subtle` (auto-adapta)
- NÃO inverter cores graficamente entre temas

---

## 10. Animações Existentes vs. Novas (Inventário)

### 10.1 Animações já implementadas em `globals.css`

| Keyframe | Linha | Uso atual | Manter? |
|----------|------|-----------|---------|
| `blink` | 125 | `streaming-cursor` (sugerido) | Sim |
| `spin` | 130 | Spinners genéricos | Sim |
| `pulse` | 135 | Skeleton loader · StreamingIndicator (3 dots) | Sim |
| `pulse-glow` | 140 | HITL Badge confirmação (sugerido) · Timer última fase (T-08) · Flag de atenção KPI (3 ciclos) | Sim · expandir uso |
| `orbit-appear` | 145 | Aparição de Planetas (T-02) · FaiscaCards (T-07) · OnboardingTrackCard (T-27) | Sim |
| `orbit-pulse` | 160 | OrbitRing (first-load only) | Sim |
| `slow-rotate` | 170 | (não usado — manter para futuro) | Manter inativo |
| `float` / `float-only` | 176/182 | (removido de uso ativo conforme decisão MASTER) | Manter no CSS, NÃO usar em novos componentes |
| `connector-pulse` | 188 | (removido — connectors estáticos) | Manter inativo |
| `page-fade-in` | 203 | `.page-enter` em transições de rota | Sim |

### 10.2 Animações NOVAS necessárias (a implementar em `globals.css`)

Para entregar Screen Specs Parte 3 e UI Specs Parte 5:

| Nome | Especificação | Onde usar | Prioridade |
|------|---------------|-----------|:----------:|
| `devorando-spark` | Pequeno dot Sun voa do origin para destino com fade-out (translate + opacity) em 600ms ease-in-out | T-06 → T-07 transição (animação "Devorando") | P0 |
| `card-bounce-in` | Scale 0.95 → 1.05 → 1 + opacity em 250ms cubic-bezier(0.68, -0.55, 0.265, 1.55) | FaiscaCard star · Thumbs up/down · KPICard counter end | P0 |
| `slide-fade-down` | `translateY(8px) → 0` + opacity em 200ms ease-out | MessageBubble entrada · Toasts · Dropdowns | P0 |
| `slide-fade-right` | `translateX(8px) → 0` + opacity em 200ms ease-out | Drawer slide-in · Wizard step transition | P0 |
| `modal-scale-in` | Scale 0.95 → 1 + opacity em 200ms ease-out (sem overshoot — para T-09 fricção) | Modais (T-06 sem overshoot, T-09 sem overshoot) | P0 |
| `modal-scale-in-bounce` | Scale 0.92 → 1.02 → 1 + opacity em 250ms cubic-bezier(0.34, 1.56, 0.64, 1) | Onboarding cards (T-27) · contextos lúdicos | P1 |
| `counter-up` | Custo evitado, score HITL etc. animam de 0 → valor real em 600ms ease-out (apenas first-load) | KPICard (T-24) | P1 |
| `path-draw` | `stroke-dasharray` animado em 600ms ease-out (left-to-right) | TrendChart line drawing | P1 |
| `cross-fade-200` | Fade-out + fade-in 200ms (para troca de estado em mesmo elemento) | AIBadge Faísca → Brasa → Validado | P0 |
| `progress-bar-fill` | width 0% → N% em 400ms ease-out | TimeBoxingTimer · processamento Biblioteca · Wizard progress | P1 |
| `blur-backdrop` | `filter: blur(0) → blur(4px)` em 200ms ease (apenas T-09 fricção) | Forced Reflection backdrop | P1 |
| `scan-shimmer` | `background-position: -200% → 200%` em 1.4s linear infinite (gradient horizontal `transparent → sun-translucent → transparent`) | Validators paralelos passando (T-30) | P1 |
| `validated-stamp-impact` | `scale 2.4 → 1 + opacity 0 → 1 + rotate -12 → -8deg` em 350ms `cubic-bezier(0.34, 1.56, 0.64, 1)` (overshoot peso de carimbo) seguido de `pulse-once` (box-shadow `0 0 0 0 sun → 0 0 0 12px transparent` em 500ms) | Carimbo "Validado" após APPROVE (T-30) | P1 |
| `oauth-warn-glow` | `box-shadow: inset 0 0 0 0 warning → inset 0 0 12px warning-translucent` 3s ease-in-out infinite alternate | Banner OAuth expirado (T-32) | P1 |
| `card-slide-out-right` | `translateX 0 → 24px + opacity 1 → 0` em 250ms ease-in (rejeitar sugestão) | T-33 reject | P1 |
| `card-slide-out-up` | `translateY 0 → -16px + opacity 1 → 0` em 300ms ease-in (aceitar sugestão) | T-33 accept | P1 |
| `tween-counter` | Tween numérico de valor antigo → novo em 600ms ease-out (apenas se delta > 0) | T-32 contadores após sync | P1 |
| `chain-stepper-stagger` | Stagger 50ms entre nós no mount do ApprovalChainStepper (cada nó: fade-in + scale 0.96 → 1 em 200ms) | T-30 chain visualization | P1 |

**TODAS as animações novas DEVEM ter override em `@media (prefers-reduced-motion: reduce)`** — adicionar no bloco existente de `globals.css:231-258`. Específicos para FA-13/14:
- `scan-shimmer` → vira progress-bar estática preenchida
- `validated-stamp-impact` → fade-in simples (sem overshoot, rotate, pulse)
- `oauth-warn-glow` → estático (manter cor, remover animação)
- `card-slide-out-*` → fade simples sem translate
- `tween-counter` → mudança instantânea de valor
- `chain-stepper-stagger` → todos nós aparecem simultâneos com fade simples

### 10.3 Animações PROIBIDAS (anti-patterns)

| Padrão | Motivo |
|--------|--------|
| Rotação contínua (`slow-rotate` em uso ativo) | Perturba foco · sinaliza "carregando" eternamente |
| Float infinito de Planetas (`planet-float`) | Removido — hover glow já é feedback suficiente |
| Connector pulse contínuo | Distrai do conteúdo |
| Pulse decorativo em cards | Reservado para loading exclusivamente |
| Animação de scroll automático sem trigger explícito | Confunde usuário |
| Animação > 600ms para microinteração | Atrapalha fluxo · usuário percebe lag |
| Carrossel auto-rotativo sem controle | Acessibilidade · respeito ao usuário |

---

## 11. Handoff e Implementação

### 11.1 Referência de Tokens

Todos os valores devem vir de:
- `app/globals.css` (cores, opacidades, animações)
- `docs/ux/parte4-design-system.md` §3 (tokens consolidados)
- `tailwind.config.js` (futuro: gap, padding tokenizados)

### 11.2 Checklist de QA Visual (PR template)

**Layout:**
- [ ] Grid e gutters respeitados
- [ ] Espaçamentos múltiplos de 4px
- [ ] Breakpoints funcionando (mobile/tablet/desktop/wide)
- [ ] Scroll behavior correto

**Tokens:**
- [ ] Cores via `var(--token)` (sem hex hardcoded de cor de marca)
- [ ] Tipografia conforme escala
- [ ] Border radius (8/12/9999)
- [ ] Sombras minimalistas

**Estados:**
- [ ] Loading com Skeleton apropriado
- [ ] Empty state com CTA + ilustração
- [ ] Error state com recovery
- [ ] Success feedback (Toast curto, sem modal)

**Microinterações:**
- [ ] Hover states (border-color para card; opacity para botão)
- [ ] Focus visible em todo interativo (ring Sun)
- [ ] Transições 150ms (cor) / 200ms (layout) / 200ms (transform)
- [ ] Keyboard navigation funcional
- [ ] Animações novas registradas em `globals.css` com override `prefers-reduced-motion`

**Acessibilidade:**
- [ ] Contraste AA verificado (WebAIM)
- [ ] Labels em inputs (não placeholder-only)
- [ ] `aria-label` em icon buttons
- [ ] `role`, `aria-modal`, `aria-current`, `aria-pressed`, `aria-busy`, `aria-live` aplicados
- [ ] Tab order lógico
- [ ] Touch targets ≥44x44px (40x40 com justificativa)
- [ ] Skip link presente (futuro)

**RN aplicáveis:**
- [ ] RN-014: outputs de IA marcados (Faísca/Brasa/Validado)
- [ ] RN-015: forced reflection após N stars (não decorativa)
- [ ] RN-016: vocabulário Suno validado contra Glossário §1 e §9
- [ ] RN-017: track por carreira respeitada (sugere, não impõe)
- [ ] RN-009/RN-011: filtragem RBAC + Caixa-preta antes de montar

### 11.3 Como contribuir

1. Toda nova animação vai como `@keyframes` em `globals.css` + classe utilitária + entry no §10.2 deste documento
2. Toda nova string visível ao usuário passa pela validação RN-016 (humano hoje, lint amanhã — PA-10)
3. Componente novo precisa de seção em DS §4 + UI Specs aqui (microinterações + responsivo)
4. Mudança em token existente = breaking change → revisar todos os usos
5. Anti-pattern detectado → adicionar em DS §8.1 ou §8.2 e neste §10.3

### 11.4 Entrega contínua de microinterações

Sequência sugerida de implementação:

| Sprint | Foco | Entregas |
|--------|------|----------|
| 1 | RN-014 visual | Componente `AIBadge` + animação `cross-fade-200` |
| 2 | Shoot for the Moon UX | `ShootForTheMoonModal` + `FaiscaPanel` + `FaiscaCard` + animação `devorando-spark` |
| 3 | Forced Reflection | `ForcedReflectionInterstitial` + animação `blur-backdrop` (com override reduced-motion) |
| 4 | Mensuração | `KPICard` + `TrendChart` + animação `counter-up` + `path-draw` |
| 5 | Onboarding | `OnboardingWizard` + `OnboardingTrackCard` + transições wizard |
| 6 | Dívidas a11y | Skip link · 44x44 nos icon buttons · Cmd+K Command Palette |
| 7 | Aprovação Hierárquica (FA-13) | `ApprovalCard`, `ApprovalChainStepper`, `ValidatorFindingsPanel`, `FindingHighlight`, `DecisionFooter` + animações `scan-shimmer`, `validated-stamp-impact`, `chain-stepper-stagger` |
| 8 | Drive Sync (FA-14) | `DriveSyncStatusCard`, `DriveOAuthCard`, `CurationSuggestionCard`, `DriveCleanupReportItem` + animações `oauth-warn-glow`, `card-slide-out-*`, `tween-counter` |

---

## 12. Próximas Evoluções

| Item | Quando | Responsável |
|------|--------|-------------|
| Tokenizar `--success`, `--warning`, `--error`, `--z-*` | Próxima sprint UI | Time dev |
| Componente `AIBadge` (RN-014) | Antes do Piloto | Time dev |
| Lint de vocabulário UI (RN-016 — PA-10) | Antes do Protótipo | Heitor + dev |
| Componente `ForcedReflectionInterstitial` (RN-015) | Após Piloto | Time dev |
| Promover icon buttons do AppHeader para 44x44 | Próxima sprint UI | Time dev |
| Skip link "Pular para conteúdo" global | Próxima sprint UI | Time dev |
| Tokens em `tailwind.config` (gap-md, p-lg, etc.) | Próxima sprint UI | Time dev |
| Animações novas (devorando-spark, card-bounce-in, blur-backdrop, etc.) | Sprints 1-5 do roadmap §11.4 | Time dev |
| Charts dark/light theme switching (T-24) | Pré-Piloto | Time dev |
| Command Palette com a11y completa (P2/P3) | MVP | Time dev |

---

## Changelog

| Versão | Data | Descrição |
|--------|------|-----------|
| 1.0 | 2026-04-28 | Versão inicial. Cobertura horizontal de microinterações (não tela a tela). **Microinterações catalogadas em 9 áreas**: Sistema Solar (hover Planeta · transição L0→L1 · OrbitRing first-load · FilterPills); Shoot for the Moon (animação "Devorando" T-06→T-07 · orbit-appear de FaiscaCards · star bounce · refinar/descartar · Time-Boxing transitions); Chat (streaming token · 3-dots typing · MessageBubble entrada · ResultActions · FeedbackInline · marcação Faísca→Brasa→Validado RN-014); Forced Reflection (fricção intencional · blur backdrop · sem fechamento por backdrop); Feedback HITL (thumbs · stars rating · scope pills); Catálogos Admin (cards · drawer · modal · tabs); Workflows; Mensuração (KPICard · TrendChart · DiversityChart com counter-up e path-draw); Onboarding (wizard transitions · cards). **11 animações novas** identificadas e especificadas (devorando-spark · card-bounce-in · slide-fade-down/right · modal-scale-in/bounce · counter-up · path-draw · cross-fade-200 · progress-bar-fill · blur-backdrop) — todas com override obrigatório em `prefers-reduced-motion`. **Responsividade** com 4 breakpoints (mobile/tablet/desktop/wide) detalhada componente a componente. **Toasts e Banners** com 4 variantes. **Dark/Light theme transitions** especificadas (250ms ease backgrounds · 200ms ease ícone). **WCAG 2.1 AA** explícita: contraste verificado por token, atalhos teclado completos, ARIA por elemento, focus visible único, touch targets ≥44x44px. **Anti-patterns** consolidados (rotação contínua · float · pulse decorativo · animação >600ms). **Vocabulário Suno (RN-016)** aplicado em todo copy (Devorar · Provocar · Faísca · Brasa · Koro com K). |
| 1.1 | 2026-04-28 | Adicionadas **§4.10 (Aprovação FA-13 — T-29/T-30/T-31)** e **§4.11 (Drive FA-14 — T-32/T-33)** com microinterações específicas. Animação central "Validators paralelos passando" (chips Brand + Português com `scan-shimmer` correndo, depois checkmark + concluído) e "Carimbo Validado" (stamp circular com overshoot `cubic-bezier`, pulse e som opcional) materializam a estética **Validado** definida no glossário do BRD. **+8 animações novas** registradas em §10.2: `scan-shimmer`, `validated-stamp-impact`, `oauth-warn-glow`, `card-slide-out-right`, `card-slide-out-up`, `tween-counter`, `chain-stepper-stagger`. Todas com override `prefers-reduced-motion` específico (shimmer → progress estática; stamp → fade simples; glow → estático; slides → fade; tween → instantâneo; stagger → simultâneo). **Sequência de implementação** estendida com Sprint 7 (FA-13 components + animações) e Sprint 8 (FA-14 components + animações). RN-014 (marca visual) reforçada com Validation Badge persistente em T-29/T-30 e carimbo final ao APPROVE. RN-024/025/026/029 visualizados via UI (banner round 3, banner "Apenas relatório", chip travado `🔒 drive.readonly`). |
