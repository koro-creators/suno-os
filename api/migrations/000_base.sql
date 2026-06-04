-- 000_base.sql — Tabelas-base que as demais migrações assumem existir.
--
-- Autorada retroativamente (SPEC-022 Fase B). Estas três tabelas nunca tiveram
-- migração própria:
--   - clients         → era mock no frontend (data/clients.ts); o backend só a
--                       referenciava via FK client_id.
--   - conversations   → existia apenas como model SQLAlchemy (models/conversation.py)
--   - chat_messages   → idem
--
-- Como o banco de produção estava vazio (nenhuma migração nunca aplicada),
-- materializamos o schema-base aqui, ANTES de 001+. Idempotente (IF NOT EXISTS).

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Clientes (multi-tenant). `id` é o alvo das FKs client_id das demais tabelas.
-- Colunas adicionais (status, oracle_config, pre_active_since) são acrescentadas
-- por 005_onboarding_wiki.sql via ALTER ... ADD COLUMN IF NOT EXISTS.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS clients (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(200) NOT NULL,
  slug        VARCHAR(120) UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Conversas de chat (espelha models/conversation.py).
-- 004_add_messages_to_conversations.sql adiciona `messages` JSONB e `client_id`;
-- aqui ficam só as colunas-base. PK é VARCHAR (uuid em string, como na ORM).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
  id              VARCHAR PRIMARY KEY,
  user_id         VARCHAR NOT NULL,
  skill_slug      VARCHAR,
  title           VARCHAR,
  state           JSONB,
  created_at      TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id              VARCHAR PRIMARY KEY,
  conversation_id VARCHAR NOT NULL REFERENCES conversations(id),
  role            VARCHAR NOT NULL,
  content         TEXT NOT NULL,
  agent_name      VARCHAR,
  response_data   JSONB,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_base ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation ON chat_messages(conversation_id);
