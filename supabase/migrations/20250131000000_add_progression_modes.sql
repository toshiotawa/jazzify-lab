-- Add new progression modes for fantasy stages (safe version)

-- Step 1: Remove any existing CHECK constraints on mode column
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Find all CHECK constraints on fantasy_stages table
    FOR constraint_name IN 
        SELECT con.conname 
        FROM pg_catalog.pg_constraint con
        INNER JOIN pg_catalog.pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'fantasy_stages' 
        AND con.contype = 'c'
        AND pg_get_constraintdef(con.oid) LIKE '%mode%'
    LOOP
        EXECUTE format('ALTER TABLE fantasy_stages DROP CONSTRAINT %I', constraint_name);
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- Step 2: Update existing data
UPDATE fantasy_stages
SET mode = 'progression_order'
WHERE mode = 'progression';

-- Step 3: Add new CHECK constraint
ALTER TABLE fantasy_stages
ADD CONSTRAINT chk_fantasy_stage_mode
CHECK (mode IN ('single', 'progression_order', 'progression_random', 'progression_timing'));

-- Step 4: Show results
SELECT mode, COUNT(*) as count
FROM fantasy_stages
GROUP BY mode
ORDER BY mode;