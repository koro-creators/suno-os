# sunOS — Design System (Source of Truth)

**Gerado:** 2026-04-16
**Base:** UI/UX Pro Max audit + identidade Suno existente
**Status:** Ativo — toda mudança visual deve respeitar este arquivo

---

## Identidade

- **Produto:** Plataforma de IA para marketing (SaaS interno)
- **Estilo:** Dark Mode OLED + Vibrant accents
- **Mood:** Profissional, criativo, espacial, tecnológico
- **Metáfora:** Sistema solar (clientes = planetas, skills = órbitas)

---

## Paleta de Cores

### Dark Theme (default)

| Token | Hex | Ratio vs --void | Uso |
|-------|-----|:---:|-----|
| `--void` | `#080D14` | — | Background principal |
| `--deep` | `#0F1923` | 1.3:1 | Cards, panels, surfaces |
| `--nebula` | `#1B2B3A` | 1.8:1 | Inputs, hover states |
| `--twilight` | `#263A4D` | 2.5:1 | Borders fortes, hover border |
| `--sun` | `#FFC801` | 10.8:1 ✅ | Accent brand (CTAs, active) |
| `--text-primary` | `#F1F5F9` | 15.8:1 ✅ | Headings, texto principal |
| `--text-secondary` | `#94A3B8` | 7.2:1 ✅ | Body text, descrições |
| `--text-muted` | **`#64748B`** | **5.1:1 ✅** | Labels, hints, metadata |
| `--border-subtle` | **`rgba(255,255,255,0.10)`** | — | Borders sutis (visíveis) |
| `--surface-hover` | `rgba(255,255,255,0.05)` | — | Hover em surfaces |
| `--header-bg` | `rgba(8,13,20,0.7)` | — | Header glassmorphism |

### Light Theme

| Token | Hex | Ratio vs --void | Uso |
|-------|-----|:---:|-----|
| `--void` | `#F5F2EB` | — | Background |
| `--deep` | `#F5F2EB` | 1:1 | Cards (mesmo tom) |
| `--nebula` | `#EDE9E0` | — | Inputs |
| `--twilight` | `#D4CFC6` | — | Borders |
| `--sun` | `#FFC801` | — | Accent (preservado) |
| `--text-primary` | `#1A1A1A` | 14.7:1 ✅ | Headings |
| `--text-secondary` | `#4A4A4A` | 7.8:1 ✅ | Body |
| `--text-muted` | **`#6B6B5F`** | **4.6:1 ✅** | Labels |
| `--border-subtle` | **`rgba(0,0,0,0.10)`** | — | Borders |

### Cores Funcionais

| Cor | Hex | Uso |
|-----|-----|-----|
| Criação | `#FFC801` | Skills de criação |
| Mídia | `#3B82F6` | Skills de mídia |
| Planejamento | `#10B981` | Skills de planejamento |
| Sucesso | `#10B981` | Thumbs up, ativo, approved |
| Erro | `#EF4444` | Thumbs down, delete, failed |
| Warning | `#F59E0B` | Processing, draft |

### Cores de Clientes

| Cliente | Hex |
|---------|-----|
| Suno | `#FFC801` |
| Vivo | `#8B5CF6` |
| Americanas | `#F97316` |
| Sicredi | `#22C55E` |
| Samsung | `#3B82F6` |

---

## Tipografia

| Propriedade | Valor |
|-------------|-------|
| **Font family** | `"Helvetica Neue", "Inter", system-ui, sans-serif` |
| **Font variable** | `--font-inter` (Google Fonts, Inter) |
| **H1 (página)** | 2rem (32px), weight 300, `--text-primary` |
| **H2 (seção)** | 1rem (16px), weight 600, uppercase, letter-spacing 0.08em, `--text-muted` |
| **Body** | **0.875rem (14px)**, weight 400, line-height 1.5, `--text-secondary` |
| **Labels** | 0.75rem (12px), weight 500, `--text-secondary` |
| **Metadata** | 0.65rem (10.4px), weight 400, `--text-muted` |
| **Micro** | 0.55rem (8.8px), uppercase, letter-spacing 0.14em, `--text-muted` |

---

## Espaçamento

| Token | Valor | Uso |
|-------|-------|-----|
| `xs` | 4px | Gap mínimo |
| `sm` | 8px | Padding interno |
| `md` | 16px | Gap entre cards, padding |
| `lg` | 24px | Padding de seção, página |
| `xl` | 32px | Margens de seção |
| `2xl` | 48px | Margens grandes |

---

## Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `card` | 12px | Cards, modals, containers |
| `input` | 8px | Inputs, textareas, selects |
| `pill` | 9999px | Buttons primários, badges, pills |

---

## Sombras & Elevação

| Nível | Valor | Uso |
|-------|-------|-----|
| Focus ring | `0 0 0 2px rgba(255,200,1,0.3)` | **Todos** os interativos |
| Modal | `0 2px 12px rgba(0,0,0,0.2)` | Modals, social preview |
| Card hover | Border muda para `--twilight` | Cards clicáveis |

---

## Transições

| Tipo | Duração | Uso |
|------|---------|-----|
| Hover (cor, border) | `150ms ease` | Botões, links, cards |
| Layout (expand, collapse) | `200ms ease` | Sidebar, panels |
| Page (enter) | `300ms ease-out` | Page transitions |

---

## Touch Targets

| Mínimo | Valor |
|--------|-------|
| **Touch target** | **44x44px** em todos os interativos |
| Sidebar icons | 44x44 (era 40x40) |
| Filter pills | min-height 36px + padding |
| Theme toggle | 44x44 (era 28x28, usar padding) |

---

## Ícones

| Propriedade | Valor |
|-------------|-------|
| Biblioteca | Lucide React |
| Tamanho padrão | 14px |
| Stroke width | 1.5 |
| Cor default | `--text-muted` |
| Cor ativa | `--sun` |
| Cor hover | `--text-secondary` |

---

## Padrões de Componente

### Cards
```
bg: var(--deep)
border: 1px solid var(--border-subtle)
border-radius: 12px
padding: 16px
hover: border-color var(--twilight)
cursor: pointer (se clicável)
focus: boxShadow FOCUS_RING
```

### Inputs
```
bg: transparent
border: 1px solid var(--border-subtle)
border-radius: 8px
padding: 8px 12px
font-size: 0.875rem
color: var(--text-primary)
focus: border-color var(--sun), boxShadow FOCUS_RING
```

### Botões Primários
```
bg: var(--sun)
color: var(--void)
border: none
border-radius: 9999px
padding: 8px 16px
font-size: 0.875rem
font-weight: 500
hover: opacity 0.9
min-height: 44px
```

### Botões Ghost
```
bg: transparent
border: 1px solid var(--border-subtle)
color: var(--text-secondary)
border-radius: 8px
hover: border-color var(--twilight)
min-height: 44px
```

### Toggle Switch
```
width: 36px, height: 20px
border-radius: 10px
bg on: var(--sun)
bg off: var(--nebula)
dot: 16x16, border-radius 50%
transition: 200ms ease
role: switch
aria-checked: true/false
```

### Toast
```
position: fixed bottom 32px center
bg: var(--deep)
border: 1px solid var(--border-subtle)
border-radius: 9999px
padding: 8px 20px
font-size: 0.8rem
auto-dismiss: 2000ms
role: status
aria-live: polite
```

---

## Acessibilidade

### Obrigatório
- Contraste WCAG AA: 4.5:1 mínimo para texto
- `role` em todos os interativos (link, button, switch, dialog, tab)
- `aria-label` em botões de ícone
- `aria-pressed` em toggles de filtro
- `aria-checked` em switches
- `tabIndex={0}` em divs clicáveis
- Keyboard Enter/Space em interativos
- Escape em modals
- `prefers-reduced-motion` respeitado
- Skip link "Pular para conteúdo"

### Recomendado
- Focus trap em modals
- Arrow keys em tabs
- `aria-live="polite"` em conteúdo dinâmico

---

## Anti-patterns

| Não fazer | Fazer em vez |
|-----------|-------------|
| Texto `--text-muted` antigo (#475569) | Usar `#64748B` (5.1:1) |
| Border 6% opacidade | Usar 10% opacidade |
| Body text 0.8rem (12.8px) | Mínimo 0.875rem (14px) |
| Touch targets < 44px | Sempre ≥ 44x44px |
| Focus ring inconsistente | FOCUS_RING em TUDO |
| Animação infinita decorativa | Apenas em loading indicators |
| Layout sem breakpoints | Mobile 1col, tablet 2col, desktop 3col |
| `h-screen` em layout | Usar `min-h-dvh` |
| Hover-only para ação primária | onClick como primary, hover como enhancement |
| Skeleton ausente | animate-pulse skeleton em todo async |
