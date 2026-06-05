-- 017_skill_defaults.sql — Defaults de modelo por skill (Bucket B). Idempotente.
--
-- Migra o store in-memory `_skill_defaults` (admin/router.py) para o banco.
-- Seed dos 3 defaults reais (config, não mock).

CREATE TABLE IF NOT EXISTS skill_defaults (
  skill_slug   VARCHAR(100) PRIMARY KEY,
  skill_name   VARCHAR(200) NOT NULL,
  model        VARCHAR(50)  NOT NULL,
  temperature  REAL         NOT NULL DEFAULT 0.7,
  max_tokens   INTEGER      NOT NULL DEFAULT 2048,
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

INSERT INTO skill_defaults (skill_slug, skill_name, model, temperature, max_tokens)
VALUES
  ('copy-social',    'Copy Social',    'gemini-2.5-flash', 0.7, 2048),
  ('plano-de-midia', 'Plano de Mídia', 'gemini-2.5-flash', 0.3, 4096),
  ('briefing',       'Briefing',       'gpt-4o',           0.5, 2048)
ON CONFLICT (skill_slug) DO NOTHING;
