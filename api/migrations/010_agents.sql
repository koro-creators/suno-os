-- SPEC-021 FA-17 — Agentes de IA
-- Phase 22 (Fase A+B) — tabelas base do domínio Agentes

-- 1. Tabela principal: agents
CREATE TABLE IF NOT EXISTS agents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          VARCHAR(120) NOT NULL,
  icon          VARCHAR(100) NOT NULL DEFAULT '🤖',
  instructions  TEXT NOT NULL DEFAULT '',
  status        VARCHAR(20)  NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','active','inactive','archived')),
  created_by    UUID,  -- REFERENCES users(id) quando tabela users existir
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agents_status     ON agents(status);
CREATE INDEX IF NOT EXISTS idx_agents_created_by ON agents(created_by);

-- 2. Permissões por cliente
CREATE TABLE IF NOT EXISTS agent_client_permissions (
  agent_id    UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  client_id   UUID NOT NULL,  -- FK lógica (clients não tem tabela DB ainda)
  granted_by  UUID,           -- REFERENCES users(id) quando disponível
  granted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (agent_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_perms_client ON agent_client_permissions(client_id);

-- 3. Skills associadas
CREATE TABLE IF NOT EXISTS agent_skill_assignments (
  agent_id    UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  skill_slug  VARCHAR(80) NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (agent_id, skill_slug)
);

-- 4. App connections
CREATE TABLE IF NOT EXISTS agent_app_connections (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id     UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  app_type     VARCHAR(50) NOT NULL,
  config       JSONB NOT NULL DEFAULT '{}',  -- segredos cifrados; nunca retornar ao frontend
  enabled      BOOLEAN NOT NULL DEFAULT true,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agent_id, app_type)
);

-- 5. Memory files
CREATE TABLE IF NOT EXISTS agent_memory_files (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id     UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  filename     VARCHAR(255) NOT NULL,
  content_type VARCHAR(100) NOT NULL,
  gcs_path     TEXT NOT NULL UNIQUE,
  size_bytes   INT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_memory_files_agent ON agent_memory_files(agent_id);

-- 6. Schedules
CREATE TABLE IF NOT EXISTS agent_schedules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE UNIQUE,
  frequency     VARCHAR(20) NOT NULL CHECK (frequency IN ('hourly','daily')),
  days_of_week  INT[] DEFAULT NULL,
  time_of_day   TIME DEFAULT NULL,
  minute_offset INT DEFAULT 0,
  timezone      VARCHAR(50) NOT NULL DEFAULT 'America/Sao_Paulo',
  enabled       BOOLEAN NOT NULL DEFAULT false,
  last_run_at   TIMESTAMPTZ,
  next_run_at   TIMESTAMPTZ
);

-- 7. Agent runs (histórico imutável — sem DELETE de produto)
CREATE TABLE IF NOT EXISTS agent_runs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id         UUID NOT NULL REFERENCES agents(id),
  client_id        UUID,
  triggered_by     VARCHAR(20) NOT NULL CHECK (triggered_by IN ('manual','schedule')),
  status           VARCHAR(20) NOT NULL DEFAULT 'pending'
                       CHECK (status IN ('pending','running','completed','failed','timed_out')),
  input            JSONB NOT NULL DEFAULT '{}',
  output           JSONB,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at      TIMESTAMPTZ,
  duration_ms      INT,
  error_message    TEXT,
  scheduled_run_at TIMESTAMPTZ
);

-- Idempotência de schedule (constitution §1.5)
CREATE UNIQUE INDEX IF NOT EXISTS idx_agent_runs_schedule_idem
  ON agent_runs(agent_id, scheduled_run_at)
  WHERE triggered_by = 'schedule';

CREATE INDEX IF NOT EXISTS idx_agent_runs_agent  ON agent_runs(agent_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_runs_status ON agent_runs(status);

-- 8. Preview runs (TTL 1h — efêmeros, não produto)
CREATE TABLE IF NOT EXISTS preview_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id      UUID NOT NULL REFERENCES agents(id),
  status        VARCHAR(20) NOT NULL DEFAULT 'pending',
  input         JSONB NOT NULL DEFAULT '{}',
  output        JSONB,
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '1 hour')
);

CREATE INDEX IF NOT EXISTS idx_preview_runs_agent   ON preview_runs(agent_id);
CREATE INDEX IF NOT EXISTS idx_preview_runs_expires ON preview_runs(expires_at);
-- Cleanup: DELETE FROM preview_runs WHERE expires_at < now()
