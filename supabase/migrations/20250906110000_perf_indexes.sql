-- Performance indexes to reduce query cost safely
-- Use to_regclass guards and IF NOT EXISTS to keep this idempotent

-- challenges(type, start_date, end_date)
do $$ begin
  if to_regclass('public.challenges') is not null then
    execute 'create index if not exists idx_challenges_type_start_end on public.challenges(type, start_date, end_date)';
  end if;
end $$;

-- diary_likes(diary_id)
do $$ begin
  if to_regclass('public.diary_likes') is not null then
    execute 'create index if not exists idx_diary_likes_diary_id on public.diary_likes(diary_id)';
  end if;
end $$;

-- comment_likes(comment_id)
do $$ begin
  if to_regclass('public.comment_likes') is not null then
    execute 'create index if not exists idx_comment_likes_comment_id on public.comment_likes(comment_id)';
  end if;
end $$;

-- user_challenge_progress(user_id)
do $$ begin
  if to_regclass('public.user_challenge_progress') is not null then
    execute 'create index if not exists idx_user_challenge_progress_user_id on public.user_challenge_progress(user_id)';
  end if;
end $$;

-- user_song_progress(user_id, song_id)
do $$ begin
  if to_regclass('public.user_song_progress') is not null then
    execute 'create index if not exists idx_user_song_progress_user_song on public.user_song_progress(user_id, song_id)';
  end if;
end $$;

-- practice_diaries(created_at)
do $$ begin
  if to_regclass('public.practice_diaries') is not null then
    execute 'create index if not exists idx_practice_diaries_created_at on public.practice_diaries(created_at)';
  end if;
end $$;

-- practice_diaries(user_id, practice_date)
do $$ begin
  if to_regclass('public.practice_diaries') is not null then
    execute 'create index if not exists idx_practice_diaries_user_date on public.practice_diaries(user_id, practice_date)';
  end if;
end $$;


