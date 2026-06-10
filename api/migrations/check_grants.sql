-- Auditoria de privilégios do role `sunos` (app) sobre as tabelas de prod.
-- Tabela criada pelo `jose` sem GRANT → app dá 500 mascarado como CORS.
-- Uso: psql "$DBURL" -f check_grants.sql
\echo === Tabelas e privilegios do role sunos ===
SELECT
  t.tablename,
  has_table_privilege('sunos', format('public.%I', t.tablename), 'SELECT') AS sel,
  has_table_privilege('sunos', format('public.%I', t.tablename), 'INSERT') AS ins,
  has_table_privilege('sunos', format('public.%I', t.tablename), 'UPDATE') AS upd,
  has_table_privilege('sunos', format('public.%I', t.tablename), 'DELETE') AS del
FROM pg_tables t
WHERE t.schemaname = 'public'
ORDER BY t.tablename;

\echo === Sequences sem USAGE para sunos ===
SELECT s.sequencename
FROM pg_sequences s
WHERE s.schemaname = 'public'
  AND NOT has_sequence_privilege('sunos', format('public.%I', s.sequencename), 'USAGE');

\echo === Total de tabelas ===
SELECT count(*) AS total_tabelas FROM pg_tables WHERE schemaname = 'public';
