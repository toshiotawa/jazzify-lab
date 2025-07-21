-- 管理者RPC関数の修正：レッスン進捗データの破壊を防ぐ
-- 2025-01-20

-- 管理者による強制ロック関数（修正版）
-- user_lesson_progressの操作を削除し、user_course_progressのみ操作
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

  -- コース進捗をロック状態に更新（レッスン進捗は変更しない）
  insert into public.user_course_progress
        (user_id, course_id, is_unlocked, locked_at, updated_at)
  values (p_user_id, p_course_id, false, now(), now())
  on conflict (user_id, course_id)
  do update set 
    is_unlocked = false,
    locked_at = now(),
    updated_at = now();
end;
$$;

-- 管理者による強制アンロック関数（修正版）
-- user_lesson_progressの操作を削除し、user_course_progressのみ操作
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

  -- コース進捗をアンロック状態に更新（レッスン進捗は変更しない）
  insert into public.user_course_progress
        (user_id, course_id, is_unlocked, unlocked_at, updated_at)
  values (p_user_id, p_course_id, true, now(), now())
  on conflict (user_id, course_id)
  do update set 
    is_unlocked = true,
    unlocked_at = now(),
    updated_at = now();
end;
$$;