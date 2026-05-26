-- SPEC-004 / FA-13: Aprovação Hierárquica — Phase 20
-- ENT-36 (approval_submissions) + ENT-37 (approval_events)
-- Run against PostgreSQL (Cloud SQL shared instance)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE subject_type_enum AS ENUM ('spark', 'turn', 'workflow_output');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE approval_status_enum AS ENUM (
        'PENDING_VALIDATION',
        'PENDING_APPROVAL',
        'CHANGES_REQUESTED',
        'APPROVED',
        'REJECTED',
        'EXPIRED'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE urgency_enum AS ENUM ('low', 'normal', 'high');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE event_action_enum AS ENUM (
        'SUBMITTED',
        'RESUBMITTED',
        'APPROVE',
        'REQUEST_CHANGES',
        'REJECT'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------
-- approval_submissions (ENT-36 simplificado)
-- -----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS approval_submissions (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id               VARCHAR(255) NOT NULL,
    client_name             VARCHAR(255) NOT NULL,
    skill_slug              VARCHAR(100) NOT NULL,
    skill_name              VARCHAR(255) NOT NULL,
    subject_type            subject_type_enum NOT NULL,
    subject_id              VARCHAR(255) NOT NULL,
    -- content é o subject_snapshot — imutável após INSERT (trigger abaixo)
    content                 TEXT NOT NULL,
    status                  approval_status_enum NOT NULL DEFAULT 'PENDING_VALIDATION',
    urgency                 urgency_enum NOT NULL DEFAULT 'normal',
    submitted_by            VARCHAR(255) NOT NULL,
    submitted_by_name       VARCHAR(255) NOT NULL,
    assigned_approver       VARCHAR(255),
    comment                 TEXT,
    round                   INTEGER NOT NULL DEFAULT 1,
    -- ADR-LOCAL-04: flag para quando chain está quebrado
    requires_admin_attention BOOLEAN NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de query crítica (§2.4 do design.md)
CREATE INDEX IF NOT EXISTS idx_as_inbox
    ON approval_submissions(client_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_as_submitter
    ON approval_submissions(submitted_by, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_as_client_status
    ON approval_submissions(client_id, status);

-- -----------------------------------------------------------------------
-- Trigger: content (subject_snapshot) é imutável após INSERT
-- Referência: constitution §1.6 / DO-43 invariante 4 / design.md §2.2
-- -----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION approval_submissions_snapshot_immutable()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.content IS DISTINCT FROM OLD.content THEN
        RAISE EXCEPTION 'approval_submissions.content is immutable (DO-43 invariant 4 — SPEC-004)';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS approval_submissions_snapshot_lock ON approval_submissions;
CREATE TRIGGER approval_submissions_snapshot_lock
    BEFORE UPDATE ON approval_submissions
    FOR EACH ROW
    EXECUTE FUNCTION approval_submissions_snapshot_immutable();

-- -----------------------------------------------------------------------
-- approval_events (ENT-37 simplificado — append-only)
-- -----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS approval_events (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    submission_id   UUID NOT NULL REFERENCES approval_submissions(id) ON DELETE CASCADE,
    action          event_action_enum NOT NULL,
    comment         TEXT,
    user_id         VARCHAR(255) NOT NULL,
    user_name       VARCHAR(255) NOT NULL,
    timestamp       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ae_submission
    ON approval_events(submission_id, timestamp ASC);

CREATE INDEX IF NOT EXISTS idx_ae_user
    ON approval_events(user_id, timestamp DESC);

-- -----------------------------------------------------------------------
-- Trigger: approval_events é imutável após INSERT (RN-024 / constitution §1.2)
-- -----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION approval_events_immutable()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP IN ('UPDATE', 'DELETE') THEN
        RAISE EXCEPTION 'approval_events is immutable (RN-024 — SPEC-004)';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS approval_events_no_modify ON approval_events;
CREATE TRIGGER approval_events_no_modify
    AFTER UPDATE OR DELETE ON approval_events
    FOR EACH ROW
    EXECUTE FUNCTION approval_events_immutable();
