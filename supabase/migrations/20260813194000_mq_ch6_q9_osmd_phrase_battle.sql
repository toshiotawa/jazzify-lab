-- クエスト9 最後の課題を複合サバイバルから OSMD バトルへ切り替え。
-- 譜面: 課題1–5（5小節）。敵 HP 150。BGM/音源: ドラムループ 100BPM。
-- XML は 100BPM 版 mq-b5-6-9-osmd.musicxml（原譜は 80BPM のまま残す）。

DELETE FROM public.ear_training_phrases
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-stage');
DELETE FROM public.ear_training_stages
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, is_demo, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-stage'),
  'mq-b5-6-9-osmd',
  'フレーズバトル',
  'Phrase battle',
  '課題1–5の5フレーズをOSMDバトルで通す。',
  'Play phrases I–V as an OSMD battle.',
  100, -1, 4, 4, 5, 8,
  0, 600, 100, 150,
  1, 0, 0, 0,
  9, 14, 4, 8,
  'blue_club', true, false, 'chord_osmd',
  true, true, false,
  1
);

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-phrase'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-stage'),
  0,
  'フレーズバトル',
  'Phrase battle',
  'https://jazzify-cdn.com/sozai/mq-b5-6-9-osmd.musicxml?v=202608131940',
  'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3',
  12,
  12,
  0,
  -1
);

UPDATE public.lesson_songs
SET
  is_survival = false,
  survival_stage_number = NULL,
  survival_map_category = NULL,
  survival_lesson_overrides = NULL,
  survival_composite_config = NULL,
  override_production_staff_hint_mode = NULL,
  override_production_keyboard_hint_mode = NULL,
  is_ear_training = true,
  ear_training_stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-stage'),
  title = '9-6. フレーズバトル',
  title_en = '9-6. Phrase battle'
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q9-6-lsong');

DELETE FROM public.survival_composite_phrase_sources
WHERE composite_id IN (
  SELECT id FROM public.survival_composite_phrase_stages
  WHERE map_category = 'phrases' AND stage_number = 506
);
DELETE FROM public.survival_composite_phrase_stages
WHERE map_category = 'phrases' AND stage_number = 506;
DELETE FROM public.survival_stages
WHERE map_category = 'phrases' AND stage_number = 506;

UPDATE public.lessons
SET
  description = '5つの1小節フレーズを覚え、最後はOSMDバトル。',
  description_en = 'Five one-bar phrases, then an OSMD battle.',
  assignment_description = 'フレーズを覚え、OSMDバトルで仕上げましょう。',
  assignment_description_en = 'Learn the phrases, then finish with the OSMD battle.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q9-lesson');
