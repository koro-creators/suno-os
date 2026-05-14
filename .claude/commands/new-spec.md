---
description: Start a new SDD spec (small/medium/large) via the sdd-koro skill, with sunOS conventions pre-loaded.
allowed-tools: Skill, Read, Glob, Bash
---

# /project:new-spec

Inicia uma nova spec SDD para sunOS. Argumento opcional: `small|medium|large` (default: deixa a skill classificar).

## Antes de começar

Se for **large**, lembre-se:
- Cinco artefatos vivem em `docs/specs/large/<slug>/`: `constitution.md`, `spec.md`, `design.md`, `plan.md`, `tasks.md`
- O frontmatter `escopo:` (projeto/stack/autor/papel/branch/contexto) é o padrão deste repo (ver SPEC-001/004/005/006)
- `<!-- REVIEW: ... -->` markers vão **inline** no ponto natural de revisão, não no fim
- Decisões scoped à SPEC viram `ADR-LOCAL-NN`, não polui o catálogo principal de ADRs (`docs/srd/parte7-ADRs.md`)

Se for **medium**, output é um único arquivo em `docs/specs/medium/<slug>.spec.md`.

## Constraints obrigatórias para qualquer SPEC sunOS

1. **Vocabulário Suno** (BRD parte2 §1+§9): nunca "gerar"/"otimizar"/"eficiência"; sempre Koro com K, Drive com D
2. **Caixa-preta** (RN-009/011): Operacional NUNCA vê Biblioteca / system_prompts / dados de outro cliente. Endpoints respondem **404 genérico**, nunca 403 (não revelar existência). Detalhes em `.claude/rules/caixa-preta.md`.
3. **Cross-client guard** (RN-010): toda query filtra `client_id` do JWT/contexto
4. **Pre-conditions externas** (sponsor alignment, ADR pendente, contrato assinado): documentar como `pre_conditions:` no frontmatter da `constitution.md` e replicar como `⚠️ BLOQUEADA POR PRE-XX` em headers de fase no `plan.md` + `tasks.md` (pattern aplicado em SPEC-006)

## Padrão de tasks atomicas

Cada task em `tasks.md` carrega: **Escopo**, **Arquivos** (criar/modificar), **Vínculos** (FR/RN/ADR/CA), **Estimativa** (P/M/G/GG), **Depende de**. Ao final, sempre incluir backward-mapping: `Mapa CA ↔ Tasks` e `Mapa Tasks ↔ FR/NFR/ADR-LOCAL` (pattern em SPEC-005/006).

## Invocação

Invoque a skill `sdd-koro` passando o slug + tamanho como argumento. A skill cuida do resto.

> sdd-koro: gerar SPEC `<slug>` ($ARGUMENTS).
