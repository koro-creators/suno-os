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
- [x] Skills: `/new-component`, `/new-admin-page`, `/sdd-koro`
- [x] Subagent: code-reviewer
- [x] MCP: context7

### Phase 8: Backend — FastAPI + LangGraph (2026-03-26)
- [x] Monorepo: backend em `api/` (padrão Meridian Chat V2)
- [x] FastAPI + LangGraph StateGraph + BaseAgent ABC
- [x] 8 skill dirs com SKILL.md + references/ (copy-social, plano-de-midia, etc.)
- [x] 4 tools: chat (Gemini streaming), text_gen, image_gen (mock), prompt_enhance
- [x] TopSupervisor → Orchestrator (routing 2 níveis)
- [x] ContentCreator + VisualCreator + Conversational agents (ReAct)
- [x] SSE streaming via FastAPI StreamingResponse
- [x] Eval: MLflow tracing + scorers + trajectory + 20 eval datasets
- [x] SPEC-001 v2 completa (constitution, spec, design, plan, tasks)

### Phase 9: Frontend ↔ Backend Integration (2026-03-26)
- [x] `lib/api.ts` — HTTP client com `apiAvailable()` + `consumeSSE()`
- [x] `hooks/useToolStream.ts` — consome SSE real + fallback mock
- [x] ChatInterface usa API quando disponível, mock quando não
- [x] HITL feedback funciona com respostas reais
- [x] Fix SSE dedup + normalize Gemini content format

### Phase 10: Auth + RBAC (2026-03-26)
- [x] Firebase Google Auth com login page
- [x] Auth JWT em requests à API
- [x] User profile no sidebar
- [x] RBAC com Firebase Custom Claims (admin/creator roles)
- [x] AuthGuard + AuthProvider + AppShell components

---

## Em Progresso

### Phase 11: Polish + Deploy
- [ ] Error handling robusto no backend (timeout, rate limit, backoff)
- [ ] CI/CD: GitHub Actions (lint, pytest, type-check, build)
- [ ] Deploy staging em Cloud Run
- [ ] Smoke test staging
- [ ] Frontend: endpoints batch (TextGen, ImageGen panels)
- [ ] Testes de integração com API keys reais

---

## Próximas Phases

### Phase 12: Sidebar Recentes Dinâmico
- [ ] Rastrear navegação real do usuário
- [ ] Mostrar últimos clientes/skills visitados
- [ ] Persistir em sessionStorage

### Phase 13: Busca Global
- [ ] Barra de busca unificada (Cmd+K)
- [ ] Busca cross-feature: skills, documentos, clientes
- [ ] Resultados agrupados por tipo
- [ ] Navegação direta do resultado

### Phase 14: Onboarding / Empty States
- [ ] Welcome screen para primeiro uso
- [ ] Empty states ricos em todas as páginas admin
- [ ] Guia de getting started

### Phase 15: Integração Solar ↔ Admin
- [ ] Unificar `data/clients.ts` com ClientsContext
- [ ] Skills reais derivados do SkillsContext
- [ ] Sistema solar reflete mudanças do admin

### Phase 16: VideoGen + Editor
- [ ] Integrar Vertex AI Veo 3.1 para geração de vídeo
- [ ] Image editor com inpainting/outpainting
- [ ] Image enhance (upscale x2/x4)

---

## Specs

| Spec | Tipo | Data |
|------|------|------|
| `2026-03-23-sunos-prototype-design.md` | Design | Protótipo base |
| `2026-03-23-phase2-ai-ux-patterns-design.md` | Design | AI UX Patterns |
| `2026-03-23-bioma-zero-design.md` | Design | Skills admin (original) |
| `2026-03-24-biblioteca-design.md` | Design | Biblioteca |
| `2026-03-24-hitl-feedback-design.md` | Design | Human in the Loop |
| `2026-03-24-clientes-admin-design.md` | Design | Clientes admin |
| `large/sunohub-tools-integration/` | SDD Large (5 artefatos) | Backend + Tools (SPEC-001 v2) |

## SDD Usage Log

Ver `docs/specs/_log/usage-log.md` para histórico de specs geradas e scores.
