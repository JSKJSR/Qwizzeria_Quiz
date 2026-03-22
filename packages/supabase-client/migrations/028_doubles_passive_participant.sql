-- Migration 028: Doubles Passive Participant
-- Adds email lookup RPC, availability check RPC, RLS policy, and index
-- for passive participant feature in Doubles mode.

-- 1. RPC: Look up a registered user by email
-- Returns user_id and display_name if found. SECURITY DEFINER to access auth.users.
-- Rejects unauthenticated callers and self-lookup.
CREATE OR REPLACE FUNCTION lookup_user_by_email(target_email TEXT)
RETURNS TABLE(user_id UUID, display_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Must be authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Normalize email
  target_email := lower(trim(target_email));

  -- Reject self-lookup
  IF EXISTS (
    SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = target_email
  ) THEN
    RAISE EXCEPTION 'Cannot look up your own email';
  END IF;

  RETURN QUERY
  SELECT au.id AS user_id, COALESCE(up.display_name, '') AS display_name
  FROM auth.users au
  LEFT JOIN user_profiles up ON up.id = au.id
  WHERE au.email = target_email
  LIMIT 1;
END;
$$;

-- 2. RPC: Check if a user is available for doubles (not in an active doubles session)
CREATE OR REPLACE FUNCTION check_doubles_availability(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Must be authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Return true if user is NOT in any active doubles session (as primary or passive)
  RETURN NOT EXISTS (
    SELECT 1 FROM quiz_sessions
    WHERE status = 'in_progress'
      AND metadata->>'format' = 'doubles'
      AND (
        user_id = target_user_id
        OR metadata->>'passive_user_id' = target_user_id::text
      )
  );
END;
$$;

-- 3. RLS policy: Allow users to read sessions where they are the passive participant
CREATE POLICY "Users can view sessions where they are passive participant"
  ON quiz_sessions
  FOR SELECT
  USING (metadata->>'passive_user_id' = auth.uid()::text);

-- 4. Partial index for efficient passive participant queries
CREATE INDEX IF NOT EXISTS idx_sessions_passive_user
  ON quiz_sessions ((metadata->>'passive_user_id'))
  WHERE metadata->>'format' = 'doubles';
