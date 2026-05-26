-- Phase 11: Conversation Persistence — add messages JSONB column + client_id FK + indexes
-- Adds inline message storage to conversations table and multi-tenant client_id column.

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS
    messages JSONB NOT NULL DEFAULT '[]';

ALTER TABLE conversations ADD COLUMN IF NOT EXISTS
    client_id UUID REFERENCES clients(id);

CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_client ON conversations(client_id);
