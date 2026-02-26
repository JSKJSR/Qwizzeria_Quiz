-- ============================================================
-- Migration 015: Allow everyone to read all active packs
--
-- The landing page carousel and Browse Packs page need to
-- display all active packs (including host and premium) as a
-- read-only showcase. Playback is still gated by app-layer
-- role checks. Questions content remains protected by separate
-- RLS policies on pack_questions and questions_master.
--
-- The packs_select_premium and packs_select_host policies
-- become redundant and are removed to avoid overlapping rules.
--
-- Run this in Supabase SQL Editor.
-- ============================================================

-- Remove the old granular SELECT policies
DROP POLICY IF EXISTS "packs_select_public" ON quiz_packs;
DROP POLICY IF EXISTS "packs_select_premium" ON quiz_packs;
DROP POLICY IF EXISTS "packs_select_host" ON quiz_packs;

-- Everyone (including anonymous) can read active packs
CREATE POLICY "packs_select_public"
  ON quiz_packs FOR SELECT
  USING (status = 'active');

-- Admin/superadmin still see ALL packs (drafts, archived, etc.)
-- This policy already exists — recreate to be safe
DROP POLICY IF EXISTS "packs_select_admin" ON quiz_packs;
CREATE POLICY "packs_select_admin"
  ON quiz_packs FOR SELECT
  USING (public.is_admin());

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
