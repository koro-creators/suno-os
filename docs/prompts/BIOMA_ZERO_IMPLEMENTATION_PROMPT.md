# Prompt para Nova Sessão — Bioma Zero Implementation

> **Copie este prompt inteiro e cole numa nova sessão do Claude Code.**
> **Execute com:** `claude --dangerously-skip-permissions` no diretório `/Users/heitormiranda/projects/koro/sunos/`

---

## Contexto

Estou construindo o **sunOS**, a plataforma interna de IA da Suno United Creators. É um protótipo em **Next.js 14 + TypeScript + Tailwind** que organiza skills de IA por cliente usando metáfora de sistema solar.

O projeto está em `/Users/heitormiranda/projects/koro/sunos/`.

### O que já existe:
- **4 níveis de navegação** horizontal (sol na esquerda, planetas em fila): Home → Cliente → Skill → Chat
- **Design system** completo: dark/light theme toggle, amarelo Suno #FFC801, CSS variables
- **Sidebar** colapsável (esquerda) + **Chat panel** colapsável (direita)
- **AI UX Patterns** no chat: Prompt Templates, Result Actions, Variation Cards
- **Acessibilidade**: focus rings, aria-labels, keyboard nav

### Stack:
- Next.js 14 (App Router)
- TypeScript (strict)
- Tailwind CSS + CSS variables
- Lucide React icons
- Inter font (Google Fonts)

## O que implementar agora: Bioma Zero

Leia a spec completa em: `docs/superpowers/specs/2026-03-23-bioma-zero-design.md`

É uma área admin para gestão de skills com:

### 3 páginas:
1. **`/skills`** — Catálogo com grid de cards, filtros por tipo/status, search
2. **`/skills/new`** — Criar novo skill (formulário com validação)
3. **`/skills/[skillId]`** — Editor com 4 tabs (Identidade, Configuração, Moons, Clientes)

### Componentes novos (16 arquivos):
- `components/admin/` — SkillCard, SkillEditor, SkillEditorTabs, IdentityTab, ConfigTab, MoonsTab, ClientsTab, VersionHistoryModal, SkillFilters
- `components/ui/Toast.tsx` — Toast notification reutilizável
- `contexts/SkillsContext.tsx` — React Context + Provider para estado dos skills
- `data/skills-admin.ts` — 10 skills mocados (8 existentes + 2 rascunhos)
- `lib/admin-types.ts` — SkillAdmin, SkillVersion interfaces

### Modificações em arquivos existentes:
- `app/layout.tsx` — Wrapping com SkillsProvider
- `components/layout/Sidebar.tsx` — Adicionar item "Bioma Zero" com ícone Shield
- `components/layout/AppHeader.tsx` — Adicionar ícone Settings que navega pra /skills

### Dados importantes:
- 8 skills existentes: texto-de-radio, copy-social, roteiro-de-video, plano-de-midia, report-performance, persona-sintetica, brief-builder, analise-de-mercado
- 2 skills rascunho: "Análise Competitiva", "Roteiro de Podcast"
- 7 clientes: Santander, Vivo, Americanas, MRV, Sicredi, BMG, Stone
- 3 tipos: criacao (amarelo #FFC801), midia (azul #3B82F6), planejamento (verde #10B981)
- State gerenciado em React Context (persistência durante sessão, sem backend)

### Design system a seguir:
- Background: `var(--void)`, surfaces: `var(--deep)`
- Borders: `var(--border-subtle)`
- Text: `var(--text-primary)`, `var(--text-secondary)`, `var(--text-muted)`
- Inputs: bg transparent, border `var(--border-subtle)`, radius 8px, focus ring sun
- Primary buttons: bg `var(--sun)`, color `var(--void)`
- Ghost buttons: border only
- Cards: bg `var(--deep)`, border `var(--border-subtle)`, radius 12px
- Dark + light theme via `data-theme` attribute (ambos devem funcionar)

## Como trabalhar

1. **Leia a spec** primeiro: `docs/superpowers/specs/2026-03-23-bioma-zero-design.md`
2. **Leia os arquivos existentes** que vai modificar (layout.tsx, Sidebar.tsx, AppHeader.tsx)
3. **Implemente na ordem:**
   - Task 1: Types + Context + Mock Data (lib/admin-types.ts, contexts/SkillsContext.tsx, data/skills-admin.ts)
   - Task 2: Toast component (components/ui/Toast.tsx)
   - Task 3: Navigation updates (Sidebar, AppHeader, layout.tsx)
   - Task 4: Skill Catalog page + SkillCard + SkillFilters
   - Task 5: Skill Editor page + tabs + all 4 tab components
   - Task 6: Create New Skill page
   - Task 7: Version History Modal
   - Task 8: Polish — TypeScript check, build, theme test
4. **Commite a cada task** com mensagens descritivas
5. **Verifique `npx tsc --noEmit`** após cada task
6. **Teste em ambos os temas** (dark + light)

## Restrições
- NÃO crie backend ou API — tudo mocado em Context
- NÃO instale novas dependências (Tailwind + Lucide já estão)
- NÃO mude o visual das 3 páginas existentes (Home, Client, Skill solar system)
- Siga o design system existente (leia `app/globals.css` pra entender os tokens)
- O server roda na porta 3003 (3000 está ocupada)
- Sempre use `'use client'` em componentes com estado/interatividade

## Verificação final

Após implementar tudo:
1. `npx tsc --noEmit` — zero errors
2. `npm run build` — sucesso
3. Navegar: `/skills` → ver catálogo → clicar card → editar → salvar → voltar
4. Criar novo skill: `/skills/new` → preencher → criar → verificar no catálogo
5. Testar em dark mode E light mode
6. Verificar sidebar "Bioma Zero" e header Settings icon funcionam
