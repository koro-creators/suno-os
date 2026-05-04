#!/usr/bin/env bash
#
# SPEC-005 — Workflow Builder Canvas (FR-WBC-01, ADR-LOCAL-05).
# Lazy-load enforcement: `reactflow`/`dagre` may only be imported from
#   • components/workflows/canvas/**
#   • app/workflows/[workflowId]/page.tsx (entry; must use next/dynamic)
#
# Static imports outside that scope explode the bundle on every other route
# (NFR-WBC-02 cap is +30KB). This script greps the codebase for static imports
# of those modules anywhere else and exits non-zero with a clear message.
#
# Run manually: `bash scripts/check-canvas-imports.sh`
# Wired into CI (see scripts/bundle-audit.sh).
#
# Notes:
#   • Dynamic imports (`await import('reactflow')`) and `next/dynamic` calls
#     are NOT flagged — the whole point of those is to keep the heavy chunk
#     out of unrelated bundles.
#   • The rule of record is `eslint-rules/no-reactflow-outside-canvas.js`,
#     kept as an installable ESLint plugin scaffold + self-test fixture.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

FORBIDDEN_PATTERN="^[[:space:]]*import[[:space:]].*from[[:space:]]+['\"](reactflow|@xyflow/react|dagre|@dagrejs/dagre)['\"]"

# Search all .ts/.tsx files outside the allowed scope.
matches=$(
  grep -REn --include='*.ts' --include='*.tsx' \
    --exclude-dir=node_modules \
    --exclude-dir=.next \
    --exclude-dir=eslint-rules \
    --exclude-dir=out \
    "$FORBIDDEN_PATTERN" \
    app components hooks lib contexts 2>/dev/null \
  | grep -v -E '^components/workflows/canvas/' \
  | grep -v -E '^app/workflows/\[workflowId\]/page\.tsx:' \
  || true
)

if [ -n "$matches" ]; then
  echo "❌ Static imports of reactflow/dagre detected outside the canvas module:"
  echo
  echo "$matches"
  echo
  echo "These libraries must be lazy-loaded via next/dynamic. See SPEC-005"
  echo "constitution §5.1 and eslint-rules/no-reactflow-outside-canvas.js."
  exit 1
fi

echo "✅ canvas-imports check passed (0 forbidden static imports)"
