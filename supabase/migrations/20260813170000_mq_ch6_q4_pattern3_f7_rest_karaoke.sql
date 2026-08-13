-- 4-2 パターン3: F7 3拍目の誤音符を休符にした譜面へ。音源は 4-1 と同じカラオケ。
-- 4-5 パターン6 まとめ譜の同じ F7 小節も休符に揃える。

UPDATE public.ear_training_phrases
SET
  music_xml_url = 'https://jazzify-cdn.com/sozai/mq-b5-6-4-3.musicxml?v=202608131700',
  audio_url = 'https://jazzify-cdn.com/sozai/mq-b5-6-karaoke.mp3?v=202608121000'
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-3-stage');

UPDATE public.ear_training_stages
SET
  enemy_hp = 144,
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-3-stage');

UPDATE public.ear_training_phrases
SET music_xml_url = 'https://jazzify-cdn.com/sozai/mq-b5-6-4-6-guide-voice4-cue.musicxml?v=202608131700'
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-6-stage');

UPDATE public.ear_training_stages
SET
  enemy_hp = 182,
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-4-6-stage');
