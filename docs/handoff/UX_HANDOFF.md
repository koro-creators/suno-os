# sunOS — UX Design Handoff

**Last Updated:** 2026-04-15
**Data original:** 2026-04-16
**De:** Heitor Miranda (Tech Lead)
**Para:** UX Designer, UI Designer, Product Designer
**Repo:** https://github.com/koro-creators/suno-os

---

## 1. Design System

### 1.1 Conceito Visual

O sunOS usa a metáfora de **sistema solar** — cada cliente é um planeta, skills são órbitas, moons são sub-áreas. O design é **dark-first**, inspirado em interfaces espaciais, com o amarelo Suno (#FFC801) como accent.

**Referências:** Dark mode OLED, interfaces de creative tools (Figma, Framer), dashboards espaciais.

### 1.2 Paleta de Cores

#### Dark Theme (default)

| Token | Hex | Uso |
|-------|-----|-----|
| `--void` | `#080D14` | Background principal (deep navy) |
| `--deep` | `#0F1923` | Cards, panels, surfaces |
| `--nebula` | `#1B2B3A` | Inputs, hover states |
| `--twilight` | `#263A4D` | Borders fortes, separadores |
| `--sun` | `#FFC801` | Accent (CTAs, active, links) |
| `--text-primary` | `#F1F5F9` | Headings, text principal |
| `--text-secondary` | `#94A3B8` | Body text, descrições |
| `--text-muted` | `#475569` | Labels, hints, metadata |
| `--border-subtle` | `rgba(255,255,255,0.06)` | Borders sutis |
| `--surface-hover` | `rgba(255,255,255,0.03)` | Hover em surfaces |

#### Light Theme

| Token | Hex | Uso |
|-------|-----|-----|
| `--void` | `#F5F2EB` | Background (off-white) |
| `--deep` | `#F5F2EB` | Cards (mesmo tom para consistência) |
| `--nebula` | `#EDE9E0` | Inputs, hover |
| `--twilight` | `#D4CFC6` | Borders |
| `--sun` | `#FFC801` | Accent (preservado) |
| `--text-primary` | `#1A1A1A` | Headings |
| `--text-secondary` | `#4A4A4A` | Body |
| `--text-muted` | `#8A8A7A` | Labels |

#### Cores Funcionais

| Cor | Hex | Uso |
|-----|-----|-----|
| Criação | `#FFC801` (amarelo) | Skills de criação |
| Mídia | `#3B82F6` (azul) | Skills de mídia |
| Planejamento | `#10B981` (verde) | Skills de planejamento |
| Erro/Rejeitar | `#EF4444` (vermelho) | Erros, thumbs down, delete |
| Sucesso/Aprovar | `#10B981` (verde) | Sucesso, thumbs up, ativo |
| Warning | `#F59E0B` (âmbar) | Processing, draft |

#### Cores de Clientes

| Cliente | Hex |
|---------|-----|
| Suno | `#FFC801` (sun) |
| Vivo | `#8B5CF6` |
| Americanas | `#F97316` |
| Sicredi | `#22C55E` |
| Samsung | `#3B82F6` |

### 1.3 Tipografia

| Propriedade | Valor |
|-------------|-------|
| **Font family** | Helvetica Neue, Inter, system-ui |
| **Headings** | weight 300 (light), 2rem para h1 de página |
| **Body** | 0.8rem, line-height 1.5 |
| **Labels** | 0.7rem, weight 500, text-secondary |
| **Metadata** | 0.65rem, text-muted |
| **Micro** | 0.55-0.6rem, uppercase, letter-spacing 0.08-0.14em |
| **Google Font** | Inter (variable, --font-inter) |

### 1.4 Espaçamento

| Token | Valor | Uso |
|-------|-------|-----|
| `xs` | 4px | Gap mínimo |
| `sm` | 8px | Padding interno |
| `md` | 16px | Gap entre cards |
| `lg` | 24px | Padding de seção |
| `xl` | 32px | Padding de página |
| `2xl` | 48px | Margens de seção |

### 1.5 Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `card` | 12px | Cards, modals, containers |
| `input` | 8px | Inputs, textareas, selects |
| `pill` | 9999px | Buttons primários, badges, pills |

### 1.6 Sombras & Elevação

| Nível | Valor | Uso |
|-------|-------|-----|
| Nenhuma | — | Default (flat design) |
| Focus | `0 0 0 2px rgba(255,200,1,0.15)` | Focus ring (sun glow) |
| Modal | `0 2px 12px rgba(0,0,0,0.2)` | Social preview, modals |
| Card hover | Border muda para `--twilight` | Feedback sutil |

### 1.7 Transições

| Tipo | Duração | Uso |
|------|---------|-----|
| Hover (cor) | `150ms ease` | Botões, links, cards |
| Layout | `200ms ease` | Sidebar, panels, expand |
| Page | `300ms ease-out` | Page transitions |
| Pulse | `2s infinite` | HITL badge |

### 1.8 Ícones

| Propriedade | Valor |
|-------------|-------|
| **Biblioteca** | Lucide React |
| **Tamanho padrão** | 14px |
| **Stroke width** | 1.5 |
| **Cor padrão** | `var(--text-muted)` |
| **Cor ativa** | `var(--sun)` |

---

## 2. Personas & Jornadas

### 2.1 Personas

#### P2 — Criativo
- **Quem:** Redatores, social media, designers
- **Contexto:** Produzem dezenas de copies, roteiros, posts por semana. Cada cliente tem tom, restrições e formatos diferentes.
- **Dor:** Começar do zero toda vez. Não lembrar do tom de voz. Retrabalho por briefing incompleto.
- **Jornada principal:** Home → Cliente → Copy Social (seleciona moon chip "Feed") → digita prompt → recebe 3 variações de carrossel → escolhe → ajusta → entrega (3 clicks ate o chat, nao 4 — SPEC-007)
- **Expectativa UX:** Resposta rápida, visual do output (preview), comparação fácil entre variações.

#### P3 — Estrategista
- **Quem:** Planejadores, analistas de mídia, BI
- **Contexto:** Produzem planos, análises, reports. Precisam de dados e contexto de mercado.
- **Dor:** Garimpar dados em planilhas. Montar decks do zero. Reports repetitivos toda semana.
- **Jornada principal:** Home → Cliente → Plano de Mídia (seleciona moon chip "Digital") → pede plano com benchmark → recebe estruturado → HITL valida → entrega (3 clicks — SPEC-007)
- **Expectativa UX:** Contexto injetado automaticamente (Biblioteca), output estruturado, scheduling de reports.

#### P4 — Admin / Builder
- **Quem:** Tech lead, gerentes de conta
- **Contexto:** Configuram skills, alimentam Biblioteca, criam workflows para os times.
- **Dor:** Cada pedido de automação depende de engenharia. Não consegue iterar rápido.
- **Jornada principal:** /skills → edita prompt → /biblioteca → upload brand book → /workflows → cria report semanal automático → agenda para segunda 9h
- **Expectativa UX:** Interfaces de config intuitivas, feedback visual de que funcionou, monitoramento de execuções.

### 2.2 Pain Points Conhecidos

| Pain Point | Onde | Impacto | Status |
|------------|------|---------|--------|
| "Não sei se o tom está certo" | Chat | Criativo inseguro do output | HITL implementado, falta uso real |
| "Report toda semana é igual" | Mídia/BI | Tempo desperdiçado | Workflows implementado |
| "Não acho o brand book" | Chat | Contexto incompleto na resposta | Biblioteca v2 com upload + search |
| "Quero ver como fica no Instagram" | Chat Copy Social | Não visualiza o resultado | Social Preview implementado |
| "Cadê o que fiz ontem?" | Chat | Sem histórico | Conversas não persistem (débito) |

---

## 3. Mapa de Telas

### 3.1 Hierarquia de Navegação

```
Login (/login)
  │
  ▼
Home (/) ─── Sistema Solar (QuickStats bar, label "CLIENTES")
  │
  ├── /[cliente] ─── Skills do cliente (órbitas)
  │     └── /[skill]?moon=X ─── Chat contextualizado (moons como chips)
  │           (moon page eliminada — SPEC-007: /[moon] redireciona para /[skill]?moon=X)
  │
  ├── /skills ─── Skills admin (table + sidebar + drawer)
  │     ├── /skills/new
  │     └── /skills/[id] ─── Editor 4 tabs
  │
  ├── /biblioteca ─── Knowledge base (table + sidebar + drawer)
  │
  ├── /clientes ─── Clientes admin (condensed cards + drawer)
  │     ├── /clientes/new
  │     └── /clientes/[id] ─── Editor 4 tabs (drawer preferred)
  │
  ├── /workflows ─── Workflows (table + drawer)
  │     ├── /workflows/new ─── Builder
  │     ├── /workflows/[id] ─── Editar
  │     └── /workflows/[id]/runs ─── Histórico
  │
  └── /design-system ─── Component library reference
```

### 3.2 Inventário de Telas (15 páginas + 1 redirect)

| Tela | Rota | Tipo | Padrão UI |
|------|------|------|-----------|
| Login | `/login` | Auth | Centrado, botão Google |
| Home | `/` | Visualização | Sistema solar orbital + QuickStats bar |
| Cliente | `/[clientSlug]` | Visualização | Skills em órbitas |
| Skill/Chat | `/[clientSlug]/[skillSlug]` | Interação | Chat + moon chips no PromptTemplateBar + sidebar |
| ~~Moon~~ | `/[clientSlug]/[skillSlug]/[moonSlug]` | **Redirect** | Redireciona para `/[skill]?moon=[moon]` (SPEC-007) |
| Skills Catálogo | `/skills` | Admin table | **Table + SkillsSidebar + SkillDrawer** (Model Repo pattern) |
| Skills Editor | `/skills/[id]` | Admin editor | 4 tabs (Identidade, Config, Moons, Clientes) |
| Skills Novo | `/skills/new` | Admin create | Mesmo editor, campos vazios |
| Biblioteca | `/biblioteca` | Admin table | **Table + BibliotecaSidebar + BibliotecaDrawer** (Model Repo pattern) |
| Clientes Catálogo | `/clientes` | Admin cards | **Condensed cards + ClientDrawer** (click card abre drawer) |
| Clientes Editor | `/clientes/[id]` | Admin editor | 4 tabs (Identidade, Skills, Biblioteca, Métricas) |
| Clientes Novo | `/clientes/new` | Admin create | Mesmo editor |
| Workflows Catálogo | `/workflows` | Admin table | **WorkflowTable + WorkflowDrawer** (humanized cron) |
| Workflows Builder | `/workflows/new` | Builder | Steps + config |
| Workflows Editor | `/workflows/[id]` | Builder | Mesmo builder |
| Workflows Runs | `/workflows/[id]/runs` | Timeline | Histórico de execuções |
| Design System | `/design-system` | Reference | Component library |

### 3.3 Layout Base

```
┌──────────────────────────────────────────────────┐
│ Sidebar (40px collapsed / 260px expanded)         │
│ ┌────┐                                           │
│ │ 🌐 │ Home                                      │
│ │ 👥 │ Clientes                                  │
│ │ ✨ │ Skills                                    │
│ │ 📖 │ Biblioteca                                │
│ │ ⚡ │ Workflows                                 │
│ └────┘                                           │
│ ─────── RECENTES ───────                          │
│ • Santander · Copy Social                        │
│ • Vivo · Plano de Mídia                          │
├──────────────────────────────────────────────────┤
│ Header                                            │
│ sunOS.  Breadcrumb: Home / Santander / ...       │
│                              ⚙️ ☀️ 👤            │
├──────────────────────────────────────────────────┤
│                                                  │
│                 Main Content                      │
│                                                  │
│                                                  │
├──────────────────────────────────────────────────┤
│ Chat Panel (colapsável, direita, 320px)           │
└──────────────────────────────────────────────────┘
```

---

## 4. Inventário de Componentes

### 4.1 Layout

| Componente | Arquivo | Descrição |
|-----------|---------|-----------|
| `Sidebar` | `components/layout/Sidebar.tsx` | Colapsável (40→260px), ícones + labels, seção Recentes |
| `AppHeader` | `components/layout/AppHeader.tsx` | Logo, breadcrumb, ícone settings, theme toggle, avatar |
| `AppShell` | `components/layout/AppShell.tsx` | Wrapper com sidebar + header + chat panel |
| `ChatPanel` | `components/layout/ChatPanel.tsx` | Panel direito colapsável para chat rápido |
| `Breadcrumb` | `components/layout/Breadcrumb.tsx` | Navegação por caminho |
| `AuthGuard` | `components/layout/AuthGuard.tsx` | Proteção de rotas por role |
| `ThemeProvider` | `components/layout/ThemeProvider.tsx` | Toggle dark/light via data-theme |

### 4.2 Tables (Model Repo pattern — SPEC-005)

| Componente | Arquivo | Usado em | Colunas |
|-----------|---------|----------|---------|
| `SkillsTable` | `components/admin/SkillsTable.tsx` | `/skills` | Nome, tipo, status, score, clientes |
| `BibliotecaTable` | `components/biblioteca/BibliotecaTable.tsx` | `/biblioteca` | Titulo, tipo, scope, tags, status |
| `WorkflowTable` | `components/workflows/WorkflowTable.tsx` | `/workflows` | Nome, status, schedule (humanizado), last run |

### 4.3 Filter Sidebars (Model Repo pattern — SPEC-005)

| Componente | Arquivo | Usado em | Filtros |
|-----------|---------|----------|---------|
| `SkillsSidebar` | `components/admin/SkillsSidebar.tsx` | `/skills` | Tipo, status, search |
| `BibliotecaSidebar` | `components/biblioteca/BibliotecaSidebar.tsx` | `/biblioteca` | Scope, tipo, tags, search |

### 4.4 Side Drawers (Model Repo pattern — SPEC-005)

| Componente | Arquivo | Usado em | Conteudo |
|-----------|---------|----------|----------|
| `SkillDrawer` | `components/admin/SkillDrawer.tsx` | `/skills` | Detalhes do skill (read/edit) |
| `BibliotecaDrawer` | `components/biblioteca/BibliotecaDrawer.tsx` | `/biblioteca` | Detalhes do documento |
| `ClientDrawer` | `components/clientes/ClientDrawer.tsx` | `/clientes` | Detalhes do cliente (click card abre drawer) |
| `WorkflowDrawer` | `components/workflows/WorkflowDrawer.tsx` | `/workflows` | Detalhes do workflow |

### 4.5 Cards

| Componente | Arquivo | Usado em | Visual |
|-----------|---------|----------|--------|
| `SkillCard` | `components/admin/SkillCard.tsx` | `/skills` (legacy) | Type dot + nome + status badge + counters + score + footer |
| `BibliotecaCard` | `components/biblioteca/BibliotecaCard.tsx` | `/biblioteca` (legacy) | Thumbnail 80x80 + type icon + badge + tags + expandível |
| `ClientCard` | `components/clientes/ClientCard.tsx` | `/clientes` | Condensed: color dot 10px + nome + descrição + métricas (click abre ClientDrawer) |
| `WorkflowCard` | `components/workflows/WorkflowCard.tsx` | `/workflows` (legacy) | Nome + status badge + schedule info + last run + step count |

### 4.6 Editors (padrão CRUD)

| Componente | Arquivo | Tabs |
|-----------|---------|------|
| `SkillEditor` | `components/admin/SkillEditor.tsx` | Identidade, Configuração, Moons, Clientes |
| `ClientEditor` | `components/clientes/ClientEditor.tsx` | Identidade, Skills, Biblioteca, Métricas |
| `WorkflowBuilder` | `components/workflows/WorkflowBuilder.tsx` | Steps list + config por step |

**Padrão compartilhado:** Header com nome inline-editable + botões (Descartar, Salvar/Criar) + tabs com sun underline.

### 4.7 Chat

| Componente | Arquivo | Descrição |
|-----------|---------|-----------|
| `ChatInterface` | `components/chat/ChatInterface.tsx` | Grid 2 colunas: chat + sidebar |
| `ChatInput` | `components/chat/ChatInput.tsx` | **Textarea** com auto-resize + Shift+Enter para nova linha + botao enviar dinamico + sr-only label |
| `ModelSelector` | `components/chat/ModelSelector.tsx` | **Dropdown** para trocar modelo de IA por mensagem (Gemini Flash, Pro, GPT-4o, Claude) |
| `MessageBubble` | `components/chat/MessageBubble.tsx` | Bolha user (direita) ou assistant (esquerda) + avatar "S" + timestamp + code blocks |
| `SocialPreview` | `components/chat/SocialPreview.tsx` | Preview Instagram: cover slide + content slides |
| `VariationCards` | `components/chat/VariationCards.tsx` | 3 opções lado a lado (social ou text) |
| `ResultActions` | `components/chat/ResultActions.tsx` | **Icon-only** com tooltips (copiar, variar, salvar, thumbs) |
| `FeedbackInline` | `components/chat/FeedbackInline.tsx` | Comentário opcional após thumbs |
| `ContextSidebar` | `components/chat/ContextSidebar.tsx` | **Collapsible sections**: Biblioteca + Agentes + Validação HITL |
| `PromptTemplateBar` | `components/chat/PromptTemplateBar.tsx` | **Cards com icones** + moon chips integrados (moons selecionaveis como chips) |
| `StreamingIndicator` | `components/chat/StreamingIndicator.tsx` | **Skeleton bars** + nome do modelo ativo |
| `TextGenPanel` | `components/chat/TextGenPanel.tsx` | Painel de geração de texto batch |
| `ImageGenPanel` | `components/chat/ImageGenPanel.tsx` | Painel de geração de imagem |

### 4.8 Filtros & Inputs

| Componente | Arquivo | Padrão |
|-----------|---------|--------|
| `SkillFilters` | `components/admin/SkillFilters.tsx` | Search pill + type pills + status pills |
| `BibliotecaFilters` | `components/biblioteca/BibliotecaFilters.tsx` | Scope pills + search + tag cloud + type pills |
| `ScopePills` | `components/biblioteca/ScopePills.tsx` | Multi-select (Suno + clientes) com dots coloridos |
| `TagInput` | `components/biblioteca/TagInput.tsx` | Input com autocomplete + pills removíveis |
| `FileTypeIcon` | `components/biblioteca/FileTypeIcon.tsx` | Ícone + cor por tipo de arquivo |

### 4.9 Primitivas

| Componente | Arquivo | Padrão |
|-----------|---------|--------|
| `Toast` | `components/ui/Toast.tsx` | Fixed bottom-center, pill, auto-dismiss 2s |
| `EmptyState` | `components/ui/EmptyState.tsx` | Ilustracao + mensagem + CTA (usado em todas as pages admin) |
| `Skeleton` | `components/ui/Skeleton.tsx` | Shimmer loading placeholder (tabelas, cards, drawers) |

### 4.10 Sistema Solar

| Componente | Arquivo | Descrição |
|-----------|---------|-----------|
| `OrbitalSystem` | `components/solar/OrbitalSystem.tsx` | Container orbital |
| `CenterNode` | `components/solar/CenterNode.tsx` | Sol central |
| `PlanetNode` | `components/solar/PlanetNode.tsx` | Planeta (cliente) com cor |
| `MoonNode` | `components/solar/MoonNode.tsx` | Moon do skill |
| `OrbitRing` | `components/solar/OrbitRing.tsx` | Anel de órbita |
| `SkillGroup` | `components/solar/SkillGroup.tsx` | Agrupamento de skills |
| `FilterPills` | `components/solar/FilterPills.tsx` | Filtro por tipo de skill |
| `QuickStats` | `components/solar/QuickStats.tsx` | Barra de metricas rapidas na Home (clientes, skills, docs, workflows) |

---

## 5. Padrões de UX Adotados

### 5.1 Model Repo Pattern (SPEC-005)

Padrao adotado para todas as paginas admin. Inspirado em interfaces de repositorio de modelos (HuggingFace, Replicate):

| Elemento | Descricao |
|----------|-----------|
| **Table view** | Default. Linhas com dados condensados. Clicavel para abrir drawer. |
| **Filter sidebar** | Coluna esquerda com filtros (tipo, status, search, scope, tags). |
| **Side drawer** | Painel lateral direito (320-400px). Abre ao clicar na linha da tabela. Mostra detalhes em read/edit mode. |
| **Variacao Clientes** | Cards condensados em vez de tabela. Click no card abre drawer (sem navegacao para outra pagina). |
| **Variacao Workflows** | Tabela com cron humanizado (ex: "Toda segunda as 9h"). |

### 5.2 Chat UX

| Padrão | Implementação |
|--------|---------------|
| **Model Selector** | Dropdown para trocar modelo por mensagem. 4 modelos: Gemini Flash (default), Gemini Pro, GPT-4o, Claude. |
| **Streaming** | Texto aparece progressivamente (SSE), skeleton bars durante loading com nome do modelo |
| **Prompt Templates** | Cards com icones + moon chips integrados (moons selecionaveis como chips) |
| **Variações** | Auto-gera 3 opções no Copy Social. Cards lado a lado para comparar. |
| **Social Preview** | No Copy Social: output renderizado como slides de Instagram (cover + content) |
| **Feedback** | Thumbs up/down inline + comentário expandível + painel no sidebar |
| **Context** | Sidebar mostra documentos da Biblioteca ativos com toggle on/off |
| **Fallback** | Se backend indisponível, usa mock streaming (mesma UX) |

### 5.3 Admin CRUD

| Padrão | Descrição |
|--------|-----------|
| **Catálogo** | Grid de cards com search + filtros. Empty state "Nenhum item encontrado." |
| **Editor** | Header: nome inline-editable + botões (Descartar/Salvar). Tabs com sun underline. |
| **Create** | Mesmo editor com campos vazios. Botão "Criar" em vez de "Salvar". Sem "Descartar". |
| **Delete** | Double-click confirm: primeiro click mostra "Confirmar?", segundo deleta. |
| **Toast** | Feedback de ação: "Skill atualizado", "Item criado", "Item excluído". Auto-dismiss 2s. |
| **Validation** | Inline errors em vermelho. Switch para tab com erro. |

### 5.4 Filtros

| Padrão | Descrição |
|--------|-----------|
| **Search** | Input pill com ícone Search. Focus ring sun. Filtra em tempo real. |
| **Type pills** | Toggle multi-select. Ativo: border colorido + bg semi-transparente. |
| **Scope pills** | Multi-select com dot colorido por cliente. Suno sempre primeiro. |
| **Tag cloud** | Pills pequenas das tags mais frequentes. OR dentro de grupo, AND entre grupos. |

### 5.5 Interação

| Padrão | Implementação |
|--------|---------------|
| **Hover cards** | Border muda para `--twilight`. Cursor pointer. |
| **Focus ring** | `boxShadow: '0 0 0 2px rgba(255,200,1,0.15)'` |
| **Toggle switch** | 36x20px, sun quando ativo, nebula quando inativo. Dot animado. |
| **Inline edit** | Click em nome → input transparente. Blur salva. |
| **Status badge** | Pills: Ativo (verde), Rascunho (sun), Arquivado (muted). |

---

## 6. Acessibilidade

### Implementado

| Item | Status |
|------|--------|
| `role="link"` em cards clicáveis | ✅ |
| `role="button"` em divs interativas | ✅ |
| `role="switch"` + `aria-checked` em toggles | ✅ |
| `role="tablist"` + `role="tab"` + `aria-selected` em tabs | ✅ |
| `role="dialog"` + `aria-modal` em modals | ✅ |
| `role="status"` + `aria-live="polite"` em toasts | ✅ |
| `aria-label` em botões de ícone | ✅ |
| `aria-pressed` em toggles de filtro | ✅ |
| Keyboard Enter em cards e tabs | ✅ |
| Arrow keys em tabs | ✅ |
| Escape em modals | ✅ |
| Focus trap em modals | ✅ (básico) |
| Skip link "Pular para conteúdo" | ✅ |
| `prefers-reduced-motion` | ✅ |

### WCAG Fixes Aplicados (SPEC-005)

| Item | Correcao |
|------|----------|
| `--text-muted` contrast | Ajustado para atingir WCAG AA 4.5:1 ratio |
| `--border-subtle` contrast | Ajustado para melhor visibilidade |
| `sr-only` label no ChatInput | Label acessivel para screen readers |
| Tooltips em ResultActions | Icon-only buttons agora tem tooltips descritivos |

### Gaps Remanescentes

| Item | Impacto |
|------|---------|
| Screen reader testing real | Não validado com NVDA/VoiceOver |
| Mobile responsivo | Não otimizado — sidebar colapsa mas grid não adapta |
| Tab order auditado | Pode ter inconsistências em telas complexas |
| Error announcements | Erros de formulário não são anunciados via aria-live |

---

## 7. Gaps & Oportunidades

### 7.1 ~~Sem Empty State~~ — RESOLVIDO

Empty states implementados via componente `EmptyState` (`components/ui/EmptyState.tsx`). Todas as paginas admin agora mostram ilustracao + mensagem + CTA quando vazio. Chat historico continua sem persistencia (debito tecnico).

### 7.2 Sem Onboarding

- Nenhum welcome screen para primeiro uso
- Nenhum tooltip ou guided tour
- Nenhuma explicação do que é cada seção

**Oportunidade:** Wizard de 3 steps no primeiro login: "Bem-vindo ao sunOS → Explore os clientes → Comece a criar"

### 7.3 Mobile / Responsivo

- Sidebar colapsa para 40px (ícones) — funciona
- Grid de cards não adapta (2/3 colunas fixo) — precisa breakpoint
- Chat não é mobile-friendly (sidebar direito ocupa espaço)
- Social Preview: slides são pequenos em tela mobile

**Oportunidade:** Breakpoints para `max-width: 768px` (tablet) e `max-width: 640px` (mobile).

### 7.4 Inconsistências Visuais

| Item | Onde | Problema |
|------|------|---------|
| Score display | SkillCard vs ClientCard | Formatos ligeiramente diferentes |
| Card hover | Diferentes animações por tipo de card | Padronizar |
| Modal sizes | BibliotecaModal (600px) vs VersionHistory (500px) | Padronizar |
| Button styles | Inline em cada componente | Extrair para componente Button |

### 7.5 Funcionalidades UX Desejadas

| Feature | Descrição | Complexidade |
|---------|-----------|:---:|
| **Cmd+K** | Barra de busca global | Média |
| **Drag & Drop** | Reordenar moons, steps de workflow | Média |
| **Undo** | Desfazer última ação (delete, edit) | Baixa |
| ~~**Skeleton loading**~~ | ~~Shimmer enquanto carrega~~ | ~~IMPLEMENTADO~~ (`components/ui/Skeleton.tsx`) |
| **Keyboard shortcuts** | Atalhos para ações frequentes | Baixa |
| **Histórico de chat** | Conversas anteriores acessíveis | Alta (precisa backend) |
| **Notificações** | Workflow completou, feedback recebido | Média |

---

## 8. Assets & Recursos

### Onde encontrar

| Recurso | Localização |
|---------|-------------|
| **Design System MASTER** | `design-system/MASTER.md` (source of truth) |
| **Design System page** | `/design-system` (component library visual reference) |
| **Tokens CSS** | `app/globals.css` (variáveis :root) |
| **Tailwind config** | `tailwind.config.ts` (cores, spacing, radius) |
| **Ícones** | Lucide React — https://lucide.dev/icons |
| **Font** | Inter (Google Fonts, via next/font) |
| **Referência visual** | Screenshots em `docs/handoff/` (a gerar) |
| **ADRs** | `docs/adr/` (decisões de design system) |
| **Specs de design** | `docs/superpowers/specs/` (specs originais por feature) |

### Figma

- **Não existe Figma** do projeto atualmente
- Design foi construído direto no código (code-first)
- Oportunidade: usar `/figma-generate-library` para gerar biblioteca Figma a partir do código existente

### Referências Visuais Usadas

| Referência | Inspiração |
|------------|-----------|
| Sistema solar | Visualizações de dados orbitais, interfaces espaciais |
| Dark theme | OLED dark mode, Figma dark, VS Code |
| Social Preview | Instagram app (carousel, stories, post layout) |
| Admin grids | Notion databases, Linear, Vercel dashboard |
| Chat | ChatGPT, Claude, mas com sidebar contextual |

### Como Contribuir (para designers)

1. **Tokens:** edite `app/globals.css` para novos tokens
2. **Componentes:** peça para dev usar `/new-component NomeComponente` para scaffold
3. **Prototipação:** rode `npx next dev -p 3003` e veja as mudanças em tempo real
4. **Screenshots:** use Chrome DevTools (`mcp__Chrome_DevTools__take_screenshot`) para documentar
5. **Validação:** teste ambos os temas (dark/light toggle no header)
