-- Phase 12e: Streak Freeze feature
-- Run in Supabase SQL Editor

-- Add streak freeze columns to user_profiles
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS streak_freezes_remaining INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS streak_freeze_last_reset DATE;

-- RPC: Use a streak freeze (called when streak would otherwise break)
-- Returns true if freeze was used, false if no freezes available
CREATE OR REPLACE FUNCTION use_streak_freeze(target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  freezes INTEGER;
BEGIN
  SELECT streak_freezes_remaining INTO freezes
  FROM user_profiles
  WHERE id = target_user_id;

  IF freezes IS NULL OR freezes <= 0 THEN
    RETURN FALSE;
  END IF;

  UPDATE user_profiles
  SET streak_freezes_remaining = streak_freezes_remaining - 1
  WHERE id = target_user_id;

  RETURN TRUE;
END;
$$;

-- RPC: Reset monthly streak freezes based on tier
-- Should be called via cron or on login when month changes
CREATE OR REPLACE FUNCTION reset_monthly_streak_freezes(target_user_id UUID, user_tier TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_month DATE := date_trunc('month', CURRENT_DATE)::DATE;
  last_reset DATE;
  new_freezes INTEGER;
BEGIN
  SELECT streak_freeze_last_reset INTO last_reset
  FROM user_profiles
  WHERE id = target_user_id;

  -- Only reset once per month
  IF last_reset IS NOT NULL AND last_reset >= current_month THEN
    RETURN;
  END IF;

  -- Determine freezes by tier
  new_freezes := CASE user_tier
    WHEN 'pro' THEN 30  -- effectively unlimited
    WHEN 'basic' THEN 3
    ELSE 1              -- free tier
  END;

  UPDATE user_profiles
  SET streak_freezes_remaining = new_freezes,
      streak_freeze_last_reset = current_month
  WHERE id = target_user_id;
END;
$$;
