-- Optional migration to convert JSONB columns to TEXT[] if needed
-- This is a separate migration that can be run after the main migration

-- Step 1: Add temporary columns
ALTER TABLE fantasy_stages 
ADD COLUMN IF NOT EXISTS allowed_chords_new TEXT[],
ADD COLUMN IF NOT EXISTS chord_progression_new TEXT[];

-- Step 2: Copy data from JSONB to TEXT[]
UPDATE fantasy_stages 
SET 
    allowed_chords_new = CASE 
        WHEN allowed_chords IS NULL OR allowed_chords::text = 'null' THEN NULL
        WHEN allowed_chords::text = '[]' THEN '{}'::TEXT[]
        ELSE (
            SELECT array_agg(value::text)
            FROM jsonb_array_elements_text(allowed_chords)
        )
    END,
    chord_progression_new = CASE 
        WHEN chord_progression IS NULL OR chord_progression::text = 'null' THEN NULL
        WHEN chord_progression::text = '[]' THEN NULL
        ELSE (
            SELECT array_agg(value::text)
            FROM jsonb_array_elements_text(chord_progression)
        )
    END;

-- Step 3: Drop old columns (BE CAREFUL - This will delete data!)
-- ALTER TABLE fantasy_stages 
-- DROP COLUMN allowed_chords,
-- DROP COLUMN chord_progression;

-- Step 4: Rename new columns
-- ALTER TABLE fantasy_stages 
-- RENAME COLUMN allowed_chords_new TO allowed_chords;
-- ALTER TABLE fantasy_stages 
-- RENAME COLUMN chord_progression_new TO chord_progression;

-- Note: Steps 3 and 4 are commented out for safety. 
-- Uncomment and run them only after verifying the data conversion is correct.