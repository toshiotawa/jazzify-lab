-- ファンタジーステージ課題対応

-- lesson_songsテーブルの更新
alter table public.lesson_songs
  add column if not exists is_fantasy boolean default false not null,
  add column if not exists fantasy_stage_id uuid references public.fantasy_stages(id);

-- song_idをnullableに変更（ファンタジーステージの場合はnullになるため）
alter table public.lesson_songs
  alter column song_id drop not null;

-- チェック制約を追加（is_fantasy=trueの場合はfantasy_stage_idが必須、falseの場合はsong_idが必須）
alter table public.lesson_songs
  add constraint lesson_songs_check_fantasy_or_song check (
    (is_fantasy = true and fantasy_stage_id is not null and song_id is null) or
    (is_fantasy = false and song_id is not null and fantasy_stage_id is null)
  );

-- challenge_tracksテーブルの更新
alter table public.challenge_tracks
  add column if not exists is_fantasy boolean default false not null,
  add column if not exists fantasy_stage_id uuid references public.fantasy_stages(id);

-- song_idをnullableに変更（ファンタジーステージの場合はnullになるため）
alter table public.challenge_tracks
  alter column song_id drop not null;

-- チェック制約を追加（is_fantasy=trueの場合はfantasy_stage_idが必須、falseの場合はsong_idが必須）
alter table public.challenge_tracks
  add constraint challenge_tracks_check_fantasy_or_song check (
    (is_fantasy = true and fantasy_stage_id is not null and song_id is null) or
    (is_fantasy = false and song_id is not null and fantasy_stage_id is null)
  );

-- コメントを追加
comment on column public.lesson_songs.is_fantasy is 'true の場合、この行は楽曲ではなくファンタジーステージ課題';
comment on column public.lesson_songs.fantasy_stage_id is 'ファンタジーステージのID (is_fantasy=trueの場合のみ)';
comment on column public.challenge_tracks.is_fantasy is 'true の場合、この行は楽曲ではなくファンタジーステージ課題';
comment on column public.challenge_tracks.fantasy_stage_id is 'ファンタジーステージのID (is_fantasy=trueの場合のみ)';