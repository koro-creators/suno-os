# Handoff — 2026-04-28 — Cascata FA-13 / FA-14 + ADRs deepagents

**Duração aproximada:** sessão longa (continuação de conversa anterior já comprimida)
**Foco:** (1) cascatear FA-13 (Aprovação Hierárquica) e FA-14 (Google Drive como Fonte) por toda a documentação BRD/PRD/SRD/UX **sem criar specs**; (2) reabrir debate sobre `deepagents` e formalizar em ADRs.

## O que foi feito

### Cascata FA-13 / FA-14 (sem SPECs)

**SRD Parte 2 (Domain Model)** — `docs/srd/parte2-domain-model.md`
- Novo BC-07 Approval & Validation com 13 objetos (DO-43..DO-55)
- 5 Aggregate Roots: ApprovalRequest, ValidationReport, DriveSync, CurationSuggestion, DriveCleanupReport
- 14 Domain Events (EV-28..EV-41)
- Context map atualizado com relacionamentos de BC-07 com BC-01/02/03/04/05/06

**SRD Parte 3 (Data Model ERD)** — `docs/srd/parte3-data-model-erd.md`
- 10 tabelas novas (ENT-34..ENT-43): `approval_chains`, `approval_chain_levels`, `approval_requests`, `approval_decisions`, `validation_reports`, `drive_oauth_credentials`, `drive_syncs`, `drive_documents`, `curation_suggestions`, `drive_cleanup_reports`
- 11 relacionamentos novos (REL-27..REL-37)
- ERD Mermaid expandido
- Política de retenção/LGPD por tabela
- Migration path estendido (Onda 7 — FA-13; Onda 8 — FA-14)

**SRD Parte 4 (DFDs)** — `docs/srd/parte4-data-flows-dfd.md`
- DFL-08 (Submissão → Validators paralelos → Aprovador → Carimbo Validado)
- DFL-09 (Drive sync periódico + webhook → Curadoria sugestiva → Cleanup reports)

**SRD Parte 6 (Arch To-Be)** — `docs/srd/parte6-arch-to-be.md`
- CTM-08 Approval Engine (8 componentes) e CTM-09 Drive Connector (8 componentes)
- C4 L2 e L3 expandidos (Mermaid)
- 7 integrações novas (INT-TB-20..26): Pub/Sub Approval/Drive, Slack notify, Drive Push, Drive API readonly, Cloud KMS

**SRD Parte 7 (ADRs)** — `docs/srd/parte7-ADRs.md`
- ADR-008 (validators paralelos), ADR-009 (Drive read-only), ADR-010 (chain configurável manual) — adicionados em sessão anterior

**SRD Parte 8 (APIs)** — `docs/srd/parte8-APIs-contracts.md`
- 13 endpoints novos: API-130..136 (Approval) + API-140..150 (Drive)
- 5 schemas: SCH-013..017
- 5 integration contracts: INT-12..16
- Total agora 79 endpoints (+13)

**UX Parte 1 (Inventário)** — `docs/ux/parte1-inventario-telas.md`
- 5 telas novas: T-29 Inbox Aprovador, T-30 Detalhe Submissão, T-31 Modal Submeter, T-32 Drive Sync Dashboard, T-33 Inbox Curadoria
- Persona PX-06 Aprovador (Sócio), novas rotas

**UX Parte 3 (Screen Specs)** — `docs/ux/parte3-screen-specs.md`
- Specs detalhados de T-29, T-30, T-32 (layouts ASCII, elementos, estados, RBAC)
- 13 componentes novos em §14.1.1

**UX Parte 5 (UI Specs)** — `docs/ux/parte5-ui-specs.md`
- §4.10 (FA-13) e §4.11 (FA-14) com microinterações
- 8 animações novas: `scan-shimmer`, `validated-stamp-impact`, `oauth-warn-glow`, `card-slide-out-*`, `tween-counter`, `chain-stepper-stagger` — todas com override `prefers-reduced-motion`

### Debate deepagents → 3 ADRs (`docs/srd/parte7-ADRs.md`)

- **ADR-002 revisado** — nota clarificadora explicando que rejeitar "1 agente isolado por tenant" ≠ rejeitar a biblioteca `deepagents` como harness multi-agente. Adicionadas seções "O que NÃO impede" / "O que impede".
- **ADR-008 atualizado** — referência a ADR-011 como implementação de referência (com fallback para LangGraph nativo).
- **ADR-011 novo (Proposto)** — adoção de `deepagents` como harness para BC-04 (Provocation Engine), BC-07 Validators (CTM-08) e BC-07 CurationAgent (CTM-09); CTM-03 (chat) e CTM-02 (workflows) **mantêm** LangGraph nativo. Inclui 5 pré-requisitos para sair de Proposto → Aceito (PoC, tracing, qualidade Flash vs. Sonnet, wrapper FS RBAC, alinhamento de custo).

### Convenção nova
- `CLAUDE.md` ganhou seção "Session Handoffs" — este documento é o primeiro exemplo.

## Decisões tomadas

| Decisão | Onde | Racional |
|---------|------|----------|
| BC-07 dedicado para Approval + Drive (em vez de espalhar em BCs existentes) | SRD Parte 2 §2.1 | Coesão semântica: ambos lidam com "fontes externas" e "validação humana" |
| Drive permanece **read-only** com curadoria sugestiva (ajuste vs. pedido literal de "espelho") | ADR-009 | Risco LGPD/ACL/IP/RN-011 sem mitigação proporcional ao valor — **requer alinhamento explícito com Guga antes de Status=Aceito** |
| Hierarquia de aprovação configurável manualmente no MVP (não sync RH) | ADR-010 | Hierarquia da Suno muda toda semana; sync RH adiciona dependência externa frágil |
| Validators executam em paralelo via fan-out (latência ≈ max), não sequencial | ADR-008 | NFR-001 (latência) — paralelo evita soma de tempos |
| Adoção de `deepagents` é por BC, não global | ADR-011 | BC-04/CTM-08/CTM-09 são genuinamente multi-agente; CTM-03 (chat) e CTM-02 (workflows) não — adicionar planning loop ali pioraria latência sem ganho |
| ADR-002 não conflita com ADR-011 | ADR-002 (revisado) | "1 engine único" é decisão de tenancy; "deepagents interno a um BC" é decisão de orquestração — eixos ortogonais |

## Arquivos modificados

**SRD:**
- `docs/srd/parte2-domain-model.md` (BC-07 + 13 objetos + 14 events)
- `docs/srd/parte3-data-model-erd.md` (10 tabelas + 11 relacionamentos + ERD Mermaid)
- `docs/srd/parte4-data-flows-dfd.md` (DFL-08, DFL-09)
- `docs/srd/parte6-arch-to-be.md` (CTM-08, CTM-09 + C4 L2/L3)
- `docs/srd/parte7-ADRs.md` (ADR-002 revisado, ADR-008 atualizado, ADR-011 novo)
- `docs/srd/parte8-APIs-contracts.md` (13 endpoints + 5 schemas + 5 integrações)

**UX:**
- `docs/ux/parte1-inventario-telas.md` (5 telas + PX-06 + rotas)
- `docs/ux/parte3-screen-specs.md` (specs T-29/T-30/T-32 + 13 componentes)
- `docs/ux/parte5-ui-specs.md` (§4.10/§4.11 + 8 animações)

**Convenção:**
- `CLAUDE.md` (nova seção "Session Handoffs")
- `docs/handoff/sessions/` (nova pasta — este arquivo)

## Pendências (não abertas como TODO)

1. **Alinhamento Guga sobre Drive read-only** — pedido literal era "espelho bidirecional". ADR-009 documenta o ajuste e os 4 riscos. Antes de qualquer implementação de FA-14, Heitor precisa fechar com Guga. Status do ADR-009 não pode passar de Proposto → Aceito sem isso.
2. **PoC de `deepagents`** — ADR-011 lista 5 pré-requisitos para virar Aceito. O PoC mais barato é em CTM-04 (Moon Shot — Explorer↔Crítico com 2 sub-agents). Validar ali tracing MLflow, qualidade do plan com Gemini Flash vs. Sonnet híbrido, e wrapper FS RBAC-aware.
3. **TODOs propagados pelos docs** — vários TODO-DM-*, TODO-DT-*, TODO-DF-*, TODO-API-*, TODO-TB-* foram adicionados ao longo da cascata. Lista vive nos respectivos docs §11/§10.
4. **Defaults de ApprovalChain por cliente** — Vivo, Sicredi etc. precisam ter chain default definida antes de FA-13 ir a piloto (TODO-TB-09).
5. **Política KMS** — key per environment vs. key per cliente para `drive_oauth_credentials` (TODO-DT-10) — Eng + SRE + Jurídico.
6. **Retenção LGPD de `drive_documents` após OAuth revoked** — TODO-DT-09 / TODO-DF-10 — Heitor + Jurídico.

## Próximo passo natural

**Próxima sessão será sobre criar specs SDD large** (decisão do usuário no fim desta sessão). Caminho recomendado:

1. Criar `docs/specs/large/approval-hierarchy/` com os 5 artefatos (constitution, spec, design, plan, tasks) cobrindo FA-13 + FR-160..169 + ADR-008/010.
2. Criar `docs/specs/large/drive-readonly-curation/` cobrindo FA-14 + FR-170..179 + ADR-009.
3. Considerar uma terceira spec `docs/specs/large/deepagents-poc-moon-shot/` para validar ADR-011 (PoC com prazo curto, 1 sprint).

Toda documentação upstream (BRD, PRD, SRD, UX) já está pronta para alimentar essas specs sem retrabalho.

## Aprendizados / pegadinhas

- **ADR-002 vs. deepagents** — confusão semântica: o título original ("não Deep Agent por cliente") fez parecer que `deepagents` estava banido. Não estava — só a arquitetura per-tenant foi rejeitada. Sempre distinguir **decisão de tenancy** vs. **decisão de framework de orquestração**.
- **Guga pedido literal vs. ajuste** — pedido inicial de FA-14 foi "espelho bidirecional + agentes organizam Drive". Análise crítica reduziu para read-only + curadoria sugestiva (ADR-009). Usuário aprovou o ajuste mas alinhamento explícito com Guga ainda está pendente — não pular essa etapa.
- **Cascata sem SPECs é viável** — atualizar BRD/PRD/SRD/UX em ondas (BRD → PRD → SRD → UX) deixa todos os docs internamente consistentes antes de gastar tempo em SPECs detalhadas. Se algum stakeholder discordar de uma decisão upstream, retrabalho é mínimo.
- **Validators paralelos como decisão de UX, não só técnica** — UX Parte 5 §4.10 explicita a animação "Validators paralelos passando" — RN-023 não é só backend, é também sinal visual ao aprovador de que pré-validação aconteceu. Não esquecer disso na spec.
- **`deepagents` foi projetado pensando em Sonnet/Opus como orquestrador** — com Gemini Flash default (ADR-004), planning pode degradar. PoC de ADR-011 tem que medir isso explicitamente; default híbrido (Sonnet orquestrador / Flash sub-agents) é razoável.
- **Caixa-preta + virtual FS é fricção real** — `deepagents` traz virtual FS poderoso, mas `read_file` sem RBAC quebra RN-011. Wrapper RBAC-aware é pré-requisito não negociável (mitigação documentada em ADR-011).
