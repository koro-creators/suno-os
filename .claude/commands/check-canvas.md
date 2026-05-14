---
description: Run all canvas-related guards — TypeScript, ESLint, lazy-load enforcement, bundle audit.
allowed-tools: Bash, Read
---

# /project:check-canvas

Roda em sequência todos os guards do canvas SPEC-005 — TypeScript types, ESLint, enforcement de lazy-load, bundle audit.

## O que valida

1. **`npx tsc --noEmit`** — type-check completo. Falha em qualquer erro.
2. **`next lint`** — ESLint do Next 14. Falha em erros (warnings pré-existentes em Sidebar.tsx tolerados).
3. **`bash scripts/check-canvas-imports.sh`** — `reactflow`, `@xyflow/react`, `dagre`, `@dagrejs/dagre` só podem ser importados de `components/workflows/canvas/**` ou `app/workflows/[workflowId]/page.tsx`. ADR-LOCAL-05 da SPEC-005.
4. **`bash scripts/bundle-audit.sh`** — compara per-rota gzipped sizes vs `bundle-baseline.json`. Falha se delta em rota não-canvas excede 30KB. NFR-WBC-02.

## Execução

```bash
npx tsc --noEmit && \
  npx --no-install next lint && \
  bash scripts/check-canvas-imports.sh && \
  bash scripts/bundle-audit.sh
```

## Falhas comuns

| Erro | Causa | Fix |
|------|-------|-----|
| `import { ReactFlow } from '@xyflow/react'` em `app/page.tsx` | dev importou estaticamente fora do canvas | mover para dynamic import via `next/dynamic({ ssr: false })`, ou levar componente para dentro de `components/workflows/canvas/**` |
| Bundle delta > 30KB em rota não-canvas | tree-shaking falhou ou import vazou | rodar canvas-imports check primeiro; se zero violations, investigar via `next build --profile` |
| `bundle-baseline.json` vazio | primeira execução | rodar `bash scripts/bundle-audit.sh --baseline` para popular (Fase E TASK-E05) |

## Quando rodar

- Antes de qualquer push tocando `components/workflows/canvas/**`, `lib/api.ts`, `app/workflows/**`
- Em PR review se mudou `package.json` ou adicionou imports novos
- No CI (após Fase E baseline) — gate de merge
