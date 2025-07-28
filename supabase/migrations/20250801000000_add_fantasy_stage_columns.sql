-- ファンタジーステージ課題対応
alter table public.lesson_songs
  add column if not exists is_fantasy boolean default false not null,
  add column if not exists fantasy_stage_id uuid references public.fantasy_stages(id);

alter table public.challenge_tracks
  add column if not exists is_fantasy boolean default false not null,
  add column if not exists fantasy_stage_id uuid references public.fantasy_stages(id);

comment on column public.lesson_songs.is_fantasy is 'true の場合、この行は楽曲ではなくファンタジーステージ課題';
comment on column public.lesson_songs.fantasy_stage_id is 'ファンタジーステージのID (is_fantasy=trueの場合のみ)';

comment on column public.challenge_tracks.is_fantasy is 'true の場合、この行は楽曲ではなくファンタジーステージ課題';
comment on column public.challenge_tracks.fantasy_stage_id is 'ファンタジーステージのID (is_fantasy=trueの場合のみ)';