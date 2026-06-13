-- SPEC-005 (pós) — condition com 2 entradas nomeadas (in_a/in_b)
-- TASK: amplia chk_target_handle para permitir in_a (CAMPO) e in_b (VALOR)
-- alem do default 'in'. Ver .claude/rules/canvas-conventions.md.
--
-- Validacao de QUAL step_type pode usar in_a/in_b fica a cargo da app
-- (api/workflows/edges.py:ALLOWED_TARGET_HANDLES_BY_TYPE); a constraint do
-- banco so garante o vocabulario geral de handles.

ALTER TABLE workflow_edges
    DROP CONSTRAINT IF EXISTS chk_target_handle;

ALTER TABLE workflow_edges
    ADD CONSTRAINT chk_target_handle
        CHECK (target_handle IN ('in', 'in_a', 'in_b'));

-- ---------------------------------------------------------------
-- Down migration (manual; run in reverse order)
-- ---------------------------------------------------------------
-- ALTER TABLE workflow_edges DROP CONSTRAINT IF EXISTS chk_target_handle;
-- ALTER TABLE workflow_edges ADD CONSTRAINT chk_target_handle CHECK (target_handle IN ('in'));
