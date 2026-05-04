/**
 * SPEC-005 — Workflow Builder Canvas (FR-WBC-01, ADR-LOCAL-05).
 *
 * Forbid `import 'reactflow'` and `import 'dagre'` outside the canvas module.
 * Both libraries are heavy (~50KB + ~80KB gz) and must be lazy-loaded only
 * inside `components/workflows/canvas/**` to keep other routes' bundles
 * within budget (NFR-WBC-02 — non-canvas routes must not gain >30KB).
 *
 * Allowed importers:
 *   • components/workflows/canvas/**            (the canvas module itself)
 *   • app/workflows/[workflowId]/page.tsx       (entry point, must use next/dynamic)
 *
 * Anywhere else, this rule errors. The rule lives in `eslint-rules/` and is
 * registered in .eslintrc.json via `rulePaths` + `rules` block.
 */
'use strict';

const path = require('path');

const FORBIDDEN_MODULES = new Set([
  'reactflow',
  '@xyflow/react',
  'dagre',
  '@dagrejs/dagre',
]);

/** Returns true if `filename` is inside `components/workflows/canvas/**`. */
function isInsideCanvasModule(filename) {
  const normalized = filename.replace(/\\/g, '/');
  return normalized.includes('/components/workflows/canvas/');
}

/** Returns true if `filename` is the canvas entry-point page. */
function isCanvasEntryPage(filename) {
  const normalized = filename.replace(/\\/g, '/');
  return /\/app\/workflows\/\[workflowId\]\/page\.tsx$/.test(normalized);
}

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow importing reactflow or dagre outside the workflow canvas module (SPEC-005 ADR-LOCAL-05).',
    },
    schema: [],
    messages: {
      forbidden:
        "'{{module}}' may only be imported from components/workflows/canvas/** or the canvas entry page (app/workflows/[workflowId]/page.tsx). Lazy-load via next/dynamic in non-canvas files. See SPEC-005 constitution §5.1.",
    },
  },
  create(context) {
    const filename = context.getFilename ? context.getFilename() : context.filename;

    function check(node, value) {
      if (!FORBIDDEN_MODULES.has(value)) return;
      if (isInsideCanvasModule(filename)) return;
      if (isCanvasEntryPage(filename)) return;
      context.report({ node, messageId: 'forbidden', data: { module: value } });
    }

    return {
      ImportDeclaration(node) {
        check(node, node.source.value);
      },
      // `import('reactflow')` dynamic imports are fine — they're already lazy.
      // We only flag *static* imports.
      CallExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'require' &&
          node.arguments.length === 1 &&
          node.arguments[0].type === 'Literal'
        ) {
          check(node, node.arguments[0].value);
        }
      },
    };
  },
};

// Self-test fixture (run with `node eslint-rules/no-reactflow-outside-canvas.js`).
if (require.main === module) {
  const { RuleTester } = require('eslint');
  const tester = new RuleTester({ parserOptions: { ecmaVersion: 2022, sourceType: 'module' } });
  tester.run('no-reactflow-outside-canvas', module.exports, {
    valid: [
      {
        filename: path.join(process.cwd(), 'components/workflows/canvas/WorkflowCanvas.tsx'),
        code: "import { ReactFlow } from 'reactflow';",
      },
      {
        filename: path.join(process.cwd(), 'app/workflows/[workflowId]/page.tsx'),
        code: "import dynamic from 'next/dynamic';",
      },
      {
        filename: path.join(process.cwd(), 'components/something-else/Card.tsx'),
        code: "import dynamic from 'next/dynamic';",
      },
      {
        filename: path.join(process.cwd(), 'app/page.tsx'),
        code: "const ReactFlow = await import('reactflow');",
      },
    ],
    invalid: [
      {
        filename: path.join(process.cwd(), 'app/page.tsx'),
        code: "import { ReactFlow } from 'reactflow';",
        errors: [{ messageId: 'forbidden' }],
      },
      {
        filename: path.join(process.cwd(), 'components/biblioteca/Card.tsx'),
        code: "import dagre from 'dagre';",
        errors: [{ messageId: 'forbidden' }],
      },
    ],
  });
  console.log('no-reactflow-outside-canvas: self-tests OK');
}
