drop policy "Admin can manage lesson songs" on "public"."lesson_songs";

drop policy "Authenticated users can view lesson songs" on "public"."lesson_songs";

alter table "public"."challenges" drop constraint "challenges_category_check";

drop function if exists "public"."handle_new_user"();

alter table "public"."challenges" drop column "category";

alter table "public"."challenges" drop column "song_clear_count";

alter table "public"."lesson_songs" add column "clear_conditions" jsonb;


