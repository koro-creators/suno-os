---
spec-id: SPEC-021
slug: agentes
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
  contexto: "FA-17 — Agentes de IA autônomos e reutilizáveis que combinam identidade, instruções, Skills sunOS, apps integrados, memória file-based e agendamento; domínio global com permissão explícita por cliente."
upstream:
  - docs/prd/parte1-feature-map.md (FA-17)
  - docs/brd/parte3-requisitos.md (BR-025, BR-026)
  - docs/brd/parte4-regras.md (RN-009, RN-010, RN-011)
  - docs/srd/parte7-ADRs.md (ADR-002, ADR-005)
pre_conditions:
  - PRE-01: Bucket GCS para memory files provisionado com IAM (service account Storage Object Admin)
  - PRE-02: RBAC P3/P4 implementado — dependency `get_current_user` com `role` disponível no backend
  - PRE-03: Skills Admin (SPEC-017) implementado — tabela `skills` e `skill_slug` como chave canônica existem
  - PRE-04: Cloud Scheduler service account com permissão de invocar `/api/agents/{id}/run` (Fase D blocker)
---

# Constitution — Agentes (FA-17)

Princípios imutáveis que guiam toda implementação desta SPEC. O agente de codificação deve respeitar estes princípios em TODAS as decisões de implementação. Quando houver tensão entre velocidade e princípio, o princípio vence.

## 1. Princípios de Arquitetura

1. **Agente é composição, não substituição de Skill** — Skill é o átomo de capacidade (system_prompt + moons/tools). Agente é a camada de orquestração: combina N Skills, identidade própria, memória contextual e schedule. Nenhuma lógica de Skill deve ser duplicada em Agente; o Agente referencia Skill por `skill_slug` e a invoca como LangChain tool no runtime.

2. **Domínio global com permissão explícita por cliente** — Agentes existem em namespace global (não são per-client como Skills). A tabela `agent_client_permissions` é o único mecanismo de autorização de execução: um Agente só executa para um cliente se houver entrada ativa nessa tabela. Não há herança de permissão, não há "público por default".

3. **Permissão RBAC hard no backend** — A verificação de `agent_client_permissions` ocorre no backend, na query de execução, antes de qualquer processamento LLM. Frontend pode ocultar botões — não é o gate de segurança. Gate é o backend.

4. **Memory files são imutáveis após upload** — O agente nunca modifica arquivos de memória durante execução. Arquivos são read-only para o runtime. Atualização = deletar arquivo antigo + re-upload (novo `file_id`). Garante auditabilidade e elimina race conditions.

5. **Schedule execution é idempotente** — Re-run para a mesma janela `scheduled_run_at` é no-op se já existir `agent_run` com status `completed` ou `running` para aquele `(agent_id, scheduled_run_at)`. O índice único parcial em `agent_runs` é o mecanismo de enforcement — não verificação em código.

6. **Preview mode é sandboxed** — Execução em preview não persiste em `agent_runs`. Persiste em `preview_runs` (tabela efêmera com TTL de 1 hora; limpeza via job background). Preview usa `triggered_by='preview'` e não propaga efeitos externos.

7. **Audit trail imutável** — `agent_runs` nunca é deletado pelo produto. `DELETE /api/agents/{id}` muda `agents.status` para `archived` (soft delete). Histórico de execuções é preservado. Limpeza de `preview_runs` expiradas é operacional, não de produto.

8. **Execução é assíncrona** — Nenhum endpoint HTTP bloqueia aguardando conclusão do agente. `POST /api/agents/{id}/run` dispara job e retorna `202 Accepted` com `{ run_id }`. Status do run é consultado via `GET /api/agents/{id}/runs/{run_id}`. Polling com backoff ou SSE — não long-polling síncrono.

## 2. Princípios de Qualidade

1. **Editor completo em ≤3 cliques a partir da listagem** — Listagem → card → editor deve ser fluído. Tabs carregam dados individualmente (lazy) para não bloquear abertura inicial.
2. **Preview executa em ≤5 minutos para tarefas típicas** — SLO monitorado via MLflow. Timeout de 10 min no runtime; após esse limite, status `timed_out`.
3. **Mock-mode funciona sem `NEXT_PUBLIC_API_URL`** — Context/mock-data cobre listagem, CRUD e execução simulada. Frontend não pode exibir estado quebrado em modo protótipo.
4. **TypeScript strict — zero `any`** — Todas as interfaces explícitas em `lib/agents-types.ts`. Verificado com `npx tsc --noEmit` antes de cada commit.

## 3. Princípios de Segurança

1. **Caixa-preta total para Operacional** — `/api/agents/*` e rota `/agentes` retornam 404 para usuário com role Operacional. Não 403. Nunca revelar existência de agente que o usuário não pode acessar.
2. **Cross-client guard obrigatório** — Execução de agente filtra `agent_client_permissions.client_id` contra o `client_id` do contexto JWT antes de qualquer processamento. Query filtra na JOIN, nunca post-fetch.
3. **Memory files via GCS signed URL** — Acesso usa Signed URL de curta duração (15min) gerado pelo backend. Nunca expor caminho GCS diretamente ao frontend. Download direto do GCS pelo cliente é proibido.
4. **Apps: credenciais nunca no frontend** — Configuração sensível de `agent_app_connections` trafega apenas backend-to-backend. Frontend recebe apenas `{ app_type, enabled, connected_at }` — sem segredos.

## 4. Padrões Obrigatórios

- **Frontend**: Next.js 14 App Router, TypeScript strict, inline styles (não Tailwind classes), CSS variables do design system, Lucide React (size 14, strokeWidth 1.5)
- **Backend**: Python 3.11+, FastAPI, LangGraph StateGraph para runtime do agente, Pydantic v2 para schemas
- **Admin CRUD pattern**: Types em `lib/agents-types.ts` → Mock data em `data/agents-admin.ts` → Context em `contexts/AgentsContext.tsx` → Componentes em `components/admin/agentes/` → Pages em `app/agentes/` → Provider em `components/layout/Providers.tsx` → Sidebar
- **Rotas**: UI em PT (`/agentes`), API em EN (`/api/agents`) — mesmo split intencional do projeto
- **Nomenclatura canônica**: "Agentes" (A maiúsculo), "Skills" (S), "Workflows" (W), "Biblioteca" (B)
- **Sem novas dependências npm** sem justificativa explícita
- **Verbos proibidos em copies**: gerar, otimizar, eficiência, accelerator, smart, AI-powered

## 5. Dependências Aprovadas

| Dependência | Contexto | Propósito |
|-------------|----------|-----------|
| LangGraph StateGraph | `api/` | Runtime do agente (orquestração de Skills como tools) |
| LangChain Gemini Flash | `api/` | LLM padrão do agente |
| LangChain tools | `api/` | Cada Skill vira tool LangChain callable |
| `google-cloud-storage` | `api/` | Upload e Signed URL para memory files |
| FastAPI BackgroundTasks | `api/` | Execução assíncrona de runs |
| Cloud Scheduler (Fase D) | GCP infra | Trigger de schedule via HTTP |
| `APScheduler` (Fase C stub) | `api/` | Stub in-process para testes antes do Cloud Scheduler |

## 6. Anti-patterns Proibidos

1. **Não duplicar lógica de Skill em Agente** — Agente invoca Skill como tool; não copia seu system_prompt
2. **Não retornar 403 para acesso não autorizado** — sempre 404 (caixa-preta)
3. **Não bloquear endpoint HTTP esperando conclusão do agente** — sempre `202 + run_id`
4. **Não expor caminho GCS ou credenciais de app no response do frontend**
5. **Não executar agente para cliente sem entrada em `agent_client_permissions`** — gate hard
6. **Não usar `any` em TypeScript** — interfaces explícitas em `lib/agents-types.ts`
7. **Não modificar `data/clients.ts`** — imutável per ADR-002
8. **Não oferecer "Executar" em agente com status `draft` ou `archived`** — só agentes `active` executam
9. **Não persistir `agent_run` para execuções em preview** — apenas `preview_runs` efêmeras
10. **Não re-executar schedule para janela que já tem run `completed`/`running`** — idempotência via índice único
