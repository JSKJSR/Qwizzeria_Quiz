-- ============================================================
-- Migration 016: Per-Match Pack Selection
--
-- Adds per-match pack_id and match_question_pool columns to
-- host_tournament_matches, allowing hosts to select a different
-- quiz pack for each match in a tournament.
--
-- Also makes host_tournaments.pack_id nullable to support
-- per-match pack mode (where no single pack is chosen upfront).
--
-- Run this in Supabase SQL Editor.
-- ============================================================

-- 1. Add per-match pack columns to host_tournament_matches
ALTER TABLE host_tournament_matches
  ADD COLUMN IF NOT EXISTS pack_id UUID REFERENCES quiz_packs(id),
  ADD COLUMN IF NOT EXISTS match_question_pool UUID[] DEFAULT '{}';

-- 2. Make tournament-level pack_id nullable (per-match tournaments won't have one)
ALTER TABLE host_tournaments
  ALTER COLUMN pack_id DROP NOT NULL;

-- 3. No new RLS policies needed:
--    host_tournament_matches already has RLS based on parent tournament ownership.
--    quiz_packs RLS already allows active packs to be read by everyone.

-- 4. Reload schema cache
NOTIFY pgrst, 'reload schema';
