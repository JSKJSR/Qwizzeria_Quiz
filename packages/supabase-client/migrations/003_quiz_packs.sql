-- ============================================================
-- Migration 003: Quiz Packs
-- ============================================================

-- A1. quiz_packs table
CREATE TABLE IF NOT EXISTS quiz_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  category TEXT,
  is_premium BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT false,
  question_count INT DEFAULT 0,
  play_count INT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_quiz_packs_public_status ON quiz_packs (is_public, status);
CREATE INDEX IF NOT EXISTS idx_quiz_packs_category ON quiz_packs (category);
CREATE INDEX IF NOT EXISTS idx_quiz_packs_premium ON quiz_packs (is_premium);

-- A2. pack_questions junction table
CREATE TABLE IF NOT EXISTS pack_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_id UUID NOT NULL REFERENCES quiz_packs(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions_master(id) ON DELETE CASCADE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(pack_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_pack_questions_pack_id ON pack_questions (pack_id);

-- A3. FK on quiz_sessions for pack tracking
ALTER TABLE quiz_sessions
  ADD COLUMN IF NOT EXISTS quiz_pack_id UUID REFERENCES quiz_packs(id) ON DELETE SET NULL;

-- A4. RLS policies

-- quiz_packs: public+active readable by everyone
ALTER TABLE quiz_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public active packs are readable by everyone"
  ON quiz_packs FOR SELECT
  USING (is_public = true AND status = 'active');

CREATE POLICY "Admins can read all packs"
  ON quiz_packs FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin' OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can insert packs"
  ON quiz_packs FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update packs"
  ON quiz_packs FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin' OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete packs"
  ON quiz_packs FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin' OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- pack_questions: readable if parent pack is public+active
ALTER TABLE pack_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pack questions readable if pack is public and active"
  ON pack_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quiz_packs
      WHERE quiz_packs.id = pack_questions.pack_id
        AND quiz_packs.is_public = true
        AND quiz_packs.status = 'active'
    )
  );

CREATE POLICY "Admins can read all pack questions"
  ON pack_questions FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin' OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can insert pack questions"
  ON pack_questions FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update pack questions"
  ON pack_questions FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin' OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete pack questions"
  ON pack_questions FOR DELETE
  USING (auth.jwt() ->> 'role' = 'admin' OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- A5. Increment play count function (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION increment_pack_play_count(pack_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE quiz_packs
  SET play_count = play_count + 1
  WHERE id = pack_id;
END;
$$;
