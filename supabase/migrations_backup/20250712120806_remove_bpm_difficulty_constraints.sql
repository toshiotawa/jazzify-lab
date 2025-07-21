-- BPMと難易度のNOT NULL制約を削除
alter table public.songs
  alter column bpm drop not null,
  alter column difficulty drop not null;

-- デフォルト値も削除（もしあれば）
alter table public.songs
  alter column bpm drop default,
  alter column difficulty drop default;

-- コメントを追加
comment on column public.songs.bpm is 'BPM（使用しない）';
comment on column public.songs.difficulty is '難易度（使用しない）';
