---
spec-id: SPEC-019
slug: sidebar-recentes
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
  contexto: "Substituir os RECENT_ITEMS hardcoded da Sidebar por histórico de navegação real, persistido em sessionStorage."
arquivos-relacionados:
  - components/layout/Sidebar.tsx
  - hooks/useNavigationHistory.ts
  - lib/types.ts
---

# Spec — Sidebar Recentes Dinâmico (Phase 12)

## 1. Resumo

**O quê**: Substituir os 3 itens estáticos `RECENT_ITEMS` da Sidebar por histórico de navegação real do usuário (clientes e skills visitados), persistido em sessionStorage.
**Por quê**: A seção "Recentes" está mockada com dados fixos — não reflete o que o usuário realmente visitou.
**Para quem**: Todos os perfis autenticados que navegam pelo Solar System ou Admin.
**Tamanho estimado**: 2 arquivos modificados, 1 criado.

## 2. Comportamento Especificado

### 2.1 Fluxo Principal

1. Usuário navega para qualquer rota de cliente (`/[clientSlug]`) ou skill (`/[clientSlug]/[skillSlug]`)
2. `useNavigationHistory` detecta a mudança de `pathname` via `usePathname()`
3. Cria uma entrada `RecentEntry` com `label`, `href`, `color` e `type`
4. Adiciona ao início do array de recentes; remove duplicatas pelo `href`; limita a 5 entradas
5. Persiste no `sessionStorage` com chave `sunos:recent`
6. Sidebar lê do hook e exibe a lista atualizada em tempo real

### 2.2 Fluxos Alternativos

**FA-01: Navegação admin (Skills, Clientes, Biblioteca, Workflows)**
- Condição: `pathname` começa com `/skills`, `/clientes`, `/biblioteca`, `/workflows`
- Comportamento: **não** registrar — recentes são apenas visitas ao Solar System (clientes e skills do bioma)

**FA-02: Sidebar recolhida**
- Condição: Sidebar está no estado `isOpen = false` (só ícones)
- Comportamento: seção Recentes fica oculta; ao expandir, lista aparece normalmente

**FA-03: sessionStorage indisponível (SSR ou modo privado bloqueado)**
- Condição: `window.sessionStorage` lança exceção
- Comportamento: hook funciona apenas em memória para a sessão corrente; sem erro para o usuário

**FA-04: Primeiro uso (sem histórico)**
- Condição: `sessionStorage` vazio ou ausente
- Comportamento: seção "Recentes" exibe estado vazio com texto muted "Nenhuma visita recente"

### 2.3 Fluxos de Erro

| Condição | Resposta Esperada |
|----------|------------------|
| sessionStorage corrompido (JSON inválido) | Silenciosamente reiniciar com array vazio |
| Rota com clientSlug não mapeável para cor | Usar cor fallback `var(--text-muted)` |

## 3. Interface & Contratos

### 3.1 Tipo `RecentEntry`

Adicionar em `lib/types.ts`:

```typescript
export interface RecentEntry {
  label: string;   // Ex: "Vivo · Plano de Mídia" ou "Samsung"
  href: string;    // Rota completa: "/vivo" ou "/vivo/plano-de-midia"
  color: string;   // Cor do cliente (hex) — fallback '#6B7280'
  type: 'client' | 'skill';
  visitedAt: number; // Date.now() — para ordenação futura
}
```

### 3.2 Hook `useNavigationHistory`

```typescript
// hooks/useNavigationHistory.ts

export function useNavigationHistory(): {
  recents: RecentEntry[];
  clear: () => void;
} 
```

**Lógica interna:**
- Observa `usePathname()` com `useEffect`
- Regex de matching:
  - `/^\/([^/]+)$/` → tipo `client`, slug = grupo 1
  - `/^\/([^/]+)\/([^/]+)$/` → tipo `skill`, clientSlug = grupo 1, skillSlug = grupo 2
- Ignora rotas admin: `skills`, `clientes`, `biblioteca`, `workflows`, `login`, `design-system`, `404`
- Para construir `label` e `color`, resolve o cliente via `useClients()` (ClientsContext)
- Para skills, resolve via `useSkills()` (SkillsContext); label = `"<clientName> · <skillName>"`
- Persiste em `sessionStorage['sunos:recent']` como JSON (max 5 entradas)

### 3.3 Modificação em `Sidebar.tsx`

```typescript
// Remover:
const RECENT_ITEMS: RecentItemDef[] = [ /* dados mockados */ ];

// Adicionar:
import { useNavigationHistory } from '@/hooks/useNavigationHistory';
const { recents } = useNavigationHistory();
```

A renderização da seção Recentes usa `recents` no lugar de `RECENT_ITEMS`. Estrutura do item mantida (label + dot colorido).

## 4. Restrições Técnicas

### 4.1 Stack & Padrões

- **Framework**: Next.js 14 App Router — `usePathname()` de `next/navigation`
- **State**: sessionStorage apenas (sem localStorage, sem cookies, sem Context global)
- **Limite**: máximo 5 entradas no histórico
- **Sem dependências novas**: nenhum pacote adicional

### 4.2 Performance

- Hook executa apenas no cliente (`'use client'`); sem impacto no SSR
- `useEffect` com `[pathname]` como dep — executa apenas em navegações

### 4.3 Restrições de Escopo

- Rotas admin (`/skills/*`, `/clientes/*`, `/biblioteca/*`, `/workflows/*`) **não** entram no histórico
- `data/clients.ts` **não é modificado** (ADR-002) — cor do cliente é resolvida do ClientsContext ou fallback

## 5. Critérios de Aceite

### Funcionais

- [ ] **CA-01**: DADO que usuário visita `/vivo`, QUANDO Sidebar está aberta, ENTÃO "Vivo" aparece como primeiro item em Recentes com a cor do cliente
- [ ] **CA-02**: DADO que usuário visita `/vivo/plano-de-midia`, QUANDO Sidebar está aberta, ENTÃO "Vivo · Plano de Mídia" aparece em Recentes (substitui entrada de `/vivo` se existia)
- [ ] **CA-03**: DADO 6 visitas distintas, QUANDO Sidebar é aberta, ENTÃO apenas as 5 mais recentes são exibidas
- [ ] **CA-04**: DADO visita repetida ao mesmo `href`, QUANDO registrada, ENTÃO não duplica a entrada — move para o topo
- [ ] **CA-05**: DADO que usuário navega para `/skills`, QUANDO Sidebar é aberta, ENTÃO recentes não registram a visita admin
- [ ] **CA-06**: DADO que página é recarregada (F5), QUANDO Sidebar é aberta, ENTÃO recentes persistem (sessionStorage)
- [ ] **CA-07**: DADO que nova aba é aberta, QUANDO Sidebar é aberta, ENTÃO recentes estão vazios (sessionStorage é por aba)
- [ ] **CA-08**: DADO histórico vazio, QUANDO Sidebar está aberta e expandida, ENTÃO exibe texto "Nenhuma visita recente" em `var(--text-muted)`

### Regressão

- [ ] Visual da Sidebar permanece idêntico ao atual (cores, tamanhos, transições)
- [ ] Sidebar recolhível continua funcionando (`isOpen` toggle)
- [ ] Items de navegação admin (Clientes, Skills, etc.) continuam operacionais

## 6. Tasks

### TASK-01: Tipo `RecentEntry` e hook `useNavigationHistory`
- **Escopo**: Criar `hooks/useNavigationHistory.ts`; adicionar `RecentEntry` em `lib/types.ts`
- **Arquivos**: `lib/types.ts` (modificar), `hooks/useNavigationHistory.ts` (criar)
- **Depende de**: –
- **Critérios**: CA-01 a CA-08

### TASK-02: Integrar hook na Sidebar
- **Escopo**: Remover `RECENT_ITEMS` estático; usar `recents` do hook; tratar empty state
- **Arquivos**: `components/layout/Sidebar.tsx` (modificar)
- **Depende de**: TASK-01
- **Critérios**: CA-01, CA-02, CA-08 (visual)

## 7. Notas de Implementação

- O hook deve fazer `try/catch` no acesso ao sessionStorage para não quebrar em ambientes onde está bloqueado (modo privado Firefox, alguns browsers mobile)
- `useClients()` e `useSkills()` estão disponíveis via Context — o hook pode chamá-los para resolver nome e cor. Se o slug não for encontrado nos contexts (dados mockados podem não ter todos), usar o slug como label e `#6B7280` como cor
- A Sidebar já tem `isOpen` state — a seção Recentes só deve renderizar o conteúdo expandido quando `isOpen === true`; no estado recolhido, pode omitir completamente (comportamento atual dos mocks)
- Não rastrear `/404`, `/login`, `/design-system`

## 8. Prompt para Agente

Implemente o histórico dinâmico da seção "Recentes" na Sidebar do sunOS.

**Stack**: Next.js 14, TypeScript strict, App Router. Sem dependências novas.

**Criar**:
1. `hooks/useNavigationHistory.ts` — hook que observa `usePathname()`:
   - Match `/^\/([a-z0-9-]+)$/` → `type: 'client'`; match `/^\/([a-z0-9-]+)\/([a-z0-9-]+)$/` → `type: 'skill'`
   - Ignorar: `skills`, `clientes`, `biblioteca`, `workflows`, `login`, `design-system`, `404`
   - Resolver `label` e `color` via `useClients()` e `useSkills()` (fallback: slug como label, `#6B7280`)
   - Persistir em `sessionStorage['sunos:recent']` — max 5 entradas, sem duplicatas por `href`, mais recente primeiro
   - Retornar `{ recents: RecentEntry[], clear: () => void }`
   - `try/catch` em todo acesso ao sessionStorage

**Modificar**:
2. `lib/types.ts` — adicionar `RecentEntry { label, href, color, type, visitedAt }`
3. `components/layout/Sidebar.tsx` — remover `RECENT_ITEMS` constante; usar `useNavigationHistory()` hook; empty state "Nenhuma visita recente" quando `recents.length === 0`

**Restrições**:
- `data/clients.ts` é imutável — não tocar
- Manter visual idêntico ao existente — apenas trocar a fonte dos dados
- TypeScript `npx tsc --noEmit` sem erros após mudança

<!-- REVIEW -->
**Checkpoint**: O escopo de rastreamento (apenas Solar System, não Admin) faz sentido? Limit de 5 entradas é adequado?

## Changelog

| Versão | Data | Mudança |
|--------|------|---------|
| 1.0 | 2026-05-26 | Versão inicial |
