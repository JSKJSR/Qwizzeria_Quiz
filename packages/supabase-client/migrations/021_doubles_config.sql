-- Add config JSONB column to quiz_packs for doubles settings and future pack-level config.
ALTER TABLE quiz_packs ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}';
COMMENT ON COLUMN quiz_packs.config IS 'Pack-level configuration (doubles settings, etc.)';
