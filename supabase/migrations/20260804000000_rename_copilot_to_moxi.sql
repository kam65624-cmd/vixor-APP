-- ============================================================================
-- Rename copilot_* tables to moxi_* and update all references
-- ============================================================================
-- This migration renames the legacy copilot_conversations and copilot_messages
-- tables to moxi_conversations and moxi_messages respectively.
-- It also updates all dependent objects: indexes, triggers, functions, policies.
-- ============================================================================

-- 1. Rename tables
ALTER TABLE IF EXISTS copilot_conversations RENAME TO moxi_conversations;
ALTER TABLE IF EXISTS copilot_messages RENAME TO moxi_messages;

-- 2. Rename indexes
ALTER INDEX IF EXISTS idx_copilot_conversations_user RENAME TO idx_moxi_conversations_user;
ALTER INDEX IF EXISTS idx_copilot_messages_conversation RENAME TO idx_moxi_messages_conversation;

-- 3. Rename triggers
ALTER TRIGGER IF EXISTS copilot_conversations_updated_at ON moxi_conversations RENAME TO moxi_conversations_updated_at;
ALTER TRIGGER IF EXISTS copilot_messages_auto_title ON moxi_messages RENAME TO moxi_messages_auto_title;

-- 4. Update the auto-title function (references old table name in SQL body)
CREATE OR REPLACE FUNCTION auto_title_conversation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'user' AND OLD IS NULL THEN
    UPDATE moxi_conversations
    SET title = LEFT(NEW.content, 50), updated_at = now()
    WHERE id = NEW.conversation_id AND title = 'New Chat';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Update RLS policies (must DROP + recreate since they reference old table names)
DO $$ BEGIN
  -- Conversations policies
  DROP POLICY IF EXISTS "Users can view own conversations" ON moxi_conversations;
  CREATE POLICY "Users can view own conversations" ON moxi_conversations FOR SELECT USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "Users can insert own conversations" ON moxi_conversations;
  CREATE POLICY "Users can insert own conversations" ON moxi_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "Users can update own conversations" ON moxi_conversations;
  CREATE POLICY "Users can update own conversations" ON moxi_conversations FOR UPDATE USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "Users can delete own conversations" ON moxi_conversations;
  CREATE POLICY "Users can delete own conversations" ON moxi_conversations FOR DELETE USING (auth.uid() = user_id);

  -- Messages policies
  DROP POLICY IF EXISTS "Users can view own messages" ON moxi_messages;
  CREATE POLICY "Users can view own messages" ON moxi_messages FOR SELECT USING (
    conversation_id IN (SELECT id FROM moxi_conversations WHERE user_id = auth.uid())
  );
  DROP POLICY IF EXISTS "Users can insert own messages" ON moxi_messages;
  CREATE POLICY "Users can insert own messages" ON moxi_messages FOR INSERT WITH CHECK (
    conversation_id IN (SELECT id FROM moxi_conversations WHERE user_id = auth.uid())
  );
  DROP POLICY IF EXISTS "Users can delete own messages" ON moxi_messages;
  CREATE POLICY "Users can delete own messages" ON moxi_messages FOR DELETE USING (
    conversation_id IN (SELECT id FROM moxi_conversations WHERE user_id = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
