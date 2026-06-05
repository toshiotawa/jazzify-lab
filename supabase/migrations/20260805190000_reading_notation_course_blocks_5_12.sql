-- 音符の読み方コース: ブロック5〜12（ヘ音・大譜表・臨時記号・ファイナル）
BEGIN;

ALTER TABLE public.lesson_songs
  ADD COLUMN IF NOT EXISTS survival_random_chords jsonb DEFAULT NULL;

ALTER TABLE public.lesson_songs
  ADD COLUMN IF NOT EXISTS survival_lesson_overrides jsonb DEFAULT NULL;

INSERT INTO public.courses (
  id, title, title_en, description, description_en,
  premium_only, order_index, audience, is_tutorial, is_visible,
  difficulty_tier, is_developer_only, is_main_course
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-reading-notation'),
  '音符の読み方',
  'Reading Music Notation',
  '五線譜の音符を読む力を、風船ラッシュ・サバイバル・バトルモードで身につけましょう。',
  'Build sight-reading skills through Balloon Rush, Survival, and Battle mode.',
  true,
  COALESCE((SELECT MIN(c.order_index) FROM public.courses c
    WHERE COALESCE(c.is_developer_only, false) = false
      AND COALESCE(c.is_visible, true) = true
      AND c.is_main_course = false), 0) + 1,
  'both', false, true, 'beginner', false, false
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  difficulty_tier = EXCLUDED.difficulty_tier,
  is_visible = EXCLUDED.is_visible,
  updated_at = now();

INSERT INTO public.balloon_rush_stages (
  id, slug, title, title_en, description, description_en,
  stage_type, chord_suffix, root_pattern, allowed_chords, chord_progression,
  time_limit_sec, pop_quota, balloon_lifetime_sec, max_concurrent, respawn_delay_sec,
  bgm_url, key_fifths, lesson_only, is_active,
  production_staff_hint_mode, production_keyboard_hint_mode, hide_chord_names_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'notation-balloon-random'),
  'notation-balloon-random',
  '譜読み風船ラッシュ',
  'Sight-reading Balloon Rush',
  '120秒以内に80個。譜面の音符を読んで風船を割ります。',
  'Pop 80 balloons in 120 seconds by reading the staff.',
  'random', '_note', 'all', NULL, NULL,
  120, 80, 12, 5, 2,
  'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3', 0, true, true,
  'always', 'hidden_until_pressed', true
)
ON CONFLICT (slug) DO UPDATE SET
  time_limit_sec = EXCLUDED.time_limit_sec,
  pop_quota = EXCLUDED.pop_quota,
  bgm_url = EXCLUDED.bgm_url,
  hide_chord_names_in_battle = EXCLUDED.hide_chord_names_in_battle,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.balloon_rush_play_dialogues (stage_id, title, title_en, script, is_active)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'notation-balloon-random'),
  '譜読み風船', 'Sight-reading balloons',
  '{"lineDurationSeconds":5,"lines":[{"atSeconds":2,"speaker":"fai","text":{"ja":"譜面の音符を読んで、風船を割ろう！","en":"Read the staff notes and pop the balloons!"}},{"atSeconds":10,"speaker":"jajii","text":{"ja":"120秒以内に80個じゃ。落ち着いて読むのじゃ。","en":"80 in 120 seconds. Take your time reading."}}]}'::jsonb,
  true
ON CONFLICT (stage_id) DO UPDATE SET script = EXCLUDED.script, updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode,
  hide_chord_names_in_battle
) VALUES (
  'lesson', 1100, 'random', 'survival',
  '譜読みサバイバル', 'Sight-reading Survival', 'easy',
  '_note', '譜読み', 'Sight-reading',
  'all', '全音', 'All notes',
  'notation', false, NULL, NULL,
  true, 'always', 'hidden_until_pressed', true
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  hide_chord_names_in_battle = EXCLUDED.hide_chord_names_in_battle,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.survival_stage_play_dialogues (map_category, stage_number, title, title_en, script)
VALUES (
  'lesson', 1100, '譜読みサバイバル', 'Sight-reading survival',
  '{"lineDurationSeconds":5,"lines":[{"atSeconds":2,"speaker":"fai","text":{"ja":"譜面の音符を弾いて敵を倒そう！","en":"Play the notes on the staff to defeat enemies!"}},{"atSeconds":8,"speaker":"jajii","text":{"ja":"コード名は出ん。譜面だけ見るのじゃ。","en":"No chord names—read the staff only."}}]}'::jsonb
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET script = EXCLUDED.script, updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q1'),
  'notation-quiz-b5-q1',
  '譜読みクイズ: ソラシドレ',
  'Sight-reading quiz: G A B C D',
  '30秒以内に30問正解。譜面の音符を読んで弾きましょう。',
  'Answer 30 questions within 30 seconds by reading the staff.',
  120, 0, 4, 4, 2, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  30, 'random', true, true, 30, false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  hide_chord_names_in_battle = EXCLUDED.hide_chord_names_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q1-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q1'),
  0, 1, 1, 4,
  'G2',
  ARRAY['G2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q1-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q1'),
  1, 2, 1, 4,
  'A2',
  ARRAY['A2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q1-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q1'),
  2, 3, 1, 4,
  'B2',
  ARRAY['B2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q1-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q1'),
  3, 4, 1, 4,
  'C3',
  ARRAY['C3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q1-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q1'),
  4, 5, 1, 4,
  'D3',
  ARRAY['D3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q2'),
  'notation-quiz-b5-q2',
  '譜読みクイズ: ラシドレミ',
  'Sight-reading quiz: A B C D E',
  '30秒以内に30問正解。譜面の音符を読んで弾きましょう。',
  'Answer 30 questions within 30 seconds by reading the staff.',
  120, 0, 4, 4, 2, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  30, 'random', true, true, 30, false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  hide_chord_names_in_battle = EXCLUDED.hide_chord_names_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q2-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q2'),
  0, 1, 1, 4,
  'A2',
  ARRAY['A2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q2-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q2'),
  1, 2, 1, 4,
  'B2',
  ARRAY['B2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q2-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q2'),
  2, 3, 1, 4,
  'C3',
  ARRAY['C3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q2-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q2'),
  3, 4, 1, 4,
  'D3',
  ARRAY['D3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q2-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q2'),
  4, 5, 1, 4,
  'E3',
  ARRAY['E3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q3'),
  'notation-quiz-b5-q3',
  '譜読みクイズ: シドレミファ',
  'Sight-reading quiz: B C D E F',
  '30秒以内に30問正解。譜面の音符を読んで弾きましょう。',
  'Answer 30 questions within 30 seconds by reading the staff.',
  120, 0, 4, 4, 2, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  30, 'random', true, true, 30, false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  hide_chord_names_in_battle = EXCLUDED.hide_chord_names_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q3-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q3'),
  0, 1, 1, 4,
  'B2',
  ARRAY['B2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q3-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q3'),
  1, 2, 1, 4,
  'C3',
  ARRAY['C3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q3-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q3'),
  2, 3, 1, 4,
  'D3',
  ARRAY['D3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q3-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q3'),
  3, 4, 1, 4,
  'E3',
  ARRAY['E3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q3-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q3'),
  4, 5, 1, 4,
  'F3',
  ARRAY['F3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q4'),
  'notation-quiz-b5-q4',
  '譜読みクイズ: ドレミファソ',
  'Sight-reading quiz: C D E F G',
  '30秒以内に30問正解。譜面の音符を読んで弾きましょう。',
  'Answer 30 questions within 30 seconds by reading the staff.',
  120, 0, 4, 4, 2, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  30, 'random', true, true, 30, false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  hide_chord_names_in_battle = EXCLUDED.hide_chord_names_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q4-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q4'),
  0, 1, 1, 4,
  'C3',
  ARRAY['C3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q4-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q4'),
  1, 2, 1, 4,
  'D3',
  ARRAY['D3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q4-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q4'),
  2, 3, 1, 4,
  'E3',
  ARRAY['E3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q4-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q4'),
  3, 4, 1, 4,
  'F3',
  ARRAY['F3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q4-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q4'),
  4, 5, 1, 4,
  'G3',
  ARRAY['G3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q5'),
  'notation-quiz-b5-q5',
  '譜読みクイズ: まとめ（全て）',
  'Sight-reading quiz: Review (all)',
  '30秒以内に30問正解。譜面の音符を読んで弾きましょう。',
  'Answer 30 questions within 30 seconds by reading the staff.',
  120, 0, 4, 4, 2, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  30, 'random', true, true, 30, false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  hide_chord_names_in_battle = EXCLUDED.hide_chord_names_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q5-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q5'),
  0, 1, 1, 4,
  'G2',
  ARRAY['G2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q5-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q5'),
  1, 2, 1, 4,
  'A2',
  ARRAY['A2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q5-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q5'),
  2, 3, 1, 4,
  'B2',
  ARRAY['B2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q5-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q5'),
  3, 4, 1, 4,
  'C3',
  ARRAY['C3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q5-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q5'),
  4, 5, 1, 4,
  'D3',
  ARRAY['D3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q5-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q5'),
  5, 6, 1, 4,
  'E3',
  ARRAY['E3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q5-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q5'),
  6, 7, 1, 4,
  'F3',
  ARRAY['F3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q5-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q5'),
  7, 8, 1, 4,
  'G3',
  ARRAY['G3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q5-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q5'),
  8, 9, 1, 4,
  'A3',
  ARRAY['A3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q1'),
  'notation-quiz-b6-q1',
  '譜読みクイズ: ラシドレミ',
  'Sight-reading quiz: A B C D E',
  '30秒以内に30問正解。譜面の音符を読んで弾きましょう。',
  'Answer 30 questions within 30 seconds by reading the staff.',
  120, 0, 4, 4, 2, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  30, 'random', true, true, 30, false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  hide_chord_names_in_battle = EXCLUDED.hide_chord_names_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q1-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q1'),
  0, 1, 1, 4,
  'A1',
  ARRAY['A1']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q1-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q1'),
  1, 2, 1, 4,
  'B1',
  ARRAY['B1']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q1-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q1'),
  2, 3, 1, 4,
  'C2',
  ARRAY['C2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q1-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q1'),
  3, 4, 1, 4,
  'D2',
  ARRAY['D2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q1-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q1'),
  4, 5, 1, 4,
  'E2',
  ARRAY['E2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q2'),
  'notation-quiz-b6-q2',
  '譜読みクイズ: シドレミファ',
  'Sight-reading quiz: B C D E F',
  '30秒以内に30問正解。譜面の音符を読んで弾きましょう。',
  'Answer 30 questions within 30 seconds by reading the staff.',
  120, 0, 4, 4, 2, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  30, 'random', true, true, 30, false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  hide_chord_names_in_battle = EXCLUDED.hide_chord_names_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q2-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q2'),
  0, 1, 1, 4,
  'B1',
  ARRAY['B1']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q2-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q2'),
  1, 2, 1, 4,
  'C2',
  ARRAY['C2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q2-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q2'),
  2, 3, 1, 4,
  'D2',
  ARRAY['D2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q2-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q2'),
  3, 4, 1, 4,
  'E2',
  ARRAY['E2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q2-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q2'),
  4, 5, 1, 4,
  'F2',
  ARRAY['F2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q5'),
  'notation-quiz-b6-q5',
  '譜読みクイズ: まとめ（全て）',
  'Sight-reading quiz: Review (all)',
  '30秒以内に30問正解。譜面の音符を読んで弾きましょう。',
  'Answer 30 questions within 30 seconds by reading the staff.',
  120, 0, 4, 4, 2, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  30, 'random', true, true, 30, false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  hide_chord_names_in_battle = EXCLUDED.hide_chord_names_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q5-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q5'),
  0, 1, 1, 4,
  'A1',
  ARRAY['A1']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q5-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q5'),
  1, 2, 1, 4,
  'B1',
  ARRAY['B1']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q5-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q5'),
  2, 3, 1, 4,
  'C2',
  ARRAY['C2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q5-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q5'),
  3, 4, 1, 4,
  'D2',
  ARRAY['D2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q5-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q5'),
  4, 5, 1, 4,
  'E2',
  ARRAY['E2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q5-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q5'),
  5, 6, 1, 4,
  'F2',
  ARRAY['F2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q1'),
  'notation-quiz-b7-q1',
  '譜読みクイズ: シドレミファ',
  'Sight-reading quiz: B C D E F',
  '30秒以内に30問正解。譜面の音符を読んで弾きましょう。',
  'Answer 30 questions within 30 seconds by reading the staff.',
  120, 0, 4, 4, 2, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  30, 'random', true, true, 30, false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  hide_chord_names_in_battle = EXCLUDED.hide_chord_names_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q1-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q1'),
  0, 1, 1, 4,
  'B3',
  ARRAY['B3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q1-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q1'),
  1, 2, 1, 4,
  'C4',
  ARRAY['C4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q1-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q1'),
  2, 3, 1, 4,
  'D4',
  ARRAY['D4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q1-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q1'),
  3, 4, 1, 4,
  'E4',
  ARRAY['E4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q1-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q1'),
  4, 5, 1, 4,
  'F4',
  ARRAY['F4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q2'),
  'notation-quiz-b7-q2',
  '譜読みクイズ: ドレミファソ',
  'Sight-reading quiz: C D E F G',
  '30秒以内に30問正解。譜面の音符を読んで弾きましょう。',
  'Answer 30 questions within 30 seconds by reading the staff.',
  120, 0, 4, 4, 2, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  30, 'random', true, true, 30, false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  hide_chord_names_in_battle = EXCLUDED.hide_chord_names_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q2-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q2'),
  0, 1, 1, 4,
  'C4',
  ARRAY['C4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q2-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q2'),
  1, 2, 1, 4,
  'D4',
  ARRAY['D4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q2-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q2'),
  2, 3, 1, 4,
  'E4',
  ARRAY['E4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q2-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q2'),
  3, 4, 1, 4,
  'F4',
  ARRAY['F4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q2-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q2'),
  4, 5, 1, 4,
  'G4',
  ARRAY['G4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q5'),
  'notation-quiz-b7-q5',
  '譜読みクイズ: まとめ（全て）',
  'Sight-reading quiz: Review (all)',
  '30秒以内に30問正解。譜面の音符を読んで弾きましょう。',
  'Answer 30 questions within 30 seconds by reading the staff.',
  120, 0, 4, 4, 2, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  30, 'random', true, true, 30, false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  hide_chord_names_in_battle = EXCLUDED.hide_chord_names_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q5-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q5'),
  0, 1, 1, 4,
  'B3',
  ARRAY['B3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q5-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q5'),
  1, 2, 1, 4,
  'C4',
  ARRAY['C4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q5-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q5'),
  2, 3, 1, 4,
  'D4',
  ARRAY['D4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q5-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q5'),
  3, 4, 1, 4,
  'E4',
  ARRAY['E4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q5-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q5'),
  4, 5, 1, 4,
  'F4',
  ARRAY['F4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q5-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q5'),
  5, 6, 1, 4,
  'G4',
  ARRAY['G4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  'notation-quiz-b8-q1',
  '譜読みクイズ: ヘ音記号 総合まとめ',
  'Sight-reading quiz: Bass clef review',
  '30秒以内に30問正解。譜面の音符を読んで弾きましょう。',
  'Answer 30 questions within 30 seconds by reading the staff.',
  120, 0, 4, 4, 2, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  30, 'random', true, true, 30, false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  hide_chord_names_in_battle = EXCLUDED.hide_chord_names_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  0, 1, 1, 4,
  'G2',
  ARRAY['G2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  1, 2, 1, 4,
  'A2',
  ARRAY['A2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  2, 3, 1, 4,
  'B2',
  ARRAY['B2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  3, 4, 1, 4,
  'C3',
  ARRAY['C3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  4, 5, 1, 4,
  'D3',
  ARRAY['D3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  5, 6, 1, 4,
  'E3',
  ARRAY['E3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  6, 7, 1, 4,
  'F3',
  ARRAY['F3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  7, 8, 1, 4,
  'G3',
  ARRAY['G3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  8, 9, 1, 4,
  'A1',
  ARRAY['A1']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  9, 10, 1, 4,
  'B1',
  ARRAY['B1']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  10, 11, 1, 4,
  'C2',
  ARRAY['C2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  11, 12, 1, 4,
  'D2',
  ARRAY['D2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-12'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  12, 13, 1, 4,
  'E2',
  ARRAY['E2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-13'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  13, 14, 1, 4,
  'F2',
  ARRAY['F2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-14'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  14, 15, 1, 4,
  'B3',
  ARRAY['B3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  15, 16, 1, 4,
  'C4',
  ARRAY['C4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-16'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  16, 17, 1, 4,
  'D4',
  ARRAY['D4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-17'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  17, 18, 1, 4,
  'E4',
  ARRAY['E4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-18'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  18, 19, 1, 4,
  'F4',
  ARRAY['F4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-19'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  19, 20, 1, 4,
  'G4',
  ARRAY['G4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b9-q1'),
  'notation-quiz-b9-q1',
  '譜読みクイズ: 大譜表まとめ',
  'Sight-reading quiz: Grand staff review',
  '30秒以内に30問正解。譜面の音符を読んで弾きましょう。',
  'Answer 30 questions within 30 seconds by reading the staff.',
  120, 0, 4, 4, 2, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  30, 'random', true, true, 30, false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  hide_chord_names_in_battle = EXCLUDED.hide_chord_names_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b9-q1-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b9-q1'),
  0, 1, 1, 4,
  'A3',
  ARRAY['A3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b9-q1-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b9-q1'),
  1, 2, 1, 4,
  'B3',
  ARRAY['B3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b9-q1-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b9-q1'),
  2, 3, 1, 4,
  'C4',
  ARRAY['C4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b9-q1-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b9-q1'),
  3, 4, 1, 4,
  'D4',
  ARRAY['D4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b9-q1-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b9-q1'),
  4, 5, 1, 4,
  'C4',
  ARRAY['C4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b9-q1-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b9-q1'),
  5, 6, 1, 4,
  'D4',
  ARRAY['D4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b9-q1-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b9-q1'),
  6, 7, 1, 4,
  'E4',
  ARRAY['E4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b9-q1-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b9-q1'),
  7, 8, 1, 4,
  'F4',
  ARRAY['F4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q1'),
  'notation-quiz-b10-q1',
  '譜読みクイズ: 五線の中（ト音）＋♯',
  'Sight-reading quiz: Treble staff + sharps',
  '30秒以内に30問正解。譜面の音符を読んで弾きましょう。',
  'Answer 30 questions within 30 seconds by reading the staff.',
  120, 0, 4, 4, 2, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  30, 'random', true, true, 30, false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  hide_chord_names_in_battle = EXCLUDED.hide_chord_names_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q1-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q1'),
  0, 1, 1, 4,
  'F#4',
  ARRAY['F#4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q1-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q1'),
  1, 2, 1, 4,
  'G#4',
  ARRAY['G#4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q1-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q1'),
  2, 3, 1, 4,
  'A#4',
  ARRAY['A#4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q1-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q1'),
  3, 4, 1, 4,
  'C#5',
  ARRAY['C#5']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q1-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q1'),
  4, 5, 1, 4,
  'D#5',
  ARRAY['D#5']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q2'),
  'notation-quiz-b10-q2',
  '譜読みクイズ: 五線の中（ヘ音）＋♯',
  'Sight-reading quiz: Bass staff + sharps',
  '30秒以内に30問正解。譜面の音符を読んで弾きましょう。',
  'Answer 30 questions within 30 seconds by reading the staff.',
  120, 0, 4, 4, 2, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  30, 'random', true, true, 30, false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  hide_chord_names_in_battle = EXCLUDED.hide_chord_names_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q2-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q2'),
  0, 1, 1, 4,
  'F#2',
  ARRAY['F#2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q2-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q2'),
  1, 2, 1, 4,
  'G#2',
  ARRAY['G#2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q2-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q2'),
  2, 3, 1, 4,
  'A#2',
  ARRAY['A#2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q2-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q2'),
  3, 4, 1, 4,
  'C#3',
  ARRAY['C#3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q2-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q2'),
  4, 5, 1, 4,
  'D#3',
  ARRAY['D#3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q3'),
  'notation-quiz-b10-q3',
  '譜読みクイズ: まとめ（全て＋♯）',
  'Sight-reading quiz: Review (all + sharps)',
  '30秒以内に30問正解。譜面の音符を読んで弾きましょう。',
  'Answer 30 questions within 30 seconds by reading the staff.',
  120, 0, 4, 4, 2, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  30, 'random', true, true, 30, false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  hide_chord_names_in_battle = EXCLUDED.hide_chord_names_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q3-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q3'),
  0, 1, 1, 4,
  'F#4',
  ARRAY['F#4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q3-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q3'),
  1, 2, 1, 4,
  'G#4',
  ARRAY['G#4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q3-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q3'),
  2, 3, 1, 4,
  'A#4',
  ARRAY['A#4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q3-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q3'),
  3, 4, 1, 4,
  'C#5',
  ARRAY['C#5']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q3-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q3'),
  4, 5, 1, 4,
  'D#5',
  ARRAY['D#5']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q3-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q3'),
  5, 6, 1, 4,
  'F#2',
  ARRAY['F#2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q3-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q3'),
  6, 7, 1, 4,
  'G#2',
  ARRAY['G#2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q3-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q3'),
  7, 8, 1, 4,
  'A#2',
  ARRAY['A#2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q3-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q3'),
  8, 9, 1, 4,
  'C#3',
  ARRAY['C#3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q3-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q3'),
  9, 10, 1, 4,
  'D#3',
  ARRAY['D#3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q1'),
  'notation-quiz-b11-q1',
  '譜読みクイズ: 五線の中（ト音）＋♭',
  'Sight-reading quiz: Treble staff + flats',
  '30秒以内に30問正解。譜面の音符を読んで弾きましょう。',
  'Answer 30 questions within 30 seconds by reading the staff.',
  120, 0, 4, 4, 2, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  30, 'random', true, true, 30, false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  hide_chord_names_in_battle = EXCLUDED.hide_chord_names_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q1-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q1'),
  0, 1, 1, 4,
  'Bb4',
  ARRAY['Bb4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q1-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q1'),
  1, 2, 1, 4,
  'Eb4',
  ARRAY['Eb4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q1-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q1'),
  2, 3, 1, 4,
  'Ab4',
  ARRAY['Ab4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q1-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q1'),
  3, 4, 1, 4,
  'Gb4',
  ARRAY['Gb4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q1-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q1'),
  4, 5, 1, 4,
  'Db5',
  ARRAY['Db5']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q2'),
  'notation-quiz-b11-q2',
  '譜読みクイズ: 五線の中（ヘ音）＋♭',
  'Sight-reading quiz: Bass staff + flats',
  '30秒以内に30問正解。譜面の音符を読んで弾きましょう。',
  'Answer 30 questions within 30 seconds by reading the staff.',
  120, 0, 4, 4, 2, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  30, 'random', true, true, 30, false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  hide_chord_names_in_battle = EXCLUDED.hide_chord_names_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q2-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q2'),
  0, 1, 1, 4,
  'Bb2',
  ARRAY['Bb2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q2-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q2'),
  1, 2, 1, 4,
  'Eb3',
  ARRAY['Eb3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q2-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q2'),
  2, 3, 1, 4,
  'Ab2',
  ARRAY['Ab2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q2-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q2'),
  3, 4, 1, 4,
  'Gb2',
  ARRAY['Gb2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q2-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q2'),
  4, 5, 1, 4,
  'Db3',
  ARRAY['Db3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q3'),
  'notation-quiz-b11-q3',
  '譜読みクイズ: まとめ（全て＋♭）',
  'Sight-reading quiz: Review (all + flats)',
  '30秒以内に30問正解。譜面の音符を読んで弾きましょう。',
  'Answer 30 questions within 30 seconds by reading the staff.',
  120, 0, 4, 4, 2, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  30, 'random', true, true, 30, false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  hide_chord_names_in_battle = EXCLUDED.hide_chord_names_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q3-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q3'),
  0, 1, 1, 4,
  'Bb4',
  ARRAY['Bb4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q3-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q3'),
  1, 2, 1, 4,
  'Eb4',
  ARRAY['Eb4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q3-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q3'),
  2, 3, 1, 4,
  'Ab4',
  ARRAY['Ab4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q3-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q3'),
  3, 4, 1, 4,
  'Gb4',
  ARRAY['Gb4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q3-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q3'),
  4, 5, 1, 4,
  'Db5',
  ARRAY['Db5']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q3-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q3'),
  5, 6, 1, 4,
  'Bb2',
  ARRAY['Bb2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q3-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q3'),
  6, 7, 1, 4,
  'Eb3',
  ARRAY['Eb3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q3-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q3'),
  7, 8, 1, 4,
  'Ab2',
  ARRAY['Ab2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q3-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q3'),
  8, 9, 1, 4,
  'Gb2',
  ARRAY['Gb2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q3-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q3'),
  9, 10, 1, 4,
  'Db3',
  ARRAY['Db3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  'notation-quiz-b12-q1',
  '譜読みクイズ: 総仕上げ（ファイナル）',
  'Sight-reading quiz: Final review',
  '30秒以内に30問正解。譜面の音符を読んで弾きましょう。',
  'Answer 30 questions within 30 seconds by reading the staff.',
  120, 0, 4, 4, 2, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  30, 'random', true, true, 30, false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  hide_chord_names_in_battle = EXCLUDED.hide_chord_names_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  0, 1, 1, 4,
  'E4',
  ARRAY['E4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  1, 2, 1, 4,
  'F4',
  ARRAY['F4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  2, 3, 1, 4,
  'G4',
  ARRAY['G4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  3, 4, 1, 4,
  'A4',
  ARRAY['A4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  4, 5, 1, 4,
  'B4',
  ARRAY['B4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  5, 6, 1, 4,
  'C5',
  ARRAY['C5']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  6, 7, 1, 4,
  'D5',
  ARRAY['D5']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  7, 8, 1, 4,
  'E5',
  ARRAY['E5']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  8, 9, 1, 4,
  'G5',
  ARRAY['G5']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  9, 10, 1, 4,
  'A5',
  ARRAY['A5']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  10, 11, 1, 4,
  'B5',
  ARRAY['B5']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  11, 12, 1, 4,
  'C6',
  ARRAY['C6']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-12'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  12, 13, 1, 4,
  'D6',
  ARRAY['D6']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-13'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  13, 14, 1, 4,
  'E6',
  ARRAY['E6']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-14'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  14, 15, 1, 4,
  'F3',
  ARRAY['F3']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  15, 16, 1, 4,
  'G3',
  ARRAY['G3']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-16'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  16, 17, 1, 4,
  'A3',
  ARRAY['A3']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-17'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  17, 18, 1, 4,
  'B3',
  ARRAY['B3']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-18'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  18, 19, 1, 4,
  'C4',
  ARRAY['C4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-19'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  19, 20, 1, 4,
  'D4',
  ARRAY['D4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  20, 21, 1, 4,
  'G2',
  ARRAY['G2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-21'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  21, 22, 1, 4,
  'A2',
  ARRAY['A2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-22'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  22, 23, 1, 4,
  'B2',
  ARRAY['B2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-23'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  23, 24, 1, 4,
  'C3',
  ARRAY['C3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-24'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  24, 25, 1, 4,
  'D3',
  ARRAY['D3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-25'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  25, 26, 1, 4,
  'E3',
  ARRAY['E3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-26'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  26, 27, 1, 4,
  'F3',
  ARRAY['F3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-27'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  27, 28, 1, 4,
  'G3',
  ARRAY['G3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-28'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  28, 29, 1, 4,
  'A1',
  ARRAY['A1']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-29'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  29, 30, 1, 4,
  'B1',
  ARRAY['B1']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-30'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  30, 31, 1, 4,
  'C2',
  ARRAY['C2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-31'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  31, 32, 1, 4,
  'D2',
  ARRAY['D2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-32'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  32, 33, 1, 4,
  'E2',
  ARRAY['E2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-33'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  33, 34, 1, 4,
  'F2',
  ARRAY['F2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-34'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  34, 35, 1, 4,
  'B3',
  ARRAY['B3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-35'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  35, 36, 1, 4,
  'C4',
  ARRAY['C4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-36'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  36, 37, 1, 4,
  'D4',
  ARRAY['D4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-37'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  37, 38, 1, 4,
  'E4',
  ARRAY['E4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-38'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  38, 39, 1, 4,
  'F4',
  ARRAY['F4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-39'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  39, 40, 1, 4,
  'G4',
  ARRAY['G4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-40'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  40, 41, 1, 4,
  'A3',
  ARRAY['A3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-41'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  41, 42, 1, 4,
  'F#4',
  ARRAY['F#4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-42'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  42, 43, 1, 4,
  'G#4',
  ARRAY['G#4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-43'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  43, 44, 1, 4,
  'A#4',
  ARRAY['A#4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-44'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  44, 45, 1, 4,
  'C#5',
  ARRAY['C#5']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-45'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  45, 46, 1, 4,
  'D#5',
  ARRAY['D#5']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-46'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  46, 47, 1, 4,
  'F#2',
  ARRAY['F#2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-47'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  47, 48, 1, 4,
  'G#2',
  ARRAY['G#2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-48'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  48, 49, 1, 4,
  'A#2',
  ARRAY['A#2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-49'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  49, 50, 1, 4,
  'C#3',
  ARRAY['C#3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-50'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  50, 51, 1, 4,
  'D#3',
  ARRAY['D#3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-51'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  51, 52, 1, 4,
  'Bb4',
  ARRAY['Bb4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-52'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  52, 53, 1, 4,
  'Eb4',
  ARRAY['Eb4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-53'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  53, 54, 1, 4,
  'Ab4',
  ARRAY['Ab4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-54'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  54, 55, 1, 4,
  'Gb4',
  ARRAY['Gb4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-55'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  55, 56, 1, 4,
  'Db5',
  ARRAY['Db5']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-56'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  56, 57, 1, 4,
  'Bb2',
  ARRAY['Bb2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-57'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  57, 58, 1, 4,
  'Eb3',
  ARRAY['Eb3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-58'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  58, 59, 1, 4,
  'Ab2',
  ARRAY['Ab2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-59'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  59, 60, 1, 4,
  'Gb2',
  ARRAY['Gb2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-60'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  60, 61, 1, 4,
  'Db3',
  ARRAY['Db3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-reading-notation'),
  'ソラシドレ',
  'G A B C D',
  'ヘ音記号・五線の中。ソからレまでの5音です。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  'Bass clef, notes on the staff: G through D.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  true,
  12, 5,
  '五線の中の音符（ヘ音記号）', 'Bass clef: notes on the staff',
  'ヘ音記号の五線の中の音符を、5音ずつ覚えていきます。', 'Learn bass-clef notes on the staff, five at a time.',
  '[]'::jsonb,
  '①風船: 120秒で80個 ②サバイバル: ランダム ③バトル: 30秒で30問',
  '① Balloon: 80 in 120s ② Survival: random ③ Battle: 30 in 30s'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_number = EXCLUDED.block_number,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  block_description = EXCLUDED.block_description,
  block_description_en = EXCLUDED.block_description_en,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id,
  is_survival, survival_stage_number, survival_map_category,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  survival_random_chords, survival_lesson_overrides,
  title, title_en, is_clear_required
) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b5-q1-balloon'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q1'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'notation-balloon-random'), false, NULL,
   '[{"name":"G2","voicing":[43],"voicing_names":["G2"],"voicing_staves":[2],"key_fifths":0},{"name":"A2","voicing":[45],"voicing_names":["A2"],"voicing_staves":[2],"key_fifths":0},{"name":"B2","voicing":[47],"voicing_names":["B2"],"voicing_staves":[2],"key_fifths":0},{"name":"C3","voicing":[48],"voicing_names":["C3"],"voicing_staves":[2],"key_fifths":0},{"name":"D3","voicing":[50],"voicing_names":["D3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b5-q1-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q1'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"G2","voicing":[43],"voicing_names":["G2"],"voicing_staves":[2],"key_fifths":0},{"name":"A2","voicing":[45],"voicing_names":["A2"],"voicing_staves":[2],"key_fifths":0},{"name":"B2","voicing":[47],"voicing_names":["B2"],"voicing_staves":[2],"key_fifths":0},{"name":"C3","voicing":[48],"voicing_names":["C3"],"voicing_staves":[2],"key_fifths":0},{"name":"D3","voicing":[50],"voicing_names":["D3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
   '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb,
   'サバイバル', 'Survival', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b5-q1-battle'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q1'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q1'), NULL, NULL,
   'バトルモード', 'Battle mode', true)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  survival_random_chords = EXCLUDED.survival_random_chords,
  survival_lesson_overrides = EXCLUDED.survival_lesson_overrides,
  is_balloon_rush = EXCLUDED.is_balloon_rush,
  balloon_rush_stage_id = EXCLUDED.balloon_rush_stage_id,
  is_survival = EXCLUDED.is_survival,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-reading-notation'),
  'ラシドレミ',
  'A B C D E',
  'ヘ音記号・五線の中。ラからミまで読みましょう。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  'Bass clef, notes on the staff: A through E.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  true,
  13, 5,
  '五線の中の音符（ヘ音記号）', 'Bass clef: notes on the staff',
  'ヘ音記号の五線の中の音符を、5音ずつ覚えていきます。', 'Learn bass-clef notes on the staff, five at a time.',
  '[]'::jsonb,
  '①風船: 120秒で80個 ②サバイバル: ランダム ③バトル: 30秒で30問',
  '① Balloon: 80 in 120s ② Survival: random ③ Battle: 30 in 30s'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_number = EXCLUDED.block_number,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  block_description = EXCLUDED.block_description,
  block_description_en = EXCLUDED.block_description_en,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id,
  is_survival, survival_stage_number, survival_map_category,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  survival_random_chords, survival_lesson_overrides,
  title, title_en, is_clear_required
) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b5-q2-balloon'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q2'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'notation-balloon-random'), false, NULL,
   '[{"name":"A2","voicing":[45],"voicing_names":["A2"],"voicing_staves":[2],"key_fifths":0},{"name":"B2","voicing":[47],"voicing_names":["B2"],"voicing_staves":[2],"key_fifths":0},{"name":"C3","voicing":[48],"voicing_names":["C3"],"voicing_staves":[2],"key_fifths":0},{"name":"D3","voicing":[50],"voicing_names":["D3"],"voicing_staves":[2],"key_fifths":0},{"name":"E3","voicing":[52],"voicing_names":["E3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b5-q2-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q2'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"A2","voicing":[45],"voicing_names":["A2"],"voicing_staves":[2],"key_fifths":0},{"name":"B2","voicing":[47],"voicing_names":["B2"],"voicing_staves":[2],"key_fifths":0},{"name":"C3","voicing":[48],"voicing_names":["C3"],"voicing_staves":[2],"key_fifths":0},{"name":"D3","voicing":[50],"voicing_names":["D3"],"voicing_staves":[2],"key_fifths":0},{"name":"E3","voicing":[52],"voicing_names":["E3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
   '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb,
   'サバイバル', 'Survival', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b5-q2-battle'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q2'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q2'), NULL, NULL,
   'バトルモード', 'Battle mode', true)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  survival_random_chords = EXCLUDED.survival_random_chords,
  survival_lesson_overrides = EXCLUDED.survival_lesson_overrides,
  is_balloon_rush = EXCLUDED.is_balloon_rush,
  balloon_rush_stage_id = EXCLUDED.balloon_rush_stage_id,
  is_survival = EXCLUDED.is_survival,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-reading-notation'),
  'シドレミファ',
  'B C D E F',
  'ヘ音記号・五線の中。シからファまでの5音です。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  'Bass clef, notes on the staff: B through F.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  true,
  14, 5,
  '五線の中の音符（ヘ音記号）', 'Bass clef: notes on the staff',
  'ヘ音記号の五線の中の音符を、5音ずつ覚えていきます。', 'Learn bass-clef notes on the staff, five at a time.',
  '[]'::jsonb,
  '①風船: 120秒で80個 ②サバイバル: ランダム ③バトル: 30秒で30問',
  '① Balloon: 80 in 120s ② Survival: random ③ Battle: 30 in 30s'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_number = EXCLUDED.block_number,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  block_description = EXCLUDED.block_description,
  block_description_en = EXCLUDED.block_description_en,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id,
  is_survival, survival_stage_number, survival_map_category,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  survival_random_chords, survival_lesson_overrides,
  title, title_en, is_clear_required
) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b5-q3-balloon'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q3'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'notation-balloon-random'), false, NULL,
   '[{"name":"B2","voicing":[47],"voicing_names":["B2"],"voicing_staves":[2],"key_fifths":0},{"name":"C3","voicing":[48],"voicing_names":["C3"],"voicing_staves":[2],"key_fifths":0},{"name":"D3","voicing":[50],"voicing_names":["D3"],"voicing_staves":[2],"key_fifths":0},{"name":"E3","voicing":[52],"voicing_names":["E3"],"voicing_staves":[2],"key_fifths":0},{"name":"F3","voicing":[53],"voicing_names":["F3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b5-q3-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q3'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"B2","voicing":[47],"voicing_names":["B2"],"voicing_staves":[2],"key_fifths":0},{"name":"C3","voicing":[48],"voicing_names":["C3"],"voicing_staves":[2],"key_fifths":0},{"name":"D3","voicing":[50],"voicing_names":["D3"],"voicing_staves":[2],"key_fifths":0},{"name":"E3","voicing":[52],"voicing_names":["E3"],"voicing_staves":[2],"key_fifths":0},{"name":"F3","voicing":[53],"voicing_names":["F3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
   '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb,
   'サバイバル', 'Survival', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b5-q3-battle'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q3'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q3'), NULL, NULL,
   'バトルモード', 'Battle mode', true)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  survival_random_chords = EXCLUDED.survival_random_chords,
  survival_lesson_overrides = EXCLUDED.survival_lesson_overrides,
  is_balloon_rush = EXCLUDED.is_balloon_rush,
  balloon_rush_stage_id = EXCLUDED.balloon_rush_stage_id,
  is_survival = EXCLUDED.is_survival,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-reading-notation'),
  'ドレミファソ',
  'C D E F G',
  'ヘ音記号・五線の中。ドからソまで読みましょう。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  'Bass clef, notes on the staff: C through G.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  true,
  15, 5,
  '五線の中の音符（ヘ音記号）', 'Bass clef: notes on the staff',
  'ヘ音記号の五線の中の音符を、5音ずつ覚えていきます。', 'Learn bass-clef notes on the staff, five at a time.',
  '[]'::jsonb,
  '①風船: 120秒で80個 ②サバイバル: ランダム ③バトル: 30秒で30問',
  '① Balloon: 80 in 120s ② Survival: random ③ Battle: 30 in 30s'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_number = EXCLUDED.block_number,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  block_description = EXCLUDED.block_description,
  block_description_en = EXCLUDED.block_description_en,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id,
  is_survival, survival_stage_number, survival_map_category,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  survival_random_chords, survival_lesson_overrides,
  title, title_en, is_clear_required
) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b5-q4-balloon'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q4'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'notation-balloon-random'), false, NULL,
   '[{"name":"C3","voicing":[48],"voicing_names":["C3"],"voicing_staves":[2],"key_fifths":0},{"name":"D3","voicing":[50],"voicing_names":["D3"],"voicing_staves":[2],"key_fifths":0},{"name":"E3","voicing":[52],"voicing_names":["E3"],"voicing_staves":[2],"key_fifths":0},{"name":"F3","voicing":[53],"voicing_names":["F3"],"voicing_staves":[2],"key_fifths":0},{"name":"G3","voicing":[55],"voicing_names":["G3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b5-q4-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q4'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"C3","voicing":[48],"voicing_names":["C3"],"voicing_staves":[2],"key_fifths":0},{"name":"D3","voicing":[50],"voicing_names":["D3"],"voicing_staves":[2],"key_fifths":0},{"name":"E3","voicing":[52],"voicing_names":["E3"],"voicing_staves":[2],"key_fifths":0},{"name":"F3","voicing":[53],"voicing_names":["F3"],"voicing_staves":[2],"key_fifths":0},{"name":"G3","voicing":[55],"voicing_names":["G3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
   '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb,
   'サバイバル', 'Survival', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b5-q4-battle'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q4'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q4'), NULL, NULL,
   'バトルモード', 'Battle mode', true)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  survival_random_chords = EXCLUDED.survival_random_chords,
  survival_lesson_overrides = EXCLUDED.survival_lesson_overrides,
  is_balloon_rush = EXCLUDED.is_balloon_rush,
  balloon_rush_stage_id = EXCLUDED.balloon_rush_stage_id,
  is_survival = EXCLUDED.is_survival,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-reading-notation'),
  'まとめ（全て）',
  'Review (all)',
  'ヘ音記号・五線の中の音符をすべて復習します。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  'Review all bass-clef notes within the staff.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  true,
  16, 5,
  '五線の中の音符（ヘ音記号）', 'Bass clef: notes on the staff',
  'ヘ音記号の五線の中の音符を、5音ずつ覚えていきます。', 'Learn bass-clef notes on the staff, five at a time.',
  '[]'::jsonb,
  '①風船: 120秒で80個 ②サバイバル: ランダム ③バトル: 30秒で30問',
  '① Balloon: 80 in 120s ② Survival: random ③ Battle: 30 in 30s'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_number = EXCLUDED.block_number,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  block_description = EXCLUDED.block_description,
  block_description_en = EXCLUDED.block_description_en,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id,
  is_survival, survival_stage_number, survival_map_category,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  survival_random_chords, survival_lesson_overrides,
  title, title_en, is_clear_required
) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b5-q5-balloon'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q5'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'notation-balloon-random'), false, NULL,
   '[{"name":"G2","voicing":[43],"voicing_names":["G2"],"voicing_staves":[2],"key_fifths":0},{"name":"A2","voicing":[45],"voicing_names":["A2"],"voicing_staves":[2],"key_fifths":0},{"name":"B2","voicing":[47],"voicing_names":["B2"],"voicing_staves":[2],"key_fifths":0},{"name":"C3","voicing":[48],"voicing_names":["C3"],"voicing_staves":[2],"key_fifths":0},{"name":"D3","voicing":[50],"voicing_names":["D3"],"voicing_staves":[2],"key_fifths":0},{"name":"E3","voicing":[52],"voicing_names":["E3"],"voicing_staves":[2],"key_fifths":0},{"name":"F3","voicing":[53],"voicing_names":["F3"],"voicing_staves":[2],"key_fifths":0},{"name":"G3","voicing":[55],"voicing_names":["G3"],"voicing_staves":[2],"key_fifths":0},{"name":"A3","voicing":[57],"voicing_names":["A3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b5-q5-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q5'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"G2","voicing":[43],"voicing_names":["G2"],"voicing_staves":[2],"key_fifths":0},{"name":"A2","voicing":[45],"voicing_names":["A2"],"voicing_staves":[2],"key_fifths":0},{"name":"B2","voicing":[47],"voicing_names":["B2"],"voicing_staves":[2],"key_fifths":0},{"name":"C3","voicing":[48],"voicing_names":["C3"],"voicing_staves":[2],"key_fifths":0},{"name":"D3","voicing":[50],"voicing_names":["D3"],"voicing_staves":[2],"key_fifths":0},{"name":"E3","voicing":[52],"voicing_names":["E3"],"voicing_staves":[2],"key_fifths":0},{"name":"F3","voicing":[53],"voicing_names":["F3"],"voicing_staves":[2],"key_fifths":0},{"name":"G3","voicing":[55],"voicing_names":["G3"],"voicing_staves":[2],"key_fifths":0},{"name":"A3","voicing":[57],"voicing_names":["A3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
   '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb,
   'サバイバル', 'Survival', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b5-q5-battle'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q5'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q5'), NULL, NULL,
   'バトルモード', 'Battle mode', true)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  survival_random_chords = EXCLUDED.survival_random_chords,
  survival_lesson_overrides = EXCLUDED.survival_lesson_overrides,
  is_balloon_rush = EXCLUDED.is_balloon_rush,
  balloon_rush_stage_id = EXCLUDED.balloon_rush_stage_id,
  is_survival = EXCLUDED.is_survival,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b6-q1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-reading-notation'),
  'ラシドレミ',
  'A B C D E',
  'ヘ音記号・下加線。ラからミまでの5音です。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  'Bass clef, lower ledger lines: A through E.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  true,
  17, 6,
  '五線の下加線（ヘ音記号）', 'Bass clef: lower ledger lines',
  'ヘ音記号・五線の下の加線音符を読みましょう。', 'Read notes on lower ledger lines below the bass staff.',
  '[]'::jsonb,
  '①風船: 120秒で80個 ②サバイバル: ランダム ③バトル: 30秒で30問',
  '① Balloon: 80 in 120s ② Survival: random ③ Battle: 30 in 30s'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_number = EXCLUDED.block_number,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  block_description = EXCLUDED.block_description,
  block_description_en = EXCLUDED.block_description_en,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id,
  is_survival, survival_stage_number, survival_map_category,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  survival_random_chords, survival_lesson_overrides,
  title, title_en, is_clear_required
) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b6-q1-balloon'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b6-q1'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'notation-balloon-random'), false, NULL,
   '[{"name":"A1","voicing":[33],"voicing_names":["A1"],"voicing_staves":[2],"key_fifths":0},{"name":"B1","voicing":[35],"voicing_names":["B1"],"voicing_staves":[2],"key_fifths":0},{"name":"C2","voicing":[36],"voicing_names":["C2"],"voicing_staves":[2],"key_fifths":0},{"name":"D2","voicing":[38],"voicing_names":["D2"],"voicing_staves":[2],"key_fifths":0},{"name":"E2","voicing":[40],"voicing_names":["E2"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b6-q1-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b6-q1'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"A1","voicing":[33],"voicing_names":["A1"],"voicing_staves":[2],"key_fifths":0},{"name":"B1","voicing":[35],"voicing_names":["B1"],"voicing_staves":[2],"key_fifths":0},{"name":"C2","voicing":[36],"voicing_names":["C2"],"voicing_staves":[2],"key_fifths":0},{"name":"D2","voicing":[38],"voicing_names":["D2"],"voicing_staves":[2],"key_fifths":0},{"name":"E2","voicing":[40],"voicing_names":["E2"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
   '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb,
   'サバイバル', 'Survival', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b6-q1-battle'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b6-q1'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q1'), NULL, NULL,
   'バトルモード', 'Battle mode', true)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  survival_random_chords = EXCLUDED.survival_random_chords,
  survival_lesson_overrides = EXCLUDED.survival_lesson_overrides,
  is_balloon_rush = EXCLUDED.is_balloon_rush,
  balloon_rush_stage_id = EXCLUDED.balloon_rush_stage_id,
  is_survival = EXCLUDED.is_survival,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b6-q2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-reading-notation'),
  'シドレミファ',
  'B C D E F',
  'ヘ音記号・下加線。シからファまで読みましょう。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  'Bass clef, lower ledger lines: B through F.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  true,
  18, 6,
  '五線の下加線（ヘ音記号）', 'Bass clef: lower ledger lines',
  'ヘ音記号・五線の下の加線音符を読みましょう。', 'Read notes on lower ledger lines below the bass staff.',
  '[]'::jsonb,
  '①風船: 120秒で80個 ②サバイバル: ランダム ③バトル: 30秒で30問',
  '① Balloon: 80 in 120s ② Survival: random ③ Battle: 30 in 30s'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_number = EXCLUDED.block_number,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  block_description = EXCLUDED.block_description,
  block_description_en = EXCLUDED.block_description_en,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id,
  is_survival, survival_stage_number, survival_map_category,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  survival_random_chords, survival_lesson_overrides,
  title, title_en, is_clear_required
) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b6-q2-balloon'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b6-q2'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'notation-balloon-random'), false, NULL,
   '[{"name":"B1","voicing":[35],"voicing_names":["B1"],"voicing_staves":[2],"key_fifths":0},{"name":"C2","voicing":[36],"voicing_names":["C2"],"voicing_staves":[2],"key_fifths":0},{"name":"D2","voicing":[38],"voicing_names":["D2"],"voicing_staves":[2],"key_fifths":0},{"name":"E2","voicing":[40],"voicing_names":["E2"],"voicing_staves":[2],"key_fifths":0},{"name":"F2","voicing":[41],"voicing_names":["F2"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b6-q2-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b6-q2'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"B1","voicing":[35],"voicing_names":["B1"],"voicing_staves":[2],"key_fifths":0},{"name":"C2","voicing":[36],"voicing_names":["C2"],"voicing_staves":[2],"key_fifths":0},{"name":"D2","voicing":[38],"voicing_names":["D2"],"voicing_staves":[2],"key_fifths":0},{"name":"E2","voicing":[40],"voicing_names":["E2"],"voicing_staves":[2],"key_fifths":0},{"name":"F2","voicing":[41],"voicing_names":["F2"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
   '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb,
   'サバイバル', 'Survival', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b6-q2-battle'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b6-q2'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q2'), NULL, NULL,
   'バトルモード', 'Battle mode', true)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  survival_random_chords = EXCLUDED.survival_random_chords,
  survival_lesson_overrides = EXCLUDED.survival_lesson_overrides,
  is_balloon_rush = EXCLUDED.is_balloon_rush,
  balloon_rush_stage_id = EXCLUDED.balloon_rush_stage_id,
  is_survival = EXCLUDED.is_survival,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b6-q5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-reading-notation'),
  'まとめ（全て）',
  'Review (all)',
  'ヘ音記号・下加線の音符をすべて復習します。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  'Review all bass-clef lower-ledger notes.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  true,
  19, 6,
  '五線の下加線（ヘ音記号）', 'Bass clef: lower ledger lines',
  'ヘ音記号・五線の下の加線音符を読みましょう。', 'Read notes on lower ledger lines below the bass staff.',
  '[]'::jsonb,
  '①風船: 120秒で80個 ②サバイバル: ランダム ③バトル: 30秒で30問',
  '① Balloon: 80 in 120s ② Survival: random ③ Battle: 30 in 30s'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_number = EXCLUDED.block_number,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  block_description = EXCLUDED.block_description,
  block_description_en = EXCLUDED.block_description_en,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id,
  is_survival, survival_stage_number, survival_map_category,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  survival_random_chords, survival_lesson_overrides,
  title, title_en, is_clear_required
) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b6-q5-balloon'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b6-q5'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'notation-balloon-random'), false, NULL,
   '[{"name":"A1","voicing":[33],"voicing_names":["A1"],"voicing_staves":[2],"key_fifths":0},{"name":"B1","voicing":[35],"voicing_names":["B1"],"voicing_staves":[2],"key_fifths":0},{"name":"C2","voicing":[36],"voicing_names":["C2"],"voicing_staves":[2],"key_fifths":0},{"name":"D2","voicing":[38],"voicing_names":["D2"],"voicing_staves":[2],"key_fifths":0},{"name":"E2","voicing":[40],"voicing_names":["E2"],"voicing_staves":[2],"key_fifths":0},{"name":"F2","voicing":[41],"voicing_names":["F2"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b6-q5-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b6-q5'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"A1","voicing":[33],"voicing_names":["A1"],"voicing_staves":[2],"key_fifths":0},{"name":"B1","voicing":[35],"voicing_names":["B1"],"voicing_staves":[2],"key_fifths":0},{"name":"C2","voicing":[36],"voicing_names":["C2"],"voicing_staves":[2],"key_fifths":0},{"name":"D2","voicing":[38],"voicing_names":["D2"],"voicing_staves":[2],"key_fifths":0},{"name":"E2","voicing":[40],"voicing_names":["E2"],"voicing_staves":[2],"key_fifths":0},{"name":"F2","voicing":[41],"voicing_names":["F2"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
   '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb,
   'サバイバル', 'Survival', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b6-q5-battle'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b6-q5'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q5'), NULL, NULL,
   'バトルモード', 'Battle mode', true)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  survival_random_chords = EXCLUDED.survival_random_chords,
  survival_lesson_overrides = EXCLUDED.survival_lesson_overrides,
  is_balloon_rush = EXCLUDED.is_balloon_rush,
  balloon_rush_stage_id = EXCLUDED.balloon_rush_stage_id,
  is_survival = EXCLUDED.is_survival,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b7-q1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-reading-notation'),
  'シドレミファ',
  'B C D E F',
  'ヘ音記号・上加線。シからファまでの5音です。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  'Bass clef, upper ledger lines: B through F.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  true,
  20, 7,
  '五線の上加線（ヘ音記号）', 'Bass clef: upper ledger lines',
  'ヘ音記号・五線の上の加線音符を読みましょう。', 'Read notes on upper ledger lines above the bass staff.',
  '[]'::jsonb,
  '①風船: 120秒で80個 ②サバイバル: ランダム ③バトル: 30秒で30問',
  '① Balloon: 80 in 120s ② Survival: random ③ Battle: 30 in 30s'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_number = EXCLUDED.block_number,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  block_description = EXCLUDED.block_description,
  block_description_en = EXCLUDED.block_description_en,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id,
  is_survival, survival_stage_number, survival_map_category,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  survival_random_chords, survival_lesson_overrides,
  title, title_en, is_clear_required
) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b7-q1-balloon'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b7-q1'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'notation-balloon-random'), false, NULL,
   '[{"name":"B3","voicing":[59],"voicing_names":["B3"],"voicing_staves":[2],"key_fifths":0},{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[2],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[2],"key_fifths":0},{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[2],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b7-q1-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b7-q1'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"B3","voicing":[59],"voicing_names":["B3"],"voicing_staves":[2],"key_fifths":0},{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[2],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[2],"key_fifths":0},{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[2],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
   '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb,
   'サバイバル', 'Survival', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b7-q1-battle'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b7-q1'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q1'), NULL, NULL,
   'バトルモード', 'Battle mode', true)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  survival_random_chords = EXCLUDED.survival_random_chords,
  survival_lesson_overrides = EXCLUDED.survival_lesson_overrides,
  is_balloon_rush = EXCLUDED.is_balloon_rush,
  balloon_rush_stage_id = EXCLUDED.balloon_rush_stage_id,
  is_survival = EXCLUDED.is_survival,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b7-q2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-reading-notation'),
  'ドレミファソ',
  'C D E F G',
  'ヘ音記号・上加線。ドからソまで読みましょう。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  'Bass clef, upper ledger lines: C through G.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  true,
  21, 7,
  '五線の上加線（ヘ音記号）', 'Bass clef: upper ledger lines',
  'ヘ音記号・五線の上の加線音符を読みましょう。', 'Read notes on upper ledger lines above the bass staff.',
  '[]'::jsonb,
  '①風船: 120秒で80個 ②サバイバル: ランダム ③バトル: 30秒で30問',
  '① Balloon: 80 in 120s ② Survival: random ③ Battle: 30 in 30s'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_number = EXCLUDED.block_number,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  block_description = EXCLUDED.block_description,
  block_description_en = EXCLUDED.block_description_en,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id,
  is_survival, survival_stage_number, survival_map_category,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  survival_random_chords, survival_lesson_overrides,
  title, title_en, is_clear_required
) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b7-q2-balloon'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b7-q2'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'notation-balloon-random'), false, NULL,
   '[{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[2],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[2],"key_fifths":0},{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[2],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[2],"key_fifths":0},{"name":"G4","voicing":[67],"voicing_names":["G4"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b7-q2-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b7-q2'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[2],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[2],"key_fifths":0},{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[2],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[2],"key_fifths":0},{"name":"G4","voicing":[67],"voicing_names":["G4"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
   '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb,
   'サバイバル', 'Survival', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b7-q2-battle'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b7-q2'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q2'), NULL, NULL,
   'バトルモード', 'Battle mode', true)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  survival_random_chords = EXCLUDED.survival_random_chords,
  survival_lesson_overrides = EXCLUDED.survival_lesson_overrides,
  is_balloon_rush = EXCLUDED.is_balloon_rush,
  balloon_rush_stage_id = EXCLUDED.balloon_rush_stage_id,
  is_survival = EXCLUDED.is_survival,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b7-q5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-reading-notation'),
  'まとめ（全て）',
  'Review (all)',
  'ヘ音記号・上加線の音符をすべて復習します。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  'Review all bass-clef upper-ledger notes.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  true,
  22, 7,
  '五線の上加線（ヘ音記号）', 'Bass clef: upper ledger lines',
  'ヘ音記号・五線の上の加線音符を読みましょう。', 'Read notes on upper ledger lines above the bass staff.',
  '[]'::jsonb,
  '①風船: 120秒で80個 ②サバイバル: ランダム ③バトル: 30秒で30問',
  '① Balloon: 80 in 120s ② Survival: random ③ Battle: 30 in 30s'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_number = EXCLUDED.block_number,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  block_description = EXCLUDED.block_description,
  block_description_en = EXCLUDED.block_description_en,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id,
  is_survival, survival_stage_number, survival_map_category,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  survival_random_chords, survival_lesson_overrides,
  title, title_en, is_clear_required
) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b7-q5-balloon'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b7-q5'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'notation-balloon-random'), false, NULL,
   '[{"name":"B3","voicing":[59],"voicing_names":["B3"],"voicing_staves":[2],"key_fifths":0},{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[2],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[2],"key_fifths":0},{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[2],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[2],"key_fifths":0},{"name":"G4","voicing":[67],"voicing_names":["G4"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b7-q5-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b7-q5'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"B3","voicing":[59],"voicing_names":["B3"],"voicing_staves":[2],"key_fifths":0},{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[2],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[2],"key_fifths":0},{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[2],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[2],"key_fifths":0},{"name":"G4","voicing":[67],"voicing_names":["G4"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
   '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb,
   'サバイバル', 'Survival', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b7-q5-battle'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b7-q5'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q5'), NULL, NULL,
   'バトルモード', 'Battle mode', true)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  survival_random_chords = EXCLUDED.survival_random_chords,
  survival_lesson_overrides = EXCLUDED.survival_lesson_overrides,
  is_balloon_rush = EXCLUDED.is_balloon_rush,
  balloon_rush_stage_id = EXCLUDED.balloon_rush_stage_id,
  is_survival = EXCLUDED.is_survival,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b8-q1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-reading-notation'),
  'ヘ音記号 総合まとめ',
  'Bass clef review',
  '五線の中・下加線・上加線のヘ音記号音符をすべて復習します。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  'Review all bass-clef notes: staff, lower ledger, and upper ledger.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  true,
  23, 8,
  'ヘ音記号 総合まとめ', 'Bass clef review',
  'ヘ音記号の五線・下加線・上加線を総復習します。', 'Review all bass-clef staff and ledger-line notes.',
  '[]'::jsonb,
  '①風船: 120秒で80個 ②サバイバル: ランダム ③バトル: 30秒で30問',
  '① Balloon: 80 in 120s ② Survival: random ③ Battle: 30 in 30s'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_number = EXCLUDED.block_number,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  block_description = EXCLUDED.block_description,
  block_description_en = EXCLUDED.block_description_en,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id,
  is_survival, survival_stage_number, survival_map_category,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  survival_random_chords, survival_lesson_overrides,
  title, title_en, is_clear_required
) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b8-q1-balloon'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b8-q1'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'notation-balloon-random'), false, NULL,
   '[{"name":"G2","voicing":[43],"voicing_names":["G2"],"voicing_staves":[2],"key_fifths":0},{"name":"A2","voicing":[45],"voicing_names":["A2"],"voicing_staves":[2],"key_fifths":0},{"name":"B2","voicing":[47],"voicing_names":["B2"],"voicing_staves":[2],"key_fifths":0},{"name":"C3","voicing":[48],"voicing_names":["C3"],"voicing_staves":[2],"key_fifths":0},{"name":"D3","voicing":[50],"voicing_names":["D3"],"voicing_staves":[2],"key_fifths":0},{"name":"E3","voicing":[52],"voicing_names":["E3"],"voicing_staves":[2],"key_fifths":0},{"name":"F3","voicing":[53],"voicing_names":["F3"],"voicing_staves":[2],"key_fifths":0},{"name":"G3","voicing":[55],"voicing_names":["G3"],"voicing_staves":[2],"key_fifths":0},{"name":"A1","voicing":[33],"voicing_names":["A1"],"voicing_staves":[2],"key_fifths":0},{"name":"B1","voicing":[35],"voicing_names":["B1"],"voicing_staves":[2],"key_fifths":0},{"name":"C2","voicing":[36],"voicing_names":["C2"],"voicing_staves":[2],"key_fifths":0},{"name":"D2","voicing":[38],"voicing_names":["D2"],"voicing_staves":[2],"key_fifths":0},{"name":"E2","voicing":[40],"voicing_names":["E2"],"voicing_staves":[2],"key_fifths":0},{"name":"F2","voicing":[41],"voicing_names":["F2"],"voicing_staves":[2],"key_fifths":0},{"name":"B3","voicing":[59],"voicing_names":["B3"],"voicing_staves":[2],"key_fifths":0},{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[2],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[2],"key_fifths":0},{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[2],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[2],"key_fifths":0},{"name":"G4","voicing":[67],"voicing_names":["G4"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b8-q1-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b8-q1'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"G2","voicing":[43],"voicing_names":["G2"],"voicing_staves":[2],"key_fifths":0},{"name":"A2","voicing":[45],"voicing_names":["A2"],"voicing_staves":[2],"key_fifths":0},{"name":"B2","voicing":[47],"voicing_names":["B2"],"voicing_staves":[2],"key_fifths":0},{"name":"C3","voicing":[48],"voicing_names":["C3"],"voicing_staves":[2],"key_fifths":0},{"name":"D3","voicing":[50],"voicing_names":["D3"],"voicing_staves":[2],"key_fifths":0},{"name":"E3","voicing":[52],"voicing_names":["E3"],"voicing_staves":[2],"key_fifths":0},{"name":"F3","voicing":[53],"voicing_names":["F3"],"voicing_staves":[2],"key_fifths":0},{"name":"G3","voicing":[55],"voicing_names":["G3"],"voicing_staves":[2],"key_fifths":0},{"name":"A1","voicing":[33],"voicing_names":["A1"],"voicing_staves":[2],"key_fifths":0},{"name":"B1","voicing":[35],"voicing_names":["B1"],"voicing_staves":[2],"key_fifths":0},{"name":"C2","voicing":[36],"voicing_names":["C2"],"voicing_staves":[2],"key_fifths":0},{"name":"D2","voicing":[38],"voicing_names":["D2"],"voicing_staves":[2],"key_fifths":0},{"name":"E2","voicing":[40],"voicing_names":["E2"],"voicing_staves":[2],"key_fifths":0},{"name":"F2","voicing":[41],"voicing_names":["F2"],"voicing_staves":[2],"key_fifths":0},{"name":"B3","voicing":[59],"voicing_names":["B3"],"voicing_staves":[2],"key_fifths":0},{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[2],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[2],"key_fifths":0},{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[2],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[2],"key_fifths":0},{"name":"G4","voicing":[67],"voicing_names":["G4"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
   '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb,
   'サバイバル', 'Survival', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b8-q1-battle'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b8-q1'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'), NULL, NULL,
   'バトルモード', 'Battle mode', true)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  survival_random_chords = EXCLUDED.survival_random_chords,
  survival_lesson_overrides = EXCLUDED.survival_lesson_overrides,
  is_balloon_rush = EXCLUDED.is_balloon_rush,
  balloon_rush_stage_id = EXCLUDED.balloon_rush_stage_id,
  is_survival = EXCLUDED.is_survival,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b9-q1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-reading-notation'),
  '大譜表まとめ',
  'Grand staff review',
  '中央のドを中心に、ト音記号とヘ音記号がランダムに出題されます。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  'Random mix of treble and bass clef notes centered on middle C.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  true,
  24, 9,
  '大譜表まとめ', 'Grand staff review',
  '中央のドを中心にト音とヘ音が混ざって出題されます。', 'Mixed treble and bass clef notes centered on middle C.',
  '[]'::jsonb,
  '①風船: 120秒で80個 ②サバイバル: ランダム ③バトル: 30秒で30問',
  '① Balloon: 80 in 120s ② Survival: random ③ Battle: 30 in 30s'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_number = EXCLUDED.block_number,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  block_description = EXCLUDED.block_description,
  block_description_en = EXCLUDED.block_description_en,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id,
  is_survival, survival_stage_number, survival_map_category,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  survival_random_chords, survival_lesson_overrides,
  title, title_en, is_clear_required
) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b9-q1-balloon'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b9-q1'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'notation-balloon-random'), false, NULL,
   '[{"name":"A3","voicing":[57],"voicing_names":["A3"],"voicing_staves":[2],"key_fifths":0},{"name":"B3","voicing":[59],"voicing_names":["B3"],"voicing_staves":[2],"key_fifths":0},{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[2],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[2],"key_fifths":0},{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[1],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[1],"key_fifths":0},{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[1],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[1],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b9-q1-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b9-q1'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"A3","voicing":[57],"voicing_names":["A3"],"voicing_staves":[2],"key_fifths":0},{"name":"B3","voicing":[59],"voicing_names":["B3"],"voicing_staves":[2],"key_fifths":0},{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[2],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[2],"key_fifths":0},{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[1],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[1],"key_fifths":0},{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[1],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[1],"key_fifths":0}]'::jsonb,
   '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb,
   'サバイバル', 'Survival', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b9-q1-battle'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b9-q1'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b9-q1'), NULL, NULL,
   'バトルモード', 'Battle mode', true)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  survival_random_chords = EXCLUDED.survival_random_chords,
  survival_lesson_overrides = EXCLUDED.survival_lesson_overrides,
  is_balloon_rush = EXCLUDED.is_balloon_rush,
  balloon_rush_stage_id = EXCLUDED.balloon_rush_stage_id,
  is_survival = EXCLUDED.is_survival,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b10-q1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-reading-notation'),
  '五線の中（ト音）＋♯',
  'Treble staff + sharps',
  'ト音記号・五線の中のシャープ（♯）付き音符です。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  'Sharps on the treble staff within the five lines.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  true,
  25, 10,
  '臨時記号（シャープ ♯）', 'Accidentals: sharps',
  '五線の中のシャープ（♯）付き音符を読みましょう。', 'Read sharps on the treble and bass staves.',
  '[]'::jsonb,
  '①風船: 120秒で80個 ②サバイバル: ランダム ③バトル: 30秒で30問',
  '① Balloon: 80 in 120s ② Survival: random ③ Battle: 30 in 30s'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_number = EXCLUDED.block_number,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  block_description = EXCLUDED.block_description,
  block_description_en = EXCLUDED.block_description_en,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id,
  is_survival, survival_stage_number, survival_map_category,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  survival_random_chords, survival_lesson_overrides,
  title, title_en, is_clear_required
) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b10-q1-balloon'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b10-q1'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'notation-balloon-random'), false, NULL,
   '[{"name":"F#4","voicing":[66],"voicing_names":["F#4"],"voicing_staves":[1],"key_fifths":0},{"name":"G#4","voicing":[68],"voicing_names":["G#4"],"voicing_staves":[1],"key_fifths":0},{"name":"A#4","voicing":[70],"voicing_names":["A#4"],"voicing_staves":[1],"key_fifths":0},{"name":"C#5","voicing":[73],"voicing_names":["C#5"],"voicing_staves":[1],"key_fifths":0},{"name":"D#5","voicing":[75],"voicing_names":["D#5"],"voicing_staves":[1],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b10-q1-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b10-q1'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"F#4","voicing":[66],"voicing_names":["F#4"],"voicing_staves":[1],"key_fifths":0},{"name":"G#4","voicing":[68],"voicing_names":["G#4"],"voicing_staves":[1],"key_fifths":0},{"name":"A#4","voicing":[70],"voicing_names":["A#4"],"voicing_staves":[1],"key_fifths":0},{"name":"C#5","voicing":[73],"voicing_names":["C#5"],"voicing_staves":[1],"key_fifths":0},{"name":"D#5","voicing":[75],"voicing_names":["D#5"],"voicing_staves":[1],"key_fifths":0}]'::jsonb,
   '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb,
   'サバイバル', 'Survival', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b10-q1-battle'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b10-q1'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q1'), NULL, NULL,
   'バトルモード', 'Battle mode', true)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  survival_random_chords = EXCLUDED.survival_random_chords,
  survival_lesson_overrides = EXCLUDED.survival_lesson_overrides,
  is_balloon_rush = EXCLUDED.is_balloon_rush,
  balloon_rush_stage_id = EXCLUDED.balloon_rush_stage_id,
  is_survival = EXCLUDED.is_survival,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b10-q2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-reading-notation'),
  '五線の中（ヘ音）＋♯',
  'Bass staff + sharps',
  'ヘ音記号・五線の中のシャープ（♯）付き音符です。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  'Sharps on the bass staff within the five lines.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  true,
  26, 10,
  '臨時記号（シャープ ♯）', 'Accidentals: sharps',
  '五線の中のシャープ（♯）付き音符を読みましょう。', 'Read sharps on the treble and bass staves.',
  '[]'::jsonb,
  '①風船: 120秒で80個 ②サバイバル: ランダム ③バトル: 30秒で30問',
  '① Balloon: 80 in 120s ② Survival: random ③ Battle: 30 in 30s'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_number = EXCLUDED.block_number,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  block_description = EXCLUDED.block_description,
  block_description_en = EXCLUDED.block_description_en,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id,
  is_survival, survival_stage_number, survival_map_category,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  survival_random_chords, survival_lesson_overrides,
  title, title_en, is_clear_required
) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b10-q2-balloon'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b10-q2'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'notation-balloon-random'), false, NULL,
   '[{"name":"F#2","voicing":[42],"voicing_names":["F#2"],"voicing_staves":[2],"key_fifths":0},{"name":"G#2","voicing":[44],"voicing_names":["G#2"],"voicing_staves":[2],"key_fifths":0},{"name":"A#2","voicing":[46],"voicing_names":["A#2"],"voicing_staves":[2],"key_fifths":0},{"name":"C#3","voicing":[49],"voicing_names":["C#3"],"voicing_staves":[2],"key_fifths":0},{"name":"D#3","voicing":[51],"voicing_names":["D#3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b10-q2-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b10-q2'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"F#2","voicing":[42],"voicing_names":["F#2"],"voicing_staves":[2],"key_fifths":0},{"name":"G#2","voicing":[44],"voicing_names":["G#2"],"voicing_staves":[2],"key_fifths":0},{"name":"A#2","voicing":[46],"voicing_names":["A#2"],"voicing_staves":[2],"key_fifths":0},{"name":"C#3","voicing":[49],"voicing_names":["C#3"],"voicing_staves":[2],"key_fifths":0},{"name":"D#3","voicing":[51],"voicing_names":["D#3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
   '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb,
   'サバイバル', 'Survival', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b10-q2-battle'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b10-q2'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q2'), NULL, NULL,
   'バトルモード', 'Battle mode', true)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  survival_random_chords = EXCLUDED.survival_random_chords,
  survival_lesson_overrides = EXCLUDED.survival_lesson_overrides,
  is_balloon_rush = EXCLUDED.is_balloon_rush,
  balloon_rush_stage_id = EXCLUDED.balloon_rush_stage_id,
  is_survival = EXCLUDED.is_survival,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b10-q3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-reading-notation'),
  'まとめ（全て＋♯）',
  'Review (all + sharps)',
  'ト音・ヘ音の五線内シャープ音符を復習します。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  'Review all treble and bass sharps within the staff.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  true,
  27, 10,
  '臨時記号（シャープ ♯）', 'Accidentals: sharps',
  '五線の中のシャープ（♯）付き音符を読みましょう。', 'Read sharps on the treble and bass staves.',
  '[]'::jsonb,
  '①風船: 120秒で80個 ②サバイバル: ランダム ③バトル: 30秒で30問',
  '① Balloon: 80 in 120s ② Survival: random ③ Battle: 30 in 30s'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_number = EXCLUDED.block_number,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  block_description = EXCLUDED.block_description,
  block_description_en = EXCLUDED.block_description_en,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id,
  is_survival, survival_stage_number, survival_map_category,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  survival_random_chords, survival_lesson_overrides,
  title, title_en, is_clear_required
) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b10-q3-balloon'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b10-q3'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'notation-balloon-random'), false, NULL,
   '[{"name":"F#4","voicing":[66],"voicing_names":["F#4"],"voicing_staves":[1],"key_fifths":0},{"name":"G#4","voicing":[68],"voicing_names":["G#4"],"voicing_staves":[1],"key_fifths":0},{"name":"A#4","voicing":[70],"voicing_names":["A#4"],"voicing_staves":[1],"key_fifths":0},{"name":"C#5","voicing":[73],"voicing_names":["C#5"],"voicing_staves":[1],"key_fifths":0},{"name":"D#5","voicing":[75],"voicing_names":["D#5"],"voicing_staves":[1],"key_fifths":0},{"name":"F#2","voicing":[42],"voicing_names":["F#2"],"voicing_staves":[2],"key_fifths":0},{"name":"G#2","voicing":[44],"voicing_names":["G#2"],"voicing_staves":[2],"key_fifths":0},{"name":"A#2","voicing":[46],"voicing_names":["A#2"],"voicing_staves":[2],"key_fifths":0},{"name":"C#3","voicing":[49],"voicing_names":["C#3"],"voicing_staves":[2],"key_fifths":0},{"name":"D#3","voicing":[51],"voicing_names":["D#3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b10-q3-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b10-q3'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"F#4","voicing":[66],"voicing_names":["F#4"],"voicing_staves":[1],"key_fifths":0},{"name":"G#4","voicing":[68],"voicing_names":["G#4"],"voicing_staves":[1],"key_fifths":0},{"name":"A#4","voicing":[70],"voicing_names":["A#4"],"voicing_staves":[1],"key_fifths":0},{"name":"C#5","voicing":[73],"voicing_names":["C#5"],"voicing_staves":[1],"key_fifths":0},{"name":"D#5","voicing":[75],"voicing_names":["D#5"],"voicing_staves":[1],"key_fifths":0},{"name":"F#2","voicing":[42],"voicing_names":["F#2"],"voicing_staves":[2],"key_fifths":0},{"name":"G#2","voicing":[44],"voicing_names":["G#2"],"voicing_staves":[2],"key_fifths":0},{"name":"A#2","voicing":[46],"voicing_names":["A#2"],"voicing_staves":[2],"key_fifths":0},{"name":"C#3","voicing":[49],"voicing_names":["C#3"],"voicing_staves":[2],"key_fifths":0},{"name":"D#3","voicing":[51],"voicing_names":["D#3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
   '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb,
   'サバイバル', 'Survival', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b10-q3-battle'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b10-q3'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q3'), NULL, NULL,
   'バトルモード', 'Battle mode', true)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  survival_random_chords = EXCLUDED.survival_random_chords,
  survival_lesson_overrides = EXCLUDED.survival_lesson_overrides,
  is_balloon_rush = EXCLUDED.is_balloon_rush,
  balloon_rush_stage_id = EXCLUDED.balloon_rush_stage_id,
  is_survival = EXCLUDED.is_survival,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b11-q1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-reading-notation'),
  '五線の中（ト音）＋♭',
  'Treble staff + flats',
  'ト音記号・五線の中のフラット（♭）付き音符です。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  'Flats on the treble staff within the five lines.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  true,
  28, 11,
  '臨時記号（フラット ♭）', 'Accidentals: flats',
  '五線の中のフラット（♭）付き音符を読みましょう。', 'Read flats on the treble and bass staves.',
  '[]'::jsonb,
  '①風船: 120秒で80個 ②サバイバル: ランダム ③バトル: 30秒で30問',
  '① Balloon: 80 in 120s ② Survival: random ③ Battle: 30 in 30s'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_number = EXCLUDED.block_number,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  block_description = EXCLUDED.block_description,
  block_description_en = EXCLUDED.block_description_en,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id,
  is_survival, survival_stage_number, survival_map_category,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  survival_random_chords, survival_lesson_overrides,
  title, title_en, is_clear_required
) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b11-q1-balloon'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b11-q1'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'notation-balloon-random'), false, NULL,
   '[{"name":"Bb4","voicing":[70],"voicing_names":["Bb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Eb4","voicing":[63],"voicing_names":["Eb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Ab4","voicing":[68],"voicing_names":["Ab4"],"voicing_staves":[1],"key_fifths":0},{"name":"Gb4","voicing":[66],"voicing_names":["Gb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Db5","voicing":[73],"voicing_names":["Db5"],"voicing_staves":[1],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b11-q1-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b11-q1'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"Bb4","voicing":[70],"voicing_names":["Bb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Eb4","voicing":[63],"voicing_names":["Eb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Ab4","voicing":[68],"voicing_names":["Ab4"],"voicing_staves":[1],"key_fifths":0},{"name":"Gb4","voicing":[66],"voicing_names":["Gb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Db5","voicing":[73],"voicing_names":["Db5"],"voicing_staves":[1],"key_fifths":0}]'::jsonb,
   '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb,
   'サバイバル', 'Survival', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b11-q1-battle'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b11-q1'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q1'), NULL, NULL,
   'バトルモード', 'Battle mode', true)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  survival_random_chords = EXCLUDED.survival_random_chords,
  survival_lesson_overrides = EXCLUDED.survival_lesson_overrides,
  is_balloon_rush = EXCLUDED.is_balloon_rush,
  balloon_rush_stage_id = EXCLUDED.balloon_rush_stage_id,
  is_survival = EXCLUDED.is_survival,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b11-q2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-reading-notation'),
  '五線の中（ヘ音）＋♭',
  'Bass staff + flats',
  'ヘ音記号・五線の中のフラット（♭）付き音符です。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  'Flats on the bass staff within the five lines.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  true,
  29, 11,
  '臨時記号（フラット ♭）', 'Accidentals: flats',
  '五線の中のフラット（♭）付き音符を読みましょう。', 'Read flats on the treble and bass staves.',
  '[]'::jsonb,
  '①風船: 120秒で80個 ②サバイバル: ランダム ③バトル: 30秒で30問',
  '① Balloon: 80 in 120s ② Survival: random ③ Battle: 30 in 30s'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_number = EXCLUDED.block_number,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  block_description = EXCLUDED.block_description,
  block_description_en = EXCLUDED.block_description_en,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id,
  is_survival, survival_stage_number, survival_map_category,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  survival_random_chords, survival_lesson_overrides,
  title, title_en, is_clear_required
) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b11-q2-balloon'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b11-q2'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'notation-balloon-random'), false, NULL,
   '[{"name":"Bb2","voicing":[46],"voicing_names":["Bb2"],"voicing_staves":[2],"key_fifths":0},{"name":"Eb3","voicing":[51],"voicing_names":["Eb3"],"voicing_staves":[2],"key_fifths":0},{"name":"Ab2","voicing":[44],"voicing_names":["Ab2"],"voicing_staves":[2],"key_fifths":0},{"name":"Gb2","voicing":[42],"voicing_names":["Gb2"],"voicing_staves":[2],"key_fifths":0},{"name":"Db3","voicing":[49],"voicing_names":["Db3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b11-q2-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b11-q2'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"Bb2","voicing":[46],"voicing_names":["Bb2"],"voicing_staves":[2],"key_fifths":0},{"name":"Eb3","voicing":[51],"voicing_names":["Eb3"],"voicing_staves":[2],"key_fifths":0},{"name":"Ab2","voicing":[44],"voicing_names":["Ab2"],"voicing_staves":[2],"key_fifths":0},{"name":"Gb2","voicing":[42],"voicing_names":["Gb2"],"voicing_staves":[2],"key_fifths":0},{"name":"Db3","voicing":[49],"voicing_names":["Db3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
   '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb,
   'サバイバル', 'Survival', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b11-q2-battle'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b11-q2'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q2'), NULL, NULL,
   'バトルモード', 'Battle mode', true)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  survival_random_chords = EXCLUDED.survival_random_chords,
  survival_lesson_overrides = EXCLUDED.survival_lesson_overrides,
  is_balloon_rush = EXCLUDED.is_balloon_rush,
  balloon_rush_stage_id = EXCLUDED.balloon_rush_stage_id,
  is_survival = EXCLUDED.is_survival,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b11-q3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-reading-notation'),
  'まとめ（全て＋♭）',
  'Review (all + flats)',
  'ト音・ヘ音の五線内フラット音符を復習します。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  'Review all treble and bass flats within the staff.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  true,
  30, 11,
  '臨時記号（フラット ♭）', 'Accidentals: flats',
  '五線の中のフラット（♭）付き音符を読みましょう。', 'Read flats on the treble and bass staves.',
  '[]'::jsonb,
  '①風船: 120秒で80個 ②サバイバル: ランダム ③バトル: 30秒で30問',
  '① Balloon: 80 in 120s ② Survival: random ③ Battle: 30 in 30s'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_number = EXCLUDED.block_number,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  block_description = EXCLUDED.block_description,
  block_description_en = EXCLUDED.block_description_en,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id,
  is_survival, survival_stage_number, survival_map_category,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  survival_random_chords, survival_lesson_overrides,
  title, title_en, is_clear_required
) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b11-q3-balloon'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b11-q3'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'notation-balloon-random'), false, NULL,
   '[{"name":"Bb4","voicing":[70],"voicing_names":["Bb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Eb4","voicing":[63],"voicing_names":["Eb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Ab4","voicing":[68],"voicing_names":["Ab4"],"voicing_staves":[1],"key_fifths":0},{"name":"Gb4","voicing":[66],"voicing_names":["Gb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Db5","voicing":[73],"voicing_names":["Db5"],"voicing_staves":[1],"key_fifths":0},{"name":"Bb2","voicing":[46],"voicing_names":["Bb2"],"voicing_staves":[2],"key_fifths":0},{"name":"Eb3","voicing":[51],"voicing_names":["Eb3"],"voicing_staves":[2],"key_fifths":0},{"name":"Ab2","voicing":[44],"voicing_names":["Ab2"],"voicing_staves":[2],"key_fifths":0},{"name":"Gb2","voicing":[42],"voicing_names":["Gb2"],"voicing_staves":[2],"key_fifths":0},{"name":"Db3","voicing":[49],"voicing_names":["Db3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b11-q3-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b11-q3'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"Bb4","voicing":[70],"voicing_names":["Bb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Eb4","voicing":[63],"voicing_names":["Eb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Ab4","voicing":[68],"voicing_names":["Ab4"],"voicing_staves":[1],"key_fifths":0},{"name":"Gb4","voicing":[66],"voicing_names":["Gb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Db5","voicing":[73],"voicing_names":["Db5"],"voicing_staves":[1],"key_fifths":0},{"name":"Bb2","voicing":[46],"voicing_names":["Bb2"],"voicing_staves":[2],"key_fifths":0},{"name":"Eb3","voicing":[51],"voicing_names":["Eb3"],"voicing_staves":[2],"key_fifths":0},{"name":"Ab2","voicing":[44],"voicing_names":["Ab2"],"voicing_staves":[2],"key_fifths":0},{"name":"Gb2","voicing":[42],"voicing_names":["Gb2"],"voicing_staves":[2],"key_fifths":0},{"name":"Db3","voicing":[49],"voicing_names":["Db3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
   '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb,
   'サバイバル', 'Survival', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b11-q3-battle'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b11-q3'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q3'), NULL, NULL,
   'バトルモード', 'Battle mode', true)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  survival_random_chords = EXCLUDED.survival_random_chords,
  survival_lesson_overrides = EXCLUDED.survival_lesson_overrides,
  is_balloon_rush = EXCLUDED.is_balloon_rush,
  balloon_rush_stage_id = EXCLUDED.balloon_rush_stage_id,
  is_survival = EXCLUDED.is_survival,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b12-q1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-reading-notation'),
  '総仕上げ（ファイナル）',
  'Final review',
  'ト音・ヘ音・上下加線・臨時記号すべてのランダム総復習です。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  'Final random review: treble, bass, ledger lines, and accidentals.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  true,
  31, 12,
  '総仕上げ（ファイナル）', 'Final review',
  'これまで学んだすべての音符をランダムに総復習します。', 'Final random review of every note you have learned.',
  '[]'::jsonb,
  '①風船: 120秒で80個 ②サバイバル: ランダム ③バトル: 30秒で30問',
  '① Balloon: 80 in 120s ② Survival: random ③ Battle: 30 in 30s'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_number = EXCLUDED.block_number,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  block_description = EXCLUDED.block_description,
  block_description_en = EXCLUDED.block_description_en,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id,
  is_survival, survival_stage_number, survival_map_category,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  survival_random_chords, survival_lesson_overrides,
  title, title_en, is_clear_required
) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b12-q1-balloon'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b12-q1'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'notation-balloon-random'), false, NULL,
   '[{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[1],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[1],"key_fifths":0},{"name":"G4","voicing":[67],"voicing_names":["G4"],"voicing_staves":[1],"key_fifths":0},{"name":"A4","voicing":[69],"voicing_names":["A4"],"voicing_staves":[1],"key_fifths":0},{"name":"B4","voicing":[71],"voicing_names":["B4"],"voicing_staves":[1],"key_fifths":0},{"name":"C5","voicing":[72],"voicing_names":["C5"],"voicing_staves":[1],"key_fifths":0},{"name":"D5","voicing":[74],"voicing_names":["D5"],"voicing_staves":[1],"key_fifths":0},{"name":"E5","voicing":[76],"voicing_names":["E5"],"voicing_staves":[1],"key_fifths":0},{"name":"G5","voicing":[79],"voicing_names":["G5"],"voicing_staves":[1],"key_fifths":0},{"name":"A5","voicing":[81],"voicing_names":["A5"],"voicing_staves":[1],"key_fifths":0},{"name":"B5","voicing":[83],"voicing_names":["B5"],"voicing_staves":[1],"key_fifths":0},{"name":"C6","voicing":[84],"voicing_names":["C6"],"voicing_staves":[1],"key_fifths":0},{"name":"D6","voicing":[86],"voicing_names":["D6"],"voicing_staves":[1],"key_fifths":0},{"name":"E6","voicing":[88],"voicing_names":["E6"],"voicing_staves":[1],"key_fifths":0},{"name":"F3","voicing":[53],"voicing_names":["F3"],"voicing_staves":[1],"key_fifths":0},{"name":"G3","voicing":[55],"voicing_names":["G3"],"voicing_staves":[1],"key_fifths":0},{"name":"A3","voicing":[57],"voicing_names":["A3"],"voicing_staves":[1],"key_fifths":0},{"name":"B3","voicing":[59],"voicing_names":["B3"],"voicing_staves":[1],"key_fifths":0},{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[1],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[1],"key_fifths":0},{"name":"G2","voicing":[43],"voicing_names":["G2"],"voicing_staves":[2],"key_fifths":0},{"name":"A2","voicing":[45],"voicing_names":["A2"],"voicing_staves":[2],"key_fifths":0},{"name":"B2","voicing":[47],"voicing_names":["B2"],"voicing_staves":[2],"key_fifths":0},{"name":"C3","voicing":[48],"voicing_names":["C3"],"voicing_staves":[2],"key_fifths":0},{"name":"D3","voicing":[50],"voicing_names":["D3"],"voicing_staves":[2],"key_fifths":0},{"name":"E3","voicing":[52],"voicing_names":["E3"],"voicing_staves":[2],"key_fifths":0},{"name":"F3","voicing":[53],"voicing_names":["F3"],"voicing_staves":[2],"key_fifths":0},{"name":"G3","voicing":[55],"voicing_names":["G3"],"voicing_staves":[2],"key_fifths":0},{"name":"A1","voicing":[33],"voicing_names":["A1"],"voicing_staves":[2],"key_fifths":0},{"name":"B1","voicing":[35],"voicing_names":["B1"],"voicing_staves":[2],"key_fifths":0},{"name":"C2","voicing":[36],"voicing_names":["C2"],"voicing_staves":[2],"key_fifths":0},{"name":"D2","voicing":[38],"voicing_names":["D2"],"voicing_staves":[2],"key_fifths":0},{"name":"E2","voicing":[40],"voicing_names":["E2"],"voicing_staves":[2],"key_fifths":0},{"name":"F2","voicing":[41],"voicing_names":["F2"],"voicing_staves":[2],"key_fifths":0},{"name":"B3","voicing":[59],"voicing_names":["B3"],"voicing_staves":[2],"key_fifths":0},{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[2],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[2],"key_fifths":0},{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[2],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[2],"key_fifths":0},{"name":"G4","voicing":[67],"voicing_names":["G4"],"voicing_staves":[2],"key_fifths":0},{"name":"A3","voicing":[57],"voicing_names":["A3"],"voicing_staves":[2],"key_fifths":0},{"name":"F#4","voicing":[66],"voicing_names":["F#4"],"voicing_staves":[1],"key_fifths":0},{"name":"G#4","voicing":[68],"voicing_names":["G#4"],"voicing_staves":[1],"key_fifths":0},{"name":"A#4","voicing":[70],"voicing_names":["A#4"],"voicing_staves":[1],"key_fifths":0},{"name":"C#5","voicing":[73],"voicing_names":["C#5"],"voicing_staves":[1],"key_fifths":0},{"name":"D#5","voicing":[75],"voicing_names":["D#5"],"voicing_staves":[1],"key_fifths":0},{"name":"F#2","voicing":[42],"voicing_names":["F#2"],"voicing_staves":[2],"key_fifths":0},{"name":"G#2","voicing":[44],"voicing_names":["G#2"],"voicing_staves":[2],"key_fifths":0},{"name":"A#2","voicing":[46],"voicing_names":["A#2"],"voicing_staves":[2],"key_fifths":0},{"name":"C#3","voicing":[49],"voicing_names":["C#3"],"voicing_staves":[2],"key_fifths":0},{"name":"D#3","voicing":[51],"voicing_names":["D#3"],"voicing_staves":[2],"key_fifths":0},{"name":"Bb4","voicing":[70],"voicing_names":["Bb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Eb4","voicing":[63],"voicing_names":["Eb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Ab4","voicing":[68],"voicing_names":["Ab4"],"voicing_staves":[1],"key_fifths":0},{"name":"Gb4","voicing":[66],"voicing_names":["Gb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Db5","voicing":[73],"voicing_names":["Db5"],"voicing_staves":[1],"key_fifths":0},{"name":"Bb2","voicing":[46],"voicing_names":["Bb2"],"voicing_staves":[2],"key_fifths":0},{"name":"Eb3","voicing":[51],"voicing_names":["Eb3"],"voicing_staves":[2],"key_fifths":0},{"name":"Ab2","voicing":[44],"voicing_names":["Ab2"],"voicing_staves":[2],"key_fifths":0},{"name":"Gb2","voicing":[42],"voicing_names":["Gb2"],"voicing_staves":[2],"key_fifths":0},{"name":"Db3","voicing":[49],"voicing_names":["Db3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b12-q1-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b12-q1'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[1],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[1],"key_fifths":0},{"name":"G4","voicing":[67],"voicing_names":["G4"],"voicing_staves":[1],"key_fifths":0},{"name":"A4","voicing":[69],"voicing_names":["A4"],"voicing_staves":[1],"key_fifths":0},{"name":"B4","voicing":[71],"voicing_names":["B4"],"voicing_staves":[1],"key_fifths":0},{"name":"C5","voicing":[72],"voicing_names":["C5"],"voicing_staves":[1],"key_fifths":0},{"name":"D5","voicing":[74],"voicing_names":["D5"],"voicing_staves":[1],"key_fifths":0},{"name":"E5","voicing":[76],"voicing_names":["E5"],"voicing_staves":[1],"key_fifths":0},{"name":"G5","voicing":[79],"voicing_names":["G5"],"voicing_staves":[1],"key_fifths":0},{"name":"A5","voicing":[81],"voicing_names":["A5"],"voicing_staves":[1],"key_fifths":0},{"name":"B5","voicing":[83],"voicing_names":["B5"],"voicing_staves":[1],"key_fifths":0},{"name":"C6","voicing":[84],"voicing_names":["C6"],"voicing_staves":[1],"key_fifths":0},{"name":"D6","voicing":[86],"voicing_names":["D6"],"voicing_staves":[1],"key_fifths":0},{"name":"E6","voicing":[88],"voicing_names":["E6"],"voicing_staves":[1],"key_fifths":0},{"name":"F3","voicing":[53],"voicing_names":["F3"],"voicing_staves":[1],"key_fifths":0},{"name":"G3","voicing":[55],"voicing_names":["G3"],"voicing_staves":[1],"key_fifths":0},{"name":"A3","voicing":[57],"voicing_names":["A3"],"voicing_staves":[1],"key_fifths":0},{"name":"B3","voicing":[59],"voicing_names":["B3"],"voicing_staves":[1],"key_fifths":0},{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[1],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[1],"key_fifths":0},{"name":"G2","voicing":[43],"voicing_names":["G2"],"voicing_staves":[2],"key_fifths":0},{"name":"A2","voicing":[45],"voicing_names":["A2"],"voicing_staves":[2],"key_fifths":0},{"name":"B2","voicing":[47],"voicing_names":["B2"],"voicing_staves":[2],"key_fifths":0},{"name":"C3","voicing":[48],"voicing_names":["C3"],"voicing_staves":[2],"key_fifths":0},{"name":"D3","voicing":[50],"voicing_names":["D3"],"voicing_staves":[2],"key_fifths":0},{"name":"E3","voicing":[52],"voicing_names":["E3"],"voicing_staves":[2],"key_fifths":0},{"name":"F3","voicing":[53],"voicing_names":["F3"],"voicing_staves":[2],"key_fifths":0},{"name":"G3","voicing":[55],"voicing_names":["G3"],"voicing_staves":[2],"key_fifths":0},{"name":"A1","voicing":[33],"voicing_names":["A1"],"voicing_staves":[2],"key_fifths":0},{"name":"B1","voicing":[35],"voicing_names":["B1"],"voicing_staves":[2],"key_fifths":0},{"name":"C2","voicing":[36],"voicing_names":["C2"],"voicing_staves":[2],"key_fifths":0},{"name":"D2","voicing":[38],"voicing_names":["D2"],"voicing_staves":[2],"key_fifths":0},{"name":"E2","voicing":[40],"voicing_names":["E2"],"voicing_staves":[2],"key_fifths":0},{"name":"F2","voicing":[41],"voicing_names":["F2"],"voicing_staves":[2],"key_fifths":0},{"name":"B3","voicing":[59],"voicing_names":["B3"],"voicing_staves":[2],"key_fifths":0},{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[2],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[2],"key_fifths":0},{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[2],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[2],"key_fifths":0},{"name":"G4","voicing":[67],"voicing_names":["G4"],"voicing_staves":[2],"key_fifths":0},{"name":"A3","voicing":[57],"voicing_names":["A3"],"voicing_staves":[2],"key_fifths":0},{"name":"F#4","voicing":[66],"voicing_names":["F#4"],"voicing_staves":[1],"key_fifths":0},{"name":"G#4","voicing":[68],"voicing_names":["G#4"],"voicing_staves":[1],"key_fifths":0},{"name":"A#4","voicing":[70],"voicing_names":["A#4"],"voicing_staves":[1],"key_fifths":0},{"name":"C#5","voicing":[73],"voicing_names":["C#5"],"voicing_staves":[1],"key_fifths":0},{"name":"D#5","voicing":[75],"voicing_names":["D#5"],"voicing_staves":[1],"key_fifths":0},{"name":"F#2","voicing":[42],"voicing_names":["F#2"],"voicing_staves":[2],"key_fifths":0},{"name":"G#2","voicing":[44],"voicing_names":["G#2"],"voicing_staves":[2],"key_fifths":0},{"name":"A#2","voicing":[46],"voicing_names":["A#2"],"voicing_staves":[2],"key_fifths":0},{"name":"C#3","voicing":[49],"voicing_names":["C#3"],"voicing_staves":[2],"key_fifths":0},{"name":"D#3","voicing":[51],"voicing_names":["D#3"],"voicing_staves":[2],"key_fifths":0},{"name":"Bb4","voicing":[70],"voicing_names":["Bb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Eb4","voicing":[63],"voicing_names":["Eb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Ab4","voicing":[68],"voicing_names":["Ab4"],"voicing_staves":[1],"key_fifths":0},{"name":"Gb4","voicing":[66],"voicing_names":["Gb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Db5","voicing":[73],"voicing_names":["Db5"],"voicing_staves":[1],"key_fifths":0},{"name":"Bb2","voicing":[46],"voicing_names":["Bb2"],"voicing_staves":[2],"key_fifths":0},{"name":"Eb3","voicing":[51],"voicing_names":["Eb3"],"voicing_staves":[2],"key_fifths":0},{"name":"Ab2","voicing":[44],"voicing_names":["Ab2"],"voicing_staves":[2],"key_fifths":0},{"name":"Gb2","voicing":[42],"voicing_names":["Gb2"],"voicing_staves":[2],"key_fifths":0},{"name":"Db3","voicing":[49],"voicing_names":["Db3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
   '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb,
   'サバイバル', 'Survival', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b12-q1-battle'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b12-q1'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'), NULL, NULL,
   'バトルモード', 'Battle mode', true)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  survival_random_chords = EXCLUDED.survival_random_chords,
  survival_lesson_overrides = EXCLUDED.survival_lesson_overrides,
  is_balloon_rush = EXCLUDED.is_balloon_rush,
  balloon_rush_stage_id = EXCLUDED.balloon_rush_stage_id,
  is_survival = EXCLUDED.is_survival,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
