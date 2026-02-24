-- ============================================================
-- Migration 011: Tournament Mode Tables
--
-- Adds host_tournaments and host_tournament_matches tables
-- for single-elimination bracket tournaments.
--
-- Run this in Supabase SQL Editor.
-- ============================================================

-- 1. Tournament table: one row per tournament
CREATE TABLE IF NOT EXISTS host_tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  pack_id UUID NOT NULL REFERENCES quiz_packs(id),
  status TEXT NOT NULL DEFAULT 'setup'
    CHECK (status IN ('setup', 'in_progress', 'completed')),
  team_names TEXT[] NOT NULL,
  questions_per_match INT NOT NULL DEFAULT 3,
  question_pool UUID[] NOT NULL DEFAULT '{}',
  bracket JSONB NOT NULL DEFAULT '{}',
  champion_team_index INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tournament matches: one row per match (denormalized for Realtime)
CREATE TABLE IF NOT EXISTS host_tournament_matches (
  id TEXT PRIMARY KEY,
  tournament_id UUID NOT NULL REFERENCES host_tournaments(id) ON DELETE CASCADE,
  round_index INT NOT NULL,
  match_index INT NOT NULL,
  team1_index INT,
  team2_index INT,
  team1_score INT DEFAULT 0,
  team2_score INT DEFAULT 0,
  winner_index INT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed', 'bye')),
  question_ids UUID[] DEFAULT '{}',
  completed_question_ids UUID[] DEFAULT '{}',
  skipped_questions JSONB DEFAULT '[]',
  played_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tournament_id, round_index, match_index)
);

-- 3. Indexes
CREATE INDEX IF NOT EXISTS idx_tournaments_created_by ON host_tournaments(created_by);
CREATE INDEX IF NOT EXISTS idx_tournaments_status ON host_tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_tournament ON host_tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tournament_matches_status ON host_tournament_matches(status);

-- 4. Enable RLS
ALTER TABLE host_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_tournament_matches ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for host_tournaments

-- Creator can read their own tournaments
DROP POLICY IF EXISTS "tournaments_select_own" ON host_tournaments;
CREATE POLICY "tournaments_select_own"
  ON host_tournaments FOR SELECT
  USING (created_by = auth.uid() OR is_admin());

-- Creator can insert tournaments
DROP POLICY IF EXISTS "tournaments_insert_own" ON host_tournaments;
CREATE POLICY "tournaments_insert_own"
  ON host_tournaments FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Creator can update their own tournaments
DROP POLICY IF EXISTS "tournaments_update_own" ON host_tournaments;
CREATE POLICY "tournaments_update_own"
  ON host_tournaments FOR UPDATE
  USING (created_by = auth.uid() OR is_admin());

-- Creator can delete their own tournaments
DROP POLICY IF EXISTS "tournaments_delete_own" ON host_tournaments;
CREATE POLICY "tournaments_delete_own"
  ON host_tournaments FOR DELETE
  USING (created_by = auth.uid() OR is_admin());

-- 6. RLS Policies for host_tournament_matches

-- Readable if user owns the parent tournament (or is admin)
DROP POLICY IF EXISTS "tournament_matches_select" ON host_tournament_matches;
CREATE POLICY "tournament_matches_select"
  ON host_tournament_matches FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM host_tournaments
      WHERE host_tournaments.id = host_tournament_matches.tournament_id
        AND (host_tournaments.created_by = auth.uid() OR is_admin())
    )
  );

-- Insertable if user owns the parent tournament
DROP POLICY IF EXISTS "tournament_matches_insert" ON host_tournament_matches;
CREATE POLICY "tournament_matches_insert"
  ON host_tournament_matches FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM host_tournaments
      WHERE host_tournaments.id = host_tournament_matches.tournament_id
        AND host_tournaments.created_by = auth.uid()
    )
  );

-- Updatable if user owns the parent tournament (or is the one playing the match)
DROP POLICY IF EXISTS "tournament_matches_update" ON host_tournament_matches;
CREATE POLICY "tournament_matches_update"
  ON host_tournament_matches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM host_tournaments
      WHERE host_tournaments.id = host_tournament_matches.tournament_id
        AND (host_tournaments.created_by = auth.uid() OR is_admin())
    )
  );

-- Deletable if user owns the parent tournament
DROP POLICY IF EXISTS "tournament_matches_delete" ON host_tournament_matches;
CREATE POLICY "tournament_matches_delete"
  ON host_tournament_matches FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM host_tournaments
      WHERE host_tournaments.id = host_tournament_matches.tournament_id
        AND (host_tournaments.created_by = auth.uid() OR is_admin())
    )
  );

-- 7. Updated_at trigger
CREATE OR REPLACE FUNCTION update_tournament_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tournament_updated ON host_tournaments;
CREATE TRIGGER trg_tournament_updated
  BEFORE UPDATE ON host_tournaments
  FOR EACH ROW EXECUTE FUNCTION update_tournament_updated_at();

DROP TRIGGER IF EXISTS trg_tournament_match_updated ON host_tournament_matches;
CREATE TRIGGER trg_tournament_match_updated
  BEFORE UPDATE ON host_tournament_matches
  FOR EACH ROW EXECUTE FUNCTION update_tournament_updated_at();

-- 8. Enable Realtime for tournament matches (for Phase 4)
ALTER PUBLICATION supabase_realtime ADD TABLE host_tournament_matches;

-- 9. Reload schema cache
NOTIFY pgrst, 'reload schema';
