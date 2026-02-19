-- ============================================================
-- Migration 007: Fix admin RPC "Unauthorized" error
--
-- Root cause: Circular RLS on user_profiles.
-- The RLS policy "profiles_select_admin" calls is_admin() → get_role()
-- which queries user_profiles, triggering RLS again → infinite loop.
--
-- Fix: Ensure SECURITY DEFINER functions bypass RLS by disabling
-- FORCE ROW LEVEL SECURITY, and clean up the function chain.
--
-- Run this in Supabase SQL Editor.
-- ============================================================

-- 1. Disable FORCE RLS so SECURITY DEFINER (postgres-owned) functions bypass RLS
ALTER TABLE user_profiles NO FORCE ROW LEVEL SECURITY;

-- 2. Drop and recreate the circular policy
DROP POLICY IF EXISTS "profiles_select_admin" ON user_profiles;

-- 3. Rewrite helper functions as lightweight SQL functions
CREATE OR REPLACE FUNCTION public.get_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()),
    'user'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()),
    'user'
  ) IN ('admin', 'superadmin');
$$;

CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_profiles WHERE id = auth.uid()),
    'user'
  ) = 'superadmin';
$$;

-- 4. Recreate the admin policy (now safe: is_admin() bypasses RLS)
CREATE POLICY "profiles_select_admin"
  ON user_profiles FOR SELECT
  USING (public.is_admin());

-- 5. Ensure superadmin update policy exists
DROP POLICY IF EXISTS "profiles_update_superadmin" ON user_profiles;
CREATE POLICY "profiles_update_superadmin"
  ON user_profiles FOR UPDATE
  USING (public.is_superadmin());

-- 6. Recreate get_all_users_admin
CREATE OR REPLACE FUNCTION get_all_users_admin(
  search_query TEXT DEFAULT NULL,
  role_filter TEXT DEFAULT NULL,
  result_limit INT DEFAULT 50,
  result_offset INT DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
  total_count INT;
  caller_role TEXT;
BEGIN
  -- Direct role check (bypasses RLS since this is SECURITY DEFINER)
  SELECT role INTO caller_role
  FROM public.user_profiles
  WHERE id = auth.uid();

  IF caller_role IS NULL OR caller_role NOT IN ('admin', 'superadmin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Total count
  SELECT COUNT(*) INTO total_count
  FROM user_profiles up
  JOIN auth.users u ON u.id = up.id
  WHERE (role_filter IS NULL OR up.role = role_filter)
    AND (search_query IS NULL OR (
      up.display_name ILIKE '%' || search_query || '%'
      OR u.email ILIKE '%' || search_query || '%'
    ));

  -- Paginated results
  SELECT json_build_object(
    'users', COALESCE(json_agg(row_data), '[]'::JSON),
    'total', total_count
  ) INTO result
  FROM (
    SELECT
      up.id,
      up.display_name,
      u.email,
      up.role,
      up.avatar_url,
      up.created_at,
      up.updated_at
    FROM user_profiles up
    JOIN auth.users u ON u.id = up.id
    WHERE (role_filter IS NULL OR up.role = role_filter)
      AND (search_query IS NULL OR (
        up.display_name ILIKE '%' || search_query || '%'
        OR u.email ILIKE '%' || search_query || '%'
      ))
    ORDER BY up.created_at DESC
    LIMIT result_limit
    OFFSET result_offset
  ) AS row_data;

  RETURN result;
END;
$$;

-- 7. Fix other admin RPCs with inline role checks
CREATE OR REPLACE FUNCTION get_admin_analytics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
  caller_role TEXT;
BEGIN
  SELECT role INTO caller_role FROM public.user_profiles WHERE id = auth.uid();
  IF caller_role IS NULL OR caller_role NOT IN ('admin', 'superadmin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM auth.users),
    'total_sessions', (SELECT COUNT(*) FROM quiz_sessions WHERE status = 'completed'),
    'avg_score', (SELECT ROUND(COALESCE(AVG(score), 0)::NUMERIC, 1) FROM quiz_sessions WHERE status = 'completed'),
    'active_users_7d', (
      SELECT COUNT(DISTINCT user_id)
      FROM quiz_sessions
      WHERE started_at >= now() - INTERVAL '7 days'
        AND user_id IS NOT NULL
    )
  ) INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION get_pack_performance()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
  caller_role TEXT;
BEGIN
  SELECT role INTO caller_role FROM public.user_profiles WHERE id = auth.uid();
  IF caller_role IS NULL OR caller_role NOT IN ('admin', 'superadmin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_agg(row_data) INTO result
  FROM (
    SELECT
      qp.id,
      qp.title,
      qp.play_count AS plays,
      ROUND(COALESCE(AVG(qs.score), 0)::NUMERIC, 1) AS avg_score,
      ROUND(
        COALESCE(
          COUNT(*) FILTER (WHERE qs.status = 'completed')::NUMERIC /
          NULLIF(COUNT(*), 0) * 100,
          0
        ), 1
      ) AS completion_rate
    FROM quiz_packs qp
    LEFT JOIN quiz_sessions qs ON qs.quiz_pack_id = qp.id
    WHERE qp.status = 'active'
    GROUP BY qp.id, qp.title, qp.play_count
    ORDER BY qp.play_count DESC
  ) AS row_data;

  RETURN COALESCE(result, '[]'::JSON);
END;
$$;

CREATE OR REPLACE FUNCTION get_hardest_questions(result_limit INT DEFAULT 10)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
  caller_role TEXT;
BEGIN
  SELECT role INTO caller_role FROM public.user_profiles WHERE id = auth.uid();
  IF caller_role IS NULL OR caller_role NOT IN ('admin', 'superadmin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_agg(row_data) INTO result
  FROM (
    SELECT
      qm.id,
      LEFT(qm.question_text, 100) AS question_text,
      qm.category,
      COUNT(*) AS total_attempts,
      ROUND(
        COUNT(*) FILTER (WHERE qa.is_correct = true)::NUMERIC /
        NULLIF(COUNT(*), 0) * 100, 1
      ) AS accuracy_pct
    FROM question_attempts qa
    JOIN questions_master qm ON qm.id = qa.question_id
    WHERE qa.is_correct IS NOT NULL
    GROUP BY qm.id, qm.question_text, qm.category
    HAVING COUNT(*) >= 3
    ORDER BY accuracy_pct ASC
    LIMIT result_limit
  ) AS row_data;

  RETURN COALESCE(result, '[]'::JSON);
END;
$$;

-- 8. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- 9. Verify: check current roles (run this after the migration)
-- SELECT id, display_name, role FROM user_profiles ORDER BY role DESC;
