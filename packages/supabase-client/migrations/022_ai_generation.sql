-- AI Quiz Generation rate limiting and audit log
-- Run this migration in the Supabase SQL Editor

CREATE TABLE ai_generation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  question_count INT NOT NULL,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_gen_log_user_time ON ai_generation_log (user_id, created_at DESC);

ALTER TABLE ai_generation_log ENABLE ROW LEVEL SECURITY;

-- Users can read their own generation history
CREATE POLICY "Users read own generation log"
  ON ai_generation_log FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role (Edge Function) inserts rows — no user-facing insert policy needed
