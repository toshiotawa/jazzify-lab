create extension if not exists "pgjwt" with schema "extensions";


create table "public"."challenge_progress" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "challenge_id" uuid not null,
    "completed_clears" integer not null default 0,
    "is_completed" boolean default false,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."challenge_progress" enable row level security;

create table "public"."challenge_tracks" (
    "id" uuid not null default gen_random_uuid(),
    "challenge_id" uuid not null,
    "song_id" uuid not null,
    "key_offset" integer not null default 0,
    "min_speed" real not null default 1.0,
    "min_rank" text not null default 'B'::text,
    "clears_required" integer not null default 1,
    "score_mode" text not null default 'NOTES_AND_CHORDS'::text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."challenge_tracks" enable row level security;

create table "public"."challenges" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "description" text,
    "challenge_type" text not null,
    "season_year" integer not null,
    "season_number" integer not null,
    "start_date" timestamp with time zone not null,
    "end_date" timestamp with time zone not null,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now()
);


alter table "public"."challenges" enable row level security;

create table "public"."courses" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "description" text,
    "premium_only" boolean default true,
    "order_index" integer not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."courses" enable row level security;

create table "public"."diaries" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "date" date not null,
    "content" text not null,
    "likes_count" integer not null default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."diaries" enable row level security;

create table "public"."diary_comments" (
    "id" uuid not null default gen_random_uuid(),
    "diary_id" uuid not null,
    "user_id" uuid not null,
    "content" text not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."diary_comments" enable row level security;

create table "public"."diary_likes" (
    "id" uuid not null default gen_random_uuid(),
    "diary_id" uuid not null,
    "user_id" uuid not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."diary_likes" enable row level security;

create table "public"."lesson_tracks" (
    "id" uuid not null default gen_random_uuid(),
    "lesson_id" uuid not null,
    "song_id" uuid not null,
    "key_offset" integer not null default 0,
    "min_speed" real not null default 1.0,
    "min_rank" text not null default 'B'::text,
    "clears_required" integer not null default 1,
    "score_mode" text not null default 'NOTES_AND_CHORDS'::text,
    "created_at" timestamp with time zone default now()
);


alter table "public"."lesson_tracks" enable row level security;

create table "public"."lessons" (
    "id" uuid not null default gen_random_uuid(),
    "course_id" uuid,
    "title" text not null,
    "description" text,
    "vimeo_video_id" text,
    "premium_only" boolean default true,
    "order_index" integer not null,
    "created_at" timestamp with time zone default now()
);


alter table "public"."lessons" enable row level security;

create table "public"."practice_diaries" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid,
    "content" text not null,
    "practice_date" date not null,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


create table "public"."profiles" (
    "id" uuid not null,
    "display_name" text not null,
    "avatar_url" text,
    "member_rank" text not null default 'FREE'::text,
    "total_exp" integer not null default 0,
    "is_admin" boolean not null default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "email" text not null,
    "level" text not null,
    "nickname" text not null
);


alter table "public"."profiles" enable row level security;

create table "public"."songs" (
    "id" uuid not null default gen_random_uuid(),
    "title" text not null,
    "bpm" integer not null,
    "difficulty" integer not null,
    "asset_url" text not null,
    "available_ranks" text[] default '{FREE}'::text[],
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
);


alter table "public"."songs" enable row level security;

create table "public"."track_clears" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "song_id" uuid not null,
    "speed" real not null default 1.0,
    "key_offset" integer not null default 0,
    "score_rank" text not null,
    "exp_earned" integer not null default 0,
    "played_at" timestamp with time zone default now()
);


alter table "public"."track_clears" enable row level security;

CREATE UNIQUE INDEX challenge_progress_pkey ON public.challenge_progress USING btree (id);

CREATE UNIQUE INDEX challenge_progress_user_id_challenge_id_key ON public.challenge_progress USING btree (user_id, challenge_id);

CREATE UNIQUE INDEX challenge_tracks_pkey ON public.challenge_tracks USING btree (id);

CREATE UNIQUE INDEX challenges_pkey ON public.challenges USING btree (id);

CREATE UNIQUE INDEX courses_pkey ON public.courses USING btree (id);

CREATE UNIQUE INDEX diaries_pkey ON public.diaries USING btree (id);

CREATE UNIQUE INDEX diaries_user_id_date_key ON public.diaries USING btree (user_id, date);

CREATE UNIQUE INDEX diary_comments_pkey ON public.diary_comments USING btree (id);

CREATE UNIQUE INDEX diary_likes_diary_id_user_id_key ON public.diary_likes USING btree (diary_id, user_id);

CREATE UNIQUE INDEX diary_likes_pkey ON public.diary_likes USING btree (id);

CREATE UNIQUE INDEX display_name_unique ON public.profiles USING btree (display_name);

CREATE UNIQUE INDEX lesson_tracks_pkey ON public.lesson_tracks USING btree (id);

CREATE UNIQUE INDEX lessons_pkey ON public.lessons USING btree (id);

CREATE UNIQUE INDEX practice_diaries_pkey ON public.practice_diaries USING btree (id);

CREATE UNIQUE INDEX practice_diaries_user_id_practice_date_key ON public.practice_diaries USING btree (user_id, practice_date);

CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

CREATE UNIQUE INDEX profiles_level_key ON public.profiles USING btree (level);

CREATE UNIQUE INDEX profiles_nickname_key ON public.profiles USING btree (nickname);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX songs_pkey ON public.songs USING btree (id);

CREATE UNIQUE INDEX track_clears_pkey ON public.track_clears USING btree (id);

alter table "public"."challenge_progress" add constraint "challenge_progress_pkey" PRIMARY KEY using index "challenge_progress_pkey";

alter table "public"."challenge_tracks" add constraint "challenge_tracks_pkey" PRIMARY KEY using index "challenge_tracks_pkey";

alter table "public"."challenges" add constraint "challenges_pkey" PRIMARY KEY using index "challenges_pkey";

alter table "public"."courses" add constraint "courses_pkey" PRIMARY KEY using index "courses_pkey";

alter table "public"."diaries" add constraint "diaries_pkey" PRIMARY KEY using index "diaries_pkey";

alter table "public"."diary_comments" add constraint "diary_comments_pkey" PRIMARY KEY using index "diary_comments_pkey";

alter table "public"."diary_likes" add constraint "diary_likes_pkey" PRIMARY KEY using index "diary_likes_pkey";

alter table "public"."lesson_tracks" add constraint "lesson_tracks_pkey" PRIMARY KEY using index "lesson_tracks_pkey";

alter table "public"."lessons" add constraint "lessons_pkey" PRIMARY KEY using index "lessons_pkey";

alter table "public"."practice_diaries" add constraint "practice_diaries_pkey" PRIMARY KEY using index "practice_diaries_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."songs" add constraint "songs_pkey" PRIMARY KEY using index "songs_pkey";

alter table "public"."track_clears" add constraint "track_clears_pkey" PRIMARY KEY using index "track_clears_pkey";

alter table "public"."challenge_progress" add constraint "challenge_progress_challenge_id_fkey" FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE not valid;

alter table "public"."challenge_progress" validate constraint "challenge_progress_challenge_id_fkey";

alter table "public"."challenge_progress" add constraint "challenge_progress_user_id_challenge_id_key" UNIQUE using index "challenge_progress_user_id_challenge_id_key";

alter table "public"."challenge_progress" add constraint "challenge_progress_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."challenge_progress" validate constraint "challenge_progress_user_id_fkey";

alter table "public"."challenge_tracks" add constraint "challenge_tracks_challenge_id_fkey" FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE not valid;

alter table "public"."challenge_tracks" validate constraint "challenge_tracks_challenge_id_fkey";

alter table "public"."challenge_tracks" add constraint "challenge_tracks_min_rank_check" CHECK ((min_rank = ANY (ARRAY['S'::text, 'A'::text, 'B'::text, 'C'::text]))) not valid;

alter table "public"."challenge_tracks" validate constraint "challenge_tracks_min_rank_check";

alter table "public"."challenge_tracks" add constraint "challenge_tracks_score_mode_check" CHECK ((score_mode = ANY (ARRAY['NOTES_AND_CHORDS'::text, 'CHORDS_ONLY'::text]))) not valid;

alter table "public"."challenge_tracks" validate constraint "challenge_tracks_score_mode_check";

alter table "public"."challenge_tracks" add constraint "challenge_tracks_song_id_fkey" FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE not valid;

alter table "public"."challenge_tracks" validate constraint "challenge_tracks_song_id_fkey";

alter table "public"."challenges" add constraint "challenges_challenge_type_check" CHECK ((challenge_type = ANY (ARRAY['WEEKLY'::text, 'MONTHLY'::text]))) not valid;

alter table "public"."challenges" validate constraint "challenges_challenge_type_check";

alter table "public"."diaries" add constraint "diaries_user_id_date_key" UNIQUE using index "diaries_user_id_date_key";

alter table "public"."diaries" add constraint "diaries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."diaries" validate constraint "diaries_user_id_fkey";

alter table "public"."diary_comments" add constraint "diary_comments_diary_id_fkey" FOREIGN KEY (diary_id) REFERENCES diaries(id) ON DELETE CASCADE not valid;

alter table "public"."diary_comments" validate constraint "diary_comments_diary_id_fkey";

alter table "public"."diary_comments" add constraint "diary_comments_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."diary_comments" validate constraint "diary_comments_user_id_fkey";

alter table "public"."diary_likes" add constraint "diary_likes_diary_id_fkey" FOREIGN KEY (diary_id) REFERENCES diaries(id) ON DELETE CASCADE not valid;

alter table "public"."diary_likes" validate constraint "diary_likes_diary_id_fkey";

alter table "public"."diary_likes" add constraint "diary_likes_diary_id_user_id_key" UNIQUE using index "diary_likes_diary_id_user_id_key";

alter table "public"."diary_likes" add constraint "diary_likes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."diary_likes" validate constraint "diary_likes_user_id_fkey";

alter table "public"."lesson_tracks" add constraint "lesson_tracks_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE not valid;

alter table "public"."lesson_tracks" validate constraint "lesson_tracks_lesson_id_fkey";

alter table "public"."lesson_tracks" add constraint "lesson_tracks_min_rank_check" CHECK ((min_rank = ANY (ARRAY['S'::text, 'A'::text, 'B'::text, 'C'::text]))) not valid;

alter table "public"."lesson_tracks" validate constraint "lesson_tracks_min_rank_check";

alter table "public"."lesson_tracks" add constraint "lesson_tracks_score_mode_check" CHECK ((score_mode = ANY (ARRAY['NOTES_AND_CHORDS'::text, 'CHORDS_ONLY'::text]))) not valid;

alter table "public"."lesson_tracks" validate constraint "lesson_tracks_score_mode_check";

alter table "public"."lesson_tracks" add constraint "lesson_tracks_song_id_fkey" FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE not valid;

alter table "public"."lesson_tracks" validate constraint "lesson_tracks_song_id_fkey";

alter table "public"."lessons" add constraint "lessons_course_id_fkey" FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE not valid;

alter table "public"."lessons" validate constraint "lessons_course_id_fkey";

alter table "public"."practice_diaries" add constraint "practice_diaries_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."practice_diaries" validate constraint "practice_diaries_user_id_fkey";

alter table "public"."practice_diaries" add constraint "practice_diaries_user_id_practice_date_key" UNIQUE using index "practice_diaries_user_id_practice_date_key";

alter table "public"."profiles" add constraint "display_name_unique" UNIQUE using index "display_name_unique";

alter table "public"."profiles" add constraint "member_rank_check" CHECK ((member_rank = ANY (ARRAY['FREE'::text, 'STANDARD'::text, 'PREMIUM'::text, 'PLATINUM'::text]))) not valid;

alter table "public"."profiles" validate constraint "member_rank_check";

alter table "public"."profiles" add constraint "profiles_email_key" UNIQUE using index "profiles_email_key";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."profiles" add constraint "profiles_level_key" UNIQUE using index "profiles_level_key";

alter table "public"."profiles" add constraint "profiles_nickname_key" UNIQUE using index "profiles_nickname_key";

alter table "public"."songs" add constraint "songs_difficulty_check" CHECK (((difficulty >= 1) AND (difficulty <= 10))) not valid;

alter table "public"."songs" validate constraint "songs_difficulty_check";

alter table "public"."track_clears" add constraint "track_clears_score_rank_check" CHECK ((score_rank = ANY (ARRAY['S'::text, 'A'::text, 'B'::text, 'C'::text]))) not valid;

alter table "public"."track_clears" validate constraint "track_clears_score_rank_check";

alter table "public"."track_clears" add constraint "track_clears_song_id_fkey" FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE not valid;

alter table "public"."track_clears" validate constraint "track_clears_song_id_fkey";

alter table "public"."track_clears" add constraint "track_clears_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."track_clears" validate constraint "track_clears_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'display_name');
  RETURN new;
END;
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

grant delete on table "public"."challenge_progress" to "anon";

grant insert on table "public"."challenge_progress" to "anon";

grant references on table "public"."challenge_progress" to "anon";

grant select on table "public"."challenge_progress" to "anon";

grant trigger on table "public"."challenge_progress" to "anon";

grant truncate on table "public"."challenge_progress" to "anon";

grant update on table "public"."challenge_progress" to "anon";

grant delete on table "public"."challenge_progress" to "authenticated";

grant insert on table "public"."challenge_progress" to "authenticated";

grant references on table "public"."challenge_progress" to "authenticated";

grant select on table "public"."challenge_progress" to "authenticated";

grant trigger on table "public"."challenge_progress" to "authenticated";

grant truncate on table "public"."challenge_progress" to "authenticated";

grant update on table "public"."challenge_progress" to "authenticated";

grant delete on table "public"."challenge_progress" to "service_role";

grant insert on table "public"."challenge_progress" to "service_role";

grant references on table "public"."challenge_progress" to "service_role";

grant select on table "public"."challenge_progress" to "service_role";

grant trigger on table "public"."challenge_progress" to "service_role";

grant truncate on table "public"."challenge_progress" to "service_role";

grant update on table "public"."challenge_progress" to "service_role";

grant delete on table "public"."challenge_tracks" to "anon";

grant insert on table "public"."challenge_tracks" to "anon";

grant references on table "public"."challenge_tracks" to "anon";

grant select on table "public"."challenge_tracks" to "anon";

grant trigger on table "public"."challenge_tracks" to "anon";

grant truncate on table "public"."challenge_tracks" to "anon";

grant update on table "public"."challenge_tracks" to "anon";

grant delete on table "public"."challenge_tracks" to "authenticated";

grant insert on table "public"."challenge_tracks" to "authenticated";

grant references on table "public"."challenge_tracks" to "authenticated";

grant select on table "public"."challenge_tracks" to "authenticated";

grant trigger on table "public"."challenge_tracks" to "authenticated";

grant truncate on table "public"."challenge_tracks" to "authenticated";

grant update on table "public"."challenge_tracks" to "authenticated";

grant delete on table "public"."challenge_tracks" to "service_role";

grant insert on table "public"."challenge_tracks" to "service_role";

grant references on table "public"."challenge_tracks" to "service_role";

grant select on table "public"."challenge_tracks" to "service_role";

grant trigger on table "public"."challenge_tracks" to "service_role";

grant truncate on table "public"."challenge_tracks" to "service_role";

grant update on table "public"."challenge_tracks" to "service_role";

grant delete on table "public"."challenges" to "anon";

grant insert on table "public"."challenges" to "anon";

grant references on table "public"."challenges" to "anon";

grant select on table "public"."challenges" to "anon";

grant trigger on table "public"."challenges" to "anon";

grant truncate on table "public"."challenges" to "anon";

grant update on table "public"."challenges" to "anon";

grant delete on table "public"."challenges" to "authenticated";

grant insert on table "public"."challenges" to "authenticated";

grant references on table "public"."challenges" to "authenticated";

grant select on table "public"."challenges" to "authenticated";

grant trigger on table "public"."challenges" to "authenticated";

grant truncate on table "public"."challenges" to "authenticated";

grant update on table "public"."challenges" to "authenticated";

grant delete on table "public"."challenges" to "service_role";

grant insert on table "public"."challenges" to "service_role";

grant references on table "public"."challenges" to "service_role";

grant select on table "public"."challenges" to "service_role";

grant trigger on table "public"."challenges" to "service_role";

grant truncate on table "public"."challenges" to "service_role";

grant update on table "public"."challenges" to "service_role";

grant delete on table "public"."courses" to "anon";

grant insert on table "public"."courses" to "anon";

grant references on table "public"."courses" to "anon";

grant select on table "public"."courses" to "anon";

grant trigger on table "public"."courses" to "anon";

grant truncate on table "public"."courses" to "anon";

grant update on table "public"."courses" to "anon";

grant delete on table "public"."courses" to "authenticated";

grant insert on table "public"."courses" to "authenticated";

grant references on table "public"."courses" to "authenticated";

grant select on table "public"."courses" to "authenticated";

grant trigger on table "public"."courses" to "authenticated";

grant truncate on table "public"."courses" to "authenticated";

grant update on table "public"."courses" to "authenticated";

grant delete on table "public"."courses" to "service_role";

grant insert on table "public"."courses" to "service_role";

grant references on table "public"."courses" to "service_role";

grant select on table "public"."courses" to "service_role";

grant trigger on table "public"."courses" to "service_role";

grant truncate on table "public"."courses" to "service_role";

grant update on table "public"."courses" to "service_role";

grant delete on table "public"."diaries" to "anon";

grant insert on table "public"."diaries" to "anon";

grant references on table "public"."diaries" to "anon";

grant select on table "public"."diaries" to "anon";

grant trigger on table "public"."diaries" to "anon";

grant truncate on table "public"."diaries" to "anon";

grant update on table "public"."diaries" to "anon";

grant delete on table "public"."diaries" to "authenticated";

grant insert on table "public"."diaries" to "authenticated";

grant references on table "public"."diaries" to "authenticated";

grant select on table "public"."diaries" to "authenticated";

grant trigger on table "public"."diaries" to "authenticated";

grant truncate on table "public"."diaries" to "authenticated";

grant update on table "public"."diaries" to "authenticated";

grant delete on table "public"."diaries" to "service_role";

grant insert on table "public"."diaries" to "service_role";

grant references on table "public"."diaries" to "service_role";

grant select on table "public"."diaries" to "service_role";

grant trigger on table "public"."diaries" to "service_role";

grant truncate on table "public"."diaries" to "service_role";

grant update on table "public"."diaries" to "service_role";

grant delete on table "public"."diary_comments" to "anon";

grant insert on table "public"."diary_comments" to "anon";

grant references on table "public"."diary_comments" to "anon";

grant select on table "public"."diary_comments" to "anon";

grant trigger on table "public"."diary_comments" to "anon";

grant truncate on table "public"."diary_comments" to "anon";

grant update on table "public"."diary_comments" to "anon";

grant delete on table "public"."diary_comments" to "authenticated";

grant insert on table "public"."diary_comments" to "authenticated";

grant references on table "public"."diary_comments" to "authenticated";

grant select on table "public"."diary_comments" to "authenticated";

grant trigger on table "public"."diary_comments" to "authenticated";

grant truncate on table "public"."diary_comments" to "authenticated";

grant update on table "public"."diary_comments" to "authenticated";

grant delete on table "public"."diary_comments" to "service_role";

grant insert on table "public"."diary_comments" to "service_role";

grant references on table "public"."diary_comments" to "service_role";

grant select on table "public"."diary_comments" to "service_role";

grant trigger on table "public"."diary_comments" to "service_role";

grant truncate on table "public"."diary_comments" to "service_role";

grant update on table "public"."diary_comments" to "service_role";

grant delete on table "public"."diary_likes" to "anon";

grant insert on table "public"."diary_likes" to "anon";

grant references on table "public"."diary_likes" to "anon";

grant select on table "public"."diary_likes" to "anon";

grant trigger on table "public"."diary_likes" to "anon";

grant truncate on table "public"."diary_likes" to "anon";

grant update on table "public"."diary_likes" to "anon";

grant delete on table "public"."diary_likes" to "authenticated";

grant insert on table "public"."diary_likes" to "authenticated";

grant references on table "public"."diary_likes" to "authenticated";

grant select on table "public"."diary_likes" to "authenticated";

grant trigger on table "public"."diary_likes" to "authenticated";

grant truncate on table "public"."diary_likes" to "authenticated";

grant update on table "public"."diary_likes" to "authenticated";

grant delete on table "public"."diary_likes" to "service_role";

grant insert on table "public"."diary_likes" to "service_role";

grant references on table "public"."diary_likes" to "service_role";

grant select on table "public"."diary_likes" to "service_role";

grant trigger on table "public"."diary_likes" to "service_role";

grant truncate on table "public"."diary_likes" to "service_role";

grant update on table "public"."diary_likes" to "service_role";

grant delete on table "public"."lesson_tracks" to "anon";

grant insert on table "public"."lesson_tracks" to "anon";

grant references on table "public"."lesson_tracks" to "anon";

grant select on table "public"."lesson_tracks" to "anon";

grant trigger on table "public"."lesson_tracks" to "anon";

grant truncate on table "public"."lesson_tracks" to "anon";

grant update on table "public"."lesson_tracks" to "anon";

grant delete on table "public"."lesson_tracks" to "authenticated";

grant insert on table "public"."lesson_tracks" to "authenticated";

grant references on table "public"."lesson_tracks" to "authenticated";

grant select on table "public"."lesson_tracks" to "authenticated";

grant trigger on table "public"."lesson_tracks" to "authenticated";

grant truncate on table "public"."lesson_tracks" to "authenticated";

grant update on table "public"."lesson_tracks" to "authenticated";

grant delete on table "public"."lesson_tracks" to "service_role";

grant insert on table "public"."lesson_tracks" to "service_role";

grant references on table "public"."lesson_tracks" to "service_role";

grant select on table "public"."lesson_tracks" to "service_role";

grant trigger on table "public"."lesson_tracks" to "service_role";

grant truncate on table "public"."lesson_tracks" to "service_role";

grant update on table "public"."lesson_tracks" to "service_role";

grant delete on table "public"."lessons" to "anon";

grant insert on table "public"."lessons" to "anon";

grant references on table "public"."lessons" to "anon";

grant select on table "public"."lessons" to "anon";

grant trigger on table "public"."lessons" to "anon";

grant truncate on table "public"."lessons" to "anon";

grant update on table "public"."lessons" to "anon";

grant delete on table "public"."lessons" to "authenticated";

grant insert on table "public"."lessons" to "authenticated";

grant references on table "public"."lessons" to "authenticated";

grant select on table "public"."lessons" to "authenticated";

grant trigger on table "public"."lessons" to "authenticated";

grant truncate on table "public"."lessons" to "authenticated";

grant update on table "public"."lessons" to "authenticated";

grant delete on table "public"."lessons" to "service_role";

grant insert on table "public"."lessons" to "service_role";

grant references on table "public"."lessons" to "service_role";

grant select on table "public"."lessons" to "service_role";

grant trigger on table "public"."lessons" to "service_role";

grant truncate on table "public"."lessons" to "service_role";

grant update on table "public"."lessons" to "service_role";

grant delete on table "public"."practice_diaries" to "anon";

grant insert on table "public"."practice_diaries" to "anon";

grant references on table "public"."practice_diaries" to "anon";

grant select on table "public"."practice_diaries" to "anon";

grant trigger on table "public"."practice_diaries" to "anon";

grant truncate on table "public"."practice_diaries" to "anon";

grant update on table "public"."practice_diaries" to "anon";

grant delete on table "public"."practice_diaries" to "authenticated";

grant insert on table "public"."practice_diaries" to "authenticated";

grant references on table "public"."practice_diaries" to "authenticated";

grant select on table "public"."practice_diaries" to "authenticated";

grant trigger on table "public"."practice_diaries" to "authenticated";

grant truncate on table "public"."practice_diaries" to "authenticated";

grant update on table "public"."practice_diaries" to "authenticated";

grant delete on table "public"."practice_diaries" to "service_role";

grant insert on table "public"."practice_diaries" to "service_role";

grant references on table "public"."practice_diaries" to "service_role";

grant select on table "public"."practice_diaries" to "service_role";

grant trigger on table "public"."practice_diaries" to "service_role";

grant truncate on table "public"."practice_diaries" to "service_role";

grant update on table "public"."practice_diaries" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."songs" to "anon";

grant insert on table "public"."songs" to "anon";

grant references on table "public"."songs" to "anon";

grant select on table "public"."songs" to "anon";

grant trigger on table "public"."songs" to "anon";

grant truncate on table "public"."songs" to "anon";

grant update on table "public"."songs" to "anon";

grant delete on table "public"."songs" to "authenticated";

grant insert on table "public"."songs" to "authenticated";

grant references on table "public"."songs" to "authenticated";

grant select on table "public"."songs" to "authenticated";

grant trigger on table "public"."songs" to "authenticated";

grant truncate on table "public"."songs" to "authenticated";

grant update on table "public"."songs" to "authenticated";

grant delete on table "public"."songs" to "service_role";

grant insert on table "public"."songs" to "service_role";

grant references on table "public"."songs" to "service_role";

grant select on table "public"."songs" to "service_role";

grant trigger on table "public"."songs" to "service_role";

grant truncate on table "public"."songs" to "service_role";

grant update on table "public"."songs" to "service_role";

grant delete on table "public"."track_clears" to "anon";

grant insert on table "public"."track_clears" to "anon";

grant references on table "public"."track_clears" to "anon";

grant select on table "public"."track_clears" to "anon";

grant trigger on table "public"."track_clears" to "anon";

grant truncate on table "public"."track_clears" to "anon";

grant update on table "public"."track_clears" to "anon";

grant delete on table "public"."track_clears" to "authenticated";

grant insert on table "public"."track_clears" to "authenticated";

grant references on table "public"."track_clears" to "authenticated";

grant select on table "public"."track_clears" to "authenticated";

grant trigger on table "public"."track_clears" to "authenticated";

grant truncate on table "public"."track_clears" to "authenticated";

grant update on table "public"."track_clears" to "authenticated";

grant delete on table "public"."track_clears" to "service_role";

grant insert on table "public"."track_clears" to "service_role";

grant references on table "public"."track_clears" to "service_role";

grant select on table "public"."track_clears" to "service_role";

grant trigger on table "public"."track_clears" to "service_role";

grant truncate on table "public"."track_clears" to "service_role";

grant update on table "public"."track_clears" to "service_role";

create policy "Users can insert their own challenge progress"
on "public"."challenge_progress"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can update their own challenge progress"
on "public"."challenge_progress"
as permissive
for update
to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Users can view their own challenge progress"
on "public"."challenge_progress"
as permissive
for select
to public
using ((auth.uid() = user_id));


create policy "Challenge tracks are viewable by everyone"
on "public"."challenge_tracks"
as permissive
for select
to public
using (true);


create policy "Only admins can manage challenge tracks"
on "public"."challenge_tracks"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


create policy "Challenges are viewable by everyone"
on "public"."challenges"
as permissive
for select
to public
using (true);


create policy "Only admins can manage challenges"
on "public"."challenges"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


create policy "Courses are viewable by everyone"
on "public"."courses"
as permissive
for select
to public
using (true);


create policy "Only admins can manage courses"
on "public"."courses"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


create policy "Diaries are viewable by everyone"
on "public"."diaries"
as permissive
for select
to public
using (true);


create policy "Users can manage their own diaries"
on "public"."diaries"
as permissive
for all
to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Diary comments are viewable by everyone"
on "public"."diary_comments"
as permissive
for select
to public
using (true);


create policy "Users can manage their own diary comments"
on "public"."diary_comments"
as permissive
for all
to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "Diary likes are viewable by everyone"
on "public"."diary_likes"
as permissive
for select
to public
using (true);


create policy "Users can manage their own diary likes"
on "public"."diary_likes"
as permissive
for all
to public
using ((auth.uid() = user_id))
with check ((auth.uid() = user_id));


create policy "likes_delete"
on "public"."diary_likes"
as permissive
for delete
to public
using ((auth.uid() = user_id));


create policy "likes_insert"
on "public"."diary_likes"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Lesson tracks are viewable by everyone"
on "public"."lesson_tracks"
as permissive
for select
to public
using (true);


create policy "Only admins can manage lesson tracks"
on "public"."lesson_tracks"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


create policy "Lessons are viewable by everyone"
on "public"."lessons"
as permissive
for select
to public
using (true);


create policy "Only admins can manage lessons"
on "public"."lessons"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


create policy "Owner can update own profile"
on "public"."profiles"
as permissive
for update
to public
using ((auth.uid() = id))
with check ((auth.uid() = id));


create policy "Profiles are viewable by owner"
on "public"."profiles"
as permissive
for select
to public
using ((auth.uid() = id));


create policy "Users can insert their own profile"
on "public"."profiles"
as permissive
for insert
to public
with check ((auth.uid() = id));


create policy "profiles_insert"
on "public"."profiles"
as permissive
for insert
to public
with check ((auth.uid() = id));


create policy "profiles_select"
on "public"."profiles"
as permissive
for select
to public
using (true);


create policy "profiles_update"
on "public"."profiles"
as permissive
for update
to public
using ((auth.uid() = id))
with check ((auth.uid() = id));


create policy "Only admins can manage songs"
on "public"."songs"
as permissive
for all
to public
using ((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.is_admin = true)))));


create policy "Songs are viewable by everyone"
on "public"."songs"
as permissive
for select
to public
using (true);


create policy "Users can insert their own track clears"
on "public"."track_clears"
as permissive
for insert
to public
with check ((auth.uid() = user_id));


create policy "Users can view their own track clears"
on "public"."track_clears"
as permissive
for select
to public
using ((auth.uid() = user_id));


CREATE TRIGGER update_challenge_progress_updated_at BEFORE UPDATE ON public.challenge_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diaries_updated_at BEFORE UPDATE ON public.diaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER diary_likes_count_trigger AFTER INSERT OR DELETE ON public.diary_likes FOR EACH ROW EXECUTE FUNCTION update_diary_likes_count();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_songs_updated_at BEFORE UPDATE ON public.songs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


