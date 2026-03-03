-- Add optional display_title column to questions_master.
-- When set, grid cards show this instead of the category name.
ALTER TABLE questions_master ADD COLUMN IF NOT EXISTS display_title TEXT;
