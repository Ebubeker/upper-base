-- ============================================================================
-- UPPER BASE DISCOVERY FEATURE MIGRATION
-- Run this script in your Supabase SQL Editor to add Discovery features
-- ============================================================================

-- Add new columns to communities table
ALTER TABLE communities
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general'
  CHECK (category IN ('general', 'education', 'technology', 'business', 'health', 'creative', 'sports', 'gaming', 'lifestyle', 'other')),
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS custom_module_names JSONB DEFAULT '{}'::jsonb;

-- Update existing communities to have default values (optional - only if you have existing data)
UPDATE communities
SET
  category = 'general' WHERE category IS NULL,
  is_public = FALSE WHERE is_public IS NULL,
  custom_module_names = '{}'::jsonb WHERE custom_module_names IS NULL;

-- ============================================================================
-- UPDATE COMMUNITIES RLS POLICIES
-- ============================================================================

-- Drop old policy
DROP POLICY IF EXISTS "Users can view their own communities" ON communities;

-- Create new policy for public communities
CREATE POLICY "Users can view public communities"
  ON communities FOR SELECT
  USING (
    is_public = true
    OR auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM community_members
      WHERE community_members.community_id = communities.id
      AND community_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- UPDATE COMMUNITY_MEMBERS RLS POLICIES
-- ============================================================================

-- Drop old policy
DROP POLICY IF EXISTS "Users can view members of their communities" ON community_members;

-- Create new policies
CREATE POLICY "Users can view members of communities they belong to"
  ON community_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_members.community_id
      AND (
        communities.owner_id = auth.uid()
        OR communities.is_public = true
        OR EXISTS (
          SELECT 1 FROM community_members cm
          WHERE cm.community_id = communities.id
          AND cm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can join public communities"
  ON community_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_members.community_id
      AND communities.is_public = true
    )
  );

CREATE POLICY "Users can leave communities"
  ON community_members FOR DELETE
  USING (
    user_id = auth.uid()
    AND role = 'member'
  );

-- ============================================================================
-- UPDATE COMMUNITY_MODULES RLS POLICIES
-- ============================================================================

-- Drop old policy
DROP POLICY IF EXISTS "Users can view modules of their communities" ON community_modules;

-- Create new policy for members
CREATE POLICY "Members can view modules of their communities"
  ON community_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = community_modules.community_id
      AND (
        communities.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM community_members
          WHERE community_members.community_id = community_modules.community_id
          AND community_members.user_id = auth.uid()
        )
      )
    )
  );

-- ============================================================================
-- UPDATE NOTES RLS POLICIES
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view notes in their communities" ON notes;
DROP POLICY IF EXISTS "Users can create notes in their communities" ON notes;

-- Create new policies for members
CREATE POLICY "Members can view notes in their communities"
  ON notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = notes.community_id
      AND (
        communities.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM community_members
          WHERE community_members.community_id = notes.community_id
          AND community_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Members can create notes in their communities"
  ON notes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = notes.community_id
      AND (
        communities.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM community_members
          WHERE community_members.community_id = notes.community_id
          AND community_members.user_id = auth.uid()
        )
      )
    )
    AND user_id = auth.uid()
  );

-- ============================================================================
-- UPDATE TASKS RLS POLICIES
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view tasks in their communities" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks in their communities" ON tasks;

-- Create new policies for members
CREATE POLICY "Members can view tasks in their communities"
  ON tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = tasks.community_id
      AND (
        communities.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM community_members
          WHERE community_members.community_id = tasks.community_id
          AND community_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Members can create tasks in their communities"
  ON tasks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = tasks.community_id
      AND (
        communities.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM community_members
          WHERE community_members.community_id = tasks.community_id
          AND community_members.user_id = auth.uid()
        )
      )
    )
    AND user_id = auth.uid()
  );

-- ============================================================================
-- UPDATE CHAT_MESSAGES RLS POLICIES
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can view messages in their communities" ON chat_messages;
DROP POLICY IF EXISTS "Users can create messages in their communities" ON chat_messages;

-- Create new policies for members
CREATE POLICY "Members can view messages in their communities"
  ON chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = chat_messages.community_id
      AND (
        communities.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM community_members
          WHERE community_members.community_id = chat_messages.community_id
          AND community_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Members can create messages in their communities"
  ON chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM communities
      WHERE communities.id = chat_messages.community_id
      AND (
        communities.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM community_members
          WHERE community_members.community_id = chat_messages.community_id
          AND community_members.user_id = auth.uid()
        )
      )
    )
    AND user_id = auth.uid()
  );

-- ============================================================================
-- ADD MEMBER COUNT MANAGEMENT FUNCTIONS
-- ============================================================================

-- Function to increment member count
CREATE OR REPLACE FUNCTION increment_member_count(community_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE communities
  SET member_count = member_count + 1
  WHERE id = community_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement member count
CREATE OR REPLACE FUNCTION decrement_member_count(community_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE communities
  SET member_count = GREATEST(member_count - 1, 0)
  WHERE id = community_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- VERIFICATION QUERIES (optional - comment out after running)
-- ============================================================================

-- Verify new columns exist
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'communities'
-- AND column_name IN ('category', 'is_public', 'custom_module_names');

-- Verify policies exist
-- SELECT policyname FROM pg_policies WHERE tablename = 'communities';
-- SELECT policyname FROM pg_policies WHERE tablename = 'community_members';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
