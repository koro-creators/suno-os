-- 012_clients_extend.sql — Colunas de negócio do cliente + seed dos clientes reais
--
-- A tabela clients (000_base + 005_onboarding) tinha só o núcleo. O fluxo de
-- onboarding (onboarding/service.py) usa campos adicionais que agora viram
-- colunas dedicadas (decisão SPEC-022 Fase B / A-1). Idempotente.

ALTER TABLE clients ADD COLUMN IF NOT EXISTS color VARCHAR(20);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS sponsor_name VARCHAR(200);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS sponsor_email VARCHAR(254);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS selected_doc_ids JSONB DEFAULT '[]';

-- ---------------------------------------------------------------------------
-- Seed dos clientes REAIS (não é mock de dev). Espelha data/clients.ts, que
-- segue sendo o source do sistema solar no frontend. Idempotente por slug.
-- ---------------------------------------------------------------------------
INSERT INTO clients (name, slug, color, status)
VALUES
  ('Vivo',       'vivo',       '#8B5CF6', 'ACTIVE'),
  ('Americanas', 'americanas', '#F97316', 'ACTIVE'),
  ('Sicredi',    'sicredi',    '#22C55E', 'ACTIVE'),
  ('Samsung',    'samsung',    '#1428A0', 'ACTIVE')
ON CONFLICT (slug) DO NOTHING;
