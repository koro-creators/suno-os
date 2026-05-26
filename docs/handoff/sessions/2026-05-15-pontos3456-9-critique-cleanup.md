# Handoff — 2026-05-15 — Pontos 3, 4, 5, 6, 9 do Critique SDD (Cleanup Estrutural)

**Duração aproximada:** ~30min
**Foco:** Cleanup estrutural dos pontos pequenos/médios do critique SDD — todos os pontos P restantes.

---

## O que foi feito

### Ponto 3 — Moon-shot SPEC: marcar Momento 2 + nota SPEC-007

- Adicionado `fase: Momento 2` ao frontmatter de todos os 5 artefatos (constitution, spec, design, plan, tasks)
- Banner com notas já existia em `constitution.md`; adicionado também em spec, design, plan, tasks
- Fix bônus: título da constitution dizia `(SPEC-004)` → corrigido para `(SPEC-010)` (spec-id correto)

### Ponto 4a — approval-hierarchy: Momento 2 + pre-conditions pós-Piloto

- Todos os 5 artefatos **já tinham** `fase: Momento 2` no frontmatter — nenhuma mudança necessária ✓

### Ponto 4b — drive-readonly-curation: Momento 2

- Adicionado `fase: Momento 2` ao frontmatter de todos os 5 artefatos (constitution, spec, design, plan, tasks)

### Ponto 5 — drive-readonly: incorporar REST-08 v2

- `constitution.md` já tinha o banner REST-08 v2 em linha 40
- `spec.md`: adicionado banner `> ⚠️ REST-08 v2` após frontmatter
- `spec.md`: atualizado "O quê" — `Google Drive de cada cliente da Suno` → `Google Drive interno da Suno (/sunos-shared/)`
- Nota: design.md, plan.md, tasks.md ainda podem ter referências a "Drive de cliente" que precisam revisão na implementação (marcado na constitution com "Atualizar todos os contratos desta SPEC")

### Ponto 6 — workflow-builder-canvas: promover status rascunho → em-revisao

- Todos os 5 artefatos **já estavam** com `status: em-revisao` — nenhuma mudança necessária ✓

### Ponto 9 — knowledge-biblioteca-v2: adicionar upstream BRs

- `constitution.md` já tinha o bloco `upstream:` completo ✓
- `spec.md`: adicionado bloco `upstream:` com BRs (BR-004..015), RNs, FA-01, SRD references

---

## Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `docs/specs/large/moon-shot/constitution.md` | +`fase: Momento 2`, fix título SPEC-004→SPEC-010 |
| `docs/specs/large/moon-shot/spec.md` | +`fase: Momento 2`, +banner SPEC-007/Momento 2 |
| `docs/specs/large/moon-shot/design.md` | +`fase: Momento 2`, +banner |
| `docs/specs/large/moon-shot/plan.md` | +`fase: Momento 2`, +banner |
| `docs/specs/large/moon-shot/tasks.md` | +`fase: Momento 2`, +banner |
| `docs/specs/large/drive-readonly-curation/constitution.md` | +`fase: Momento 2` |
| `docs/specs/large/drive-readonly-curation/spec.md` | +`fase: Momento 2`, +banner REST-08 v2, update "O quê" |
| `docs/specs/large/drive-readonly-curation/design.md` | +`fase: Momento 2` |
| `docs/specs/large/drive-readonly-curation/plan.md` | +`fase: Momento 2` |
| `docs/specs/large/drive-readonly-curation/tasks.md` | +`fase: Momento 2` |
| `docs/specs/large/knowledge-biblioteca-v2/spec.md` | +`upstream:` block com BRs |

---

## Estado final do critique SDD (todos os pontos)

| Ponto | Descrição | Status |
|-------|-----------|--------|
| 1 | Renumerar large SPECs conflitantes (image-editor→8, video-gen→9, moon-shot→10, ux-redesign→11) | ⏳ Pendente (M) |
| 2 | Alinhar SRD parte7-ADRs.md com BRD | ✅ Concluído (2026-05-15) |
| 3 | Moon-shot: Momento 2 + nota SPEC-007 | ✅ Concluído nesta sessão |
| 4 | approval-hierarchy + drive-readonly: Momento 2 | ✅ Concluído nesta sessão |
| 5 | drive-readonly: incorporar REST-08 v2 | ✅ Concluído nesta sessão |
| 6 | workflow-builder-canvas: status → em-revisao | ✅ Já estava feito |
| 8 | SRD domain model: DO-56 a DO-60 | ✅ Concluído (sessão anterior) |
| 9 | knowledge-biblioteca-v2: upstream BRs | ✅ Concluído nesta sessão |

**Único ponto ainda pendente:** Ponto 1 — renumeração dos 4 large SPECs conflitantes (20 arquivos, ~M).

---

## Próximo passo natural

O critique SDD está **praticamente encerrado** — apenas o Ponto 1 (renumeração) resta:
- image-editor → SPEC-008
- video-generation → SPEC-009
- moon-shot → SPEC-010 (já tem spec-id correto no frontmatter; o conflito era de numeração canônica)
- ux-redesign → SPEC-011

Após isso, próxima iniciativa natural: **SPEC-015 Fase A** (Foundation Backend do Onboarding com Oráculo — migration SQL, models, router stubs) ou **SPEC-016 Fase A** (Foundation Backend da Captura de Reuniões).
