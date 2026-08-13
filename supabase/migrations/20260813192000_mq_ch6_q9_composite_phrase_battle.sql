-- クエスト9: 9-1〜9-5 のあとに複合フレーズバトル（stage 506）を追加。
-- ソースは課題1–5（phrases 501–505）。敵 HP 150。BGM はドラムループ 100BPM。

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode,
  hide_chord_names_in_battle
) VALUES (
  'phrases', 506, 'progression',
  'MQ Ch6 フレーズ 複合', 'MQ Ch6 Phrase composite', 'easy',
  '', '', '',
  NULL, NULL, NULL,
  'mq-b5-ch6-phrases', false, NULL, NULL,
  true, 'fade_15s', 'fade_15s',
  true
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en,
  block_key = EXCLUDED.block_key,
  lesson_only = EXCLUDED.lesson_only,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  hide_chord_names_in_battle = EXCLUDED.hide_chord_names_in_battle,
  updated_at = now();

INSERT INTO public.survival_composite_phrase_stages (map_category, stage_number, boss_type, key_fifths, bgm_url)
VALUES (
  'phrases',
  506,
  'B',
  -1,
  'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3'
)
ON CONFLICT (map_category, stage_number)
DO UPDATE SET boss_type = EXCLUDED.boss_type, key_fifths = EXCLUDED.key_fifths,
  bgm_url = EXCLUDED.bgm_url, updated_at = now();

DELETE FROM public.survival_composite_phrase_sources
WHERE composite_id IN (
  SELECT id FROM public.survival_composite_phrase_stages
  WHERE map_category = 'phrases' AND stage_number = 506
);

INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order)
SELECT c.id, s.src, s.ord
FROM public.survival_composite_phrase_stages c
CROSS JOIN (VALUES (501, 0), (502, 1), (503, 2), (504, 3), (505, 4)) AS s(src, ord)
WHERE c.map_category = 'phrases' AND c.stage_number = 506;

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id,
  is_survival, survival_stage_number, survival_map_category,
  is_ear_training, ear_training_stage_id,
  is_ear_training_tutorial, ear_training_tutorial_script_id,
  is_survival_tutorial, survival_tutorial_script_id,
  is_balloon_rush, balloon_rush_stage_id,
  survival_lesson_overrides, survival_random_chords,
  override_production_staff_hint_mode, override_production_keyboard_hint_mode,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q9-6-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q9-lesson'),
  NULL,
  6,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL,
  true, 506, 'phrases',
  false, NULL,
  false, NULL,
  false, NULL,
  false, NULL,
  '{"bgmUrl":"https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3","bossMaxHp":150}'::jsonb,
  NULL,
  'fade_15s', 'fade_15s',
  '9-6. 複合フレーズ', '9-6. Composite phrases',
  true
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_survival = EXCLUDED.is_survival,
  survival_stage_number = EXCLUDED.survival_stage_number,
  survival_map_category = EXCLUDED.survival_map_category,
  survival_lesson_overrides = EXCLUDED.survival_lesson_overrides,
  override_production_staff_hint_mode = EXCLUDED.override_production_staff_hint_mode,
  override_production_keyboard_hint_mode = EXCLUDED.override_production_keyboard_hint_mode,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

UPDATE public.lessons
SET
  description = '5つの1小節フレーズを覚え、最後は複合バトル。',
  description_en = 'Five one-bar phrases, then a composite battle.',
  assignment_description = 'フレーズを覚え、複合バトルで仕上げましょう。',
  assignment_description_en = 'Learn the phrases, then finish with the composite battle.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q9-lesson');
