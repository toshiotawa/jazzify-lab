alter table "public"."challenges" drop constraint "challenges_challenge_type_check";

alter table "public"."challenges" drop column "challenge_type";

alter table "public"."challenges" drop column "season_number";

alter table "public"."challenges" drop column "season_year";

alter table "public"."challenges" alter column "type" set not null;


