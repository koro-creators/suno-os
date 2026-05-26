---
spec-id: SPEC-017
slug: skills-admin
artefato: constitution
nivel-sdd: spec-anchored
tamanho: large
status: rascunho
criada: 2026-05-26
atualizada: 2026-05-26
versao: 1.0
escopo:
  projeto: sunos
  stack: "Frontend: Next.js 14 + TypeScript | Backend: FastAPI + LangGraph + Python 3.11"
  autor: Heitor Miranda
  papel: Tech Lead
  branch: master
  contexto: "CRUD administrativo de Skills do sunOS — interface para Líderes e Admins gerenciarem skills de IA, incluindo configuração de system_prompts (Caixa-preta) e persistência backend com RBAC enforcement."
upstream:
  - docs/prd/parte1-feature-map.md (FA-12-01, FA-12)
  - docs/prd/parte1-feature-map.md (FA-03)
  - docs/prd/parte1-feature-map.md (FA-09)
  - docs/brd/parte3-requisitos.md (BR-002, BR-004, BR-007, BR-015)
  - docs/brd/parte4-regras.md (RN-006, RN-009, RN-016)
  - docs/srd/parte7-ADRs.md (ADR-002)
  - docs/superpowers/specs/2026-03-23-bioma-zero-design.md (protótipo de referência — "Bioma Zero")
---

# Constitution — SPEC-017 — Skills Admin

## 1. Princípios de Domínio

| # | Princípio | Implicação prática |
|---|-----------|-------------------|
| P-01 | **Skills são IP proprietária da Suno** | `system_prompt` é dado sensível de negócio — nunca exposto a perfis Operacional; audit log em toda alteração |
| P-02 | **Autonomia editorial sem eng** | Líderes e Admins governam o catálogo de skills (criar, editar, arquivar) sem intervenção do time de engenharia |
| P-03 | **Coexistência com Solar System (ADR-002)** | O CRUD Admin opera em tabela `skills` no DB; o Sistema Solar consome `data/clients.ts` estático. Mudanças no Admin **não** propagam automaticamente para o Solar — isolamento por design |
| P-04 | **Versionamento imutável** | Toda edição de skill cria novo registro de versão; versões anteriores nunca são editadas in-place — preserva histórico de decisão editorial |
| P-05 | **Integridade referencial** | Skill referenciada em workflow ativo não pode ser arquivada sem resolução prévia; bloquear com erro 409 explicativo |

## 2. Segurança e Privacidade

- **RBAC obrigatório no backend**: perfis P3 (Líder) e P4 (Admin) acessam `/api/skills/*`; qualquer outro perfil recebe `404` genérico (nunca `403`) — ver `.claude/rules/caixa-preta.md`
- **`system_prompt` como campo protegido**: coluna nunca inclusa em payloads de `GET /api/skills/[id]` para perfis P1/P2; filtrada no serializer do FastAPI (não apenas na UI)
- **Slug público ≠ dado sensível**: slug é o identificador visível externamente — não usar informação estratégica ou proprietária no slug
- **Audit log de `system_prompt`**: cada `PATCH /api/skills/[id]` que altere `system_prompt` registra: `who` (user_id), `when` (timestamp), `prev_hash` (SHA-256 do conteúdo anterior) — não armazena o texto antigo em log (LGPD)
- **Caixa-preta UI**: rotas `/skills*` atrás de RBAC middleware Next.js; Operacional que tentar `/skills` diretamente é redirecionado para `/404` — sem mensagem "Acesso negado"

## 3. Latência e Confiabilidade

- Listagem de até 200 skills com filtros sidebar: resposta ≤ 500ms (p95)
- Operações de escrita (create/update): latência ≤ 1s (p95) com feedback optimistic UI
- Taxa de erro da API Skills Admin ≤ 0.1% em condições normais
- Sem single-point-of-failure: Skills Admin opera normalmente mesmo se Skills Runtime (chat) estiver degradado

## 4. Vocabulário Canônico

| Termo canônico | Proibido | Contexto |
|----------------|----------|---------|
| Skill | "Agente", "Bot", "Assistente" | Entidade principal |
| Moon | "Módulo", "Ferramenta", "Add-on" | Subcomponente de Skill |
| `system_prompt` | "instrução", "regras", "contexto base" | Em código e docs técnicos; UI pode usar "configuração avançada" sem revelar o campo |
| Arquivar | "Deletar", "Excluir" | Ação de soft delete |
| Tipo | "Categoria" | Classificação da skill (chat/multimodal/workflow) |
| Status | "Estado" | active / archived / draft |

## 5. Padrões Obrigatórios

- **Pattern Model Repo (SPEC-005)**: toda listagem usa `table view default + filter sidebar + side drawer` — não reimplementar table custom
- **Caixa-preta (RN-009/010/011)**: ver `.claude/rules/caixa-preta.md` — 404 genérico, cross-client guard, sem enumeration de recursos protegidos
- **Validação de vocabulário UI (RN-016)**: toda copy de UI passa pela lista de anti-patterns do Glossário Suno — sem palavras proibidas em labels, placeholders, tooltips
- **Design System tokens**: cores, bordas e tipografia via CSS variables definidas em `app/globals.css` — nenhum valor hardcoded

## 6. Dependências Externas

| Dependência | Natureza | Nota |
|-------------|----------|------|
| SPEC-005 (Workflow Builder Canvas) | UI — Pattern Model Repo e componentes drawer | Reusar componentes `FilterSidebar`, `Drawer` do canvas |
| SPEC-004 (Approval Hierarchy) | Dados — skills podem ter approval gate configurado | ADR futura; fora de escopo desta SPEC |
| FA-09 / RBAC Firebase | Operacional — perfis P1..P4 resolvidos via JWT Firebase | Backend valida claims do token em cada request |
| PostgreSQL (Cloud SQL shared) | Persistência | Tabelas `skills`, `skill_versions`, `skill_clients`, `moon_skills` |
| LangGraph runtime | Consumidor — lê `system_prompt` e config ao iniciar execução | Skills Admin não acessa LangGraph diretamente |

## 7. Anti-patterns

1. ❌ Retornar `403` para Operacional tentando acessar skill — sempre `404`
2. ❌ Incluir `system_prompt` em qualquer resposta de API para P1/P2 — mesmo em campo `null`; omitir a chave
3. ❌ Sincronizar automaticamente admin CRUD com `data/clients.ts` (Solar System)
4. ❌ Hard delete de skill antes de verificar dependências ativas
5. ❌ Editar versão existente de skill in-place — criar nova versão
6. ❌ Usar `is_active: bool` para estado do cliente — usar enum `status` para suportar FA-15 (PRE_ACTIVE)
7. ❌ Expor lista de skills para Operacional via endpoint de busca/sugestão

## 8. Definition of Done

- [ ] CRUD completo com persistência no PostgreSQL (não apenas React Context)
- [ ] RBAC enforcement no backend em todos os endpoints `/api/skills/*`
- [ ] `system_prompt` não aparece em nenhum payload de API para perfis P1/P2
- [ ] Audit log de alterações de `system_prompt` funcionando (100% coverage)
- [ ] Operacional que tenta `/skills` é redirecionado para `/404` (teste E2E)
- [ ] Integridade referencial: skill em workflow ativo bloqueia archive com 409
- [ ] Testes de integração: ≥1 teste por CA crítico (CA-SKA-003, CA-SKA-004, CA-SKA-005)
- [ ] TypeScript: `npx tsc --noEmit` sem erros
- [ ] Lint: `npx next lint` sem warnings novos
