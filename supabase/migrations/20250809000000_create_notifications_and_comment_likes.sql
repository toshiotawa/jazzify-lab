-- Create notifications table
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,              -- recipient
  actor_id uuid not null,             -- who performed the action
  type text not null check (type in ('diary_like','diary_comment','comment_thread_reply')),
  diary_id uuid,
  comment_id uuid,
  created_at timestamptz not null default now(),
  read boolean not null default false
);

alter table public.notifications owner to postgres;

-- Foreign keys
alter table public.notifications
  add constraint notifications_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;

alter table public.notifications
  add constraint notifications_actor_id_fkey foreign key (actor_id) references auth.users(id) on delete cascade;

alter table public.notifications
  add constraint notifications_diary_id_fkey foreign key (diary_id) references public.practice_diaries(id) on delete cascade;

alter table public.notifications
  add constraint notifications_comment_id_fkey foreign key (comment_id) references public.diary_comments(id) on delete cascade;

-- comment_likes table
create table if not exists public.comment_likes (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  unique(comment_id, user_id)
);

alter table public.comment_likes owner to postgres;

alter table public.comment_likes
  add constraint comment_likes_comment_id_fkey foreign key (comment_id) references public.diary_comments(id) on delete cascade;

alter table public.comment_likes
  add constraint comment_likes_user_id_fkey foreign key (user_id) references auth.users(id) on delete cascade;

-- RLS
alter table public.notifications enable row level security;

create policy notifications_select_own on public.notifications
  for select using (auth.uid() = user_id);

-- Inserts are from triggers with SECURITY DEFINER, so we do not allow direct inserts by clients

alter table public.comment_likes enable row level security;

create policy comment_likes_select_all on public.comment_likes
  for select using (true);

create policy comment_likes_insert_own on public.comment_likes
  for insert with check (auth.uid() = user_id);

create policy comment_likes_delete_own on public.comment_likes
  for delete using (auth.uid() = user_id);

-- Functions and triggers to create notifications
create or replace function public.notify_on_diary_like() returns trigger
  language plpgsql
  security definer
as $$
begin
  -- Find diary owner
  perform 1 from public.practice_diaries where id = new.diary_id;
  -- Insert notification to diary owner except self-like (should be prevented by app but double-check)
  insert into public.notifications (user_id, actor_id, type, diary_id)
  select pd.user_id, new.user_id, 'diary_like', new.diary_id
  from public.practice_diaries pd
  where pd.id = new.diary_id
    and pd.user_id <> new.user_id;
  return new;
end;
$$;

alter function public.notify_on_diary_like owner to postgres;

drop trigger if exists trg_notify_on_diary_like on public.diary_likes;
create trigger trg_notify_on_diary_like
after insert on public.diary_likes
for each row execute function public.notify_on_diary_like();

create or replace function public.notify_on_diary_comment() returns trigger
  language plpgsql
  security definer
as $$
begin
  -- Notify diary owner (if commenter is not owner)
  insert into public.notifications (user_id, actor_id, type, diary_id, comment_id)
  select pd.user_id, new.user_id, 'diary_comment', new.diary_id, new.id
  from public.practice_diaries pd
  where pd.id = new.diary_id
    and pd.user_id <> new.user_id;

  -- Notify other commenters in the same thread (excluding actor and diary owner)
  insert into public.notifications (user_id, actor_id, type, diary_id, comment_id)
  select distinct dc.user_id, new.user_id, 'comment_thread_reply', new.diary_id, new.id
  from public.diary_comments dc
  join public.practice_diaries pd on pd.id = new.diary_id
  where dc.diary_id = new.diary_id
    and dc.user_id <> new.user_id
    and dc.user_id <> pd.user_id;

  return new;
end;
$$;

alter function public.notify_on_diary_comment owner to postgres;

drop trigger if exists trg_notify_on_diary_comment on public.diary_comments;
create trigger trg_notify_on_diary_comment
after insert on public.diary_comments
for each row execute function public.notify_on_diary_comment();