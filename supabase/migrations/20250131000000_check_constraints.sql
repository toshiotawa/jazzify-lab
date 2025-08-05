-- Check current constraints on fantasy_stages table

-- Show all constraints on fantasy_stages table
SELECT 
    con.conname AS constraint_name,
    con.contype AS constraint_type,
    pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'fantasy_stages'
ORDER BY con.conname;

-- Show column details including defaults
SELECT 
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'fantasy_stages' 
AND column_name = 'mode';

-- Check current CHECK constraint definition
SELECT pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'fantasy_stages'::regclass 
AND conname LIKE '%mode%';