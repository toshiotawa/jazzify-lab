-- Extend notifications types and add triggers for guild board (likes/comments)

-- Drop existing check constraints on notifications (if any), then recreate
do $$
declare r record;
begin
  for r in (
    select conname
    from pg_constraint
    where conrelid = 'public.notifications'::regclass and contype = 'c'
  ) loop
    execute format('alter table public.notifications drop constraint if exists %I', r.conname);
  end loop;
end $$;
alter table public.notifications
  add constraint notifications_type_check
  check (type in (
    'diary_like',
    'diary_comment',
    'comment_thread_reply',
    'guild_post_like',
    'guild_post_comment'
  ));

-- 2) Create notification on guild post like
create or replace function public.notify_on_guild_post_like() returns trigger
  language plpgsql
  security definer
as $$
begin
  -- Notify post owner except self-like
  insert into public.notifications (user_id, actor_id, type)
  select gp.user_id, new.user_id, 'guild_post_like'
  from public.guild_posts gp
  where gp.id = new.post_id
    and gp.user_id <> new.user_id;
  return new;
end;
$$;
alter function public.notify_on_guild_post_like owner to postgres;

-- 3) Trigger for likes
drop trigger if exists trg_notify_on_guild_post_like on public.guild_post_likes;
create trigger trg_notify_on_guild_post_like
after insert on public.guild_post_likes
for each row execute function public.notify_on_guild_post_like();

-- 4) Create notification on guild post comment
create or replace function public.notify_on_guild_post_comment() returns trigger
  language plpgsql
  security definer
as $$
begin
  -- Notify post owner except self-comment
  insert into public.notifications (user_id, actor_id, type)
  select gp.user_id, new.user_id, 'guild_post_comment'
  from public.guild_posts gp
  where gp.id = new.post_id
    and gp.user_id <> new.user_id;
  return new;
end;
$$;
alter function public.notify_on_guild_post_comment owner to postgres;

-- 5) Trigger for comments
drop trigger if exists trg_notify_on_guild_post_comment on public.guild_post_comments;
create trigger trg_notify_on_guild_post_comment
after insert on public.guild_post_comments
for each row execute function public.notify_on_guild_post_comment();

