-- SPEC-015: Onboarding com Oráculo do Cliente — Wiki Entities + HITL Audit
-- Migration 005 (follows 004_add_messages_to_conversations.sql)
-- design.md §2.1

-- ---------------------------------------------------------------------------
-- Extend clients table (non-destructive — ADD COLUMN IF NOT EXISTS)
-- ---------------------------------------------------------------------------

ALTER TABLE clients ADD COLUMN IF NOT EXISTS
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';

ALTER TABLE clients ADD COLUMN IF NOT EXISTS
  oracle_config JSONB;

ALTER TABLE clients ADD COLUMN IF NOT EXISTS
  pre_active_since TIMESTAMPTZ;

-- ---------------------------------------------------------------------------
-- Ontological entities (Wiki)
-- design.md §2.1: UNIQUE(client_id, entity_type) enforces one entity per type
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS wiki_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  entity_type VARCHAR(30) NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  provenance JSONB NOT NULL DEFAULT '[]',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  badge VARCHAR(30) NOT NULL DEFAULT 'seed_auto',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES users(id),
  CONSTRAINT wiki_entities_entity_type_check
    CHECK (entity_type IN ('Posicionamento','Persona','Competidor','Produto','TomDeVoz','Briefing')),
  CONSTRAINT wiki_entities_status_check
    CHECK (status IN ('pending','generated','accepted','regenerating')),
  CONSTRAINT wiki_entities_badge_check
    CHECK (badge IN ('seed_auto','hitl','capture')),
  UNIQUE(client_id, entity_type)
);

CREATE INDEX IF NOT EXISTS idx_wiki_entities_client ON wiki_entities(client_id);

-- ---------------------------------------------------------------------------
-- HITL audit log (append-only — no DELETE, no UPDATE)
-- constitution §2.4: every HITL decision must be audited with diff
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS entity_hitl_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL,
  entity_type VARCHAR(30) NOT NULL,
  action VARCHAR(30) NOT NULL,
  before_content TEXT,
  after_content TEXT,
  user_id UUID NOT NULL,
  timestamp_utc TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT entity_hitl_events_action_check
    CHECK (action IN ('accept','edit_accept','reject_regenerate'))
);

CREATE INDEX IF NOT EXISTS idx_hitl_events_client ON entity_hitl_events(client_id, entity_type);

-- ---------------------------------------------------------------------------
-- Onboarding jobs
-- ADR-LOCAL-02: current_entity allows job resumption after Cloud Run restart
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS onboarding_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  drive_sync_status VARCHAR(20) DEFAULT 'pending',
  oracle_status VARCHAR(20) DEFAULT 'pending',
  current_entity VARCHAR(30),
  entities_done INTEGER DEFAULT 0,
  error_detail TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  eta_hours INTEGER DEFAULT 24,
  CONSTRAINT onboarding_jobs_drive_status_check
    CHECK (drive_sync_status IN ('pending','running','done','error')),
  CONSTRAINT onboarding_jobs_oracle_status_check
    CHECK (oracle_status IN ('pending','running','done','error'))
);
