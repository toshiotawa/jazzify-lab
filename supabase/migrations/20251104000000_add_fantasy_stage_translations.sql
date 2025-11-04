-- Add English translation columns for fantasy stages
ALTER TABLE fantasy_stages
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT;

COMMENT ON COLUMN fantasy_stages.name_en IS 'Stage name (English)';
COMMENT ON COLUMN fantasy_stages.description_en IS 'Stage description (English)';
