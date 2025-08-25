-- Add covering indexes for reported unindexed foreign keys
-- Using IF NOT EXISTS and to_regclass guards to be idempotent and safe

-- challenge_progress.challenge_id
do $$ begin
  if to_regclass('public.challenge_progress') is not null then
    execute 'create index if not exists idx_challenge_progress_challenge_id on public.challenge_progress(challenge_id)';
  end if;
end $$;

-- challenge_tracks.challenge_id, challenge_tracks.song_id
do $$ begin
  if to_regclass('public.challenge_tracks') is not null then
    execute 'create index if not exists idx_challenge_tracks_challenge_id on public.challenge_tracks(challenge_id)';
    execute 'create index if not exists idx_challenge_tracks_song_id on public.challenge_tracks(song_id)';
  end if;
end $$;

-- comment_likes.user_id
do $$ begin
  if to_regclass('public.comment_likes') is not null then
    execute 'create index if not exists idx_comment_likes_user_id on public.comment_likes(user_id)';
  end if;
end $$;

-- diary_comments.diary_id, diary_comments.user_id
do $$ begin
  if to_regclass('public.diary_comments') is not null then
    execute 'create index if not exists idx_diary_comments_diary_id on public.diary_comments(diary_id)';
    execute 'create index if not exists idx_diary_comments_user_id on public.diary_comments(user_id)';
  end if;
end $$;

-- diary_likes.user_id
do $$ begin
  if to_regclass('public.diary_likes') is not null then
    execute 'create index if not exists idx_diary_likes_user_id on public.diary_likes(user_id)';
  end if;
end $$;

-- fantasy_bgm_assets.created_by
do $$ begin
  if to_regclass('public.fantasy_bgm_assets') is not null then
    execute 'create index if not exists idx_fantasy_bgm_assets_created_by on public.fantasy_bgm_assets(created_by)';
  end if;
end $$;

-- guild_invitations.inviter_id, guild_invitations.invitee_id
do $$ begin
  if to_regclass('public.guild_invitations') is not null then
    execute 'create index if not exists idx_guild_invitations_inviter_id on public.guild_invitations(inviter_id)';
    execute 'create index if not exists idx_guild_invitations_invitee_id on public.guild_invitations(invitee_id)';
  end if;
end $$;

-- guild_join_requests.requester_id
do $$ begin
  if to_regclass('public.guild_join_requests') is not null then
    execute 'create index if not exists idx_guild_join_requests_requester_id on public.guild_join_requests(requester_id)';
  end if;
end $$;

-- guild_leave_feedback.previous_guild_id, guild_leave_feedback.user_id
do $$ begin
  if to_regclass('public.guild_leave_feedback') is not null then
    execute 'create index if not exists idx_guild_leave_feedback_previous_guild_id on public.guild_leave_feedback(previous_guild_id)';
    execute 'create index if not exists idx_guild_leave_feedback_user_id on public.guild_leave_feedback(user_id)';
  end if;
end $$;

-- guild_membership_history.guild_id, guild_membership_history.user_id
do $$ begin
  if to_regclass('public.guild_membership_history') is not null then
    execute 'create index if not exists idx_guild_membership_history_guild_id on public.guild_membership_history(guild_id)';
    execute 'create index if not exists idx_guild_membership_history_user_id on public.guild_membership_history(user_id)';
  end if;
end $$;

-- guild_post_comments.post_id, guild_post_comments.user_id
do $$ begin
  if to_regclass('public.guild_post_comments') is not null then
    execute 'create index if not exists idx_guild_post_comments_post_id on public.guild_post_comments(post_id)';
    execute 'create index if not exists idx_guild_post_comments_user_id on public.guild_post_comments(user_id)';
  end if;
end $$;

-- guild_post_likes.user_id
do $$ begin
  if to_regclass('public.guild_post_likes') is not null then
    execute 'create index if not exists idx_guild_post_likes_user_id on public.guild_post_likes(user_id)';
  end if;
end $$;

-- guild_posts.guild_id, guild_posts.user_id
do $$ begin
  if to_regclass('public.guild_posts') is not null then
    execute 'create index if not exists idx_guild_posts_guild_id on public.guild_posts(guild_id)';
    execute 'create index if not exists idx_guild_posts_user_id on public.guild_posts(user_id)';
  end if;
end $$;

-- guild_xp_contributions.user_id
do $$ begin
  if to_regclass('public.guild_xp_contributions') is not null then
    execute 'create index if not exists idx_guild_xp_contributions_user_id on public.guild_xp_contributions(user_id)';
  end if;
end $$;

-- guilds.leader_id
do $$ begin
  if to_regclass('public.guilds') is not null then
    execute 'create index if not exists idx_guilds_leader_id on public.guilds(leader_id)';
  end if;
end $$;

-- lesson_tracks.lesson_id, lesson_tracks.song_id
do $$ begin
  if to_regclass('public.lesson_tracks') is not null then
    execute 'create index if not exists idx_lesson_tracks_lesson_id on public.lesson_tracks(lesson_id)';
    execute 'create index if not exists idx_lesson_tracks_song_id on public.lesson_tracks(song_id)';
  end if;
end $$;

-- lesson_videos.lesson_id
do $$ begin
  if to_regclass('public.lesson_videos') is not null then
    execute 'create index if not exists idx_lesson_videos_lesson_id on public.lesson_videos(lesson_id)';
  end if;
end $$;

-- notifications.actor_id, notifications.comment_id, notifications.diary_id, notifications.user_id
do $$ begin
  if to_regclass('public.notifications') is not null then
    execute 'create index if not exists idx_notifications_actor_id on public.notifications(actor_id)';
    execute 'create index if not exists idx_notifications_comment_id on public.notifications(comment_id)';
    execute 'create index if not exists idx_notifications_diary_id on public.notifications(diary_id)';
    execute 'create index if not exists idx_notifications_user_id on public.notifications(user_id)';
  end if;
end $$;

-- track_clears.song_id, track_clears.user_id
do $$ begin
  if to_regclass('public.track_clears') is not null then
    execute 'create index if not exists idx_track_clears_song_id on public.track_clears(song_id)';
    execute 'create index if not exists idx_track_clears_user_id on public.track_clears(user_id)';
  end if;
end $$;

-- user_challenge_progress.challenge_id
do $$ begin
  if to_regclass('public.user_challenge_progress') is not null then
    execute 'create index if not exists idx_user_challenge_progress_challenge_id on public.user_challenge_progress(challenge_id)';
  end if;
end $$;

-- user_lesson_progress.course_id, user_lesson_progress.lesson_id
do $$ begin
  if to_regclass('public.user_lesson_progress') is not null then
    execute 'create index if not exists idx_user_lesson_progress_course_id on public.user_lesson_progress(course_id)';
    execute 'create index if not exists idx_user_lesson_progress_lesson_id on public.user_lesson_progress(lesson_id)';
  end if;
end $$;

-- user_lesson_requirements_progress.song_id
do $$ begin
  if to_regclass('public.user_lesson_requirements_progress') is not null then
    execute 'create index if not exists idx_user_lesson_requirements_progress_song_id on public.user_lesson_requirements_progress(song_id)';
  end if;
end $$;

-- user_song_stats.song_id
do $$ begin
  if to_regclass('public.user_song_stats') is not null then
    execute 'create index if not exists idx_user_song_stats_song_id on public.user_song_stats(song_id)';
  end if;
end $$;

-- xp_history.song_id, xp_history.user_id
do $$ begin
  if to_regclass('public.xp_history') is not null then
    execute 'create index if not exists idx_xp_history_song_id on public.xp_history(song_id)';
    execute 'create index if not exists idx_xp_history_user_id on public.xp_history(user_id)';
  end if;
end $$;


