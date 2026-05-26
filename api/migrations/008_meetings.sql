-- Migration 008: Meetings (Reunioes) — SPEC-016 Phase 21
-- Creates tables for meeting captures and curation segments.
--
-- Design principles (SPEC-016 constitution):
--   - client_id denormalized in both tables for cross-client guard (RN-010)
--   - transcript stored as TEXT (Gemini Meet stub; GCS integration is Phase D)
--   - audio_gcs_path nullable — populated when GCS upload lands in Phase D
--   - HITL mandatory: segment.selected=true only signals readiness for review,
--     Wiki merge requires explicit Lider approval (never auto-merged)

-- -----------------------------------------------------------------------
-- meetings
-- -----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS meetings (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        VARCHAR(255) NOT NULL,
  title            VARCHAR(255) NOT NULL,
  meet_link        TEXT,
  transcript       TEXT         NOT NULL DEFAULT '',
  audio_gcs_path   TEXT,                        -- gs://sunos-meeting-captures-{env}/... (Phase D)
  status           VARCHAR(20)  NOT NULL DEFAULT 'pending_review',
                                                -- pending_review | curated | archived
  duration_minutes INTEGER,
  participants     JSONB,                       -- string[] of names/emails
  created_by       VARCHAR(255) NOT NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meetings_client_id ON meetings(client_id);
CREATE INDEX IF NOT EXISTS idx_meetings_status    ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meetings_client_status ON meetings(client_id, status);

-- -----------------------------------------------------------------------
-- meeting_segments
-- -----------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS meeting_segments (
  id            UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  meeting_id    UUID         NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  client_id     VARCHAR(255) NOT NULL,           -- denormalized for cross-client guard
  text          TEXT         NOT NULL,
  start_time    VARCHAR(10),                     -- HH:MM:SS offset in recording
  selected      BOOLEAN      NOT NULL DEFAULT FALSE,
  context_note  TEXT         DEFAULT '',
  curated_by    VARCHAR(255),
  curated_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meeting_segments_meeting_id ON meeting_segments(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_segments_client_id  ON meeting_segments(client_id);

-- -----------------------------------------------------------------------
-- updated_at trigger for meetings
-- -----------------------------------------------------------------------

CREATE OR REPLACE FUNCTION meetings_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_meetings_updated_at ON meetings;
CREATE TRIGGER trg_meetings_updated_at
  BEFORE UPDATE ON meetings
  FOR EACH ROW EXECUTE FUNCTION meetings_set_updated_at();
