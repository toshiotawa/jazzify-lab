-- chord_precision: オプション MIDI URL + 開発者テスト Bluesy Licks 精密課題を MIDI ノーツ源に
-- 資産生成: node --experimental-strip-types scripts/build-bluesy-precision-midi.mjs
-- R2 反映: node scripts/upload-bluesy-licks-r2.mjs

BEGIN;

ALTER TABLE public.ear_training_phrases
  ADD COLUMN IF NOT EXISTS midi_url text;

COMMENT ON COLUMN public.ear_training_phrases.midi_url IS
  '精密モード(chord_precision)向けオプション MIDI URL。設定時は落下ノーツ生成に使用し MusicXML は譜面表示のみ';

UPDATE public.ear_training_phrases
SET midi_url = 'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-01-120_slow_precision.mid'
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-bluesy-precision-ph0');

COMMIT;
