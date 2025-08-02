-- Update mode constraint to include rhythm mode
ALTER TABLE fantasy_stages DROP CONSTRAINT IF EXISTS fantasy_stages_mode_check;
ALTER TABLE fantasy_stages ADD CONSTRAINT fantasy_stages_mode_check 
  CHECK (mode = ANY (ARRAY['single'::text, 'progression'::text, 'rhythm'::text]));