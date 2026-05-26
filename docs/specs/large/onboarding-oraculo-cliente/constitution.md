---
spec-id: SPEC-015
slug: onboarding-oraculo-cliente
artefato: constitution
nivel-sdd: spec-anchored
tamanho: large
status: rascunho
criada: 2026-05-15
atualizada: 2026-05-15
versao: 1.0
escopo:
  projeto: sunos
  stack: "Frontend: Next.js 14 + TypeScript | Backend: FastAPI + LangGraph + Python 3.11"
  autor: Heitor Miranda
  papel: Tech Lead
  branch: master
  contexto: FA-15 — wizard de onboarding de cliente que alimenta automaticamente 6 entidades ontológicas via "Oráculo do Cliente" (Deep Agent), com HITL gate obrigatório e Wiki Ontológica pós-ACTIVE
upstream:
  - docs/brd/parte3-requisitos.md (BR-021, BR-022, BR-018)
  - docs/brd/parte4-regras.md (RN-032, RN-033, RN-009, RN-011, RN-012)
  - docs/prd/parte4-FRs.md (FR-180–FR-185)
  - docs/srd/parte7-ADRs.md (ADR-007)
  - docs/ux/parte1-inventario-telas.md (T-34, T-35, T-36, T-39)
pre_conditions:
  - PRE-01: ADR-007 (Cadastro ontológico de cliente) — status Aceito ✓
  - PRE-02: BR-021 (Wiki Ontológica) — fase Piloto, cliente piloto a definir (≥1 cliente acordado antes de PRE_ACTIVE go-live)
  - PRE-03: FA-14 Drive Suno (SPEC-006) implementado — OAuth Drive interno disponível antes do wizard passo 3
---

# Constitution — Onboarding com Oráculo do Cliente (FA-15)

Princípios imutáveis que guiam toda implementação desta SPEC. O agente de codificação deve respeitar estes princípios em TODAS as decisões.

## 1. Princípios de Arquitetura

1. **Oráculo é Deep Agent assíncrono** — não executa inline no request HTTP. Wizard dispara job, UI mostra progresso via polling. Nenhum endpoint de onboarding bloqueia esperando Oráculo.
2. **Status PRE_ACTIVE/ACTIVE é gate hard** — qualquer tentativa de executar Skill, Moon Shot ou Workflow para cliente PRE_ACTIVE deve falhar com 404 genérico (RN-011). Não é validação de UI, é enforced no backend.
3. **HITL é por entidade, nunca batch** — a UI não pode oferecer "Aceitar tudo" ou "Pular" (RN-032). Cada uma das 6 entidades exige decisão explícita: Aceitar, Editar+Aceitar, ou Rejeitar+Regenerar.
4. **Wiki Ontológica é caixa-preta para Operacional** — o endpoint `/api/clients/{slug}/wiki` e toda rota frontend `/clientes/[slug]/wiki` retorna 404 para usuários com role Operacional (RN-011). Não 403.
5. **Proveniência rastreável** — cada claim gerado pelo Oráculo carrega fonte (`Drive/{arquivo}` ou `Web/{url}` ou `Briefing`). Dado sem proveniência não pode entrar no seed.
6. **Allow-list de web enforced no agent** — o Oráculo não consulta nenhum domínio fora da allow-list configurada no passo 2 do wizard (RN-033). Não é sugestão, é invariante do agente.

## 2. Princípios de Qualidade

1. **Wizard auto-salva por passo** — estado incompleto do wizard persiste por ≤24h, permitindo retomada.
2. **Wizard completa em ≤5 minutos de input humano** — tempo de espera do Oráculo não conta.
3. **Oráculo completa em ≤30 min (objetivo ≤15 min p95)** — SLO monitorado via MLflow.
4. **HITL auditado** — cada decisão (Aceitar/Editar/Rejeitar) registrada com `timestamp`, `user_id`, `entity_type`, `action`, `diff_before_after`. Audit log não apaga.

## 3. Princípios de Segurança

1. **Cross-client guard obrigatório** (RN-010) — toda query filtra `client_id` extraído do JWT. Nunca filtrar post-fetch.
2. **404 genérico para acesso não autorizado** — Operacional que tenta acessar `/api/clients/{slug}/wiki` recebe 404, não 403. Não revelar existência.
3. **Scraping ético** — Oráculo respeita `robots.txt Disallow`, não acessa conteúdo protegido por login/paywall. Violação = falha silenciosa com log, não erro.
4. **Drive OAuth per-operator** — credenciais do Drive Suno são do operador (PX-01/Admin), nunca compartilhadas entre clientes.

## 4. Padrões Obrigatórios

- **Frontend**: Next.js 14 App Router, TypeScript strict, inline styles, CSS variables, Lucide React (size 14, strokeWidth 1.5)
- **Backend**: Python 3.11+, FastAPI, LangGraph StateGraph, Pydantic v2
- **Nenhuma nova dependência frontend** sem justificativa (Tailwind + Lucide já disponíveis)
- **Nomenclatura**: Sempre "Oráculo" com O maiúsculo, "Wiki Ontológica" com W e O maiúsculos, "Drive Suno" com D e S maiúsculos
- **TypeScript**: interfaces explícitas, zero `any`
- **Endpoints**: REST, padrão `/api/clients/{slug}/...`

## 5. Dependências Aprovadas

| Dependência | Contexto | Propósito |
|-------------|----------|-----------|
| `@xyflow/react` | Canvas SPEC-005 apenas | NÃO usar nesta SPEC |
| LangGraph StateGraph | `api/` | Oráculo deep agent |
| LangChain Gemini Flash | `api/` | LLM padrão do Oráculo |
| LangChain web search tool | `api/` | Pesquisa web com allow-list |
| FastAPI BackgroundTasks | `api/` | Job assíncrono do Oráculo |
| Existing `api/chat/ingestion/` | `api/` | Reutilizar processadores de PDF/DOCX/TXT |

## 6. Anti-patterns Proibidos

1. **Não oferecer "Aceitar todas as entidades"** — viola RN-032 (HITL gate por entidade)
2. **Não retornar 403 em contexto de caixa-preta** — sempre 404 para Operacional acessando Wiki
3. **Não bloquear endpoint HTTP esperando Oráculo** — sempre job assíncrono + polling
4. **Não acessar domínio fora da allow-list** no Oráculo — allow-list é contrato, não sugestão
5. **Não executar Skill/Workflow para cliente PRE_ACTIVE** — gate hard no backend
6. **Não misturar dados de clientes diferentes** — client_id no JWT filtra tudo
7. **Não usar `any` em TypeScript** — interfaces explícitas em todo tipo novo
8. **Não hardcodar número de entidades** — a constante `ONTOLOGY_ENTITY_TYPES` define o conjunto; UI deriva dela
