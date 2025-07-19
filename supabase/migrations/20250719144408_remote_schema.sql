create table "public"."course_prerequisites" (
    "course_id" uuid not null,
    "prerequisite_course_id" uuid not null,
    "created_at" timestamp with time zone not null default now()
);


alter table "public"."course_prerequisites" enable row level security;

CREATE UNIQUE INDEX course_prerequisites_pkey ON public.course_prerequisites USING btree (course_id, prerequisite_course_id);

CREATE INDEX idx_course_prerequisites_course_id ON public.course_prerequisites USING btree (course_id);

CREATE INDEX idx_course_prerequisites_prerequisite_id ON public.course_prerequisites USING btree (prerequisite_course_id);

alter table "public"."course_prerequisites" add constraint "course_prerequisites_pkey" PRIMARY KEY using index "course_prerequisites_pkey";

alter table "public"."course_prerequisites" add constraint "course_prerequisites_course_id_fkey" FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE not valid;

alter table "public"."course_prerequisites" validate constraint "course_prerequisites_course_id_fkey";

alter table "public"."course_prerequisites" add constraint "course_prerequisites_prerequisite_course_id_fkey" FOREIGN KEY (prerequisite_course_id) REFERENCES courses(id) ON DELETE CASCADE not valid;

alter table "public"."course_prerequisites" validate constraint "course_prerequisites_prerequisite_course_id_fkey";

alter table "public"."course_prerequisites" add constraint "no_self_reference" CHECK ((course_id <> prerequisite_course_id)) not valid;

alter table "public"."course_prerequisites" validate constraint "no_self_reference";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.add_xp(_user_id uuid, _gained_xp integer, _reason text DEFAULT 'unknown'::text, _song_id uuid DEFAULT NULL::uuid, _mission_multiplier numeric DEFAULT 1.0)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  _current_xp integer;
  _new_xp integer;
  _current_level integer;
  _new_level integer;
  _result json;
BEGIN
  -- Get current XP and level
  SELECT xp, level INTO _current_xp, _current_level
  FROM public.profiles
  WHERE id = _user_id;
  
  -- If user doesn't exist, return error
  IF _current_xp IS NULL THEN
    RETURN json_build_object('error', 'User not found');
  END IF;
  
  -- Calculate new XP
  _new_xp := _current_xp + _gained_xp;
  
  -- Calculate new level with new specification
  _new_level := 1;
  DECLARE
    _remaining_xp integer := _new_xp;
    _level integer := 1;
  BEGIN
    -- Level 1-5: 2000 XP per level
    WHILE _level < 5 AND _remaining_xp >= 2000 LOOP
      _remaining_xp := _remaining_xp - 2000;
      _level := _level + 1;
    END LOOP;
    
    -- Level 6-20: 20000 XP per level
    WHILE _level < 20 AND _remaining_xp >= 20000 LOOP
      _remaining_xp := _remaining_xp - 20000;
      _level := _level + 1;
    END LOOP;
    
    -- Level 21-50: 50000 XP per level
    WHILE _level < 50 AND _remaining_xp >= 50000 LOOP
      _remaining_xp := _remaining_xp - 50000;
      _level := _level + 1;
    END LOOP;
    
    -- Level 51-100: 100000 XP per level
    WHILE _level < 100 AND _remaining_xp >= 100000 LOOP
      _remaining_xp := _remaining_xp - 100000;
      _level := _level + 1;
    END LOOP;
    
    -- Level 101+: 200000 XP per level
    WHILE _remaining_xp >= 200000 LOOP
      _remaining_xp := _remaining_xp - 200000;
      _level := _level + 1;
    END LOOP;
    
    _new_level := _level;
  END;
  
  -- Update user's XP and level
  UPDATE public.profiles
  SET 
    xp = _new_xp,
    level = _new_level,
    updated_at = now()
  WHERE id = _user_id;
  
  -- Insert XP history record
  INSERT INTO public.xp_history (
    user_id,
    gained_xp,
    reason,
    song_id,
    mission_multiplier,
    created_at
  ) VALUES (
    _user_id,
    _gained_xp,
    _reason,
    _song_id,
    _mission_multiplier,
    now()
  );
  
  -- Return result
  SELECT json_build_object(
    'success', true,
    'previous_xp', _current_xp,
    'gained_xp', _gained_xp,
    'new_xp', _new_xp,
    'previous_level', _current_level,
    'new_level', _new_level,
    'level_up', _new_level > _current_level
  ) INTO _result;
  
  RETURN _result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.auto_unlock_block_one()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.check_block_completion(p_user_id uuid, p_course_id uuid, p_block_number integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.increment_diary_progress(_user_id uuid, _mission_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.user_challenge_progress (user_id, challenge_id, clear_count)
  VALUES (_user_id, _mission_id, 1)
  ON CONFLICT (user_id, challenge_id)
  DO UPDATE SET clear_count = user_challenge_progress.clear_count + 1;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.unlock_next_block(p_user_id uuid, p_course_id uuid, p_completed_block integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.update_diary_likes_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE diaries 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.diary_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE diaries 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.diary_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_lesson_requirement_progress(p_user_id uuid, p_lesson_id uuid, p_song_id uuid, p_rank text, p_clear_conditions jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_today date;
    v_clear_dates date[];
    v_clear_count integer;
    v_required_count integer;
    v_required_rank text;
    v_is_completed boolean;
    v_daily_count integer;
    v_daily_progress jsonb;
    v_today_str text;
    v_today_count integer;
    v_completed_days integer;
    v_requires_days boolean;
BEGIN
    v_today := CURRENT_DATE;
    v_today_str := v_today::text;
    
    -- clear_conditionsから必要な値を取得
    v_required_count := COALESCE((p_clear_conditions->>'count')::integer, 1);
    v_required_rank := COALESCE(p_clear_conditions->>'rank', 'B');
    v_daily_count := COALESCE((p_clear_conditions->>'daily_count')::integer, 1);
    v_requires_days := COALESCE((p_clear_conditions->>'requires_days')::boolean, false);
    
    -- 現在の進捗を取得
    SELECT clear_dates, clear_count, daily_progress 
    INTO v_clear_dates, v_clear_count, v_daily_progress
    FROM public.user_lesson_requirements_progress
    WHERE user_id = p_user_id AND lesson_id = p_lesson_id AND song_id = p_song_id;
    
    -- レコードが存在しない場合は初期化
    IF NOT FOUND THEN
        v_clear_dates := ARRAY[]::date[];
        v_clear_count := 0;
        v_daily_progress := '{}'::jsonb;
    END IF;
    
    -- daily_progressがNULLの場合は初期化
    IF v_daily_progress IS NULL THEN
        v_daily_progress := '{}'::jsonb;
    END IF;
    
    -- ランクが条件を満たしているかチェック
    IF (p_rank = 'S') OR 
       (p_rank IN ('S', 'A') AND v_required_rank IN ('A', 'B', 'C')) OR
       (p_rank IN ('S', 'A', 'B') AND v_required_rank IN ('B', 'C')) OR
       (p_rank IN ('S', 'A', 'B', 'C') AND v_required_rank = 'C') THEN
        
        IF v_requires_days THEN
            -- 日数条件の場合
            -- 今日の進捗を取得
            v_today_count := COALESCE((v_daily_progress->v_today_str->>'count')::integer, 0);
            v_today_count := v_today_count + 1;
            
            -- 今日の進捗を更新
            v_daily_progress := v_daily_progress || jsonb_build_object(
                v_today_str, jsonb_build_object(
                    'count', v_today_count,
                    'completed', v_today_count >= v_daily_count
                )
            );
            
            -- 今日の必要回数を達成した場合
            IF v_today_count = v_daily_count AND v_today != ALL(v_clear_dates) THEN
                v_clear_dates := array_append(v_clear_dates, v_today);
            END IF;
            
            -- 完了した日数をカウント
            v_completed_days := array_length(v_clear_dates, 1);
            IF v_completed_days IS NULL THEN
                v_completed_days := 0;
            END IF;
            
            -- 完了判定
            v_is_completed := v_completed_days >= v_required_count;
            
            -- 総クリア回数も更新
            v_clear_count := v_clear_count + 1;
        ELSE
            -- 回数条件の場合（従来通り）
            v_clear_count := v_clear_count + 1;
            v_is_completed := v_clear_count >= v_required_count;
            
            -- 今日のクリアがまだ記録されていない場合（互換性のため）
            IF v_today != ALL(v_clear_dates) THEN
                v_clear_dates := array_append(v_clear_dates, v_today);
            END IF;
        END IF;
    END IF;
    
    -- 進捗を更新または挿入
    INSERT INTO public.user_lesson_requirements_progress (
        user_id, lesson_id, song_id, clear_count, clear_dates, 
        best_rank, last_cleared_at, is_completed, daily_progress
    ) VALUES (
        p_user_id, p_lesson_id, p_song_id, v_clear_count, v_clear_dates,
        p_rank, now(), v_is_completed, v_daily_progress
    )
    ON CONFLICT (user_id, lesson_id, song_id)
    DO UPDATE SET
        clear_count = v_clear_count,
        clear_dates = v_clear_dates,
        best_rank = CASE 
            WHEN user_lesson_requirements_progress.best_rank IS NULL THEN p_rank
            WHEN p_rank = 'S' THEN 'S'
            WHEN p_rank = 'A' AND user_lesson_requirements_progress.best_rank != 'S' THEN 'A'
            WHEN p_rank = 'B' AND user_lesson_requirements_progress.best_rank NOT IN ('S', 'A') THEN 'B'
            ELSE user_lesson_requirements_progress.best_rank
        END,
        last_cleared_at = now(),
        is_completed = v_is_completed,
        daily_progress = v_daily_progress,
        updated_at = now();
    
    RETURN v_is_completed;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."course_prerequisites" to "anon";

grant insert on table "public"."course_prerequisites" to "anon";

grant references on table "public"."course_prerequisites" to "anon";

grant select on table "public"."course_prerequisites" to "anon";

grant trigger on table "public"."course_prerequisites" to "anon";

grant truncate on table "public"."course_prerequisites" to "anon";

grant update on table "public"."course_prerequisites" to "anon";

grant delete on table "public"."course_prerequisites" to "authenticated";

grant insert on table "public"."course_prerequisites" to "authenticated";

grant references on table "public"."course_prerequisites" to "authenticated";

grant select on table "public"."course_prerequisites" to "authenticated";

grant trigger on table "public"."course_prerequisites" to "authenticated";

grant truncate on table "public"."course_prerequisites" to "authenticated";

grant update on table "public"."course_prerequisites" to "authenticated";

grant delete on table "public"."course_prerequisites" to "service_role";

grant insert on table "public"."course_prerequisites" to "service_role";

grant references on table "public"."course_prerequisites" to "service_role";

grant select on table "public"."course_prerequisites" to "service_role";

grant trigger on table "public"."course_prerequisites" to "service_role";

grant truncate on table "public"."course_prerequisites" to "service_role";

grant update on table "public"."course_prerequisites" to "service_role";

create policy "Allow admin full access on course_prerequisites"
on "public"."course_prerequisites"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))))
with check ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


create policy "Allow authenticated users to read course_prerequisites"
on "public"."course_prerequisites"
as permissive
for select
to authenticated
using (true);



