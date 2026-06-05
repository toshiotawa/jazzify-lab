-- 音符の読み方コース: ブロック5〜12（ヘ音・大譜表・臨時記号・ファイナル）
BEGIN;

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
  '譜読みクイズ: ソラシ',
  'Sight-reading quiz: G A B',
  '30秒以内に30問正解。譜面の音符を読んで弾きましょう。',
  'Answer 30 questions within 30 seconds by reading the staff.',
  120, 0, 4, 4, 2, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  30, 'random', true, true, 30, false
)
ON CONFLICT (id) DO UPDATE SET
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
  '譜読みクイズ: シドレ',
  'Sight-reading quiz: B C D',
  '30秒以内に30問正解。譜面の音符を読んで弾きましょう。',
  'Answer 30 questions within 30 seconds by reading the staff.',
  120, 0, 4, 4, 2, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  30, 'random', true, true, 30, false
)
ON CONFLICT (id) DO UPDATE SET
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
  'B2',
  ARRAY['B2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'C3',
  ARRAY['C3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'D3',
  ARRAY['D3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  '譜読みクイズ: レミファ',
  'Sight-reading quiz: D E F',
  '30秒以内に30問正解。譜面の音符を読んで弾きましょう。',
  'Answer 30 questions within 30 seconds by reading the staff.',
  120, 0, 4, 4, 2, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  30, 'random', true, true, 30, false
)
ON CONFLICT (id) DO UPDATE SET
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
  'D3',
  ARRAY['D3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'E3',
  ARRAY['E3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'F3',
  ARRAY['F3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  '譜読みクイズ: ファソラ',
  'Sight-reading quiz: F G A',
  '30秒以内に30問正解。譜面の音符を読んで弾きましょう。',
  'Answer 30 questions within 30 seconds by reading the staff.',
  120, 0, 4, 4, 2, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  30, 'random', true, true, 30, false
)
ON CONFLICT (id) DO UPDATE SET
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
  'F3',
  ARRAY['F3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'G3',
  ARRAY['G3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'A3',
  ARRAY['A3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  '譜読みクイズ: ラシド',
  'Sight-reading quiz: A B C',
  '30秒以内に30問正解。譜面の音符を読んで弾きましょう。',
  'Answer 30 questions within 30 seconds by reading the staff.',
  120, 0, 4, 4, 2, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  30, 'random', true, true, 30, false
)
ON CONFLICT (id) DO UPDATE SET
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
  '譜読みクイズ: シドレ',
  'Sight-reading quiz: B C D',
  '30秒以内に30問正解。譜面の音符を読んで弾きましょう。',
  'Answer 30 questions within 30 seconds by reading the staff.',
  120, 0, 4, 4, 2, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  30, 'random', true, true, 30, false
)
ON CONFLICT (id) DO UPDATE SET
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q3'),
  'notation-quiz-b6-q3',
  '譜読みクイズ: ドレミ',
  'Sight-reading quiz: C D E',
  '30秒以内に30問正解。譜面の音符を読んで弾きましょう。',
  'Answer 30 questions within 30 seconds by reading the staff.',
  120, 0, 4, 4, 2, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  30, 'random', true, true, 30, false
)
ON CONFLICT (id) DO UPDATE SET
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  hide_chord_names_in_battle = EXCLUDED.hide_chord_names_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q3-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q3'),
  0, 1, 1, 4,
  'C2',
  ARRAY['C2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q3-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q3'),
  1, 2, 1, 4,
  'D2',
  ARRAY['D2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q3-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q3'),
  2, 3, 1, 4,
  'E2',
  ARRAY['E2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q4'),
  'notation-quiz-b6-q4',
  '譜読みクイズ: レミファ',
  'Sight-reading quiz: D E F',
  '30秒以内に30問正解。譜面の音符を読んで弾きましょう。',
  'Answer 30 questions within 30 seconds by reading the staff.',
  120, 0, 4, 4, 2, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  30, 'random', true, true, 30, false
)
ON CONFLICT (id) DO UPDATE SET
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  hide_chord_names_in_battle = EXCLUDED.hide_chord_names_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q4-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q4'),
  0, 1, 1, 4,
  'D2',
  ARRAY['D2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q4-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q4'),
  1, 2, 1, 4,
  'E2',
  ARRAY['E2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q4-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q4'),
  2, 3, 1, 4,
  'F2',
  ARRAY['F2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  '譜読みクイズ: シドレ',
  'Sight-reading quiz: B C D',
  '30秒以内に30問正解。譜面の音符を読んで弾きましょう。',
  'Answer 30 questions within 30 seconds by reading the staff.',
  120, 0, 4, 4, 2, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  30, 'random', true, true, 30, false
)
ON CONFLICT (id) DO UPDATE SET
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
  '譜読みクイズ: ドレミ',
  'Sight-reading quiz: C D E',
  '30秒以内に30問正解。譜面の音符を読んで弾きましょう。',
  'Answer 30 questions within 30 seconds by reading the staff.',
  120, 0, 4, 4, 2, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  30, 'random', true, true, 30, false
)
ON CONFLICT (id) DO UPDATE SET
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q3'),
  'notation-quiz-b7-q3',
  '譜読みクイズ: レミファ',
  'Sight-reading quiz: D E F',
  '30秒以内に30問正解。譜面の音符を読んで弾きましょう。',
  'Answer 30 questions within 30 seconds by reading the staff.',
  120, 0, 4, 4, 2, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  30, 'random', true, true, 30, false
)
ON CONFLICT (id) DO UPDATE SET
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  hide_chord_names_in_battle = EXCLUDED.hide_chord_names_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q3-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q3'),
  0, 1, 1, 4,
  'D4',
  ARRAY['D4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q3-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q3'),
  1, 2, 1, 4,
  'E4',
  ARRAY['E4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q3-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q3'),
  2, 3, 1, 4,
  'F4',
  ARRAY['F4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q4'),
  'notation-quiz-b7-q4',
  '譜読みクイズ: ミファソ',
  'Sight-reading quiz: E F G',
  '30秒以内に30問正解。譜面の音符を読んで弾きましょう。',
  'Answer 30 questions within 30 seconds by reading the staff.',
  120, 0, 4, 4, 2, 6,
  0, 60, 100, 10000,
  0, 0, 0, 0, 0, 0, 0, 0,
  'blue_club', true, 'chord_quiz',
  30, 'random', true, true, 30, false
)
ON CONFLICT (id) DO UPDATE SET
  quiz_duration_seconds = EXCLUDED.quiz_duration_seconds,
  quiz_required_correct_count = EXCLUDED.quiz_required_correct_count,
  hide_chord_names_in_battle = EXCLUDED.hide_chord_names_in_battle,
  updated_at = now();

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q4-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q4'),
  0, 1, 1, 4,
  'E4',
  ARRAY['E4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q4-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q4'),
  1, 2, 1, 4,
  'F4',
  ARRAY['F4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q4-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q4'),
  2, 3, 1, 4,
  'G4',
  ARRAY['G4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'A3',
  ARRAY['A3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'A1',
  ARRAY['A1']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'B1',
  ARRAY['B1']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'C2',
  ARRAY['C2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'D2',
  ARRAY['D2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'E2',
  ARRAY['E2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'F2',
  ARRAY['F2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'B3',
  ARRAY['B3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'C4',
  ARRAY['C4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'D4',
  ARRAY['D4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'E4',
  ARRAY['E4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'F4',
  ARRAY['F4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
  voicing = EXCLUDED.voicing,
  voicing_staves = EXCLUDED.voicing_staves,
  updated_at = now();
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  20, 21, 1, 4,
  'G4',
  ARRAY['G4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'C#5',
  ARRAY['C#5']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'D#5',
  ARRAY['D#5']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'C#3',
  ARRAY['C#3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'D#3',
  ARRAY['D#3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'C#5',
  ARRAY['C#5']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'D#5',
  ARRAY['D#5']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'F#2',
  ARRAY['F#2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'G#2',
  ARRAY['G#2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'C#3',
  ARRAY['C#3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'D#3',
  ARRAY['D#3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'Db5',
  ARRAY['Db5']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'Db3',
  ARRAY['Db3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'Db5',
  ARRAY['Db5']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'Bb2',
  ARRAY['Bb2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'Eb3',
  ARRAY['Eb3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'Ab2',
  ARRAY['Ab2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'Db3',
  ARRAY['Db3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'F5',
  ARRAY['F5']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'G5',
  ARRAY['G5']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'A5',
  ARRAY['A5']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'B5',
  ARRAY['B5']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'C6',
  ARRAY['C6']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'D6',
  ARRAY['D6']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'E6',
  ARRAY['E6']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'F3',
  ARRAY['F3']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'G3',
  ARRAY['G3']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'A3',
  ARRAY['A3']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'B3',
  ARRAY['B3']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'C4',
  ARRAY['C4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'D4',
  ARRAY['D4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'G2',
  ARRAY['G2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'A2',
  ARRAY['A2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'B2',
  ARRAY['B2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'C3',
  ARRAY['C3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'D3',
  ARRAY['D3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'E3',
  ARRAY['E3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'F3',
  ARRAY['F3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'G3',
  ARRAY['G3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'A3',
  ARRAY['A3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'A1',
  ARRAY['A1']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'B1',
  ARRAY['B1']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'C2',
  ARRAY['C2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'D2',
  ARRAY['D2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'E2',
  ARRAY['E2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'F2',
  ARRAY['F2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'B3',
  ARRAY['B3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'C4',
  ARRAY['C4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'D4',
  ARRAY['D4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'E4',
  ARRAY['E4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'F4',
  ARRAY['F4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'G4',
  ARRAY['G4']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'F#4',
  ARRAY['F#4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'G#4',
  ARRAY['G#4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'C#3',
  ARRAY['C#3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'D#3',
  ARRAY['D#3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'Bb4',
  ARRAY['Bb4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'Eb4',
  ARRAY['Eb4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'Ab4',
  ARRAY['Ab4']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'Db5',
  ARRAY['Db5']::text[],
  ARRAY[1]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'Bb2',
  ARRAY['Bb2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'Eb3',
  ARRAY['Eb3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'Ab2',
  ARRAY['Ab2']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'Db3',
  ARRAY['Db3']::text[],
  ARRAY[2]::smallint[]
)
ON CONFLICT (id) DO UPDATE SET
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
  'ソラシ',
  'G A B',
  'ヘ音記号・五線の中。ソ・ラ・シの3音です。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  'Bass clef, notes on the staff: G, A, and B.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  true,
  16, 5,
  '五線の中の音符（ヘ音記号）', 'Bass clef: notes on the staff',
  'ヘ音記号の五線の中の音符を、3音ずつ覚えていきます。', 'Learn bass-clef notes on the staff, three at a time.',
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
   '[{"name":"G2","voicing":[43],"voicing_names":["G2"],"voicing_staves":[2],"key_fifths":0},{"name":"A2","voicing":[45],"voicing_names":["A2"],"voicing_staves":[2],"key_fifths":0},{"name":"B2","voicing":[47],"voicing_names":["B2"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b5-q1-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q1'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"G2","voicing":[43],"voicing_names":["G2"],"voicing_staves":[2],"key_fifths":0},{"name":"A2","voicing":[45],"voicing_names":["A2"],"voicing_staves":[2],"key_fifths":0},{"name":"B2","voicing":[47],"voicing_names":["B2"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
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
  title_en = EXCLUDED.title_en,
  updated_at = now();

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-reading-notation'),
  'シドレ',
  'B C D',
  'ヘ音記号・五線の中。シ・ド・レを読みましょう。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  'Bass clef, notes on the staff: B, C, and D.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  true,
  17, 5,
  '五線の中の音符（ヘ音記号）', 'Bass clef: notes on the staff',
  'ヘ音記号の五線の中の音符を、3音ずつ覚えていきます。', 'Learn bass-clef notes on the staff, three at a time.',
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
   '[{"name":"B2","voicing":[47],"voicing_names":["B2"],"voicing_staves":[2],"key_fifths":0},{"name":"C3","voicing":[48],"voicing_names":["C3"],"voicing_staves":[2],"key_fifths":0},{"name":"D3","voicing":[50],"voicing_names":["D3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b5-q2-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q2'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"B2","voicing":[47],"voicing_names":["B2"],"voicing_staves":[2],"key_fifths":0},{"name":"C3","voicing":[48],"voicing_names":["C3"],"voicing_staves":[2],"key_fifths":0},{"name":"D3","voicing":[50],"voicing_names":["D3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
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
  title_en = EXCLUDED.title_en,
  updated_at = now();

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-reading-notation'),
  'レミファ',
  'D E F',
  'ヘ音記号・五線の中。レ・ミ・ファの3音です。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  'Bass clef, notes on the staff: D, E, and F.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  true,
  18, 5,
  '五線の中の音符（ヘ音記号）', 'Bass clef: notes on the staff',
  'ヘ音記号の五線の中の音符を、3音ずつ覚えていきます。', 'Learn bass-clef notes on the staff, three at a time.',
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
   '[{"name":"D3","voicing":[50],"voicing_names":["D3"],"voicing_staves":[2],"key_fifths":0},{"name":"E3","voicing":[52],"voicing_names":["E3"],"voicing_staves":[2],"key_fifths":0},{"name":"F3","voicing":[53],"voicing_names":["F3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b5-q3-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q3'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"D3","voicing":[50],"voicing_names":["D3"],"voicing_staves":[2],"key_fifths":0},{"name":"E3","voicing":[52],"voicing_names":["E3"],"voicing_staves":[2],"key_fifths":0},{"name":"F3","voicing":[53],"voicing_names":["F3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
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
  title_en = EXCLUDED.title_en,
  updated_at = now();

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-reading-notation'),
  'ファソラ',
  'F G A',
  'ヘ音記号・五線の中。ファ・ソ・ラを読みましょう。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  'Bass clef, notes on the staff: F, G, and A.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  true,
  19, 5,
  '五線の中の音符（ヘ音記号）', 'Bass clef: notes on the staff',
  'ヘ音記号の五線の中の音符を、3音ずつ覚えていきます。', 'Learn bass-clef notes on the staff, three at a time.',
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
   '[{"name":"F3","voicing":[53],"voicing_names":["F3"],"voicing_staves":[2],"key_fifths":0},{"name":"G3","voicing":[55],"voicing_names":["G3"],"voicing_staves":[2],"key_fifths":0},{"name":"A3","voicing":[57],"voicing_names":["A3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b5-q4-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q4'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"F3","voicing":[53],"voicing_names":["F3"],"voicing_staves":[2],"key_fifths":0},{"name":"G3","voicing":[55],"voicing_names":["G3"],"voicing_staves":[2],"key_fifths":0},{"name":"A3","voicing":[57],"voicing_names":["A3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
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
  title_en = EXCLUDED.title_en,
  updated_at = now();

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
  20, 5,
  '五線の中の音符（ヘ音記号）', 'Bass clef: notes on the staff',
  'ヘ音記号の五線の中の音符を、3音ずつ覚えていきます。', 'Learn bass-clef notes on the staff, three at a time.',
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
  title_en = EXCLUDED.title_en,
  updated_at = now();

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b6-q1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-reading-notation'),
  'ラシド',
  'A B C',
  'ヘ音記号・下加線。ラ・シ・ドの3音です。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  'Bass clef, lower ledger lines: A, B, and C.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  true,
  21, 6,
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
   '[{"name":"A1","voicing":[33],"voicing_names":["A1"],"voicing_staves":[2],"key_fifths":0},{"name":"B1","voicing":[35],"voicing_names":["B1"],"voicing_staves":[2],"key_fifths":0},{"name":"C2","voicing":[36],"voicing_names":["C2"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b6-q1-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b6-q1'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"A1","voicing":[33],"voicing_names":["A1"],"voicing_staves":[2],"key_fifths":0},{"name":"B1","voicing":[35],"voicing_names":["B1"],"voicing_staves":[2],"key_fifths":0},{"name":"C2","voicing":[36],"voicing_names":["C2"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
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
  title_en = EXCLUDED.title_en,
  updated_at = now();

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b6-q2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-reading-notation'),
  'シドレ',
  'B C D',
  'ヘ音記号・下加線。シ・ド・レを読みましょう。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  'Bass clef, lower ledger lines: B, C, and D.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  true,
  22, 6,
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
   '[{"name":"B1","voicing":[35],"voicing_names":["B1"],"voicing_staves":[2],"key_fifths":0},{"name":"C2","voicing":[36],"voicing_names":["C2"],"voicing_staves":[2],"key_fifths":0},{"name":"D2","voicing":[38],"voicing_names":["D2"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b6-q2-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b6-q2'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"B1","voicing":[35],"voicing_names":["B1"],"voicing_staves":[2],"key_fifths":0},{"name":"C2","voicing":[36],"voicing_names":["C2"],"voicing_staves":[2],"key_fifths":0},{"name":"D2","voicing":[38],"voicing_names":["D2"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
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
  title_en = EXCLUDED.title_en,
  updated_at = now();

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b6-q3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-reading-notation'),
  'ドレミ',
  'C D E',
  'ヘ音記号・下加線。ド・レ・ミの3音です。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  'Bass clef, lower ledger lines: C, D, and E.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  true,
  23, 6,
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
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b6-q3-balloon'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b6-q3'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'notation-balloon-random'), false, NULL,
   '[{"name":"C2","voicing":[36],"voicing_names":["C2"],"voicing_staves":[2],"key_fifths":0},{"name":"D2","voicing":[38],"voicing_names":["D2"],"voicing_staves":[2],"key_fifths":0},{"name":"E2","voicing":[40],"voicing_names":["E2"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b6-q3-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b6-q3'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"C2","voicing":[36],"voicing_names":["C2"],"voicing_staves":[2],"key_fifths":0},{"name":"D2","voicing":[38],"voicing_names":["D2"],"voicing_staves":[2],"key_fifths":0},{"name":"E2","voicing":[40],"voicing_names":["E2"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
   '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb,
   'サバイバル', 'Survival', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b6-q3-battle'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b6-q3'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q3'), NULL, NULL,
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
  title_en = EXCLUDED.title_en,
  updated_at = now();

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b6-q4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-reading-notation'),
  'レミファ',
  'D E F',
  'ヘ音記号・下加線。レ・ミ・ファを読みましょう。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  'Bass clef, lower ledger lines: D, E, and F.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  true,
  24, 6,
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
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b6-q4-balloon'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b6-q4'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'notation-balloon-random'), false, NULL,
   '[{"name":"D2","voicing":[38],"voicing_names":["D2"],"voicing_staves":[2],"key_fifths":0},{"name":"E2","voicing":[40],"voicing_names":["E2"],"voicing_staves":[2],"key_fifths":0},{"name":"F2","voicing":[41],"voicing_names":["F2"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b6-q4-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b6-q4'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"D2","voicing":[38],"voicing_names":["D2"],"voicing_staves":[2],"key_fifths":0},{"name":"E2","voicing":[40],"voicing_names":["E2"],"voicing_staves":[2],"key_fifths":0},{"name":"F2","voicing":[41],"voicing_names":["F2"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
   '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb,
   'サバイバル', 'Survival', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b6-q4-battle'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b6-q4'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q4'), NULL, NULL,
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
  title_en = EXCLUDED.title_en,
  updated_at = now();

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
  25, 6,
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
  title_en = EXCLUDED.title_en,
  updated_at = now();

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b7-q1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-reading-notation'),
  'シドレ',
  'B C D',
  'ヘ音記号・上加線。シ・ド・レの3音です。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  'Bass clef, upper ledger lines: B, C, and D.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  true,
  26, 7,
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
   '[{"name":"B3","voicing":[59],"voicing_names":["B3"],"voicing_staves":[2],"key_fifths":0},{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[2],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b7-q1-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b7-q1'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"B3","voicing":[59],"voicing_names":["B3"],"voicing_staves":[2],"key_fifths":0},{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[2],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
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
  title_en = EXCLUDED.title_en,
  updated_at = now();

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b7-q2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-reading-notation'),
  'ドレミ',
  'C D E',
  'ヘ音記号・上加線。中央ドからミまで読みましょう。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  'Bass clef, upper ledger lines: C, D, and E.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  true,
  27, 7,
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
   '[{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[2],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[2],"key_fifths":0},{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b7-q2-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b7-q2'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[2],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[2],"key_fifths":0},{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
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
  title_en = EXCLUDED.title_en,
  updated_at = now();

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b7-q3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-reading-notation'),
  'レミファ',
  'D E F',
  'ヘ音記号・上加線。レ・ミ・ファの3音です。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  'Bass clef, upper ledger lines: D, E, and F.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  true,
  28, 7,
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
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b7-q3-balloon'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b7-q3'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'notation-balloon-random'), false, NULL,
   '[{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[2],"key_fifths":0},{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[2],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b7-q3-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b7-q3'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[2],"key_fifths":0},{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[2],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
   '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb,
   'サバイバル', 'Survival', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b7-q3-battle'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b7-q3'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q3'), NULL, NULL,
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
  title_en = EXCLUDED.title_en,
  updated_at = now();

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  block_description, block_description_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b7-q4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-reading-notation'),
  'ミファソ',
  'E F G',
  'ヘ音記号・上加線。ミ・ファ・ソを読みましょう。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  'Bass clef, upper ledger lines: E, F, and G.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  true,
  29, 7,
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
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b7-q4-balloon'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b7-q4'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'notation-balloon-random'), false, NULL,
   '[{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[2],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[2],"key_fifths":0},{"name":"G4","voicing":[67],"voicing_names":["G4"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b7-q4-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b7-q4'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[2],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[2],"key_fifths":0},{"name":"G4","voicing":[67],"voicing_names":["G4"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
   '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb,
   'サバイバル', 'Survival', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b7-q4-battle'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b7-q4'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, false, NULL, NULL, false, NULL, true,
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q4'), NULL, NULL,
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
  title_en = EXCLUDED.title_en,
  updated_at = now();

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
  30, 7,
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
  title_en = EXCLUDED.title_en,
  updated_at = now();

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
  31, 8,
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
   '[{"name":"G2","voicing":[43],"voicing_names":["G2"],"voicing_staves":[2],"key_fifths":0},{"name":"A2","voicing":[45],"voicing_names":["A2"],"voicing_staves":[2],"key_fifths":0},{"name":"B2","voicing":[47],"voicing_names":["B2"],"voicing_staves":[2],"key_fifths":0},{"name":"C3","voicing":[48],"voicing_names":["C3"],"voicing_staves":[2],"key_fifths":0},{"name":"D3","voicing":[50],"voicing_names":["D3"],"voicing_staves":[2],"key_fifths":0},{"name":"E3","voicing":[52],"voicing_names":["E3"],"voicing_staves":[2],"key_fifths":0},{"name":"F3","voicing":[53],"voicing_names":["F3"],"voicing_staves":[2],"key_fifths":0},{"name":"G3","voicing":[55],"voicing_names":["G3"],"voicing_staves":[2],"key_fifths":0},{"name":"A3","voicing":[57],"voicing_names":["A3"],"voicing_staves":[2],"key_fifths":0},{"name":"A1","voicing":[33],"voicing_names":["A1"],"voicing_staves":[2],"key_fifths":0},{"name":"B1","voicing":[35],"voicing_names":["B1"],"voicing_staves":[2],"key_fifths":0},{"name":"C2","voicing":[36],"voicing_names":["C2"],"voicing_staves":[2],"key_fifths":0},{"name":"D2","voicing":[38],"voicing_names":["D2"],"voicing_staves":[2],"key_fifths":0},{"name":"E2","voicing":[40],"voicing_names":["E2"],"voicing_staves":[2],"key_fifths":0},{"name":"F2","voicing":[41],"voicing_names":["F2"],"voicing_staves":[2],"key_fifths":0},{"name":"B3","voicing":[59],"voicing_names":["B3"],"voicing_staves":[2],"key_fifths":0},{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[2],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[2],"key_fifths":0},{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[2],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[2],"key_fifths":0},{"name":"G4","voicing":[67],"voicing_names":["G4"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b8-q1-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b8-q1'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"G2","voicing":[43],"voicing_names":["G2"],"voicing_staves":[2],"key_fifths":0},{"name":"A2","voicing":[45],"voicing_names":["A2"],"voicing_staves":[2],"key_fifths":0},{"name":"B2","voicing":[47],"voicing_names":["B2"],"voicing_staves":[2],"key_fifths":0},{"name":"C3","voicing":[48],"voicing_names":["C3"],"voicing_staves":[2],"key_fifths":0},{"name":"D3","voicing":[50],"voicing_names":["D3"],"voicing_staves":[2],"key_fifths":0},{"name":"E3","voicing":[52],"voicing_names":["E3"],"voicing_staves":[2],"key_fifths":0},{"name":"F3","voicing":[53],"voicing_names":["F3"],"voicing_staves":[2],"key_fifths":0},{"name":"G3","voicing":[55],"voicing_names":["G3"],"voicing_staves":[2],"key_fifths":0},{"name":"A3","voicing":[57],"voicing_names":["A3"],"voicing_staves":[2],"key_fifths":0},{"name":"A1","voicing":[33],"voicing_names":["A1"],"voicing_staves":[2],"key_fifths":0},{"name":"B1","voicing":[35],"voicing_names":["B1"],"voicing_staves":[2],"key_fifths":0},{"name":"C2","voicing":[36],"voicing_names":["C2"],"voicing_staves":[2],"key_fifths":0},{"name":"D2","voicing":[38],"voicing_names":["D2"],"voicing_staves":[2],"key_fifths":0},{"name":"E2","voicing":[40],"voicing_names":["E2"],"voicing_staves":[2],"key_fifths":0},{"name":"F2","voicing":[41],"voicing_names":["F2"],"voicing_staves":[2],"key_fifths":0},{"name":"B3","voicing":[59],"voicing_names":["B3"],"voicing_staves":[2],"key_fifths":0},{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[2],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[2],"key_fifths":0},{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[2],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[2],"key_fifths":0},{"name":"G4","voicing":[67],"voicing_names":["G4"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
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
  title_en = EXCLUDED.title_en,
  updated_at = now();

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
  32, 9,
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
  title_en = EXCLUDED.title_en,
  updated_at = now();

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
  33, 10,
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
   '[{"name":"F#4","voicing":[66],"voicing_names":["F#4"],"voicing_staves":[1],"key_fifths":0},{"name":"G#4","voicing":[68],"voicing_names":["G#4"],"voicing_staves":[1],"key_fifths":0},{"name":"C#5","voicing":[73],"voicing_names":["C#5"],"voicing_staves":[1],"key_fifths":0},{"name":"D#5","voicing":[75],"voicing_names":["D#5"],"voicing_staves":[1],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b10-q1-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b10-q1'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"F#4","voicing":[66],"voicing_names":["F#4"],"voicing_staves":[1],"key_fifths":0},{"name":"G#4","voicing":[68],"voicing_names":["G#4"],"voicing_staves":[1],"key_fifths":0},{"name":"C#5","voicing":[73],"voicing_names":["C#5"],"voicing_staves":[1],"key_fifths":0},{"name":"D#5","voicing":[75],"voicing_names":["D#5"],"voicing_staves":[1],"key_fifths":0}]'::jsonb,
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
  title_en = EXCLUDED.title_en,
  updated_at = now();

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
  34, 10,
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
   '[{"name":"F#2","voicing":[42],"voicing_names":["F#2"],"voicing_staves":[2],"key_fifths":0},{"name":"G#2","voicing":[44],"voicing_names":["G#2"],"voicing_staves":[2],"key_fifths":0},{"name":"C#3","voicing":[49],"voicing_names":["C#3"],"voicing_staves":[2],"key_fifths":0},{"name":"D#3","voicing":[51],"voicing_names":["D#3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b10-q2-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b10-q2'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"F#2","voicing":[42],"voicing_names":["F#2"],"voicing_staves":[2],"key_fifths":0},{"name":"G#2","voicing":[44],"voicing_names":["G#2"],"voicing_staves":[2],"key_fifths":0},{"name":"C#3","voicing":[49],"voicing_names":["C#3"],"voicing_staves":[2],"key_fifths":0},{"name":"D#3","voicing":[51],"voicing_names":["D#3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
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
  title_en = EXCLUDED.title_en,
  updated_at = now();

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
  35, 10,
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
   '[{"name":"F#4","voicing":[66],"voicing_names":["F#4"],"voicing_staves":[1],"key_fifths":0},{"name":"G#4","voicing":[68],"voicing_names":["G#4"],"voicing_staves":[1],"key_fifths":0},{"name":"C#5","voicing":[73],"voicing_names":["C#5"],"voicing_staves":[1],"key_fifths":0},{"name":"D#5","voicing":[75],"voicing_names":["D#5"],"voicing_staves":[1],"key_fifths":0},{"name":"F#2","voicing":[42],"voicing_names":["F#2"],"voicing_staves":[2],"key_fifths":0},{"name":"G#2","voicing":[44],"voicing_names":["G#2"],"voicing_staves":[2],"key_fifths":0},{"name":"C#3","voicing":[49],"voicing_names":["C#3"],"voicing_staves":[2],"key_fifths":0},{"name":"D#3","voicing":[51],"voicing_names":["D#3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b10-q3-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b10-q3'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"F#4","voicing":[66],"voicing_names":["F#4"],"voicing_staves":[1],"key_fifths":0},{"name":"G#4","voicing":[68],"voicing_names":["G#4"],"voicing_staves":[1],"key_fifths":0},{"name":"C#5","voicing":[73],"voicing_names":["C#5"],"voicing_staves":[1],"key_fifths":0},{"name":"D#5","voicing":[75],"voicing_names":["D#5"],"voicing_staves":[1],"key_fifths":0},{"name":"F#2","voicing":[42],"voicing_names":["F#2"],"voicing_staves":[2],"key_fifths":0},{"name":"G#2","voicing":[44],"voicing_names":["G#2"],"voicing_staves":[2],"key_fifths":0},{"name":"C#3","voicing":[49],"voicing_names":["C#3"],"voicing_staves":[2],"key_fifths":0},{"name":"D#3","voicing":[51],"voicing_names":["D#3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
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
  title_en = EXCLUDED.title_en,
  updated_at = now();

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
  36, 11,
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
   '[{"name":"Bb4","voicing":[70],"voicing_names":["Bb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Eb4","voicing":[63],"voicing_names":["Eb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Ab4","voicing":[68],"voicing_names":["Ab4"],"voicing_staves":[1],"key_fifths":0},{"name":"Db5","voicing":[73],"voicing_names":["Db5"],"voicing_staves":[1],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b11-q1-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b11-q1'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"Bb4","voicing":[70],"voicing_names":["Bb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Eb4","voicing":[63],"voicing_names":["Eb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Ab4","voicing":[68],"voicing_names":["Ab4"],"voicing_staves":[1],"key_fifths":0},{"name":"Db5","voicing":[73],"voicing_names":["Db5"],"voicing_staves":[1],"key_fifths":0}]'::jsonb,
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
  title_en = EXCLUDED.title_en,
  updated_at = now();

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
  37, 11,
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
   '[{"name":"Bb2","voicing":[46],"voicing_names":["Bb2"],"voicing_staves":[2],"key_fifths":0},{"name":"Eb3","voicing":[51],"voicing_names":["Eb3"],"voicing_staves":[2],"key_fifths":0},{"name":"Ab2","voicing":[44],"voicing_names":["Ab2"],"voicing_staves":[2],"key_fifths":0},{"name":"Db3","voicing":[49],"voicing_names":["Db3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b11-q2-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b11-q2'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"Bb2","voicing":[46],"voicing_names":["Bb2"],"voicing_staves":[2],"key_fifths":0},{"name":"Eb3","voicing":[51],"voicing_names":["Eb3"],"voicing_staves":[2],"key_fifths":0},{"name":"Ab2","voicing":[44],"voicing_names":["Ab2"],"voicing_staves":[2],"key_fifths":0},{"name":"Db3","voicing":[49],"voicing_names":["Db3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
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
  title_en = EXCLUDED.title_en,
  updated_at = now();

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
  38, 11,
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
   '[{"name":"Bb4","voicing":[70],"voicing_names":["Bb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Eb4","voicing":[63],"voicing_names":["Eb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Ab4","voicing":[68],"voicing_names":["Ab4"],"voicing_staves":[1],"key_fifths":0},{"name":"Db5","voicing":[73],"voicing_names":["Db5"],"voicing_staves":[1],"key_fifths":0},{"name":"Bb2","voicing":[46],"voicing_names":["Bb2"],"voicing_staves":[2],"key_fifths":0},{"name":"Eb3","voicing":[51],"voicing_names":["Eb3"],"voicing_staves":[2],"key_fifths":0},{"name":"Ab2","voicing":[44],"voicing_names":["Ab2"],"voicing_staves":[2],"key_fifths":0},{"name":"Db3","voicing":[49],"voicing_names":["Db3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b11-q3-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b11-q3'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"Bb4","voicing":[70],"voicing_names":["Bb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Eb4","voicing":[63],"voicing_names":["Eb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Ab4","voicing":[68],"voicing_names":["Ab4"],"voicing_staves":[1],"key_fifths":0},{"name":"Db5","voicing":[73],"voicing_names":["Db5"],"voicing_staves":[1],"key_fifths":0},{"name":"Bb2","voicing":[46],"voicing_names":["Bb2"],"voicing_staves":[2],"key_fifths":0},{"name":"Eb3","voicing":[51],"voicing_names":["Eb3"],"voicing_staves":[2],"key_fifths":0},{"name":"Ab2","voicing":[44],"voicing_names":["Ab2"],"voicing_staves":[2],"key_fifths":0},{"name":"Db3","voicing":[49],"voicing_names":["Db3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
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
  title_en = EXCLUDED.title_en,
  updated_at = now();

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
  39, 12,
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
   '[{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[1],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[1],"key_fifths":0},{"name":"G4","voicing":[67],"voicing_names":["G4"],"voicing_staves":[1],"key_fifths":0},{"name":"A4","voicing":[69],"voicing_names":["A4"],"voicing_staves":[1],"key_fifths":0},{"name":"B4","voicing":[71],"voicing_names":["B4"],"voicing_staves":[1],"key_fifths":0},{"name":"C5","voicing":[72],"voicing_names":["C5"],"voicing_staves":[1],"key_fifths":0},{"name":"D5","voicing":[74],"voicing_names":["D5"],"voicing_staves":[1],"key_fifths":0},{"name":"E5","voicing":[76],"voicing_names":["E5"],"voicing_staves":[1],"key_fifths":0},{"name":"F5","voicing":[77],"voicing_names":["F5"],"voicing_staves":[1],"key_fifths":0},{"name":"G5","voicing":[79],"voicing_names":["G5"],"voicing_staves":[1],"key_fifths":0},{"name":"A5","voicing":[81],"voicing_names":["A5"],"voicing_staves":[1],"key_fifths":0},{"name":"B5","voicing":[83],"voicing_names":["B5"],"voicing_staves":[1],"key_fifths":0},{"name":"C6","voicing":[84],"voicing_names":["C6"],"voicing_staves":[1],"key_fifths":0},{"name":"D6","voicing":[86],"voicing_names":["D6"],"voicing_staves":[1],"key_fifths":0},{"name":"E6","voicing":[88],"voicing_names":["E6"],"voicing_staves":[1],"key_fifths":0},{"name":"F3","voicing":[53],"voicing_names":["F3"],"voicing_staves":[1],"key_fifths":0},{"name":"G3","voicing":[55],"voicing_names":["G3"],"voicing_staves":[1],"key_fifths":0},{"name":"A3","voicing":[57],"voicing_names":["A3"],"voicing_staves":[1],"key_fifths":0},{"name":"B3","voicing":[59],"voicing_names":["B3"],"voicing_staves":[1],"key_fifths":0},{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[1],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[1],"key_fifths":0},{"name":"G2","voicing":[43],"voicing_names":["G2"],"voicing_staves":[2],"key_fifths":0},{"name":"A2","voicing":[45],"voicing_names":["A2"],"voicing_staves":[2],"key_fifths":0},{"name":"B2","voicing":[47],"voicing_names":["B2"],"voicing_staves":[2],"key_fifths":0},{"name":"C3","voicing":[48],"voicing_names":["C3"],"voicing_staves":[2],"key_fifths":0},{"name":"D3","voicing":[50],"voicing_names":["D3"],"voicing_staves":[2],"key_fifths":0},{"name":"E3","voicing":[52],"voicing_names":["E3"],"voicing_staves":[2],"key_fifths":0},{"name":"F3","voicing":[53],"voicing_names":["F3"],"voicing_staves":[2],"key_fifths":0},{"name":"G3","voicing":[55],"voicing_names":["G3"],"voicing_staves":[2],"key_fifths":0},{"name":"A3","voicing":[57],"voicing_names":["A3"],"voicing_staves":[2],"key_fifths":0},{"name":"A1","voicing":[33],"voicing_names":["A1"],"voicing_staves":[2],"key_fifths":0},{"name":"B1","voicing":[35],"voicing_names":["B1"],"voicing_staves":[2],"key_fifths":0},{"name":"C2","voicing":[36],"voicing_names":["C2"],"voicing_staves":[2],"key_fifths":0},{"name":"D2","voicing":[38],"voicing_names":["D2"],"voicing_staves":[2],"key_fifths":0},{"name":"E2","voicing":[40],"voicing_names":["E2"],"voicing_staves":[2],"key_fifths":0},{"name":"F2","voicing":[41],"voicing_names":["F2"],"voicing_staves":[2],"key_fifths":0},{"name":"B3","voicing":[59],"voicing_names":["B3"],"voicing_staves":[2],"key_fifths":0},{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[2],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[2],"key_fifths":0},{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[2],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[2],"key_fifths":0},{"name":"G4","voicing":[67],"voicing_names":["G4"],"voicing_staves":[2],"key_fifths":0},{"name":"F#4","voicing":[66],"voicing_names":["F#4"],"voicing_staves":[1],"key_fifths":0},{"name":"G#4","voicing":[68],"voicing_names":["G#4"],"voicing_staves":[1],"key_fifths":0},{"name":"C#5","voicing":[73],"voicing_names":["C#5"],"voicing_staves":[1],"key_fifths":0},{"name":"D#5","voicing":[75],"voicing_names":["D#5"],"voicing_staves":[1],"key_fifths":0},{"name":"F#2","voicing":[42],"voicing_names":["F#2"],"voicing_staves":[2],"key_fifths":0},{"name":"G#2","voicing":[44],"voicing_names":["G#2"],"voicing_staves":[2],"key_fifths":0},{"name":"C#3","voicing":[49],"voicing_names":["C#3"],"voicing_staves":[2],"key_fifths":0},{"name":"D#3","voicing":[51],"voicing_names":["D#3"],"voicing_staves":[2],"key_fifths":0},{"name":"Bb4","voicing":[70],"voicing_names":["Bb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Eb4","voicing":[63],"voicing_names":["Eb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Ab4","voicing":[68],"voicing_names":["Ab4"],"voicing_staves":[1],"key_fifths":0},{"name":"Db5","voicing":[73],"voicing_names":["Db5"],"voicing_staves":[1],"key_fifths":0},{"name":"Bb2","voicing":[46],"voicing_names":["Bb2"],"voicing_staves":[2],"key_fifths":0},{"name":"Eb3","voicing":[51],"voicing_names":["Eb3"],"voicing_staves":[2],"key_fifths":0},{"name":"Ab2","voicing":[44],"voicing_names":["Ab2"],"voicing_staves":[2],"key_fifths":0},{"name":"Db3","voicing":[49],"voicing_names":["Db3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb, NULL,
   '風船ラッシュ', 'Balloon Rush', true),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lsong-b12-q1-survival'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b12-q1'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb,
   false, NULL, true, 1100, 'lesson', false, NULL, false, NULL,
   '[{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[1],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[1],"key_fifths":0},{"name":"G4","voicing":[67],"voicing_names":["G4"],"voicing_staves":[1],"key_fifths":0},{"name":"A4","voicing":[69],"voicing_names":["A4"],"voicing_staves":[1],"key_fifths":0},{"name":"B4","voicing":[71],"voicing_names":["B4"],"voicing_staves":[1],"key_fifths":0},{"name":"C5","voicing":[72],"voicing_names":["C5"],"voicing_staves":[1],"key_fifths":0},{"name":"D5","voicing":[74],"voicing_names":["D5"],"voicing_staves":[1],"key_fifths":0},{"name":"E5","voicing":[76],"voicing_names":["E5"],"voicing_staves":[1],"key_fifths":0},{"name":"F5","voicing":[77],"voicing_names":["F5"],"voicing_staves":[1],"key_fifths":0},{"name":"G5","voicing":[79],"voicing_names":["G5"],"voicing_staves":[1],"key_fifths":0},{"name":"A5","voicing":[81],"voicing_names":["A5"],"voicing_staves":[1],"key_fifths":0},{"name":"B5","voicing":[83],"voicing_names":["B5"],"voicing_staves":[1],"key_fifths":0},{"name":"C6","voicing":[84],"voicing_names":["C6"],"voicing_staves":[1],"key_fifths":0},{"name":"D6","voicing":[86],"voicing_names":["D6"],"voicing_staves":[1],"key_fifths":0},{"name":"E6","voicing":[88],"voicing_names":["E6"],"voicing_staves":[1],"key_fifths":0},{"name":"F3","voicing":[53],"voicing_names":["F3"],"voicing_staves":[1],"key_fifths":0},{"name":"G3","voicing":[55],"voicing_names":["G3"],"voicing_staves":[1],"key_fifths":0},{"name":"A3","voicing":[57],"voicing_names":["A3"],"voicing_staves":[1],"key_fifths":0},{"name":"B3","voicing":[59],"voicing_names":["B3"],"voicing_staves":[1],"key_fifths":0},{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[1],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[1],"key_fifths":0},{"name":"G2","voicing":[43],"voicing_names":["G2"],"voicing_staves":[2],"key_fifths":0},{"name":"A2","voicing":[45],"voicing_names":["A2"],"voicing_staves":[2],"key_fifths":0},{"name":"B2","voicing":[47],"voicing_names":["B2"],"voicing_staves":[2],"key_fifths":0},{"name":"C3","voicing":[48],"voicing_names":["C3"],"voicing_staves":[2],"key_fifths":0},{"name":"D3","voicing":[50],"voicing_names":["D3"],"voicing_staves":[2],"key_fifths":0},{"name":"E3","voicing":[52],"voicing_names":["E3"],"voicing_staves":[2],"key_fifths":0},{"name":"F3","voicing":[53],"voicing_names":["F3"],"voicing_staves":[2],"key_fifths":0},{"name":"G3","voicing":[55],"voicing_names":["G3"],"voicing_staves":[2],"key_fifths":0},{"name":"A3","voicing":[57],"voicing_names":["A3"],"voicing_staves":[2],"key_fifths":0},{"name":"A1","voicing":[33],"voicing_names":["A1"],"voicing_staves":[2],"key_fifths":0},{"name":"B1","voicing":[35],"voicing_names":["B1"],"voicing_staves":[2],"key_fifths":0},{"name":"C2","voicing":[36],"voicing_names":["C2"],"voicing_staves":[2],"key_fifths":0},{"name":"D2","voicing":[38],"voicing_names":["D2"],"voicing_staves":[2],"key_fifths":0},{"name":"E2","voicing":[40],"voicing_names":["E2"],"voicing_staves":[2],"key_fifths":0},{"name":"F2","voicing":[41],"voicing_names":["F2"],"voicing_staves":[2],"key_fifths":0},{"name":"B3","voicing":[59],"voicing_names":["B3"],"voicing_staves":[2],"key_fifths":0},{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[2],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[2],"key_fifths":0},{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[2],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[2],"key_fifths":0},{"name":"G4","voicing":[67],"voicing_names":["G4"],"voicing_staves":[2],"key_fifths":0},{"name":"F#4","voicing":[66],"voicing_names":["F#4"],"voicing_staves":[1],"key_fifths":0},{"name":"G#4","voicing":[68],"voicing_names":["G#4"],"voicing_staves":[1],"key_fifths":0},{"name":"C#5","voicing":[73],"voicing_names":["C#5"],"voicing_staves":[1],"key_fifths":0},{"name":"D#5","voicing":[75],"voicing_names":["D#5"],"voicing_staves":[1],"key_fifths":0},{"name":"F#2","voicing":[42],"voicing_names":["F#2"],"voicing_staves":[2],"key_fifths":0},{"name":"G#2","voicing":[44],"voicing_names":["G#2"],"voicing_staves":[2],"key_fifths":0},{"name":"C#3","voicing":[49],"voicing_names":["C#3"],"voicing_staves":[2],"key_fifths":0},{"name":"D#3","voicing":[51],"voicing_names":["D#3"],"voicing_staves":[2],"key_fifths":0},{"name":"Bb4","voicing":[70],"voicing_names":["Bb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Eb4","voicing":[63],"voicing_names":["Eb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Ab4","voicing":[68],"voicing_names":["Ab4"],"voicing_staves":[1],"key_fifths":0},{"name":"Db5","voicing":[73],"voicing_names":["Db5"],"voicing_staves":[1],"key_fifths":0},{"name":"Bb2","voicing":[46],"voicing_names":["Bb2"],"voicing_staves":[2],"key_fifths":0},{"name":"Eb3","voicing":[51],"voicing_names":["Eb3"],"voicing_staves":[2],"key_fifths":0},{"name":"Ab2","voicing":[44],"voicing_names":["Ab2"],"voicing_staves":[2],"key_fifths":0},{"name":"Db3","voicing":[49],"voicing_names":["Db3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb,
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
  title_en = EXCLUDED.title_en,
  updated_at = now();

COMMIT;
