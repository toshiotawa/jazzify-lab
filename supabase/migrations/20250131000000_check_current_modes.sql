-- Check current mode values before migration

-- Step 1: Show all unique mode values currently in the table
SELECT DISTINCT mode, COUNT(*) as count
FROM fantasy_stages
GROUP BY mode
ORDER BY mode;

-- Step 2: Show any rows that might have NULL or empty mode
SELECT id, stage_number, name, mode
FROM fantasy_stages
WHERE mode IS NULL OR mode = '' OR mode NOT IN ('single', 'progression', 'rhythm');

-- Step 3: Show the first few rows to understand the data
SELECT id, stage_number, name, mode
FROM fantasy_stages
LIMIT 10;