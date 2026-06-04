-- SPEC-015 FA-15: Create clients table for onboarding
-- Migration 011 — migration 005 (onboarding_wiki) ALTER TABLE assumes this exists.
-- Safe: uses IF NOT EXISTS throughout.

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(200) NOT NULL,
  color VARCHAR(20) NOT NULL DEFAULT '#FFC801',
  description TEXT NOT NULL DEFAULT '',
  sponsor_name VARCHAR(200) NOT NULL DEFAULT '',
  sponsor_email VARCHAR(200) NOT NULL DEFAULT '',
  oracle_config JSONB NOT NULL DEFAULT '{}',
  selected_doc_ids JSONB NOT NULL DEFAULT '[]',
  status VARCHAR(20) NOT NULL DEFAULT 'PRE_ACTIVE',
  pre_active_since TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT clients_status_check
    CHECK (status IN ('DRAFT', 'PRE_ACTIVE', 'ACTIVE', 'ARCHIVED', 'CANCELLED'))
);

CREATE INDEX IF NOT EXISTS idx_clients_slug ON clients(slug);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);

-- Re-run 005 column additions idempotently (IF NOT EXISTS guarantees no-op)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pre_active_since TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS oracle_config JSONB;

-- Fix wiki_entities.updated_by: migration 005 referenced users(id) UUID FK
-- which does not exist. Replace with TEXT (Firebase UID).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wiki_entities' AND column_name = 'updated_by'
  ) THEN
    ALTER TABLE wiki_entities ALTER COLUMN updated_by TYPE TEXT USING updated_by::TEXT;
  ELSE
    ALTER TABLE wiki_entities ADD COLUMN updated_by TEXT;
  END IF;
END $$;

-- Add entities JSONB column to onboarding_jobs (stores per-entity status map)
ALTER TABLE onboarding_jobs ADD COLUMN IF NOT EXISTS
  entities JSONB NOT NULL DEFAULT '{}';
ALTER TABLE onboarding_jobs ADD COLUMN IF NOT EXISTS
  total_entities INTEGER NOT NULL DEFAULT 6;
