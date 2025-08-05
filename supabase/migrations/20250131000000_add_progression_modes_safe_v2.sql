-- Add new progression modes for fantasy stages (safe version v2)

-- Step 1: First, let's see what we're dealing with
DO $$
DECLARE
    invalid_count INTEGER;
    mode_value TEXT;
BEGIN
    -- Count rows that would violate the new constraint
    SELECT COUNT(*) INTO invalid_count
    FROM fantasy_stages
    WHERE mode NOT IN ('single', 'progression', 'rhythm');
    
    IF invalid_count > 0 THEN
        RAISE NOTICE 'Found % rows with invalid mode values', invalid_count;
        
        -- Show the invalid values
        FOR mode_value IN (SELECT DISTINCT mode FROM fantasy_stages WHERE mode NOT IN ('single', 'progression', 'rhythm'))
        LOOP
            RAISE NOTICE 'Invalid mode value found: %', mode_value;
        END LOOP;
    END IF;
END $$;

-- Step 2: Drop existing CHECK constraint
ALTER TABLE fantasy_stages DROP CONSTRAINT IF EXISTS fantasy_stages_mode_check;

-- Step 3: Update ALL non-standard modes to safe values
UPDATE fantasy_stages
SET mode = CASE
    WHEN mode = 'progression' THEN 'progression_order'
    WHEN mode IN ('single', 'rhythm') THEN mode  -- Keep these as-is
    WHEN mode LIKE 'progression_%' THEN mode  -- Keep any existing progression_* modes
    ELSE 'single'  -- Default any unknown values to 'single'
END
WHERE mode IS NOT NULL;

-- Handle NULL values
UPDATE fantasy_stages
SET mode = 'single'
WHERE mode IS NULL;

-- Step 4: Add new CHECK constraint
ALTER TABLE fantasy_stages
ADD CONSTRAINT fantasy_stages_mode_check
CHECK (mode = ANY (ARRAY[
    'single'::text,
    'progression_order'::text,
    'progression_random'::text,
    'progression_timing'::text,
    'rhythm'::text
]));

-- Step 5: Show final results
SELECT mode, COUNT(*) as count
FROM fantasy_stages
GROUP BY mode
ORDER BY mode;