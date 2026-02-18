-- Migration 005: Add points field to questions_master
-- Allows admins to assign custom point values to individual questions.
-- NULL = use position-based logic (backward compatible).

ALTER TABLE questions_master ADD COLUMN points INTEGER DEFAULT NULL;
