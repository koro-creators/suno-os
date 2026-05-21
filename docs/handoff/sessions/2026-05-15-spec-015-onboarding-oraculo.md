# Handoff — 2026-05-15 — SPEC-015 + Medium Specs Critique

**Duração aproximada:** ~1h (contexto retomado de sessão comprimida)
**Foco:** Ponto 10b do critique SDD — avaliar medium specs caso a caso; Ponto 7c — criar SPEC completa (large) para FA-15 Onboarding com Oráculo do Cliente.

---

## O que foi feito

### 10b — Avaliação dos medium specs (caso a caso)

Lidos todos os medium specs. Veredictos:

| Spec | ID antigo | ID novo | Veredicto |
|------|-----------|---------|-----------|
| nav-simplification | SPEC-007 | SPEC-007 | Sem mudança — correto, `implementada` ✓ |
| workflow-chaining | SPEC-004 | SPEC-012 | Manter rascunho; backend válido; refs frontend precisam update para canvas (SPEC-005) |
| chat-attachments | SPEC-006 | SPEC-013 | Manter; status → `parcialmente-implementada` (frontend done, backend pendente) |
| api-remediation-2026-04 | SPEC-005 | SPEC-014 | Manter como log histórico; TASK-API-001 a 007 ainda P0 pré-Piloto |

Mapa de conflitos descoberto (large SPECs):

| SPEC-ID | Large canônico | Conflitante (será renumerado no Ponto 1) |
|---------|---------------|------------------------------------------|
| SPEC-002 | knowledge-biblioteca-v2 | video-generation |
| SPEC-003 | workflow-builder (subst.) | image-editor |
| SPEC-004 | approval-hierarchy | moon-shot + workflow-chaining |
| SPEC-005 | workflow-builder-canvas | ux-redesign (large!) + api-remediation |
| SPEC-006 | drive-readonly-curation | chat-attachments |

**`ux-redesign` existe como large SPEC** (SPEC-005, 1160 linhas, 26 componentes, status rascunho) — será renumerado para SPEC-011 no Ponto 1 do critique.

### 7c — SPEC-015: FA-15 Onboarding com Oráculo do Cliente

Criados os 5 artefatos em `docs/specs/large/onboarding-oraculo-cliente/`:

| Artefato | Conteúdo |
|----------|----------|
| `constitution.md` | 6 princípios de arquitetura, 3 de qualidade, 3 de segurança, 8 anti-patterns, 3 pre_conditions |
| `spec.md` | 7 RFs (RF-01 a RF-07), 20 CAs, contratos TypeScript + Pydantic, 2 jornadas (JN-13/JN-15), máquina de estados |
| `design.md` | 3 níveis de arquitetura C4, schema SQL (4 tabelas), 5 ADR-LOCALs, 2 diagramas de sequência |
| `plan.md` | 5 fases (A–E), stack, riscos, Definition of Done |
| `tasks.md` | 22 tasks atômicas (A01–A04, B01–B06, C01–C06, D01–D04, E01–E03) + 2 backward-mapping tables |

**Cobertura:** FR-180 a FR-185, BR-021, JN-13, JN-15, T-34/35/36/39.

**Pre-conditions registradas:**
- PRE-01: ADR-007 (cadastro ontológico) — Aceito ✓
- PRE-02: cliente piloto a definir (≥1 antes de go-live)
- PRE-03: FA-14 Drive OAuth implementado (SPEC-006) — bloqueia wizard passo 3

---

## Decisões tomadas

| Decisão | Justificativa |
|---------|--------------|
| workflow-chaining → SPEC-012 | Conflitava com SPEC-004 (approval-hierarchy, canônico) |
| chat-attachments → SPEC-013 + parcialmente-implementada | Frontend already shipped em commit 32f7783 |
| api-remediation → SPEC-014 | Conflitava com SPEC-005 (canvas, canônico) |
| FA-15 = SPEC-015 (large, 5 artefatos) | 6+ arquivos novos, novo domínio (ontologia cliente), infraestrutura de job async — classifica como large |
| BackgroundTasks (não Cloud Tasks) para Oráculo v1 | Simplicidade para Piloto; checkpoint em DB mitiga risco de reinício — revisar para MVP (ADR-LOCAL-02) |
| Polling simples (não SSE) para progresso | Suficiente para UX de T-35; SSE adiciona complexidade sem ganho no Piloto (ADR-LOCAL-01) |
| Wiki = view de wiki_entities (não usar Biblioteca) | RBAC mais limpo; caixa-preta natural; não contamina busca da Biblioteca |

---

## Arquivos modificados

- `docs/specs/medium/workflow-chaining.spec.md` — spec-id SPEC-004 → SPEC-012 + nota canvas
- `docs/specs/medium/chat-attachments.spec.md` — spec-id SPEC-006 → SPEC-013, status → parcialmente-implementada
- `docs/specs/medium/api-remediation-2026-04.spec.md` — spec-id SPEC-005 → SPEC-014
- `docs/specs/_log/usage-log.md` — 4 novas entradas (SPEC-012 a SPEC-015)
- `docs/specs/large/onboarding-oraculo-cliente/constitution.md` — NOVO
- `docs/specs/large/onboarding-oraculo-cliente/spec.md` — NOVO
- `docs/specs/large/onboarding-oraculo-cliente/design.md` — NOVO
- `docs/specs/large/onboarding-oraculo-cliente/plan.md` — NOVO
- `docs/specs/large/onboarding-oraculo-cliente/tasks.md` — NOVO

---

## Pendências (critique SDD — pontos ainda não atacados)

Os pontos do critique que ficaram abertos (não foram escolhidos nesta sessão):

| Ponto | Descrição | Complexidade |
|-------|-----------|-------------|
| 1 | Renumerar large SPECs conflitantes (image-editor→8, video-gen→9, moon-shot→10, ux-redesign→11) | M — editar frontmatter em 4×5=20 arquivos |
| 2 | Alinhar SRD parte7-ADRs.md com BRD (11 ADRs do SRD divergem dos 8 do BRD) | G — decisão de merge vs. separação |
| 3 | Moon-shot SPEC: adicionar "Momento 2" no frontmatter + nota SPEC-007 mudou modelo de Moon | P |
| 4 | approval-hierarchy + drive-readonly: marcar Momento 2 + pre-conditions pós-Piloto | P |
| 5 | drive-readonly: incorporar REST-08 v2 (Drive restrito ao Drive interno da Suno) | P |
| 6 | workflow-builder-canvas: promover status rascunho → em-revisao | P |
| 8 | SRD parte2-domain-model.md: adicionar DO-55 a DO-59 | M |
| 9 | knowledge-biblioteca-v2: adicionar upstream: BRs no frontmatter | P |

---

## Próximo passo natural

Os pontos P (pequenos) podem ser atacados em sequência rápida numa sessão de cleanup:
- Pontos 3, 4, 5, 6, 9: todos são edições simples de frontmatter/seção em arquivos existentes
- Ponto 1: renumeração dos 4 large SPECs conflitantes (20 arquivos)
- Ponto 8: SRD domain model (DOs 55-59)
- Ponto 2: alinhamento de ADRs — o mais complexo, separar para sessão própria

Após o cleanup estrutural, a próxima SPEC natural é **SPEC-016 para FA-16 (Captura Seletiva de Reuniões)** — FRs FR-190 a FR-195 já escritos.

---

## Aprendizados / pegadinhas

- **`ux-redesign` é large SPEC** (não medium como imaginado) — tem 1160 linhas e 26 componentes. Estava escondido em `docs/specs/large/ux-redesign/spec.md` (não tem constitution.md, só spec.md). Precisará dos outros 4 artefatos quando for atacado.
- **SPEC-005 triple conflict**: workflow-builder-canvas (large, canônico) conflita com api-remediation (medium) E com ux-redesign (large). O cleanup do Ponto 1 resolve os 3.
- **Skill tool bloqueado em don't-ask mode**: usado workaround — leitura direta do `SKILL.md` e execução manual do workflow large da sdd-koro skill.
- **22 tasks é a granularidade certa para FA-15**: não é micro-tasks (≤2h cada) nem macro-tasks. Cada task = 1 sessão de codificação de agente.
