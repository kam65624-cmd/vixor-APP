-- ============================================================================
-- Vixor Migration: Copilot Chat Persistence
-- ============================================================================
-- Adds copilot_conversations and copilot_messages tables for persisting
-- AI copilot chat history with multi-agent support.
-- ============================================================================

-- 1. Copilot Conversations Table
CREATE TABLE IF NOT EXISTS copilot_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat',
  agent_id TEXT DEFAULT 'auto', -- auto, market_analyst, risk_manager, news_analyst, strategy_builder
  is_consensus BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Copilot Messages Table
CREATE TABLE IF NOT EXISTS copilot_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES copilot_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  agent_id TEXT, -- which agent responded (for assistant messages)
  metadata JSONB DEFAULT '{}', -- store consensus data, handoff info, etc.
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Row Level Security
ALTER TABLE copilot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- Conversations: users can view own
  CREATE POLICY "Users can view own conversations" ON copilot_conversations FOR SELECT USING (auth.uid() = user_id);
  -- Conversations: users can insert own
  CREATE POLICY "Users can insert own conversations" ON copilot_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
  -- Conversations: users can update own
  CREATE POLICY "Users can update own conversations" ON copilot_conversations FOR UPDATE USING (auth.uid() = user_id);
  -- Conversations: users can delete own
  CREATE POLICY "Users can delete own conversations" ON copilot_conversations FOR DELETE USING (auth.uid() = user_id);

  -- Messages: users can view own (via conversation ownership)
  CREATE POLICY "Users can view own messages" ON copilot_messages FOR SELECT USING (
    conversation_id IN (SELECT id FROM copilot_conversations WHERE user_id = auth.uid())
  );
  -- Messages: users can insert own
  CREATE POLICY "Users can insert own messages" ON copilot_messages FOR INSERT WITH CHECK (
    conversation_id IN (SELECT id FROM copilot_conversations WHERE user_id = auth.uid())
  );
  -- Messages: users can delete own
  CREATE POLICY "Users can delete own messages" ON copilot_messages FOR DELETE USING (
    conversation_id IN (SELECT id FROM copilot_conversations WHERE user_id = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_copilot_conversations_user ON copilot_conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_copilot_messages_conversation ON copilot_messages(conversation_id, created_at ASC);

-- 5. Triggers
DROP TRIGGER IF EXISTS copilot_conversations_updated_at ON copilot_conversations;
CREATE TRIGGER copilot_conversations_updated_at
  BEFORE UPDATE ON copilot_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. Auto-update conversation title based on first user message
CREATE OR REPLACE FUNCTION auto_title_conversation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'user' AND OLD IS NULL THEN
    UPDATE copilot_conversations 
    SET title = LEFT(NEW.content, 50), updated_at = now()
    WHERE id = NEW.conversation_id AND title = 'New Chat';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS copilot_messages_auto_title ON copilot_messages;
CREATE TRIGGER copilot_messages_auto_title
  AFTER INSERT ON copilot_messages
  FOR EACH ROW EXECUTE FUNCTION auto_title_conversation();
