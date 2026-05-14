---
documento: UX Parte 3 — Screen Specs por Feature
projeto: sunOS
cliente: Suno United Creators (uso 100% interno)
bu: Tecnologia e Dados para Marketing
versao: 1.0
data_criacao: 2026-04-28
ultima_atualizacao: 2026-04-28
autor: Heitor Miranda + Claude (assistido)
status: Rascunho
escopo: 11 telas TOP-PRIORITY do inventário (T-XX) — não cobre todas as 28
fonte_ux:
  - docs/ux/parte1-inventario-telas.md (T-01 a T-28)
  - docs/ux/parte2-arquitetura-informacao.md (L0-L4 Sistema Solar)
  - docs/ux/parte4-design-system.md (tokens e componentes)
fonte_prd:
  - docs/prd/parte1-feature-map.md (FA-01 a FA-12)
  - docs/prd/parte2-personas-jtbd.md (PX-01 a PX-05)
  - docs/prd/parte4-FRs.md (FR-100 a FR-159)
fonte_brd:
  - docs/brd/parte4-regras.md (RN-001 a RN-022)
  - docs/brd/parte2-glossario.md (vocabulário Suno)
fonte_codigo:
  - app/ (rotas Next.js 14)
  - components/ (componentes implementados)
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

# UX Parte 3 — Screen Specs sunOS v1.0

**Filosofia:** *"Sistema Solar como navegação; Caixa-preta como princípio; Faísca como vocabulário visual."*

**Vocabulário (RN-016):** Devorar · Provocar · Faísca · Brasa · Sun · Planeta · Órbita · Moon · Skill · Biblioteca · Workflow · Bioma Zero/Job/Agentic · Caixa-preta · Creator · Koro Creators (sempre com K).

---

## Sumário

1. [Escopo e Cobertura](#1-escopo-e-cobertura)
2. [T-02 — Sistema Solar L0 (Sun/Home)](#2-t-02--sistema-solar-l0-sunhome)
3. [T-04 — Órbita/Skill (L2)](#3-t-04--órbitaskill-l2)
4. [T-05 — Chat com Persistência](#4-t-05--chat-com-persistência)
5. [T-06 — Moon Shot: Acionamento (Modal)](#5-t-06--moon-shot-acionamento-modal)
6. [T-07 — Moon Shot: Painel de Faíscas](#6-t-07--moon-shot-painel-de-faíscas)
7. [T-08 — Moon Shot: Modo Dupla (Time-Boxing)](#7-t-08--moon-shot-modo-dupla-time-boxing)
8. [T-09 — Forced Reflection Interstitial](#8-t-09--forced-reflection-interstitial)
9. [T-10 — Skills Admin: Catálogo](#9-t-10--skills-admin-catálogo)
10. [T-13 — Biblioteca Admin: Catálogo (Caixa-preta)](#10-t-13--biblioteca-admin-catálogo-caixa-preta)
11. [T-24 — Mensuração: Dashboard Executivo](#11-t-24--mensuração-dashboard-executivo)
12. [T-27 — Onboarding por Carreira](#12-t-27--onboarding-por-carreira)
13. [Padrões Compartilhados](#13-padrões-compartilhados)
14. [Componentes a Criar (Lacunas)](#14-componentes-a-criar-lacunas)
15. [Documentos Relacionados](#15-documentos-relacionados)

---

## 1. Escopo e Cobertura

### 1.1 Telas detalhadas neste documento (14)

| T-XX | Nome | Feature | Estado | Prioridade | Persona Primária |
|------|------|---------|--------|:----------:|------------------|
| **T-02** | Sistema Solar L0 (Sun/Home) | FA-06 | existe | P0 | Todas |
| **T-04** | Órbita/Skill (L2) | FA-06 | existe | P0 | Todas |
| **T-05** | Chat com persistência | FA-04 | existe (refactor P1) | P0 | PX-02, PX-03, PX-04, PX-05 |
| **T-06** | Moon Shot — Modal Acionamento | FA-02 | a construir | P0 (POC) | PX-02, PX-04, PX-05 |
| **T-07** | Moon Shot — Painel de Faíscas | FA-02 | a construir | P0 (POC) | PX-02, PX-04, PX-05 |
| **T-08** | Moon Shot — Modo Dupla | FA-02 | a construir | P1 (Piloto) | PX-02 |
| **T-09** | Forced Reflection Interstitial | FA-11, FA-07 | a construir | P1 (Piloto) | PX-02, PX-05 |
| **T-10** | Skills Admin — Catálogo | FA-12, FA-03 | existe | P0 | PX-01 |
| **T-13** | Biblioteca Admin — Catálogo (Caixa-preta RN-011) | FA-12, FA-01 | existe | P0 | PX-01 |
| **T-24** | Mensuração — Dashboard Executivo | FA-10 | a construir | P1 (Piloto) | PX-01 |
| **T-27** | Onboarding por Carreira | FA-11 | a construir | P1 (Piloto) | PX-02, PX-05 |
| **T-29** | Aprovação — Inbox do Aprovador | FA-13 | a construir | P1 (Piloto) | PX-06 (Aprovador), PX-01 |
| **T-30** | Aprovação — Detalhe da Submissão | FA-13 | a construir | P1 (Piloto) | PX-06, PX-01 |
| **T-32** | Drive — Sync Dashboard | FA-14 | a construir | P1 (Piloto) | PX-01 |

### 1.2 Telas não cobertas (referência cruzada)

T-01, T-03, T-11, T-12, T-14, T-15, T-16, T-17, T-18, T-19, T-20, T-21, T-22, T-23, T-25, T-26, T-28, **T-31** (modal de submissão — segue §13.3 Padrão de Modal), **T-33** (Inbox de sugestões — segue padrão de catálogo + drawer §13.2/§13.3) — ver inventário completo em `docs/ux/parte1-inventario-telas.md`. Padrões compartilhados de Catálogo Admin, Editor 4-tabs e Drawer estão em §13.

### 1.3 Convenções de leitura

- **Tokens** referenciados como `--token` vêm do Design System Parte 4 (`app/globals.css`).
- **Componentes** em `PascalCase` referem-se aos arquivos em `components/` listados no Design System §4.
- **FR-XXX** referenciam `docs/prd/parte4-FRs.md`. **RN-XXX** referenciam `docs/brd/parte4-regras.md`.
- Toda spec assume aplicação obrigatória de **RN-009 (RBAC default-deny)**, **RN-011 (Caixa-preta)**, **RN-014 (marcação visual de output IA)** e **RN-016 (vocabulário)**.

---

## 2. T-02 — Sistema Solar L0 (Sun/Home)

### 2.1 Metadados

| Atributo | Valor |
|----------|-------|
| **ID** | T-02 |
| **Nome** | Sistema Solar L0 (Sun/Home) |
| **Feature** | FA-06 (Sistema Solar — Navegação) |
| **Rota** | `/` |
| **Prioridade** | P0 |
| **Jornadas** | JN-00 (Wayfinding) — entrada para todas as demais |
| **FRs** | FR-128 a FR-130 (FA-06) |
| **RNs aplicáveis** | RN-016 (vocabulário), RN-009 (RBAC — sempre visível para qualquer perfil) |
| **Status (App)** | Implementado (`app/page.tsx`) |
| **Componentes-chave** | `solar/OrbitalSystem`, `solar/CenterNode`, `solar/PlanetNode`, `solar/FilterPills`, `solar/QuickStats` |

### 2.2 Propósito

Ponto de entrada único do sunOS. Apresenta a metáfora rectora do produto: o Sun (Suno United Creators) ao centro, Planetas (Clientes) orbitando em anéis concêntricos. É a **assinatura visual** — toda jornada começa aqui. Para PX-05 (Junior), é o primeiro toque cultural. Para PX-01 (Líder), é o atalho diário para módulos administrativos via Sidebar.

### 2.3 Layout Estrutural

```
┌──────────────────────────────────────────────────────────────────────────┐
│ APPHEADER (48px sticky · glassmorphism)                                   │
│ [☉ sunOS]                                          [⌘K] [☀] [Avatar]      │
├────┬─────────────────────────────────────────────────────────────────────┤
│ S  │                                                                      │
│ I  │                          ╭─────────╮                                │
│ D  │                       ╱  │   SUN   │  ╲                             │
│ E  │                     ╱    │  (Suno) │    ╲                           │
│ B  │                   ╱      ╰─────────╯      ╲                         │
│ A  │                 ●  Vivo                ●  Sicredi                   │
│ R  │                       ●  Americanas                                  │
│ 40 │                 ●  MRV         ●  Stone     ●  Samsung               │
│    │                                                                      │
│    │              [Criação] [Mídia] [Planejamento] (FilterPills)         │
│    │                                                                      │
└────┴─────────────────────────────────────────────────────────────────────┘
```

### 2.4 Especificação de Elementos

#### 2.4.1 AppHeader

| Propriedade | Especificação |
|-------------|---------------|
| Altura | `--header-height` 48px, sticky top, z-index 50 |
| Background | `--header-bg` com `backdrop-filter: blur(12px)` |
| Esquerda | Logo Sun + wordmark "sunOS" (`layout/Logo.tsx`) |
| Centro | Sem breadcrumb (estamos em L0) |
| Direita | `[⌘K Search] [Theme toggle] [User Menu]` |
| `aria-label` | "Cabeçalho principal" |

#### 2.4.2 Sidebar

| Propriedade | Especificação |
|-------------|---------------|
| Largura | `--sidebar-collapsed` 40px / `--sidebar-expanded` 260px |
| Filtragem | RN-009 + RN-011 — `adminOnly` filtrado antes de montar |
| Item ativo (Home) | bg `--nebula` + barra lateral 2px `--sun` + ícone em `--sun` |
| `aria-current` | `"page"` no item Home |

#### 2.4.3 OrbitalSystem (área principal)

**1. CenterNode (Sun)** — `solar/CenterNode.tsx`

| Propriedade | Valor |
|-------------|-------|
| Posição | Centro da viewport (CSS grid + transform) |
| Tamanho | ~120px diâmetro |
| Cor | `--sun` (#FFC801) |
| Glow | `box-shadow: 0 0 40px rgba(255,200,1,0.45)` |
| Animação contínua | **Não**. Apenas hover e `orbit-appear` no first-load |
| Hover | tooltip "Suno United Creators" + escala 1.04 |
| `aria-label` | "Suno United Creators — centro do sistema" |

**2. PlanetNodes (Clientes)** — `solar/PlanetNode.tsx`

| Propriedade | Valor |
|-------------|-------|
| Distribuição | Anéis concêntricos (3 anéis), espaçamento angular calculado |
| Cor | `data/clients.ts` (Vivo `#8B5CF6`, Americanas `#F97316`, etc.) |
| Tamanho | Proporcional ao número de Skills do cliente (min 16px, max 36px) |
| Hover | Glow `box-shadow: 0 0 20px ${colorAlpha40}` + escala 1.08 + `QuickStats` overlay |
| Click | Navega para T-03 `/[clientSlug]` (Next router push) |
| Foco (keyboard) | Focus ring `0 0 0 2px rgba(255,200,1,0.20)` |
| `tabIndex` | `0` (focável) |
| `aria-label` | `"Cliente {nome} — {n} Skills, {n} Moons"` |
| `role` | `"link"` |

**3. OrbitRings** — `solar/OrbitRing.tsx`

| Propriedade | Valor |
|-------------|-------|
| Cor default | `--orbit-line` (12% opacity Sun) |
| Cor hover | `--orbit-hover` (22% opacity Sun) |
| Stroke | 1px |
| Animação | **Não rotaciona** (rotação contínua proibida — anti-pattern) |
| `aria-hidden` | `"true"` (decorativo) |

**4. FilterPills** — `solar/FilterPills.tsx`

| Propriedade | Valor |
|-------------|-------|
| Posição | Rodapé centralizado |
| Pills | "Criação" / "Mídia" / "Planejamento" |
| Estado ativa | Border colorida + bg `${color}18` (12% opacity) |
| `aria-pressed` | `true | false` por pill |
| Comportamento | Filtra Planetas que oferecem aquele tipo (highlight + dim os outros) — sem navegação |

### 2.5 Estados da Tela

#### Loading

```
┌──────────────────────────────────────────────────┐
│ [Skeleton header]                                 │
│                                                   │
│              ░ ░ ░ ░ ░  (Sun ghost)               │
│        ░ ░          ░ ░  (planet ghosts)          │
│              ░  ░  ░  ░                           │
│                                                   │
│         [Skeleton FilterPills]                    │
└──────────────────────────────────────────────────┘
```

- Sun: círculo 120px com `animation: pulse 1.5s ease-in-out infinite`, bg `--nebula`
- Planetas: 6-8 círculos cinza, mesma animação, posições aproximadas dos slots reais
- Sem texto durante loading (evita layout shift)
- `aria-busy="true"` no container

#### Empty

Não aplicável — sempre há ao menos o Sun + Suno como Planeta. Caso o catálogo de clientes venha vazio (cenário extremo de erro), exibir EmptyState centralizado: ícone Sun · *"Sem Planetas para órbita"* · CTA `[Configurar Clientes]` (apenas para PX-01 — RN-009).

#### Error

Banner topo com bg `rgba(239,68,68,0.08)` + borda `1px solid rgba(239,68,68,0.3)` + texto `#EF4444`:
*"Não foi possível carregar Planetas — tentar novamente"* + botão Ghost "Tentar de novo".

### 2.6 Interações

| Evento | Elemento | Resultado |
|--------|----------|-----------|
| Click | PlanetNode | Navega para `/[clientSlug]` (T-03) |
| Hover | PlanetNode | Glow + QuickStats popover (200ms ease) |
| Click | FilterPill | Toggle ativo; re-render highlight (sem navegação) |
| Hover | CenterNode | Tooltip "Suno United Creators" |
| Tab | Qualquer focável | Avança foco com ring Sun |
| Enter / Space | PlanetNode em foco | Equivale a click |
| ⌘K / Ctrl+K | Global (futuro) | Abre Command Palette |

### 2.7 Mobile vs. Desktop

| Breakpoint | Comportamento |
|------------|---------------|
| Mobile (<768px) | Sun reduz para ~80px; Planetas em 2 anéis; FilterPills em scroll horizontal; labels solar com `font-size: 0.75rem` (override via `globals.css:223`) |
| Tablet (768-1024px) | 2-3 anéis; padding lateral 16px |
| Desktop (>1024px) | 3 anéis cheios; QuickStats popover com 280px de largura |
| Wide (>1440px) | Distância orbital aumenta proporcionalmente |

### 2.8 RN/FR aplicados

- **RN-016** — copy: "Sistema Solar", "Sun", "Planeta", nunca "Dashboard inicial" ou "Cliente" como label visual primária
- **RN-009** — Sidebar filtra módulos administrativos antes de montar
- **FR-128** (FA-06) — navegação Sun→Planeta em ≤1 clique
- **prefers-reduced-motion** — `orbit-appear` desliga; pulse para; sem rotação

---

## 3. T-04 — Órbita/Skill (L2)

### 3.1 Metadados

| Atributo | Valor |
|----------|-------|
| **ID** | T-04 |
| **Nome** | Sistema Solar L2 — Órbita/Skill (com Chat acoplado) |
| **Feature** | FA-06 + FA-04 |
| **Rota** | `/[clientSlug]/[skillSlug]` |
| **Prioridade** | P0 |
| **Jornadas** | JN-02, JN-03, JN-04 |
| **FRs** | FR-128 (Sistema Solar), FR-116-121 (Chat) |
| **RNs** | RN-003 (≤3 cliques), RN-016 (vocabulário Moon chips) |
| **Status (App)** | Implementado (`app/[clientSlug]/[skillSlug]/page.tsx`); SPEC-007 colocou Moon como chip |
| **Componentes-chave** | `chat/PromptTemplateBar`, `chat/ModelSelector`, `solar/OrbitRing` (header decorativo), todos os componentes de T-05 |

### 3.2 Propósito

Tela onde o Creator escolhe a Moon (sub-área) da Skill ativa e abre o Chat. Após SPEC-007, **Moon vive como chip dentro do PromptTemplateBar do Chat** — esta tela é portanto acoplada visualmente a T-05. O usuário percebe uma única tela; conceitualmente são L2 (escolha de Moon) + L4 (sessão de chat).

### 3.3 Layout Estrutural

```
┌──────────────────────────────────────────────────────────────────────────┐
│ APPHEADER · Breadcrumb: Home > [Cliente] > [Skill]●  · [Moon Shot] │
├────┬─────────────────────────────────────────────────────────────────────┤
│ S  │ PROMPTTEMPLATEBAR — Moon chips                                       │
│ I  │ ┌──────────────────────────────────────────────────────────────────┐│
│ D  │ │ [● Stories] [Reels] [Feed] [Carousel]    [ModelSelector ▼]      ││
│ E  │ └──────────────────────────────────────────────────────────────────┘│
│ B  │                                                                      │
│ A  │                       (Conteúdo do Chat — T-05)                      │
│ R  │                                                                      │
│ 40 │                                                                      │
│    │ CHATINPUT (rodapé)                                                   │
└────┴─────────────────────────────────────────────────────────────────────┘
```

### 3.4 Especificação de Elementos (delta sobre T-05)

#### 3.4.1 Breadcrumb

| Propriedade | Valor |
|-------------|-------|
| Trilha | `Home > [Cliente] > [Skill]` |
| Item atual | Última posição com **dot Sun glowing** `box-shadow: 0 0 6px rgba(255,200,1,0.6)` |
| `aria-current` | `"page"` no último item |
| Click em "Home" / "[Cliente]" | Navega para `/` ou `/[clientSlug]` |

#### 3.4.2 PromptTemplateBar (Moon chips) — `chat/PromptTemplateBar.tsx`

| Propriedade | Valor |
|-------------|-------|
| Layout | Horizontal scroll em mobile; flex em desktop |
| Pill ativa | bg `--sun` + texto `--void` |
| Pill inativa | border `--border-subtle` + texto `--text-muted` |
| Hover | border-color → `--twilight` (150ms ease) |
| `aria-pressed` | `true` na ativa |
| Vocabulário (RN-016) | Nome da Moon vem do catálogo Skill (ex: "Stories e Reels", "Feed", "Carousel") |

#### 3.4.3 CTA "Moon Shot" persistente

| Propriedade | Valor |
|-------------|-------|
| Posição | Header AppHeader rightSection — sempre visível em T-04/T-05 (RN-003) |
| Variante | Botão Ghost com ícone `Rocket` 14px |
| Texto | *"Devorar este briefing"* (vocabulário Suno) |
| Comportamento | Click abre T-06 (modal sobreposto) preservando contexto da Skill |
| Atalho | `⌘⇧M` (futuro) |

### 3.5 Estados da Tela

| Estado | Tratamento |
|--------|------------|
| Loading | Skeleton dos Moon chips (4 pills cinza) + Skeleton do MessageList |
| Moon ainda não escolhida (default) | Primeira Moon do catálogo é ativa por default; chat já operacional |
| Skill sem Moons | PromptTemplateBar oculta; Chat opera direto |
| Cliente inativo (RN-007) | Redirect para `/` com toast "Cliente fora de operação" |

### 3.6 Interações

| Evento | Resultado |
|--------|-----------|
| Click em Moon chip | Atualiza query string `?moon=[slug]`; re-injeta contexto; **mantém ChatSession atual** (não limpa histórico) |
| Click em CTA Moon Shot | Abre T-06 modal |
| Click em ModelSelector | Abre dropdown; troca modelo ativo (Gemini Flash / GPT-4o / Claude) |

---

## 4. T-05 — Chat com Persistência

### 4.1 Metadados

| Atributo | Valor |
|----------|-------|
| **ID** | T-05 |
| **Nome** | Chat com Skill + Moon ativos |
| **Feature** | FA-04 (Chat ReAct) + FA-07 (HITL) + FA-08 (Multimodal) |
| **Rota** | `/[clientSlug]/[skillSlug]?moon=[moonSlug]` |
| **Prioridade** | P0 |
| **Jornadas** | JN-02, JN-03, JN-04, JN-06 |
| **FRs** | FR-116 a FR-121 (FA-04), FR-131 a FR-134 (FA-07), FR-135 a FR-137 (FA-08) |
| **RNs** | RN-003 (3 cliques), RN-010 (isolamento clientes), RN-011 (Caixa-preta), RN-014 (marcação Faísca), RN-015 (forced reflection N stars), RN-021 (truncamento contexto) |
| **Status (App)** | Implementado base; **em refactor para persistência cross-session (P1)** |
| **Componentes-chave** | `chat/ChatInterface`, `chat/MessageBubble`, `chat/ChatInput`, `chat/StreamingIndicator`, `chat/ResultActions`, `chat/FeedbackInline`, `chat/ContextSidebar`, `chat/VariationCards`, `chat/SocialPreview`, `chat/ModelSelector` |

### 4.2 Propósito

Interface conversacional principal — onde **Creator e IA conversam**. Toda Skill processual e o Moon Shot chegam aqui. É o ponto de **maior densidade funcional** do sunOS. Em refactor: ganhar **persistência cross-session** (histórico recuperável via Sidebar) sem perder a sensação de imediatismo.

### 4.3 Layout Estrutural (Desktop 3 colunas)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ APPHEADER · Breadcrumb · [Moon chips] · [Model ▼] · [Moon Shot] │
├────┬───────────────────────────────────────────┬────────────────────────┤
│ S  │ MESSAGELIST (scroll vertical reverso)     │ CONTEXT SIDEBAR (320)  │
│ I  │                                           │                        │
│ D  │ [User bubble] (direita)                   │ ▸ Biblioteca           │
│ E  │                                           │   (Caixa-preta para    │
│ B  │ [Assistant bubble] (esquerda)             │    Operacional)        │
│ A  │   • [Faísca badge] · texto · streaming    │                        │
│ R  │   ResultActions: [📋][↻][✓][👍][👎]      │ ▸ Agentes              │
│ 40 │   FeedbackInline (collapsable)            │   ReAct ativo          │
│    │   VariationsCarousel (3 opts) — opcional  │                        │
│    │   SocialPreview — opcional                │ ▸ Validação HITL       │
│    │                                           │   stars · counter      │
│    │ [StreamingIndicator: ●●● durante stream]  │                        │
│    │                                           │                        │
│    ├───────────────────────────────────────────┤                        │
│    │ CHATINPUT (textarea + 📎 + ►)             │                        │
└────┴───────────────────────────────────────────┴────────────────────────┘
```

### 4.4 Especificação de Elementos

#### 4.4.1 MessageBubble — `chat/MessageBubble.tsx`

| Tipo | Background | Color | Border-radius | Avatar |
|------|------------|-------|----------------|--------|
| **User** | `--nebula` | `--text-primary` | `16px 16px 4px 16px` (assimétrico) | — |
| **Assistant** | `rgba(255,255,255,0.03)` | `--text-primary` | `16px 16px 16px 4px` (assimétrico) | Sun 24x24 com letra "S" |

**Marcação Faísca (RN-014):** toda MessageBubble assistant tem badge no canto inferior direito:
- Estado pré-confirmação: bg `rgba(255,200,1,0.12)` + borda `rgba(255,200,1,0.3)` + ícone `Sparkle` 12px + texto "Faísca"
- Estado pós-confirmação humana (HITL Badge verde): bg `rgba(16,185,129,0.08)` + borda `rgba(16,185,129,0.2)` + dot 6px verde + "Validado por humano"

#### 4.4.2 StreamingIndicator — `chat/StreamingIndicator.tsx`

| Propriedade | Valor |
|-------------|-------|
| Visual | 3 dots 6px em `--text-muted` |
| Animação | `pulse 1.5s ease-in-out infinite` com `animationDelay: 0s, 0.2s, 0.4s` |
| Posição | Dentro da bubble Assistant durante stream |
| Label complementar | Texto pequeno "Pensando com [Modelo]..." em `--text-muted` |
| `aria-live` | `"polite"` (screen reader anuncia início/fim) |
| `aria-busy` | `"true"` no container durante stream |

#### 4.4.3 ChatInput — `chat/ChatInput.tsx`

| Propriedade | Valor |
|-------------|-------|
| Tipo | `<textarea>` com auto-resize (max 6 linhas, depois scroll) |
| Border | 1px `--border-subtle` → `--sun` em focus |
| Border-radius | 12px |
| Placeholder | *"Devorar este briefing..."* (RN-016) |
| Atalhos | Enter envia · Shift+Enter quebra linha · ESC limpa |
| Botão paperclip | Ícone `Paperclip` 14px à esquerda interna — abre upload (SPEC-006, P1 backlog) |
| Botão Send | Variante Primary (Sun pill) à direita; ícone `ArrowUp` 14px; `disabled` enquanto streaming |
| Focus ring | `boxShadow: 0 0 0 2px rgba(255,200,1,0.15)` |

#### 4.4.4 ResultActions — `chat/ResultActions.tsx`

| Ação | Ícone | Estado | Feedback |
|------|-------|--------|----------|
| Copiar | `Copy` 14px | Default `--text-muted` → hover `--text-secondary` | Toast 2s "Copiado para área de transferência" |
| Variar | `RefreshCw` 14px | Idem | Abre `VariationsCarousel` com 3 alternativas (FR-116, FA-04-06) |
| Salvar | `Bookmark` 14px | Idem | Toast "Salvo" |
| Thumbs up | `ThumbsUp` 14px | Active: `#10B981` (planejamento) | `aria-pressed` + counter HITL incrementa |
| Thumbs down | `ThumbsDown` 14px | Active: `#EF4444` | `aria-pressed` + abre `FeedbackInline` |

#### 4.4.5 FeedbackInline — `chat/FeedbackInline.tsx`

| Propriedade | Valor |
|-------------|-------|
| Trigger | Click em thumbs down OU "Adicionar comentário" |
| Layout | Textarea collapsable abaixo da MessageBubble |
| Animação | `transition: max-height 150ms ease` (0 ↔ 120px) |
| `border-color` + `box-shadow` em focus | 150ms ease |
| Submit | Enter (sem shift) → commit + colapsa |
| `aria-expanded` | `true | false` |

#### 4.4.6 ContextSidebar (direita) — `chat/ContextSidebar.tsx`

| Seção | Visível para | Conteúdo |
|-------|--------------|----------|
| **Biblioteca** | Admin/Líder apenas (RN-011) | Lista de KnowledgeItems injetados na sessão; chip por item com nome + escopo |
| **Biblioteca (Operacional)** | Operacional | Substituída por seção **"Contexto do cliente"** sem expor Biblioteca; mesma lista visual mas com label neutro |
| **Agentes** | Todos | Indicador do agente ReAct ativo; visible reasoning HIDDEN by default (RN-017 para junior; toggle disponível para sênior) |
| **Validação HITL** | Todos | Progress bar de feedbacks · counter thumbs · status sessão · rating 1-5 stars (FR-131) |

### 4.5 Estados da Tela

| Estado | Tratamento Visual |
|--------|-------------------|
| **Loading inicial** | Skeleton da MessageList (2-3 bubble ghosts alternados) + ChatInput desabilitado com placeholder cinza |
| **Empty (sessão nova)** | Welcome card centrado: ícone Sun + *"Pronto para Devorar [Skill]?"* + 3 sugestões de prompt pré-configuradas por Moon (FR-118) |
| **Streaming** | StreamingIndicator visível dentro da bubble; ChatInput Send desabilitado; ESC interrompe (FR-117) |
| **Error LLM** | Banner inline na MessageBubble: bg `rgba(239,68,68,0.08)` + texto "Erro ao chamar [modelo]" + botão Ghost "Tentar de novo" + opção "Trocar modelo" (fallback automático sugerido — FR-119) |
| **Truncamento de contexto (RN-021)** | Toast warning amarelo *"Contexto extenso — alguns conteúdos auxiliares foram omitidos"* (não bloqueante) |
| **Forced Reflection trigger** | Após N stars (RN-015): MessageList desfoca via `filter: blur(2px)` + abre T-09 |
| **Persistência (P1)** | Histórico de Sessões aparece no Sidebar como item expansível "Conversas recentes" |

### 4.6 Interações

| Evento | Resultado |
|--------|-----------|
| `Send` (Enter) | SSE stream inicia; MessageBubble assistant cresce em tempo real (token streaming) |
| Thumbs up/down | Animação `scale(1) → scale(1.15) → scale(1)` em 200ms; commit ao backend; counter incrementa; após N stars → T-09 |
| Click "Variar" | Substitui bubble por `VariationsCarousel` com 3 cards (V1, V2, V3); usuário escolhe uma → resto descarta com fade |
| Drag-and-drop arquivo | Border-color do ChatInput → `--sun`; bg muda para `--nebula`; drop processa upload (SPEC-006) |
| Click em CTA Moon Shot | Abre T-06 modal preservando contexto |
| `Esc` durante streaming | Interrompe geração; mostra mensagem "Geração interrompida" |
| Click em ContextSidebar item | Drawer com detalhes (Admin/Líder); Operacional vê apenas resumo neutro |

### 4.7 Mobile vs. Desktop

| Breakpoint | Mudanças |
|------------|----------|
| Mobile (<768px) | ContextSidebar vira **drawer right** (toggle por botão `Info` 18px no header); MessageList full-width; ChatInput sticky bottom; Moon chips em scroll horizontal |
| Tablet (768-1024px) | ContextSidebar 280px colapsável; MessageList flex-1 |
| Desktop (>1024px) | 3 colunas conforme layout §4.3 |

### 4.8 RN/FR aplicados

- **RN-014** — toda assistant bubble tem badge "Faísca" → "Validado" após HITL
- **RN-011** — para Operacional: nenhuma menção a "Biblioteca"; ContextSidebar usa "Contexto do cliente"
- **RN-015** — após N=5 stars (sênior) ou N=3 (junior), trigger T-09
- **RN-021** — truncamento por peso decrescente, com toast warning se peso ≥0.6 for cortado
- **RN-010** — isolamento por cliente: zero contexto cross-client (auditável)
- **FR-117** — interrupção por ESC durante streaming
- **FR-118** — sugestões de prompt por Moon

---

## 5. T-06 — Moon Shot: Acionamento (Modal)

### 5.1 Metadados

| Atributo | Valor |
|----------|-------|
| **ID** | T-06 |
| **Nome** | Moon Shot — Modal de Acionamento |
| **Feature** | FA-02 |
| **Rota** | Modal sobreposto (sem rota dedicada) — sobre T-03 ou T-05 |
| **Prioridade** | P0 (POC) |
| **Jornadas** | JN-02, JN-04, JN-06 |
| **FRs** | FR-001 a FR-008 (FRD Moon Shot externo) |
| **RNs** | RN-001 (zona bisociação), RN-003 (3 cliques), RN-016 (vocabulário), RN-017 (track por carreira) |
| **Status (App)** | A construir |
| **Componentes-chave** | `MoonShotModal` (a criar) |

### 5.2 Propósito

Modal sobreposto que **dispara o pipeline de Provocação criativa**. Preserva contexto do cliente e Skill ativa; pede tema/briefing se necessário; oferece escolha de modo (zona de bisociação) e track por carreira.

### 5.3 Layout Estrutural

```
┌────────────────────────────────────────────────┐  ← Backdrop rgba(0,0,0,0.6)
│        [Modal centralizado, max-w 600px]       │
│ ┌────────────────────────────────────────────┐ │
│ │ 🌑 Moon Shot                  [×] │ │  ← Header
│ │ Devorar [Cliente] e Provocar Faíscas       │ │
│ ├────────────────────────────────────────────┤ │
│ │ Briefing                                   │ │
│ │ ┌────────────────────────────────────────┐ │ │
│ │ │ [Textarea pré-preenchida com contexto] │ │ │
│ │ └────────────────────────────────────────┘ │ │
│ │                                            │ │
│ │ Modo de entrada:                           │ │
│ │ ┌──────┐ ┌──────────┐ ┌──────────┐        │ │
│ │ │Começ.│ │Me prova q│ │  Modo    │        │ │
│ │ │ideia │ │tá errada │ │  Dupla   │        │ │
│ │ └──────┘ └──────────┘ └──────────┘        │ │
│ │  (sugerida = stage carreira RN-017)        │ │
│ │                                            │ │
│ │ ▸ Zona de Bisociação (avançado)           │ │
│ │   ○ Adjacente  ● Sweet Spot  ○ Equilibrado│ │
│ │   ○ Radical                                │ │
│ ├────────────────────────────────────────────┤ │
│ │           [Cancelar]  [Provocar Faíscas →] │ │  ← Footer
│ └────────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
```

### 5.4 Especificação de Elementos

| Elemento | Especificação |
|----------|---------------|
| **Modal container** | `role="dialog"` · `aria-modal="true"` · `aria-label="Acionar Moon Shot"` · max-width 600px · bg `--deep` · radius 12px · padding 24px |
| **Backdrop** | bg `rgba(0,0,0,0.6)` · click fecha · z-index 90 |
| **Botão close** | `aria-label="Fechar"` · ícone `X` 16px · canto sup. direito |
| **Título** | "Moon Shot" + ícone `Moon` 18px · font-size 1.1rem · weight 500 |
| **Subtítulo** | *"Devorar [Cliente] e Provocar Faíscas"* (RN-016) · `--text-secondary` |
| **Textarea Briefing** | min-height 100px · auto-resize · pré-preenchida com contexto da sessão · placeholder *"Cole ou descreva o briefing que vamos Devorar..."* |
| **Modo cards** | 3 cards selecionáveis (radio comportamento) · highlight ativo: border `--sun` + bg `rgba(255,200,1,0.06)` · sugestão pré-aplicada conforme RN-017 com badge "Sugerido para você" |
| **Zona Bisociação** | Collapsible (default fechado) · radio buttons inline · default Sweet Spot · tooltip por opção explicando |
| **CTA Primary** | "Provocar Faíscas" · variante Primary (Sun pill) · ícone `Sparkles` 14px |
| **CTA Secondary** | "Cancelar" · variante Ghost |

### 5.5 Estados

| Estado | Tratamento |
|--------|------------|
| **Default** | Modal aberto · briefing pré-preenchido se existir contexto |
| **Validation error** | Briefing < 30 caracteres → mensagem inline em `#EF4444` font 0.65rem · CTA Primary disabled · `aria-invalid="true"` |
| **Loading** (após Provocar) | Modal não fecha imediatamente · CTA Primary mostra spinner inline + texto "Provocando..."; após handshake do pipeline (~1s) → fecha modal e abre T-07 com streaming |

### 5.6 Interações

| Evento | Resultado |
|--------|-----------|
| Click em modo card | Seleção exclusiva (radio); feedback visual imediato |
| Click "Provocar Faíscas" | Validação → loading → fade-out modal (200ms) + fade-in T-07 |
| `Esc` | Fecha modal (mesma ação que Cancelar) |
| Click no backdrop | Fecha modal |
| Tab dentro do modal | **Focus trap** — não escapa para conteúdo de fundo (a11y) |
| Open inicial | Foco automático no botão close (escape rota) ou no Textarea (preferência alternativa) |

### 5.7 RN/FR aplicados

- **RN-003** — preserva contexto da Skill ativa; sem deep navigation
- **RN-017** — modo card sugerido conforme estágio de carreira (junior → "começando"; sênior → "me prova"); pleno → ambos visíveis
- **RN-016** — vocabulário "Devorar", "Provocar", "Faísca" — proibido "gerar ideias"
- **RN-001** — Zona de Bisociação default Sweet Spot

---

## 6. T-07 — Moon Shot: Painel de Faíscas

### 6.1 Metadados

| Atributo | Valor |
|----------|-------|
| **ID** | T-07 |
| **Nome** | Painel de Faíscas (streaming pipeline Explorer↔Crítico) |
| **Feature** | FA-02 |
| **Rota** | Painel sobreposto (preferido) ou rota dedicada `/[clientSlug]/[skillSlug]/moon-shot` |
| **Prioridade** | P0 (POC) |
| **Jornadas** | JN-02, JN-04, JN-06 |
| **FRs** | FR-009 a FR-014 (FRD externo) |
| **RNs** | RN-001 (filtragem zona), RN-002 (convergência loop), RN-003 (≤30s timeout), RN-014 (marcação Faísca), RN-015 (forced reflection) |
| **Status (App)** | A construir |
| **Componentes-chave** | `FaiscaPanel`, `FaiscaCard`, `BisociationZoneBadge`, `AgentPersonaBadge` (todos a criar) |

### 6.2 Propósito

Painel onde o pipeline Explorer↔Crítico **transmite Faíscas em streaming**. Cada Faísca aprovada (RN-002, score médio ≥8) aparece como card com 3 dimensões avaliadas (Novidade, Coerência, Potencial Criativo). Creator pode dar star, refinar, integrar à conversa do Chat.

### 6.3 Layout Estrutural

```
┌────────────────────────────────────────────────────────────────────┐
│ FAÍSCAS — [tema]              Pipeline: Explorer ⇄ Crítico   [×] │
│ Persona ativa: Antropófaga · 12 geradas · 5 aprovadas · 7 desc.   │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ ✦ Faísca · Sweet Spot                            [⭐][↻][✕] │  │
│ │ "Antropofagia × Mídia OOH"                                   │  │
│ │                                                               │  │
│ │ "Devore o consumidor como o Tupinambá devorou o europeu:    │  │
│ │  não rejeite, transforme. Outdoors comem dados…"            │  │
│ │                                                               │  │
│ │ Novidade  ████████░░ 8.2                                     │  │
│ │ Coerência ███████░░░ 7.5                                     │  │
│ │ Potencial █████████░ 9.0                                     │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ ✦ Faísca · Adjacente  (orbit-appear animation)               │  │
│ │ ...                                                           │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ [● Pipeline ativo · gerando próxima Faísca]                       │
├────────────────────────────────────────────────────────────────────┤
│  [Mais Faíscas]               [Levar Faíscas marcadas para Chat →] │
└────────────────────────────────────────────────────────────────────┘
```

### 6.4 Especificação de Elementos

#### 6.4.1 Header do Painel

| Elemento | Valor |
|----------|-------|
| Título | `"Faíscas — {tema}"` font-size 1rem weight 500 |
| Pipeline indicator | "Explorer ⇄ Crítico" com ícone animado (sem rotação contínua — apenas troca de cor) |
| Persona ativa | Badge com nome da persona brasileira (Antropófaga · Carnavalesco · Anciã — FA-02-04) + ícone temático |
| Counter | `"X geradas · Y aprovadas · Z descartadas"` em `--text-muted` font 0.75rem |
| Botão fechar | `aria-label="Fechar painel de Faíscas"` |

#### 6.4.2 FaiscaCard (componente a criar)

| Propriedade | Valor |
|-------------|-------|
| Container | bg `--deep` · border 1px `--border-subtle` · radius 12px · padding 16px |
| Animação entrada | `orbit-appear 400ms cubic-bezier(0.34, 1.56, 0.64, 1)` (overshoot bounce) |
| Badge "Faísca" (RN-014) | Sempre visível canto sup. esquerdo · ícone `Sparkle` 12px + texto |
| Badge zona | "Sweet Spot" / "Adjacente" / "Radical" — pill com cor por zona |
| Tags domínio | Ex: "Antropofagia × Mídia OOH" — chips menores |
| Texto da provocação | font-size 0.95rem line-height 1.5 |
| 3 scores (Novidade/Coerência/Potencial) | Mini bars horizontais 8px de altura · cor `--sun` no preenchido · fundo `--nebula` · valor numérico à direita |
| Ações | `[⭐ Star]` `[↻ Refinar]` `[✕ Descartar]` — icon buttons 32x32 |
| Hover | border-color → `--twilight` (150ms) |
| Focus | ring `--sun` |
| `role` | `"article"` · `aria-label` descritivo |

**Persona brasileira no card** (microinteração cultural):

| Persona | Cor temática | Ícone |
|---------|-------------|-------|
| Antropófaga | `#8B5CF6` (roxo Vivo-like) | `Skull` |
| Carnavalesco | `#F472B6` (rosa BMG-like) | `PartyPopper` |
| Anciã | `#A3E635` (verde-limão Stone-like) | `Eye` |

#### 6.4.3 Streaming behavior

| Comportamento | Especificação |
|---------------|---------------|
| Cards aparecem em ordem | conforme stream backend; com animação `orbit-appear` |
| Pipeline indicator | dot pulsante ao final da lista durante geração |
| Tempo entre cards | tipicamente 5-15s (RN-003) |
| Timeout total | 30s — após disso, banner "Demorando mais que o esperado" + botão Cancelar |

### 6.5 Estados

| Estado | Tratamento |
|--------|------------|
| **Streaming** | Pipeline indicator ativo · cards aparecem com `orbit-appear` |
| **Done** | Pipeline indicator some · CTAs habilitados |
| **Empty (zero aprovadas)** | EmptyState centrado: *"O briefing exige outra zona. Tente Radical?"* + CTA "Voltar ao acionamento" → reabre T-06 com Radical pré-selecionada |
| **Timeout (>30s — RN-003)** | Banner topo `--warning` + botão "Cancelar" / "Esperar mais" |
| **Forced Reflection trigger** | Após N stars (RN-015): bloqueia cards novos · MessageList desfoca · abre T-09 |

### 6.6 Interações

| Evento | Resultado |
|--------|-----------|
| Click em ⭐ Star | Toggle estado · contador stars sessão incrementa · animação scale 1→1.2→1 (200ms) |
| Click em ↻ Refinar | Volta o card ao loop Explorer↔Crítico para nova iteração; card mostra "Refinando..." |
| Click em ✕ Descartar | Card faz fade-out + slide-up (200ms) + log para Eval (FA-10-02) |
| Click em "Levar Faíscas marcadas para o Chat" | Painel fecha; Faíscas marcadas viram contexto adicionado ao MessageList do Chat (T-05) |
| Click em "Mais Faíscas" | Pipeline reinicia para nova rodada |

### 6.7 RN/FR aplicados

- **RN-002** — pipeline mostra apenas Faíscas aprovadas (score ≥8); rejeitadas viram contador "descartadas"
- **RN-014** — badge "Faísca" sempre visível
- **RN-003** — timeout 30s + cancelamento
- **RN-015** — N stars dispara T-09

---

## 7. T-08 — Moon Shot: Modo Dupla (Time-Boxing)

### 7.1 Metadados

| Atributo | Valor |
|----------|-------|
| **ID** | T-08 |
| **Nome** | Modo Dupla com Time-Boxing alternado IA↔Humano |
| **Feature** | FA-02 (variação) |
| **Rota** | Variante de T-07 |
| **Prioridade** | P1 (Piloto) |
| **Jornadas** | JN-02, JN-06 |
| **FRs** | FA-02-05, FA-11-06 |
| **RNs** | RN-014, RN-015 |
| **Status (App)** | A construir |
| **Componentes-chave** | `TimeBoxingTimer`, `RoundsHistory`, `FaiscaPanel` (compartilhado com T-07) |

### 7.2 Propósito

Variação de T-07 com **time-boxing alternado**: 90s para a IA gerar, 5min para o humano refinar/criar/aprovar. Preserva fluxo humano de criação em dupla. Útil principalmente para PX-02 (Sênior) trabalhando em sessão criativa intensa.

### 7.3 Layout Estrutural

```
┌────────────────────────────────────────────────────────────────────┐
│ MODO DUPLA — [tema]                                          [×]  │
│                                                                    │
│ ┌────────────────────────────────────────────────────────────────┐│
│ │   ⏱  IA gerando · 01:23 / 01:30                                ││  ← TimeBoxingTimer
│ │   ████████████████████████░░░  (progress bar)                  ││
│ └────────────────────────────────────────────────────────────────┘│
│                                                                    │
│ Round 3 — IA                                                       │
│ ┌──────────────────────────────────────────────────────────────┐  │
│ │ [Faísca cards desta rodada]                                  │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ ▾ Round 2 — Humano (5:00)                                         │
│ ▾ Round 1 — IA (1:30)                                             │
│                                                                    │
│ [⏸ Pausar Time-Boxing]                                            │
└────────────────────────────────────────────────────────────────────┘
```

### 7.4 Especificação de Elementos (delta sobre T-07)

#### 7.4.1 TimeBoxingTimer (componente a criar)

| Propriedade | Valor |
|-------------|-------|
| Display | Time atual + tempo total (mm:ss / mm:ss) |
| Cor da fase IA | `--sun` (predomina) |
| Cor da fase Humano | `--planejamento` (verde) |
| Progress bar | 6px altura · border-radius 9999px · cor da fase |
| Animação warning | Últimos 10s: pulse `pulse-glow 1s ease-in-out infinite` (animação nova a criar) |
| `aria-live` | `"polite"` ao trocar de fase |
| Sound (opcional) | Tone discreto na transição (pode ser desligado em settings) |

#### 7.4.2 Bloqueio cruzado

| Fase | Comportamento |
|------|---------------|
| **IA gerando (90s)** | Cards de Faíscas aparecem; ChatInput humano + ações em FaiscaCards desabilitados (`opacity: 0.5` + cursor not-allowed); contador visível |
| **Humano (5min)** | Pipeline IA pausado (sem geração); ações de star/refinar/comentar/criar habilitadas; ChatInput permite escrever próximo prompt |

#### 7.4.3 RoundsHistory

Lista vertical colapsável dos rounds anteriores (Round 1 IA → Round 2 Humano → ...). Cada round expandível mostra Faíscas e comentários daquela janela.

### 7.5 Estados

| Estado | Tratamento |
|--------|------------|
| **IA gerando** | Timer ativo · cards aparecendo · humano bloqueado |
| **Transição** | Timer reseta · banner brevemente "Sua vez agora" / "IA assumindo" · 1s fade |
| **Humano** | Timer ativo · cards estáticos · ações habilitadas |
| **Pausado** | Timer congelado · ambos lados habilitados · banner "Time-Boxing pausado" |
| **Encerrado** | "Sessão de dupla finalizada" · CTA "Levar Faíscas para Chat" |

### 7.6 Interações

| Evento | Resultado |
|--------|-----------|
| Auto: fim de fase IA | Transição automática para fase Humano |
| Auto: fim de fase Humano | Transição automática para fase IA |
| Click "Pausar" | Toggle pause; mantém estado |
| Click "Sair do modo dupla" | Confirma e volta ao modo normal T-07 |

### 7.7 RN/FR aplicados

- **FA-02-05** — time-boxing 90s/5min
- **FA-11-06** — preservação do fluxo humano de criação
- **RN-014** — badge Faísca em todos os outputs

---

## 8. T-09 — Forced Reflection Interstitial

### 8.1 Metadados

| Atributo | Valor |
|----------|-------|
| **ID** | T-09 |
| **Nome** | Forced Reflection Interstitial |
| **Feature** | FA-11 (Safety Cultural) + FA-07 (HITL) |
| **Rota** | Modal sobreposto a T-05 ou T-07 (sem rota dedicada) |
| **Prioridade** | P1 (Piloto) |
| **Jornadas** | Transversal a JN-02, JN-03, JN-06 |
| **FRs** | FR-151 a FR-153 (FA-11) |
| **RNs** | RN-015 (forced reflection após N stars), RN-017 (N=3 junior · N=5 sênior) |
| **Status (App)** | A construir |
| **Componentes-chave** | `ForcedReflectionInterstitial` (a criar) |

### 8.2 Propósito

**Interrupção cognitiva** após N stars consecutivas (RN-015): pergunta reflexiva forçada para preservar engajamento crítico e proteger contra over-reliance em IA. Fundamentado em Lee et al. Microsoft 2025 e Kosmyna et al. MIT 2025 (research foundation).

### 8.3 Layout Estrutural

```
┌────────────────────────────────────────────────┐  ← Backdrop rgba(0,0,0,0.6)
│        [Modal centrado, max-w 480px]           │     + filter: blur(4px) no fundo
│ ┌────────────────────────────────────────────┐ │
│ │            ⏸  Pausa estratégica            │ │
│ │                                            │ │
│ │  Você marcou 5 Faíscas seguidas.           │ │
│ │                                            │ │
│ │  Por que essas? Que padrão você vê?        │ │
│ │                                            │ │
│ │  ┌──────────────────────────────────────┐ │ │
│ │  │ [Textarea — sua resposta]            │ │ │
│ │  │                                      │ │ │
│ │  └──────────────────────────────────────┘ │ │
│ │  30 caracteres recomendados (não bloqueia)│ │
│ │                                            │ │
│ │       [Pular esta vez]    [Continuar →]   │ │
│ └────────────────────────────────────────────┘ │
└────────────────────────────────────────────────┘
```

### 8.4 Especificação de Elementos

| Elemento | Especificação |
|----------|---------------|
| **Modal container** | max-width 480px · bg `--deep` · radius 12px · padding 32px · `role="dialog"` · `aria-modal="true"` · `aria-label="Pausa estratégica"` |
| **Backdrop** | bg `rgba(0,0,0,0.6)` + filtro blur 4px no conteúdo de fundo (efeito interrupção real) |
| **Ícone** | `Pause` 24px em `--sun` · canto superior · sem animação (a fricção é o ponto) |
| **Título** | "Pausa estratégica" font-size 1.1rem weight 500 |
| **Contexto da pausa** | Texto curto explicando: "Você marcou {N} Faíscas seguidas." |
| **Pergunta reflexiva** | Texto rotativo (pool curado de ~10 perguntas) em `--text-primary` font 1rem |
| **Pool de perguntas (RN-016)** | "Por que essas? Que padrão você vê?" · "O que essas Faíscas têm em comum?" · "Qual delas te incomoda mais?" · "Em qual você apostaria sua reputação?" · etc. |
| **Textarea** | min-height 80px · placeholder "Sua resposta..." · contador `30 caracteres recomendados (não bloqueia)` |
| **CTA Primary** | "Continuar" — variante Primary (Sun pill) · habilita após qualquer resposta (mesmo curta) |
| **CTA Secondary** | "Pular esta vez" — variante Ghost · contador interno de skips |

### 8.5 Estados

| Estado | Tratamento |
|--------|------------|
| **Default** | Modal aberto · textarea vazia · CTA "Continuar" disabled |
| **Texto digitado** | CTA "Continuar" habilita; sem validação de caracteres mínimo (não bloqueia) |
| **Tooltip primeira aparição (PX-05 Junior)** | Após primeira aparição: tooltip discreto "Pausas como esta protegem sua autonomia criativa." (RN-017) |
| **3 skips consecutivos (RN-015)** | Internal flag escala alerta para Líder; usuário não vê (operação invisível) |

### 8.6 Interações

| Evento | Resultado |
|--------|-----------|
| Click "Continuar" | Persist resposta (FR-153); fecha modal com fade-out 200ms; foco volta para MessageList; reseta contador stars da sessão |
| Click "Pular esta vez" | Fecha modal; incrementa skip counter; nenhuma persistência de texto |
| `Esc` | Equivale a "Pular" |
| Click no backdrop | **NÃO fecha** (pausa é forçada — fricção intencional) |
| Tab | Focus trap no modal |

### 8.7 Mobile vs. Desktop

| Breakpoint | Mudanças |
|------------|----------|
| Mobile | Modal ocupa 100vw - 32px de margem; Textarea 100% de largura |
| Desktop | Layout conforme §8.3 |

### 8.8 RN/FR aplicados

- **RN-015** — após N=5 stars (sênior) ou N=3 (junior); ≥3 skips escala para Líder
- **RN-017** — N adaptado por carreira; tooltip extra para junior
- **RN-016** — vocabulário "pausa estratégica" (não "interrupção", não "validação obrigatória")
- **prefers-reduced-motion** — fade-out cai para 10ms; sem blur no fundo

---

## 9. T-10 — Skills Admin: Catálogo

### 9.1 Metadados

| Atributo | Valor |
|----------|-------|
| **ID** | T-10 |
| **Nome** | Skills Admin — Catálogo |
| **Feature** | FA-12 + FA-03 |
| **Rota** | `/skills` |
| **Prioridade** | P0 |
| **Jornadas** | JN-01 (Curadoria) |
| **FRs** | FR-156 a FR-159 (Admin areas) |
| **RNs** | RN-009 (RBAC — Admin/Líder), RN-016 (vocabulário) |
| **Status (App)** | Implementado (`app/skills/page.tsx`) |
| **Componentes-chave** | `admin/SkillsTable` ou `admin/SkillCard`, `admin/SkillFilters`, `admin/SkillsSidebar`, `admin/SkillDrawer`, `solar/FilterPills` |

### 9.2 Propósito

Listar e filtrar todas as Skills configuradas. Persona PX-01 (Líder/Curador). É onde se faz curadoria do catálogo de capacidades de IA.

### 9.3 Layout Estrutural

```
┌──────────────────────────────────────────────────────────────────────────┐
│ APPHEADER · Breadcrumb: Home > Skills · [rightLabel: ADMIN]               │
├────┬─────────────────────────────────────────────────────────────────────┤
│ S  │ ┌──────────┬──────────────────────────────────────────────────────┐│
│ I  │ │FILTERS   │ TOOLBAR                                              ││
│ D  │ │SIDEBAR   │ [🔍 Buscar Skills]  [Tipo▼] [Status▼]  [+ Nova Skill]││
│ E  │ │          ├──────────────────────────────────────────────────────┤│
│ B  │ │Tipo:     │ ┌────────────────────────────────────────────────────┐│
│ A  │ │☑ Criação │ │ SKILLSTABLE                                        ││
│ R  │ │☑ Mídia   │ │ ┌─────┬─────────┬──────┬──────┬──────┬─────┬────┐ ││
│ 40 │ │☐ Planej. │ │ │Tipo │Nome     │Modelo│Score │Moons │Cli. │... │ ││
│    │ │          │ │ ├─────┼─────────┼──────┼──────┼──────┼─────┼────┤ ││
│    │ │Status:   │ │ │ ●   │Copy Soc.│G.Flsh│ 4.6  │  3   │  5  │ ▸  │ ││
│    │ │☑ Ativo   │ │ │ ●   │Brief Bld│GPT-4o│ 4.2  │  2   │  8  │ ▸  │ ││
│    │ │☐ Rasc.   │ │ └─────┴─────────┴──────┴──────┴──────┴─────┴────┘ ││
│    │ │          │ └────────────────────────────────────────────────────┘│
│    │ │Cliente   │                                       [Drawer abre →] │
│    │ │[chips]   │                                                       │
│    │ └──────────┘                                                       │
└────┴─────────────────────────────────────────────────────────────────────┘
```

### 9.4 Especificação de Elementos

#### 9.4.1 AppHeader

| Propriedade | Valor |
|-------------|-------|
| Breadcrumb | `Home > Skills` (último com dot Sun) |
| rightLabel | "ADMIN" — pill uppercase tag (font 0.6rem, letter-spacing 0.12em, border subtle) |

#### 9.4.2 FilterSidebar (esquerda) — `admin/SkillsSidebar.tsx`

| Seção | Tipo | Comportamento |
|-------|------|---------------|
| Tipo | Checkboxes (Criação · Mídia · Planejamento) com dot da cor | Multi-select |
| Status | Checkboxes (Ativo · Rascunho · Arquivado) | Multi-select |
| Cliente associado | Multi-select chips com cor do cliente | Filtro acumulativo |

Filtros ativos viram chips removíveis no topo da Toolbar.

#### 9.4.3 Toolbar

| Elemento | Especificação |
|----------|---------------|
| Search input pill | radius 9999px · ícone `Search` 13px à esquerda · placeholder *"Buscar Skills..."* · busca por nome + tags |
| Filtros suplementares | Dropdowns Tipo / Status (redundantes ao Sidebar para acesso rápido) |
| CTA Primary | "+ Nova Skill" — Primary pill · navega para `/skills/new` (T-12) |

#### 9.4.4 SkillsTable / SkillCards

**Tabela densa default:**

| Coluna | Conteúdo |
|--------|----------|
| Tipo | Dot 8px da cor do tipo |
| Nome | Texto + pequeno hint do system prompt (Caixa-preta — só preview) |
| Modelo | Badge com nome do LLM (Gemini Flash · GPT-4o · Claude) |
| Score HITL | Estrela + valor (X.X / 5) |
| Moons | Contador |
| Clientes | Contador + 3 dots de cor (overflow indicator se >3) |
| Última edição | "há 2d" |
| Versão | "v5" |
| Ações | Icon buttons inline (`MoreHorizontal` 14px) |

**Comportamento:**
- Click em row → abre `SkillDrawer` à direita (480px)
- Hover row → bg `--surface-hover`
- Row sticky: header da tabela com bg `--deep` e borda inferior

#### 9.4.5 SkillDrawer (right)

| Tab | Conteúdo |
|-----|----------|
| Identidade | Nome, tipo, descrição, ícone |
| Configuração | Modelo, temperatura, system prompt (preview truncado — Caixa-preta para non-Admin) |
| Moons | Lista das Moons configuradas |
| Clientes | Lista dos clientes onde a Skill aparece |

CTAs no Drawer: `[Editar (primary)] [Duplicar] [Arquivar]` → navega para `/skills/[skillId]` (T-11)

### 9.5 Estados

| Estado | Tratamento |
|--------|------------|
| Loading | 6 Skeletons no formato de row (height 48px cada) |
| Empty | EmptyState centralizado · ícone `Sparkles` 48px · "Nenhuma Skill cadastrada" · CTA "Criar primeira Skill" |
| Sem resultados | "Nenhuma Skill encontrada para os filtros aplicados" · CTA "Limpar filtros" |
| Error | Banner topo `--destructive` · "Erro ao carregar Skills" · botão "Tentar de novo" |

### 9.6 Interações

| Evento | Resultado |
|--------|-----------|
| Click em row | Abre SkillDrawer right |
| Click "Editar" no Drawer | Navega para `/skills/[skillId]` (T-11) |
| Click chip de filtro ativo | Remove filtro |
| ⌘K (futuro) | Abre Command Palette com sugestão "Nova Skill" |

### 9.7 RN/FR aplicados

- **RN-009** — bloqueia Operacional via redirect 302 (rota Admin)
- **RN-016** — vocabulário "Skill" (não "capacidade", não "AI agent")

---

## 10. T-13 — Biblioteca Admin: Catálogo (Caixa-preta)

### 10.1 Metadados

| Atributo | Valor |
|----------|-------|
| **ID** | T-13 |
| **Nome** | Biblioteca Admin — Catálogo |
| **Feature** | FA-12 + FA-01 |
| **Rota** | `/biblioteca` (Admin/Líder apenas) |
| **Prioridade** | P0 |
| **Jornadas** | JN-01 (Curadoria), JN-05 (Captura proativa) |
| **FRs** | FR-100 a FR-108 (FA-01) |
| **RNs** | **RN-011 (Caixa-preta TOTAL para Operacional)**, RN-009 (RBAC), RN-006 (validação metadados) |
| **Status (App)** | Implementado |
| **Componentes-chave** | `biblioteca/BibliotecaTable`, `biblioteca/BibliotecaSidebar`, `biblioteca/ScopePills`, `biblioteca/BibliotecaModal`, `biblioteca/BibliotecaDrawer`, `biblioteca/FileTypeIcon`, `biblioteca/TagInput` |

### 10.2 Propósito

Curar a **Inteligência Coletiva** da Suno. Listar KnowledgeItems com filtros por escopo (Suno global vs. cliente específico), tags, tipo de arquivo, domínio. Persona PX-01.

> **CRÍTICO RN-011:** Esta tela é **invisível** para Operacional — não aparece em Sidebar, Breadcrumbs, Cmd+K, busca, ou copy do Chat. URL direta retorna **redirect 302 para `/`** com toast genérico (sem revelar a existência do recurso).

### 10.3 Layout Estrutural

```
┌──────────────────────────────────────────────────────────────────────────┐
│ APPHEADER · Breadcrumb: Home > Biblioteca · [ADMIN]                      │
├────┬─────────────────────────────────────────────────────────────────────┤
│ S  │ ┌──────────┬──────────────────────────────────────────────────────┐│
│ I  │ │FILTERS   │ SCOPEPILLS (multi-select por cliente)                ││
│ D  │ │          │ [● Suno Global] [● Vivo] [● Americanas] [● Sicredi]…  ││
│ E  │ ├──────────┤                                                       ││
│ B  │ │Tags:     │ TOOLBAR                                              ││
│ A  │ │[chips]   │ [🔍 Busca semântica]    [Filtros] [+ Adicionar]      ││
│ R  │ │          ├──────────────────────────────────────────────────────┤│
│ 40 │ │Tipo arq. │ ┌────────────────────────────────────────────────────┐│
│    │ │☑ PDF     │ │ BIBLIOTECATABLE                                    ││
│    │ │☑ DOCX    │ │ ┌────┬──────────┬────────┬──────┬──────┬───────┐  ││
│    │ │☐ MP3/4   │ │ │Tipo│Título    │Escopo  │Tags  │Owner │Edit.  │  ││
│    │ │          │ │ ├────┼──────────┼────────┼──────┼──────┼───────┤  ││
│    │ │Domínio:  │ │ │PDF │Brief Vivo│●Vivo   │ … 5  │ HM   │  3d   │  ││
│    │ │○ cliente │ │ │MP3 │Reunião X │●Suno   │ … 3  │ BR   │  1d   │  ││
│    │ │○ ind.    │ │ └────┴──────────┴────────┴──────┴──────┴───────┘  ││
│    │ │○ cult.   │ └────────────────────────────────────────────────────┘│
│    │ │          │                                       [Drawer abre →] │
│    │ │Status    │                                                       │
│    │ └──────────┘                                                       │
└────┴─────────────────────────────────────────────────────────────────────┘
```

### 10.4 Especificação de Elementos

#### 10.4.1 ScopePills — `biblioteca/ScopePills.tsx`

| Propriedade | Valor |
|-------------|-------|
| Layout | Pills horizontais com scroll em mobile |
| Pill default | border `--border-subtle` · texto `--text-muted` · dot 6px da cor do cliente |
| Pill ativa | border colorida + bg `${clientColor}18` + texto colorido + `aria-pressed="true"` |
| "Suno Global" | Sempre primeira pill · cor `--sun` |
| Multi-select | Permite múltiplos escopos ativos simultaneamente |

#### 10.4.2 FilterSidebar — `biblioteca/BibliotecaSidebar.tsx`

| Filtro | Tipo |
|--------|------|
| Tags | TagInput com sugestões + chips removíveis |
| Tipo de arquivo | Checkboxes (PDF · DOCX · TXT · MP3 · MP4 · JPG · PNG) com `FileTypeIcon` colorido por tipo |
| Domínio | Radio (cliente · indústria · cultura · metodologia · referência) |
| Status | Checkboxes (Ativo · Arquivado) |

#### 10.4.3 Toolbar

| Elemento | Especificação |
|----------|---------------|
| Search semântica | Input pill com placeholder *"Buscar por significado..."* (busca semântica via embeddings — FR-104) |
| CTA Primary | "+ Adicionar" — abre BibliotecaModal (T-14) |

#### 10.4.4 BibliotecaTable

| Coluna | Conteúdo |
|--------|----------|
| Tipo | `FileTypeIcon` (cor por extensão: PDF=#EF4444 · JPG=#10B981 · MP3=#F59E0B · MP4=#8B5CF6) |
| Título | Texto + ícone de status processamento (em fila / processando / pronto) |
| Escopo | Chip(s) com dot de cor do cliente |
| Tags | Chips truncados em 3 + "..." overflow |
| Owner / Contribuinte | Avatar + iniciais |
| Última edição | "há Xd" em `--text-muted` |
| Ações inline | `MoreHorizontal` 14px → Editar / Arquivar / Deletar |

#### 10.4.5 BibliotecaDrawer (T-15)

Abre on click row · 480px width:
- Preview do conteúdo (extrato/snippet do PDF/transcrição)
- Metadados completos
- Histórico de acessos/contribuintes (alimenta RN-008 — detecção de risco)
- CTAs: `[Editar]` `[Arquivar]` `[Deletar]`

### 10.5 Estados

| Estado | Tratamento |
|--------|------------|
| **Loading** | 6 Skeletons em formato row |
| **Empty (zero items)** | EmptyState · ícone `BookOpen` 48px · "Comece a Inteligência Coletiva" · CTA "Adicionar primeiro item" |
| **Item processando (FR-100)** | Linha com pill orange "Processando..." + barra de progresso pequena |
| **Conhecimento em risco (RN-008)** | Linha com chip vermelho "⚠ Único contribuinte" → click abre T-16 |
| **Operacional acessa /biblioteca diretamente** | **Redirect 302 para `/`** + toast genérico "Página não disponível" (não revela existência) |

### 10.6 Interações

| Evento | Resultado |
|--------|-----------|
| Click em row | Abre BibliotecaDrawer (T-15) |
| Click "+ Adicionar" | Abre BibliotecaModal (T-14) |
| Drag-and-drop arquivo no body | Abre BibliotecaModal já com arquivo selecionado |
| Click em ScopePill | Toggle ativo; re-filtra tabela |
| Click em chip de filtro ativo | Remove filtro |
| Click em ⚠ chip "risco" | Filtra por "Conhecimento em risco" → leva a T-16 |

### 10.7 RN/FR aplicados

- **RN-011 (TOTAL)** — invisível para Operacional · redirect 302 · linguagem neutralizada no Chat
- **RN-006** — validação metadados em T-14 (≥2 tags, descrição ≥50 char, domínio obrigatório)
- **RN-008** — destaque visual de itens com único contribuinte
- **RN-016** — vocabulário "Biblioteca" (não "knowledge base", não "repositório")
- **FR-100/FR-101/FR-102** — ingestão multimodal · validação · indexação dual

---

## 11. T-24 — Mensuração: Dashboard Executivo

### 11.1 Metadados

| Atributo | Valor |
|----------|-------|
| **ID** | T-24 |
| **Nome** | Mensuração — Dashboard Executivo Mensal |
| **Feature** | FA-10 (Mensuração) |
| **Rota** | `/mensuracao` |
| **Prioridade** | P1 (Piloto) |
| **Jornadas** | JN-08 (Governança e demonstração de valor) |
| **FRs** | FR-144 a FR-150 |
| **RNs** | RN-005 (geração + flagging), RN-009 (Admin/Líder), RN-018 (custo evitado), RN-019 (homogeneização), RN-020 (bloqueio satisfação isolada) |
| **Status (App)** | A construir |
| **Componentes-chave** | `MensuracaoLayout`, `KPICard`, `TrendChart`, `DiversityChart`, `ExportButton` (todos a criar) |

### 11.2 Propósito

**Dashboard mensal para Diretoria** (RN-005). Persona PX-01 — apresenta a Guga em reuniões semanais. Sustenta o **business case** do sunOS com evidências defensáveis: custo evitado, score HITL, volume, KPIs de negócio, diversidade coletiva.

### 11.3 Layout Estrutural

```
┌──────────────────────────────────────────────────────────────────────────┐
│ APPHEADER · Breadcrumb: Home > Mensuração · [ADMIN]                      │
├────┬─────────────────────────────────────────────────────────────────────┤
│ S  │ HEADER PERÍODO                                                       │
│ I  │ [Abril 2026 ▼]   [↻ Atualizar]            [⬇ Exportar relatório]    │
│ D  │ ────────────────────────────────────────────────────────────────────│
│ E  │ KPI CARDS (top row — 4 cards)                                       │
│ B  │ ┌─────────────┬─────────────┬─────────────┬─────────────┐          │
│ A  │ │ Custo evit. │ Skills saud │ Score HITL  │ Volume exec │          │
│ R  │ │ R$ 487k    │   83% ▲     │  4.5 / 5    │  2.847 ▲   │          │
│ 40 │ │  ▲ 12%     │             │  ▲ 0.2      │  ▲ 18%     │          │
│    │ └─────────────┴─────────────┴─────────────┴─────────────┘          │
│    │                                                                     │
│    │ KPIS DE NEGÓCIO (FA-10-05)                                         │
│    │ Win Rate · Shortlist Rate · Retenção de Seniores                   │
│    │                                                                     │
│    │ TENDÊNCIAS (12 meses)                                              │
│    │ ┌──────────────────────────────────────────────────────────────┐   │
│    │ │ [LineChart com flag visual quando KPI varia >25% (RN-005)]   │   │
│    │ └──────────────────────────────────────────────────────────────┘   │
│    │                                                                     │
│    │ TABELA "136 ATIVIDADES" (FA-10-07)                                 │
│    │ Cobertura: 62/136 · Próxima ondada: …                              │
│    │                                                                     │
│    │ ALERTAS ATIVOS                                                      │
│    │ [→ Conhecimento em risco (T-16)] [→ Homogeneização (T-26)]         │
│    │                                                                     │
└────┴─────────────────────────────────────────────────────────────────────┘
```

### 11.4 Especificação de Elementos

#### 11.4.1 Header de período

| Elemento | Especificação |
|----------|---------------|
| Seletor de mês | Dropdown com últimos 12 meses; M-1 e M-2 disponíveis sempre |
| Botão atualizar | Ícone `RefreshCw` 14px · força recálculo |
| Botão exportar | "Exportar relatório" Primary pill · gera PDF/PPTX |

#### 11.4.2 KPICard (componente a criar)

| Propriedade | Valor |
|-------------|-------|
| Container | bg `--deep` · border 1px subtle · radius 12px · padding 16px |
| Label | uppercase 0.6rem letter-spacing 0.08em em `--text-muted` |
| Valor primário | font-size 1.75rem weight 600 em `--text-primary` |
| Delta vs. mês anterior | "▲ 12%" (verde `--planejamento`) ou "▼ 5%" (vermelho `#EF4444`) — neutro `--text-muted` |
| Sparkline mini | 12 últimos pontos · stroke 1.5px da cor do KPI |
| Flag de atenção (RN-005) | Badge "⚠ atenção" laranja se variação >25% mensal · tooltip com explicação obrigatória |

#### 11.4.3 TrendChart (a criar)

| Propriedade | Valor |
|-------------|-------|
| Tipo | Line chart (recharts ou similar) |
| Eixos | Mês (X) · valor do KPI (Y) |
| Cor da linha | `--sun` (KPI principal) ou cor por categoria |
| Grid | `--border-subtle` (auto-adapta dark/light) |
| Tooltip | bg `--deep` · border subtle · valor + delta |
| Animação | Linha desenha em 600ms ease-out no first-load |
| Flag visual (RN-005) | Marker no ponto onde KPI variou >25% · cor warning |

#### 11.4.4 DiversityChart (link para T-26)

3 gráficos lado a lado: Mean Pairwise Cosine Distance · Self-BLEU · Compression Ratio
- Status agregado: Verde (estável) · Amarelo (atenção) · Vermelho (alerta)

#### 11.4.5 ExportButton

| Comportamento | Especificação |
|----------------|---------------|
| Click | Dropdown com formatos: PDF · PPTX · CSV |
| Validação RN-020 | Se relatório contém apenas satisfação isolada → bloqueia + mensagem "Inclua diversidade coletiva (Mean Pairwise Cosine Distance, Self-BLEU, Compression Ratio) para gerar este relatório" |
| Loading | Spinner inline · "Gerando relatório..." |
| Done | Toast "Relatório pronto · download iniciado" |

### 11.5 Estados

| Estado | Tratamento |
|--------|------------|
| **Loading** | Skeletons em formato de KPICards + chart placeholders |
| **Empty (mês sem dados)** | EmptyState "Sem dados para este período" · CTA "Mudar período" |
| **Flag de atenção (>25%)** | KPI Card com badge ⚠ + tooltip explicativo; mensagem destacada no header |
| **Bloqueio RN-020** | Banner topo amarelo "Relatório bloqueado: inclua métricas de diversidade coletiva" |

### 11.6 Interações

| Evento | Resultado |
|--------|-----------|
| Click em KPICard | Drill-down: navega para T-25 (Skill Health) ou T-26 (Homogeneização) conforme contexto |
| Click "Exportar" | Dropdown formatos · gera arquivo · validação RN-020 |
| Hover em ponto do TrendChart | Tooltip com valor + delta + data |
| Click "Conhecimento em risco" | Navega para T-16 |

### 11.7 RN/FR aplicados

- **RN-005** — geração mensal automática até dia 5 + flag >25% mensal
- **RN-018** — custo evitado calculado por skill execução
- **RN-019** — diversidade coletiva sempre presente
- **RN-020** — **bloqueia** export com satisfação isolada
- **FR-144** — geração agendada · **FR-150** — exportação para Diretoria

---

## 12. T-27 — Onboarding por Carreira

### 12.1 Metadados

| Atributo | Valor |
|----------|-------|
| **ID** | T-27 |
| **Nome** | Onboarding — Track por Carreira |
| **Feature** | FA-11 (Safety Cultural) |
| **Rota** | `/onboarding` |
| **Prioridade** | P1 (Piloto) |
| **Jornadas** | JN-09 (Onboarding novo Creator) |
| **FRs** | FR-154, FR-155 |
| **RNs** | RN-017 (sugestão de track por carreira), RN-016 (vocabulário) |
| **Status (App)** | A construir |
| **Componentes-chave** | `OnboardingWizard`, `OnboardingStep`, `OnboardingTrackCard` (todos a criar) |

### 12.2 Propósito

Primeiro contato do Creator com o sunOS. **Sugere track** conforme estágio (RN-017): junior → "Estou começando uma ideia"; sênior → "Me prova que tá errada"; pleno → escolhe. Preserva autonomia (sugere, não impõe). Persona principal PX-05 (Junior); também PX-02 e champions.

### 12.3 Layout Estrutural (Wizard 3 passos)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ APPHEADER · sem breadcrumb (first-run sem AppShell completo)              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│ ●━━━○━━━○   (progress wizard 1/3)                                       │
│                                                                          │
│ PASSO 1: BOAS-VINDAS (manifesto Suno)                                   │
│ ┌──────────────────────────────────────────────────────────────────────┐│
│ │  ✦ Bem-vindo ao sunOS                                                ││
│ │                                                                       ││
│ │  Aqui não otimizamos. Devoramos.                                     ││
│ │  Não geramos. Provocamos.                                             ││
│ │  Não buscamos eficiência. Buscamos Faísca.                           ││
│ │                                                                       ││
│ │  [Continuar →]                                                        ││
│ └──────────────────────────────────────────────────────────────────────┘│
│                                                                          │
│ PASSO 2: SUA EXPERIÊNCIA                                                │
│   Tempo de carreira: [0-2] [3-5] [6-9] [10+]                            │
│   Área: [Criação] [Mídia] [Planejamento] [Outros]                       │
│                                                                          │
│ PASSO 3: TRACK SUGERIDA                                                 │
│   ┌──────────────────────┐  ┌──────────────────────┐                   │
│   │ ★ SUGERIDA PARA VOCÊ │  │                      │                   │
│   │ Estou começando      │  │ Me prova que         │                   │
│   │ uma ideia            │  │ tá errada            │                   │
│   │ (divergente)         │  │ (devil's advocate)   │                   │
│   └──────────────────────┘  └──────────────────────┘                   │
│                                                                          │
│           [Voltar]                              [Começar a Devorar →]    │
└──────────────────────────────────────────────────────────────────────────┘
```

### 12.4 Especificação de Elementos

#### 12.4.1 Wizard progress

| Propriedade | Valor |
|-------------|-------|
| Estilo | 3 dots horizontais conectados por linha · ativo `--sun` · concluído `--planejamento` · próximo `--text-muted` |
| Posição | Topo · centralizado |
| `aria-current` | `"step"` no atual |

#### 12.4.2 Passo 1 — Boas-vindas (Manifesto Suno)

| Elemento | Valor |
|----------|-------|
| Layout | Hero centralizado · max-width 600px |
| Título | "Bem-vindo ao sunOS" font-size 2rem weight 300 |
| Manifesto | Texto editorial em 3 linhas com vocabulário Suno (RN-016): *"Aqui não otimizamos. Devoramos."* etc. |
| CTA | "Continuar" Primary pill |

#### 12.4.3 Passo 2 — Experiência

| Campo | Tipo |
|-------|------|
| Tempo de carreira | Pills exclusivas (radio): "0-2 anos" · "3-5 anos" · "6-9 anos" · "10+ anos" |
| Área | Pills exclusivas: Criação · Mídia · Planejamento · Outros |

Botões: `[Voltar]` (Ghost) · `[Continuar →]` (Primary)

#### 12.4.4 Passo 3 — Track sugerida

| Card | Quando sugerido |
|------|------|
| **"Estou começando uma ideia"** (divergente) | Junior (<3 anos) |
| **"Me prova que tá errada"** (devil's advocate) | Sênior (≥7 anos) |
| Ambos visíveis | Pleno (3-7 anos) |

| Propriedade do Card | Valor |
|---------------------|-------|
| Container | bg `--deep` · border 1px subtle · radius 12px · padding 24px · cursor pointer |
| Sugerida | Border `--sun` 2px · badge "★ SUGERIDA PARA VOCÊ" no topo |
| Hover | border-color → `--twilight` |
| Selecionada | bg `rgba(255,200,1,0.06)` · border `--sun` |
| Texto | Título da track + descrição curta |

CTAs: `[Voltar]` · `[Começar a Devorar →]` (Primary, vocabulário Suno)

### 12.5 Estados

| Estado | Tratamento |
|--------|------------|
| **First-run** | Sem AuthGuard de Onboarding — chega aqui após login |
| **Já completado** | URL direta `/onboarding` mostra mensagem "Você já fez o onboarding · [Ir para o Sun]" + opção "Refazer" |
| **Validation no passo 2** | Se algum campo não selecionado, CTA disabled |
| **Loading no submit** | Spinner inline + "Configurando seu sunOS..." |

### 12.6 Interações

| Evento | Resultado |
|--------|-----------|
| Click "Continuar" passo 1 | Avança para passo 2 com fade slide-left 200ms |
| Click "Continuar" passo 2 | Calcula track sugerida baseado nos inputs (RN-017) e avança |
| Click no card de track | Seleciona (radio) |
| Click "Começar a Devorar" passo 3 | Persiste track no perfil; redireciona para T-02 (Sun); mostra tooltip de boas-vindas no Sun |
| Click "Voltar" | Retorna passo anterior preservando inputs |

### 12.7 Mobile vs. Desktop

| Breakpoint | Mudanças |
|------------|----------|
| Mobile | Wizard ocupa 100vw - 32px · cards de track empilhados verticalmente |
| Desktop | Cards lado a lado |

### 12.8 RN/FR aplicados

- **RN-017** — sugestão por estágio · respeita escolha livre
- **RN-016** — manifesto com vocabulário Suno; proibido "otimizar / eficiência / accelerator"
- **FR-154** — wizard 3 passos · **FR-155** — track persistida no perfil

---

## 12.5. T-29 — Aprovação: Inbox do Aprovador

### 12.5.1 Metadados

| | |
|---|---|
| **Rota** | `/aprovacoes` |
| **Estado** | a construir |
| **Persona primária** | PX-06 (Aprovador Sócio) |
| **Persona secundária** | PX-01 (Líder em níveis intermediários) |
| **Feature** | FA-13 |
| **Aggregates** | DO-43 ApprovalRequest, DO-44 ApprovalChain, DO-46 ValidationReport |
| **Endpoints** | API-131 (`GET /api/approval/inbox`) |
| **FRs cobertos** | FR-162, FR-164 |

### 12.5.2 Propósito

Caixa de entrada onde o aprovador (sócio) vê todas as `ApprovalRequest`s aguardando decisão dele em primeira leitura. Pelo design do Guga, é um **lugar de fricção produtiva** — o aprovador não está aqui para aprovar tudo no automático; está para garantir qualidade antes de chegar ao cliente.

### 12.5.3 Layout Estrutural (Desktop)

```
┌────────────────────────────────────────────────────────────────────┐
│ AppHeader                                                          │
├──────────┬─────────────────────────────────────────────────────────┤
│ Sidebar  │ ┌─ Page Header ──────────────────────────────────────┐ │
│ (nav)    │ │ Aguardando sua aprovação           [filtros: ▾▾▾] │ │
│          │ └────────────────────────────────────────────────────┘ │
│          │                                                         │
│          │ ┌─ Card 1 (URGENTE — vence em 6h) ────────────────────┐│
│          │ │ [Vivo•] Faísca   "Tequila do Sertão..."    Round 1 ││
│          │ │ Submetido por Cintia · há 18h                       ││
│          │ │ Validação: ⚠ Atenção (2 warnings · 0 errors)        ││
│          │ │                                  [Revisar →]        ││
│          │ └─────────────────────────────────────────────────────┘│
│          │ ┌─ Card 2 ────────────────────────────────────────────┐│
│          │ │ ...                                                  ││
│          │ └─────────────────────────────────────────────────────┘│
│          │                                                         │
└──────────┴─────────────────────────────────────────────────────────┘
```

### 12.5.4 Especificação de Elementos

#### 12.5.4.1 PageHeader

- Title `h1` "Aguardando sua aprovação" (24px / 600)
- Filter Group (à direita): MultiSelect Cliente · MultiSelect Tipo (`spark`/`turn`/`workflow_output`) · Select Validação (`Validado`/`Atenção`/`Bloqueado`) · Toggle "Apenas urgentes (SLA < 12h)"
- Counter inline: "12 pendentes" (atualiza com filtro)

#### 12.5.4.2 ApprovalCard (componente NOVO — `components/approval/ApprovalCard.tsx`)

Layout: card 12px radius, 16px padding, hover lifts (`box-shadow` sobe para `0 4px 12px rgba(0,0,0,0.18)`), cursor pointer.

| Slot | Conteúdo |
|------|----------|
| Top-left | Chip Cliente (cor do Planeta + slug) |
| Top-right | Chip Round (`1ª`/`2ª`/`3ª` — 3ª em vermelho âmbar) |
| Title | `subject_summary` (2 linhas, ellipsis) |
| Meta | "Submetido por [Avatar+Nome] · [tempo relativo]" |
| Validation Badge | Chip colorido grande (`Validado pela IA` verde / `Atenção (X warnings)` âmbar / `Bloqueado (X errors)` vermelho) — RN-014 marca visual |
| SLA | Texto secundário "vence em 6h" (vermelho se < 4h) |
| Action | Botão `Revisar →` (primary, alinhado à direita) |

#### 12.5.4.3 EmptyState

- Ilustração discreta (linhas finas — não emoji)
- Texto "Nada pendente. Bom trabalho." (16px / 400, muted)
- Sem CTA

### 12.5.5 Estados

| Estado | Comportamento |
|--------|---------------|
| Loading | 3 skeletons de card |
| Vazio (sem filtro) | EmptyState |
| Vazio (com filtro) | "Nenhuma submissão atende aos filtros" |
| Erro | Inline error + retry |

### 12.5.6 Interações

- Click no card → navega para T-30 (`/aprovacoes/[requestId]`)
- Auto-refresh polling a cada 30s (ASS-API-08); badge "Novidades (N)" aparece se houver novas requests durante a sessão; click recarrega
- Hover no card → lift sutil
- Filtros são aplicados via query params (URL stateful — permite share)

### 12.5.7 Mobile vs. Desktop

| Mobile | Cards full width; filtros viram sheet bottom |
| Desktop | Cards 100% da column; filtros inline no header |

### 12.5.8 RN/FR aplicados

- **RN-024** (humano obrigatório) — sem nenhum auto-approve aqui
- **RN-026** (chain configurável) — request só aparece se `current_level_order` corresponde ao aprovador
- **RN-014** (marca visual) — Validation Badge sempre visível e colorida
- **RN-011** (Caixa-preta) — Operacional sem chain ativa: rota retorna 404
- **FR-162**, **FR-164**

---

## 12.6. T-30 — Aprovação: Detalhe da Submissão

### 12.6.1 Metadados

| | |
|---|---|
| **Rota** | `/aprovacoes/[requestId]` |
| **Estado** | a construir |
| **Persona primária** | PX-06 (Aprovador) |
| **Persona secundária** | PX-01, PX-02, PX-03 (submitter pode acompanhar status) |
| **Feature** | FA-13 |
| **Aggregates** | DO-43, DO-44, DO-45, DO-46, DO-55 ValidatedStamp |
| **Endpoints** | API-132, API-133, API-134, API-136 |
| **FRs cobertos** | FR-163, FR-165, FR-166, FR-167, FR-169 |

### 12.6.2 Propósito

Tela onde o aprovador toma decisão. Apresenta tudo o que ele precisa para julgar: subject completo (com inline highlights dos findings), ValidationReport detalhado, chain visualization, histórico de decisões anteriores, CTAs de decisão. Inspirada em PR review do GitHub mas com vocabulário e tokens Suno.

### 12.6.3 Layout Estrutural (Desktop 2 colunas)

```
┌──────────────────────────────────────────────────────────────────────┐
│ Header sticky: Vivo•  Faísca "Tequila do Sertão"  Round 1  ⏱ 6h    │
├─────────────────────────────────┬────────────────────────────────────┤
│ Subject Preview                 │ Validators                          │
│ (~70% width)                    │ ┌─────────────────────────────┐   │
│                                 │ │ Brand Validator [v1.2.0]     │   │
│ "Vamos beber Tequila do Sertão" │ │ ⚠ Tom muito coloquial...     │   │
│ ↑ inline highlight no span      │ │ ⚠ Marca não usa primeira     │   │
│                                 │ │   pessoa em campanhas Pre... │   │
│                                 │ └─────────────────────────────┘   │
│                                 │ ┌─────────────────────────────┐   │
│                                 │ │ Português Validator [v1.0.5] │   │
│                                 │ │ ✓ Sem findings               │   │
│                                 │ └─────────────────────────────┘   │
│                                 │                                     │
│                                 │ Chain                               │
│                                 │ ✓ Cintia → ▶ Você → Guga           │
│                                 │                                     │
├─────────────────────────────────┴────────────────────────────────────┤
│ Footer sticky: [Aprovar]  [Solicitar ajustes]  [Reprovar]            │
└──────────────────────────────────────────────────────────────────────┘
```

### 12.6.4 Especificação de Elementos

#### 12.6.4.1 Header (sticky top)

- Cliente (Planeta + slug + cor)
- Tipo (`spark`/`turn`/`workflow_output`) — chip
- Submitter (Avatar+Nome)
- Round (`1ª`/`2ª`/`3ª`)
- SLA countdown — vermelho se < 4h

#### 12.6.4.2 Subject Preview (coluna principal)

Renderização rica do `subject_snapshot`:
- **Spark** → FaiscaCard expandido (reuso do componente `FaiscaCard.tsx` em modo `read-only-preview`)
- **Turn** → ChatTranscriptPreview (transcript estilo T-05)
- **Workflow output** → MarkdownRenderer

**Inline highlights** (componente `FindingHighlight.tsx` NOVO):
- Spans dos findings recebem `text-decoration: underline wavy` colorido por severidade
- Hover/click no span → tooltip com `message` + `suggestion` + scroll suave para o card do finding na coluna lateral

#### 12.6.4.3 Validators panel (coluna lateral — sticky)

Para cada validator, card expansível:
- Header: nome do validator + chip da versão pinned (clicável → modal com prompt fingerprint)
- Findings agrupados por severidade (errors → warnings → infos)
- Cada finding: ícone severity + message + (se houver) `suggestion` em bloco code-style + chip "ver no texto" que scrolla para o span

#### 12.6.4.4 Chain Visualization (componente `ApprovalChainStepper.tsx` NOVO)

Stepper horizontal:
- Cada nó: `Avatar + Nome (ou Role) + Status` (✅ aprovado / ⏳ pendente / 🔄 ajustes solicitados / ◻ ainda não chegou)
- Linha conectora: cinza para pendente, sun-yellow para current, green para aprovado
- Click no nó já decidido → tooltip com decisão + comentário + `decided_at`

#### 12.6.4.5 Histórico de Decisões (acordeão — colapsado por default; expande se `current_round > 1`)

- Timeline vertical
- Cada item: aprovador + decisão + comentário + timestamp
- Útil em rounds > 1 para entender o que mudou

#### 12.6.4.6 Footer Sticky CTAs

- `Aprovar` (primary verde — `bg: var(--success)`) — abre modal de confirmação
- `Solicitar ajustes` (secondary âmbar) — abre modal com textarea (comment obrigatório, min 20 char)
- `Reprovar` (destructive — outline vermelho) — abre modal com textarea (comment obrigatório)
- **Modal de confirmação `Solicitar ajustes` em round 3**: banner âmbar "Esta é a 3ª rodada — solicitar ajustes encerrará a submissão como expirada (RN-025). Recomendado: aprovar com ressalvas ou reprovar."

### 12.6.5 Estados

| Estado | Comportamento |
|--------|---------------|
| Loading | Skeleton 2 colunas + footer dim |
| 403 (não-aprovador) | Redirect para `/` + toast "Sem permissão" |
| Decisão já tomada | Header ganha carimbo verde "Aprovado por X em DD/MM" ou cinza "Reprovado por X"; CTAs ocultos; banner read-only |
| EXPIRED | Banner cinza "Submissão expirou após 3 rodadas" + read-only |
| Submetendo decisão | Footer mostra spinner; CTAs disabled |
| Erro 409 | Toast "Status mudou — recarregue" |

### 12.6.6 Interações

- Click span finding → scroll suave + pulse highlight no card do finding
- Click finding card → scroll suave para span no Subject Preview
- `Aprovar` → modal "Aprovar e enviar `Validado/Aprovado` ao subject?" (Sim/Cancelar)
- `Solicitar ajustes`/`Reprovar` → modal com textarea (comment) + opcional anexos (TODO-API-12) → `POST /api/approval/requests/{id}/decide`
- Após decisão final aprovada: animação ValidatedStamp no Subject Preview (ver UX Parte 5 §5.x — animação "Carimbo Validado")
- Sub-rota Admin `/aprovacoes/configuracao/[clientSlug]` (link discreto no header se Admin/Líder): vai para tela de config de chain (FR-168 — fora deste spec)

### 12.6.7 RN/FR aplicados

- **RN-023** (validators paralelos — visíveis no painel)
- **RN-024** (humano obrigatório — UI sempre exige decisão humana)
- **RN-025** (limite 3 rounds — banner em round 3 + bloqueio)
- **RN-026** (chain configurável — chain visualization mostra a chain ativa)
- **RN-014** (marca visual — Subject preview sempre badge `Validado/Atenção/Bloqueado` + carimbo final)
- **FR-163, FR-165, FR-166, FR-167, FR-169**

---

## 12.7. T-32 — Drive: Sync Dashboard

### 12.7.1 Metadados

| | |
|---|---|
| **Rota** | `/drive/[clientSlug]` |
| **Estado** | a construir |
| **Persona primária** | PX-01 (Líder/Curador) |
| **Feature** | FA-14 |
| **Aggregates** | DO-50 DriveSync, DO-52 OAuthCredential, DO-54 DriveCleanupReport |
| **Endpoints** | API-140, API-141, API-142, API-143, API-149, API-150 |
| **FRs cobertos** | FR-170, FR-171, FR-172, FR-178, FR-179 |

### 12.7.2 Propósito

Painel de controle do `DriveSync` por cliente. Mostra estado da conexão OAcl (read-only), contadores, sincronização, cleanup reports. Reforça visualmente a decisão arquitetural (ADR-009): **"Apenas relatório — sunOS não modifica seu Drive."**

### 12.7.3 Layout Estrutural

```
┌──────────────────────────────────────────────────────────────────────┐
│ AppHeader                                                            │
├──────────┬───────────────────────────────────────────────────────────┤
│ Sidebar  │ Breadcrumb: Drive > Vivo                                  │
│          │ ┌─ Header ──────────────────────────────────────────────┐│
│          │ │ Vivo • Drive Sync           Status: ● Ativo           ││
│          │ └───────────────────────────────────────────────────────┘│
│          │ ┌─ Métricas (3 cards row) ──────────────────────────────┐│
│          │ │ 1432 descobertos │ 1432 indexados │ 87 curados ▸     ││
│          │ └───────────────────────────────────────────────────────┘│
│          │ ┌─ Conexão OAuth ──────────────┐ ┌─ Sincronização ─────┐│
│          │ │ Concedido por:               │ │ Última: há 8min     ││
│          │ │ guga.almeida@vivo.com.br     │ │ Próxima: em 7min    ││
│          │ │ Escopo: 🔒 drive.readonly    │ │ Webhook: há 22min   ││
│          │ │ Folders raiz: 3 [ver]        │ │ [Forçar sync agora] ││
│          │ │ [Reconectar] [Desconectar]   │ └─────────────────────┘│
│          │ └──────────────────────────────┘                         │
│          │ ┌─ Cleanup Reports ─────────────────────────────────────┐│
│          │ │ Banner: "Apenas relatório — sunOS não modifica seu   ││
│          │ │ Drive." (RN-029, ADR-009)                            ││
│          │ │                                                       ││
│          │ │ • Abr/2026 — 12 dup, 5 órfãos, 23 candidatos arquivar││
│          │ │ • Mar/2026 — 8 dup, 3 órfãos, 19 candidatos arquivar ││
│          │ └───────────────────────────────────────────────────────┘│
└──────────┴───────────────────────────────────────────────────────────┘
```

### 12.7.4 Especificação de Elementos

#### 12.7.4.1 Header

- Title: "[Cliente] • Drive Sync"
- StatusChip: `● Ativo` (verde) / `● Pausado` (cinza) / `● OAuth expirado` (vermelho) / `● Erro` (âmbar)

#### 12.7.4.2 Métricas (3 KPI cards)

Cada card 12px radius, padding 16px:
- Número grande (32px / 600)
- Label muted (12px / 500)
- Card "curados" tem chevron + link para `/biblioteca?source=drive&client=[slug]`

#### 12.7.4.3 OAuth Card

- Concedido por (email do cliente — somente leitura)
- Escopo: chip travado `🔒 drive.readonly` — tooltip: "Escopo único permitido (RN-027)"
- Folders raiz: contador + link "ver" → drawer com lista
- CTAs:
  - `Reconectar` (secondary) — abre OAuth flow
  - `Desconectar` (destructive ghost) — modal de confirmação dupla com warning sobre retenção (TODO-DT-09)

#### 12.7.4.4 Sync Card

- Última sync completa (tempo relativo)
- Próxima agendada (tempo relativo)
- Último webhook (tempo relativo)
- CTA `Forçar sync agora` (primary outline) — POST `/api/drive/sync/run`

#### 12.7.4.5 Cleanup Reports Section

- **Banner persistente** (não dismissível): texto "Apenas relatório — sunOS não modifica seu Drive." com ícone info; cor neutra (não alarmante)
- Lista de reports paginada por mês:
  - Header: período (Mês/Ano)
  - 3 contadores inline: duplicatas, órfãos, candidatos a arquivamento
  - CTA `Ver detalhes` → drawer com `details` JSON renderizado em tabelas (Document name + reason + drive_link)

### 12.7.5 Estados

| Estado | Comportamento |
|--------|---------------|
| Loading | Skeletons em todas as seções |
| Sem conexão | Empty state grande no centro: "Drive ainda não conectado" + CTA `Conectar Drive` (POST /api/drive/connect → OAuth flow) |
| OAuth expirado | Banner âmbar persistente no topo + reconectar destacado |
| Erro de sync | Sync card vermelho com `last_error` truncado + tooltip full + CTA `Tentar novamente` |
| Sem cleanup reports | "Nenhum relatório ainda — primeiro será gerado em [data]" |

### 12.7.6 Interações

- `Forçar sync agora` → spinner inline → toast "Sync enfileirado · job [id]" → polling 5s atualiza Sync card até completar
- `Conectar Drive` / `Reconectar` → redirect para `oauth_url` retornado por API-140
- `Desconectar` → modal confirmação dupla → POST API-150 → status muda para PAUSED → banner explicando próximos passos
- Cards de métrica clicáveis (curados → biblioteca filtrada)

### 12.7.7 RBAC

- Admin / Líder do cliente
- Operacional não vê o item no Sidebar nem acessa a rota (RN-011)

### 12.7.8 RN/FR aplicados

- **RN-027** (read-only) — escopo travado visualmente (chip 🔒 não editável)
- **RN-028** (ACL∩RBAC) — não é exposto aqui, mas T-33 e API-145 aplicam o filtro no backend
- **RN-029** (curadoria sugestiva) — banner "Apenas relatório" reforça princípio
- **RN-030** (sync periódico + webhook) — mostrados no Sync card
- **FR-170** (connect), **FR-171** (state), **FR-172** (run), **FR-178** (cleanup reports), **FR-179** (revoke)
- **ADR-009** referenciado no banner

---

## 13. Padrões Compartilhados

### 13.1 Transições entre Telas

| De | Para | Transição | Trigger |
|----|------|-----------|---------|
| T-02 | T-03 | Fade-in 300ms (`page-enter` do `globals.css`) | Click em PlanetNode |
| T-03 | T-04/T-05 | Fade-in 300ms | Click em Skill |
| T-05 | T-06 | Modal slide-in (200ms ease) sobre Chat sem desmontar | Click em CTA "Devorar este briefing" |
| T-06 | T-07 | Modal fade-out (200ms) + Painel slide-in da direita (200ms) | Click "Provocar Faíscas" |
| T-07 | T-09 | Backdrop blur (4px) + Modal scale-in (200ms) · MessageList desfoca | Atinge N stars (RN-015) |
| T-09 | T-05 ou T-07 | Fade-out modal + reset blur · foco volta para MessageList | Click "Continuar" |
| Qualquer | T-01 | Hard redirect (sem AppShell) | Logout |
| T-01 | T-27 ou T-02 | Hard redirect via AuthGuard | First-run? T-27; senão T-02 |

### 13.2 Padrão de Catálogo Admin (T-10, T-13, T-17, T-20)

Layout repetido em todas as Admin areas:

```
AppHeader (Breadcrumb + rightLabel "ADMIN")
+ FilterSidebar (esquerda)
+ Toolbar (Search pill + Filtros + CTA "+ Novo")
+ Table view (default) ou CardGrid (alternativa)
+ Drawer right ao clicar row
+ Modal centrado ao "+ Novo" (opcional — pode ser página dedicada)
```

### 13.3 Padrão de Modal/Drawer (a11y obrigatória)

| Atributo | Modal | Drawer |
|----------|-------|--------|
| `role` | `"dialog"` | `"dialog"` |
| `aria-modal` | `"true"` | `"true"` |
| `aria-label` | Descritivo | Descritivo |
| Backdrop | `rgba(0,0,0,0.6)` | `rgba(0,0,0,0.4)` |
| Click backdrop | Fecha (exceto T-09 — pausa forçada) | Fecha |
| `Esc` | Fecha (exceto T-09) | Fecha |
| Focus trap | Sim | Sim |
| Focus inicial | Botão close ou primeiro campo | Botão close |
| Animação | scale-in 200ms (modal) | slide-in 200ms (drawer) |

### 13.4 Dados Persistidos

| Tela | Persistência | Dados |
|------|--------------|-------|
| T-02 | Backend | Lista de Planetas + QuickStats (TTL 5min) |
| T-05 | Backend (Postgres) | ChatSession + Messages + Feedbacks |
| T-06 | Sessão | Briefing input + modo selecionado (até gerar) |
| T-07 | Backend | Faíscas geradas + stars |
| T-09 | Backend | Resposta reflexiva + skip count (FR-153) |
| T-10/T-13/T-17/T-20 | Backend | Listagens + filtros |
| T-24 | Backend | Snapshot mensal (cache 1h) |
| T-27 | Backend | Track escolhida no perfil + applied flag |
| Tema (dark/light) | localStorage | `theme: "dark" | "light"` |
| Sidebar collapsed | localStorage | `sidebar-state: "open" | "closed"` |

### 13.5 Error Handling Padrão

| Tipo | Exibição | Recovery |
|------|----------|----------|
| Network | Toast destrutivo + botão "Retry" | Retry pelo usuário |
| Validation (form) | Inline field error em `#EF4444` font 0.65rem | Correção pelo usuário |
| LLM error | Banner inline na MessageBubble + botão "Trocar modelo" | Fallback automático sugerido |
| Server 5xx | Banner topo + retry | Auto-retry com backoff exponencial |
| RBAC denied (RN-009) | Redirect 302 + toast genérico (sem revelar recurso) | N/A — proteção |

---

## 14. Componentes a Criar (Lacunas)

Para entregar as telas detalhadas neste documento, o time precisa criar os seguintes componentes (não existem no `components/` atual). Lista priorizada por urgência (POC → Piloto):

### 14.1 Prioridade P0 (POC — Moon Shot e Caixa-preta)

| Componente | Para qual tela | Descrição |
|------------|----------------|-----------|
| **`MoonShotModal`** | T-06 | Modal de acionamento com track por carreira + zona de bisociação |
| **`FaiscaPanel`** | T-07 | Painel sobreposto com streaming de FaiscaCards + counter + persona ativa |
| **`FaiscaCard`** | T-07, T-08 | Card individual de Faísca com 3 scores (Novidade, Coerência, Potencial) + zona + ações |
| **`AgentPersonaBadge`** | T-07 | Badge com persona brasileira (Antropófaga, Carnavalesco, Anciã) |
| **`BisociationZoneBadge`** | T-07 | Pill com zona (Sweet Spot, Adjacente, Radical) |
| **`AIBadge`** (RN-014 — bloqueador Piloto) | T-05, T-07, T-08 (e cross-cutting) | Badge "Faísca / estímulo" → "Validado por humano" para todo output IA |

### 14.1.1 Prioridade P1 (Piloto — Aprovação Hierárquica FA-13 e Drive FA-14)

| Componente | Para qual tela | Descrição |
|------------|----------------|-----------|
| **`ApprovalCard`** | T-29 | Card da inbox com cliente, tipo, validation badge, SLA, CTA Revisar |
| **`ApprovalChainStepper`** | T-30 | Stepper horizontal mostrando níveis da chain (passados/atual/futuros) |
| **`ValidatorFindingsPanel`** | T-30 | Painel lateral com findings agrupados por validator (Brand/Português) |
| **`FindingHighlight`** | T-30 | Inline `<mark>` em spans do subject com hover/click bidirecional ao card de finding |
| **`SubjectPreviewRenderer`** | T-30 | Polimórfico: renderiza spark/turn/workflow_output a partir do subject_snapshot |
| **`DecisionFooter`** | T-30 | Footer sticky com 3 CTAs (Aprovar/Solicitar ajustes/Reprovar) + modais de confirmação |
| **`ValidatedStampOverlay`** | T-30 (animação) | Overlay com animação "carimbo Validado" após APPROVE final (UX Parte 5) |
| **`SubmitForApprovalModal`** | T-31 (modal sobre T-05/T-07/T-23) | Modal leve para submeter output ao fluxo |
| **`DriveSyncStatusCard`** | T-32 | Card de status com chip Ativo/Pausado/OAuth expirado/Erro |
| **`DriveOAuthCard`** | T-32 | Card com email concedente, escopo travado, folders, CTAs reconectar/desconectar |
| **`DriveCleanupReportItem`** | T-32 | Item de lista de cleanup com 3 contadores + drawer de detalhes |
| **`CurationSuggestionCard`** | T-33 | Card de sugestão com kind, payload, confidence, rationale, CTAs Aceitar/Rejeitar |
| **`DriveDocumentPreviewModal`** | T-33 | Modal com preview do conteúdo do Drive (fetch on-demand via API-146) |

### 14.2 Prioridade P1 (Piloto — Safety, Mensuração, Onboarding)

| Componente | Para qual tela | Descrição |
|------------|----------------|-----------|
| **`TimeBoxingTimer`** | T-08 | Timer alternado IA(90s)/Humano(5min) com progress bar e bloqueios cruzados |
| **`RoundsHistory`** | T-08 | Histórico colapsável de rounds anteriores |
| **`ForcedReflectionInterstitial`** | T-09 | Modal de pausa cognitiva com pergunta rotativa + textarea + skip tracking |
| **`OnboardingWizard`** | T-27 | Wizard 3-passos com manifesto + experiência + track |
| **`OnboardingTrackCard`** | T-27 | Card de track selecionável com badge "sugerida" |
| **`MensuracaoLayout`** | T-24, T-25, T-26 | Layout dedicado para Mensuração (mais largo que admin areas) |
| **`KPICard`** | T-24 | Card com label + valor + delta + sparkline + flag de atenção |
| **`TrendChart`** | T-24, T-25 | Line chart 12-meses com flag visual >25% (RN-005) |
| **`DiversityChart`** | T-24, T-26 | 3 gráficos paralelos (Mean Cosine, Self-BLEU, Compression Ratio) |
| **`ExportButton`** | T-24 | Dropdown de formatos com validação RN-020 |
| **`RiscoTable`** | T-16 | Tabela de Conhecimento em Risco (FR-108) |

### 14.3 Prioridade P2 (MVP — Cross-cutting)

| Componente | Para qual tela | Descrição |
|------------|----------------|-----------|
| **`CommandPalette`** | Cross-cutting | Cmd+K com RBAC + Caixa-preta aplicada |
| **`SkipLink`** | Global | "Pular para conteúdo" visível em focus |
| **`ChatHistorySidebar`** | T-05 (refactor P1) | Lista de Sessões anteriores recuperáveis |

---

## 15. Documentos Relacionados

| Documento | Relevância |
|-----------|------------|
| `docs/ux/parte1-inventario-telas.md` | Inventário completo de T-XX (mapeamento Tela ↔ FA ↔ PX ↔ JN) |
| `docs/ux/parte2-arquitetura-informacao.md` | Hierarquia L0-L4 do Sistema Solar e regras de visibilidade |
| `docs/ux/parte4-design-system.md` | Tokens (`--void`, `--sun`, etc.), componentes catalogados, anti-patterns |
| `docs/ux/parte5-ui-specs.md` | UI Specs detalhados (microinterações, animações, breakpoints) |
| `docs/prd/parte1-feature-map.md` | FA-01 a FA-12 |
| `docs/prd/parte2-personas-jtbd.md` | PX-01 a PX-05 + JTBDs |
| `docs/prd/parte4-FRs.md` | FR-100 a FR-159 |
| `docs/brd/parte4-regras.md` | RN-001 a RN-022 (lógica decisional) |
| `docs/brd/parte2-glossario.md` | Vocabulário Suno e anti-patterns §9 |

---

## Changelog

| Versão | Data | Descrição |
|--------|------|-----------|
| 1.0 | 2026-04-28 | Versão inicial. Detalhamento de **11 telas TOP-PRIORITY** (T-02, T-04, T-05, T-06, T-07, T-08, T-09, T-10, T-13, T-24, T-27) com layouts ASCII, especificação de elementos, estados (default · loading · empty · error · success), interações, comportamento mobile vs. desktop e mapeamento explícito para FRs e RNs. **Caixa-preta (RN-011)** detalhada em T-13. **Marcação Faísca (RN-014)** detalhada em T-05/T-07/T-08. **Forced Reflection (RN-015)** especificada em T-09 com fricção intencional (sem fechar via backdrop). **Track por carreira (RN-017)** em T-27 com sugestão respeitando escolha. Vocabulário Suno (RN-016) aplicado em todo copy. Padrões compartilhados (transições, modal/drawer a11y, error handling) consolidados em §13. Lista priorizada de **18 componentes a criar** em §14 (6 P0 · 11 P1 · 3 P2) — base para sprints de implementação. |
| 1.1 | 2026-04-28 | Adicionados **3 specs detalhados** para FA-13/FA-14: T-29 (Inbox do Aprovador), T-30 (Detalhe da Submissão com Subject Preview + ValidationReport panel + ApprovalChainStepper + Footer CTAs com banner de RN-025 em round 3), T-32 (Drive Sync Dashboard com card OAuth read-only + Cleanup Reports + banner ADR-009 "Apenas relatório"). T-31 e T-33 referenciadas como derivadas de §13 (modal/catálogo). +13 novos componentes em §14.1.1 (P1 Piloto Aprovação/Drive): ApprovalCard, ApprovalChainStepper, ValidatorFindingsPanel, FindingHighlight, SubjectPreviewRenderer, DecisionFooter, ValidatedStampOverlay, SubmitForApprovalModal, DriveSyncStatusCard, DriveOAuthCard, DriveCleanupReportItem, CurationSuggestionCard, DriveDocumentPreviewModal. Total específicos: **14 telas detalhadas** + **31 componentes a criar** (6 P0 · 24 P1 · 3 P2). RN-023 a RN-030, ADR-008/009/010 e FRs FR-160 a FR-179 cobertos no detalhamento. |
