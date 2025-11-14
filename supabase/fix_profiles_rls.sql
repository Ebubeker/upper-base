-- ============================================================================
-- FIX PROFILES RLS POLICY TO SHOW MEMBER NAMES
-- This migration adds a policy to allow users to view profiles of members
-- in the same communities
-- ============================================================================

-- Add new policy to allow viewing profiles of community members
CREATE POLICY "Users can view profiles of community members"
  ON profiles FOR SELECT
  USING (
    -- Allow viewing own profile
    auth.uid() = id
    OR
    -- Allow viewing profiles of users in the same community
    EXISTS (
      SELECT 1 FROM community_members cm1
      WHERE cm1.user_id = profiles.id
      AND EXISTS (
        SELECT 1 FROM community_members cm2
        WHERE cm2.user_id = auth.uid()
        AND cm2.community_id = cm1.community_id
      )
    )
    OR
    -- Allow viewing profiles of users in communities the viewer owns
    EXISTS (
      SELECT 1 FROM community_members cm
      JOIN communities c ON c.id = cm.community_id
      WHERE cm.user_id = profiles.id
      AND c.owner_id = auth.uid()
    )
  );

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
