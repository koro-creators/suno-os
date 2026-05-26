-- SPEC-006: Drive Read-Only Curation — Phase 18 scaffolding
-- Creates drive_tokens table for storing OAuth credentials per user.
--
-- Security: access_token / refresh_token stored as plaintext here.
-- TODO(Fase D): add KMS-encrypted columns before production deploy (NFR-008 + INT-14).
--   Migration strategy: add encrypted_ columns, backfill, drop plain columns,
--   rename encrypted_ → plain. Do NOT store plaintext tokens in production.
--
-- user_id is a Firebase UID string — no FK constraint (Firebase owns the user registry).

CREATE TABLE IF NOT EXISTS drive_tokens (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Firebase UID (string, unique per user — one Drive connection per user)
    user_id     TEXT        NOT NULL UNIQUE,

    -- OAuth credentials
    -- TODO(Fase D): replace with KMS-encrypted ciphertext (NFR-008, INT-14)
    access_token   TEXT,
    refresh_token  TEXT,

    -- UTC expiry of the current access_token
    expires_at  TIMESTAMPTZ,

    -- Google account email confirmed during OAuth callback
    email       VARCHAR(254),

    -- Set when the token is revoked (FR-178 exclusion flow); NULL = active
    revoked_at  TIMESTAMPTZ,

    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fast lookup by Firebase UID (most frequent access pattern)
CREATE INDEX IF NOT EXISTS idx_drive_tokens_user_id ON drive_tokens (user_id);

-- Partial index for active (non-revoked) tokens
CREATE INDEX IF NOT EXISTS idx_drive_tokens_active
    ON drive_tokens (user_id)
    WHERE revoked_at IS NULL;

-- Audit trigger: prevent UPDATE/DELETE on rows for the audit-immutability requirement.
-- NOTE: drive_tokens itself is NOT the audit log; updates are allowed here (token refresh).
-- The audit_log_drive table (Fase B+) will be append-only. Placeholder comment for clarity.

COMMENT ON TABLE drive_tokens IS
    'Per-user Google Drive OAuth tokens (SPEC-006 FA-14). '
    'One row per user. Supports revocation (revoked_at). '
    'TODO Fase D: encrypt access_token + refresh_token via Cloud KMS.';
