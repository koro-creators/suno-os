-- 013_notifications.sql — Sistema de notificações (B-4)
--
-- Notificações criadas internamente por Aprovação/Reuniões e listadas/marcadas
-- pelo destinatário. Caixa-preta: acesso filtrado por user_id. Idempotente.

CREATE TABLE IF NOT EXISTS notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       VARCHAR(255) NOT NULL,
  type          VARCHAR(50) NOT NULL,
  title         VARCHAR(255) NOT NULL,
  body          TEXT NOT NULL,
  submission_id VARCHAR(255),
  read          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
