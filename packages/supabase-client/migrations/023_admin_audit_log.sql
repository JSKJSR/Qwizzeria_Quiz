CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT,          -- PK of affected record (NULL for bulk ops)
  payload JSONB,           -- mutation data
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_log_user ON admin_audit_log (user_id, created_at DESC);
CREATE INDEX idx_audit_log_action ON admin_audit_log (action, created_at DESC);

ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Admin+ can read
CREATE POLICY "Admin read audit log" ON admin_audit_log
  FOR SELECT USING (is_admin());

-- Authenticated users can insert their own entries
CREATE POLICY "Authenticated insert audit log" ON admin_audit_log
  FOR INSERT WITH CHECK (auth.uid() = user_id);
