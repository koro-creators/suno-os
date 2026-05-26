---
spec-id: SPEC-020
slug: busca-global
nivel-sdd: spec-anchored
tamanho: medium
status: rascunho
criada: 2026-05-26
atualizada: 2026-05-26
versao: 1.0
escopo:
  projeto: sunos
  stack: "Next.js 14 + TypeScript"
  autor: Heitor Miranda
  papel: Tech Lead
  branch: main
  contexto: "Overlay de busca global ativado por Cmd+K que pesquisa clientes, skills e documentos da Biblioteca em tempo real, sem chamada de API."
arquivos-relacionados:
  - components/ui/GlobalSearch.tsx
  - hooks/useGlobalSearch.ts
  - components/layout/AppShell.tsx
  - components/layout/Sidebar.tsx
---

# Spec — Busca Global Cmd+K (Phase 13)

## 1. Resumo

**O quê**: Overlay de busca global ativado por `Cmd+K` (Mac) / `Ctrl+K` (Windows/Linux) que pesquisa em tempo real sobre clientes, skills e documentos da Biblioteca, agrupados por tipo, com navegação direta ao resultado.
**Por quê**: Usuários com muitos clientes e skills precisam acessar recursos específicos sem navegar por menus aninhados.
**Para quem**: Todos os perfis autenticados; resultados filtrados por RBAC (admin vê tudo, Operacional vê apenas Solar System).
**Tamanho estimado**: 2 arquivos criados, 2 modificados.

## 2. Comportamento Especificado

### 2.1 Fluxo Principal

1. Usuário pressiona `Cmd+K` (ou `Ctrl+K`)
2. Overlay escurece o fundo (backdrop `rgba(0,0,0,0.6)`) e exibe o painel de busca centralizado
3. Input recebe foco automaticamente
4. Usuário digita — resultados aparecem em tempo real (debounce 150ms) sem chamada de API
5. Resultados agrupados por tipo: **Clientes**, **Skills**, **Documentos**
6. Usuário navega com `↑` `↓` entre resultados; `Enter` navega para o resultado selecionado
7. `Esc` ou clique no backdrop fecha o overlay

### 2.2 Fluxos Alternativos

**FA-01: Query vazia**
- Condição: campo de busca vazio ao abrir
- Comportamento: exibe os 3 últimos visitados de cada tipo (ou nenhum resultado se sem histórico) com label "Recentes"

**FA-02: Sem resultados**
- Condição: query digitada não retorna nenhum match
- Comportamento: exibe mensagem "Nenhum resultado para «{query}»" — sem sugestão de fallback

**FA-03: Usuário Operacional (sem RBAC admin)**
- Condição: `isAdmin === false`
- Comportamento: grupo **Skills** e **Documentos** não aparecem; apenas **Clientes** visíveis (Solar System público)

**FA-04: Clique em resultado admin enquanto Operacional**
- Condição: impossível pelo FA-03; guard defensivo no hook
- Comportamento: não navegável — não incluso nos resultados

### 2.3 Fluxos de Erro

| Condição | Resposta Esperada |
|----------|------------------|
| Context (Clients/Skills/Biblioteca) ainda carregando | Exibe skeleton de 3 linhas por grupo |
| Erro ao navegar para resultado | Fecha overlay; `router.push` falha silenciosamente |

## 3. Interface & Contratos

### 3.1 Tipos

```typescript
// lib/search-types.ts (novo arquivo)

export type SearchResultType = 'client' | 'skill' | 'document';

export interface SearchResult {
  id: string;
  type: SearchResultType;
  label: string;       // Nome principal
  sublabel?: string;   // Para skills: nome do tipo ("Criação", "Mídia", etc.)
  href: string;        // Rota de navegação
  color?: string;      // Cor do cliente (hex) — para dot colorido
  icon?: string;       // Lucide icon name — para tipo de documento
}

export interface SearchGroup {
  type: SearchResultType;
  label: string;       // "Clientes" | "Skills" | "Documentos"
  items: SearchResult[];
}
```

### 3.2 Hook `useGlobalSearch`

```typescript
// hooks/useGlobalSearch.ts

export function useGlobalSearch(): {
  query: string;
  setQuery: (q: string) => void;
  groups: SearchGroup[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  selectedIndex: number;          // índice flat no array de todos os resultados
  setSelectedIndex: (i: number) => void;
  navigateSelected: () => void;   // router.push do resultado selecionado
}
```

**Lógica de busca (client-side, sem API):**

- **Clientes**: filtra `ClientsContext` por `name.toLowerCase().includes(query)` ou `slug.includes(query)`; href = `/clientes/[id]` para admin, `/[slug]` para Operacional
- **Skills**: filtra `SkillsContext` por `name.toLowerCase().includes(query)` ou `slug.includes(query)`; href = `/skills/[id]`; `sublabel` = tipo formatado
- **Documentos**: filtra `BibliotecaContext` por `title.toLowerCase().includes(query)` ou `tags.some(t => t.includes(query))`; href = `/biblioteca` (sem rota de detalhe ainda)
- Limite: máximo 5 resultados por grupo
- Mínimo de 2 caracteres para ativar busca (abaixo → mostra recentes ou vazio)

### 3.3 Componente `GlobalSearch`

```typescript
// components/ui/GlobalSearch.tsx

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ isOpen, onClose }: GlobalSearchProps)
```

Estrutura visual:
```
[backdrop — fixed, full screen, rgba(0,0,0,0.6), z-index 1000]
  └── [painel — fixed, centered, width 560px, max-height 480px]
        ├── [input — ícone Search, placeholder "Buscar clientes, skills, documentos..."]
        ├── [grupos de resultados — lista scrollável]
        │     ├── [label do grupo — "Clientes", "Skills", "Documentos"]
        │     └── [items — hover highlight, item selecionado com fundo var(--nebula)]
        └── [rodapé — "↑↓ navegar · Enter confirmar · Esc fechar"]
```

### 3.4 Integração em `AppShell`

```typescript
// components/layout/AppShell.tsx

// Listener global de teclado:
useEffect(() => {
  function onKeyDown(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setSearchOpen(true);
    }
  }
  window.addEventListener('keydown', onKeyDown);
  return () => window.removeEventListener('keydown', onKeyDown);
}, []);
```

`<GlobalSearch isOpen={searchOpen} onClose={() => setSearchOpen(false)} />` renderizado dentro do `AppShell`, fora do layout principal.

## 4. Restrições Técnicas

### 4.1 Stack & Padrões

- **Framework**: Next.js 14 App Router
- **Sem dependências novas**: nenhum pacote de busca (`cmdk`, `fuse.js`) — busca client-side com `string.includes` é suficiente para o volume atual (< 100 clientes, < 200 skills, < 500 docs)
- **Design system**: todos os tokens via CSS variables (`var(--deep)`, `var(--nebula)`, `var(--sun)`, etc.) — sem valores hardcoded

### 4.2 Performance

- Debounce de 150ms no input para evitar re-renders excessivos
- Busca síncrona sobre arrays em memória (< 1ms para os volumes esperados)
- Painel renderizado com `display: none` quando fechado (não unmount) para evitar foco perdido em teclado

### 4.3 Acessibilidade

- Painel tem `role="dialog"`, `aria-modal="true"`, `aria-label="Busca global"`
- Input com `aria-label="Buscar"` e `aria-autocomplete="list"`
- Lista de resultados com `role="listbox"`; cada item com `role="option"` e `aria-selected`
- Foco retorna ao elemento anterior ao fechar o overlay

### 4.4 Dependências

- Requer `ClientsContext`, `SkillsContext`, `BibliotecaContext` já montados — garantido pelo `Providers.tsx` existente
- RBAC via `useAuth().isAdmin`

## 5. Critérios de Aceite

### Funcionais

- [ ] **CA-01**: DADO qualquer página, QUANDO `Cmd+K` é pressionado, ENTÃO overlay de busca abre com foco no input
- [ ] **CA-02**: DADO overlay aberto, QUANDO `Esc` é pressionado, ENTÃO overlay fecha e foco retorna ao elemento anterior
- [ ] **CA-03**: DADO query "vivo", QUANDO digitada, ENTÃO resultados com "vivo" no nome ou slug aparecem no grupo "Clientes"
- [ ] **CA-04**: DADO query "plano", QUANDO digitada, ENTÃO skills e documentos com "plano" no nome aparecem nos grupos corretos
- [ ] **CA-05**: DADO resultados visíveis, QUANDO `↓` é pressionado, ENTÃO próximo item é destacado; `↑` retorna ao anterior
- [ ] **CA-06**: DADO item selecionado, QUANDO `Enter` é pressionado, ENTÃO navegação ocorre para o `href` do resultado e overlay fecha
- [ ] **CA-07**: DADO usuário Operacional (`isAdmin === false`), QUANDO abre busca, ENTÃO grupos "Skills" e "Documentos" não são exibidos
- [ ] **CA-08**: DADO query com menos de 2 caracteres, QUANDO digitada, ENTÃO nenhum resultado é exibido (ou recentes, se FA-01)
- [ ] **CA-09**: DADO query sem resultados, QUANDO digitada, ENTÃO mensagem "Nenhum resultado para «{query}»" é exibida
- [ ] **CA-10**: DADO clique no backdrop, QUANDO executado, ENTÃO overlay fecha

### Não-Funcionais

- [ ] **CA-NF-01**: Resultados aparecem em < 100ms após fim do debounce (150ms)
- [ ] **CA-NF-02**: `role="dialog"`, `aria-modal="true"` presentes no painel; `role="option"` em cada item
- [ ] **CA-NF-03**: `Cmd+K` não aciona o atalho padrão do browser em nenhum dos browsers suportados

### Regressão

- [ ] Navegação padrão da Sidebar continua funcionando
- [ ] `Cmd+K` em inputs de formulário (skill editor, biblioteca modal) **não** abre a busca global — verificar se `e.target` é um input e ignorar nesse caso

## 6. Tasks

### TASK-01: Tipos e hook de busca
- **Escopo**: Criar `lib/search-types.ts` e `hooks/useGlobalSearch.ts` com lógica de filtro, debounce e navegação por teclado
- **Arquivos**: `lib/search-types.ts` (criar), `hooks/useGlobalSearch.ts` (criar)
- **Depende de**: –
- **Critérios**: CA-03, CA-04, CA-07, CA-08, CA-09

### TASK-02: Componente `GlobalSearch`
- **Escopo**: Criar overlay com input, grupos de resultados, navegação por teclado, acessibilidade
- **Arquivos**: `components/ui/GlobalSearch.tsx` (criar)
- **Depende de**: TASK-01
- **Critérios**: CA-01, CA-02, CA-05, CA-06, CA-10, CA-NF-02

### TASK-03: Integrar em `AppShell` com listener `Cmd+K`
- **Escopo**: Adicionar `useEffect` com listener global; renderizar `<GlobalSearch>` no AppShell
- **Arquivos**: `components/layout/AppShell.tsx` (modificar)
- **Depende de**: TASK-02
- **Critérios**: CA-01, CA-02, CA-NF-03, regressão de inputs

## 7. Notas de Implementação

- Usar `useRef` para guardar o elemento com foco antes de abrir o overlay (`document.activeElement`) e restaurar no fechamento
- O guard de `e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement` no listener de `Cmd+K` evita conflito com inputs de formulário
- Para o debounce, usar `useRef` + `setTimeout`/`clearTimeout` — sem `lodash.debounce`
- Documentos da Biblioteca não têm rota de detalhe ainda; href = `/biblioteca?q={title}` para pré-preencher o filtro de busca da página
- Máximo 5 itens por grupo evita overflow — sem scroll infinito no MVP
- O componente deve funcionar tanto em dark como light theme via CSS variables

## 8. Prompt para Agente

Implemente a busca global `Cmd+K` do sunOS.

**Stack**: Next.js 14, TypeScript strict, sem dependências novas.

**Criar**:
1. `lib/search-types.ts` — tipos `SearchResult`, `SearchGroup`, `SearchResultType`

2. `hooks/useGlobalSearch.ts` — hook com:
   - `isOpen`, `open()`, `close()` state
   - `query` + `setQuery` com debounce 150ms (useRef + setTimeout)
   - `groups: SearchGroup[]` — filtra ClientsContext, SkillsContext, BibliotecaContext por `query.toLowerCase()` (min 2 chars); max 5 por grupo
   - RBAC: `isAdmin === false` → apenas grupo Clientes
   - `selectedIndex` + navegação `↑↓` sobre array flat de todos os resultados
   - `navigateSelected()` — `router.push(result.href)` + `close()`

3. `components/ui/GlobalSearch.tsx` — overlay com:
   - Backdrop fixed `rgba(0,0,0,0.6)` z-index 1000; painel centralizado 560px
   - Input com foco automático ao abrir; `role="dialog"`, `aria-modal="true"`
   - Grupos com label + lista de items; item selecionado com `var(--nebula)` background
   - Rodapé "↑↓ navegar · Enter confirmar · Esc fechar"
   - Todos os tokens via CSS variables do design system

**Modificar**:
4. `components/layout/AppShell.tsx` — `useEffect` com listener `keydown` para `(e.metaKey || e.ctrlKey) && e.key === 'k'`; guard `!(e.target instanceof HTMLInputElement)`; renderizar `<GlobalSearch>` no JSX

**Restrições**:
- Zero dependências novas — busca síncrona `string.includes` é suficiente
- Inline styles para layout (padrão sunOS, não Tailwind classes)
- Border radius 12px para o painel; 8px para items hover
- `npx tsc --noEmit` sem erros

<!-- REVIEW -->
**Checkpoint**: A busca client-side (sem API) é suficiente para o volume esperado? O comportamento para Operacional (só Clientes) está correto com a caixa-preta?

## Changelog

| Versão | Data | Mudança |
|--------|------|---------|
| 1.0 | 2026-05-26 | Versão inicial |
