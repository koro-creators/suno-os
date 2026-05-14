#!/usr/bin/env bash
#
# SPEC-005 — Workflow Builder Canvas (NFR-WBC-02, ADR-LOCAL-05).
#
# Bundle audit: ensures non-canvas routes do not gain more than 30KB after a
# code change. Strategy: compare per-route gzipped size of `next build` output
# against the baseline in bundle-baseline.json (committed). Routes whose path
# starts with /workflows/[workflowId] are exempt because they intentionally
# pull in reactflow + dagre.
#
# Steps:
#   1. Run `next build`.
#   2. Parse the per-route output sizes from .next/build-manifest.json + the
#      file sizes inside .next/static/.
#   3. Compare to bundle-baseline.json (run `--baseline` to refresh).
#   4. Fail if any non-canvas route delta > 30KB.
#
# Bootstrap (first run after Phase A merge):
#   bash scripts/bundle-audit.sh --baseline
#
# CI usage (PRs):
#   bash scripts/bundle-audit.sh
#
# Phase A delivers the script + an empty baseline. Phase E populates the real
# baseline (TASK-E05).

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BASELINE_FILE="$ROOT/bundle-baseline.json"
BUDGET_KB=30
MODE="check"

while [ $# -gt 0 ]; do
  case "$1" in
    --baseline) MODE="baseline"; shift ;;
    --budget=*) BUDGET_KB="${1#--budget=}"; shift ;;
    *) echo "Unknown argument: $1"; exit 2 ;;
  esac
done

if ! command -v node >/dev/null 2>&1; then
  echo "node is required (next build)"; exit 2
fi

echo "== bundle-audit ($MODE, budget=${BUDGET_KB}KB) =="

# Ensure imports are clean before running an expensive build.
bash "$ROOT/scripts/check-canvas-imports.sh"

# 1. Build.
if [ ! -d "$ROOT/.next" ] || [ "${SKIP_BUILD:-0}" != "1" ]; then
  echo "→ next build"
  npx --no-install next build > /tmp/next-build.log 2>&1 || {
    echo "next build failed; see /tmp/next-build.log"; tail -40 /tmp/next-build.log; exit 1;
  }
fi

# 2. Compute current sizes from .next/build-manifest.json.
node "$ROOT/scripts/bundle-audit-compute.js" > /tmp/bundle-sizes.json

if [ "$MODE" = "baseline" ]; then
  cp /tmp/bundle-sizes.json "$BASELINE_FILE"
  echo "✅ baseline written to $BASELINE_FILE"
  exit 0
fi

if [ ! -f "$BASELINE_FILE" ]; then
  echo "⚠️  No baseline at $BASELINE_FILE — run with --baseline once to bootstrap."
  exit 0
fi

# 3. Diff baseline vs current.
node - <<'NODE'
const fs = require('fs');
const cur = JSON.parse(fs.readFileSync('/tmp/bundle-sizes.json', 'utf8'));
const base = JSON.parse(fs.readFileSync(process.env.BASELINE_FILE, 'utf8'));
const budget = Number(process.env.BUDGET_KB) * 1024;

let failed = false;
for (const [route, curSize] of Object.entries(cur.routes || {})) {
  if (route.startsWith('/workflows/[workflowId]')) continue; // exempt — canvas
  const baseSize = (base.routes || {})[route] ?? 0;
  const delta = curSize - baseSize;
  if (delta > budget) {
    console.error(`❌ ${route}: +${(delta / 1024).toFixed(1)}KB (budget ${budget / 1024}KB)`);
    failed = true;
  }
}
if (failed) {
  process.exit(1);
}
console.log('✅ bundle-audit passed (no non-canvas route exceeded budget)');
NODE
