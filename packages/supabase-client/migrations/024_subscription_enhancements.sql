-- ============================================================
-- Migration 024: Subscription enhancements
-- - Add trial_start, trial_end to subscriptions
-- - Create stripe_webhook_log for idempotency
-- ============================================================

-- Add trial date columns to subscriptions
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS trial_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ;

-- ============================================================
-- Stripe webhook event log (idempotency + audit)
-- ============================================================

CREATE TABLE IF NOT EXISTS stripe_webhook_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT now(),
  status TEXT NOT NULL CHECK (status IN ('processed', 'failed', 'skipped')) DEFAULT 'processed',
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_webhook_log_event_id ON stripe_webhook_log(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_log_processed ON stripe_webhook_log(processed_at);

-- RLS: only service role can read/write (no user access needed)
ALTER TABLE stripe_webhook_log ENABLE ROW LEVEL SECURITY;

-- Admin read-only access for audit
CREATE POLICY webhook_log_admin_read ON stripe_webhook_log
  FOR SELECT USING (is_admin());
