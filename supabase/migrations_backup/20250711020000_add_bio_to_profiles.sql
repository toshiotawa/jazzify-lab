-- Add bio column to profiles table
alter table public.profiles
  add column if not exists bio text; 