-- ============================================================
-- Migration 031: Admin Subscription Management
--
-- 1. admin_set_user_subscription() — admin can grant/revoke tiers
-- 2. get_all_users_admin v3 — adds subscription_tier, subscription_status
-- 3. get_user_management_kpis v2 — fixes premium_count to use subscriptions table
--
-- Run this in Supabase SQL Editor.
-- ============================================================

-- ============================================================
-- 1. Admin set user subscription RPC
-- ============================================================

CREATE OR REPLACE FUNCTION admin_set_user_subscription(
  target_user_id UUID,
  new_tier TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Only admin/superadmin can call this
  SELECT role INTO caller_role FROM public.user_profiles WHERE id = auth.uid();
  IF caller_role IS NULL OR caller_role NOT IN ('admin', 'superadmin') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Validate tier
  IF new_tier NOT IN ('free', 'basic', 'pro') THEN
    RAISE EXCEPTION 'Invalid tier: %', new_tier;
  END IF;

  -- Cannot modify own subscription
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot modify your own subscription';
  END IF;

  IF new_tier = 'free' THEN
    -- Remove subscription row (reverts to free/trial)
    DELETE FROM subscriptions WHERE user_id = target_user_id;
  ELSE
    -- Upsert subscription with admin grant
    INSERT INTO subscriptions (user_id, tier, status, current_period_start, current_period_end, updated_at)
    VALUES (target_user_id, new_tier, 'active', now(), now() + interval '100 years', now())
    ON CONFLICT (user_id) DO UPDATE SET
      tier = EXCLUDED.tier,
      status = 'active',
      current_period_start = now(),
      current_period_end = now() + interval '100 years',
      stripe_customer_id = NULL,
      stripe_subscription_id = NULL,
      cancel_at_period_end = false,
      updated_at = now();
  END IF;
END;
$$;

-- ============================================================
-- 2. Updated get_all_users_admin — adds subscription data
-- ============================================================

CREATE OR REPLACE FUNCTION get_all_users_admin(
  search_query TEXT DEFAULT NULL,
  role_filter TEXT DEFAULT NULL,
  tier_filter TEXT DEFAULT NULL,
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
  LEFT JOIN subscriptions sub ON sub.user_id = up.id
  WHERE (role_filter IS NULL OR up.role = role_filter)
    AND (search_query IS NULL OR (
      up.display_name ILIKE '%' || search_query || '%'
      OR u.email ILIKE '%' || search_query || '%'
    ))
    AND (tier_filter IS NULL OR (
      CASE
        WHEN tier_filter = 'free' THEN sub.id IS NULL OR sub.status NOT IN ('active', 'past_due')
        WHEN tier_filter = 'staff' THEN up.role IN ('editor', 'admin', 'superadmin')
        ELSE sub.tier = tier_filter AND sub.status IN ('active', 'past_due')
      END
    ));

  -- Paginated results with stats + subscription
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
      qs_stats.last_active,
      sub.tier AS subscription_tier,
      sub.status AS subscription_status
    FROM user_profiles up
    JOIN auth.users u ON u.id = up.id
    LEFT JOIN subscriptions sub ON sub.user_id = up.id
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
      AND (tier_filter IS NULL OR (
        CASE
          WHEN tier_filter = 'free' THEN sub.id IS NULL OR sub.status NOT IN ('active', 'past_due')
          WHEN tier_filter = 'staff' THEN up.role IN ('editor', 'admin', 'superadmin')
          ELSE sub.tier = tier_filter AND sub.status IN ('active', 'past_due')
        END
      ))
    ORDER BY up.created_at DESC
    LIMIT result_limit
    OFFSET result_offset
  ) AS row_data;

  RETURN result;
END;
$$;

-- ============================================================
-- 3. Updated KPIs — real subscription counts
-- ============================================================

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
      SELECT COUNT(*) FROM subscriptions
      WHERE status IN ('active', 'past_due')
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

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
