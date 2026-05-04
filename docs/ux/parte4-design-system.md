---
documento: UX Parte 4 — Design System
projeto: sunOS
cliente: Suno United Creators (uso 100% interno)
bu: Tecnologia e Dados para Marketing
versao: 1.0
data_criacao: 2026-04-28
ultima_atualizacao: 2026-04-28
autor: Heitor Miranda + Claude (assistido)
status: Rascunho
fonte_primaria: design-system/MASTER.md (formalizar e expandir)
fonte_implementacao: app/globals.css + app/design-system/page.tsx + components/
referencias_brd:
  - docs/brd/parte2-glossario.md (vocabulário UI — RN-016)
  - docs/brd/parte4-regras.md (RN-014, RN-016, RN-017)
referencias_prd:
  - docs/prd/ (Feature Map, Personas)
referencias_srd:
  - docs/srd/ (NFRs Usability, Accessibility)
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

# UX Parte 4 — Design System sunOS v1.0

## 1. Escopo e Contexto

### 1.1 Cobertura

Este documento formaliza o **Design System do sunOS** — sistema operacional de IA da Suno United Creators — cobrindo as cinco grandes áreas funcionais já existentes na aplicação Next.js 14:

| Área | Rota | Componentes principais |
|------|------|------------------------|
| Sistema Solar (navegação) | `/`, `/[clientSlug]/...` (4 níveis) | `solar/*` (PlanetNode, OrbitRing, MoonNode, etc.) |
| Skills Admin | `/skills`, `/skills/[id]` | `admin/*` (SkillCard, SkillDrawer, SkillEditor) |
| Biblioteca | `/biblioteca` | `biblioteca/*` (BibliotecaCard, Modal, Drawer, ScopePills) |
| Clientes Admin | `/clientes` | `clientes/*` (ClientCard, ClientDrawer, ClientEditor) |
| Workflows | `/workflows` | `workflows/*` (WorkflowCard, Builder, Timeline) |
| Chat (HITL) | `/[clientSlug]/[skillSlug]/chat` | `chat/*` (MessageBubble, FeedbackInline, ChatInput) |

### 1.2 Fontes

- **Source of Truth (SoT) tokens:** `app/globals.css` — CSS variables sob `:root`/`[data-theme="dark"]` e `[data-theme="light"]`
- **Source of Truth (SoT) padrões:** `design-system/MASTER.md` (263 linhas) — este documento expande e formaliza no formato Koro
- **Demonstração viva:** `app/design-system/page.tsx` — página `/design-system` exibe componentes em uso real
- **Convenções:** `CLAUDE.md` (raiz do projeto)
- **Vocabulário UI obrigatório:** Glossário §1 e §9 (Parte 2 do BRD)
- **Regra de negócio aplicável:** RN-014 (marcação visual de outputs de IA), RN-016 (validação de vocabulário), RN-017 (UX por estágio de carreira)

### 1.3 Objetivo

Alinhar fundações (tokens), componentes e padrões de interação para que toda evolução visual do sunOS:
- (a) respeite a identidade Sistema Solar (Dark Mode OLED + amarelo Suno);
- (b) proteja a **Caixa-preta** (Glossário §1) — nada de IP da Suno vaza por copy ou estrutura visual;
- (c) garanta **WCAG AA** explicitamente em contraste, foco e touch targets;
- (d) opere igualmente bem em tema escuro (default) e claro;
- (e) use o vocabulário Smart Growth/Suno consistentemente (RN-016).

---

## 2. Princípios de Design

### 2.1 Sistema Solar como metáfora rectora

A navegação inteira é construída sobre a metáfora **Sun → Planeta → Skill (órbita) → Moon → Chat**. Toda decisão visual reforça essa metáfora — cores, formas circulares, indicadores em forma de ponto (dot), padrões orbitais. Componentes que rompem a metáfora (ex.: tabelas densas estilo ERP) só aparecem em telas administrativas internas (`/skills`, `/biblioteca`, `/clientes`, `/workflows`) e mesmo lá retomam a paleta solar.

### 2.2 Dark Mode OLED por padrão, Light off-white espelhado

- Default: tema escuro com fundo `#080D14` (--void) — preto azulado quase OLED. Otimiza foco em conteúdo e reduz fadiga em sessões longas (creators ficam horas no chat).
- Tema claro: `#F5F2EB` off-white (não branco puro), preserva o amarelo Suno (`#FFC801`) como acento.
- Toggle ao alcance no `AppHeader` — alternância instantânea via `data-theme` no `<html>`.

### 2.3 Vibrant Accent restrito ao Sun

Apenas **um** amarelo (`#FFC801`) carrega significado de marca, ação primária e estado ativo. Nunca usar amarelos próximos para outra função — confunde o sinal de "esta é A ação". Cores por skill type (`--criacao`, `--midia`, `--planejamento`) e por cliente formam paletas paralelas, não concorrem com o accent.

### 2.4 Progressive Disclosure por perfil

Conforme RN-009 (RBAC) e RN-011 (ocultar Biblioteca para perfil Operacional), a UI **esconde fisicamente** menus/links que o perfil não pode acessar. Não exibir e desabilitar — não renderizar. O menu lateral filtra `adminOnly` antes de montar (`Sidebar.tsx:41`).

### 2.5 Inline styles como linguagem de implementação

Por convenção do projeto (`CLAUDE.md`), componentes usam **inline styles** com `var(--token)` — não classes Tailwind para estilização visual. Tailwind é usado apenas para layout estrutural (`flex`, `gap-*`, `min-h-dvh`) em pontos isolados. Isso garante que toda regra visual venha do design system de tokens, não de utilitários ad-hoc.

### 2.6 Acessibilidade não é opcional

Toda novo componente nasce com `role`, `aria-*`, foco visível, navegação por teclado e contraste AA. Componente sem cobertura A11y volta na revisão (cf. §6).

### 2.7 "AI provoca, humano cria" (RN-014)

Outputs gerados por IA precisam de **marcação visual explícita** (cor, badge ou label) até confirmação humana. O Design System fornece o token visual (badge HITL, gradiente Sun) — produto aplica.

---

## 3. Fundações (Tokens)

Todos os tokens são CSS Custom Properties definidas em `app/globals.css`. Usar sempre via `var(--token)`, nunca hex hardcoded.

### 3.1 Cores — Tema Escuro (default)

#### 3.1.1 Backgrounds (família "espacial")

| Token | Hex | Ratio vs --void | Uso | Exemplo |
|-------|-----|:---:|-----|---------|
| `--void` | `#080D14` | — | Background da página, body | `<body>`, espaço entre cards |
| `--deep` | `#0F1923` | 1.3:1 | Surface nível 1 — cards, panels, drawers, modals, header | `SkillCard`, `SkillDrawer` |
| `--nebula` | `#1B2B3A` | 1.8:1 | Surface nível 2 — inputs preenchidos, hover backgrounds, code blocks | `Skeleton`, `MessageBubble` (user), bloco de código |
| `--twilight` | `#263A4D` | 2.5:1 | Borders fortes, hover state em borders sutis | Borda de card no hover |

#### 3.1.2 Texto

| Token | Hex | Ratio vs --void | Uso | WCAG |
|-------|-----|:---:|-----|:----:|
| `--text-primary` | `#F1F5F9` | 15.8:1 | Headings, valores numéricos, nomes de entidade | AAA |
| `--text-secondary` | `#94A3B8` | 7.2:1 | Body text, descrições, labels secundários | AAA |
| `--text-muted` | `#64748B` | 5.1:1 | Labels, hints, metadata, ícones inativos | AA ✅ |

> **Histórico:** `--text-muted` antigo era `#475569` (3.2:1, falhava AA). Foi corrigido para `#64748B` (5.1:1) na auditoria UI/UX Pro Max.

#### 3.1.3 Accent Sun

| Token | Hex | Uso |
|-------|-----|-----|
| `--sun` | `#FFC801` | Botões primários, focus ring, link ativo, badges destacados, dot do breadcrumb final, accent solar |

> Uso restrito: apenas para sinalizar **a única próxima ação principal** ou **estado ativo único**. Não decorar com Sun.

#### 3.1.4 Cores funcionais por tipo de Skill

| Token | Hex | Uso |
|-------|-----|-----|
| `--criacao` | `#FFC801` | Skills de Criação (intencionalmente igual ao Sun — Criação é a alma da Suno) |
| `--midia` | `#3B82F6` | Skills de Mídia |
| `--planejamento` | `#10B981` | Skills de Planejamento, badge HITL, status "Ativo" |

#### 3.1.5 Estados semânticos

| Estado | Hex | Token sugerido | Uso |
|--------|-----|----------------|-----|
| Sucesso | `#10B981` | (usar `--planejamento`) | Thumbs up, status Ativo, upload concluído |
| Erro / Destrutivo | `#EF4444` | (literal) | Thumbs down, botão Excluir, mensagem de erro |
| Warning / Processando | `#F59E0B` | (literal) | Status Processando, draft (combinado com --sun) |
| Rascunho | `var(--sun)` | — | Status Rascunho |

> **Próxima evolução:** consolidar `#EF4444` e `#F59E0B` como `--error` e `--warning` em `globals.css`. Hoje são literais — mapear para token elimina inconsistência.

#### 3.1.6 Cores de Cliente (Planeta)

Mantida em catálogo fixo (não tokenizar — cada cliente tem sua identidade externa). Definida em `data/clients.ts` e usada por `PlanetNode`, `ScopePills`, `SkillDrawer`.

| Cliente | Hex | Notas |
|---------|-----|-------|
| Suno | `#FFC801` | (igual ao Sun — Suno é o centro) |
| Vivo | `#8B5CF6` | Roxo |
| Americanas | `#F97316` | Laranja |
| Sicredi | `#22C55E` | Verde |
| Samsung | `#3B82F6` | Azul |
| Santander | `#EF4444` | Vermelho |
| MRV | `#06B6D4` | Ciano |
| BMG | `#F472B6` | Rosa |
| Stone | `#A3E635` | Verde-limão |

#### 3.1.7 Tokens utilitários e de borda

| Token | Valor | Uso |
|-------|-------|-----|
| `--border-subtle` | `rgba(255,255,255,0.10)` | Borda padrão de cards, inputs, dividers |
| `--surface-hover` | `rgba(255,255,255,0.05)` | Hover em itens de lista, nav items |
| `--header-bg` | `rgba(8,13,20,0.7)` | Background do header (com `backdrop-filter: blur(12px)`) |
| `--orbit-line` | `rgba(255,200,1,0.12)` | Linha de órbita default no Sistema Solar |
| `--orbit-hover` | `rgba(255,200,1,0.22)` | Linha de órbita em hover |
| `--connector-color` | `rgba(255,255,255,0.15)` | Linhas de conexão (Sistema Solar L0/L1) |
| `--editorial-text` | `rgba(255,255,255,0.05)` | Texto editorial gigante de fundo |
| `--editorial-label` | `rgba(255,255,255,0.18)` | Labels editoriais |
| `--editorial-meta` | `rgba(255,255,255,0.10)` | Meta editorial |

> **Histórico:** `--border-subtle` antigo era `rgba(255,255,255,0.06)` — não passava no teste visual. Subiu para `0.10` para tornar bordas perceptíveis sem virar `--twilight`.

### 3.2 Cores — Tema Claro (light)

Espelha estrutura, inverte luminosidade. Off-white em vez de branco puro para reduzir glare.

| Token | Hex | Uso |
|-------|-----|-----|
| `--void` | `#F5F2EB` | Background |
| `--deep` | `#F5F2EB` | Surface (mesmo tom — sidebar/chat/header consistentes) |
| `--nebula` | `#EDE9E0` | Surface 2, inputs |
| `--twilight` | `#D4CFC6` | Borders fortes |
| `--sun` | `#FFC801` | Accent (preservado entre temas) |
| `--criacao` | `#FFC801` | Criação |
| `--midia` | `#2563EB` | Mídia (mais escuro para contraste em fundo claro) |
| `--planejamento` | `#059669` | Planejamento (mais escuro) |
| `--text-primary` | `#1A1A1A` | 14.7:1 contra void claro — AAA |
| `--text-secondary` | `#4A4A4A` | 7.8:1 — AAA |
| `--text-muted` | `#6B6B5F` | 4.6:1 — AA ✅ (corrigido de `#8A8A7A` 3.0:1) |
| `--border-subtle` | `rgba(0,0,0,0.10)` | Borders |
| `--surface-hover` | `rgba(0,0,0,0.03)` | Hover |
| `--header-bg` | `rgba(245,242,235,0.85)` | Header com blur |

### 3.3 Tipografia

#### 3.3.1 Famílias

| Categoria | Stack | Notas |
|-----------|-------|-------|
| Sans (default) | `"Helvetica Neue", "Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` | Helvetica primeira por preferência de marca; Inter como fallback web |
| Mono | `monospace` (system) | Usado em `model`, `temperature`, snippets de System Prompt — `SkillDrawer` |
| Variável Next | `--font-inter` | Disponível mas não obrigatória |

#### 3.3.2 Escala (em `rem`, base 16px)

| Nome | Size | Weight | Line-height | Tracking | Token cor sugerido | Uso real |
|------|------|--------|-------------|----------|--------------------|----------|
| H1 página | 2rem (32px) | 300 | 1.2 | -0.02em | `--text-primary` | Título principal de página de admin |
| H1 hero | 2.5rem (40px) | 300 | 1.2 | -0.02em | `--text-primary` | Página `/design-system`, landing |
| H2 seção | 1rem (16px) | 600 | 1.3 | 0.08em uppercase | `--text-muted` | Headings de seção em admin |
| H3 card title | 0.95rem (15.2px) | 500 | 1.3 | 0 | `--text-primary` | Título dentro de Drawer/Modal |
| Body | 0.875rem (14px) | 400 | 1.5 | 0 | `--text-secondary` | Texto corpo, descrições, mensagens de chat |
| Body small | 0.8rem (12.8px) | 400 | 1.5 | 0 | `--text-secondary` | Tabs, search input, botões secundários |
| Label | 0.75rem (12px) | 500 | 1.4 | 0 | `--text-secondary` | Labels de formulário, contadores |
| Metadata | 0.7rem (11.2px) | 400 | 1.4 | 0 | `--text-muted` | "Editado há 2d", "v5", filter pills |
| Metadata small | 0.65rem (10.4px) | 400 | 1.4 | 0 | `--text-muted` | Footer de card, timestamp |
| Caption | 0.6rem (9.6px) | 500 | 1.3 | 0.08em | `--text-muted` ou cor por tipo | Labels uppercase em card (CRIAÇÃO, MÍDIA) |
| Micro | 0.55rem (8.8px) | 500 | 1.3 | 0.14em uppercase | `--text-muted` | Section labels editoriais, role tags |

> **Anti-pattern (do MASTER):** body abaixo de 0.875rem (14px) é proibido para texto contínuo. Tamanhos abaixo só para metadata estática que não exige leitura sustentada.

#### 3.3.3 Hierarquia de cor

| Nível | Token | Quando usar |
|-------|-------|-------------|
| Primary | `--text-primary` | A coisa que o usuário precisa ler agora |
| Secondary | `--text-secondary` | Contexto necessário, mas secundário |
| Muted | `--text-muted` | Metadata, hints, "se você quiser saber" |

### 3.4 Espaçamento

**Base unit:** 4px. Os tokens nominais (xs, sm, md, lg, xl, 2xl) podem ser referenciados por classes Tailwind (`gap-md`, `p-lg`) configuradas no `tailwind.config`, ou por valores literais em inline styles.

| Token | Valor | Uso comum |
|-------|-------|-----------|
| `xs` | 4px | Gap mínimo entre ícone e texto inline |
| `sm` | 8px | Padding interno pequeno, gap entre elementos relacionados |
| `md` | 16px | Padding interno padrão de card, gap entre cards |
| `lg` | 24px | Padding de seção, padding lateral de página |
| `xl` | 32px | Margin entre seções de página, padding bottom de form |
| `2xl` | 48px | Margens grandes (hero, footer separator) |
| `3xl` | 64px | (uso excepcional) hero spacing |

### 3.5 Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `card` | 12px | Cards, modals, containers principais (drawer body é exceção — sem radius) |
| `input` | 8px | Inputs, textareas, selects, botões ghost, blocos de código |
| `pill` | 9999px | Botões primários (`Plus Primário`), badges, scope pills, type pills, search input estilo pill, toast, dots |
| `dot-small` | `50%` | Indicadores circulares (status dot, planet dot, type dot — 6-8px de lado) |

### 3.6 Sombras e Elevação

**Filosofia:** sombras minimalistas. O sunOS prefere bordas e mudança de cor a sombras pesadas. Apenas três níveis:

| Nível | Valor | Uso |
|-------|-------|-----|
| Focus ring | `0 0 0 2px rgba(255,200,1,0.15)` | **Todos** os interativos no estado `:focus` |
| Focus ring (alt forte) | `0 0 0 2px rgba(255,200,1,0.20)` | Cards interativos (mais visível) |
| Drawer overlay | `rgba(0,0,0,0.4)` (background) | Backdrop atrás de Drawer |
| Modal overlay | `rgba(0,0,0,0.6)` (background) | Backdrop atrás de Modal centralizado |
| Glow Sun | `0 0 6px rgba(255, 200, 1, 0.6)` | Dot do breadcrumb item atual |

> **Não usar:** `box-shadow` decorativa em cards. Hover de card = mudar `border-color` para `--twilight`, não criar sombra.

### 3.7 Transições

| Tipo | Duração | Easing | Uso |
|------|---------|--------|-----|
| Cor / Border | `150ms` | `ease` | Hover de botão, link, mudança de estado de pill |
| Layout / Width | `200ms` | `ease` | Sidebar expand/collapse, drawer slide-in |
| Transform | `200ms` | `ease` | Theme toggle (rotate 180deg), translate |
| Page enter | `300ms` | `ease-out` | Page transitions (`.page-enter` em `globals.css`) |
| Pulse / Breath | `1.5s` infinite | `ease-in-out` | Skeleton loader (`@keyframes pulse`) |
| Orbit appear | `400ms` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Aparição de órbita (`.orbit-appear`) |

> **`prefers-reduced-motion`:** já respeitado em `globals.css:231-258` — animações reduzidas a 0.01ms, orbit-appear desligada, pulse parada.

### 3.8 Touch Targets

| Tipo | Mínimo | Atual no projeto | Notas |
|------|--------|------------------|-------|
| Botão interativo | 44x44px | Botão primário OK; **icon buttons no `AppHeader` 28x28px** ❌ | Icon buttons no header devem subir para 44x44 (regressão a corrigir) |
| Filter pill | 36px height | OK (`SkillFilters.tsx`) | Height inclui padding |
| Sidebar icon collapsed | 40x40px | Atual 40x40 | Recomendação MASTER era 44x44 — promover |
| Theme toggle | 44x44px | **28x28px atual** ❌ | Aumentar área de clique (manter ícone visualmente pequeno) |

### 3.9 Iconografia

| Propriedade | Valor padrão | Variações permitidas |
|-------------|--------------|----------------------|
| Biblioteca | Lucide React | Não misturar outras bibliotecas |
| Tamanho default | 14px | 12 (denso, header), 16 (modal close), 18 (drawer close), 20 (file type, upload) |
| `strokeWidth` default | 1.5 | 2 apenas para `Plus` em botão primário ou close `&times;` literal |
| Cor default | `--text-muted` | `--sun` para ativo, `--text-secondary` no hover, cor por tipo para indicadores |
| Cor file type | Por extensão (PDF=`#EF4444`, JPG=`#10B981`, MP3=`#F59E0B`, MP4=`#8B5CF6`) | Definida em `FileTypeIcon.tsx` |

### 3.10 Z-Index (sugerido — hoje literais)

| Token | Valor | Uso |
|-------|-------|-----|
| `--z-sidebar` | 40 | Sidebar |
| `--z-header` | 50 | Header sticky |
| `--z-overlay` | 90 | Backdrop de Drawer/Modal |
| `--z-drawer` | 91 | Drawer (right) |
| `--z-modal` | 92 | Modal centralizado |
| `--z-toast` | 100 | Toast (sempre por cima) |
| `--z-dropdown` | 10 | Dropdowns inline (TagInput) |

> **Próxima evolução:** consolidar como CSS variables. Hoje hardcoded em cada componente.

### 3.11 Layout

| Token | Valor | Uso |
|-------|-------|-----|
| Sidebar collapsed | 40px | `Sidebar.tsx` |
| Sidebar expanded | 260px | `Sidebar.tsx` |
| Drawer width | 480px | Skill/Biblioteca/Workflow drawers; 60% em mobile |
| Modal max-width | 600px | `BibliotecaModal` |
| Page max-width | 900px | Página `/design-system` |
| Min height of page | `min-h-dvh` | **Não usar `h-screen`** (anti-pattern do MASTER) |

---

## 4. Componentes

Cada componente real do repositório está categorizado a seguir. Componentes marcados ⚠️ têm dívida técnica a endereçar (ver §8.3).

### 4.1 Shell / Layout

| Componente | Arquivo | Função | Estados / Variantes |
|-----------|---------|--------|---------------------|
| **AppShell** | `layout/AppShell.tsx` | Wrapper raiz que combina Sidebar + AppHeader + main | — |
| **AppHeader** | `layout/AppHeader.tsx` | Header sticky com glassmorphism (`backdrop-filter: blur(12px)`), Logo, Breadcrumb, ações, Avatar | Light/Dark, with/without rightLabel, with/without rightSection |
| **Sidebar** | `layout/Sidebar.tsx` | Menu lateral colapsável (40px ↔ 260px). Filtra `adminOnly` por perfil. Footer com user profile + logout | Open/Closed, com filtro RBAC (RN-009) |
| **Logo** | `layout/Logo.tsx` | Logo Sun (símbolo) + wordmark "sunOS" | — |
| **Breadcrumb** | `layout/Breadcrumb.tsx` | Trilha clicável; item atual com dot Sun glowing | — |
| **BackButton** | `layout/BackButton.tsx` | Botão voltar (router.back) | — |
| **ChatPanel** | `layout/ChatPanel.tsx` | Painel lateral persistente do chat | — |
| **Providers** | `layout/Providers.tsx` | Composição de Context providers (Auth, Theme, Skills, Biblioteca, Workflow) | — |
| **AuthGuard** | `layout/AuthGuard.tsx` | Bloqueia rotas para usuários não autenticados; redireciona para login | — |
| **ThemeProvider** | `layout/ThemeProvider.tsx` | Gerencia `data-theme` em `<html>`, persiste em localStorage, hook `useTheme()` | dark (default) / light |

### 4.2 Sistema Solar (componentes proprietários)

Sistema visual exclusivo do sunOS. Nenhum equivalente padrão — são a "marca de produto" da experiência.

| Componente | Arquivo | Função |
|-----------|---------|--------|
| **OrbitalSystem** | `solar/OrbitalSystem.tsx` | Container principal que renderiza Sun + Planetas + órbitas + conectores |
| **CenterNode** | `solar/CenterNode.tsx` | O Sol no centro — representação da Suno United Creators |
| **PlanetNode** | `solar/PlanetNode.tsx` | Planeta = Cliente. Cor por cliente, tamanho proporcional, hover glow |
| **OrbitRing** | `solar/OrbitRing.tsx` | Anel de órbita ao redor de um planeta. Cor `--orbit-line`, hover `--orbit-hover` |
| **MoonNode** | `solar/MoonNode.tsx` | Lua = Moon de uma Skill (sub-área) |
| **TinyMoon** | `solar/TinyMoon.tsx` | Moon em escala reduzida (overview / Sistema Solar L0) |
| **SkillGroup** | `solar/SkillGroup.tsx` | Agrupamento visual de Skills em torno de um Planeta |
| **FilterPills** | `solar/FilterPills.tsx` | Filtros do Sistema Solar (por tipo de skill: Criação/Mídia/Planejamento) |
| **QuickStats** | `solar/QuickStats.tsx` | KPIs flutuantes em hover de planeta (n clientes, n skills, score) |

> **Princípio:** estes componentes são **assinatura visual do sunOS**. Não substituir por bibliotecas terceiras. Toda evolução visual passa por revisão de Bruno Prosperi (Patrocinador Sócio Criação).

### 4.3 Inputs

| Componente / Padrão | Anatomia | Estados | Uso |
|---------------------|----------|---------|-----|
| **Text Input** | `<label>` (0.75rem, weight 500, --text-secondary) + `<input>` (border 1px subtle, radius 8px, padding 8px 12px, font 0.875rem, color --text-primary, bg transparent) | default, focus (border --sun + ring), error (border #EF4444 + msg), disabled | Formulários (`BibliotecaModal`, `SkillEditor`, `ClientEditor`) |
| **Textarea** | Igual ao Input + `resize: vertical`, `rows={3-10}` | Mesmos estados | Conteúdo, descrição, system prompt |
| **Select** | Igual ao Input + `cursor: pointer`, `<option>` nativos | Mesmos estados | Tipo de Skill, modelo, file type |
| **Search Input (pill)** | Input com `border-radius: 9999px`, ícone `Search` 13px à esquerda, padding-left 32px | Mesmos estados | `SkillFilters`, página `/design-system` |
| **TagInput** (`biblioteca/TagInput.tsx`) | Tag chips removíveis (`rounded-pill`, border subtle, X icon) + input + dropdown de sugestões filtradas (até 5) | Default + dropdown aberto | Tags de Biblioteca |
| **ScopePills** (`biblioteca/ScopePills.tsx`) | Pills coloridas multi-select com dot da cor do cliente, `aria-pressed` quando ativa | Selected (border + bg colorido) / unselected | Escopo de conteúdo da Biblioteca |
| **Toggle Switch** | Botão `role="switch"`, 36x20, dot 16x16, bg --sun (on) / --nebula (off), transition 200ms, `aria-checked` | On / Off / Disabled | Configurações (página `/design-system`) |
| **File Upload Zone** (`BibliotecaModal`) | Área tracejada (border `2px dashed`), drag-and-drop, hover muda border para --sun, mostra file selecionado com `FileTypeIcon` + nome + tamanho + remove | Empty, dragging, file-selected, uploading (com progress bar) | Upload na Biblioteca |

**Anatomia obrigatória** de qualquer Input:
1. Label visível (não placeholder-only — anti-pattern §6.4)
2. Input field
3. Helper text (opcional)
4. Error message (condicional, em vermelho `#EF4444` font 0.65rem)

### 4.4 Botões

| Variante | Background | Color | Border | Radius | Quando usar |
|----------|------------|-------|--------|--------|-------------|
| **Primary** | `--sun` | `--void` | none | `9999px` (pill) | A única ação principal da tela (Salvar, Criar, CTA do Empty State, Submit) |
| **Ghost** | transparent | `--text-secondary` | `1px solid --border-subtle` | `8px` | Ações secundárias (Cancelar, Duplicar) |
| **Destructive** | transparent | `#EF4444` | `1px solid rgba(239,68,68,0.3)` | `8px` | Excluir, remover (sempre acompanhado de confirmação) |
| **Disabled** | transparent | `--text-muted` | `1px solid --border-subtle` | `8px` | `opacity: 0.5`, `cursor: not-allowed`, sem hover |
| **Icon Button (circular)** | transparent | `--text-muted` | `1px solid --border-subtle` | `9999px` | Skills, Theme toggle, ações inline (mas ⚠️ deve ter min 44x44) |
| **Inline Action (chat)** | none | `--text-muted` | none | none | Copiar, Gerar variação, Salvar — em barras de feedback (`ResultActions`) |

**Tamanhos (Primary/Ghost):**

| Size | Padding | Font | Min height |
|------|---------|------|------------|
| Small | `4px 10px` | `0.65rem` | 28px |
| Default | `8px 16px` | `0.875rem` | 44px (touch target) |
| Large | `12px 24px` | `1rem` | 52px |

**Anatomia ideal:**
- Hover: opacity 0.9 (primary), border-color → --twilight (ghost)
- Focus: `boxShadow: 0 0 0 2px rgba(255,200,1,0.15)` SEMPRE
- Ícone à esquerda: `gap: 6px`, `<Icon size={14} strokeWidth={1.5}/>`

### 4.5 Cards

| Card | Arquivo | Conteúdo | Padrão |
|------|---------|----------|--------|
| **SkillCard** | `admin/SkillCard.tsx` | Skill admin: dot tipo, nome, type label, status badge, contador (clientes·moons), score, footer (timeAgo · vN) | `role="link"`, `tabIndex={0}`, hover muda border para `--twilight`, focus ring |
| **BibliotecaCard** | `biblioteca/BibliotecaCard.tsx` | Item da Biblioteca: ícone tipo, título, scope pills, tags, snippet | Mesmo padrão |
| **ClientCard** | `clientes/ClientCard.tsx` | Cliente: dot cor, nome, métricas (skills ativas, sessões, etc.) | Mesmo padrão |
| **WorkflowCard** | `workflows/WorkflowCard.tsx` | Workflow: status, schedule (cron), última execução, próxima execução | Mesmo padrão |

**Anatomia padrão (`role="link"`):**
```
backgroundColor: var(--deep)
border: 1px solid var(--border-subtle)
border-radius: 12px
padding: 16px
cursor: pointer
transition: border-color 150ms ease
hover: borderColor → var(--twilight)
focus: boxShadow → 0 0 0 2px rgba(255,200,1,0.20)
keyboard: Enter ativa onClick (onKeyDown)
```

### 4.6 Tabelas / Listas

| Componente | Uso |
|-----------|-----|
| **SkillsTable** (`admin/SkillsTable.tsx`) | Listagem densa de Skills (alternativa a SkillCards) |
| **BibliotecaTable** (`biblioteca/BibliotecaTable.tsx`) | Listagem densa da Biblioteca |
| **WorkflowTable** (`workflows/WorkflowTable.tsx`) | Listagem de workflows com colunas de status, cron, última execução |
| **WorkflowRunTimeline** (`workflows/WorkflowRunTimeline.tsx`) | Timeline cronológica de execuções |

**Padrão de tabela:**
- Header sticky com background `--deep`, borda inferior `--border-subtle`
- Row: padding 8px vertical, hover bg `--surface-hover`
- Coluna de ações final: icon buttons inline
- Empty state: usar componente `EmptyState`
- Loading state: usar `Skeleton` em N rows

### 4.7 Badges, Chips e Pills

| Tipo | Estilo | Uso real |
|------|--------|----------|
| **Status badge** | `padding: 2px 8px`, `border-radius: 9999px`, border colorida 1px, font 0.55-0.6rem | "Ativo" (verde), "Rascunho" (sun), "Arquivado" (muted), "Erro" (red), "Processando" (orange) |
| **Type pill (filter)** | `padding: 4px 10px`, `border-radius: 9999px`, ativa: border colorida + bg `${color}18` (12% opacity) + texto colorido | Filtros de tipo de Skill (Criação/Mídia/Planejamento) — `SkillFilters`, `solar/FilterPills` |
| **Scope pill (multi-select)** | Igual + dot 6px da cor à esquerda, `aria-pressed` | `ScopePills` (Suno, Vivo, Americanas...) |
| **Tag chip** | `padding: 1-2px 6-8px`, font 0.6-0.65rem, border subtle, color `--text-muted` ou `--text-secondary`, X opcional para remover | Tags de Biblioteca, tags de Skill |
| **HITL Badge** | bg `rgba(16,185,129,0.08)`, border `rgba(16,185,129,0.2)`, dot 6px verde + texto "Human in the Loop" verde | Indica conteúdo validado por humano |
| **Role tag** (header rightLabel) | uppercase, font 0.6rem, letter-spacing 0.12em, border pill subtle, color muted | "ADMIN", "OPERACIONAL", contexto de cliente |

> **RN-014 (marcação visual de outputs IA):** outputs gerados por IA devem ter um badge equivalente ao **HITL Badge** mas em estado "pendente de validação humana" (cor warning/sun), substituído pelo HITL Badge verde após confirmação. **Componente a criar:** `AIBadge` (status "estímulo" → "validado"). Hoje inexistente.

### 4.8 Tabs

Padrão único definido em `app/design-system/page.tsx`:

```
Container: display flex, border-bottom 1px subtle
Tab button: padding 10px 16px, font 0.8rem, transparent bg, border-bottom 2px transparent (default) ou 2px var(--sun) (active), color var(--text-muted) ou var(--text-primary) (active)
Transição: color 150ms ease
```

Usado em:
- `SkillEditorTabs` (Identity, Config, Moons, Clients)
- `ClientEditorTabs`
- Páginas internas de `/skills/[id]`, `/clientes/[id]`

### 4.9 Overlays

| Tipo | Trigger | Comportamento | Componentes |
|------|---------|---------------|-------------|
| **Drawer (right)** | Click em card de catálogo | Slide-in 200ms da direita, width 480px, overlay `rgba(0,0,0,0.4)`, `role="dialog"`, ESC fecha, click no overlay fecha | `SkillDrawer`, `BibliotecaDrawer`, `ClientDrawer`, `WorkflowDrawer` |
| **Modal (centralizado)** | Click em "Novo" / "Editar" | Centralizado, max-width 600px, max-height 80vh com scroll, overlay `rgba(0,0,0,0.6)`, ESC fecha, focus inicial no botão close | `BibliotecaModal`, `VersionHistoryModal` |
| **Editor (full page)** | Navegação para `/skills/[id]`, `/clientes/[id]/edit` | Página dedicada com Tabs internos | `SkillEditor`, `ClientEditor`, `WorkflowBuilder` |
| **Toast** | Confirmação de ação (salvar, copiar) | Fixed bottom 32px center, pill, auto-dismiss 2000ms, `role="status"`, `aria-live="polite"`, fade in/out 200ms | `ui/Toast.tsx` |
| **Dropdown** | Click/focus em input de tag | Posicionado abaixo do input, lista de sugestões clicáveis, fecha ao clicar fora ou em sugestão | `TagInput`, `BibliotecaModal` |
| **ContextSidebar** (chat) | Sempre presente em telas de chat | Painel lateral com contexto, RAG, memória | `chat/ContextSidebar.tsx` |

**Anatomia obrigatória de Drawer/Modal:**
- `role="dialog"` + `aria-modal="true"` + `aria-label` descritivo
- ESC fecha (event listener `keydown` com cleanup)
- Click no overlay fecha (`if (e.target === overlayRef.current)`)
- Focus inicial em primeiro elemento focável (idealmente botão close)
- Botão close (X icon, `aria-label="Fechar"`)
- Footer com ações alinhadas à direita: `[Cancelar (ghost)] [Salvar (primary)]`

### 4.10 Chat e HITL (Human in the Loop)

| Componente | Arquivo | Função |
|-----------|---------|--------|
| **ChatInterface** | `chat/ChatInterface.tsx` | Container do chat (mensagens + input + ContextSidebar) |
| **MessageBubble** | `chat/MessageBubble.tsx` | Bolha de mensagem. User: `--nebula` bg, radius assimétrico (`16px 16px 4px 16px`). Assistant: bg `rgba(255,255,255,0.03)`, radius `16px 16px 16px 4px`, avatar Sun 24x24 com letra "S" |
| **ChatInput** | `chat/ChatInput.tsx` | Input multi-linha com botões de anexo, enviar, model selector |
| **StreamingIndicator** | `chat/StreamingIndicator.tsx` | Indicador de streaming (3 dots animados ou cursor pulsante) — único caso de animação contínua permitida |
| **ResultActions** | `chat/ResultActions.tsx` | Barra de ações abaixo de output (Copiar, Gerar variação, Salvar, Thumbs up/down) |
| **FeedbackInline** | `chat/FeedbackInline.tsx` | Comentário inline collapsable; transition `max-height 150ms` |
| **VariationCards** | `chat/VariationCards.tsx` | Cards com variações geradas (V1, V2, V3) |
| **ModelSelector** | `chat/ModelSelector.tsx` | Selector do LLM (Gemini Flash, GPT-4o, Claude) — exibe ícone + nome do modelo ativo |
| **PromptTemplateBar** | `chat/PromptTemplateBar.tsx` | Barra com templates de prompt rápido por skill |
| **ContextSidebar** | `chat/ContextSidebar.tsx` | Sidebar direita com contexto da sessão (cliente, skill, moon, RAG ativo, memória) |
| **TextGenPanel** / **ImageGenPanel** | `chat/TextGenPanel.tsx`, `chat/ImageGenPanel.tsx` | Painéis especializados por tipo de output |
| **SocialPreview** | `chat/SocialPreview.tsx` | Preview de copy social formatado como Instagram/X (substitui bubble de texto quando aplicável) |

**Padrão HITL:**
- Toda resposta da IA exibe `ResultActions` com Thumbs up/down (`aria-pressed`).
- Thumb up = `#10B981`, thumb down = `#EF4444`, neutro = `--text-muted`.
- Comentário opcional via `FeedbackInline` collapsable.
- Sessão recebe rating 1-5 stars ao final.

### 4.11 Estados especiais

| Componente | Arquivo | Uso |
|-----------|---------|-----|
| **EmptyState** | `ui/EmptyState.tsx` | Lista vazia, busca sem resultados. Anatomia: ícone (opcional) → título → descrição (opcional) → CTA (opcional). Centralizado, padding 48px |
| **Skeleton** | `ui/Skeleton.tsx` | Loading shimmer em qualquer região async. `bg --nebula`, animação `pulse 1.5s ease-in-out infinite`. Aceita `width`, `height`, `radius` |
| **Toast** | `ui/Toast.tsx` | Confirmação curta de ação |
| **StreamingIndicator** | `chat/StreamingIndicator.tsx` | Carregamento de stream LLM |

> **Anti-pattern (do MASTER):** ausência de Skeleton em região async. Toda chamada async deve ter Skeleton renderizado durante load.

---

## 5. Padrões por Fluxo

### 5.1 Catálogo Admin (Skills, Biblioteca, Clientes, Workflows)

Padrão repetido em todas as áreas administrativas:

```
Header: AppHeader com Breadcrumb + rightLabel "ADMIN"
Toolbar:
  [Search input pill] [Type pills (filter)] [Status pills (filter)] [+ Novo (primary)]
Body:
  Grid responsivo de Cards (3 colunas desktop, 2 tablet, 1 mobile)
  OU Tabela densa (alternativa)
Loading: 6 Skeletons em forma de Card
Empty: EmptyState com ícone + "Nenhum X encontrado" + CTA "Criar primeiro X"
Click em card: abre Drawer com preview + ações (Abrir Editor, Duplicar, Excluir)
Click em "Abrir Editor" no Drawer: navega para `/{area}/[id]` (página dedicada com Tabs)
Click em "+ Novo": abre Modal centralizado (ou navega para `/{area}/new`)
```

### 5.2 Editor (Skill, Cliente, Workflow)

```
Página dedicada `/skills/[id]` (não Modal — formulário longo)
Header com nome do recurso + status badge + botões "Salvar" / "Voltar"
Sidebar de tabs verticais ou horizontais (`SkillEditorTabs`):
  [Identity] [Configuration] [Moons] [Clients]
Cada tab: formulário em coluna única (max-width 640px), com seções claras
Auto-save opcional ou Save manual com Toast de confirmação
Versionamento exibido como "v5 · Editado há 2d" no footer
```

### 5.3 Sistema Solar (navegação multi-nível)

```
L0 Home (/): Sun central + planetas orbitando (sem nomes, hover revela QuickStats)
L1 Cliente (/[clientSlug]): Planeta central ampliado + skills em órbitas + filter pills (Criação/Mídia/Planejamento)
L2 Skill (/[clientSlug]/[skillSlug]): Skill central + Moons em órbita
L3 Chat (/[clientSlug]/[skillSlug]/chat): ChatInterface com ContextSidebar
```

Princípios:
- Animações de entrada (`orbit-appear`) apenas no first-load do nível
- Sem rotação contínua (anti-pattern do MASTER)
- Hover de planeta = glow + QuickStats overlay
- Conector visual sutil entre níveis (`--connector-color`)

### 5.4 Chat (HITL — RN-014)

```
ChatInterface:
  ContextSidebar (esquerda): cliente ativo, skill ativa, moon, contexto RAG, memória
  Conversa (centro): MessageBubbles em sequência
    User bubble: bg --nebula, radius assimétrico
    Assistant bubble: bg sutil, avatar Sun "S", marcação visual de output IA
    Após resposta: ResultActions (Copy, Variation, Save, Thumbs)
    FeedbackInline collapsable (comentário opcional)
  ChatInput (rodapé): textarea + ModelSelector + Anexar + Enviar
  PromptTemplateBar (acima do input): templates rápidos por skill
StreamingIndicator durante geração
SocialPreview substitui bubble quando skill = copy-social
VariationCards exibe N variações alternativas
```

### 5.5 Formulários

- **1 coluna em mobile, 1-2 colunas em desktop** (até 640px de form width)
- Labels sempre visíveis acima do input (não placeholder-only)
- Erros embaixo do input em `#EF4444`, font 0.65rem
- Required marcado com `*` no label
- Botões no rodapé: `[Cancelar (ghost)] [Salvar (primary)]` alinhados à direita
- ESC cancela; Cmd/Ctrl+S submete (futuro)

### 5.6 Multi-tenant (contexto de Cliente)

- Cliente ativo (Planeta) sempre visível no Breadcrumb e no `ContextSidebar` do chat
- Mudança de cliente via Sistema Solar (não via dropdown do header)
- Deep links incluem `[clientSlug]` na URL
- Skills processuais respeitam **RN-010** (isolamento entre clientes) — UI nunca mistura conteúdo de cliente A em sessão de cliente B

---

## 6. Acessibilidade (WCAG 2.1 AA — Obrigatório)

### 6.1 Contraste

| Token vs Background | Ratio | Nível |
|---------------------|:-----:|:-----:|
| `--text-primary` vs `--void` (dark) | 15.8:1 | AAA |
| `--text-secondary` vs `--void` (dark) | 7.2:1 | AAA |
| `--text-muted` vs `--void` (dark) | 5.1:1 | AA ✅ |
| `--sun` vs `--void` (dark) | 10.8:1 | AAA |
| `--text-muted` vs `--void` (light) | 4.6:1 | AA ✅ |

> Toda combinação token-cor / token-background do design system passa WCAG AA. Nunca introduzir cor que falhe AA — validar com [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) antes de adicionar.

### 6.2 Navegação por Teclado

| Tecla | Ação esperada |
|-------|---------------|
| `Tab` | Próximo elemento focável |
| `Shift+Tab` | Anterior |
| `Enter` | Ativa link, botão, card-clicável |
| `Space` | Ativa botão, switch |
| `Esc` | Fecha Drawer, Modal, Toast (se possível); cancela edição inline |
| `Arrow keys` | Navega entre Tabs (recomendado, futuro) |
| `Enter` em input de tag/comentário | Confirma e blur |

**Regra:** todo `<div role="button">` ou `<div role="link">` precisa ter `tabIndex={0}` E handler `onKeyDown` que reage a `Enter` (e `Space` para `role="button"`). Exemplos corretos: `SkillCard.tsx:60`, `Sidebar.tsx:101`.

### 6.3 Focus Visible

Padrão único: `boxShadow: 0 0 0 2px rgba(255,200,1,0.15)` (ring suave) ou `0.20` para cards.

| Elemento | Implementação |
|----------|---------------|
| Botão | onFocus/onBlur seta boxShadow |
| Input | onFocusCapture/onBlurCapture seta boxShadow + borderColor `--sun` |
| Card | onFocus/onBlur seta boxShadow |
| Link nativo | Browser default OK; pode customizar com mesma cor Sun |

> **Anti-pattern:** `outline: none` sem substituir por focus ring. Se remover outline default, **obrigatório** aplicar `boxShadow` Sun.

### 6.4 ARIA e Semântica

- `<input>` sempre com `<label>` associado OU `aria-label` (tag input case)
- Ícones-only buttons: `aria-label` descritivo (ex: `aria-label="Fechar"`, `aria-label="Sair"`)
- Toggle switch: `role="switch"` + `aria-checked={boolean}`
- Filter pills: `aria-pressed={active}`
- Drawer/Modal: `role="dialog"` + `aria-modal="true"` + `aria-label`
- Toast: `role="status"` + `aria-live="polite"`
- Breadcrumb: `<nav aria-label="Navegação">`
- Sidebar: `<aside role="complementary" aria-label="Menu lateral">`

### 6.5 Tamanhos mínimos (touch targets)

- Mínimo recomendado: **44x44px** (alinhado com WCAG 2.5.5 AAA)
- Mínimo aceito: **40x40px** (apenas em sidebar collapsed e pill heights de 36px que têm padding lateral generoso)
- ⚠️ A corrigir: icon buttons no `AppHeader` (28x28) e theme toggle (28x28) — promover área de clique para 44x44 mantendo ícone visualmente pequeno via padding interno

### 6.6 Movimento e Animação

- `prefers-reduced-motion: reduce` respeitado em `globals.css:231` — toda animação cai para 0.01ms, orbit-appear desliga, pulse para
- **Animação contínua proibida** exceto em loading indicators (Skeleton pulse, StreamingIndicator)
- Orbit não rotaciona em loop (foi removido conforme decisão MASTER)

### 6.7 Skip link e estrutura

- Recomendado adicionar `<a href="#main" class="skip-link">Pular para conteúdo</a>` visível em focus (atualmente ausente — dívida)
- `<main>` com `id="main"` na raiz da page

---

## 7. Tema Escuro vs Claro (Dark Mode default, Light off-white)

### 7.1 Mecânica

- Atributo `data-theme="dark" | "light"` em `<html>`
- `ThemeProvider` (`layout/ThemeProvider.tsx`) gerencia + persiste em localStorage
- Toggle no `AppHeader` com ícone Sun (em dark) / Moon (em light), `aria-label` muda dinamicamente

### 7.2 O que muda

- Backgrounds invertem (#080D14 ↔ #F5F2EB)
- Text colors invertem (com --text-muted recalibrado em ambos para passar AA)
- `--midia` e `--planejamento` ficam mais escuros no light para preservar contraste
- `--sun` PRESERVADO em ambos (#FFC801) — é a marca
- Body background gradient (star field) some no light theme (`globals.css:82-84`)

### 7.3 Cores de Cliente

Não mudam entre temas. Cor de marca do cliente é a mesma — apenas o background contrastante muda.

### 7.4 Charts (futuro)

Quando charts existirem:
- Manter mesmas cores de tipo (`--criacao`, `--midia`, `--planejamento`) para consistência
- Grid lines: `--border-subtle` (auto-adapta)
- NÃO inverter cores graficamente entre temas

---

## 8. Anti-Patterns

### 8.1 Visuais (do MASTER + auditoria)

| Não fazer | Fazer em vez |
|-----------|-------------|
| `--text-muted` antigo `#475569` (3.2:1) | `#64748B` (5.1:1) ✅ |
| Border 6% opacidade | 10% opacidade |
| Body text < 0.875rem (14px) | Mínimo 0.875rem |
| Touch targets < 44px | Sempre ≥ 44x44 (40x40 só em casos justificados) |
| `outline: none` sem substituir | Sempre aplicar focus ring Sun |
| Box-shadow decorativa em cards | Hover = mudar `border-color` para `--twilight` |
| Animação infinita decorativa | Apenas em loading (Skeleton, StreamingIndicator) |
| Layout sem breakpoints | Mobile 1col, tablet 2col, desktop 3-4col |
| `h-screen` em layout | Usar `min-h-dvh` (corrige bug de viewport iOS) |
| Hover-only para ação primária | `onClick` é primary; hover é enhancement |
| Skeleton ausente em load async | Sempre Skeleton durante load |
| Texto branco puro `#FFFFFF` | Usar `--text-primary` (`#F1F5F9`) — reduz brilho excessivo |
| Hex hardcoded em código | Sempre `var(--token)` |
| Tailwind classes para cor visual | Usar inline styles + var(--token) (convenção do projeto) |
| Placeholder-only sem label | Label sempre visível |
| Múltiplos amarelos como accent | Apenas `--sun` é accent — outros amarelos são erro |

### 8.2 Vocabulário UI (RN-016 — bloqueador de merge)

**Termos PROIBIDOS** em copy do produto (do Glossário §9):

| Termo a evitar | Termo correto |
|----------------|---------------|
| Coro, Côro, Coro Creators | **Koro / Koro Creators** (sempre com K) |
| Funcionário | **Creator** |
| Departamento de IA | **Tutela técnica** ou **Tecnologia e Dados para Marketing** |
| Plataforma SaaS | **Plataforma interna** |
| Cliente do sunOS (referindo-se a usuário) | **Creator** |
| Bot, ChatGPT, GPT genérico | **Agente** ou **Skill** |
| Banco de dados (referindo-se à Biblioteca) | **Biblioteca** |
| Bioma (sem qualificador) | **Bioma Zero**, **Bioma Job** ou **Bioma Agentic** |
| Funil tradicional | **Smart Growth** |
| AI agency | **Agência ambidestra** |
| Otimizar / Eficiência (em copy de marketing interno) | **Provocar / Devorar / Faísca / Brasa** (vocabulário Suno) |
| Gerar (sem objeto claro) | **Provocar**, **Criar**, **Compor** |

**Termos OBRIGATÓRIOS** em qualquer label que se refira a:
- Sistema operacional → "**sunOS**" (sempre minúsculo "sun", maiúsculo "OS")
- A empresa → "**Suno**" ou "**Suno United Creators**" (cuidado para distinguir as duas)
- Capacidade de IA configurada → "**Skill**"
- Sub-área de Skill → "**Moon**"
- Cliente da Suno → "**Cliente**" (capitalize C quando se refere à entidade do produto) ou "**Planeta**" (no contexto Sistema Solar)
- Avaliação humana → "**Human in the Loop**" ou abreviação "**HITL**"

**Implementação RN-016:**
- Validação automática: linter de copy contra dicionário do Glossário (PA-10 — a construir antes do Protótipo)
- Validação humana: PR review obrigatória inclui leitura de strings novas; Sponsor (Guga) aprova ≥90% das releases

### 8.3 Dívidas técnicas conhecidas (a endereçar)

| Dívida | Local | Severidade | Plano |
|--------|-------|:----------:|-------|
| Theme toggle 28x28 < 44x44 | `AppHeader.tsx:81-112` | Média | Subir para 44x44 mantendo ícone 12px com padding |
| Skills icon button 28x28 < 44x44 | `AppHeader.tsx:53-78` | Média | Idem |
| Skip link ausente | Raiz da app | Baixa | Adicionar `<a class="skip-link">` global |
| Hex hardcoded `#EF4444`, `#F59E0B`, `#10B981` | Toda parte do código | Baixa | Tokenizar como `--error`, `--warning`, `--success` |
| Z-index hardcoded | Vários componentes | Baixa | Tokenizar como `--z-*` |
| AIBadge inexistente (RN-014) | A criar em `components/ui/` | **Alta** | Criar componente `AIBadge` com estados "estímulo" e "validado" |
| Validador automático de vocabulário (RN-016) | Pipeline CI | Média | Construir lint contra Glossário antes do Protótipo (PA-10) |
| Forced reflection (RN-015) | A integrar em chat | Média | Componente Modal "Por que essas? Que padrão você vê?" após N stars |

### 8.4 Componentes existentes em `/components/` FORA do design system formal

Análise feita comparando catálogo `app/design-system/page.tsx` (componentes demonstrados) vs `components/` (componentes existentes). Os abaixo **não aparecem** na página de design system e portanto carecem de formalização (potencial dívida):

**Sistema Solar (categoria "marca de produto" — não precisa estar no DS, mas precisa de spec própria):**
- `solar/CenterNode.tsx`, `solar/PlanetNode.tsx`, `solar/MoonNode.tsx`, `solar/TinyMoon.tsx`, `solar/OrbitRing.tsx`, `solar/OrbitalSystem.tsx`, `solar/SkillGroup.tsx`, `solar/QuickStats.tsx`, `solar/FilterPills.tsx`

**Layout (parcialmente coberto — falta exemplo na DS page):**
- `layout/AppHeader.tsx`, `layout/AppShell.tsx`, `layout/Sidebar.tsx`, `layout/Logo.tsx`, `layout/Breadcrumb.tsx`, `layout/BackButton.tsx`, `layout/ChatPanel.tsx`, `layout/AuthGuard.tsx`, `layout/Providers.tsx`, `layout/ThemeProvider.tsx`

**Skills Admin (não documentado no DS):**
- `admin/SkillCard.tsx`, `admin/SkillDrawer.tsx`, `admin/SkillEditor.tsx`, `admin/SkillEditorTabs.tsx`, `admin/SkillFilters.tsx`, `admin/SkillsSidebar.tsx`, `admin/SkillsTable.tsx`, `admin/VersionHistoryModal.tsx`, `admin/IdentityTab.tsx`, `admin/ConfigTab.tsx`, `admin/MoonsTab.tsx`, `admin/ClientsTab.tsx`

**Biblioteca (parcial — só `FileTypeIcon` aparece):**
- `biblioteca/BibliotecaCard.tsx`, `biblioteca/BibliotecaDrawer.tsx`, `biblioteca/BibliotecaFilters.tsx`, `biblioteca/BibliotecaModal.tsx`, `biblioteca/BibliotecaSidebar.tsx`, `biblioteca/BibliotecaTable.tsx`, `biblioteca/ScopePills.tsx`, `biblioteca/TagInput.tsx`

**Clientes Admin (não documentado):**
- `clientes/ClientCard.tsx`, `clientes/ClientDrawer.tsx`, `clientes/ClientEditor.tsx`, `clientes/ClientEditorTabs.tsx`

**Workflows (não documentado — área inteira fora):**
- `workflows/WorkflowBuilder.tsx`, `workflows/WorkflowCard.tsx`, `workflows/WorkflowDrawer.tsx`, `workflows/WorkflowRunTimeline.tsx`, `workflows/WorkflowStepEditor.tsx`, `workflows/WorkflowTable.tsx`, `workflows/WorkflowTemplates.tsx`

**Chat (parcial — feedback aparece, demais não):**
- `chat/ChatInterface.tsx`, `chat/ChatInput.tsx`, `chat/ContextSidebar.tsx`, `chat/FeedbackInline.tsx`, `chat/ImageGenPanel.tsx`, `chat/MessageBubble.tsx`, `chat/ModelSelector.tsx`, `chat/PromptTemplateBar.tsx`, `chat/ResultActions.tsx`, `chat/SocialPreview.tsx`, `chat/StreamingIndicator.tsx`, `chat/TextGenPanel.tsx`, `chat/VariationCards.tsx`

**UI Primitives (parcial — só Toast aparece):**
- `ui/EmptyState.tsx`, `ui/Skeleton.tsx`

**Total:** ~62 componentes existentes vs ~15 demonstrados na página `/design-system`. Plano:
1. Esta Parte 4 já documenta todos eles em §4 (categorização canônica).
2. Próxima onda (§4 individuais expandidos): adicionar exemplo de cada um na página `/design-system` ao longo das próximas 3 sprints.
3. Componentes `solar/*` ficam na "spec proprietária Sistema Solar" — não no DS genérico.

---

## 9. Handoff e Implementação

### 9.1 Referências canônicas

| Camada | Arquivo |
|--------|---------|
| Tokens (CSS variables) | `app/globals.css` |
| Padrões textuais (versão antiga) | `design-system/MASTER.md` (mantido como histórico) |
| Padrões textuais (versão Koro) | `docs/ux/parte4-design-system.md` (este documento — SoT) |
| Demonstração viva | `app/design-system/page.tsx` → rota `/design-system` |
| Componentes implementados | `components/` (catalogados em §4 e §8.4) |
| Convenções de código | `CLAUDE.md` (raiz) |
| Vocabulário UI | `docs/brd/parte2-glossario.md` §1 e §9 |

### 9.2 Checklist QA visual (PR template)

Antes de aprovar PR com mudança visual, validar:

- [ ] Tokens aplicados via `var(--token)` (sem hex hardcoded de cor de marca)
- [ ] Espaçamentos múltiplos de 4px
- [ ] Border radius usa escala (8/12/9999)
- [ ] Font sizes usam escala (0.55-2rem) e cores `--text-*`
- [ ] Hover state definido (border-color para card; opacity para botão primary)
- [ ] Focus ring `0 0 0 2px rgba(255,200,1,0.15-0.20)` em todo interativo
- [ ] Touch target ≥ 44x44px (ou 40x40 com justificativa)
- [ ] Tema light validado (toggle e revisar)
- [ ] Contraste AA verificado (WebAIM Contrast Checker)
- [ ] `role`, `aria-*`, `tabIndex`, `onKeyDown` em interativos custom
- [ ] Skeleton em load async; Empty state em lista vazia
- [ ] Vocabulário UI validado contra Glossário §1 e §9 (RN-016)
- [ ] Output IA marcado visualmente (badge / cor) se aplicável (RN-014)
- [ ] `prefers-reduced-motion` respeitado (sem nova animação infinita decorativa)
- [ ] Página `/design-system` atualizada se for componente novo

### 9.3 Como contribuir

1. Toda nova cor/spacing/radius vai primeiro como CSS variable em `globals.css` — depois usar `var(--*)` no componente
2. Toda nova string visível ao usuário passa pela validação RN-016 (humano hoje, lint amanhã)
3. Componente novo precisa de seção em §4 deste documento + entrada na página `/design-system`
4. Mudança em token existente = breaking change → revisar todos os usos antes do PR
5. Anti-pattern detectado → adicionar em §8.1 ou §8.2

---

## 10. Próximas Evoluções

| Item | Quando | Responsável |
|------|--------|-------------|
| Tokenizar `--success`, `--warning`, `--error`, `--z-*` | Próxima sprint UI | Time dev |
| Componente `AIBadge` (RN-014) | Antes do Piloto | Time dev |
| Lint de vocabulário UI (RN-016) | Antes do Protótipo (PA-10) | Heitor + dev |
| `Modal` "Forced reflection" (RN-015) | Após Piloto | Time dev |
| Promover icon buttons do AppHeader para 44x44 | Próxima sprint UI | Time dev |
| Skip link "Pular para conteúdo" global | Próxima sprint UI | Time dev |
| Adicionar todos os componentes em `/design-system` page | 3 sprints | Time dev |
| Spec proprietária Sistema Solar (separada) | UX Parte 5 ou anexo | Heitor + Bruno Prosperi |
| Tokens em `tailwind.config` (gap-md, p-lg, etc.) | Próxima sprint UI | Time dev |

---

## Changelog

| Versão | Data | Descrição |
|--------|------|-----------|
| 1.0 | 2026-04-28 | Versão inicial. Formalização de `design-system/MASTER.md` no formato UX Spec Koro. **51 tokens** (cores dark + light, tipografia, spacing, radius, shadows, transitions, touch, ícones, z-index, layout). **64 componentes catalogados** em 11 categorias (Shell/Layout, Sistema Solar, Inputs, Botões, Cards, Tabelas, Badges/Pills, Tabs, Overlays, Chat/HITL, Estados especiais). **9 padrões de fluxo** documentados. **Cobertura WCAG AA** explícita (contraste, teclado, foco, ARIA, touch). **3 categorias de anti-patterns** (visuais, vocabulário, dívidas técnicas) com 30+ regras. Vocabulário UI validado contra Glossário §1 e §9 (Koro com K, sunOS minúsculo+OS, Bioma sempre qualificado, etc.). 9 componentes existentes identificados como dívida (fora do `/design-system` formal) com plano de absorção em 3 sprints |

---

<!-- REVIEW: Esta Parte 4 cobre tokens, componentes e padrões da forma que o time de UX e dev precisa? Algum padrão recorrente em /components ficou sem documentação? Algum anti-pattern do projeto que você lembra e não aparece em §8? -->

**Próximos passos:**
1. Revisar com Heitor Miranda + Bruno Prosperi (Patrocinador Sócio Criação)
2. Aprovar tokens novos (`--success`, `--warning`, `--error`, `--z-*`) antes de mexer em `globals.css`
3. Criar `AIBadge` (RN-014) — bloqueador para Piloto
4. Iniciar Onda 2C — UX Parte 1 (Inventário de Telas T-XX) e Parte 2 (Arquitetura da Informação L0-L4)
5. Cada componente listado em §4 ganha exemplo na página `/design-system` ao longo das próximas 3 sprints (responsabilidade compartilhada do time dev)
