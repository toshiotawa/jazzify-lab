-- Add new progression modes for fantasy stages (minimal version)

-- Step 1: Drop existing CHECK constraint
ALTER TABLE fantasy_stages DROP CONSTRAINT IF EXISTS fantasy_stages_mode_check;

-- Step 2: Update existing 'progression' data to 'progression_order'
UPDATE fantasy_stages
SET mode = 'progression_order'
WHERE mode = 'progression';

-- Step 3: Add new CHECK constraint with updated modes
ALTER TABLE fantasy_stages
ADD CONSTRAINT fantasy_stages_mode_check
CHECK (mode = ANY (ARRAY[
    'single'::text,
    'progression_order'::text,
    'progression_random'::text,
    'progression_timing'::text
]));