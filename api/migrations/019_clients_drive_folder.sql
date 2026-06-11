-- 019 — Drive da Suno: pasta configurada por cliente (recorte da SPEC-006).
-- A service account do Cloud Run lê a pasta compartilhada (Leitor); sem OAuth,
-- sem tokens armazenados. Docs sincronizados caem em knowledge_documents com
-- scope=[slug do cliente].
-- Idempotente: dupla passada segura.

ALTER TABLE clients ADD COLUMN IF NOT EXISTS drive_folder_id TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS drive_folder_name TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS drive_last_sync TIMESTAMPTZ;
