-- 016_workflows_portable.sql — Portabilidade de workflows.client_scope (A-4). Idempotente.
--
-- workflows.client_scope era TEXT[] (002). O model usa JSON (mesmo model em
-- Postgres + SQLite). Converte TEXT[] → JSONB. Tabela vazia em prod → seguro.
-- Conversão guardada por tipo atual → segura para re-run.

DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
        WHERE table_name = 'workflows' AND column_name = 'client_scope') = 'ARRAY' THEN
    ALTER TABLE workflows
      ALTER COLUMN client_scope TYPE JSONB USING to_jsonb(client_scope);
  END IF;
END $$;
