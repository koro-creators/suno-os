-- SPEC-005 Phase A — Workflow Builder Canvas v2
-- TASK-A01: workflow_edges table + workflows.updated_by + position_x/y + merge_policy
--
-- IMPORTANT: This repo uses plain SQL migrations (not Alembic). Steps are stored
-- in workflows.definition JSONB (not a normalized workflow_steps table). Therefore:
--   * workflow_edges references workflows(id) for cascade
--   * source_step_id/target_step_id are VARCHAR(100) matching JSONB step IDs (not UUID FKs)
--   * position_x/position_y/merge_policy live INSIDE definition.steps[].* JSONB,
--     not as SQL columns. Application-side validation enforces shape.
--
-- Run against PostgreSQL (Cloud SQL shared instance).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------
-- workflows: add updated_by (FR-WBC-13 — banner de edição concorrente)
-- ---------------------------------------------------------------
ALTER TABLE workflows
    ADD COLUMN IF NOT EXISTS updated_by VARCHAR(255);

-- Comment: updated_by is VARCHAR matching workflows.created_by convention
-- (no users table FK in current schema). When auth tables land, migrate to UUID FK.

-- ---------------------------------------------------------------
-- workflow_edges: edges between steps (NOVO em SPEC-005)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow_edges (
    edge_id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id    UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    source_step_id VARCHAR(100) NOT NULL,
    source_handle  VARCHAR(20) NOT NULL,
    target_step_id VARCHAR(100) NOT NULL,
    target_handle  VARCHAR(20) NOT NULL DEFAULT 'in',
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_source_handle
        CHECK (source_handle IN ('out', 'error', 'then', 'else', 'approved', 'rejected', 'modified')),
    CONSTRAINT chk_target_handle
        CHECK (target_handle IN ('in')),
    CONSTRAINT uq_workflow_edge
        UNIQUE (workflow_id, source_step_id, source_handle, target_step_id, target_handle)
);

CREATE INDEX IF NOT EXISTS idx_we_workflow ON workflow_edges(workflow_id);
CREATE INDEX IF NOT EXISTS idx_we_source ON workflow_edges(source_step_id);
CREATE INDEX IF NOT EXISTS idx_we_target ON workflow_edges(target_step_id);

-- ---------------------------------------------------------------
-- Note on JSONB-side fields (no DDL needed; validated app-side)
-- ---------------------------------------------------------------
-- definition.steps[].position_x INT (default 0)
-- definition.steps[].position_y INT (default 0)
-- definition.steps[].merge_policy VARCHAR ('all'|'any'|null)
-- definition.metadata.canvas_v2_migrated BOOLEAN (default false)
--
-- App-side invariants (api/workflows/validator.py — Phase B):
--   * merge_policy NOT NULL only when step.type='merge'
--   * merge_policy IN ('all','any') when step.type='merge'
--
-- ---------------------------------------------------------------
-- Down migration (manual; run in reverse order)
-- ---------------------------------------------------------------
-- DROP INDEX IF EXISTS idx_we_target;
-- DROP INDEX IF EXISTS idx_we_source;
-- DROP INDEX IF EXISTS idx_we_workflow;
-- DROP TABLE IF EXISTS workflow_edges;
-- ALTER TABLE workflows DROP COLUMN IF EXISTS updated_by;
