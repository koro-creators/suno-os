/**
 * SPEC-005 — bundle-audit helper.
 *
 * Reads `.next/build-manifest.json` and computes per-route gzipped JS size by
 * summing the file sizes of each route's chunk list (chunks live in
 * `.next/static/chunks/`). Output is JSON written to stdout in the shape:
 *
 *   { "routes": { "/workflows/[workflowId]": 123456, "/": 45678, ... } }
 *
 * No external deps; uses node stdlib only. Gzip estimation uses zlib for
 * accuracy without pulling in webpack-bundle-analyzer.
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = process.cwd();
const manifestPath = path.join(root, '.next', 'build-manifest.json');
const staticDir = path.join(root, '.next', 'static');

if (!fs.existsSync(manifestPath)) {
  console.error('build-manifest.json missing — run `next build` first.');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

function gzippedSize(file) {
  if (!fs.existsSync(file)) return 0;
  const raw = fs.readFileSync(file);
  return zlib.gzipSync(raw, { level: 9 }).length;
}

function sumChunks(chunks) {
  return chunks
    .filter((c) => c.endsWith('.js'))
    .reduce((acc, c) => {
      const abs = path.join(root, '.next', c);
      return acc + gzippedSize(abs);
    }, 0);
}

const routes = {};
for (const [route, chunks] of Object.entries(manifest.pages || {})) {
  routes[route] = sumChunks(chunks);
}

process.stdout.write(JSON.stringify({ routes }, null, 2));
