# sunOS — Roadmap

## Concluído

### Phase 1: Protótipo Base (2026-03-23)
- [x] 4 níveis de navegação (Home → Cliente → Skill → Chat)
- [x] Sistema solar com metáfora orbital
- [x] Design system dark/light theme
- [x] Sidebar colapsável + Chat panel
- [x] Dados mocados (7 clientes, 8 skills, moons)

### Phase 2: AI UX Patterns (2026-03-23)
- [x] Prompt Templates no chat
- [x] Result Actions (Copy, Variação, Salvar)
- [x] Variation Cards (comparação lado a lado)
- [x] Mock streaming de respostas

### Phase 3: Admin — Skills (2026-03-24)
- [x] Catálogo de skills (`/skills`) com grid, filtros, search
- [x] Editor com 4 tabs (Identidade, Configuração, Moons, Clientes)
- [x] Criar novo skill (`/skills/new`)
- [x] Version history modal
- [x] React Context com CRUD

### Phase 4: Admin — Biblioteca (2026-03-24)
- [x] Catálogo (`/biblioteca`) com cards expandíveis
- [x] Filtros por escopo (Suno + clientes) e tags
- [x] Modal criar/editar com links e arquivos
- [x] 31 documentos mocados (10 Suno + 3 por cliente)
- [x] Integração com ContextSidebar no chat (auto-seleção por scope/tags)

### Phase 5: Human in the Loop (2026-03-24)
- [x] Feedback inline no chat (thumbs up/down + comentário)
- [x] Painel de validação no ContextSidebar (progress bar, counters, status)
- [x] Avaliação de sessão (1-5 rating)
- [x] Score médio nos SkillCards

### Phase 6: Admin — Clientes (2026-03-24)
- [x] Catálogo de clientes (`/clientes`) com grid, search
- [x] Editor com 4 tabs (Identidade, Skills, Biblioteca, Métricas)
- [x] Criar/deletar clientes
- [x] Métricas mocadas por cliente
- [x] ClientsTab no Skills editor lê do ClientsContext

### Phase 7: Navegação + Automações (2026-03-24)
- [x] Sidebar: Dashboard → Home, todos os itens com navegação
- [x] CLAUDE.md com convenções do projeto
- [x] Hooks: auto-lint, proteção de arquivos
- [x] Skills: `/new-component`, `/new-admin-page`
- [x] Subagent: code-reviewer
- [x] MCP: context7

---

## Próximas Phases

### Phase 8: Sidebar Recentes Dinâmico
- [ ] Rastrear navegação real do usuário
- [ ] Mostrar últimos clientes/skills visitados
- [ ] Persistir em sessionStorage

### Phase 9: Busca Global
- [ ] Barra de busca unificada (Cmd+K)
- [ ] Busca cross-feature: skills, documentos, clientes
- [ ] Resultados agrupados por tipo
- [ ] Navegação direta do resultado

### Phase 10: Onboarding / Empty States
- [ ] Welcome screen para primeiro uso
- [ ] Empty states ricos em todas as páginas admin
- [ ] Guia de getting started

### Phase 11: Chat Real / API Integration
- [ ] Substituir mock streaming por API real
- [ ] Integração com Gemini Pro / GPT-4o / Claude
- [ ] Configuração de modelo por skill (já modelado no admin)
- [ ] System prompt do skill como contexto real

### Phase 12: Deploy
- [ ] GitHub Actions: lint + type-check + build
- [ ] Deploy no Cloud Run
- [ ] Pipeline CI/CD automatizado

### Phase 13: Integração Solar ↔ Admin
- [ ] Unificar `data/clients.ts` com ClientsContext
- [ ] Skills reais derivados do SkillsContext
- [ ] Sistema solar reflete mudanças do admin

---

## Specs

Todas as design specs estão em `docs/superpowers/specs/`:

| Spec | Data |
|------|------|
| `2026-03-23-sunos-prototype-design.md` | Protótipo base |
| `2026-03-23-phase2-ai-ux-patterns-design.md` | AI UX Patterns |
| `2026-03-23-bioma-zero-design.md` | Skills admin (original) |
| `2026-03-24-biblioteca-design.md` | Biblioteca |
| `2026-03-24-hitl-feedback-design.md` | Human in the Loop |
| `2026-03-24-clientes-admin-design.md` | Clientes admin |
