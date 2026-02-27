-- ============================================================
-- Migration 016: Subscriptions table + get_subscription_state RPC
-- ============================================================

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  tier TEXT NOT NULL CHECK (tier IN ('basic', 'pro')) DEFAULT 'basic',
  status TEXT NOT NULL CHECK (status IN ('trialing','active','past_due','canceled','expired')) DEFAULT 'trialing',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_customer_id);

-- RLS policies
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription
CREATE POLICY subscriptions_select_own ON subscriptions
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

-- Only service role can insert/update/delete (Stripe webhook writes)
-- No policies for INSERT/UPDATE/DELETE = only service role can write

-- ============================================================
-- get_subscription_state RPC
-- Single source of truth for subscription/trial/gating state
-- ============================================================

CREATE OR REPLACE FUNCTION get_subscription_state(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_role TEXT;
  v_created_at TIMESTAMPTZ;
  v_trial_end TIMESTAMPTZ;
  v_trial_days_left INT;
  v_sub RECORD;
  v_result JSON;
BEGIN
  -- 1. Get user role and created_at
  SELECT role, created_at INTO v_role, v_created_at
  FROM user_profiles
  WHERE id = target_user_id;

  -- Staff roles bypass everything
  IF v_role IN ('editor', 'admin', 'superadmin') THEN
    RETURN json_build_object(
      'status', 'staff',
      'tier', 'pro',
      'gated', false,
      'role', v_role
    );
  END IF;

  -- 2. Check for subscription row
  SELECT * INTO v_sub
  FROM subscriptions
  WHERE user_id = target_user_id;

  IF v_sub IS NOT NULL THEN
    -- 3. Has subscription row — return status/tier/dates
    RETURN json_build_object(
      'status', v_sub.status,
      'tier', CASE
        WHEN v_sub.status = 'active' THEN v_sub.tier
        WHEN v_sub.status = 'past_due' THEN v_sub.tier
        WHEN v_sub.status = 'canceled' AND v_sub.current_period_end > now() THEN v_sub.tier
        ELSE 'free'
      END,
      'gated', CASE
        WHEN v_sub.status = 'active' THEN false
        WHEN v_sub.status = 'past_due' AND v_sub.updated_at + interval '3 days' > now() THEN false
        WHEN v_sub.status = 'canceled' AND v_sub.current_period_end > now() THEN false
        ELSE true
      END,
      'cancelAtPeriodEnd', COALESCE(v_sub.cancel_at_period_end, false),
      'currentPeriodEnd', v_sub.current_period_end,
      'stripeCustomerId', v_sub.stripe_customer_id
    );
  END IF;

  -- 4. No subscription row — compute trial from user_profiles.created_at
  IF v_created_at IS NULL THEN
    -- No profile found, treat as expired
    RETURN json_build_object(
      'status', 'expired',
      'tier', 'free',
      'gated', true
    );
  END IF;

  v_trial_end := v_created_at + interval '14 days';
  v_trial_days_left := GREATEST(0, EXTRACT(DAY FROM v_trial_end - now())::INT);

  IF now() < v_trial_end THEN
    RETURN json_build_object(
      'status', 'trialing',
      'tier', 'pro',
      'trialEnd', v_trial_end,
      'trialDaysLeft', v_trial_days_left,
      'gated', false
    );
  ELSE
    RETURN json_build_object(
      'status', 'expired',
      'tier', 'free',
      'trialEnd', v_trial_end,
      'trialDaysLeft', 0,
      'gated', true
    );
  END IF;
END;
$$;

-- ============================================================
-- get_subscription_analytics RPC (admin-only)
-- ============================================================

CREATE OR REPLACE FUNCTION get_subscription_analytics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_total_users INT;
  v_trialing INT;
  v_active_basic INT;
  v_active_pro INT;
  v_canceled INT;
  v_expired INT;
  v_trial_converted INT;
  v_trial_total INT;
BEGIN
  -- Only admin can call this
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Count users by subscription state
  SELECT COUNT(*) INTO v_total_users FROM user_profiles WHERE role IN ('user', 'premium');

  -- Users with subscription rows
  SELECT
    COUNT(*) FILTER (WHERE status = 'active' AND tier = 'basic'),
    COUNT(*) FILTER (WHERE status = 'active' AND tier = 'pro'),
    COUNT(*) FILTER (WHERE status = 'canceled'),
    COUNT(*) FILTER (WHERE status = 'past_due')
  INTO v_active_basic, v_active_pro, v_canceled, v_expired
  FROM subscriptions;

  -- Trialing: users without subscription row and created within 14 days
  SELECT COUNT(*) INTO v_trialing
  FROM user_profiles
  WHERE role IN ('user', 'premium')
    AND id NOT IN (SELECT user_id FROM subscriptions)
    AND created_at + interval '14 days' > now();

  -- Expired trials: users without subscription row and created > 14 days ago
  SELECT COUNT(*) INTO v_expired
  FROM user_profiles
  WHERE role IN ('user', 'premium')
    AND id NOT IN (SELECT user_id FROM subscriptions)
    AND created_at + interval '14 days' <= now();

  -- Trial conversion: users who have a subscription row (they converted)
  SELECT COUNT(*) INTO v_trial_converted
  FROM subscriptions
  WHERE status IN ('active', 'canceled', 'past_due');

  v_trial_total := v_trialing + v_trial_converted + v_expired;

  RETURN json_build_object(
    'totalUsers', v_total_users,
    'trialing', v_trialing,
    'activeBasic', v_active_basic,
    'activePro', v_active_pro,
    'canceled', v_canceled,
    'expired', v_expired,
    'conversionRate', CASE WHEN v_trial_total > 0
      THEN ROUND((v_trial_converted::NUMERIC / v_trial_total) * 100, 1)
      ELSE 0 END
  );
END;
$$;
