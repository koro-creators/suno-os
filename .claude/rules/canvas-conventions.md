# Canvas Conventions — SPEC-005

Padrões críticos para qualquer mudança em `components/workflows/canvas/**`, `app/workflows/[workflowId]/page.tsx`, ou hooks correlatos. Decorrem da SPEC-005 (Workflow Builder Canvas).

## Lazy-load enforcement (ADR-LOCAL-05)

`@xyflow/react` (~50KB gz) e `dagre` (~80KB gz) só podem ser importados de:

1. `components/workflows/canvas/**` — o módulo do canvas
2. `app/workflows/[workflowId]/page.tsx` — entry point que usa `next/dynamic({ ssr: false })`

Em qualquer outro arquivo, **erro de lint** (regra `eslint-rules/no-reactflow-outside-canvas.js`). Confirmação em CI via `bash scripts/check-canvas-imports.sh`.

Por quê: o bundle dessas libs vazaria para todas as rotas, violando NFR-WBC-02 (rotas não-canvas devem ter delta ≤30KB).

## Mock-mode degradation

Frontend deve funcionar com OU sem `NEXT_PUBLIC_API_URL`. Padrão estabelecido:

```typescript
import { apiAvailable } from '@/lib/api';

async function persistEdges(edges: Edge[]) {
  if (!apiAvailable()) {
    // mock-mode: salva em localStorage keyed por workflowId
    localStorage.setItem(`sunos-edges-v2-${workflowId}`, JSON.stringify(edges));
    return;
  }
  await setWorkflowEdges(workflowId, edges); // real-mode: persiste server
}
```

Operações que precisam de fallback local: validation (cair pra findings locais), auto-layout (cair pra dagre frontend), edges (localStorage em mock-mode, API em real-mode).

## Handle vocabulary (paridade backend ↔ frontend)

Source handles permitidos por step type:

| step_type | source handles |
|-----------|----------------|
| `tool` | `out` |
| `llm` | `out`, `error` |
| `action` | `out`, `error` |
| `workflow` | `out`, `error` |
| `condition` | `then`, `else` |
| `hitl` | `approved`, `rejected`, `modified` |
| `merge` | `out` |

Target handles: sempre `in`, exceto `condition` e `llm` (exceções abaixo).

**`tool` sem target handle.** Tool é fonte de dados pura — sem entrada, conecta sua saída `out` aos handles de tool do agente LLM (`tool_0/1/2`).

**`llm` target handles:**

| target handle | posição | alimenta |
|---------------|---------|----------|
| `in` | esquerda | ativa/habilita o bloco (controle de fluxo) |
| `tool_0` | base | saída da ferramenta 1 |
| `tool_1` | base | saída da ferramenta 2 |
| `tool_2` | base | saída da ferramenta 3 |

Regra de fan-in para `llm`: até 4 edges de entrada, todos handles distintos, pertencentes ao conjunto `{in, tool_0, tool_1, tool_2}`. Handles duplicados = finding `fan_in_without_merge`.

### `condition` target handles

| target handle | alimenta |
|----------------|----------|
| `in_a` | CAMPO (lado esquerdo da comparação, `actual`) |
| `in_b` | VALOR (lado direito da comparação, `value`) |
| `in` | legado — tratado como `in_a` (migração v1→v2) |

Ambos opcionais. Se não conectado, CAMPO/VALOR seguem o fallback (texto digitado no drawer, ou `output` do step anterior). Se conectado, o `output` do step ligado em `in_a`/`in_b` é usado — a menos que o campo no drawer esteja preenchido (texto digitado tem prioridade).

`fan_in_without_merge` permite `condition` com in-degree 2 **somente** se os 2 handles forem `in_a` + `in_b` (distintos); in-degree 1 é livre; in-degree > 2, ou 2 edges no mesmo handle, ainda é finding. Lógica em `api/workflows/validator.py:_is_dual_condition_input` ↔ `useGraphValidation.ts`.

Resolução de `actual`/`value` por edge específica vive em `api/workflows/compiler.py:_make_step_node` (`input_sources` param, calculado em `_compile_v2_with_edges` como `condition_inputs`).

`success` foi removido — `out` é universal. Migration v1→v2 converte `next_step → out` sem special-case por tipo.

A **mesma matriz** vive em `api/workflows/validator.py:ALLOWED_SOURCE_HANDLES_BY_TYPE` (Python) e `components/workflows/canvas/hooks/useGraphValidation.ts` (TypeScript). Mudanças na regra exigem editar **ambos os lados** para manter paridade. Target handles por tipo: `api/workflows/edges.py:ALLOWED_TARGET_HANDLES_BY_TYPE`.

## NodeShell pattern

Os 7 node types compartilham `components/workflows/canvas/nodes/NodeShell.tsx` (chrome: card + handles + ARIA + focus ring). Cada node concreto fica responsável só de:

- Cor (border + accent)
- Ícone (`@carbon/icons-react`, `size={14}`, sem `strokeWidth`)
- Lista de `sourceHandles` (matrix acima) e, se não for o `in` padrão, `targetHandles` (hoje só `ConditionNode` usa — `in_a`/`in_b`)
- Preview text (1 linha, truncado)

Adicionar um novo node type: copiar `ToolNode.tsx` (~35 linhas), trocar essas 4 coisas. Não duplicar chrome.

## Auto-save race-safety

`hooks/useWorkflowAutoSave.ts` usa `useRef` para `latest` payload. Ao resolver um save, compara com `latest.current` — se o user editou mid-save, dispara save adicional automaticamente. Resolve I6 da revisão crítica da SPEC-005.

**Não regredir para padrão `useEffect`-based** que perde edits durante save in-flight.

## ESLint custom rule (instalação opcional)

`eslint-rules/no-reactflow-outside-canvas.js` é um plugin standalone com `RuleTester` self-tests embutido. Não está plugado no `next lint` hoje (ESLint 8 + Next 14 não expõem `--rulesdir`). Enforcement primário é via `scripts/check-canvas-imports.sh`. Se time decidir adotar `eslint-plugin-local-rules`, o plugin já está pronto-para-instalar.

## Bundle audit baseline

`bundle-baseline.json` é populado em **Fase E TASK-E05** após `npm run build` real. Hoje está vazio (script tolera). Quando popular: `bash scripts/bundle-audit.sh --baseline` + commit.

## Verificações antes de push tocando o canvas

```bash
npx tsc --noEmit && \
  bash scripts/check-canvas-imports.sh && \
  npx --no-install next lint
```

Atalho: `/project:check-canvas` (executa os 3 + bundle audit em sequência).

## Pendências documentadas

- TASK-C18 Vitest unit tests (nodes individuais + hooks) — ~1 dia
- Bundle baseline real (Fase E)
- axe-core E2E (Fase E)
- Server-driven `WorkflowDetailResponseV2` quando DB persistence chegar (hoje lê de WorkflowsContext mock)
- Migrate-v2 retornar shape completo (hoje retorna só counts; frontend faz segundo GET)
