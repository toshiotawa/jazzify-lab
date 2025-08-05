-- Add new progression modes for fantasy stages (final safe version)

-- Step 1: Check current data
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE 'Current mode distribution:';
    FOR r IN (SELECT mode, COUNT(*) as cnt FROM fantasy_stages GROUP BY mode)
    LOOP
        RAISE NOTICE 'mode: %, count: %', r.mode, r.cnt;
    END LOOP;
END $$;

-- Step 2: Drop ALL constraints with 'mode' in their definition
DO $$
DECLARE
    constraint_rec RECORD;
BEGIN
    FOR constraint_rec IN 
        SELECT conname 
        FROM pg_constraint 
        WHERE conrelid = 'fantasy_stages'::regclass 
        AND pg_get_constraintdef(oid) LIKE '%mode%'
    LOOP
        EXECUTE format('ALTER TABLE fantasy_stages DROP CONSTRAINT %I', constraint_rec.conname);
        RAISE NOTICE 'Dropped constraint: %', constraint_rec.conname;
    END LOOP;
END $$;

-- Step 3: Clean up data - update modes to valid values
UPDATE fantasy_stages
SET mode = 
    CASE 
        WHEN mode = 'progression' THEN 'progression_order'
        WHEN mode = 'single' THEN 'single'
        WHEN mode = 'rhythm' THEN 'rhythm'
        WHEN mode = 'progression_order' THEN 'progression_order'
        WHEN mode = 'progression_random' THEN 'progression_random'
        WHEN mode = 'progression_timing' THEN 'progression_timing'
        WHEN mode IS NULL OR mode = '' THEN 'single'
        ELSE 'single'  -- Default any unknown values
    END;

-- Step 4: Add the new constraint
ALTER TABLE fantasy_stages
ADD CONSTRAINT fantasy_stages_mode_check
CHECK (mode IN ('single', 'progression_order', 'progression_random', 'progression_timing', 'rhythm'));

-- Step 5: Verify the results
DO $$
DECLARE
    r RECORD;
BEGIN
    RAISE NOTICE 'Final mode distribution:';
    FOR r IN (SELECT mode, COUNT(*) as cnt FROM fantasy_stages GROUP BY mode)
    LOOP
        RAISE NOTICE 'mode: %, count: %', r.mode, r.cnt;
    END LOOP;
END $$;