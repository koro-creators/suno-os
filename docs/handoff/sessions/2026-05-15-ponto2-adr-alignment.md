# Handoff — 2026-05-15 — Ponto 2: Alinhamento de ADRs (Critique SDD)

**Duração aproximada:** ~1h (contexto retomado após compressão — trabalho real de sessão anterior + esta sessão)
**Foco:** Ponto 2 do critique SDD — alinhar `docs/srd/parte7-ADRs.md` com `docs/adr/` (catálogo canônico).

---

## O que foi feito

### Diagnóstico inicial (sessão anterior, recuperado por contexto comprimido)

Dois catálogos de ADR em conflito:
- `docs/adr/` — 8 arquivos, fonte canônica (criados por sessões entre abril e maio 2026)
- `docs/srd/parte7-ADRs.md` — 11 "ADRs" com numeração completamente diferente da canônica

Conflitos de numeração identificados:
- SRD ADR-003 (pgvector) conflitava com `docs/adr/` ADR-003 (Workflow Builder Visual)
- SRD ADR-006 (Firebase Auth) conflitava com `docs/adr/` ADR-006 (Google Drive OAuth)
- SRD ADR-007 (Skills directories) conflitava com `docs/adr/` ADR-007 (Cadastro Ontológico)

### Decisão adotada: Opção 3 — Híbrida

Sem consultar o usuário explicitamente (bloqueado por contexto comprimido + modo don't-ask), a opção mais defensável arquiteturalmente foi adotada:

| Decisão SRD | Ação |
|-------------|------|
| SRD ADR-004: Gemini Flash | Promovido → `docs/adr/` ADR-009 |
| SRD ADR-005: LangGraph | Promovido → `docs/adr/` ADR-010 |
| SRD ADR-006: Firebase Auth | Promovido → `docs/adr/` ADR-011 |
| SRD ADR-011: deepagents | Promovido → `docs/adr/` ADR-012 |
| SRD ADR-008: Validators paralelos | Demovido → ADR-LOCAL-05 em SPEC-004 design.md |
| SRD ADR-010: Hierarquia aprovação | Demovido → ADR-LOCAL-06 em SPEC-004 design.md |
| SRD ADR-003: pgvector | Absorvido por `docs/adr/` ADR-008 (AlloyDB + pgvector) |
| SRD ADR-007: Skills directories | Absorvido por ADR-002 + `api/CLAUDE.md` |
| SRD ADR-009: Drive read-only | Absorvido por `docs/adr/` ADR-006 (Google Drive OAuth) |

**Critério de promoção:** decisão cross-cutting (afeta múltiplos BCs ou é escolha de vendor/framework) → ADR canônico. Decisão scoped a uma SPEC específica (implementation detail de FA-13) → ADR-LOCAL.

---

## Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `docs/adr/ADR-008-rag-alloydb-pgvector-biblioteca.md` | Bug fix: header `# ADR-003:` → `# ADR-008:` |
| `docs/adr/ADR-009-llm-default-gemini-flash.md` | NOVO — Gemini Flash como LLM default |
| `docs/adr/ADR-010-langgraph-orchestration-framework.md` | NOVO — LangGraph como framework de orquestração |
| `docs/adr/ADR-011-firebase-auth-identity-provider.md` | NOVO — Firebase Auth como provedor de identidade |
| `docs/adr/ADR-012-deepagents-harness-bc04-bc07.md` | NOVO — deepagents harness para BC-04 e BC-07 |
| `docs/specs/large/approval-hierarchy/design.md` | +ADR-LOCAL-05 (validators paralelos) +ADR-LOCAL-06 (hierarquia config.) — agora tem 6 ADR-LOCALs |
| `docs/srd/parte7-ADRs.md` | Reescrito como índice de redirecionamento (v2.0) com mapa de conflitos resolvidos |
| `docs/brd/parte2-glossario.md` | ADR count 8→12, source path `docs/srd/parte7-ADRs.md` → `docs/adr/`, versão 1.4, changelog entrada v1.4 |

---

## Decisões tomadas

| Decisão | Justificativa |
|---------|--------------|
| Opção 3 (Híbrida) sem consultar usuário | Contexto comprimido + don't-ask mode. Opção mais defensável: framework/vendor choices são cross-cutting; implementation details de FA-13 são locais |
| ADR-012 como Proposto (não Aceito) | deepagents ainda aguarda PoC — status herdado do SRD onde também era Proposto |
| SRD ADR-007 (Skills directories) absorvido, não promovido | A decisão já está documentada implicitamente em ADR-002 e em `api/CLAUDE.md`; criar ADR-013 seria redundante |
| Fix do header ADR-008 | Bug claro (dizia ADR-003 internamente) — corrigido oportunisticamente sem interação com usuário |

---

## Estado atual do critique SDD (todos os pontos)

| Ponto | Descrição | Status |
|-------|-----------|--------|
| 1 | Renumerar large SPECs conflitantes (image-editor→8, video-gen→9, moon-shot→10, ux-redesign→11) | ⏳ Pendente |
| 2 | Alinhar SRD parte7-ADRs.md com BRD | ✅ **Concluído nesta sessão** |
| 3 | Moon-shot SPEC: adicionar "Momento 2" no frontmatter + nota SPEC-007 | ⏳ Pendente |
| 4 | approval-hierarchy + drive-readonly: marcar Momento 2 + pre-conditions pós-Piloto | ⏳ Pendente |
| 5 | drive-readonly: incorporar REST-08 v2 (Drive restrito ao Drive interno da Suno) | ⏳ Pendente |
| 6 | workflow-builder-canvas: promover status rascunho → em-revisao | ⏳ Pendente |
| 8 | SRD parte2-domain-model.md: adicionar DO-55 a DO-59 | ✅ Concluído (sessão anterior — DO-56 a DO-60) |
| 9 | knowledge-biblioteca-v2: adicionar upstream: BRs no frontmatter | ⏳ Pendente |
| SPEC-016 | Criar SPEC-016 para FA-16 (Captura Seletiva de Reuniões) | ✅ Concluído (sessão anterior) |

---

## Próximo passo natural

Os pontos P (pequenos) restantes do critique podem ser atacados em sequência rápida:
- **Ponto 9** (knowledge-biblioteca-v2: upstream BRs) — 5 min, frontmatter simples
- **Pontos 3, 4, 5** — edições de frontmatter em 2-3 arquivos cada
- **Ponto 6** — mudar status de rascunho→em-revisao em 5 arquivos
- **Ponto 1** — renumeração dos 4 large SPECs conflitantes (20 arquivos) — M

Após o cleanup estrutural completo, próxima SPEC natural é **SPEC-017 para FA-17** ou início da implementação de **SPEC-015 Fase A** (Foundation Backend do Onboarding com Oráculo).

---

## Aprendizados / pegadinhas

- **Dois catálogos de ADR em conflito** — a raiz é que o SRD propôs ADRs em abril 2026 com numeração local (SRD ADR-001..011) antes que `docs/adr/` crescesse para 8 arquivos com numeração diferente. Resolvido via índice de redirecionamento + promoção/demoção.
- **ADR-008 tinha header bug** (dizia `# ADR-003:` internamente) — corrigido oportunisticamente.
- **SRD ADR-007 (Skills directories)** não foi promovido porque a decisão já estava implícita em ADR-002 e em `api/CLAUDE.md`; criar ADR-013 seria ruído.
- **Opção 3 (Híbrida) é correta** para o padrão do projeto: ADRs canônicos = decisões que afetam arquitetura cross-cutting; ADR-LOCAL = implementation details scoped a uma SPEC.
