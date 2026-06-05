-- 015_agents_portable.sql — Ajustes para persistência de Agents (A-5). Idempotente.
--
-- 1) agent_runs.triggered_by: incluir 'preview' (sandbox) no CHECK.
-- 2) agent_schedules: tornar days_of_week (INT[]) e time_of_day (TIME) portáveis
--    (JSONB / VARCHAR) para o mesmo model rodar em Postgres e SQLite (testes).
--    Conversões guardadas por tipo atual → seguras para re-run.

ALTER TABLE agent_runs DROP CONSTRAINT IF EXISTS agent_runs_triggered_by_check;
ALTER TABLE agent_runs
  ADD CONSTRAINT agent_runs_triggered_by_check
  CHECK (triggered_by IN ('manual', 'schedule', 'preview'));

DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
        WHERE table_name = 'agent_schedules' AND column_name = 'days_of_week') = 'ARRAY' THEN
    ALTER TABLE agent_schedules
      ALTER COLUMN days_of_week TYPE JSONB USING to_jsonb(days_of_week);
  END IF;
END $$;

DO $$
BEGIN
  IF (SELECT data_type FROM information_schema.columns
        WHERE table_name = 'agent_schedules' AND column_name = 'time_of_day')
     = 'time without time zone' THEN
    ALTER TABLE agent_schedules
      ALTER COLUMN time_of_day TYPE VARCHAR(5) USING to_char(time_of_day, 'HH24:MI');
  END IF;
END $$;
