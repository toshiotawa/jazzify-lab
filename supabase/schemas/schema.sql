

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE TYPE "public"."challenge_type" AS ENUM (
    'weekly',
    'monthly'
);


ALTER TYPE "public"."challenge_type" OWNER TO "postgres";


CREATE TYPE "public"."membership_rank" AS ENUM (
    'free',
    'standard',
    'premium',
    'platinum',
    'black'
);


ALTER TYPE "public"."membership_rank" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_xp"("_user_id" "uuid", "_gained_xp" integer, "_reason" "text" DEFAULT 'unknown'::"text", "_song_id" "uuid" DEFAULT NULL::"uuid", "_mission_multiplier" numeric DEFAULT 1.0) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  _current_xp bigint;
  _new_xp bigint;
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
  
  -- Calculate new level using updated logic
  _new_level := public.calculate_level_from_xp(_new_xp);
  
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
$$;


ALTER FUNCTION "public"."add_xp"("_user_id" "uuid", "_gained_xp" integer, "_reason" "text", "_song_id" "uuid", "_mission_multiplier" numeric) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."add_xp"("_user_id" "uuid", "_gained_xp" integer, "_reason" "text", "_song_id" "uuid", "_mission_multiplier" numeric) IS 'Adds XP to a user and maintains XP history. Uses updated level calculation: 1-10: 2k XP, 11-50: 50k XP, 51+: 100k XP per level.';



CREATE OR REPLACE FUNCTION "public"."admin_lock_course"("p_user_id" "uuid", "p_course_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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


ALTER FUNCTION "public"."admin_lock_course"("p_user_id" "uuid", "p_course_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_unlock_course"("p_user_id" "uuid", "p_course_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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


ALTER FUNCTION "public"."admin_unlock_course"("p_user_id" "uuid", "p_course_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."auto_unlock_block_one"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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


ALTER FUNCTION "public"."auto_unlock_block_one"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."calculate_level_from_xp"("total_xp" bigint) RETURNS integer
    LANGUAGE "plpgsql" IMMUTABLE
    AS $$
DECLARE
  level_counter integer := 1;
  remaining_xp bigint := total_xp;
  required_xp integer;
BEGIN
  WHILE remaining_xp > 0 LOOP
    required_xp := public.xp_to_next_level(level_counter);
    IF remaining_xp >= required_xp THEN
      remaining_xp := remaining_xp - required_xp;
      level_counter := level_counter + 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;
  
  RETURN level_counter;
END;
$$;


ALTER FUNCTION "public"."calculate_level_from_xp"("total_xp" bigint) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."calculate_level_from_xp"("total_xp" bigint) IS 'Calculates player level from total XP using new progression system.';



CREATE OR REPLACE FUNCTION "public"."check_block_completion"("p_user_id" "uuid", "p_course_id" "uuid", "p_block_number" integer) RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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


ALTER FUNCTION "public"."check_block_completion"("p_user_id" "uuid", "p_course_id" "uuid", "p_block_number" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."increment_diary_progress"("_user_id" "uuid", "_mission_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.user_challenge_progress (user_id, challenge_id, clear_count)
  VALUES (_user_id, _mission_id, 1)
  ON CONFLICT (user_id, challenge_id)
  DO UPDATE SET clear_count = user_challenge_progress.clear_count + 1;
END;
$$;


ALTER FUNCTION "public"."increment_diary_progress"("_user_id" "uuid", "_mission_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."trigger_set_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."trigger_set_timestamp"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."unlock_course_for_user"("p_user_id" "uuid", "p_course_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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


ALTER FUNCTION "public"."unlock_course_for_user"("p_user_id" "uuid", "p_course_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."unlock_dependent_courses"("p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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


ALTER FUNCTION "public"."unlock_dependent_courses"("p_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."unlock_next_block"("p_user_id" "uuid", "p_course_id" "uuid", "p_completed_block" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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


ALTER FUNCTION "public"."unlock_next_block"("p_user_id" "uuid", "p_course_id" "uuid", "p_completed_block" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_diary_likes_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
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
$$;


ALTER FUNCTION "public"."update_diary_likes_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_fantasy_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_fantasy_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_lesson_requirement_progress"("p_user_id" "uuid", "p_lesson_id" "uuid", "p_song_id" "uuid", "p_rank" "text", "p_clear_conditions" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
    v_lesson_song_id uuid;
    v_is_fantasy boolean;
    v_existing_id uuid;
BEGIN
    v_today := CURRENT_DATE;
    v_today_str := v_today::text;
    
    -- Check if this is a fantasy stage (p_song_id is actually lesson_songs.id)
    SELECT id, is_fantasy INTO v_lesson_song_id, v_is_fantasy
    FROM public.lesson_songs
    WHERE id = p_song_id
    LIMIT 1;
    
    -- If found, it's a fantasy stage
    IF FOUND THEN
        -- For fantasy stages, use lesson_song_id
        p_song_id := NULL; -- Clear song_id as it's not a real song
    ELSE
        -- For regular songs, find the lesson_song_id
        SELECT id INTO v_lesson_song_id
        FROM public.lesson_songs
        WHERE lesson_id = p_lesson_id AND song_id = p_song_id
        LIMIT 1;
    END IF;
    
    -- clear_conditionsから必要な値を取得
    v_required_count := COALESCE((p_clear_conditions->>'count')::integer, 1);
    v_required_rank := COALESCE(p_clear_conditions->>'rank', 'B');
    v_daily_count := COALESCE((p_clear_conditions->>'daily_count')::integer, 1);
    v_requires_days := COALESCE((p_clear_conditions->>'requires_days')::boolean, false);
    
    -- 既存のレコードを検索（lesson_song_idまたはsong_idで）
    SELECT id, clear_dates, clear_count, daily_progress 
    INTO v_existing_id, v_clear_dates, v_clear_count, v_daily_progress
    FROM public.user_lesson_requirements_progress
    WHERE user_id = p_user_id 
      AND lesson_id = p_lesson_id 
      AND (
        (v_lesson_song_id IS NOT NULL AND lesson_song_id = v_lesson_song_id) OR
        (p_song_id IS NOT NULL AND song_id = p_song_id)
      )
    LIMIT 1;
    
    -- レコードが存在しない場合は初期化
    IF v_existing_id IS NULL THEN
        v_clear_dates := ARRAY[]::date[];
        v_clear_count := 0;
        v_daily_progress := '{}'::jsonb;
    END IF;
    
    -- daily_progressがNULLの場合は初期化
    IF v_daily_progress IS NULL THEN
        v_daily_progress := '{}'::jsonb;
    END IF;
    
    -- ファンタジーステージの場合、またはランクが条件を満たしている場合
    IF v_is_fantasy OR
       (p_rank = 'S') OR 
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
            
            -- 完了した日数をカウント
            v_completed_days := 0;
            FOR i IN 0..(v_required_count - 1) LOOP
                IF v_daily_progress->(v_today - i)::text->>'completed' = 'true' THEN
                    v_completed_days := v_completed_days + 1;
                ELSE
                    EXIT; -- 連続していない場合は終了
                END IF;
            END LOOP;
            
            -- 今日が初めてのクリアで、かつ今日の必要回数を達成した場合
            IF NOT (v_today = ANY(v_clear_dates)) AND v_today_count >= v_daily_count THEN
                v_clear_dates := array_append(v_clear_dates, v_today);
            END IF;
            
            -- 完了判定（連続した日数が必要日数に達した場合）
            v_is_completed := v_completed_days >= v_required_count;
        ELSE
            -- 回数条件の場合
            v_clear_count := v_clear_count + 1;
            IF NOT (v_today = ANY(v_clear_dates)) THEN
                v_clear_dates := array_append(v_clear_dates, v_today);
            END IF;
            v_is_completed := v_clear_count >= v_required_count;
        END IF;
        
        -- 既存レコードがある場合は更新、ない場合は挿入
        IF v_existing_id IS NOT NULL THEN
            -- 更新
            UPDATE public.user_lesson_requirements_progress
            SET 
                clear_count = CASE WHEN v_requires_days THEN array_length(v_clear_dates, 1) ELSE v_clear_count END,
                clear_dates = v_clear_dates,
                best_rank = CASE 
                    WHEN best_rank = 'S' THEN 'S'
                    WHEN p_rank = 'S' THEN 'S'
                    WHEN best_rank = 'A' OR p_rank = 'A' THEN 'A'
                    WHEN best_rank = 'B' OR p_rank = 'B' THEN 'B'
                    ELSE p_rank
                END,
                last_cleared_at = now(),
                is_completed = v_is_completed,
                daily_progress = v_daily_progress,
                lesson_song_id = v_lesson_song_id
            WHERE id = v_existing_id;
        ELSE
            -- 挿入
            INSERT INTO public.user_lesson_requirements_progress (
                user_id, 
                lesson_id, 
                song_id,
                lesson_song_id,
                clear_count, 
                clear_dates, 
                best_rank, 
                last_cleared_at,
                is_completed,
                daily_progress
            ) VALUES (
                p_user_id, 
                p_lesson_id, 
                p_song_id, -- NULLの場合もある
                v_lesson_song_id,
                CASE WHEN v_requires_days THEN array_length(v_clear_dates, 1) ELSE v_clear_count END,
                v_clear_dates,
                p_rank,
                now(),
                v_is_completed,
                v_daily_progress
            );
        END IF;
            
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;


ALTER FUNCTION "public"."update_lesson_requirement_progress"("p_user_id" "uuid", "p_lesson_id" "uuid", "p_song_id" "uuid", "p_rank" "text", "p_clear_conditions" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_song_clear_progress"("_user_id" "uuid", "_song_id" "uuid", "_rank" "text", "_is_b_rank_plus" boolean DEFAULT false) RETURNS "json"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  _result json;
  _new_clear_count integer;
  _new_b_rank_plus_count integer;
BEGIN
  -- Update user_song_stats for general tracking
  INSERT INTO public.user_song_stats (user_id, song_id, clear_count, best_rank, last_played, b_rank_plus_count)
  VALUES (_user_id, _song_id, 1, _rank, now(), CASE WHEN _is_b_rank_plus THEN 1 ELSE 0 END)
  ON CONFLICT (user_id, song_id) 
  DO UPDATE SET 
    clear_count = user_song_stats.clear_count + 1,
    b_rank_plus_count = CASE 
      WHEN _is_b_rank_plus THEN user_song_stats.b_rank_plus_count + 1 
      ELSE user_song_stats.b_rank_plus_count 
    END,
    best_rank = CASE 
      WHEN _rank = 'S' THEN 'S'
      WHEN _rank = 'A' AND user_song_stats.best_rank != 'S' THEN 'A'
      WHEN _rank = 'B' AND user_song_stats.best_rank NOT IN ('S', 'A') THEN 'B'
      WHEN _rank = 'C' AND user_song_stats.best_rank NOT IN ('S', 'A', 'B') THEN 'C'
      ELSE user_song_stats.best_rank
    END,
    last_played = now(),
    updated_at = now()
  RETURNING clear_count, b_rank_plus_count INTO _new_clear_count, _new_b_rank_plus_count;

  -- Update user_song_progress for mission system (if needed)
  INSERT INTO public.user_song_progress (user_id, song_id, clear_count, best_rank, last_cleared_at)
  VALUES (_user_id, _song_id, 1, _rank, now())
  ON CONFLICT (user_id, song_id) 
  DO UPDATE SET 
    clear_count = user_song_progress.clear_count + 1,
    best_rank = CASE 
      WHEN _rank = 'S' THEN 'S'
      WHEN _rank = 'A' AND user_song_progress.best_rank != 'S' THEN 'A'
      WHEN _rank = 'B' AND user_song_progress.best_rank NOT IN ('S', 'A') THEN 'B'
      WHEN _rank = 'C' AND user_song_progress.best_rank NOT IN ('S', 'A', 'B') THEN 'C'
      ELSE user_song_progress.best_rank
    END,
    last_cleared_at = now(),
    updated_at = now();

  -- Return the updated counts
  SELECT json_build_object(
    'clear_count', _new_clear_count,
    'b_rank_plus_count', _new_b_rank_plus_count
  ) INTO _result;

  RETURN _result;
END;
$$;


ALTER FUNCTION "public"."update_song_clear_progress"("_user_id" "uuid", "_song_id" "uuid", "_rank" "text", "_is_b_rank_plus" boolean) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."update_song_clear_progress"("_user_id" "uuid", "_song_id" "uuid", "_rank" "text", "_is_b_rank_plus" boolean) IS 'Updates both user_song_stats and user_song_progress when a song is cleared';



CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."xp_to_next_level"("current_level" integer) RETURNS integer
    LANGUAGE "sql" IMMUTABLE
    AS $$
  SELECT CASE
    WHEN current_level <= 10 THEN 2000
    WHEN current_level <= 50 THEN 50000
    ELSE 100000
  END;
$$;


ALTER FUNCTION "public"."xp_to_next_level"("current_level" integer) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."xp_to_next_level"("current_level" integer) IS 'Returns XP required for next level based on current level.';


SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."announcements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "content" "text" NOT NULL,
    "link_url" "text",
    "link_text" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "priority" integer DEFAULT 1 NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."announcements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."challenge_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "challenge_id" "uuid" NOT NULL,
    "completed_clears" integer DEFAULT 0 NOT NULL,
    "is_completed" boolean DEFAULT false,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."challenge_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."challenge_tracks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "challenge_id" "uuid" NOT NULL,
    "song_id" "uuid" NOT NULL,
    "key_offset" integer DEFAULT 0 NOT NULL,
    "min_speed" real DEFAULT 1.0 NOT NULL,
    "min_rank" "text" DEFAULT 'B'::"text" NOT NULL,
    "clears_required" integer DEFAULT 1 NOT NULL,
    "score_mode" "text" DEFAULT 'NOTES_AND_CHORDS'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "notation_setting" "text" DEFAULT 'both'::"text" NOT NULL,
    CONSTRAINT "challenge_tracks_min_rank_check" CHECK (("min_rank" = ANY (ARRAY['S'::"text", 'A'::"text", 'B'::"text", 'C'::"text"]))),
    CONSTRAINT "challenge_tracks_score_mode_check" CHECK (("score_mode" = ANY (ARRAY['NOTES_AND_CHORDS'::"text", 'CHORDS_ONLY'::"text"])))
);


ALTER TABLE "public"."challenge_tracks" OWNER TO "postgres";


COMMENT ON COLUMN "public"."challenge_tracks"."notation_setting" IS 'Notation display mode: both, notes_chords, chords_only';



CREATE TABLE IF NOT EXISTS "public"."challenges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "type" "public"."challenge_type" NOT NULL,
    "reward_multiplier" numeric DEFAULT 1.3 NOT NULL,
    "diary_count" integer,
    "category" "text",
    "song_clear_count" integer
);


ALTER TABLE "public"."challenges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."course_prerequisites" (
    "course_id" "uuid" NOT NULL,
    "prerequisite_course_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "no_self_reference" CHECK (("course_id" <> "prerequisite_course_id"))
);


ALTER TABLE "public"."course_prerequisites" OWNER TO "postgres";


COMMENT ON TABLE "public"."course_prerequisites" IS 'コース間の前提条件を管理するテーブル。各コースに対して最大2つの前提コースを設定可能。';



COMMENT ON COLUMN "public"."course_prerequisites"."course_id" IS '前提条件が設定されるコースのID';



COMMENT ON COLUMN "public"."course_prerequisites"."prerequisite_course_id" IS '前提条件となるコースのID';



CREATE TABLE IF NOT EXISTS "public"."courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "premium_only" boolean DEFAULT true,
    "order_index" integer NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "min_rank" "public"."membership_rank" DEFAULT 'premium'::"public"."membership_rank" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."diaries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "content" "text" NOT NULL,
    "likes_count" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."diaries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."diary_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "diary_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."diary_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."diary_likes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "diary_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."diary_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."fantasy_stage_clears" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "stage_id" "uuid" NOT NULL,
    "cleared_at" timestamp with time zone DEFAULT "now"(),
    "score" integer DEFAULT 0 NOT NULL,
    "clear_type" "text" DEFAULT 'clear'::"text" NOT NULL,
    "remaining_hp" integer DEFAULT 0 NOT NULL,
    "total_questions" integer DEFAULT 0 NOT NULL,
    "correct_answers" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "fantasy_stage_clears_clear_type_check" CHECK (("clear_type" = ANY (ARRAY['clear'::"text", 'gameover'::"text"])))
);


ALTER TABLE "public"."fantasy_stage_clears" OWNER TO "postgres";


COMMENT ON TABLE "public"."fantasy_stage_clears" IS 'ファンタジーステージのクリア記録';



COMMENT ON COLUMN "public"."fantasy_stage_clears"."clear_type" IS 'clear: クリア成功, gameover: ゲームオーバー';



COMMENT ON COLUMN "public"."fantasy_stage_clears"."remaining_hp" IS 'クリア時またはゲームオーバー時の残りHP';



CREATE TABLE IF NOT EXISTS "public"."fantasy_stages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "stage_number" "text" NOT NULL,
    "name" "text" NOT NULL,
    "name_en" "text",
    "description" "text",
    "description_en" "text",
    "max_hp" integer DEFAULT 5 NOT NULL,
    "question_count" integer DEFAULT 10 NOT NULL,
    "enemy_gauge_seconds" double precision DEFAULT 5.0 NOT NULL,
    "mode" "text" DEFAULT 'single'::"text" NOT NULL,
    "allowed_chords" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "chord_progression" "jsonb" DEFAULT '[]'::"jsonb",
    "bgm_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "show_guide" boolean DEFAULT false,
    "enemy_count" integer DEFAULT 1 NOT NULL,
    "enemy_hp" integer DEFAULT 5 NOT NULL,
    "min_damage" integer DEFAULT 10 NOT NULL,
    "max_damage" integer DEFAULT 20 NOT NULL,
    "simultaneous_monster_count" integer DEFAULT 1 NOT NULL,
    "play_root_on_correct" boolean DEFAULT true NOT NULL,
    CONSTRAINT "fantasy_stages_mode_check" CHECK (("mode" = ANY (ARRAY['single'::"text", 'progression'::"text"]))),
    CONSTRAINT "fantasy_stages_simultaneous_monster_count_check" CHECK ((("simultaneous_monster_count" >= 1) AND ("simultaneous_monster_count" <= 8)))
);


ALTER TABLE "public"."fantasy_stages" OWNER TO "postgres";


COMMENT ON TABLE "public"."fantasy_stages" IS 'ファンタジーモードのステージマスタテーブル';



COMMENT ON COLUMN "public"."fantasy_stages"."stage_number" IS 'ステージ番号 (例: 1-1, 1-2, 2-1)';



COMMENT ON COLUMN "public"."fantasy_stages"."name_en" IS 'Stage name (English)';



COMMENT ON COLUMN "public"."fantasy_stages"."enemy_gauge_seconds" IS 'モンスターの行動ゲージが満タンになるまでの秒数';



COMMENT ON COLUMN "public"."fantasy_stages"."mode" IS 'single: 単一コードモード, progression: コード進行モード';



COMMENT ON COLUMN "public"."fantasy_stages"."allowed_chords" IS '許可されたコードのリスト (JSON配列)';



COMMENT ON COLUMN "public"."fantasy_stages"."chord_progression" IS 'コード進行モード時の進行パターン (JSON配列)';



COMMENT ON COLUMN "public"."fantasy_stages"."description_en" IS 'Stage description (English)';



COMMENT ON COLUMN "public"."fantasy_stages"."show_guide" IS 'ガイド表示ON/OFF設定（true: ガイド表示、false: ガイド非表示）';

COMMENT ON COLUMN "public"."fantasy_stages"."play_root_on_correct" IS '正解時にルート音を鳴らす（true: 鳴らす, false: 鳴らさない）';



CREATE TABLE IF NOT EXISTS "public"."fantasy_user_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "current_stage_number" "text" DEFAULT '1-1'::"text" NOT NULL,
    "wizard_rank" "text" DEFAULT 'F'::"text" NOT NULL,
    "total_cleared_stages" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."fantasy_user_progress" OWNER TO "postgres";


COMMENT ON TABLE "public"."fantasy_user_progress" IS 'ユーザーのファンタジーモード進捗情報';



COMMENT ON COLUMN "public"."fantasy_user_progress"."current_stage_number" IS '現在挑戦可能なステージ番号';



COMMENT ON COLUMN "public"."fantasy_user_progress"."wizard_rank" IS '魔法使いランク (F, F+, E, E+, ..., S, S+)';



CREATE TABLE IF NOT EXISTS "public"."lesson_songs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lesson_id" "uuid" NOT NULL,
    "song_id" "uuid",
    "order_index" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "clear_conditions" "jsonb",
    "is_fantasy" boolean DEFAULT false,
    "fantasy_stage_id" "uuid",
    CONSTRAINT "lesson_songs_check_fantasy_or_song" CHECK (((("is_fantasy" = true) AND ("fantasy_stage_id" IS NOT NULL) AND ("song_id" IS NULL)) OR (("is_fantasy" = false) AND ("song_id" IS NOT NULL) AND ("fantasy_stage_id" IS NULL))))
);


ALTER TABLE "public"."lesson_songs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."lesson_songs"."clear_conditions" IS 'JSON object containing clear conditions like count, requires_days, daily_count';



COMMENT ON COLUMN "public"."lesson_songs"."is_fantasy" IS 'Indicates whether this lesson item is a fantasy stage (true) or a regular song (false)';



COMMENT ON COLUMN "public"."lesson_songs"."fantasy_stage_id" IS 'Reference to fantasy_stages table when is_fantasy is true';



CREATE TABLE IF NOT EXISTS "public"."lesson_tracks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lesson_id" "uuid" NOT NULL,
    "song_id" "uuid" NOT NULL,
    "key_offset" integer DEFAULT 0 NOT NULL,
    "min_speed" real DEFAULT 1.0 NOT NULL,
    "min_rank" "text" DEFAULT 'B'::"text" NOT NULL,
    "clears_required" integer DEFAULT 1 NOT NULL,
    "score_mode" "text" DEFAULT 'NOTES_AND_CHORDS'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "lesson_tracks_min_rank_check" CHECK (("min_rank" = ANY (ARRAY['S'::"text", 'A'::"text", 'B'::"text", 'C'::"text"]))),
    CONSTRAINT "lesson_tracks_score_mode_check" CHECK (("score_mode" = ANY (ARRAY['NOTES_AND_CHORDS'::"text", 'CHORDS_ONLY'::"text"])))
);


ALTER TABLE "public"."lesson_tracks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lesson_videos" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "lesson_id" "uuid",
    "vimeo_url" "text" NOT NULL,
    "order_index" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."lesson_videos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."lessons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "course_id" "uuid",
    "title" "text" NOT NULL,
    "description" "text",
    "vimeo_video_id" "text",
    "premium_only" boolean DEFAULT true,
    "order_index" integer DEFAULT 1 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "assignment_description" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "block_number" integer DEFAULT 1 NOT NULL
);


ALTER TABLE "public"."lessons" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."practice_diaries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "content" "text" NOT NULL,
    "practice_date" "date" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "image_url" "text"
);


ALTER TABLE "public"."practice_diaries" OWNER TO "postgres";


COMMENT ON COLUMN "public"."practice_diaries"."image_url" IS 'URL of attached image for premium/platinum users (1280px max, 1MB max, WebP format)';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "avatar_url" "text",
    "member_rank" "text" DEFAULT 'FREE'::"text" NOT NULL,
    "total_exp" integer DEFAULT 0 NOT NULL,
    "is_admin" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "email" "text" NOT NULL,
    "nickname" "text" NOT NULL,
    "rank" "public"."membership_rank" DEFAULT 'free'::"public"."membership_rank" NOT NULL,
    "xp" bigint DEFAULT 0 NOT NULL,
    "next_season_xp_multiplier" numeric DEFAULT 1.0 NOT NULL,
    "level" integer DEFAULT 1 NOT NULL,
    "bio" "text",
    "twitter_handle" "text",
    "selected_title" "text" DEFAULT '音の深淵を覗きし者'::"text",
    "stripe_customer_id" "text",
    "will_cancel" boolean DEFAULT false NOT NULL,
    "cancel_date" timestamp with time zone,
    "downgrade_to" "public"."membership_rank",
    "downgrade_date" timestamp with time zone,
    CONSTRAINT "member_rank_check" CHECK (("member_rank" = ANY (ARRAY['FREE'::"text", 'STANDARD'::"text", 'PREMIUM'::"text", 'PLATINUM'::"text", 'BLACK'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."profiles"."stripe_customer_id" IS 'Stripe Customer ID for subscription management';



COMMENT ON COLUMN "public"."profiles"."will_cancel" IS 'Flag indicating subscription will be canceled at period end';



COMMENT ON COLUMN "public"."profiles"."cancel_date" IS 'Date when subscription will be canceled';



COMMENT ON COLUMN "public"."profiles"."downgrade_to" IS 'Target membership rank for downgrade at period end';



COMMENT ON COLUMN "public"."profiles"."downgrade_date" IS 'Date when subscription will be downgraded';



CREATE TABLE IF NOT EXISTS "public"."song_play_conditions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "song_id" "uuid" NOT NULL,
    "context_type" "text" NOT NULL,
    "context_id" "uuid",
    "key_offset" integer DEFAULT 0 NOT NULL,
    "min_speed" numeric DEFAULT 1.0 NOT NULL,
    "min_rank" "text" DEFAULT 'B'::"text" NOT NULL,
    "clears_required" integer DEFAULT 1 NOT NULL,
    "notation_setting" "text" DEFAULT 'both'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "check_context_id" CHECK (((("context_type" = 'general'::"text") AND ("context_id" IS NULL)) OR (("context_type" = ANY (ARRAY['mission'::"text", 'lesson'::"text"])) AND ("context_id" IS NOT NULL)))),
    CONSTRAINT "check_context_type" CHECK (("context_type" = ANY (ARRAY['mission'::"text", 'lesson'::"text", 'general'::"text"])))
);


ALTER TABLE "public"."song_play_conditions" OWNER TO "postgres";


COMMENT ON TABLE "public"."song_play_conditions" IS 'Unified table for song play conditions across missions, lessons, and general play';



COMMENT ON COLUMN "public"."song_play_conditions"."context_type" IS 'Type of context: mission, lesson, or general';



COMMENT ON COLUMN "public"."song_play_conditions"."context_id" IS 'ID of the challenge or lesson (null for general context)';



COMMENT ON COLUMN "public"."song_play_conditions"."key_offset" IS 'Transposition setting (-12 to +12)';



COMMENT ON COLUMN "public"."song_play_conditions"."min_speed" IS 'Minimum playback speed multiplier';



COMMENT ON COLUMN "public"."song_play_conditions"."min_rank" IS 'Minimum rank required (S, A, B, C, etc.)';



COMMENT ON COLUMN "public"."song_play_conditions"."clears_required" IS 'Number of clears required to complete';



COMMENT ON COLUMN "public"."song_play_conditions"."notation_setting" IS 'Notation display setting (both, chord, melody, etc.)';



CREATE TABLE IF NOT EXISTS "public"."songs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "bpm" integer,
    "difficulty" integer,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "artist" "text",
    "json_data" "jsonb" NOT NULL,
    "min_rank" "public"."membership_rank" DEFAULT 'free'::"public"."membership_rank" NOT NULL,
    "is_public" boolean DEFAULT true NOT NULL,
    "created_by" "uuid",
    "audio_url" "text",
    "xml_url" "text",
    "json_url" "text",
    "usage_type" "text" DEFAULT 'general'::"text" NOT NULL,
    CONSTRAINT "check_song_usage_type" CHECK (("usage_type" = ANY (ARRAY['general'::"text", 'lesson'::"text"]))),
    CONSTRAINT "songs_difficulty_check" CHECK ((("difficulty" >= 1) AND ("difficulty" <= 10)))
);


ALTER TABLE "public"."songs" OWNER TO "postgres";


COMMENT ON COLUMN "public"."songs"."bpm" IS 'BPM（使用しない）';



COMMENT ON COLUMN "public"."songs"."difficulty" IS '難易度（使用しない）';



COMMENT ON COLUMN "public"."songs"."json_data" IS 'JSONノーツデータ（インライン格納用、json_urlが優先）';



COMMENT ON COLUMN "public"."songs"."audio_url" IS 'MP3ファイルのURL（Supabase Storage）';



COMMENT ON COLUMN "public"."songs"."xml_url" IS 'MusicXMLファイルのURL（Supabase Storage）';



COMMENT ON COLUMN "public"."songs"."json_url" IS 'JSONノーツデータファイルのURL（Supabase Storage）';



CREATE TABLE IF NOT EXISTS "public"."track_clears" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "song_id" "uuid" NOT NULL,
    "speed" real DEFAULT 1.0 NOT NULL,
    "key_offset" integer DEFAULT 0 NOT NULL,
    "score_rank" "text" NOT NULL,
    "exp_earned" integer DEFAULT 0 NOT NULL,
    "played_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "track_clears_score_rank_check" CHECK (("score_rank" = ANY (ARRAY['S'::"text", 'A'::"text", 'B'::"text", 'C'::"text"])))
);


ALTER TABLE "public"."track_clears" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_challenge_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "challenge_id" "uuid",
    "clear_count" integer DEFAULT 0 NOT NULL,
    "completed" boolean DEFAULT false NOT NULL,
    "reward_claimed" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."user_challenge_progress" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_challenge_progress" IS 'User progress tracking for challenges/missions';



COMMENT ON COLUMN "public"."user_challenge_progress"."reward_claimed" IS 'Whether the user has claimed the reward for this mission (separate from completion)';



CREATE TABLE IF NOT EXISTS "public"."user_course_progress" (
    "user_id" "uuid" NOT NULL,
    "course_id" "uuid" NOT NULL,
    "is_unlocked" boolean DEFAULT false NOT NULL,
    "locked_at" timestamp with time zone,
    "unlocked_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_course_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_lesson_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "lesson_id" "uuid",
    "course_id" "uuid",
    "completed" boolean DEFAULT false NOT NULL,
    "completion_date" timestamp with time zone,
    "unlock_date" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_unlocked" boolean DEFAULT false NOT NULL
);


ALTER TABLE "public"."user_lesson_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_lesson_requirements_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "lesson_id" "uuid" NOT NULL,
    "song_id" "uuid",
    "clear_count" integer DEFAULT 0 NOT NULL,
    "clear_dates" "date"[] DEFAULT '{}'::"date"[] NOT NULL,
    "best_rank" "text",
    "last_cleared_at" timestamp with time zone,
    "is_completed" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "daily_progress" "jsonb" DEFAULT '{}'::"jsonb",
    "lesson_song_id" "uuid"
);


ALTER TABLE "public"."user_lesson_requirements_progress" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_song_play_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "song_id" "uuid" NOT NULL,
    "context_type" "text" NOT NULL,
    "context_id" "uuid",
    "clear_count" integer DEFAULT 0 NOT NULL,
    "best_rank" "text",
    "best_score" integer,
    "last_cleared_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "check_context_id" CHECK (((("context_type" = 'general'::"text") AND ("context_id" IS NULL)) OR (("context_type" = ANY (ARRAY['mission'::"text", 'lesson'::"text"])) AND ("context_id" IS NOT NULL)))),
    CONSTRAINT "check_context_type" CHECK (("context_type" = ANY (ARRAY['mission'::"text", 'lesson'::"text", 'general'::"text"])))
);


ALTER TABLE "public"."user_song_play_progress" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_song_play_progress" IS 'Unified table for user song play progress across missions, lessons, and general play';



COMMENT ON COLUMN "public"."user_song_play_progress"."context_type" IS 'Type of context: mission, lesson, or general';



COMMENT ON COLUMN "public"."user_song_play_progress"."context_id" IS 'ID of the challenge or lesson (null for general context)';



COMMENT ON COLUMN "public"."user_song_play_progress"."clear_count" IS 'Number of times the song has been cleared in this context';



COMMENT ON COLUMN "public"."user_song_play_progress"."best_rank" IS 'Best rank achieved in this context (S, A, B, C, etc.)';



COMMENT ON COLUMN "public"."user_song_play_progress"."best_score" IS 'Best score achieved in this context';



COMMENT ON COLUMN "public"."user_song_play_progress"."last_cleared_at" IS 'Timestamp of the last clear in this context';



CREATE TABLE IF NOT EXISTS "public"."user_song_progress" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "song_id" "uuid",
    "clear_count" integer DEFAULT 0 NOT NULL,
    "best_rank" "text",
    "last_cleared_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_song_progress" OWNER TO "postgres";


COMMENT ON TABLE "public"."user_song_progress" IS 'Individual song progress tracking for mission system';



CREATE TABLE IF NOT EXISTS "public"."user_song_stats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "song_id" "uuid",
    "best_rank" "text",
    "best_score" integer,
    "clear_count" integer DEFAULT 0 NOT NULL,
    "last_played" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "b_rank_plus_count" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."user_song_stats" OWNER TO "postgres";


COMMENT ON COLUMN "public"."user_song_stats"."b_rank_plus_count" IS 'Count of clears with B-rank or higher (for normal songs)';



CREATE TABLE IF NOT EXISTS "public"."xp_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "song_id" "uuid",
    "gained_xp" integer NOT NULL,
    "base_xp" integer NOT NULL,
    "speed_multiplier" numeric NOT NULL,
    "rank_multiplier" numeric NOT NULL,
    "transpose_multiplier" numeric NOT NULL,
    "membership_multiplier" numeric NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "mission_multiplier" numeric DEFAULT 1.0 NOT NULL,
    "reason" "text" DEFAULT 'unknown'::"text" NOT NULL
);


ALTER TABLE "public"."xp_history" OWNER TO "postgres";


COMMENT ON COLUMN "public"."xp_history"."reason" IS 'The reason for XP gain (e.g., mission_clear, song_complete, etc.)';



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."challenge_progress"
    ADD CONSTRAINT "challenge_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."challenge_progress"
    ADD CONSTRAINT "challenge_progress_user_id_challenge_id_key" UNIQUE ("user_id", "challenge_id");



ALTER TABLE ONLY "public"."challenge_tracks"
    ADD CONSTRAINT "challenge_tracks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."challenges"
    ADD CONSTRAINT "challenges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."course_prerequisites"
    ADD CONSTRAINT "course_prerequisites_pkey" PRIMARY KEY ("course_id", "prerequisite_course_id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."diaries"
    ADD CONSTRAINT "diaries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."diaries"
    ADD CONSTRAINT "diaries_user_id_date_key" UNIQUE ("user_id", "date");



ALTER TABLE ONLY "public"."diary_comments"
    ADD CONSTRAINT "diary_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."diary_likes"
    ADD CONSTRAINT "diary_likes_diary_id_user_id_key" UNIQUE ("diary_id", "user_id");



ALTER TABLE ONLY "public"."diary_likes"
    ADD CONSTRAINT "diary_likes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fantasy_stage_clears"
    ADD CONSTRAINT "fantasy_stage_clears_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fantasy_stage_clears"
    ADD CONSTRAINT "fantasy_stage_clears_user_id_stage_id_key" UNIQUE ("user_id", "stage_id");



ALTER TABLE ONLY "public"."fantasy_stages"
    ADD CONSTRAINT "fantasy_stages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fantasy_stages"
    ADD CONSTRAINT "fantasy_stages_stage_number_key" UNIQUE ("stage_number");



ALTER TABLE ONLY "public"."fantasy_user_progress"
    ADD CONSTRAINT "fantasy_user_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."fantasy_user_progress"
    ADD CONSTRAINT "fantasy_user_progress_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."lesson_songs"
    ADD CONSTRAINT "lesson_songs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lesson_tracks"
    ADD CONSTRAINT "lesson_tracks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lesson_videos"
    ADD CONSTRAINT "lesson_videos_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."practice_diaries"
    ADD CONSTRAINT "practice_diaries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."practice_diaries"
    ADD CONSTRAINT "practice_diaries_user_id_practice_date_key" UNIQUE ("user_id", "practice_date");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."song_play_conditions"
    ADD CONSTRAINT "song_play_conditions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."song_play_conditions"
    ADD CONSTRAINT "song_play_conditions_song_id_context_type_context_id_key" UNIQUE ("song_id", "context_type", "context_id");



ALTER TABLE ONLY "public"."songs"
    ADD CONSTRAINT "songs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."track_clears"
    ADD CONSTRAINT "track_clears_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_challenge_progress"
    ADD CONSTRAINT "user_challenge_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_challenge_progress"
    ADD CONSTRAINT "user_challenge_progress_user_id_challenge_id_key" UNIQUE ("user_id", "challenge_id");



ALTER TABLE ONLY "public"."user_course_progress"
    ADD CONSTRAINT "user_course_progress_pkey" PRIMARY KEY ("user_id", "course_id");



ALTER TABLE ONLY "public"."user_lesson_progress"
    ADD CONSTRAINT "user_lesson_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_lesson_progress"
    ADD CONSTRAINT "user_lesson_progress_user_id_lesson_id_key" UNIQUE ("user_id", "lesson_id");



ALTER TABLE ONLY "public"."user_lesson_requirements_progress"
    ADD CONSTRAINT "user_lesson_requirements_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_lesson_requirements_progress"
    ADD CONSTRAINT "user_lesson_requirements_unique" UNIQUE ("user_id", "lesson_id", "song_id");



ALTER TABLE ONLY "public"."user_song_play_progress"
    ADD CONSTRAINT "user_song_play_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_song_play_progress"
    ADD CONSTRAINT "user_song_play_progress_user_id_song_id_context_type_contex_key" UNIQUE ("user_id", "song_id", "context_type", "context_id");



ALTER TABLE ONLY "public"."user_song_progress"
    ADD CONSTRAINT "user_song_progress_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_song_progress"
    ADD CONSTRAINT "user_song_progress_user_id_song_id_key" UNIQUE ("user_id", "song_id");



ALTER TABLE ONLY "public"."user_song_stats"
    ADD CONSTRAINT "user_song_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_song_stats"
    ADD CONSTRAINT "user_song_stats_user_id_song_id_key" UNIQUE ("user_id", "song_id");



ALTER TABLE ONLY "public"."xp_history"
    ADD CONSTRAINT "xp_history_pkey" PRIMARY KEY ("id");



CREATE INDEX "announcements_active_idx" ON "public"."announcements" USING "btree" ("is_active", "priority", "created_at");



CREATE INDEX "announcements_created_by_idx" ON "public"."announcements" USING "btree" ("created_by");



CREATE INDEX "fantasy_stage_clears_cleared_at_idx" ON "public"."fantasy_stage_clears" USING "btree" ("cleared_at");



CREATE INDEX "fantasy_stage_clears_stage_id_idx" ON "public"."fantasy_stage_clears" USING "btree" ("stage_id");



CREATE INDEX "fantasy_stage_clears_user_id_idx" ON "public"."fantasy_stage_clears" USING "btree" ("user_id");



CREATE INDEX "fantasy_stages_stage_number_idx" ON "public"."fantasy_stages" USING "btree" ("stage_number");



CREATE INDEX "fantasy_user_progress_user_id_idx" ON "public"."fantasy_user_progress" USING "btree" ("user_id");



CREATE INDEX "idx_course_prerequisites_course_id" ON "public"."course_prerequisites" USING "btree" ("course_id");



CREATE INDEX "idx_course_prerequisites_prerequisite_id" ON "public"."course_prerequisites" USING "btree" ("prerequisite_course_id");



CREATE INDEX "idx_lesson_requirements_completion" ON "public"."user_lesson_requirements_progress" USING "btree" ("user_id", "lesson_id", "is_completed");



CREATE INDEX "idx_lesson_requirements_lesson" ON "public"."user_lesson_requirements_progress" USING "btree" ("lesson_id");



CREATE INDEX "idx_lesson_requirements_user" ON "public"."user_lesson_requirements_progress" USING "btree" ("user_id");



CREATE INDEX "idx_lesson_songs_fantasy_stage_id" ON "public"."lesson_songs" USING "btree" ("fantasy_stage_id") WHERE ("fantasy_stage_id" IS NOT NULL);



CREATE INDEX "idx_lesson_songs_lesson_id" ON "public"."lesson_songs" USING "btree" ("lesson_id");



CREATE INDEX "idx_lesson_songs_song_id" ON "public"."lesson_songs" USING "btree" ("song_id");



CREATE UNIQUE INDEX "idx_lesson_songs_unique_content" ON "public"."lesson_songs" USING "btree" ("lesson_id", "song_id") WHERE ("song_id" IS NOT NULL);



CREATE UNIQUE INDEX "idx_lesson_songs_unique_fantasy" ON "public"."lesson_songs" USING "btree" ("lesson_id", "fantasy_stage_id") WHERE ("fantasy_stage_id" IS NOT NULL);



CREATE UNIQUE INDEX "idx_profiles_stripe_customer_id" ON "public"."profiles" USING "btree" ("stripe_customer_id") WHERE ("stripe_customer_id" IS NOT NULL);



CREATE INDEX "idx_song_play_conditions_context" ON "public"."song_play_conditions" USING "btree" ("context_type", "context_id");



CREATE INDEX "idx_song_play_conditions_song_context" ON "public"."song_play_conditions" USING "btree" ("song_id", "context_type");



CREATE INDEX "idx_song_play_conditions_song_id" ON "public"."song_play_conditions" USING "btree" ("song_id");



CREATE INDEX "idx_songs_created_by" ON "public"."songs" USING "btree" ("created_by");



CREATE INDEX "idx_songs_is_public" ON "public"."songs" USING "btree" ("is_public");



CREATE INDEX "idx_songs_min_rank" ON "public"."songs" USING "btree" ("min_rank");



CREATE INDEX "idx_user_lesson_requirements_progress_lesson_song_id" ON "public"."user_lesson_requirements_progress" USING "btree" ("lesson_song_id");



CREATE UNIQUE INDEX "idx_user_lesson_requirements_progress_unique" ON "public"."user_lesson_requirements_progress" USING "btree" ("user_id", "lesson_id", "lesson_song_id") WHERE ("lesson_song_id" IS NOT NULL);



CREATE UNIQUE INDEX "idx_user_lesson_requirements_progress_unique_lesson_song" ON "public"."user_lesson_requirements_progress" USING "btree" ("user_id", "lesson_id", "lesson_song_id") WHERE ("lesson_song_id" IS NOT NULL);



CREATE UNIQUE INDEX "idx_user_lesson_requirements_progress_unique_song" ON "public"."user_lesson_requirements_progress" USING "btree" ("user_id", "lesson_id", "song_id") WHERE ("song_id" IS NOT NULL);



CREATE INDEX "idx_user_song_play_progress_context" ON "public"."user_song_play_progress" USING "btree" ("context_type", "context_id");



CREATE INDEX "idx_user_song_play_progress_song_id" ON "public"."user_song_play_progress" USING "btree" ("song_id");



CREATE INDEX "idx_user_song_play_progress_user_context" ON "public"."user_song_play_progress" USING "btree" ("user_id", "context_type", "context_id");



CREATE INDEX "idx_user_song_play_progress_user_id" ON "public"."user_song_play_progress" USING "btree" ("user_id");



CREATE INDEX "idx_user_song_play_progress_user_song" ON "public"."user_song_play_progress" USING "btree" ("user_id", "song_id");



CREATE INDEX "lesson_progress_completion_idx" ON "public"."user_lesson_progress" USING "btree" ("user_id", "completed", "completion_date");



CREATE INDEX "lesson_progress_course_idx" ON "public"."user_lesson_progress" USING "btree" ("user_id", "course_id");



CREATE INDEX "lesson_progress_unlocked_idx" ON "public"."user_lesson_progress" USING "btree" ("user_id", "course_id", "is_unlocked");



CREATE INDEX "lesson_progress_user_idx" ON "public"."user_lesson_progress" USING "btree" ("user_id");



CREATE INDEX "lessons_block_idx" ON "public"."lessons" USING "btree" ("course_id", "block_number");



CREATE INDEX "profiles_level_idx" ON "public"."profiles" USING "btree" ("level");



CREATE INDEX "profiles_rank_idx" ON "public"."profiles" USING "btree" ("rank");



CREATE INDEX "profiles_xp_idx" ON "public"."profiles" USING "btree" ("xp");



CREATE INDEX "progress_user_idx" ON "public"."user_challenge_progress" USING "btree" ("user_id");



CREATE INDEX "songs_created_at_idx" ON "public"."songs" USING "btree" ("created_at");



CREATE INDEX "songs_min_rank_idx" ON "public"."songs" USING "btree" ("min_rank");



CREATE INDEX "user_course_progress_course_idx" ON "public"."user_course_progress" USING "btree" ("course_id");



CREATE INDEX "user_course_progress_unlocked_idx" ON "public"."user_course_progress" USING "btree" ("user_id", "course_id", "is_unlocked");



CREATE INDEX "user_course_progress_user_idx" ON "public"."user_course_progress" USING "btree" ("user_id");



CREATE INDEX "user_song_progress_song_idx" ON "public"."user_song_progress" USING "btree" ("song_id");



CREATE INDEX "user_song_progress_user_idx" ON "public"."user_song_progress" USING "btree" ("user_id");



CREATE INDEX "user_song_progress_user_song_idx" ON "public"."user_song_progress" USING "btree" ("user_id", "song_id");



CREATE INDEX "user_song_stats_b_rank_plus_count_idx" ON "public"."user_song_stats" USING "btree" ("user_id", "b_rank_plus_count");



CREATE OR REPLACE TRIGGER "auto_unlock_block_one_trigger" BEFORE INSERT ON "public"."user_lesson_progress" FOR EACH ROW EXECUTE FUNCTION "public"."auto_unlock_block_one"();



CREATE OR REPLACE TRIGGER "diary_likes_count_trigger" AFTER INSERT OR DELETE ON "public"."diary_likes" FOR EACH ROW EXECUTE FUNCTION "public"."update_diary_likes_count"();



CREATE OR REPLACE TRIGGER "fantasy_stages_updated_at_trigger" BEFORE UPDATE ON "public"."fantasy_stages" FOR EACH ROW EXECUTE FUNCTION "public"."update_fantasy_updated_at"();



CREATE OR REPLACE TRIGGER "fantasy_user_progress_updated_at_trigger" BEFORE UPDATE ON "public"."fantasy_user_progress" FOR EACH ROW EXECUTE FUNCTION "public"."update_fantasy_updated_at"();



CREATE OR REPLACE TRIGGER "set_courses_timestamp" BEFORE UPDATE ON "public"."courses" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



CREATE OR REPLACE TRIGGER "set_lesson_requirements_progress_timestamp" BEFORE UPDATE ON "public"."user_lesson_requirements_progress" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



CREATE OR REPLACE TRIGGER "set_lessons_timestamp" BEFORE UPDATE ON "public"."lessons" FOR EACH ROW EXECUTE FUNCTION "public"."trigger_set_timestamp"();



CREATE OR REPLACE TRIGGER "update_announcements_updated_at" BEFORE UPDATE ON "public"."announcements" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_challenge_progress_updated_at" BEFORE UPDATE ON "public"."challenge_progress" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_diaries_updated_at" BEFORE UPDATE ON "public"."diaries" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_songs_updated_at" BEFORE UPDATE ON "public"."songs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_lesson_progress_updated_at" BEFORE UPDATE ON "public"."user_lesson_progress" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "update_user_song_stats_updated_at" BEFORE UPDATE ON "public"."user_song_stats" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "user_course_progress_updated_at" BEFORE UPDATE ON "public"."user_course_progress" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



ALTER TABLE ONLY "public"."announcements"
    ADD CONSTRAINT "announcements_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."challenge_progress"
    ADD CONSTRAINT "challenge_progress_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."challenge_progress"
    ADD CONSTRAINT "challenge_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."challenge_tracks"
    ADD CONSTRAINT "challenge_tracks_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."challenge_tracks"
    ADD CONSTRAINT "challenge_tracks_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."course_prerequisites"
    ADD CONSTRAINT "course_prerequisites_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."course_prerequisites"
    ADD CONSTRAINT "course_prerequisites_prerequisite_course_id_fkey" FOREIGN KEY ("prerequisite_course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."diaries"
    ADD CONSTRAINT "diaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."diary_comments"
    ADD CONSTRAINT "diary_comments_diary_id_fkey" FOREIGN KEY ("diary_id") REFERENCES "public"."practice_diaries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."diary_comments"
    ADD CONSTRAINT "diary_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."diary_likes"
    ADD CONSTRAINT "diary_likes_diary_id_fkey" FOREIGN KEY ("diary_id") REFERENCES "public"."practice_diaries"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."diary_likes"
    ADD CONSTRAINT "diary_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fantasy_stage_clears"
    ADD CONSTRAINT "fantasy_stage_clears_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "public"."fantasy_stages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fantasy_stage_clears"
    ADD CONSTRAINT "fantasy_stage_clears_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."fantasy_user_progress"
    ADD CONSTRAINT "fantasy_user_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lesson_songs"
    ADD CONSTRAINT "lesson_songs_fantasy_stage_id_fkey" FOREIGN KEY ("fantasy_stage_id") REFERENCES "public"."fantasy_stages"("id") ON DELETE RESTRICT;



ALTER TABLE ONLY "public"."lesson_songs"
    ADD CONSTRAINT "lesson_songs_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lesson_songs"
    ADD CONSTRAINT "lesson_songs_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lesson_tracks"
    ADD CONSTRAINT "lesson_tracks_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lesson_tracks"
    ADD CONSTRAINT "lesson_tracks_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lesson_videos"
    ADD CONSTRAINT "lesson_videos_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."lessons"
    ADD CONSTRAINT "lessons_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."practice_diaries"
    ADD CONSTRAINT "practice_diaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."song_play_conditions"
    ADD CONSTRAINT "song_play_conditions_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."songs"
    ADD CONSTRAINT "songs_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."track_clears"
    ADD CONSTRAINT "track_clears_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."track_clears"
    ADD CONSTRAINT "track_clears_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_challenge_progress"
    ADD CONSTRAINT "user_challenge_progress_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "public"."challenges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_challenge_progress"
    ADD CONSTRAINT "user_challenge_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_course_progress"
    ADD CONSTRAINT "user_course_progress_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_course_progress"
    ADD CONSTRAINT "user_course_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_lesson_progress"
    ADD CONSTRAINT "user_lesson_progress_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_lesson_progress"
    ADD CONSTRAINT "user_lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_lesson_progress"
    ADD CONSTRAINT "user_lesson_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_lesson_requirements_progress"
    ADD CONSTRAINT "user_lesson_requirements_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "public"."lessons"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_lesson_requirements_progress"
    ADD CONSTRAINT "user_lesson_requirements_progress_lesson_song_id_fkey" FOREIGN KEY ("lesson_song_id") REFERENCES "public"."lesson_songs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_lesson_requirements_progress"
    ADD CONSTRAINT "user_lesson_requirements_progress_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_lesson_requirements_progress"
    ADD CONSTRAINT "user_lesson_requirements_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_song_play_progress"
    ADD CONSTRAINT "user_song_play_progress_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_song_play_progress"
    ADD CONSTRAINT "user_song_play_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_song_progress"
    ADD CONSTRAINT "user_song_progress_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_song_progress"
    ADD CONSTRAINT "user_song_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_song_stats"
    ADD CONSTRAINT "user_song_stats_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_song_stats"
    ADD CONSTRAINT "user_song_stats_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."xp_history"
    ADD CONSTRAINT "xp_history_song_id_fkey" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id");



ALTER TABLE ONLY "public"."xp_history"
    ADD CONSTRAINT "xp_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Admin can manage lesson songs" ON "public"."lesson_songs" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Admin can manage song play conditions" ON "public"."song_play_conditions" USING ((( SELECT "profiles"."is_admin"
   FROM "public"."profiles"
  WHERE ("auth"."uid"() = "profiles"."id")) = true)) WITH CHECK ((( SELECT "profiles"."is_admin"
   FROM "public"."profiles"
  WHERE ("auth"."uid"() = "profiles"."id")) = true));



CREATE POLICY "Admin can read all song play progress" ON "public"."user_song_play_progress" FOR SELECT USING ((( SELECT "profiles"."is_admin"
   FROM "public"."profiles"
  WHERE ("auth"."uid"() = "profiles"."id")) = true));



CREATE POLICY "Allow admin full access on course_prerequisites" ON "public"."course_prerequisites" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Allow admin full access on courses" ON "public"."courses" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Allow admin full access on lesson_songs" ON "public"."lesson_songs" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Allow admin full access on lessons" ON "public"."lessons" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Allow authenticated users to read course_prerequisites" ON "public"."course_prerequisites" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read courses" ON "public"."courses" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read lesson_songs" ON "public"."lesson_songs" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow authenticated users to read lessons" ON "public"."lessons" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anyone can read song play conditions" ON "public"."song_play_conditions" FOR SELECT USING (true);



CREATE POLICY "Challenge tracks are viewable by everyone" ON "public"."challenge_tracks" FOR SELECT USING (true);



CREATE POLICY "Challenges are viewable by everyone" ON "public"."challenges" FOR SELECT USING (true);



CREATE POLICY "Courses are viewable by everyone" ON "public"."courses" FOR SELECT USING (true);



CREATE POLICY "Diaries are viewable by everyone" ON "public"."diaries" FOR SELECT USING (true);



CREATE POLICY "Diary comments are viewable by everyone" ON "public"."diary_comments" FOR SELECT USING (true);



CREATE POLICY "Diary likes are viewable by everyone" ON "public"."diary_likes" FOR SELECT USING (true);



CREATE POLICY "Lesson tracks are viewable by everyone" ON "public"."lesson_tracks" FOR SELECT USING (true);



CREATE POLICY "Lessons are viewable by everyone" ON "public"."lessons" FOR SELECT USING (true);



CREATE POLICY "Only admins can manage challenge tracks" ON "public"."challenge_tracks" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Only admins can manage challenges" ON "public"."challenges" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Only admins can manage courses" ON "public"."courses" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Only admins can manage lesson tracks" ON "public"."lesson_tracks" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Only admins can manage lessons" ON "public"."lessons" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Only admins can manage songs" ON "public"."songs" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "Owner can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Profiles are viewable by owner" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Songs are viewable by everyone" ON "public"."songs" FOR SELECT USING (true);



CREATE POLICY "Users can delete their own song stats" ON "public"."user_song_stats" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own requirements progress" ON "public"."user_lesson_requirements_progress" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own challenge progress" ON "public"."challenge_progress" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can insert their own song stats" ON "public"."user_song_stats" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own track clears" ON "public"."track_clears" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own diaries" ON "public"."diaries" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own diary comments" ON "public"."diary_comments" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own diary likes" ON "public"."diary_likes" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can manage their own song play progress" ON "public"."user_song_play_progress" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read their own song play progress" ON "public"."user_song_play_progress" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own requirements progress" ON "public"."user_lesson_requirements_progress" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own challenge progress" ON "public"."challenge_progress" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own song stats" ON "public"."user_song_stats" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own requirements progress" ON "public"."user_lesson_requirements_progress" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own challenge progress" ON "public"."challenge_progress" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own song stats" ON "public"."user_song_stats" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view their own track clears" ON "public"."track_clears" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."announcements" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "announcements_admin_modify" ON "public"."announcements" USING (( SELECT "profiles"."is_admin"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))) WITH CHECK (( SELECT "profiles"."is_admin"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())));



CREATE POLICY "announcements_admin_read" ON "public"."announcements" FOR SELECT USING (( SELECT "profiles"."is_admin"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"())));



CREATE POLICY "announcements_public_read" ON "public"."announcements" FOR SELECT USING (("is_active" = true));



ALTER TABLE "public"."challenge_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."challenge_tracks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."challenges" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."course_prerequisites" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "course_progress_user_or_admin_modify" ON "public"."user_course_progress" USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))))) WITH CHECK ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true))))));



CREATE POLICY "course_progress_user_or_admin_select" ON "public"."user_course_progress" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true))))));



ALTER TABLE "public"."courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."diaries" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."diary_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."diary_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."fantasy_stage_clears" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "fantasy_stage_clears_policy" ON "public"."fantasy_stage_clears" USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."is_admin" = true)))));



ALTER TABLE "public"."fantasy_stages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "fantasy_stages_read_policy" ON "public"."fantasy_stages" FOR SELECT USING (true);



CREATE POLICY "fantasy_stages_write_policy" ON "public"."fantasy_stages" USING (("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."is_admin" = true))));



ALTER TABLE "public"."fantasy_user_progress" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "fantasy_user_progress_policy" ON "public"."fantasy_user_progress" USING ((("auth"."uid"() = "user_id") OR ("auth"."uid"() IN ( SELECT "profiles"."id"
   FROM "public"."profiles"
  WHERE ("profiles"."is_admin" = true)))));



CREATE POLICY "lesson_progress_user_or_admin_modify" ON "public"."user_lesson_progress" USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))))) WITH CHECK ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true))))));



CREATE POLICY "lesson_progress_user_or_admin_select" ON "public"."user_lesson_progress" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true))))));



ALTER TABLE "public"."lesson_songs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lesson_tracks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."lessons" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "likes_delete" ON "public"."diary_likes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "likes_insert" ON "public"."diary_likes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "profiles_insert_own" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "profiles_owner_update" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "profiles_public_read" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "profiles_select" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "profiles_update" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "profiles_update_admin" ON "public"."profiles" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "profiles_1"
  WHERE (("profiles_1"."id" = "auth"."uid"()) AND ("profiles_1"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles" "profiles_1"
  WHERE (("profiles_1"."id" = "auth"."uid"()) AND ("profiles_1"."is_admin" = true)))));



CREATE POLICY "progress_owner_delete" ON "public"."user_song_progress" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "progress_owner_insert" ON "public"."user_song_progress" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "progress_owner_modify" ON "public"."user_challenge_progress" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "progress_owner_select" ON "public"."user_challenge_progress" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "progress_owner_select" ON "public"."user_song_progress" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "progress_owner_update" ON "public"."user_song_progress" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."song_play_conditions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."songs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "songs_admin_delete" ON "public"."songs" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "songs_admin_insert" ON "public"."songs" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "songs_admin_update" ON "public"."songs" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."is_admin" = true)))));



CREATE POLICY "songs_public_read" ON "public"."songs" FOR SELECT USING (true);



ALTER TABLE "public"."track_clears" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_challenge_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_course_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_lesson_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_lesson_requirements_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_song_play_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_song_progress" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_song_stats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."xp_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "xp_owner_insert" ON "public"."xp_history" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "xp_owner_select" ON "public"."xp_history" FOR SELECT USING (("auth"."uid"() = "user_id"));



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."add_xp"("_user_id" "uuid", "_gained_xp" integer, "_reason" "text", "_song_id" "uuid", "_mission_multiplier" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."add_xp"("_user_id" "uuid", "_gained_xp" integer, "_reason" "text", "_song_id" "uuid", "_mission_multiplier" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_xp"("_user_id" "uuid", "_gained_xp" integer, "_reason" "text", "_song_id" "uuid", "_mission_multiplier" numeric) TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_lock_course"("p_user_id" "uuid", "p_course_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_lock_course"("p_user_id" "uuid", "p_course_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_lock_course"("p_user_id" "uuid", "p_course_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_unlock_course"("p_user_id" "uuid", "p_course_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_unlock_course"("p_user_id" "uuid", "p_course_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_unlock_course"("p_user_id" "uuid", "p_course_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."auto_unlock_block_one"() TO "anon";
GRANT ALL ON FUNCTION "public"."auto_unlock_block_one"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."auto_unlock_block_one"() TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_level_from_xp"("total_xp" bigint) TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_level_from_xp"("total_xp" bigint) TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_level_from_xp"("total_xp" bigint) TO "service_role";



GRANT ALL ON FUNCTION "public"."check_block_completion"("p_user_id" "uuid", "p_course_id" "uuid", "p_block_number" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."check_block_completion"("p_user_id" "uuid", "p_course_id" "uuid", "p_block_number" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_block_completion"("p_user_id" "uuid", "p_course_id" "uuid", "p_block_number" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."increment_diary_progress"("_user_id" "uuid", "_mission_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."increment_diary_progress"("_user_id" "uuid", "_mission_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."increment_diary_progress"("_user_id" "uuid", "_mission_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_set_timestamp"() TO "service_role";



GRANT ALL ON FUNCTION "public"."unlock_course_for_user"("p_user_id" "uuid", "p_course_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."unlock_course_for_user"("p_user_id" "uuid", "p_course_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unlock_course_for_user"("p_user_id" "uuid", "p_course_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."unlock_dependent_courses"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."unlock_dependent_courses"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."unlock_dependent_courses"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."unlock_next_block"("p_user_id" "uuid", "p_course_id" "uuid", "p_completed_block" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."unlock_next_block"("p_user_id" "uuid", "p_course_id" "uuid", "p_completed_block" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."unlock_next_block"("p_user_id" "uuid", "p_course_id" "uuid", "p_completed_block" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_diary_likes_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_diary_likes_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_diary_likes_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_fantasy_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_fantasy_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_fantasy_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_lesson_requirement_progress"("p_user_id" "uuid", "p_lesson_id" "uuid", "p_song_id" "uuid", "p_rank" "text", "p_clear_conditions" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."update_lesson_requirement_progress"("p_user_id" "uuid", "p_lesson_id" "uuid", "p_song_id" "uuid", "p_rank" "text", "p_clear_conditions" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_lesson_requirement_progress"("p_user_id" "uuid", "p_lesson_id" "uuid", "p_song_id" "uuid", "p_rank" "text", "p_clear_conditions" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_song_clear_progress"("_user_id" "uuid", "_song_id" "uuid", "_rank" "text", "_is_b_rank_plus" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."update_song_clear_progress"("_user_id" "uuid", "_song_id" "uuid", "_rank" "text", "_is_b_rank_plus" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_song_clear_progress"("_user_id" "uuid", "_song_id" "uuid", "_rank" "text", "_is_b_rank_plus" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."xp_to_next_level"("current_level" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."xp_to_next_level"("current_level" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."xp_to_next_level"("current_level" integer) TO "service_role";



GRANT ALL ON TABLE "public"."announcements" TO "anon";
GRANT ALL ON TABLE "public"."announcements" TO "authenticated";
GRANT ALL ON TABLE "public"."announcements" TO "service_role";



GRANT ALL ON TABLE "public"."challenge_progress" TO "anon";
GRANT ALL ON TABLE "public"."challenge_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."challenge_progress" TO "service_role";



GRANT ALL ON TABLE "public"."challenge_tracks" TO "anon";
GRANT ALL ON TABLE "public"."challenge_tracks" TO "authenticated";
GRANT ALL ON TABLE "public"."challenge_tracks" TO "service_role";



GRANT ALL ON TABLE "public"."challenges" TO "anon";
GRANT ALL ON TABLE "public"."challenges" TO "authenticated";
GRANT ALL ON TABLE "public"."challenges" TO "service_role";



GRANT ALL ON TABLE "public"."course_prerequisites" TO "anon";
GRANT ALL ON TABLE "public"."course_prerequisites" TO "authenticated";
GRANT ALL ON TABLE "public"."course_prerequisites" TO "service_role";



GRANT ALL ON TABLE "public"."courses" TO "anon";
GRANT ALL ON TABLE "public"."courses" TO "authenticated";
GRANT ALL ON TABLE "public"."courses" TO "service_role";



GRANT ALL ON TABLE "public"."diaries" TO "anon";
GRANT ALL ON TABLE "public"."diaries" TO "authenticated";
GRANT ALL ON TABLE "public"."diaries" TO "service_role";



GRANT ALL ON TABLE "public"."diary_comments" TO "anon";
GRANT ALL ON TABLE "public"."diary_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."diary_comments" TO "service_role";



GRANT ALL ON TABLE "public"."diary_likes" TO "anon";
GRANT ALL ON TABLE "public"."diary_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."diary_likes" TO "service_role";



GRANT ALL ON TABLE "public"."fantasy_stage_clears" TO "anon";
GRANT ALL ON TABLE "public"."fantasy_stage_clears" TO "authenticated";
GRANT ALL ON TABLE "public"."fantasy_stage_clears" TO "service_role";



GRANT ALL ON TABLE "public"."fantasy_stages" TO "anon";
GRANT ALL ON TABLE "public"."fantasy_stages" TO "authenticated";
GRANT ALL ON TABLE "public"."fantasy_stages" TO "service_role";



GRANT ALL ON TABLE "public"."fantasy_user_progress" TO "anon";
GRANT ALL ON TABLE "public"."fantasy_user_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."fantasy_user_progress" TO "service_role";



GRANT ALL ON TABLE "public"."lesson_songs" TO "anon";
GRANT ALL ON TABLE "public"."lesson_songs" TO "authenticated";
GRANT ALL ON TABLE "public"."lesson_songs" TO "service_role";



GRANT ALL ON TABLE "public"."lesson_tracks" TO "anon";
GRANT ALL ON TABLE "public"."lesson_tracks" TO "authenticated";
GRANT ALL ON TABLE "public"."lesson_tracks" TO "service_role";



GRANT ALL ON TABLE "public"."lesson_videos" TO "anon";
GRANT ALL ON TABLE "public"."lesson_videos" TO "authenticated";
GRANT ALL ON TABLE "public"."lesson_videos" TO "service_role";



GRANT ALL ON TABLE "public"."lessons" TO "anon";
GRANT ALL ON TABLE "public"."lessons" TO "authenticated";
GRANT ALL ON TABLE "public"."lessons" TO "service_role";



GRANT ALL ON TABLE "public"."practice_diaries" TO "anon";
GRANT ALL ON TABLE "public"."practice_diaries" TO "authenticated";
GRANT ALL ON TABLE "public"."practice_diaries" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."song_play_conditions" TO "anon";
GRANT ALL ON TABLE "public"."song_play_conditions" TO "authenticated";
GRANT ALL ON TABLE "public"."song_play_conditions" TO "service_role";



GRANT ALL ON TABLE "public"."songs" TO "anon";
GRANT ALL ON TABLE "public"."songs" TO "authenticated";
GRANT ALL ON TABLE "public"."songs" TO "service_role";



GRANT ALL ON TABLE "public"."track_clears" TO "anon";
GRANT ALL ON TABLE "public"."track_clears" TO "authenticated";
GRANT ALL ON TABLE "public"."track_clears" TO "service_role";



GRANT ALL ON TABLE "public"."user_challenge_progress" TO "anon";
GRANT ALL ON TABLE "public"."user_challenge_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."user_challenge_progress" TO "service_role";



GRANT ALL ON TABLE "public"."user_course_progress" TO "anon";
GRANT ALL ON TABLE "public"."user_course_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."user_course_progress" TO "service_role";



GRANT ALL ON TABLE "public"."user_lesson_progress" TO "anon";
GRANT ALL ON TABLE "public"."user_lesson_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."user_lesson_progress" TO "service_role";



GRANT ALL ON TABLE "public"."user_lesson_requirements_progress" TO "anon";
GRANT ALL ON TABLE "public"."user_lesson_requirements_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."user_lesson_requirements_progress" TO "service_role";



GRANT ALL ON TABLE "public"."user_song_play_progress" TO "anon";
GRANT ALL ON TABLE "public"."user_song_play_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."user_song_play_progress" TO "service_role";



GRANT ALL ON TABLE "public"."user_song_progress" TO "anon";
GRANT ALL ON TABLE "public"."user_song_progress" TO "authenticated";
GRANT ALL ON TABLE "public"."user_song_progress" TO "service_role";



GRANT ALL ON TABLE "public"."user_song_stats" TO "anon";
GRANT ALL ON TABLE "public"."user_song_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."user_song_stats" TO "service_role";



GRANT ALL ON TABLE "public"."xp_history" TO "anon";
GRANT ALL ON TABLE "public"."xp_history" TO "authenticated";
GRANT ALL ON TABLE "public"."xp_history" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






RESET ALL;
