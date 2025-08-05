-- Migration script to update existing 'progression' mode values to 'progression_order'
-- Run this script against your Supabase database

UPDATE fantasy_stages
SET mode = 'progression_order'
WHERE mode = 'progression';

-- Verify the update
SELECT id, name, mode
FROM fantasy_stages
WHERE mode IN ('progression_order', 'progression_random', 'progression_timing');