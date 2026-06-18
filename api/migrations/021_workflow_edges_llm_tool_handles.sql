-- 021 — LLM tool-input handles (tool_0/1/2)
-- SPEC-005: LLM nodes aceitam até 3 tool-output edges via handles tool_0, tool_1, tool_2.
-- A migration 020 só adicionou in_a/in_b (condition). Amplia aqui para o vocabulário
-- completo. Validação de qual step_type pode usar cada handle fica em
-- api/workflows/edges.py:ALLOWED_TARGET_HANDLES_BY_TYPE.

ALTER TABLE workflow_edges
    DROP CONSTRAINT IF EXISTS chk_target_handle;

ALTER TABLE workflow_edges
    ADD CONSTRAINT chk_target_handle
        CHECK (target_handle IN ('in', 'in_a', 'in_b', 'tool_0', 'tool_1', 'tool_2'));

-- ---------------------------------------------------------------
-- Down migration (manual)
-- ---------------------------------------------------------------
-- ALTER TABLE workflow_edges DROP CONSTRAINT IF EXISTS chk_target_handle;
-- ALTER TABLE workflow_edges ADD CONSTRAINT chk_target_handle
--     CHECK (target_handle IN ('in', 'in_a', 'in_b'));
