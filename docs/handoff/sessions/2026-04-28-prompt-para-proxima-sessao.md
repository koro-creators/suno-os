# Prompt para próxima sessão — sunOS / criação das SPECs SDD large

> **Como usar:** copie tudo que está dentro do bloco `>>> PROMPT` abaixo e cole como primeira mensagem da próxima sessão Claude Code (no diretório `~/projects/suno-os`).

---

## >>> PROMPT

Você está continuando o projeto **sunOS** (Next.js 14 + FastAPI/LangGraph, plataforma interna de IA da Suno United Creators). Esta é uma nova sessão — a anterior fechou após cascatear FA-13 (Aprovação Hierárquica) e FA-14 (Google Drive como Fonte) por todo BRD/PRD/SRD/UX, sem criar SPECs.

### Antes de qualquer coisa, leia nesta ordem:

1. `CLAUDE.md` (raiz do projeto) — convenções gerais + nova seção "Session Handoffs"
2. `docs/handoff/sessions/2026-04-28-fa13-fa14-cascata-deepagents-adrs.md` — handoff completo da sessão anterior, com todas as decisões, arquivos modificados, pendências e aprendizados
3. `docs/srd/parte7-ADRs.md` — em particular ADR-008, ADR-009, ADR-010 (FA-13/FA-14) e **ADR-011 (deepagents)**

### Missão desta sessão

Criar **2 SPECs SDD large** (e opcionalmente uma terceira de PoC). Use o skill `sdd-koro` para guiar a estrutura.

#### SPEC 1 — `docs/specs/large/approval-hierarchy/`

Cobertura: FA-13 (Aprovação Hierárquica) · FR-160..FR-169 · BR-017 · RN-023 a RN-026 · ADR-008 + ADR-010

Artefatos a gerar (5):
- `constitution.md` — princípios imutáveis (humano obrigatório RN-024, limite 3 rounds RN-025, validators paralelos RN-023, chain configurável RN-026)
- `spec.md` — comportamento externo: endpoints `/api/approval/*` (API-130..136), telas T-29/T-30/T-31, fluxo DFL-08
- `design.md` — arquitetura CTM-08 (8 componentes), data model (ENT-34..ENT-38), domain events EV-28..EV-34, decisão deepagents conforme ADR-011
- `plan.md` — ordem de implementação, dependências (precisa CTM-01 Auth Gateway pronto), stack
- `tasks.md` — tarefas atômicas testáveis isoladamente

#### SPEC 2 — `docs/specs/large/drive-readonly-curation/`

Cobertura: FA-14 (Google Drive como Fonte) · FR-170..FR-179 · BR-018 · RN-027 a RN-030 · ADR-009

⚠️ **Pendência crítica:** ADR-009 está em status Proposto e **requer alinhamento explícito com Guga** sobre o ajuste de "espelho bidirecional" (pedido literal) → "read-only + curadoria sugestiva" (decisão arquitetural). A SPEC pode ser escrita mas **não pode ir para implementação** antes desse alinhamento. Documente isso no `constitution.md` como pré-requisito de aprovação.

Artefatos: mesma estrutura da SPEC 1, cobrindo CTM-09 (8 componentes), ENT-39..ENT-43, DFL-09, telas T-32/T-33, endpoints API-140..150.

#### SPEC 3 (opcional) — `docs/specs/large/deepagents-poc-shoot-for-the-moon/`

Cobertura: validar os 5 pré-requisitos do ADR-011 via PoC em CTM-04 (Provocation Engine — Explorer↔Crítico).

Escopo curto (1 sprint): implementar Explorer + Crítico via `create_deep_agent` com 2 sub-agents, validar tracing MLflow, medir qualidade do plan com Gemini Flash puro vs. híbrido Sonnet/Flash, validar wrapper FS RBAC-aware.

Pergunte ao usuário se quer fazer a SPEC 3 nesta sessão ou deixar para depois — depende de quanto contexto sobrar.

### Constraints obrigatórias (não negociáveis)

- **Vocabulário Suno** (BRD Parte 2 §1 e §9): use Devorar, Provocar, Faísca, Brasa, Validado, Caixa-preta, Bioma, Sistema Solar, Sun, Planeta, Órbita, Moon, Aprovador, Curadoria. **Nunca** use: gerar, otimizar, eficiência, accelerator. **Sempre** Koro com K (nunca Coro).
- **Caixa-preta (RN-009/011):** Operacional NUNCA vê Biblioteca, system_prompts, brand-guidelines fonte. Endpoints retornam 404 genérico, não 403 (não revelar existência).
- **Cross-client guard (RN-010):** todo retrieval/read filtra por `client_id` da Conversation/ApprovalRequest/DriveSync — não é opcional.
- **deepagents** é decisão de orquestração interna (ADR-011 Proposto), NÃO substitui ADR-002 (engine único). Para BC-04/CTM-08/CTM-09 é o harness recomendado; para CTM-03 e CTM-02 mantém LangGraph nativo.
- **Não invente** referências, FRs, RNs, ADRs ou IDs de telas. Se faltar fonte, marque `[Inferido — A validar]` e não prossiga até confirmar.

### Documentos upstream a consultar (já estão prontos — apenas consume)

| Doc | O que tem |
|-----|-----------|
| `docs/brd/parte3-requisitos.md` | BR-017 (Aprovação) e BR-018 (Drive) |
| `docs/brd/parte4-regras.md` | RN-023..RN-030 (todas FA-13/14) |
| `docs/prd/parte1-feature-map.md` | FA-13 (9 subfeatures) + FA-14 (8 subfeatures) |
| `docs/prd/parte4-FRs.md` | FR-160..FR-179 |
| `docs/srd/parte2-domain-model.md` | BC-07 + DO-43..DO-55 + EV-28..EV-41 |
| `docs/srd/parte3-data-model-erd.md` | ENT-34..ENT-43 (10 tabelas) com tipos PostgreSQL |
| `docs/srd/parte4-data-flows-dfd.md` | DFL-08 + DFL-09 (diagramas Mermaid) |
| `docs/srd/parte6-arch-to-be.md` | CTM-08 + CTM-09 (8 componentes cada) |
| `docs/srd/parte7-ADRs.md` | ADR-008/009/010/011 |
| `docs/srd/parte8-APIs-contracts.md` | API-130..150 (13 endpoints) + SCH-013..017 |
| `docs/ux/parte1-inventario-telas.md` | T-29..T-33 (5 telas novas) |
| `docs/ux/parte3-screen-specs.md` | Specs detalhados T-29/T-30/T-32 |
| `docs/ux/parte5-ui-specs.md` | Microinterações §4.10/§4.11 + 8 animações |
| `CLAUDE.md` | Stack, design system, restrições |

### Workflow esperado

1. Confirme comigo (usuário) qual escopo vai atacar primeiro (SPEC 1, SPEC 2, ou as duas em paralelo)
2. Para cada SPEC, gere os 5 artefatos sequencialmente, **não em paralelo** — design depende de spec, plan depende de design, tasks depende de plan
3. Após cada SPEC, peça revisão antes de seguir para a próxima
4. Ao fim da sessão, **crie um novo handoff** em `docs/handoff/sessions/YYYY-MM-DD-<slug>.md` (convenção em CLAUDE.md §"Session Handoffs")

### Não faça nesta sessão

- ❌ Implementar código (apenas as SPECs)
- ❌ Modificar BRD/PRD/SRD/UX upstream — eles já estão consistentes; se notar inconsistência, **pergunte** antes de mexer
- ❌ Aceitar pedidos de "espelho bidirecional Drive" (ADR-009 fechou em read-only — qualquer pedido conflitante exige escalar pro Heitor falar com Guga)
- ❌ Marcar ADR-009 ou ADR-011 como Aceito (ambos têm pré-requisitos pendentes documentados)

### Primeiro passo

Comece lendo o handoff (`docs/handoff/sessions/2026-04-28-fa13-fa14-cascata-deepagents-adrs.md`), depois me pergunte qual SPEC atacar primeiro. Não comece a escrever sem confirmação.

## <<< FIM DO PROMPT
