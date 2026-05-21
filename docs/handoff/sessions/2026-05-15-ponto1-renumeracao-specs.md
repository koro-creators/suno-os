# Handoff — 2026-05-15 — Ponto 1: Renumeração de Large SPECs Conflitantes

**Duração aproximada:** ~15 min (parte de sessão maior — critique SDD completo)
**Foco:** Corrigir conflito de numeração entre 4 large SPECs que usavam SPEC-008/009 trocados.

---

## O que foi feito

### Diagnóstico

4 large SPECs com numeração conflitante (2 erradas, 2 já corretas):

| SPEC slug | spec-id encontrado | spec-id correto | Ação |
|-----------|-------------------|-----------------|------|
| `image-editor` | SPEC-009 | SPEC-008 | Corrigido |
| `video-generation` | SPEC-008 | SPEC-009 | Corrigido |
| `moon-shot` | SPEC-010 | SPEC-010 | Nenhuma (já correto) |
| `ux-redesign` | SPEC-011 | SPEC-011 | Nenhuma (já correto — só tem spec.md) |

### Correção aplicada

Script `/tmp/patch_point1.py` substituiu `spec-id: SPEC-NNN` (1 ocorrência por arquivo) nos 10 artefatos:

- `docs/specs/large/image-editor/` — 5 artefatos: SPEC-009 → SPEC-008
- `docs/specs/large/video-generation/` — 5 artefatos: SPEC-008 → SPEC-009

Slugs **não foram alterados** — permanecem `image-editor` e `video-generation`.

---

## Arquivos modificados

| Arquivo | Mudança |
|---------|---------|
| `docs/specs/large/image-editor/constitution.md` | spec-id: SPEC-009 → SPEC-008 |
| `docs/specs/large/image-editor/spec.md` | spec-id: SPEC-009 → SPEC-008 |
| `docs/specs/large/image-editor/design.md` | spec-id: SPEC-009 → SPEC-008 |
| `docs/specs/large/image-editor/plan.md` | spec-id: SPEC-009 → SPEC-008 |
| `docs/specs/large/image-editor/tasks.md` | spec-id: SPEC-009 → SPEC-008 |
| `docs/specs/large/video-generation/constitution.md` | spec-id: SPEC-008 → SPEC-009 |
| `docs/specs/large/video-generation/spec.md` | spec-id: SPEC-008 → SPEC-009 |
| `docs/specs/large/video-generation/design.md` | spec-id: SPEC-008 → SPEC-009 |
| `docs/specs/large/video-generation/plan.md` | spec-id: SPEC-008 → SPEC-009 |
| `docs/specs/large/video-generation/tasks.md` | spec-id: SPEC-008 → SPEC-009 |
| `docs/specs/_log/usage-log.md` | +SPEC-008 image-editor, +SPEC-009 video-generation (ambas marcadas como "Renumerado de X em 2026-05-15") |

---

## Estado final do critique SDD (todos os pontos)

| Ponto | Descrição | Status |
|-------|-----------|--------|
| 1 | Renumerar large SPECs conflitantes (image-editor→8, video-gen→9, moon-shot→10, ux-redesign→11) | ✅ **Concluído nesta sessão** |
| 2 | Alinhar SRD parte7-ADRs.md com docs/adr/ | ✅ Concluído (sessão anterior neste dia) |
| 3 | Moon-shot SPEC: adicionar "Momento 2" no frontmatter + nota SPEC-007 | ✅ Concluído (sessão anterior neste dia) |
| 4 | approval-hierarchy + drive-readonly: marcar Momento 2 | ✅ Concluído (sessão anterior neste dia — approval-hierarchy já estava correto) |
| 5 | drive-readonly: incorporar REST-08 v2 (Drive restrito ao Drive interno da Suno) | ✅ Concluído (sessão anterior neste dia) |
| 6 | workflow-builder-canvas: promover status rascunho → em-revisao | ✅ Concluído (sessão anterior neste dia — já estava em-revisao) |
| 8 | SRD parte2-domain-model.md: adicionar DO-55 a DO-59 | ✅ Concluído (sessão anterior — DO-56 a DO-60) |
| 9 | knowledge-biblioteca-v2: adicionar upstream: BRs no frontmatter | ✅ Concluído (sessão anterior neste dia) |
| SPEC-016 | Criar SPEC-016 para FA-16 (Captura Seletiva de Reuniões) | ✅ Concluído (sessão anterior) |

**Todos os pontos do critique SDD estão concluídos.**

---

## Próximo passo natural

O critique SDD está 100% fechado. Próximas ações naturais:

- **SPEC-017 para FA-17** — próxima feature no feature map que ainda não tem SPEC
- **Implementação SPEC-015 Fase A** — Foundation Backend do Onboarding com Oráculo (tarefas TASK-A01..A10)
- **SPEC-010 moon-shot revisão** — o banner SPEC-007 indica que o behavior da spec precisa ser revisado antes de implementar

---

## Aprendizados / pegadinhas

- `image-editor` e `video-generation` tinham os IDs trocados entre si — não eram simplesmente errados, eram "espelhados". O swap simultâneo (SPEC-009→SPEC-008 em um, SPEC-008→SPEC-009 no outro) precisou de cautela para não criar conflito temporário.
- `ux-redesign` só tem 1 artefato (`spec.md`) — é medium disfarçado de large, ou large incompleto. Não foi problema, apenas confirmar que SPEC-011 estava correto.
- O `usage-log.md` não tinha entradas para image-editor e video-generation — adicionadas retroativamente com data 2026-05-15 e nota de renumeração.
