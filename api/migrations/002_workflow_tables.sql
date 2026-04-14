-- SPEC-003: Workflow Builder tables
-- Run against PostgreSQL (Cloud SQL shared instance)

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------
-- workflows — stores workflow definitions
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflows (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(255) NOT NULL,
    description     TEXT,
    created_by      VARCHAR(255) NOT NULL,
    definition      JSONB NOT NULL,
    schedule_cron   VARCHAR(100),
    schedule_timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
    schedule_enabled BOOLEAN DEFAULT FALSE,
    client_scope    TEXT[],
    default_model   VARCHAR(50) DEFAULT 'gemini-flash',
    max_execution_time INTEGER DEFAULT 300,
    on_error_notify VARCHAR(255),
    is_template     BOOLEAN DEFAULT FALSE,
    status          VARCHAR(20) DEFAULT 'draft',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflows_status ON workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_created_by ON workflows(created_by);
CREATE INDEX IF NOT EXISTS idx_workflows_is_template ON workflows(is_template);

-- ---------------------------------------------------------------
-- workflow_runs — execution history
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_runs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id     UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    status          VARCHAR(20) NOT NULL DEFAULT 'pending',
    trigger         VARCHAR(20) NOT NULL DEFAULT 'manual',
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ,
    error           TEXT,
    steps_output    JSONB DEFAULT '{}',
    checkpoint_data JSONB,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow_id ON workflow_runs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_status ON workflow_runs(status);
CREATE INDEX IF NOT EXISTS idx_workflow_runs_created_at ON workflow_runs(created_at DESC);

-- ---------------------------------------------------------------
-- step_logs — per-step execution logs
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS step_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    run_id          UUID NOT NULL REFERENCES workflow_runs(id) ON DELETE CASCADE,
    step_id         VARCHAR(100) NOT NULL,
    step_name       VARCHAR(255),
    status          VARCHAR(20) NOT NULL,
    input           JSONB,
    output          JSONB,
    error           TEXT,
    duration_ms     INTEGER,
    started_at      TIMESTAMPTZ,
    completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_step_logs_run_id ON step_logs(run_id);
CREATE INDEX IF NOT EXISTS idx_step_logs_step_id ON step_logs(step_id);
