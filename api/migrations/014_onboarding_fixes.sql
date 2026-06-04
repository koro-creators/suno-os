-- 014_onboarding_fixes.sql — Ajustes de schema do onboarding (A-8)
--
-- entity_hitl_events.user_id era UUID NOT NULL, mas o código grava Firebase UID
-- (string, ex.: "system"). Mesmo problema do users(id) corrigido no 005.
-- Convertido para TEXT. Tabela vazia em prod → conversão segura.

ALTER TABLE entity_hitl_events
  ALTER COLUMN user_id TYPE TEXT USING user_id::text;
