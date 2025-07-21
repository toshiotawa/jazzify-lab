-- Add missing UPDATE and DELETE policies for practice_diaries table
-- This allows users to edit and delete their own diary entries

-- Add UPDATE policy
create policy "diary_update" on public.practice_diaries 
for update using ( auth.uid() = user_id );

-- Add DELETE policy  
create policy "diary_delete" on public.practice_diaries 
for delete using ( auth.uid() = user_id );