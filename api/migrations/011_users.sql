-- 011_users.sql — User access registry (SPEC-022 Fase B)
--
-- Persists the user / RBAC-role table that Fase A mantinha apenas in-memory
-- (admin/router.py:_users). A partir daqui a "parte de acesso" é fonte de
-- verdade no Postgres — sem fallback mockado.
--
-- `uid` guarda o Firebase UID (Firebase é o dono do registro de identidade);
-- não há FK porque a auth vive fora do Postgres, mas esta linha é a fonte de
-- verdade do papel (role) + status ativo dentro do sunOS.
--
-- População em produção: via POST /api/admin/users/sync (Firebase Auth) ou
-- convite (POST /api/admin/users/invite). NÃO semear usuários fake aqui —
-- ver 011_users_seed_dev.sql para um seed opcional de dev/demo.

CREATE TABLE IF NOT EXISTS users (
  uid          TEXT PRIMARY KEY,
  email        VARCHAR(254) NOT NULL,
  name         VARCHAR(200),
  role         VARCHAR(20) NOT NULL DEFAULT 'viewer'
                 CHECK (role IN ('admin', 'creator', 'viewer')),
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  last_access  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
