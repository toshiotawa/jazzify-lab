-- Add new progression modes for fantasy stages (simple version)

-- Step 1: Drop existing CHECK constraint
ALTER TABLE fantasy_stages DROP CONSTRAINT IF EXISTS fantasy_stages_mode_check;

-- Step 2: Update existing 'progression' data to 'progression_order'
UPDATE fantasy_stages
SET mode = 'progression_order'
WHERE mode = 'progression';

-- Step 3: Add new CHECK constraint with all modes
ALTER TABLE fantasy_stages
ADD CONSTRAINT fantasy_stages_mode_check
CHECK (mode = ANY (ARRAY[
    'single'::text,
    'progression_order'::text,
    'progression_random'::text,
    'progression_timing'::text,
    'rhythm'::text  -- 既存の'rhythm'モードも含める（もしあれば）
]));

-- Step 4: Show results
SELECT mode, COUNT(*) as count
FROM fantasy_stages
GROUP BY mode
ORDER BY mode;