CREATE TABLE IF NOT EXISTS platform_settings (
  key           VARCHAR(100) PRIMARY KEY,
  value_encrypted TEXT NOT NULL,
  updated_by    TEXT NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_uid     TEXT NOT NULL,
  actor_email   VARCHAR(200),
  action        VARCHAR(80) NOT NULL,
  resource_type VARCHAR(50),
  resource_id   TEXT,
  detail        JSONB DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_events_actor   ON audit_events(actor_uid);
CREATE INDEX IF NOT EXISTS idx_audit_events_action  ON audit_events(action);
CREATE INDEX IF NOT EXISTS idx_audit_events_created ON audit_events(created_at DESC);
-- Sem UPDATE/DELETE — append-only enforced via policy de segurança no DB
