-- Add mission_multiplier column to xp_history table
-- This column tracks the multiplier applied for mission completion bonuses

alter table public.xp_history 
add column mission_multiplier numeric not null default 1.0;