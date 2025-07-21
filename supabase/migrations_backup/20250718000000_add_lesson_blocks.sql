-- レッスンのブロック管理機能を追加
-- 2025-01-18

-- lessonsテーブルにblock_numberカラムを追加
alter table public.lessons 
add column if not exists block_number integer not null default 1;

-- user_lesson_progressテーブルにis_unlockedカラムを追加
alter table public.user_lesson_progress 
add column if not exists is_unlocked boolean not null default false;

-- 既存のレッスンをブロックに振り分ける（order_indexを元に5つずつのブロックに分ける）
update public.lessons
set block_number = ceil((order_index + 1)::numeric / 5);

-- ブロック1（レッスン1-5）をデフォルトで解放する
update public.user_lesson_progress ulp
set is_unlocked = true
where exists (
  select 1 
  from public.lessons l 
  where l.id = ulp.lesson_id 
  and l.block_number = 1
);

-- 新しいユーザーがレッスン進捗を作成する際にブロック1を自動解放するトリガー
create or replace function public.auto_unlock_block_one()
returns trigger
language plpgsql
security definer
as $$
declare
  lesson_block integer;
begin
  -- レッスンのブロック番号を取得
  select block_number into lesson_block
  from public.lessons
  where id = new.lesson_id;
  
  -- ブロック1なら自動的に解放
  if lesson_block = 1 then
    new.is_unlocked := true;
  end if;
  
  return new;
end;
$$;

-- トリガーをuser_lesson_progressテーブルに適用
drop trigger if exists auto_unlock_block_one_trigger on public.user_lesson_progress;
create trigger auto_unlock_block_one_trigger
  before insert on public.user_lesson_progress
  for each row
  execute function public.auto_unlock_block_one();

-- ブロック完了時に次のブロックを解放する関数
create or replace function public.unlock_next_block(
  p_user_id uuid,
  p_course_id uuid,
  p_completed_block integer
)
returns void
language plpgsql
security definer
as $$
begin
  -- 次のブロックのレッスンを解放
  update public.user_lesson_progress ulp
  set is_unlocked = true,
      updated_at = now()
  where ulp.user_id = p_user_id
    and ulp.course_id = p_course_id
    and exists (
      select 1
      from public.lessons l
      where l.id = ulp.lesson_id
        and l.block_number = p_completed_block + 1
    );
end;
$$;

-- ブロックの完了状態を確認する関数
create or replace function public.check_block_completion(
  p_user_id uuid,
  p_course_id uuid,
  p_block_number integer
)
returns boolean
language plpgsql
security definer
as $$
declare
  total_lessons integer;
  completed_lessons integer;
begin
  -- ブロック内のレッスン総数
  select count(*)
  into total_lessons
  from public.lessons l
  where l.course_id = p_course_id
    and l.block_number = p_block_number;
  
  -- ブロック内の完了済みレッスン数
  select count(*)
  into completed_lessons
  from public.user_lesson_progress ulp
  join public.lessons l on l.id = ulp.lesson_id
  where ulp.user_id = p_user_id
    and ulp.course_id = p_course_id
    and l.block_number = p_block_number
    and ulp.completed = true;
  
  -- 全レッスンが完了していればtrue
  return total_lessons > 0 and total_lessons = completed_lessons;
end;
$$;

-- RLSポリシーの更新（管理者は他のユーザーの進捗も更新可能）
drop policy if exists "lesson_progress_owner_modify" on public.user_lesson_progress;

create policy "lesson_progress_user_or_admin_modify" on public.user_lesson_progress
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

-- 管理者は全てのユーザーの進捗を参照可能
drop policy if exists "lesson_progress_owner_select" on public.user_lesson_progress;

create policy "lesson_progress_user_or_admin_select" on public.user_lesson_progress
  for select
  using (
    auth.uid() = user_id 
    or exists (
      select 1 from public.profiles 
      where id = auth.uid() and is_admin = true
    )
  );

-- インデックスの追加
create index if not exists lessons_block_idx on public.lessons (course_id, block_number);
create index if not exists lesson_progress_unlocked_idx on public.user_lesson_progress (user_id, course_id, is_unlocked); 