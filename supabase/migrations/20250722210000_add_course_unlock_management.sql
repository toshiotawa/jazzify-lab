-- 管理者によるコース単位ロック/アンロック機能
-- 2025-01-19

-- user_course_progressテーブルを作成
-- コースレベルのアンロック状態を管理
create table if not exists public.user_course_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  is_unlocked boolean not null default false,
  locked_at timestamptz,
  unlocked_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (user_id, course_id)
);

-- RLS有効化
alter table public.user_course_progress enable row level security;

-- RLSポリシー: 本人または管理者のみ参照可能
create policy "course_progress_user_or_admin_select" on public.user_course_progress
  for select
  using (
    auth.uid() = user_id 
    or exists (
      select 1 from public.profiles 
      where id = auth.uid() and is_admin = true
    )
  );

-- RLSポリシー: 本人または管理者のみ変更可能
create policy "course_progress_user_or_admin_modify" on public.user_course_progress
  for all
  using (
    auth.uid() = user_id 
    or exists (
      select 1 from public.profiles 
      where id = auth.uid() and is_admin = true
    )
  )
  with check (
    auth.uid() = user_id 
    or exists (
      select 1 from public.profiles 
      where id = auth.uid() and is_admin = true
    )
  );

-- インデックス作成
create index if not exists user_course_progress_user_idx 
  on public.user_course_progress (user_id);
create index if not exists user_course_progress_course_idx 
  on public.user_course_progress (course_id);
create index if not exists user_course_progress_unlocked_idx 
  on public.user_course_progress (user_id, course_id, is_unlocked);

-- 管理者による強制ロック関数
create or replace function public.admin_lock_course(
  p_user_id uuid, 
  p_course_id uuid
)
returns void
language plpgsql
security definer
as $$
begin
  -- 管理者権限チェック
  if not exists (
    select 1 from public.profiles 
    where id = auth.uid() and is_admin = true
  ) then
    raise exception 'Admin access required';
  end if;

  -- コース進捗をロック状態に更新
  insert into public.user_course_progress
        (user_id, course_id, is_unlocked, locked_at, updated_at)
  values (p_user_id, p_course_id, false, now(), now())
  on conflict (user_id, course_id)
  do update set 
    is_unlocked = false,
    locked_at = now(),
    updated_at = now();

  -- そのコースの全レッスンをロック
  update public.user_lesson_progress
     set is_unlocked = false,
         updated_at = now()
   where user_id = p_user_id and course_id = p_course_id;
end;
$$;

-- 管理者による強制アンロック関数
create or replace function public.admin_unlock_course(
  p_user_id uuid, 
  p_course_id uuid
)
returns void
language plpgsql
security definer
as $$
begin
  -- 管理者権限チェック
  if not exists (
    select 1 from public.profiles 
    where id = auth.uid() and is_admin = true
  ) then
    raise exception 'Admin access required';
  end if;

  -- コース進捗をアンロック状態に更新
  insert into public.user_course_progress
        (user_id, course_id, is_unlocked, unlocked_at, updated_at)
  values (p_user_id, p_course_id, true, now(), now())
  on conflict (user_id, course_id)
  do update set 
    is_unlocked = true,
    unlocked_at = now(),
    updated_at = now();

  -- ブロック1のレッスンを解放
  insert into public.user_lesson_progress (user_id, lesson_id, course_id, is_unlocked, updated_at)
  select p_user_id, l.id, l.course_id, true, now()
    from public.lessons l
   where l.course_id = p_course_id and l.block_number = 1
  on conflict (user_id, lesson_id)
  do update set 
    is_unlocked = true,
    updated_at = now();
end;
$$;

-- 前提条件達成時の自動アンロック関数
create or replace function public.unlock_course_for_user(
  p_user_id uuid, 
  p_course_id uuid
)
returns void
language plpgsql
security definer
as $$
begin
  -- コース進捗をアンロック状態に更新（管理者ロック後でも上書き）
  insert into public.user_course_progress
        (user_id, course_id, is_unlocked, unlocked_at, updated_at)
  values (p_user_id, p_course_id, true, now(), now())
  on conflict (user_id, course_id)
  do update set 
    is_unlocked = true,
    unlocked_at = now(),
    updated_at = now();

  -- ブロック1のレッスンを解放
  insert into public.user_lesson_progress (user_id, lesson_id, course_id, is_unlocked, updated_at)
  select p_user_id, l.id, l.course_id, true, now()
    from public.lessons l
   where l.course_id = p_course_id and l.block_number = 1
  on conflict (user_id, lesson_id)
  do update set 
    is_unlocked = true,
    updated_at = now();
end;
$$;

-- 前提条件チェックおよび依存コースの自動アンロック関数
create or replace function public.unlock_dependent_courses(
  p_user_id uuid
)
returns void
language plpgsql
security definer
as $$
declare
  course_record record;
  prerequisite_record record;
  all_prerequisites_met boolean;
begin
  -- 全コースをチェック
  for course_record in 
    select id from public.courses
  loop
    all_prerequisites_met := true;
    
    -- 前提条件をチェック
    for prerequisite_record in
      select prerequisite_course_id 
      from public.course_prerequisites 
      where course_id = course_record.id
    loop
      -- 前提コースが完了しているかチェック
      if not exists (
        select 1 
        from public.user_lesson_progress ulp
        join public.lessons l on l.id = ulp.lesson_id
        where ulp.user_id = p_user_id 
          and l.course_id = prerequisite_record.prerequisite_course_id
          and ulp.completed = true
        group by l.course_id
        having count(*) = (
          select count(*) 
          from public.lessons 
          where course_id = prerequisite_record.prerequisite_course_id
        )
      ) then
        all_prerequisites_met := false;
        exit;
      end if;
    end loop;
    
    -- 前提条件が満たされていればコースをアンロック
    if all_prerequisites_met then
      perform public.unlock_course_for_user(p_user_id, course_record.id);
    end if;
  end loop;
end;
$$;

-- updated_atトリガー
create trigger user_course_progress_updated_at
  before update on public.user_course_progress
  for each row
  execute function public.handle_updated_at();

-- 権限設定
grant usage on schema public to anon, authenticated, service_role;
grant all on public.user_course_progress to anon, authenticated, service_role;
grant execute on function public.admin_lock_course to authenticated, service_role;
grant execute on function public.admin_unlock_course to authenticated, service_role;
grant execute on function public.unlock_course_for_user to authenticated, service_role;
grant execute on function public.unlock_dependent_courses to authenticated, service_role;