---
documento: UX Parte 2 — Arquitetura da Informação
projeto: sunOS
cliente: Suno United Creators (uso 100% interno)
bu: Tecnologia e Dados para Marketing
versao: 1.0
data_criacao: 2026-04-28
ultima_atualizacao: 2026-04-28
autor: Heitor Miranda + Claude (assistido)
status: Rascunho
fonte_prd:
  - docs/prd/parte1-feature-map.md (FA-01 a FA-12)
  - docs/prd/parte2-personas-jtbd.md (PX-01 a PX-05)
fonte_brd:
  - docs/brd/parte2-glossario.md (vocabulário Sistema Solar, Sun, Planeta, Órbita, Moon, Skill, Biblioteca, Workflow, Caixa-preta, Bioma Zero/Job/Agentic)
  - docs/brd/parte4-regras.md (RN-009 RBAC, RN-011 Caixa-preta operacional, RN-014 marcação Faísca, RN-016 vocabulário, RN-017 track por carreira)
fonte_ux:
  - docs/ux/parte4-design-system.md (componentes, tokens, AppShell, Sidebar, AppHeader)
  - docs/ux/parte1-inventario-telas.md (T-01 a T-28)
fonte_codigo:
  - app/ (rotas Next.js 14 implementadas)
  - components/layout/Sidebar.tsx, AppHeader.tsx, Breadcrumb.tsx
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

# UX Parte 2 — Arquitetura da Informação sunOS v1.0

## 1. Escopo e Fontes

**Referências utilizadas:**
- [PRD Parte 1] `docs/prd/parte1-feature-map.md` — FA-01 a FA-12
- [PRD Parte 2] `docs/prd/parte2-personas-jtbd.md` — PX-01 a PX-05
- [BRD Parte 2] `docs/brd/parte2-glossario.md` — vocabulário oficial (Sistema Solar, Sun, Planeta, Órbita, Moon, Skill, Biblioteca, Workflow, Caixa-preta, Bioma Zero/Job/Agentic)
- [BRD Parte 4] `docs/brd/parte4-regras.md` — RN-009 (RBAC), RN-011 (Caixa-preta), RN-014, RN-016, RN-017
- [UX Parte 1] `docs/ux/parte1-inventario-telas.md` — T-01 a T-28
- [UX Parte 4] `docs/ux/parte4-design-system.md` — fundações, AppShell, Sidebar, AppHeader, tokens
- [Código] `app/` (rotas Next.js 14), `components/layout/Sidebar.tsx`, `AppHeader.tsx`, `Breadcrumb.tsx`

**Objetivo:** Descrever a navegação e a arquitetura da informação do sunOS com base na metáfora **Sistema Solar** (L0–L4), servindo como guia para UX e Front-end. Inclui regras de visibilidade, padrões de busca, breadcrumbs, profundidade máxima, padrões cross-feature e mapa visual.

---

## 2. Princípios de IA/UX

### 2.1 Sistema Solar como metáfora rectora (L0–L4)

A navegação inteira do sunOS é construída sobre **Sun → Planeta (Cliente) → Órbita (Skill) → Moon (sub-área) → Conversa**. Toda decisão de IA reforça essa metáfora — cores circulares, dots, anéis orbitais, animação `orbit-appear`. Profundidade máxima de **3 níveis de navegação até o valor** (RN-003: Botão da criatividade, não do desespero).

### 2.2 Single-tenant interno explícito

O sunOS é uso 100% interno da Suno United Creators. **Não existe `companySlug` na URL** (a "company" é implícita: Suno United Creators é o Sun). Rotas reais usam `[clientSlug]` (Planetas/clientes da Suno) e módulos administrativos sem prefixo de tenant. Isso difere da convenção genérica Koro (que usa `/{companySlug}/workspace/{buSlug}/...`) — diferença documentada como decisão consciente do projeto.

### 2.3 Shell único: Sidebar + AppHeader

Um único shell (`components/layout/AppShell.tsx`) combina:
- **Sidebar (esquerda)**: 40px colapsada / 260px expandida, filtra `adminOnly` por perfil (RN-009)
- **AppHeader (topo)**: 48px sticky, glassmorphism, com Logo, Breadcrumb, theme toggle, atalhos, User Menu

### 2.4 Caixa-preta para perfil Operacional (RN-011)

**Toda referência à Biblioteca (FA-01) é fisicamente removida** (não desabilitada — não renderizada) para perfil Operacional. Isto é o coração da governança de IP da Suno (BR-007) e é aplicado em:
- Sidebar (item Biblioteca filtrado em `Sidebar.tsx:41` via `adminOnly`)
- Breadcrumbs (sem aparecer)
- Outputs do Chat (linguagem neutralizada — "contexto do cliente" no lugar de "contexto da Biblioteca")
- URL direta `/biblioteca` retorna redirect para `/` com mensagem genérica (sem revelar existência)

### 2.5 Search-first com Cmd+K (futuro)

Atalho global `⌘K` / `Ctrl+K` previsto como Command Palette para busca de Skills, Clientes, Workflows, KnowledgeItems (com filtros RBAC aplicados). **Estado: a construir** (P2/P3 do roadmap handoff). Documentado aqui em §8 para alinhamento futuro.

### 2.6 Vocabulário Suno aplicado em copy de navegação (RN-016)

Toda label de menu, breadcrumb, CTA usa vocabulário do Glossário §1: **Sun, Planeta, Skill, Moon, Biblioteca, Workflow, Faísca, Devorar, Provocar, Brasa**. Anti-patterns proibidos (§9 do Glossário): "gerar", "otimizar", "eficiência", "accelerator", "departamento de IA". Validação automática em copy (FA-11-04 / FA-12-08) bloqueia merge contendo anti-patterns. **Koro sempre com K, nunca Coro.**

### 2.7 Minimal UI (bordas, não sombras)

Conforme Design System §3.6 (Parte 4): separação entre superfícies por **borda** (`--border-subtle`, `--twilight`) e mudança de cor; sombras decorativas proibidas em cards. Hover de card = mudança de border-color, não box-shadow.

### 2.8 Role-based enablement por perfil

3 perfis (RN-009): **Admin** (CRUD total) · **Líder** (CRUD da sua área) · **Operacional** (apenas consumo via Skills/Moon Shot, sem acesso a Biblioteca/system prompts). Visibilidade do menu lateral, breadcrumbs e ações é filtrada antes da renderização (default deny).

---

## 3. Níveis de Navegação (L0–L4)

> **Adaptação da convenção Koro para o sunOS:** o sunOS não usa `companySlug` (single-tenant interno). Os níveis L0–L4 do Sistema Solar do sunOS mapeiam-se conceitualmente como segue:

| Nível Koro | Equivalente sunOS | Exemplo de rota | Descrição |
|------------|-------------------|------------------|-----------|
| **L0** Plataforma / Home | **L0 — Sistema Solar (Sun)** | `/` (T-02) | Centro da plataforma, ponto de entrada visual após login |
| **L1** Company | **L1 — Planeta (Cliente)** | `/[clientSlug]` (T-03) | Contexto do cliente (Vivo, Americanas, etc.) — equivale ao "tenant" no produto |
| **L2** Workspace | **L2 — Órbita (Skill)** | `/[clientSlug]/[skillSlug]` (T-04) | Skill ativa para aquele cliente |
| **L3** Business Unit | **L3 — Moon (Sub-área)** | `/[clientSlug]/[skillSlug]?moon=[moonSlug]` (chip dentro de T-05) | Variação configurável da Skill — após SPEC-007, vive como chip no PromptTemplateBar |
| **L4** Suite/Feature | **L4 — Conversa/Sessão** | (sub-estado de T-05; ChatSession ID interno) | Sessão concreta de chat com agente ReAct |

> **Outras "verticais" do produto** (Admin areas: Skills, Biblioteca, Clientes, Workflows, Mensuração) **não vivem na hierarquia do Sistema Solar** — são módulos paralelos acessíveis via Sidebar. Isso é intencional: o Sistema Solar é a navegação **operacional** (consumo de IA por Creator); as Admin areas são **governança** (curadoria por Líder/Admin).

| Nível | Responsável | Exemplo | Descrição |
|-------|-------------|---------|-----------|
| **L0** Sistema Solar (Sun) | Core | `/` | Home — orbital system com Planetas |
| **L1** Planeta (Cliente) | Core | `/[clientSlug]` | Contexto de um cliente; órbitas com Skills |
| **L2** Órbita (Skill) | Skill | `/[clientSlug]/[skillSlug]` | Skill ativa; abre PromptTemplateBar e Chat |
| **L3** Moon (sub-área) | Skill (variação) | `?moon=[moonSlug]` | Variação injetada via query string (chip) |
| **L4** Conversa/Sessão | Chat | (estado interno) | Sessão de chat ativa; histórico de mensagens |

> **Navegação paralela ao Sistema Solar (módulos administrativos):** `/skills`, `/biblioteca`, `/clientes`, `/workflows`, `/mensuracao`, `/onboarding`, `/design-system`. Acessíveis via Sidebar para perfis com permissão.

---

## 4. IA Base — Core (Shell)

### 4.1 Shell (AppHeader + Sidebar)

**AppHeader (altura: 48px, sticky):**

| Elemento | Posição | Função | Componente |
|----------|---------|--------|------------|
| Logo Sun + wordmark "sunOS" | Esquerda | Identidade do produto | `layout/Logo.tsx` |
| Breadcrumb | Centro-esquerda | Localização hierárquica (Sistema Solar L0→L1→L2) | `layout/Breadcrumb.tsx` |
| BackButton (opcional, contextual) | Esquerda do título | Voltar para nível anterior | `layout/BackButton.tsx` |
| Right Section | Centro-direita | Espaço para badges contextuais (cor do Planeta ativo, ModelSelector no Chat) | inline |
| Search (⌘K) [futuro] | Direita | Abre Command Palette | a construir |
| Theme Toggle | Direita | Dark/Light (`data-theme` no `<html>`) | `layout/ThemeProvider.tsx` |
| User Menu | Extrema direita | Avatar + Logout + Settings | inline |

> Glassmorphism: bg `--header-bg` com `backdrop-filter: blur(12px)` (Parte 4 §3.1.7).

**Sidebar (40px colapsada / 260px expandida):**

| Seção | Itens | Comportamento | Visibilidade |
|-------|-------|---------------|--------------|
| **Principal** | Home (Sistema Solar) | Sempre visível | Todas as personas |
| **Admin (Bioma Zero)** | Skills, Biblioteca, Clientes, Workflows | Filtrado por `adminOnly` (RN-009) | **Admin/Líder apenas** |
| **Mensuração** | Dashboard, Skill Health, Homogeneização | Filtrado por `adminOnly` | **Admin/Líder apenas** (PX-01 primário) |
| **Footer** | Onboarding (track por carreira), Design System (apenas devs), User profile + Logout | Sempre visível | Todas |

**Estados dos itens (Sidebar):**
- Default: ícone + texto (se expandida) em `--text-muted`
- Hover: bg `--surface-hover`, ícone em `--text-secondary`
- Active: bg `--nebula`, ícone em `--sun`, barra lateral 2px na esquerda em `--sun`

> **Implementação atual** em `components/layout/Sidebar.tsx`: linha 41 já filtra `adminOnly` antes de montar — base correta para RN-011.

### 4.2 Rotas e Nós — Core

| Rota | Nó/Tela | Função | Personas |
|------|---------|--------|----------|
| `/login` | T-01 | Autenticação Google + RBAC | Todas |
| `/` | T-02 | Sistema Solar L0 (Sun/Home) | Todas |
| `/onboarding` | T-27 | Track por carreira (RN-017) — first-run | PX-02, PX-05 (primário); todas as primeiras vezes |
| `/design-system` | T-28 | Component library viva | Devs/Designers (não-usuário) |

---

## 5. IA por Módulo/Feature

### 5.1 Sistema Solar (FA-06) — Navegação operacional

**Sidebar entry:** Home (ícone Sun)

| Rota | Nó/Tela | Função | Personas |
|------|---------|--------|----------|
| `/` | T-02 | L0 — Sun + Planetas (Clientes) | Todas |
| `/[clientSlug]` | T-03 | L1 — Planeta + Órbitas (Skills) + CTA Moon Shot | Todas |
| `/[clientSlug]/[skillSlug]` | T-04 + T-05 | L2 + Chat (PromptTemplateBar com Moon chips) | Todas |
| `/[clientSlug]/[skillSlug]?moon=[moonSlug]` | T-05 | L3 — Moon ativa (chip selecionado) | Todas |
| `/[clientSlug]/[skillSlug]/[moonSlug]` | (redirect) | Backward compat — redireciona para `?moon=` | — |

> **Acoplamento L2 + L4:** após SPEC-007, Moon não é mais tela separada — é chip dentro do PromptTemplateBar do Chat. A Conversa/Sessão (L4) é estado interno do componente Chat, sem rota própria. Persistência de sessão (T-05 refactor P1) tornará a Sessão recuperável via histórico no Sidebar.

### 5.2 Skills Admin (FA-12 + FA-03)

**Sidebar entry:** Skills (apenas Admin/Líder)

| Rota | Nó/Tela | Função |
|------|---------|--------|
| `/skills` | T-10 | Catálogo de Skills (table view + filter sidebar) |
| `/skills/new` | T-12 | Nova Skill |
| `/skills/[skillId]` | T-11 | Editor (4 tabs: Identidade, Configuração, Moons, Clientes) |

### 5.3 Biblioteca Admin (FA-12 + FA-01) — **CAIXA-PRETA RN-011**

**Sidebar entry:** Biblioteca (apenas Admin/Líder — **invisível para Operacional**)

| Rota | Nó/Tela | Função |
|------|---------|--------|
| `/biblioteca` | T-13 | Catálogo (Caixa-preta — redirect para `/` se Operacional) |
| `/biblioteca` (modal) | T-14 | Modal de Upload/Edit |
| `/biblioteca` (drawer) | T-15 | Drawer de Detalhes |
| `/biblioteca?filter=risco` | T-16 | Alerta Conhecimento em Risco (RN-008) — **a construir** |

### 5.4 Clientes Admin (FA-12)

**Sidebar entry:** Clientes (apenas Admin/Líder)

| Rota | Nó/Tela | Função |
|------|---------|--------|
| `/clientes` | T-17 | Catálogo de Clientes |
| `/clientes/new` | T-19 | Novo Cliente |
| `/clientes/[clientId]` | T-18 | Editor (4 tabs: Identidade, Skills, Biblioteca, Métricas) |

### 5.5 Workflows Admin (FA-12 + FA-05)

**Sidebar entry:** Workflows (Admin/Líder; PX-03 também tem acesso para operação)

| Rota | Nó/Tela | Função |
|------|---------|--------|
| `/workflows` | T-20 | Catálogo |
| `/workflows/new` | T-22 | Novo Workflow (Templates pré-configurados) |
| `/workflows/[workflowId]` | T-21 | Builder (sequência de Steps + Schedule) |
| `/workflows/[workflowId]/runs` | T-23 | Histórico de Execuções |

### 5.6 Mensuração (FA-10) — **a construir**

**Sidebar entry:** Mensuração (apenas Admin/Líder)

| Rota | Nó/Tela | Função |
|------|---------|--------|
| `/mensuracao` | T-24 | Dashboard Executivo mensal (RN-005) |
| `/mensuracao/skills/[skillId]` | T-25 | Skill Health Detail (RN-004) |
| `/mensuracao/homogeneizacao` | T-26 | Diversidade Coletiva (RN-019/020) |

### 5.7 Moon Shot (FA-02) — **modal sobreposto** (sem rota dedicada)

> **Decisão IA:** Moon Shot não cria rota — é modal/painel sobre T-03 ou T-05. Justificativa: preserva contexto da Skill ativa e atende RN-003 (≤3 cliques).

| Trigger | Nó/Tela | Função |
|---------|---------|--------|
| CTA em T-03 ou T-05 | T-06 | Modal de Acionamento |
| Após T-06 | T-07 | Painel de Faíscas (streaming) |
| Variante de T-07 | T-08 | Modo Dupla (time-boxing) |

> Decisão alternativa pendente (PA): rota dedicada `/[clientSlug]/[skillSlug]/moon-shot` se futuras integrações exigirem deep-link.

---

## 6. Entradas Múltiplas para Mesma Funcionalidade

Algumas funcionalidades têm múltiplos pontos de entrada — o sistema deve manter consistência de comportamento.

| Funcionalidade | Entradas | Comportamento |
|----------------|----------|---------------|
| **Moon Shot** | (1) CTA em T-03 (Planeta) · (2) CTA em T-04/T-05 (Chat) · (3) ⌘K [futuro] | Mesmo modal T-06 com contexto pré-preenchido conforme origem |
| **Forced Reflection** | (1) T-05 Chat (após N stars) · (2) T-07 Painel de Faíscas (após N stars) | Mesmo interstitial T-09; tracking N=5 sênior / N=3 junior |
| **Settings/Profile** | Sidebar footer + User Menu no AppHeader | Mesma tela [futura] de Settings |
| **Search/Discovery** | ⌘K (futuro) + filter sidebars das Admin areas | ⌘K busca cross-cutting; filter sidebars são contextuais ao módulo |
| **Theme toggle** | Sidebar footer + AppHeader | Mesma ação (`data-theme` em `<html>`) |
| **Marcação Faísca/estímulo** | T-05 (MessageBubble) · T-07 (FaíscaCard) · T-08 (modo dupla) · imagens/vídeos FA-08 | Padrão visual consistente (badge ou overlay) — RN-014 |

---

## 7. Wayfinding e Estados

### 7.1 Indicadores de Contexto

| Elemento | Indica | Visual |
|----------|--------|--------|
| **Breadcrumb** | Localização na hierarquia Sistema Solar (L0→L1→L2) | `Home > [Cliente] > [Skill]` — item atual com **dot Sun glowing** (`box-shadow: 0 0 6px rgba(255,200,1,0.6)`) |
| **Sidebar active** | Módulo atual (Home, Skills, Biblioteca, etc.) | Bg `--nebula` + barra lateral 2px `--sun` + ícone em `--sun` |
| **Right Section do AppHeader** | Cor do Planeta ativo (em T-03/T-04/T-05) | Badge com cor do cliente |
| **Moon chips no PromptTemplateBar** | Moon ativa (L3) | Pill em `--sun` (ativa) vs. `--text-muted` (inativas) |
| **Breadcrumb dot** | Item atual (último da trilha) | `--sun` glowing |
| **PageTitle** | Tela atual em destaque | Heading H1 page (Parte 4 §3.3.2) |

### 7.2 Estados de Navegação

| Estado | Comportamento |
|--------|---------------|
| **Troca de Cliente (L1)** | Limpa contexto da Skill anterior; reseta filtros do FilterPills; preserva tema |
| **Troca de Skill (L2)** | Limpa Moon ativa (default da Skill); preserva contexto do Cliente; abre nova ChatSession |
| **Troca de Moon (L3)** | Atualiza query string `?moon=`; re-injeta contexto; preserva ChatSession atual (continua a conversa) |
| **Deep link (URL direta)** | Restaura contexto completo (L1+L2+L3); valida RBAC; redireciona se sem permissão |
| **Back navigation (BackButton ou browser)** | Mantém estado do histórico; restaura scroll |
| **Logout** | Limpa toda sessão; redirect para `/login` |
| **Operacional acessa rota Admin** (RN-009 default deny + RN-011) | Redirect 302 para `/` com toast genérico (sem revelar nome do recurso) |

### 7.3 Foco e Acessibilidade

- **Skip-to-content link** no topo (visível em foco — keyboard navigation)
- Foco visível em todos os interativos: `box-shadow: 0 0 0 2px rgba(255,200,1,0.15)` (Parte 4 §3.6)
- Navegação por teclado completa em Sidebar, Breadcrumb, Tabs
- ARIA: `aria-current="page"` no item ativo da Sidebar e no último Breadcrumb

---

## 8. Command Palette (Global Search) — **a construir**

> **Estado: a construir** (P2/P3 do roadmap handoff). Documentado aqui para alinhamento futuro.

### 8.1 Atalho

- Mac: `⌘K`
- Windows/Linux: `Ctrl+K`

### 8.2 Funcionalidades

| Categoria | Exemplos | Permissão |
|-----------|----------|-----------|
| **Navegação** | "Ir para Sun", "Ir para [Cliente]", "Ir para Skills", "Ir para Biblioteca" | Filtrado por RBAC — Operacional NÃO vê "Ir para Biblioteca" |
| **Ações** | "Nova Skill", "Novo Workflow", "Devorar briefing (Moon Shot)" | Filtrado por RBAC |
| **Busca por entidade** | Nome de Cliente, Skill, Workflow, KnowledgeItem (semantic search) | KnowledgeItem **invisível para Operacional** (RN-011) |
| **Recentes** | Últimos 5 itens acessados (Sessões, Skills) | Por usuário |

### 8.3 Comportamento

- Abre via atalho ou botão "Search..." no AppHeader (a adicionar)
- Fecha via `Esc` ou clique fora
- Resultados agrupados por tipo (Navegação · Ações · Entidades · Recentes)
- Navegação por teclado (`↑↓` + `Enter`)
- **Vocabulário Suno** (RN-016) em sugestões: *"Devorar briefing"*, *"Provocar Faíscas"*, nunca *"Gerar ideias"*

### 8.4 Caixa-preta no ⌘K (RN-011)

Para perfil Operacional:
- Resultados da Biblioteca **não aparecem**
- Não há sugestão "Ir para Biblioteca" no menu de Navegação
- Tentativa de busca por termos como "biblioteca" não exibe nem retorna nada (não dá pista da existência do recurso)

---

## 9. Convenções

### 9.1 URLs

- **Formato:** kebab-case (ex: `/[clientSlug]/copy-social?moon=stories-reels`)
- **Slugs:** clientSlug e skillSlug derivados de `data/clients.ts` e configuração de Skills
- **Query strings:** para Moon (`?moon=`) e filtros temporários (`?filter=risco` em Biblioteca)
- **Sem `companySlug`:** sunOS é single-tenant interno (Suno United Creators é implícito)
- **Sem `buSlug`:** módulos administrativos vivem na raiz (`/skills`, `/biblioteca`, etc.)

### 9.2 Tokens de Layout (referenciados de Parte 4 §3.11)

| Token | Valor | Uso |
|-------|-------|-----|
| `--header-height` | 48px | Altura do AppHeader |
| `--sidebar-collapsed` | 40px | Sidebar fechada |
| `--sidebar-expanded` | 260px | Sidebar aberta |
| `--drawer-width` | 480px | Drawers (Skill, Biblioteca, Workflow, Cliente) |
| `--modal-max-width` | 600px | Modais (BibliotecaModal, T-06 Acionamento, T-09 Reflection) |
| `--page-max-width` | 900px | Página `/design-system`; Mensuração pode usar mais largo |

### 9.3 Z-Index (sugerido — Parte 4 §3.10 propõe consolidar como CSS vars)

| Elemento | Z-index | Uso |
|----------|:-------:|-----|
| Dropdown inline (TagInput, ModelSelector) | 10 | Inline overlays |
| Sidebar | 40 | Lateral fixa |
| Header sticky | 50 | Topo |
| Backdrop de Drawer/Modal | 90 | Camada escura |
| Drawer (right) | 91 | Drawers |
| Modal centralizado | 92 | Modais |
| Toast | 100/600 | Sempre por cima |

### 9.4 Vocabulário de Navegação (RN-016)

> Validação automática (FA-11-04 / FA-12-08) bloqueia copy contendo anti-patterns.

| Use | NÃO use |
|-----|---------|
| Sun, Sistema Solar, Planeta, Órbita, Moon | Dashboard inicial, Cliente, Categoria, Tag |
| Skill, Biblioteca (Admin only), Workflow | Capacidade, Knowledge base (Operacional), Automação |
| Devorar, Provocar, Faísca, Brasa | Gerar, Otimizar, Eficiência, Accelerator |
| Creator | Funcionário, Usuário, Publicitário |
| Bioma Zero / Bioma Job / Bioma Agentic | Liderança / Time / Departamento de IA |
| Caixa-preta | Privado, Restrito, Sigiloso |
| Koro Creators (com K) | Coro, Koro com C |

---

## 10. Mapa Visual da IA

### 10.1 Hierarquia Sistema Solar (L0–L4)

```
┌─────────────────────────────────────────────────────────────────────┐
│ L0: SISTEMA SOLAR (SUN/HOME)                                         │
│   /                                                                  │
│   ├─ Sun no centro (Suno United Creators)                            │
│   └─ Planetas orbitando (Clientes: Vivo, Americanas, Sicredi, ...)   │
├─────────────────────────────────────────────────────────────────────┤
│ L1: PLANETA (CLIENTE)                                                │
│   /[clientSlug]                                                      │
│   ├─ Planeta no centro local                                         │
│   ├─ Órbitas (Skills disponíveis)                                    │
│   └─ CTA Moon Shot (modal T-06)                             │
├─────────────────────────────────────────────────────────────────────┤
│ L2: ÓRBITA (SKILL) + CHAT                                            │
│   /[clientSlug]/[skillSlug]                                          │
│   ├─ PromptTemplateBar com Moon chips                                │
│   ├─ Chat (MessageList + ChatInput)                                  │
│   ├─ Context Sidebar (Biblioteca/Agentes/HITL — Caixa-preta para Op) │
│   └─ CTA Moon Shot contextual                               │
├─────────────────────────────────────────────────────────────────────┤
│ L3: MOON (sub-área via chip)                                         │
│   /[clientSlug]/[skillSlug]?moon=[moonSlug]                          │
│   └─ Mesmo Chat, contexto da Moon injetado                           │
├─────────────────────────────────────────────────────────────────────┤
│ L4: CONVERSA/SESSÃO (estado interno do Chat)                         │
│   (sem rota própria; ChatSession ID interno; persistência P1)        │
│   └─ Histórico de mensagens, feedbacks, variações                    │
└─────────────────────────────────────────────────────────────────────┘
```

### 10.2 Módulos Paralelos (não vivem no Sistema Solar)

```
┌────────────────────────┬─────────────────────────────────────────────┐
│ Sidebar entry          │ Rotas e telas                               │
├────────────────────────┼─────────────────────────────────────────────┤
│ Home                   │ / (T-02)                                    │
├────────────────────────┼─────────────────────────────────────────────┤
│ Skills (Admin/Líder)   │ /skills (T-10), /skills/new (T-12),         │
│                        │ /skills/[skillId] (T-11)                    │
├────────────────────────┼─────────────────────────────────────────────┤
│ Biblioteca             │ /biblioteca (T-13/T-14/T-15),               │
│ (Caixa-preta — RN-011) │ /biblioteca?filter=risco (T-16)             │
│                        │ INVISÍVEL para Operacional                  │
├────────────────────────┼─────────────────────────────────────────────┤
│ Clientes (Admin/Líder) │ /clientes (T-17), /clientes/new (T-19),     │
│                        │ /clientes/[clientId] (T-18)                 │
├────────────────────────┼─────────────────────────────────────────────┤
│ Workflows              │ /workflows (T-20), /workflows/new (T-22),   │
│ (Admin/Líder + PX-03)  │ /workflows/[workflowId] (T-21),             │
│                        │ /workflows/[workflowId]/runs (T-23)         │
├────────────────────────┼─────────────────────────────────────────────┤
│ Mensuração             │ /mensuracao (T-24),                         │
│ (Admin/Líder — PX-01)  │ /mensuracao/skills/[skillId] (T-25),        │
│                        │ /mensuracao/homogeneizacao (T-26)           │
├────────────────────────┼─────────────────────────────────────────────┤
│ Onboarding             │ /onboarding (T-27)                          │
│ (first-run + opt-in)   │                                             │
├────────────────────────┼─────────────────────────────────────────────┤
│ Design System          │ /design-system (T-28) — devs/designers      │
└────────────────────────┴─────────────────────────────────────────────┘
```

### 10.3 Fluxo Cross-Modules (exemplos)

```
Login (T-01)
    │
    ├─→ first-run? sim → Onboarding (T-27) → Sun (T-02)
    │
    └─→ Sun (T-02)
            │
            ├─→ Planeta (T-03) → Skill+Chat (T-04/T-05)
            │       │
            │       ├─→ [⌘K Shoot] → Modal (T-06) → Painel Faíscas (T-07)
            │       │       │
            │       │       └─→ N stars → Forced Reflection (T-09)
            │       │
            │       └─→ Feedback HITL inline (T-05) → N stars → T-09
            │
            ├─→ Sidebar Skills (PX-01) → T-10 → T-11 / T-12
            │
            ├─→ Sidebar Biblioteca (PX-01, NUNCA PX-03) → T-13 → T-14/T-15/T-16
            │
            ├─→ Sidebar Workflows (PX-01/PX-03) → T-20 → T-21/T-22/T-23
            │
            └─→ Sidebar Mensuração (PX-01) → T-24 → T-25/T-26
```

---

## 11. Profundidade Máxima e Princípio dos 3 Cliques

**RN-003 (Acionamento Moon Shot ≤ 3 cliques)** generaliza-se como princípio de IA:

| Persona | Tarefa | Caminho | Cliques |
|---------|--------|---------|:-------:|
| PX-02/03/04/05 | Chegar ao Chat de uma Skill | Sun → Planeta → Skill | **3** |
| PX-02 | Acionar Moon Shot | Sun → Planeta → CTA Shoot (ou Sun → Planeta → Skill → CTA Shoot) | **3-4** |
| PX-05 | Iniciar onboarding | Login → Onboarding → completar | **2** |
| PX-01 | Editar uma Skill | Sun → Sidebar Skills → row → Editar | **3-4** |
| PX-01 | Cadastrar item na Biblioteca | Sun → Sidebar Biblioteca → Adicionar (modal T-14) | **3** |
| PX-01 | Ver Dashboard Mensal | Sun → Sidebar Mensuração → Dashboard | **2-3** |
| PX-03 | Operar Workflow recorrente | Sun → Sidebar Workflows → Run | **3** |

**Profundidade máxima do Sistema Solar:** **3 níveis de navegação visual** (L0 → L1 → L2). L3 (Moon) é chip dentro de L2, não conta como navegação. L4 (Sessão) é estado interno.

**Profundidade máxima de módulos administrativos:** **3 níveis** (Sidebar → Catálogo → Editor). Drawers e modais não contam como nível.

---

## 12. Regras de Visibilidade — Resumo

| Recurso | Admin | Líder | Operacional (PX-03 e similares) |
|---------|:-----:|:-----:|:-------------------------------:|
| Sun (T-02) | Sim | Sim | Sim |
| Planeta (T-03) | Sim | Sim | Sim (apenas clientes ativos — RN-007) |
| Órbita/Skill + Chat (T-04/T-05) | Sim | Sim | Sim |
| Moon Shot (T-06/T-07/T-08) | Sim | Sim | Sim (com track adaptado por carreira — RN-017) |
| Forced Reflection (T-09) | Sim | Sim | Sim (N=3 para junior; N=5 para sênior) |
| Skills Admin (T-10/T-11/T-12) | Sim (CRUD total) | Sim (CRUD da sua área) | **NÃO** |
| Biblioteca Admin (T-13/T-14/T-15/T-16) | Sim | Sim | **NÃO — Caixa-preta total (RN-011)** |
| Clientes Admin (T-17/T-18/T-19) | Sim | Sim (sua área) | **NÃO** |
| Workflows Admin (T-20/T-21/T-22/T-23) | Sim | Sim | Sim (operação dos seus Workflows) |
| Mensuração (T-24/T-25/T-26) | Sim | Sim | **NÃO** |
| Sidebar item "Biblioteca" | Visível | Visível | **Não renderizado (não desabilitado)** |
| Linguagem "Biblioteca" no Chat | Mantida | Mantida | Substituída por "contexto do cliente" |
| Visible reasoning do agente | Disponível (toggle) | Disponível | Hidden by default (especialmente junior — RN-017) |

> **Default Deny (RN-009):** qualquer ambiguidade é resolvida negando acesso. Operacional acessando rota Admin via URL direta recebe redirect 302 para `/` com toast genérico.

---

## 13. Padrões de Busca

### 13.1 Busca por contexto (filter sidebars)

Cada Admin area tem seu próprio FilterSidebar (esquerda):

| Módulo | Filtros |
|--------|---------|
| Skills (T-10) | Tipo (Criação/Mídia/Planejamento), status, cliente associado |
| Biblioteca (T-13) | Escopo (Suno/cliente — ScopePills), tags, tipo de arquivo, domínio, status |
| Clientes (T-17) | Status (ativo/inativo), tipo, BU |
| Workflows (T-20) | Status (ativo/draft/archived), schedule, cliente |
| Mensuração (T-24) | Período, KPI, cliente |

### 13.2 Busca semântica (FA-01-04)

Tool `search_knowledge` consumida por agentes ReAct durante Chat e Workflows. Não é interface de usuário direta — é infraestrutura. Para Operacional (RN-011), o resultado é apresentado como "contexto do cliente" sem expor que veio da Biblioteca.

### 13.3 Busca global (Cmd+K — futuro)

Ver §8.

---

## 14. Decisões de IA Específicas do sunOS (justificativas)

| Decisão | Justificativa |
|---------|---------------|
| Sistema Solar como navegação operacional, Sidebar como navegação administrativa | Separa ato de **consumir IA** (jornada Creator → Cliente → Skill) de **governar IA** (jornada Líder → CRUDs). Reflete cultura "Bioma Zero (administra) vs. Bioma Job (executa)" do Glossário §1. |
| Moon como chip (L3) em vez de tela própria | SPEC-007. Reduz profundidade de 4 para 3 níveis no Sistema Solar; preserva contexto da Skill. |
| Moon Shot como modal sobre Chat (sem rota dedicada) | RN-003: ≤3 cliques. Modal preserva contexto da Skill ativa. Decisão revisitável se deep-link for necessário. |
| Sem `companySlug` na URL | sunOS é single-tenant interno (Suno United Creators implícita). Diferencia da convenção Koro genérica `/{companySlug}/workspace/{buSlug}/...`. Decisão consciente. |
| Sidebar separa "Admin" e "Mensuração" mesmo ambos restritos a PX-01 | Ajuda hierarquia mental: Admin = configurar; Mensuração = monitorar. Diferentes intenções da PX-01. |
| Biblioteca **invisível** (não desabilitada) para Operacional | RN-011 explícita do Guga: *"a biblioteca o cara não pode saber. A biblioteca é o olho também."* Não é só restrição de acesso — é Caixa-preta. |
| Forced Reflection como interstitial modal (não inline) | RN-015 — interrupção cognitiva precisa ser **visualmente forçada**, não decorativa. Modal centralizado quebra fluxo intencionalmente. |
| Onboarding por carreira (track sugerido, não imposto) | RN-017 — respeita as relações diferentes que junior e sênior têm com IA, mas dá liberdade de escolha (evita resistência identitária). |

---

## 15. Implicações para Front-end

### 15.1 Componentes de Layout que materializam esta IA

| Componente | Arquivo | Função |
|-----------|---------|--------|
| `AppShell` | `components/layout/AppShell.tsx` | Combina Sidebar + AppHeader + main; aplica RBAC |
| `AppHeader` | `components/layout/AppHeader.tsx` | Header sticky; recebe breadcrumb + rightSection |
| `Sidebar` | `components/layout/Sidebar.tsx` | Filtra `adminOnly`; aplica RN-009/RN-011 |
| `Breadcrumb` | `components/layout/Breadcrumb.tsx` | Renderiza trilha L0→L1→L2 com dot Sun no atual |
| `BackButton` | `components/layout/BackButton.tsx` | router.back() preservando estado |
| `AuthGuard` | `components/layout/AuthGuard.tsx` | Bloqueia rotas para não-autenticados |
| `Providers` | `components/layout/Providers.tsx` | Compõe Auth, Theme, Skills, Biblioteca, Workflow contexts |

### 15.2 Novos componentes a construir

| Componente | Para qual feature/tela | Nota |
|-----------|------------------------|------|
| `CommandPalette` | Cmd+K (cross-cutting) | P2/P3 do roadmap; aplicar RBAC e Caixa-preta |
| `MoonShotModal` | T-06 | Modal com seleção de track/zona |
| `FaiscaCard` + `FaiscaPanel` | T-07 | Painel streaming com cards de Faísca |
| `TimeBoxingTimer` | T-08 | Timer 90s/5min com bloqueio alternado |
| `ForcedReflectionInterstitial` | T-09 | Modal de pausa cognitiva |
| `MensuracaoLayout` + `KPICard` + `DiversityChart` | T-24/T-25/T-26 | Dashboard executivo + drill-downs |
| `OnboardingWizard` | T-27 | Wizard 3-passos com sugestão por carreira |
| `RiscoTable` | T-16 | Tabela de Conhecimento em Risco |

### 15.3 Hooks/Contexts a evoluir

| Hook/Context | Evolução necessária |
|-------------|---------------------|
| `AuthContext` | Expor `role` (Admin/Líder/Operacional) e `careerStage` (junior/pleno/sênior — RN-017) |
| `useTheme` | Já existe — manter |
| Novo `OnboardingContext` | Persistir track escolhido, applied flag |
| Novo `MoonShotContext` | Pipeline state, Faíscas geradas, stars count (trigger T-09) |
| `BibliotecaContext` | Filtrar resultados conforme RBAC; expor método `redactedLanguage()` para PX-03 |

---

## Changelog

| Versão | Data | Descrição |
|--------|------|-----------|
| 1.0 | 2026-04-28 | Versão inicial. Mapeamento L0-L4 do Sistema Solar do sunOS adaptado da convenção Koro (sunOS é single-tenant — sem `companySlug`). Convenção: L0 Sun → L1 Planeta (Cliente) → L2 Órbita (Skill) → L3 Moon (chip via `?moon=`) → L4 Conversa/Sessão (estado interno do Chat). Módulos paralelos (Skills, Biblioteca, Clientes, Workflows, Mensuração, Onboarding) não vivem na hierarquia do Sistema Solar — acessíveis via Sidebar. **Caixa-preta da Biblioteca (RN-011)** explicitada como princípio fundamental: invisível (não desabilitada) para Operacional em Sidebar, Breadcrumbs, Cmd+K, copy do Chat, URL direta (redirect). Vocabulário Suno aplicado (RN-016): Sun, Planeta, Órbita, Moon, Skill, Biblioteca, Workflow, Faísca, Devorar, Provocar; Koro sempre com K. Profundidade máxima ≤3 níveis (RN-003 generalizada). Cmd+K Command Palette documentado para futuro (P2/P3). |
