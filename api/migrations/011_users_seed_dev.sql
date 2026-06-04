-- 011_users_seed_dev.sql — Seed OPCIONAL de dev/demo (SPEC-022 Fase B)
--
-- ⚠️  NÃO RODAR EM PRODUÇÃO. Estes são os 3 usuários que existiam como mock
--     in-memory na Fase A, reaproveitados só para dar dados a um ambiente
--     local/demo. Em produção, popular via /api/admin/users/sync (Firebase).
--
-- Idempotente: ON CONFLICT DO NOTHING não sobrescreve dados reais.

INSERT INTO users (uid, email, name, role, is_active, last_access, created_at)
VALUES
  ('uid-1', 'heitor@suno.com.br', 'Heitor Miranda', 'admin',   TRUE,  '2026-05-26T14:00:00Z', '2026-01-10T09:00:00Z'),
  ('uid-2', 'ana@suno.com.br',    'Ana Silva',      'creator', TRUE,  '2026-05-25T10:30:00Z', '2026-02-14T11:00:00Z'),
  ('uid-3', 'carlos@suno.com.br', 'Carlos Melo',    'viewer',  FALSE, '2026-05-10T08:00:00Z', '2026-03-01T09:00:00Z')
ON CONFLICT (uid) DO NOTHING;
