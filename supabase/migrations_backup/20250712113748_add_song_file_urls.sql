-- songsテーブルにaudio_urlとxml_urlフィールドを追加
alter table public.songs
  add column if not exists audio_url text,
  add column if not exists xml_url text,
  add column if not exists json_url text;

-- 既存のdataフィールドをjson_dataに名前変更（わかりやすくするため）
-- カラムが存在する場合のみ実行
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'songs' 
             AND column_name = 'data') THEN
    ALTER TABLE public.songs RENAME COLUMN data TO json_data;
  END IF;
END $$;

-- コメントを追加
comment on column public.songs.audio_url is 'MP3ファイルのURL（Supabase Storage）';
comment on column public.songs.xml_url is 'MusicXMLファイルのURL（Supabase Storage）';
comment on column public.songs.json_url is 'JSONノーツデータファイルのURL（Supabase Storage）';
comment on column public.songs.json_data is 'JSONノーツデータ（インライン格納用、json_urlが優先）';
