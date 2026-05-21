---
spec-id: SPEC-011
slug: ux-redesign
artefato: spec
nivel-sdd: spec-anchored
tamanho: large
status: rascunho
criada: 2026-04-16
atualizada: 2026-05-15
versao: 1.0
escopo:
  projeto: sunos
  stack: "Frontend: Next.js 14 + Tailwind CSS + CSS Variables"
  autor: Heitor Miranda
  papel: Tech Lead
  branch: develop
  contexto: Redesign UX baseado em AI UI patterns (Eve Weinberg, Head of Design @ Modular AI) + Mantine/Gradio/Tailwind como referencia de patterns
---

# Spec — UX Redesign

## Resumo

Redesign completo das interfaces administrativas e de interacao do sunOS, aplicando principios de AI UI Design documentados por Eve Weinberg (Head of Design, Modular AI). O redesign substitui o padrao atual de grids de cards com navegacao full-page por um padrao de **Model Repo** (tabela + sidebar filtros + side drawer) em todas as paginas de catalogo, e aplica padroes condensados e consistentes em toda a plataforma.

**O que**: Redesign de 7 areas (Biblioteca, Skills, Clientes, Workflows, Chat, Home, patterns globais) usando padroes de AI UI consolidados
**Por que**: Interface atual usa grid-first com navegacao full-page que adiciona friccao. Padroes de AI UI (HuggingFace, OpenAI, Modular) provaram que table-first + side drawer e mais eficiente para plataformas admin-heavy com muita metadata.
**Para quem**: Admins (P4) como usuarios primarios, Estrategistas (P3) e Criativos (P2) como secundarios

### Principios de Design (Eve Weinberg)

| # | Principio | Aplicacao no sunOS |
|---|-----------|-------------------|
| 1 | **Condensed information is welcomed** | Reduzir padding de cards, aumentar densidade de informacao, hierarquia tipografica forte com `--text-primary` / `--text-secondary` / `--text-muted` |
| 2 | **Parsed metadata is the most clear** | Tabelas como view default, side drawers para detalhes, sistema de tags consistente em todas as paginas |
| 3 | **Jakob's Law** | Seguir padroes de HuggingFace (model repo), OpenAI (playground), Modular (docs). Nao reinventar. |
| 4 | **Model Repo pattern** | Toda pagina de catalogo: search bar + filter sidebar + table/list + tags + pagination |
| 5 | **Highlight UGC** | Metricas de uso por item (views, vezes usado, sessoes), popularidade visivel |
| 6 | **Side drawer** | Click em row abre painel lateral de 60% (nao navega para /[id]). Editar sem perder contexto. |
| 7 | **Favor focus over features** | Cada pagina tem 1 acao primaria clara. Actions secundarias em menu dropdown ou drawer. |

### Frameworks de Referencia (patterns, nao dependencias)

| Framework | Patterns Referenciados |
|-----------|----------------------|
| **Mantine** | Table (sortable, selectable), Drawer (overlay + slide), Spotlight (Cmd+K), Dropzone, Tabs, Badge, Pagination, Checkbox.Group |
| **Gradio** | Gallery grid com thumbnails, file preview modal, upload component com progress |
| **Tailwind** | Responsive breakpoints (sm/md/lg/xl), divide-y para rows de tabela, sr-only para accessibility, animate-pulse para skeleton |

---

## 1. Biblioteca — Model Repo Pattern

**Rota:** `/biblioteca`
**Arquivo principal:** `components/biblioteca/BibliotecaPage.tsx` (novo), `app/biblioteca/page.tsx` (refactor)

### Estado Atual

Grid de `BibliotecaCard` com filtros inline (ScopePills, search, tag cloud). Cards expandiveis. Upload via modal. Sem paginacao. Sem metricas de uso.

### Estado Proposto

Layout de 3 colunas: **Filter Sidebar (240px fixo)** + **Content Area (flex)** + **Detail Drawer (60vw, overlay)**.

### 1.1 Layout Principal

```
+------------------+------------------------------------------+
| FILTER SIDEBAR   | CONTENT AREA                             |
| 240px fixed      |                                          |
|                  | [Search_________________________] [Upload]|
|                  | [Table/Grid toggle]  "32 docs · 2 filtros"|
| ESCOPO           |                                          |
| [x] Suno         | +------------------------------------------+
| [x] Vivo         | | Type | Titulo      | Tags   | Escopo | |
| [ ] Americanas   | |------|-------------|--------|--------|---|
| [ ] Sicredi      | | PDF  | Brand Book  | marca  | Suno   | > |
| [ ] Samsung      | | Audio| Jingle Q1   | audio  | Vivo   | > |
|                  | | Video| Manifesto   | video  | Suno   | > |
| TIPO             | | Img  | Logo pack   | visual | Americ | > |
| [x] PDF          | | Doc  | Tom de voz  | copy   | Suno   | > |
| [x] Audio        | +------------------------------------------+
| [x] Video        | [< 1 2 3 ... 7 >]                        |
| [ ] Imagem       |                                          |
| [ ] Texto        +------------------------------------------+
|                  |                     DRAWER (60vw)         |
| TAGS POPULARES   |                     slide-in from right   |
| [marca] [copy]   |                                          |
| [midia] [brief]  |  Document Detail                         |
| [audio] [visual] |  - Preview (thumbnail grande)            |
|                  |  - Metadata table                        |
| [Limpar filtros] |  - Tags (editaveis)                      |
+------------------+  - Usage metrics                         |
                   |  - Versions                              |
                   |  - [Editar] [Excluir]                    |
                   +------------------------------------------+
```

### 1.2 Filter Sidebar

Componente: `BibliotecaFilterSidebar.tsx`

**Especificacao:**
- Largura fixa: 240px
- Background: `var(--void)`
- Border-right: `1px solid var(--border-subtle)`
- Padding: 16px
- Sticky: `position: sticky; top: 0; height: 100vh; overflow-y: auto`

**Secoes:**

| Secao | Tipo | Comportamento |
|-------|------|---------------|
| Escopo | Checkbox.Group | Multi-select. Dot colorido antes de cada label (cor do cliente). Suno sempre primeiro. |
| Tipo de arquivo | Checkbox.Group | FileTypeIcon (14px) + label. Opcoes: PDF, Audio, Video, Imagem, Texto, Planilha |
| Tags populares | Badge group | Pills clicaveis. Top 8 tags por frequencia. OR dentro do grupo. |
| Limpar filtros | Ghost button | Reseta todos os filtros. Visivel apenas quando ha filtros ativos. |

**Comportamento de filtros:**
- OR dentro de cada grupo (Escopo, Tipo, Tags)
- AND entre grupos
- Contador atualiza em tempo real: "32 docs" muda para "8 docs" ao filtrar
- Filtros persistem em URL query params (`?scope=suno,vivo&type=pdf&tags=marca`)

### 1.3 Table View (default)

Componente: `BibliotecaTable.tsx`

**Colunas:**

| Coluna | Largura | Conteudo | Sortable |
|--------|---------|----------|----------|
| Type | 40px | `FileTypeIcon` (14px, cor por tipo) | Sim |
| Titulo | flex | Texto primary, max 1 linha, ellipsis | Sim |
| Tags | 180px | Badges pill (max 3 visiveis + "+N") | Nao |
| Escopo | 100px | Dot colorido (10px) + nome do scope | Sim |
| Usado | 60px | Numero (vezes referenciado no chat) | Sim |
| Atualizado | 100px | Relative time ("3d atras", "1h atras") | Sim |
| Acoes | 40px | IconButton "..." menu (Editar, Excluir) | Nao |

**Estilos da tabela:**
- Header: `font-size: 0.65rem`, `text-transform: uppercase`, `letter-spacing: 0.08em`, `color: var(--text-muted)`, `border-bottom: 1px solid var(--border-subtle)`
- Rows: `padding: 8px 12px`, `border-bottom: 1px solid var(--border-subtle)`, `cursor: pointer`
- Row hover: `background: var(--surface-hover)`
- Row selected: `background: rgba(255,200,1,0.05)`, `border-left: 2px solid var(--sun)`
- Sort indicator: Lucide `ChevronUp` / `ChevronDown` (10px) ao lado do header text
- Nenhuma sombra. Flat design conforme design system.

**Interacao:**
- Click em row: abre drawer com detalhes do documento
- Click em header: sort asc/desc (toggle)
- Checkbox na primeira coluna (futuro): selecao multipla para bulk actions

### 1.4 Grid View (alternativa)

Componente: reutilizar `BibliotecaCard.tsx` existente com ajustes de densidade.

**Ajustes:**
- Reduzir padding de 16px para 12px
- Thumbnail: 60x60px (era 80x80px)
- Adicionar badge de "Usado X vezes" no canto inferior direito
- Grid: `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`
- Gap: 12px (era 16px)

### 1.5 Toggle Table/Grid

Componente: `ViewToggle.tsx`

- 2 botoes icon-only: `LayoutList` (table) e `LayoutGrid` (grid)
- Estilo: ghost buttons, 32x44px (touch target compliant)
- Ativo: `color: var(--sun)`, `background: rgba(255,200,1,0.1)`
- Inativo: `color: var(--text-muted)`
- Persiste escolha em `localStorage('biblioteca-view')`
- Default: table

### 1.6 Side Drawer — Document Detail

Componente: `DocumentDrawer.tsx`

**Especificacao:**
- Largura: `60vw` (min 480px, max 800px)
- Position: `fixed`, `right: 0`, `top: 0`, `height: 100vh`
- Background: `var(--deep)`
- Border-left: `1px solid var(--border-subtle)`
- Shadow: `0 2px 12px rgba(0,0,0,0.2)` (nivel modal)
- Overlay: `rgba(0,0,0,0.3)` sobre content area
- Animacao: `transform: translateX(100%) -> translateX(0)`, `200ms ease`
- Z-index: 50
- Close: botao X no canto superior direito + click no overlay + tecla Escape
- Focus trap: sim (acessibilidade)

**Conteudo do drawer:**

```
+--------------------------------------------+
| [X]  Document Detail                       |
+--------------------------------------------+
| +----------------------------------------+ |
| |                                        | |
| |         Thumbnail Preview              | |
| |         (max 400x300, object-fit)      | |
| |                                        | |
| +----------------------------------------+ |
|                                            |
| METADATA                                   |
| +--------------------+-------------------+ |
| | Tipo               | PDF               | |
| | Tamanho            | 2.4 MB            | |
| | Escopo             | [dot] Suno        | |
| | Criado em          | 15 abr 2026       | |
| | Atualizado em      | 15 abr 2026       | |
| | Chunks             | 24                | |
| | Embedding status   | [badge] Indexed   | |
| +--------------------+-------------------+ |
|                                            |
| TAGS                                       |
| [marca] [brand] [identidade] [+ Add tag]  |
|                                            |
| USO                                        |
| +--------------------+-------------------+ |
| | Vezes referenciado | 47                | |
| | Ultima referencia  | 2h atras          | |
| | Skills que usam    | Copy Social, ...  | |
| +--------------------+-------------------+ |
|                                            |
| VERSOES                                    |
| v3 (atual) — 15 abr 2026                  |
| v2 — 10 abr 2026                          |
| v1 — 02 abr 2026                          |
|                                            |
| +------------------+ +------------------+ |
| |    [Editar]      | |    [Excluir]     | |
| +------------------+ +------------------+ |
+--------------------------------------------+
```

**Tabela de metadata:**
- Layout: 2 colunas, `divide-y` pattern
- Label column: `color: var(--text-muted)`, `font-size: 0.75rem`, `width: 140px`
- Value column: `color: var(--text-primary)`, `font-size: 0.875rem`

### 1.7 Upload Dropzone

Componente: `UploadDropzone.tsx`

**Especificacao:**
- Posicao: Botao "Upload" no header abre dropzone overlay
- Dropzone area: `border: 2px dashed var(--twilight)`, `border-radius: 12px`, `padding: 48px`, `text-align: center`
- Drag hover: `border-color: var(--sun)`, `background: rgba(255,200,1,0.05)`
- Icon: Lucide `Upload` (32px, `--text-muted`)
- Texto principal: "Arraste arquivos ou clique para selecionar" (`--text-secondary`, 0.875rem)
- Texto secundario: "PDF, DOCX, TXT, imagens, audio, video — max 50MB" (`--text-muted`, 0.75rem)
- Progress bar: `height: 4px`, `background: var(--nebula)`, fill `var(--sun)`, `border-radius: 2px`
- Multiplos arquivos: lista com nome + progresso individual
- Aceita: drag & drop nativo (HTML5) + click para file picker

### 1.8 Subtitle e Contadores

- Subtitle abaixo do search: "32 docs · 2 filtros ativos"
- Formato: `{count} docs` + ` · {filterCount} filtros ativos` (se > 0)
- Estilo: `color: var(--text-muted)`, `font-size: 0.75rem`
- Atualiza em tempo real ao filtrar

### 1.9 Paginacao

Componente: `Pagination.tsx`

- Aparece quando total > 50 itens
- Items por pagina: 50 (fixo)
- Estilo: `[< Prev] [1] [2] [3] ... [7] [Next >]`
- Botoes: ghost style, 32x44px
- Pagina ativa: `color: var(--sun)`, `font-weight: 600`
- Paginas adjacentes: max 5 numeros visiveis + ellipsis
- Position: bottom da content area, `padding-top: 16px`, `border-top: 1px solid var(--border-subtle)`

---

## 2. Skills Admin — Model Repo Pattern

**Rota:** `/skills`
**Arquivos:** `components/admin/SkillsPage.tsx` (novo), `app/skills/page.tsx` (refactor)

### Estado Atual

Grid de `SkillCard` com filtros inline (SkillFilters: search + type pills + status pills). Click em card navega para `/skills/[id]` (full page editor com 4 tabs).

### Estado Proposto

Mesmo layout Model Repo da Biblioteca. Table default + grid como alternativa + side drawer para quick edit.

### 2.1 Table View

Componente: `SkillsTable.tsx`

**Colunas:**

| Coluna | Largura | Conteudo | Sortable |
|--------|---------|----------|----------|
| Type | 40px | Dot colorido (criacao=sun, midia=blue, planejamento=green) | Sim |
| Nome | flex | Texto primary + emoji icon, max 1 linha | Sim |
| Status | 80px | Badge pill: Ativo (verde), Rascunho (sun), Arquivado (muted) | Sim |
| Modelo | 100px | Texto muted ("Gemini Flash", "GPT-4o") | Sim |
| Clientes | 80px | Numero + tooltip com nomes ("3 clientes") | Sim |
| Moons | 60px | Numero ("5 moons") | Sim |
| Score | 60px | Estrela icon + numero ("4.8") em sun color | Sim |
| Atualizado | 100px | Relative time | Sim |

**Interacao:**
- Click em row: abre drawer para quick edit
- Inline status toggle: click no badge abre dropdown (Ativo / Rascunho / Arquivado)
- Bulk actions: checkbox na primeira coluna + action bar "N selecionados — [Arquivar] [Ativar]"

### 2.2 Filter Sidebar

Componente: `SkillsFilterSidebar.tsx`

| Secao | Tipo | Opcoes |
|-------|------|--------|
| Tipo | Checkbox.Group | Criacao, Midia, Planejamento (com dot colorido) |
| Status | Checkbox.Group | Ativo, Rascunho, Arquivado |
| Modelo | Checkbox.Group | Gemini Flash, GPT-4o, Claude Sonnet |
| Cliente | Checkbox.Group | Lista de clientes com dot colorido |

### 2.3 Side Drawer — Skill Quick Edit

Componente: `SkillDrawer.tsx`

**Largura:** 60vw (min 480px, max 800px)

**Conteudo:** Tabs replicando o editor atual, mas dentro do drawer:

| Tab | Conteudo |
|-----|----------|
| Identidade | Nome (inline edit), tipo (select), emoji, descricao (textarea) |
| Configuracao | System prompt (textarea 12 linhas), modelo (select), temperatura (slider), max tokens (input) |
| Moons | Lista de moons com nome + slug. Botao "+ Moon". Reorder drag. |
| Clientes | Checkbox.Group de clientes com dot colorido. Toggle on/off por cliente. |

**Footer do drawer:**
- Botoes: `[Descartar]` (ghost) + `[Salvar]` (primary, sun)
- Estilo: `position: sticky`, `bottom: 0`, `padding: 16px`, `border-top: 1px solid var(--border-subtle)`, `background: var(--deep)`

### 2.4 Inline Status Toggle

Componente: `StatusBadgeDropdown.tsx`

- Click no status badge abre dropdown posicionado abaixo
- Opcoes: Ativo (dot verde), Rascunho (dot sun), Arquivado (dot muted)
- Click na opcao muda status imediatamente + toast de confirmacao
- Dropdown fecha ao selecionar ou click fora
- Dropdown: `background: var(--deep)`, `border: 1px solid var(--border-subtle)`, `border-radius: 8px`, `box-shadow: 0 2px 12px rgba(0,0,0,0.2)`, `min-width: 160px`

### 2.5 Bulk Actions

Componente: `BulkActionBar.tsx`

- Aparece quando >= 1 item selecionado via checkbox
- Position: `fixed`, `bottom: 24px`, `left: 50%`, `transform: translateX(-50%)`
- Estilo: `background: var(--deep)`, `border: 1px solid var(--border-subtle)`, `border-radius: 9999px`, `padding: 8px 20px`
- Conteudo: "N selecionados" + botoes de acao: `[Arquivar]` `[Ativar]` `[Descartar selecao]`
- Animacao: slide-up `200ms ease`

---

## 3. Clientes Admin — Condensed Cards

**Rota:** `/clientes`
**Arquivos:** `components/clientes/ClientCard.tsx` (refactor), `components/clientes/ClientDrawer.tsx` (novo)

### Estado Atual

Grid de `ClientCard` com search. Click navega para `/clientes/[id]` (full page editor com 4 tabs). Cards tem padding generoso e pouca informacao visivel.

### Estado Proposto

Manter grid (nao table — clientes sao poucos, visual e mais informativo) mas cards mais densos. Click abre side drawer ao inves de full page.

### 3.1 ClientCard Condensado

**Ajustes no card existente:**

| Propriedade | Antes | Depois |
|-------------|-------|--------|
| Padding | 16px | 12px |
| Gap interno | 12px | 8px |
| Titulo | 1rem | 0.875rem, weight 600 |
| Descricao | 2 linhas | 1 linha, ellipsis |
| Dot de cor | 10px | 12px, com borda branca 2px |
| Metricas | texto simples | mini grid 2x2 |

**Novas informacoes no card:**

```
+----------------------------------------------+
| [dot 12px #FFC801]  Suno                     |
| Agencia de marketing criativo               |
|                                              |
| Skills: 8    Sessions: 142                   |
| Score: 4.6   [sparkline_________]            |
|                                              |
| Ultimo acesso: 2h atras                     |
+----------------------------------------------+
```

| Campo novo | Formato | Source |
|------------|---------|--------|
| Skills count | Numero inteiro | `client.skills.length` |
| Sessions | Numero inteiro | Mock: random 50-200 |
| Score medio | 1 decimal com estrela | Media dos scores dos skills do cliente |
| Sparkline | Mini chart inline 80x20px | Mock: 7 pontos (sessoes por dia, ultima semana) |
| Ultimo acesso | Relative time, destaque | Mock: random "Xh atras" |

### 3.2 Sparkline

Componente: `Sparkline.tsx`

- SVG inline, 80x20px
- Linha: `stroke: var(--sun)`, `stroke-width: 1.5`, `fill: none`
- Area abaixo: `fill: rgba(255,200,1,0.1)`
- Pontos: nenhum (apenas linha)
- Dados: 7 valores (ultimos 7 dias de sessoes)
- Responsivo: flexivel em largura dentro do card

### 3.3 Side Drawer — Client Detail

Componente: `ClientDrawer.tsx`

**Largura:** 60vw

**Conteudo:** Tabs replicando o editor atual:

| Tab | Conteudo |
|-----|----------|
| Identidade | Nome, cor (color picker), slug, descricao, contato |
| Skills | Toggle list de skills atribuidos (com type dot + status badge) |
| Biblioteca | Lista de docs do scope deste cliente (link para BibliotecaDrawer) |
| Metricas | Sessions over time (chart maior), score medio, feedback breakdown |

### 3.4 Grid Layout

- `grid-template-columns: repeat(auto-fill, minmax(260px, 1fr))` (era minmax(300px))
- Gap: 12px (era 16px)
- Mobile (< 768px): 1 coluna

---

## 4. Workflows — Pipeline Table

**Rota:** `/workflows`
**Arquivos:** `components/workflows/WorkflowsPage.tsx` (novo), `app/workflows/page.tsx` (refactor)

### Estado Atual

Grid de `WorkflowCard` com filtros. Builder em full page. Historico em full page separada.

### Estado Proposto

Table view como default. Side drawer com step list + run history. Schedule humanizado.

### 4.1 Table View

Componente: `WorkflowsTable.tsx`

**Colunas:**

| Coluna | Largura | Conteudo | Sortable |
|--------|---------|----------|----------|
| Nome | flex | Texto primary, 1 linha | Sim |
| Status | 80px | Badge: Ativo (verde), Rascunho (sun), Pausado (amber) | Sim |
| Schedule | 120px | Humanizado: "Seg 9h", "Diario 8h", "Manual" | Sim |
| Ultimo run | 140px | Relative time + status dot (verde=ok, vermelho=falhou) | Sim |
| Steps | 60px | Numero ("4 steps") | Sim |
| Cliente | 100px | Scope client name ou "Global" | Sim |
| Acoes | 80px | [Play] [Pause] [Edit] icon buttons | Nao |

### 4.2 Schedule Humanizado

Funcao: `humanizeSchedule(cron: string): string`

| Cron | Humanizado |
|------|-----------|
| `0 9 * * 1` | Seg 9h |
| `0 8 * * *` | Diario 8h |
| `0 9 1 * *` | Dia 1, 9h |
| `0 9 * * 1-5` | Seg-Sex 9h |
| `null` | Manual |

Estilo: `color: var(--text-secondary)`, `font-size: 0.75rem`. Se schedule ativo, prefixo com icone `Clock` (12px, `--text-muted`).

### 4.3 Side Drawer — Workflow Detail

Componente: `WorkflowDrawer.tsx`

**Largura:** 60vw

**Conteudo (2 tabs):**

**Tab 1: Steps**
```
+------------------------------------------+
| Nome do Workflow                    [Edit]|
| Descricao breve do workflow              |
+------------------------------------------+
| STEPS                                    |
|                                          |
| 1. [tool] Buscar dados         12s avg  |
|    query_data                            |
|                                          |
| 2. [llm] Gerar analise         23s avg  |
|    gemini-flash                          |
|                                          |
| 3. [hitl] Revisao humana       —        |
|    Aguarda aprovacao                     |
|                                          |
| 4. [action] Enviar Slack       2s avg   |
|    #reports                              |
+------------------------------------------+
| SCHEDULE                                 |
| Seg 9h (America/Sao_Paulo)              |
| Proximo run: Seg 21 abr, 09:00          |
+------------------------------------------+
```

**Tab 2: Historico de Runs**
```
+------------------------------------------+
| RUNS RECENTES                            |
|                                          |
| #12  07/04 09:01  [Sucesso]   47s       |
|   > Expandir steps                       |
|                                          |
| #11  31/03 09:01  [Falhou]    15s       |
|   > Expandir steps                       |
|                                          |
| #10  24/03 09:01  [Sucesso]   52s       |
|   > Expandir steps                       |
+------------------------------------------+
```

### 4.4 Quick Actions

Na coluna de acoes da tabela:

| Acao | Icone | Comportamento |
|------|-------|---------------|
| Run now | `Play` (14px) | Executa workflow imediatamente. Toast: "Workflow iniciado" |
| Pause | `Pause` (14px) | Pausa schedule. Muda status para "paused". Toast: "Schedule pausado" |
| Edit | `Pencil` (14px) | Abre side drawer com tabs de config |

Botoes: `44x44px` touch target (padding ao redor do icone de 14px). Cor: `--text-muted`, hover: `--text-secondary`.

---

## 5. Chat — AI Patterns

**Rota:** `/[clientSlug]/[skillSlug]/[moonSlug]`
**Arquivos:** `components/chat/ChatInterface.tsx` (refactor), novos componentes

### Estado Atual

Chat com streaming, prompt templates, social preview, HITL feedback no sidebar. Sem indicacao de modelo. Sem metricas de custo/tokens.

### Estado Proposto

Manter layout existente. Adicionar metadata de modelo, indicadores de custo, feedback persistente, e prompt suggestions contextuais.

### 5.1 Model Badge no Header

Componente: `ModelBadge.tsx`

- Position: header do chat, ao lado do titulo do moon
- Estilo: badge pill, `background: var(--nebula)`, `border: 1px solid var(--border-subtle)`, `border-radius: 9999px`, `padding: 2px 10px`
- Conteudo: icone do provider (8px) + nome do modelo
- Exemplos: "Gemini Flash", "GPT-4o", "Claude Sonnet"
- `font-size: 0.65rem`, `color: var(--text-muted)`, `text-transform: uppercase`, `letter-spacing: 0.08em`

### 5.2 Token / Cost Indicator

Componente: `TokenIndicator.tsx`

- Position: footer do chat, ao lado do input, alinhado a direita
- Visibilidade: apenas apos primeira mensagem da sessao
- Conteudo: `{tokens_used} tokens · ~${cost}`
- Estilo: `font-size: 0.65rem`, `color: var(--text-muted)`
- Calculo mock: `tokens * 0.000001` para Gemini Flash (exibir com 4 decimals: "$0.0012")
- Tooltip on hover: breakdown input/output tokens
- Pode ser ocultado via toggle em settings (power user feature)

### 5.3 Streaming Indicator com Model Name

Componente: refactor `StreamingIndicator.tsx`

**Antes:** "..." animado (3 dots pulsando)
**Depois:** "[ModelBadge] gerando..." com dots animados

- Layout: `display: flex; align-items: center; gap: 8px`
- Model badge: mesmo estilo do header badge, mas inline
- Texto: "gerando" + 3 dots com `animation: pulse 1.5s infinite` (cada dot com delay)
- Respeita `prefers-reduced-motion`: sem animacao, mostra "gerando..." estatico

### 5.4 Feedback Persistente

Componente: `FeedbackLink.tsx`

- Position: sidebar do chat, secao propria (abaixo de Context)
- Sempre visivel (nao apenas quando HITL ativado)
- Conteudo: icone `MessageCircle` (14px) + "Dar Feedback" + contador de feedbacks da sessao
- Click: expande formulario inline (textarea + rating 1-5 + enviar)
- Estilo: `color: var(--text-secondary)`, hover: `color: var(--sun)`

### 5.5 Prompt Suggestions Contextuais

Componente: `ContextualSuggestions.tsx`

**Diferenca do PromptTemplateBar existente:**
- PromptTemplateBar: templates estaticos, aparecem apenas no chat vazio
- ContextualSuggestions: sugestoes dinamicas baseadas no contexto da conversa

**Comportamento:**
- Aparecem apos cada resposta do assistant (abaixo da mensagem)
- Max 3 sugestoes por vez
- Baseadas em:
  - Tipo do moon (Feed → sugestoes de formatos de post)
  - Ultimo topico discutido (match por keywords do output)
  - Templates do skill que nao foram usados ainda
- Estilo: botoes ghost inline, `font-size: 0.75rem`, `border: 1px solid var(--border-subtle)`, `border-radius: 8px`, `padding: 4px 12px`
- Click: preenche o input com o texto da sugestao (nao envia automaticamente)
- Mock: sugestoes hardcoded por tipo de moon (v1)

---

## 6. Home (Sistema Solar) — Melhorias

**Rota:** `/`
**Arquivos:** `components/solar/` (ajustes), `app/page.tsx` (ajustes)

### Restricao

NAO modificar a mecanica visual do sistema solar (orbitas, planetas, animacoes). Apenas adicionar elementos informativos complementares.

### 6.1 Quick Stats Bar

Componente: `QuickStatsBar.tsx`

- Position: abaixo do header, antes do canvas do sistema solar
- Layout: `display: flex; justify-content: center; gap: 32px`
- Estilo: `padding: 8px 16px`, sem background (transparente sobre o canvas)

**Stats:**

| Stat | Formato | Icone |
|------|---------|-------|
| Documentos | "31 docs" | `FileText` (14px) |
| Skills | "8 skills" | `Zap` (14px) |
| Sessoes hoje | "12 sessoes" | `MessageCircle` (14px) |
| Score medio | "4.3 avg" | `Star` (14px) |

- Numeros: `font-size: 1rem`, `font-weight: 600`, `color: var(--text-primary)`
- Labels: `font-size: 0.65rem`, `color: var(--text-muted)`, `text-transform: uppercase`
- Icones: `color: var(--text-muted)`, 14px, ao lado do numero

### 6.2 Tooltip no Hover do Planeta

Componente: refactor `PlanetNode.tsx`

**Tooltip ao hover:**
```
+------------------------+
| Suno                   |
| 8 skills · 142 sessoes |
| Score: 4.6             |
| Ultimo: 2h atras       |
+------------------------+
```

- Trigger: `onMouseEnter` no planeta (200ms delay para evitar flash)
- Estilo: `background: var(--deep)`, `border: 1px solid var(--border-subtle)`, `border-radius: 8px`, `padding: 8px 12px`, `box-shadow: 0 2px 12px rgba(0,0,0,0.2)`
- Position: acima do planeta, centralizado
- `font-size: 0.75rem`
- Dados: mock (mesmo do ClientCard condensado)
- Dismiss: `onMouseLeave`
- Mobile: nao mostrar tooltip (touch nao tem hover)

### 6.3 Rename Label

- Trocar label "4 BIOMAS" para "4 CLIENTES" (ou numero dinamico)
- Componente: `OrbitalSystem.tsx` ou equivalente onde o label e renderizado
- Formato: `{clients.length} CLIENTES`

### 6.4 Sun Size Responsivo

- Desktop wide (> 1440px): reduzir tamanho do sol em 20% (`transform: scale(0.8)`)
- Motivo: em telas ultrawide o sol domina demais o espaco visual
- Implementacao: media query `@media (min-width: 1440px)` no container do CenterNode
- Manter tamanho atual para telas <= 1440px

---

## 7. Patterns Globais

Componentes reutilizaveis aplicados em todas as paginas.

### 7.1 Cmd+K Spotlight Search

Componente: `Spotlight.tsx`

**Trigger:**
- Atalho: `Cmd+K` (Mac) / `Ctrl+K` (Windows/Linux)
- Botao no header: icone `Search` com hint "Cmd+K"

**Visual:**
```
+----------------------------------------------+
|  [Search icon] Buscar skills, docs, clientes |
|                                              |
| SKILLS                                       |
|  [Zap] Copy Social          Criacao          |
|  [Zap] Plano de Midia       Midia            |
|                                              |
| DOCUMENTOS                                   |
|  [File] Brand Book Suno     PDF · marca      |
|  [File] Tom de Voz Vivo     DOCX · copy      |
|                                              |
| CLIENTES                                     |
|  [dot] Suno                 8 skills         |
|  [dot] Vivo                 6 skills         |
|                                              |
| WORKFLOWS                                    |
|  [Play] Report Mensal       Ativo · Seg 9h   |
+----------------------------------------------+
```

**Especificacao:**
- Position: `fixed`, `top: 20%`, `left: 50%`, `transform: translateX(-50%)`
- Largura: `min(600px, 90vw)`
- Background: `var(--deep)`
- Border: `1px solid var(--twilight)` (mais forte que subtle para destaque)
- Border-radius: 12px
- Shadow: `0 2px 12px rgba(0,0,0,0.3)`
- Overlay: `rgba(0,0,0,0.5)`
- Z-index: 100 (acima de tudo)

**Input:**
- Autofocus ao abrir
- Placeholder: "Buscar skills, docs, clientes, workflows..."
- `font-size: 1rem`
- Icone Search a esquerda (20px, `--text-muted`)
- Debounce: 200ms antes de buscar

**Resultados:**
- Agrupados por tipo (Skills, Documentos, Clientes, Workflows)
- Header do grupo: `font-size: 0.65rem`, `text-transform: uppercase`, `color: var(--text-muted)`, `padding: 8px 16px`
- Item: `padding: 8px 16px`, `cursor: pointer`, hover: `background: var(--surface-hover)`
- Icone tipo + nome + metadata secundaria a direita
- Max 4 resultados por grupo (total max 16 visiveis)
- Navegacao por setas (up/down) + Enter para selecionar
- Escape ou click fora: fecha

**Navegacao ao selecionar:**
- Skill: navega para `/skills` e abre drawer do skill
- Documento: navega para `/biblioteca` e abre drawer do doc
- Cliente: navega para `/clientes` e abre drawer do cliente
- Workflow: navega para `/workflows` e abre drawer do workflow

**Busca (v1 - client-side):**
- Busca em memoria sobre dados ja carregados nos contexts (SkillsContext, BibliotecaContext, ClientesContext, WorkflowsContext)
- Match: `item.name.toLowerCase().includes(query)` + tags/type como boost
- Sem backend necessario na v1

### 7.2 Side Drawer Pattern

Componente base: `BaseDrawer.tsx`

Todos os drawers (Document, Skill, Client, Workflow) herdam deste componente base.

**Props:**

```typescript
interface BaseDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  width?: string;           // default "60vw"
  children: React.ReactNode;
  footer?: React.ReactNode; // sticky footer (botoes Salvar/Cancelar)
}
```

**Comportamento padrao:**
- Overlay com click-to-close
- Escape para fechar
- Focus trap (tab cycling dentro do drawer)
- `aria-modal="true"`, `role="dialog"`, `aria-labelledby` apontando para titulo
- Body scroll lock quando aberto
- Animacao: slide-in da direita, 200ms ease
- Close button: icone `X` (14px), posicao absoluta top-right, 44x44px touch target

### 7.3 Table como Default (padrao de tabela)

Componente base: `DataTable.tsx`

**Props:**

```typescript
interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  sortable?: boolean;
  selectable?: boolean;
  emptyState?: React.ReactNode;
  loading?: boolean;
}

interface Column<T> {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}
```

**Estilos padrao (todas as tabelas):**
- Table: `width: 100%`, `border-collapse: collapse`
- Header row: `border-bottom: 1px solid var(--border-subtle)`, `position: sticky; top: 0`, `background: var(--void)`, `z-index: 10`
- Header cell: `padding: 8px 12px`, `font-size: 0.65rem`, `text-transform: uppercase`, `letter-spacing: 0.08em`, `color: var(--text-muted)`, `font-weight: 500`, `text-align: left`, `user-select: none`
- Body row: `border-bottom: 1px solid var(--border-subtle)`, `cursor: pointer`, `transition: background 150ms ease`
- Body row hover: `background: var(--surface-hover)`
- Body cell: `padding: 8px 12px`, `font-size: 0.875rem`, `color: var(--text-primary)`
- Empty state: renderiza `emptyState` prop centralizado na area da tabela
- Loading: renderiza skeleton rows (ver 7.5)

### 7.4 Responsivo: Table para Card List

**Breakpoints:**

| Breakpoint | Layout | Comportamento |
|------------|--------|---------------|
| Desktop (>= 1024px) | Filter sidebar + table + drawer overlay | Layout completo |
| Tablet (768-1023px) | Filter sidebar collapsa para icone toggle + table | Sidebar vira off-canvas |
| Mobile (< 768px) | Sem sidebar + card list (nao table, nao grid) | Cada row vira card |

**Card list mobile:**
- Cada item renderiza como card vertical (stacked)
- Mostra: icone tipo + titulo + 2-3 metadata fields em stack
- Padding: 12px
- Border-bottom: `1px solid var(--border-subtle)`
- Click: abre drawer em full-screen (100vw)

**Implementacao:**
- CSS media queries (nao JS)
- Table tem classe `.data-table` com `display: table` no desktop e `display: block` no mobile
- Cada `<tr>` tem classe `.data-table-row` com `display: table-row` no desktop e `display: flex; flex-direction: column` no mobile

### 7.5 Skeleton Loading

Componente: `Skeleton.tsx`

**Variantes:**

| Variante | Dimensoes | Uso |
|----------|-----------|-----|
| `SkeletonText` | `height: 14px`, `width: {prop}`, `border-radius: 4px` | Placeholder para texto |
| `SkeletonCircle` | `width: {size}`, `height: {size}`, `border-radius: 50%` | Avatars, dots |
| `SkeletonRect` | `width: {w}`, `height: {h}`, `border-radius: 8px` | Cards, thumbnails |
| `SkeletonTableRow` | Row inteira com skeleton cells | Tabelas |
| `SkeletonCard` | Card shape com placeholders internos | Grids |

**Animacao:**
```css
@keyframes skeleton-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.1; }
}

.skeleton {
  background: var(--nebula);
  animation: skeleton-pulse 2s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .skeleton {
    animation: none;
    opacity: 0.3;
  }
}
```

**Uso em tabelas:**
- Renderizar 5 skeleton rows enquanto dados carregam
- Cada skeleton row tem colunas com `SkeletonText` de larguras variadas (simula dados reais)
- Nenhum conteudo textual durante loading (apenas blocos animados)

**Uso em cards:**
- Renderizar N skeleton cards no grid (mesmo layout do card real)
- Thumbnail: `SkeletonRect`, titulo: `SkeletonText width=60%`, subtitulo: `SkeletonText width=40%`

### 7.6 Subtitles com Valor

Todas as paginas devem ter subtitle informativo abaixo do titulo.

| Pagina | Subtitle |
|--------|----------|
| Biblioteca | "{N} documentos · {M} filtros ativos" |
| Skills | "{N} skills · {M} ativos" |
| Clientes | "{N} clientes" |
| Workflows | "{N} workflows · {M} agendados" |
| Chat | Moon name + model badge + session duration |
| Home | Quick stats bar (ver 6.1) |

Estilo: `font-size: 0.75rem`, `color: var(--text-muted)`, `margin-top: 4px`, `margin-bottom: 16px`

### 7.7 Empty States

Componente: `EmptyState.tsx`

**Props:**

```typescript
interface EmptyStateProps {
  icon: LucideIcon;       // icone grande central (48px)
  title: string;          // "Nenhum documento encontrado"
  description: string;    // "Adicione documentos a Biblioteca para..."
  action?: {
    label: string;        // "Adicionar documento"
    onClick: () => void;
  };
  suggestions?: string[]; // ["Tente remover filtros", "Upload um arquivo"]
}
```

**Visual:**
```
+------------------------------------------+
|                                          |
|              [FileText 48px]             |
|                                          |
|     Nenhum documento encontrado          |
|  Adicione documentos a Biblioteca para   |
|  enriquecer as respostas da IA           |
|                                          |
|       [+ Adicionar documento]            |
|                                          |
|  Sugestoes:                              |
|  · Tente remover os filtros ativos       |
|  · Upload um PDF ou documento de texto   |
+------------------------------------------+
```

**Estilos:**
- Container: `text-align: center`, `padding: 48px 24px`
- Icone: 48px, `color: var(--text-muted)`, `opacity: 0.5`
- Titulo: `font-size: 1rem`, `font-weight: 500`, `color: var(--text-primary)`, `margin-top: 16px`
- Descricao: `font-size: 0.875rem`, `color: var(--text-secondary)`, `margin-top: 8px`, `max-width: 400px`, `margin-inline: auto`
- Botao CTA: botao primario (sun), `margin-top: 24px`
- Sugestoes: `font-size: 0.75rem`, `color: var(--text-muted)`, `margin-top: 16px`, bullet list

**Empty states por pagina:**

| Pagina | Icone | Titulo | CTA |
|--------|-------|--------|-----|
| Biblioteca | `FileText` | Nenhum documento encontrado | Adicionar documento |
| Biblioteca (filtrada) | `Search` | Nenhum resultado para os filtros | Limpar filtros |
| Skills | `Zap` | Nenhum skill configurado | Criar primeiro skill |
| Clientes | `Users` | Nenhum cliente cadastrado | Adicionar cliente |
| Workflows | `Workflow` | Nenhum workflow criado | Criar workflow |
| Workflows (filtrado) | `Search` | Nenhum workflow para os filtros | Limpar filtros |
| Spotlight (sem resultados) | `Search` | Nenhum resultado para "{query}" | — |

---

## Componentes Novos — Inventario

### Componentes a criar

| Componente | Path | Tipo | Usado em |
|-----------|------|------|----------|
| `DataTable` | `components/ui/DataTable.tsx` | Primitiva | Biblioteca, Skills, Workflows |
| `BaseDrawer` | `components/ui/BaseDrawer.tsx` | Primitiva | Todos os drawers |
| `Spotlight` | `components/ui/Spotlight.tsx` | Global | AppShell (Cmd+K) |
| `Pagination` | `components/ui/Pagination.tsx` | Primitiva | Biblioteca, Skills |
| `ViewToggle` | `components/ui/ViewToggle.tsx` | Primitiva | Biblioteca, Skills |
| `Skeleton` | `components/ui/Skeleton.tsx` | Primitiva | Todas as paginas |
| `EmptyState` | `components/ui/EmptyState.tsx` | Primitiva | Todas as paginas |
| `Sparkline` | `components/ui/Sparkline.tsx` | Primitiva | ClientCard |
| `StatusBadgeDropdown` | `components/ui/StatusBadgeDropdown.tsx` | Primitiva | SkillsTable |
| `BulkActionBar` | `components/ui/BulkActionBar.tsx` | Primitiva | SkillsTable |
| `ModelBadge` | `components/chat/ModelBadge.tsx` | Chat | ChatInterface |
| `TokenIndicator` | `components/chat/TokenIndicator.tsx` | Chat | ChatInterface |
| `ContextualSuggestions` | `components/chat/ContextualSuggestions.tsx` | Chat | ChatInterface |
| `FeedbackLink` | `components/chat/FeedbackLink.tsx` | Chat | ContextSidebar |
| `QuickStatsBar` | `components/solar/QuickStatsBar.tsx` | Home | Home page |
| `BibliotecaFilterSidebar` | `components/biblioteca/BibliotecaFilterSidebar.tsx` | Biblioteca | Biblioteca page |
| `BibliotecaTable` | `components/biblioteca/BibliotecaTable.tsx` | Biblioteca | Biblioteca page |
| `DocumentDrawer` | `components/biblioteca/DocumentDrawer.tsx` | Biblioteca | Biblioteca page |
| `UploadDropzone` | `components/biblioteca/UploadDropzone.tsx` | Biblioteca | Biblioteca page |
| `SkillsFilterSidebar` | `components/admin/SkillsFilterSidebar.tsx` | Skills | Skills page |
| `SkillsTable` | `components/admin/SkillsTable.tsx` | Skills | Skills page |
| `SkillDrawer` | `components/admin/SkillDrawer.tsx` | Skills | Skills page |
| `ClientDrawer` | `components/clientes/ClientDrawer.tsx` | Clientes | Clientes page |
| `WorkflowsTable` | `components/workflows/WorkflowsTable.tsx` | Workflows | Workflows page |
| `WorkflowDrawer` | `components/workflows/WorkflowDrawer.tsx` | Workflows | Workflows page |

### Componentes a refatorar

| Componente | Mudanca |
|-----------|---------|
| `BibliotecaCard.tsx` | Reduzir padding, adicionar badge de uso |
| `ClientCard.tsx` | Condensar, adicionar sparkline, metricas |
| `SkillCard.tsx` | Apenas ajuste de densidade (view alternativa) |
| `WorkflowCard.tsx` | Apenas ajuste de densidade (view alternativa) |
| `StreamingIndicator.tsx` | Adicionar model name |
| `ContextSidebar.tsx` | Adicionar secao FeedbackLink |
| `PlanetNode.tsx` | Adicionar tooltip on hover |
| `OrbitalSystem.tsx` | Renomear label, ajustar sun size responsivo |
| `ChatInterface.tsx` | Adicionar ModelBadge, TokenIndicator, ContextualSuggestions |
| `AppShell.tsx` | Integrar Spotlight (Cmd+K listener) |
| `AppHeader.tsx` | Adicionar search icon com hint Cmd+K |

---

## Criterios de Aceite

### Biblioteca

- [ ] DADO a pagina `/biblioteca`, QUANDO carrega, ENTAO exibe layout com filter sidebar (240px) a esquerda e tabela como view default
- [ ] DADO filtros na sidebar, QUANDO usuario marca checkboxes de Escopo/Tipo/Tags, ENTAO tabela filtra em tempo real e contador atualiza ("N docs · M filtros")
- [ ] DADO filtros ativos, QUANDO usuario clica "Limpar filtros", ENTAO todos os filtros sao resetados e tabela mostra todos os docs
- [ ] DADO tabela de documentos, QUANDO usuario clica em header de coluna, ENTAO tabela ordena asc/desc por aquela coluna
- [ ] DADO tabela de documentos, QUANDO usuario clica em row, ENTAO drawer de 60vw abre da direita com detalhes do documento
- [ ] DADO drawer aberto, QUANDO usuario clica no overlay ou pressiona Escape, ENTAO drawer fecha com animacao slide-out
- [ ] DADO drawer aberto, QUANDO usuario pressiona Tab repetidamente, ENTAO focus permanece dentro do drawer (focus trap)
- [ ] DADO toggle de view, QUANDO usuario clica no icone de grid, ENTAO muda para grid view e preferencia e salva em localStorage
- [ ] DADO mais de 50 documentos, QUANDO pagina carrega, ENTAO paginacao aparece no rodape (50 por pagina)
- [ ] DADO botao Upload, QUANDO usuario clica, ENTAO dropzone aparece com area de drag & drop
- [ ] DADO arquivo arrastado sobre dropzone, QUANDO solto, ENTAO upload inicia com progress bar e toast de confirmacao
- [ ] DADO tabela com 0 resultados (filtro ou vazio), QUANDO renderiza, ENTAO mostra EmptyState com icone, mensagem e CTA

### Skills Admin

- [ ] DADO a pagina `/skills`, QUANDO carrega, ENTAO exibe layout Model Repo com filter sidebar + tabela default
- [ ] DADO tabela de skills, QUANDO usuario clica em row, ENTAO drawer abre com tabs (Identidade, Configuracao, Moons, Clientes)
- [ ] DADO drawer de skill aberto, QUANDO usuario edita campos e clica Salvar, ENTAO mudancas sao persistidas e toast confirma
- [ ] DADO status badge na tabela, QUANDO usuario clica, ENTAO dropdown aparece com opcoes (Ativo/Rascunho/Arquivado)
- [ ] DADO opcao selecionada no dropdown de status, QUANDO clica, ENTAO status muda imediatamente e toast confirma
- [ ] DADO checkboxes de selecao, QUANDO usuario seleciona 2+ skills, ENTAO BulkActionBar aparece no rodape com acoes disponiveis
- [ ] DADO BulkActionBar visivel, QUANDO usuario clica "Arquivar", ENTAO todos os skills selecionados mudam para status Arquivado

### Clientes Admin

- [ ] DADO a pagina `/clientes`, QUANDO carrega, ENTAO exibe grid de cards condensados com metricas visiveis
- [ ] DADO card de cliente, QUANDO usuario clica, ENTAO drawer abre com 4 tabs (nao navega para `/clientes/[id]`)
- [ ] DADO card de cliente, QUANDO renderizado, ENTAO mostra sparkline de sessoes e "Ultimo acesso: Xh atras"

### Workflows

- [ ] DADO a pagina `/workflows`, QUANDO carrega, ENTAO exibe tabela com schedule humanizado ("Seg 9h" em vez de cron)
- [ ] DADO tabela de workflows, QUANDO usuario clica em row, ENTAO drawer abre com tabs (Steps, Historico)
- [ ] DADO icone Play na coluna de acoes, QUANDO usuario clica, ENTAO workflow executa e toast confirma "Workflow iniciado"

### Chat

- [ ] DADO chat aberto, QUANDO renderiza header, ENTAO ModelBadge mostra nome do modelo atual ("Gemini Flash")
- [ ] DADO mensagem enviada, QUANDO streaming inicia, ENTAO StreamingIndicator mostra "[Gemini Flash] gerando..."
- [ ] DADO sessao de chat ativa, QUANDO ha tokens consumidos, ENTAO TokenIndicator mostra contagem no rodape
- [ ] DADO resposta do assistant renderizada, QUANDO abaixo da mensagem, ENTAO mostra ate 3 prompt suggestions contextuais
- [ ] DADO sidebar do chat, QUANDO renderiza, ENTAO secao "Dar Feedback" esta visivel permanentemente

### Home

- [ ] DADO pagina Home, QUANDO carrega, ENTAO QuickStatsBar mostra 4 metricas abaixo do header
- [ ] DADO planeta no sistema solar, QUANDO usuario hover, ENTAO tooltip mostra resumo do cliente (skills, sessoes, score)
- [ ] DADO label de biomas, QUANDO renderiza, ENTAO mostra "N CLIENTES" em vez de "4 BIOMAS"
- [ ] DADO tela ultrawide (> 1440px), QUANDO renderiza, ENTAO sol central e reduzido em 20%

### Patterns Globais

- [ ] DADO qualquer pagina, QUANDO usuario pressiona Cmd+K (Mac) ou Ctrl+K, ENTAO Spotlight abre centralizado
- [ ] DADO Spotlight aberto, QUANDO usuario digita "Copy", ENTAO resultados agrupados por tipo aparecem em < 200ms
- [ ] DADO Spotlight com resultado selecionado, QUANDO usuario pressiona Enter, ENTAO navega para pagina do item e abre drawer
- [ ] DADO Spotlight aberto, QUANDO usuario pressiona Escape, ENTAO Spotlight fecha
- [ ] DADO qualquer pagina de catalogo em tela < 768px, QUANDO renderiza, ENTAO tabela muda para card list vertical
- [ ] DADO dados carregando em qualquer pagina, QUANDO aguardando API/context, ENTAO skeleton loading aparece (animate-pulse)
- [ ] DADO pagina sem dados, QUANDO renderiza, ENTAO EmptyState aparece com icone, titulo, descricao e CTA
- [ ] DADO `prefers-reduced-motion: reduce`, QUANDO qualquer animacao executa, ENTAO animacao e desabilitada ou reduzida
- [ ] DADO qualquer drawer aberto, QUANDO inspecionado, ENTAO tem `role="dialog"`, `aria-modal="true"`, `aria-labelledby` correto
- [ ] DADO qualquer elemento interativo, QUANDO recebe focus via teclado, ENTAO focus ring visivel (`0 0 0 2px rgba(255,200,1,0.3)`)

---

## Restricoes Tecnicas

1. **Zero novas dependencias** — implementar tudo com CSS variables existentes + Tailwind + Lucide React. Nao instalar Mantine, Gradio, ou qualquer biblioteca de componentes. Os frameworks sao referencia de pattern, nao de codigo.

2. **CSS Variables existentes** — usar exclusivamente os tokens definidos em `app/globals.css` (MASTER.md). Nao criar novos tokens sem necessidade. Tokens permitidos: `--void`, `--deep`, `--nebula`, `--twilight`, `--sun`, `--text-primary`, `--text-secondary`, `--text-muted`, `--border-subtle`, `--surface-hover`, `--header-bg`, cores funcionais, cores de clientes.

3. **Inline styles** — seguir o padrao existente do projeto (inline styles para layout, nao classes Tailwind). Tailwind apenas para utilitarios que nao existem como CSS variable (ex: `animate-pulse`, `sr-only`, breakpoints responsivos).

4. **Sistema Solar intocavel** — nao modificar mecanica visual, animacoes, ou estrutura do sistema solar. Apenas adicionar elementos informativos (stats bar, tooltip, label).

5. **Dados mock** — metricas de uso (views, sessions, tokens, cost) sao mock na v1. Estruturar tipos para receberem dados reais do backend no futuro.

6. **TypeScript strict** — todos os componentes novos devem ser tipados. Props com interfaces explicitas. Nenhum `any`.

7. **Acessibilidade WCAG AA** — todo componente novo deve cumprir: contraste 4.5:1, focus ring, roles ARIA, keyboard navigation, `prefers-reduced-motion`.

8. **Ambos os temas** — todo componente novo deve funcionar em dark e light theme usando CSS variables (nao hardcode de cores).

9. **`data/clients.ts` intocavel** — conforme CLAUDE.md, nao modificar source do sistema solar.

10. **`npx tsc --noEmit` deve passar** — validar apos cada mudanca.

---

## Fases de Implementacao

| Fase | Escopo | Componentes | Sprint |
|------|--------|-------------|--------|
| **1** | Primitivas UI | `DataTable`, `BaseDrawer`, `Skeleton`, `EmptyState`, `Pagination`, `ViewToggle` | Sprint 1 |
| **2** | Biblioteca redesign | `BibliotecaFilterSidebar`, `BibliotecaTable`, `DocumentDrawer`, `UploadDropzone` + refactor page | Sprint 1 |
| **3** | Skills redesign | `SkillsFilterSidebar`, `SkillsTable`, `SkillDrawer`, `StatusBadgeDropdown`, `BulkActionBar` + refactor page | Sprint 2 |
| **4** | Workflows redesign | `WorkflowsTable`, `WorkflowDrawer`, `humanizeSchedule` + refactor page | Sprint 2 |
| **5** | Clientes redesign | `ClientDrawer`, `Sparkline`, refactor `ClientCard` + page | Sprint 2 |
| **6** | Chat enhancements | `ModelBadge`, `TokenIndicator`, `ContextualSuggestions`, `FeedbackLink`, refactor `StreamingIndicator` | Sprint 3 |
| **7** | Home improvements | `QuickStatsBar`, tooltip em `PlanetNode`, label rename, sun responsive | Sprint 3 |
| **8** | Spotlight + Responsivo | `Spotlight` (Cmd+K), responsive breakpoints (table -> card list), integration em `AppShell` | Sprint 3 |

---

## Notas de Implementacao

1. **BaseDrawer como fundacao** — implementar primeiro, pois todos os drawers dependem dele. Testar focus trap, escape, overlay click, e body scroll lock antes de prosseguir.

2. **DataTable generica** — usar generics TypeScript (`DataTable<T>`) para que a mesma tabela sirva para Biblioteca, Skills, e Workflows com tipagem diferente. Colunas definidas por config, nao hardcode.

3. **Spotlight busca client-side** — na v1, Spotlight busca em dados ja carregados nos React Contexts. Nao precisa de endpoint novo no backend. Quando backend tiver search API, migrar para server-side search com debounce.

4. **Metricas mock** — criar tipos em `lib/metrics-types.ts` com campos para usage metrics. Gerar dados mock com `Math.random()` + seeds fixas para consistencia. Comentar campos que receberao dados reais: `// TODO: replace with API data`.

5. **Filter sidebar responsivo** — em tablet (768-1023px), sidebar colapsa para um botao "Filtros" que abre off-canvas overlay. Em mobile (< 768px), filtros viram full-screen modal. Usar mesma logica de collapse do Sidebar principal como referencia.

6. **Skeleton loading no DataTable** — renderizar 5 rows de skeleton quando `loading={true}`. Cada coluna tem um `SkeletonText` com largura proporcional ao conteudo esperado.

7. **Drawer nao substitui editor full-page** — o drawer e para quick edit. O editor full-page (`/skills/[id]`, `/clientes/[id]`) continua existindo para edicoes complexas. Drawer deve ter um link "Abrir editor completo" que navega para a rota existente.

8. **URL sync** — filtros da sidebar devem ser sincronizados com URL query params para que links compartilhaveis preservem o estado de filtro. Usar `useSearchParams` do Next.js.

9. **Transicoes suaves** — todos os drawers usam `transition: transform 200ms ease`. Overlay usa `transition: opacity 200ms ease`. Skeleton usa `animation: skeleton-pulse 2s ease-in-out infinite`. Respeitar `prefers-reduced-motion`.

10. **Rota preservada** — o redesign NAO muda nenhuma rota. Todas as URLs (`/biblioteca`, `/skills`, `/clientes`, `/workflows`, etc.) permanecem as mesmas. Apenas o conteudo das paginas muda.

---

## Changelog

| Versao | Data | Mudanca |
|--------|------|---------|
| 1.0 | 2026-04-16 | Versao inicial. Redesign de 7 areas baseado em AI UI patterns (Eve Weinberg) com principios de condensed information, parsed metadata, Jakob's Law, Model Repo, side drawer. 26 componentes novos, 11 refatorados. |
