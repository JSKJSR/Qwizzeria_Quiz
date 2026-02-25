-- 014: RPC function for users to delete their own account
-- Run this in the Supabase SQL Editor

CREATE OR REPLACE FUNCTION delete_own_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Remove RBAC grants
  DELETE FROM feature_access WHERE grantee_id = uid;
  DELETE FROM content_permissions WHERE grantee_id = uid;

  -- Delete the auth user (cascades to user_profiles via ON DELETE CASCADE;
  -- quiz_sessions.user_id is set to NULL via ON DELETE SET NULL)
  DELETE FROM auth.users WHERE id = uid;
END;
$$;
1