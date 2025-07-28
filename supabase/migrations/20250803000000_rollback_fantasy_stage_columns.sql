-- ファンタジーステージ関連カラムのロールバック

-- challenge_tracksテーブルからファンタジー関連カラムを削除
alter table public.challenge_tracks
  drop constraint if exists challenge_tracks_check_fantasy_or_song;

alter table public.challenge_tracks
  drop column if exists is_fantasy,
  drop column if exists fantasy_stage_id;

-- song_idをNOT NULLに戻す
alter table public.challenge_tracks
  alter column song_id set not null;

-- lesson_songsテーブルからファンタジー関連カラムを削除
alter table public.lesson_songs
  drop constraint if exists lesson_songs_check_fantasy_or_song;

alter table public.lesson_songs
  drop column if exists is_fantasy,
  drop column if exists fantasy_stage_id;

-- song_idをNOT NULLに戻す
alter table public.lesson_songs
  alter column song_id set not null;

-- ファンタジーステージ関連のデータを削除（念のため）
delete from public.challenge_tracks where song_id is null;
delete from public.lesson_songs where song_id is null;