-- Migration 025: Remove vestigial 'premium' role from user_profiles
--
-- The 'premium' DB role was introduced in Phase 7 (RBAC) to flag paying users.
-- Phase 11 (Tier Strategy) replaced this with the subscriptions table —
-- Stripe webhooks write to subscriptions, not user_profiles.role.
-- The 'premium' role is now unused and misleading: a Stripe subscriber
-- has role='user' + a subscriptions row, while a manually-promoted
-- 'premium' user has no subscription and gets gated out.
--
-- This migration:
-- 1. Moves any 'premium' users back to 'user' (they retain subscription access)
-- 2. Replaces the CHECK constraint to remove 'premium' as a valid role
-- 3. Updates the has_feature_access() function to remove premium auto-grants
--
-- Run in Supabase SQL Editor.

BEGIN;

-- Step 1: Move existing premium role users to 'user'
-- Their subscription access (if any) comes from the subscriptions table
UPDATE user_profiles
SET role = 'user', updated_at = NOW()
WHERE role = 'premium';

-- Step 2: Drop old CHECK constraint and add new one without 'premium'
ALTER TABLE user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_role_check;

ALTER TABLE user_profiles
  ADD CONSTRAINT user_profiles_role_check
  CHECK (role IN ('user', 'editor', 'admin', 'superadmin'));

-- Step 3: Update has_feature_access() to remove premium auto-grant
-- (This function is defined but not called by any RLS policy;
--  kept for backward compatibility but simplified.)
CREATE OR REPLACE FUNCTION has_feature_access(p_feature TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    CASE
      -- Admin/superadmin bypass all feature checks
      WHEN (SELECT role FROM user_profiles WHERE id = auth.uid()) IN ('admin', 'superadmin')
        THEN true
      -- Editor auto-granted admin_cms
      WHEN p_feature = 'admin_cms'
        AND (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'editor'
        THEN true
      -- Check explicit grants (grantee_id is UUID; role grants cast role text to UUID is invalid,
      -- so only user-type grants are checked here)
      ELSE EXISTS (
        SELECT 1 FROM feature_access
        WHERE feature_key = p_feature
          AND grantee_type = 'user'
          AND grantee_id = auth.uid()
      )
    END
$$;

COMMIT;
