#!/usr/bin/env bash
# infra/migrate.sh — run DB migrations against Cloud SQL
# Usage: DATABASE_URL="postgresql+asyncpg://..." bash infra/migrate.sh
# Or via Cloud Build step before deploy.

set -euo pipefail

: "${DATABASE_URL:?Set DATABASE_URL to the Cloud SQL connection string}"

cd "$(dirname "$0")/../api"

echo "▶ Running database migrations..."
# Alembic (if configured) — or plain psql scripts in migrations/
if command -v alembic &>/dev/null; then
  alembic upgrade head
else
  echo "  Alembic not found. Applying raw SQL migrations..."
  for f in migrations/*.sql; do
    echo "  Applying: $f"
    # Strip asyncpg:// → standard psycopg2 URL for psql
    PSQL_URL="${DATABASE_URL/postgresql+asyncpg/postgresql}"
    psql "${PSQL_URL}" -f "$f"
  done
fi

echo "▶ Migrations complete."
