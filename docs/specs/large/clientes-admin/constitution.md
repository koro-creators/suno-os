---
spec-id: SPEC-018
slug: clientes-admin
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
  contexto: "CRUD administrativo de Clientes do sunOS — interface para Líderes e Admins gerenciarem clientes, skills atribuídas, Biblioteca scoped e métricas de uso, com isolamento explícito do Solar System."
upstream:
  - docs/prd/parte1-feature-map.md (FA-12-03, FA-12)
  - docs/prd/parte1-feature-map.md (FA-06)
  - docs/prd/parte1-feature-map.md (FA-09)
  - docs/prd/parte1-feature-map.md (FA-15)
  - docs/brd/parte3-requisitos.md (BR-004, BR-007, BR-015, BR-022)
  - docs/brd/parte4-regras.md (RN-006, RN-009)
  - docs/srd/parte7-ADRs.md (ADR-002)
  - api/models/conversation.py (tabela conversations — extended by TASK-A05)
  - docs/superpowers/specs/2026-03-24-clientes-admin-design.md (protótipo de referência)
  - docs/specs/large/skills-admin/design.md (ADR-LOCAL-02: junction skill_clients compartilhada)
---

# Constitution — SPEC-018 — Clientes Admin

## 1. Princípios de Domínio

| # | Princípio | Implicação prática |
|---|-----------|-------------------|
| P-01 | **Solar System permanece estático (ADR-002)** | `data/clients.ts` é imutável por esta SPEC. O CRUD Admin opera sobre tabela `clients` no DB; sincronização com Solar System é manual e intencional — sem auto-sync |
| P-02 | **Isolamento de dados por cliente** | Todos os recursos (skills, biblioteca, runs) são scoped por `client_id`; consulta cross-client retorna 404 — ver caixa-preta |
| P-03 | **State machine de cliente** | `status` enum: `PRE_ACTIVE → ACTIVE → ARCHIVED` — prepara integração com FA-15 (Onboarding Automatizado) |
| P-04 | **Junction `skill_clients` como fonte canônica** | A atribuição skill↔cliente é governada por uma única junction table (compartilhada com SPEC-017) — sem dois arrays independentes |
| P-05 | **Métricas calculadas, não armazenadas** | ClientMetrics derivadas on-demand de tabelas operacionais (runs, feedbacks) — sem denormalização que pode desincronizar |

## 2. Segurança e Privacidade

- **RBAC obrigatório no backend**: perfis P3 (Líder) e P4 (Admin) acessam `/api/clients/*`; P1/P2 recebem `404` genérico
- **Isolamento cross-client**: toda query inclui `WHERE client_id = $current_client_id` — mesmo Admin que gerencia múltiplos clientes não recebe dados de outro client em um único response
- **Caixa-preta UI**: `/clientes*` protegido por RBAC middleware; Operacional redirecionado para `/404`
- **ContactInfo (Sponsor do cliente)**: campo sensível mas não secreto — visível para P3/P4, omitido de endpoints públicos
- **Dados históricos**: arquivar cliente não apaga runs/feedbacks — preserva métricas para auditoria

## 3. Latência e Confiabilidade

- Listagem de até 100 clientes com métricas agregadas: resposta ≤ 800ms (p95) — métricas são query view, não coluna
- Operações de escrita (create/update): ≤ 1s (p95) com feedback optimistic UI
- ClientMetrics: calculadas via `SELECT … COUNT … AVG` com índice em `client_id` — sem cache necessário abaixo de 500 clientes
- `data/clients.ts` não é afetado por carga ou erros na API Admin — isolamento total

## 4. Vocabulário Canônico

| Termo canônico | Proibido | Contexto |
|----------------|----------|---------|
| Cliente | "Conta", "Organização", "Tenant" | Entidade principal |
| Sponsor de Área | "PO", "Owner", "Responsável" | Quem solicitou o cliente no sunOS |
| Atribuir | "Vincular", "Mapear", "Linkar" | Associar skill/doc ao cliente |
| Arquivar | "Deletar", "Desativar" | Soft delete de cliente |
| PRE_ACTIVE | "Pendente", "Em cadastro" | Status antes de validação FA-15 |
| ACTIVE | "Ativo", "Publicado" | Cliente disponível no Solar System |

## 5. Padrões Obrigatórios

- **Pattern Model Repo (SPEC-005)**: listagem de clientes usa condensed cards (não table view — FA-12-03 especifica "condensed cards + drawer") + filter sidebar + side drawer
- **Caixa-preta (RN-009/010/011)**: ver `.claude/rules/caixa-preta.md`
- **ADR-002 enforcement**: nenhuma função, hook ou server action pode modificar `data/clients.ts` como efeito colateral — proteção via lint rule se possível
- **Junction `skill_clients`**: não duplicar em array JSONB — toda manipulação vai pela junction (ADR-LOCAL-02 de SPEC-017)
- **Design System tokens**: cores, bordas e tipografia via CSS variables `app/globals.css`

## 6. Dependências Externas

| Dependência | Natureza | Nota |
|-------------|----------|------|
| SPEC-017 (Skills Admin) | Dados — junction `skill_clients` compartilhada | ADR-LOCAL-02 de SPEC-017 define a junction como canônica |
| SPEC-001 (Biblioteca) | Dados — tab Biblioteca filtra KnowledgeItems por client_id | Sem criar nova tabela — query existente |
| FA-09 / RBAC Firebase | Operacional — perfis P1..P4 via JWT | Backend valida claims |
| FA-15 (Onboarding Automatizado) | Downstream — wizard FA-15 cria clientes com status PRE_ACTIVE | Esta SPEC define o `status` enum que FA-15 transiciona |
| PostgreSQL (Cloud SQL shared) | Persistência | Tabelas `clients`, `skill_clients` (shared), `client_metrics` view |
| `data/clients.ts` | Static source — Solar System | NUNCA modificar — imutável por design (ADR-002) |

## 7. Anti-patterns

1. ❌ Modificar `data/clients.ts` como efeito colateral de qualquer operação Admin
2. ❌ Retornar `403` para Operacional — sempre `404`
3. ❌ Armazenar métricas como colunas em `clients` — usar view/aggregation
4. ❌ Duplicar `assigned_skills` como array JSONB em `clients` — usar `skill_clients` junction
5. ❌ Hard delete de cliente com histórico de runs/feedbacks
6. ❌ Expor dados de um cliente em endpoint de outro cliente (mesmo Admin autenticado)
7. ❌ Usar `is_active: bool` — usar `status` enum para suportar PRE_ACTIVE (FA-15)

## 8. Definition of Done

- [ ] CRUD completo com persistência no PostgreSQL (não apenas React Context)
- [ ] RBAC enforcement no backend em todos os endpoints `/api/clients/*`
- [ ] `data/clients.ts` intacto após qualquer operação Admin (teste automatizado)
- [ ] Junction `skill_clients` como única fonte canônica (zero arrays duplicados)
- [ ] ClientMetrics calculadas on-demand, não armazenadas
- [ ] `status` enum funcional: PRE_ACTIVE / ACTIVE / ARCHIVED
- [ ] Operacional que tenta `/clientes` é redirecionado para `/404`
- [ ] Testes de integração cobrindo CA-CAD-002 (archive), CA-CAD-006 (skill atribuição), CA-CAD-007 (Operacional → 404)
- [ ] TypeScript `npx tsc --noEmit` sem erros
- [ ] Lint `npx next lint` sem warnings novos
