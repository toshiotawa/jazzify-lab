-- Add reason column to xp_history table
-- This column tracks the reason for XP gain (e.g., 'mission_clear', 'song_complete', etc.)

alter table public.xp_history 
add column reason text not null default 'unknown';

-- Add comment for documentation
comment on column public.xp_history.reason is 'The reason for XP gain (e.g., mission_clear, song_complete, etc.)';