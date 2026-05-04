---
description: Create an end-of-session handoff doc following the CLAUDE.md "Session Handoffs" convention.
allowed-tools: Bash, Write, Read
---

# /project:handoff

Cria handoff de fim de sessão seguindo a convenção em `CLAUDE.md` § "Session Handoffs". Argumento: slug curto descrevendo o foco da sessão (ex: `spec-006-fase-c`, `vuln-cleanup`, `canvas-bundle-baseline`).

## Quando criar

- Sessão tocou múltiplos artefatos (BRD/PRD/SRD/UX/specs/código) ou tomou decisões arquiteturais
- Há trabalho pendente que não cabe num único TODO
- Houve correções de rumo ou debates importantes que valem ser registrados

## Quando NÃO precisa

- Bug fix simples (commit + PR description já contam)
- Refactor pequeno encerrado e mergeado na mesma sessão
- Pergunta-resposta sem mudança de arquivo

## Estrutura

Caminho: `docs/handoff/sessions/YYYY-MM-DD-<slug>.md`

Seções (ver exemplos recentes em `docs/handoff/sessions/2026-04-30-spec-005-fase-{a,b,c}.md`):

1. **Header** — duração aproximada + foco em 1-2 linhas
2. **O que foi feito** — agrupado por área/módulo, com refs a arquivos:linha quando relevante
3. **Decisões tomadas** — tabela `Decisão | Onde | Racional`
4. **Arquivos modificados** — lista por área (backend/frontend/docs)
5. **Verificação executada** — checklist do que rodou (tsc, lint, audit, scripts)
6. **Pendências** — não abertas como TODO; coisas para próxima sessão
7. **Próximo passo natural** — 1-2 frases por onde retomar
8. **Aprendizados / pegadinhas** — coisas não óbvias descobertas
9. **Estatísticas** (opcional) — linhas, tests, tempo

## Pre-flight

Antes de escrever, rodar:
- `git log --oneline <range>` — descobrir commits da sessão
- `git status` — confirmar working tree limpo (ou explicar pendência)
- `git diff --stat <range>` — números reais de linhas/arquivos

Se houver follow-up agendável (sunset 30d, métrica a checar), oferecer `/schedule` ao final do handoff.
