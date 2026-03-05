-- ============================================================
-- Migration 018: Enhanced User Management RPCs
--
-- 1. get_user_management_kpis() — KPI data for admin dashboard
-- 2. get_all_users_admin v2 — adds quiz_count, tournament_count, avg_score, last_active
--
-- Run this in Supabase SQL Editor.
-- ============================================================

-- 1. KPI function
CREATE OR REPLACE FUNCTION get_user_management_kpis()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
  caller_role TEXT;
  v_total_users INT;
BEGIN
  SELECT role INTO caller_role FROM public.user_profiles WHERE id = auth.uid();
  IF caller_role IS NULL OR caller_role NOT IN ('admin', 'superadmin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT COUNT(*) INTO v_total_users FROM public.user_profiles;

  SELECT json_build_object(
    'total_users', v_total_users,
    'active_24h', (
      SELECT COUNT(DISTINCT user_id)
      FROM quiz_sessions
      WHERE started_at >= now() - INTERVAL '24 hours'
        AND user_id IS NOT NULL
    ),
    'premium_count', (
      SELECT COUNT(*) FROM user_profiles
      WHERE role IN ('premium', 'editor', 'admin', 'superadmin')
    ),
    'tournament_participation_pct', (
      CASE WHEN v_total_users = 0 THEN 0
      ELSE ROUND(
        (SELECT COUNT(DISTINCT created_by) FROM host_tournaments)::NUMERIC
        / v_total_users * 100, 1
      )
      END
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- 2. Enhanced get_all_users_admin with per-user stats
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

  -- Paginated results with stats
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
      up.updated_at,
      COALESCE(qs_stats.quiz_count, 0) AS quiz_count,
      COALESCE(ht_stats.tournament_count, 0) AS tournament_count,
      qs_stats.avg_score,
      qs_stats.last_active
    FROM user_profiles up
    JOIN auth.users u ON u.id = up.id
    LEFT JOIN LATERAL (
      SELECT
        COUNT(*) FILTER (WHERE qs.status = 'completed') AS quiz_count,
        ROUND(AVG(qs.score) FILTER (WHERE qs.status = 'completed')::NUMERIC, 1) AS avg_score,
        MAX(qs.started_at) AS last_active
      FROM quiz_sessions qs
      WHERE qs.user_id = up.id
    ) qs_stats ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*) AS tournament_count
      FROM host_tournaments ht
      WHERE ht.created_by = up.id
    ) ht_stats ON true
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

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
