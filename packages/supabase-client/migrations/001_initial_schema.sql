-- ============================================================
-- Qwizzeria — Phase 1: Initial Schema
-- Run this in Supabase SQL Editor (or via CLI migration)
-- ============================================================

-- 1. Questions master table
CREATE TABLE IF NOT EXISTS questions_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  answer_text TEXT NOT NULL,
  answer_explanation TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  sub_category TEXT,
  media_url TEXT,
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index for free quiz random fetch (public + active questions)
CREATE INDEX idx_questions_public_active
  ON questions_master (is_public, status)
  WHERE is_public = true AND status = 'active';

-- Index for category browsing
CREATE INDEX idx_questions_category ON questions_master (category);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER questions_master_updated_at
  BEFORE UPDATE ON questions_master
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- 2. Quiz sessions table
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  quiz_pack_id UUID,  -- NULL for free quizzes, FK added in Phase 2
  is_free_quiz BOOLEAN NOT NULL DEFAULT true,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  score INTEGER NOT NULL DEFAULT 0,
  total_questions INTEGER NOT NULL DEFAULT 0,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_sessions_user ON quiz_sessions (user_id);

-- 3. Question attempts table
CREATE TABLE IF NOT EXISTS question_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions_master(id),
  is_correct BOOLEAN,
  time_spent_ms INTEGER,
  skipped BOOLEAN NOT NULL DEFAULT false,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attempts_session ON question_attempts (session_id);
CREATE INDEX idx_attempts_question ON question_attempts (question_id);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE questions_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_attempts ENABLE ROW LEVEL SECURITY;

-- Questions: anyone can read public+active questions
CREATE POLICY "Public questions are readable by everyone"
  ON questions_master FOR SELECT
  USING (is_public = true AND status = 'active');

-- Questions: only authenticated users with admin role can insert/update/delete
-- (Admin role check via custom claim — set up in Supabase dashboard or via function)
CREATE POLICY "Admins can manage all questions"
  ON questions_master FOR ALL
  USING (
    auth.uid() IS NOT NULL
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- Quiz sessions: users can read/insert their own sessions
CREATE POLICY "Users can view own sessions"
  ON quiz_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own sessions"
  ON quiz_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions"
  ON quiz_sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Anonymous sessions: allow insert with null user_id for guest play
CREATE POLICY "Anonymous users can create guest sessions"
  ON quiz_sessions FOR INSERT
  WITH CHECK (user_id IS NULL);

-- Question attempts: users can manage attempts in their own sessions
CREATE POLICY "Users can view own attempts"
  ON question_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quiz_sessions
      WHERE quiz_sessions.id = question_attempts.session_id
      AND (quiz_sessions.user_id = auth.uid() OR quiz_sessions.user_id IS NULL)
    )
  );

CREATE POLICY "Users can create attempts in own sessions"
  ON question_attempts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM quiz_sessions
      WHERE quiz_sessions.id = question_attempts.session_id
      AND (quiz_sessions.user_id = auth.uid() OR quiz_sessions.user_id IS NULL)
    )
  );
