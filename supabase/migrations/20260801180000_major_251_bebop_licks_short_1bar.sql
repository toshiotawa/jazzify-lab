-- Major II-V-I Bebop Licks: Short 1Bar (3 stages × 12 keys × battle/precision)
BEGIN;

INSERT INTO public.courses (
  id, title, title_en, description, description_en,
  premium_only, order_index, audience, is_tutorial, is_visible,
  difficulty_tier, is_developer_only, is_main_course
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-major-251-bebop-licks'),
  'Major II-V-I Bebop Licks',
  'Major II-V-I Bebop Licks',
  'メジャー II-V-I のショート・ビバップリックを、全キー・バトルと精密モードで練習します。',
  'Practice short major II-V-I bebop licks in all keys with battle and precision modes.',
  true,
  COALESCE((SELECT MAX(c.order_index) FROM public.courses c
    WHERE COALESCE(c.is_developer_only, false) = false
      AND COALESCE(c.is_visible, true) = true), 0) + 1,
  'both', false, true, 'intermediate', false, false
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  difficulty_tier = EXCLUDED.difficulty_tier,
  is_visible = EXCLUDED.is_visible,
  updated_at = now();

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, assignment_description_en
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-major-251-bebop-licks'),
  'Short 1Bar Stage 1',
  'Short 1Bar Stage 1',
  'フレーズ 1〜5（全12キー・バトル / 精密）',
  'Phrases 1–5 (all 12 keys, battle / precision)',
  0,
  1,
  'Short 1Bar',
  'Short 1Bar',
  true,
  'Cキーのバトルと精密モードをクリアしてください（他キーは任意）。',
  'Clear C-key battle and precision (other keys optional).'
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_number = EXCLUDED.block_number,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  assignment_description = EXCLUDED.assignment_description,
  assignment_description_en = EXCLUDED.assignment_description_en,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-c-osmd'),
  'm251-s1-st1-c-osmd',
  'Short 1Bar Stage 1 C（バトル）',
  'Short 1Bar Stage 1 C (Battle)',
  'フレーズ 1〜5（全12キー・バトル / 精密）',
  'Phrases 1–5 (all 12 keys, battle / precision)',
  100, 0, 4, 4, 21, 4,
  0, 600, 100,
  124,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-c-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-c-osmd'),
  0,
  'C（バトル）',
  'C (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-c-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-c.mp3?v=202608011800',
  50.4, 50.4, 0, 0
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-c-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st1'),
  NULL,
  0,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-c-osmd'),
  false, false,
  'C（バトル）',
  'C (Battle)',
  true
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-c-precision'),
  'm251-s1-st1-c-precision',
  'Short 1Bar Stage 1 C（精密）',
  'Short 1Bar Stage 1 C (Precision)',
  'フレーズ 1〜5（全12キー・バトル / 精密）',
  'Phrases 1–5 (all 12 keys, battle / precision)',
  100, 0, 4, 4, 21, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-c-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-c-precision'),
  0,
  'C（精密）',
  'C (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-c-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-c.mp3?v=202608011800',
  50.4, 50.4, 0, 0
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-c-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st1'),
  NULL,
  1,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-c-precision'),
  false, false,
  'C（精密）',
  'C (Precision)',
  true
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-db-osmd'),
  'm251-s1-st1-db-osmd',
  'Short 1Bar Stage 1 Db（バトル）',
  'Short 1Bar Stage 1 Db (Battle)',
  'フレーズ 1〜5（全12キー・バトル / 精密）',
  'Phrases 1–5 (all 12 keys, battle / precision)',
  100, -5, 4, 4, 21, 4,
  0, 600, 100,
  124,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-db-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-db-osmd'),
  0,
  'Db（バトル）',
  'Db (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-db-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-db.mp3?v=202608011800',
  50.4, 50.4, 0, -5
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-db-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st1'),
  NULL,
  2,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-db-osmd'),
  false, false,
  'Db（バトル）',
  'Db (Battle)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-db-precision'),
  'm251-s1-st1-db-precision',
  'Short 1Bar Stage 1 Db（精密）',
  'Short 1Bar Stage 1 Db (Precision)',
  'フレーズ 1〜5（全12キー・バトル / 精密）',
  'Phrases 1–5 (all 12 keys, battle / precision)',
  100, -5, 4, 4, 21, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-db-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-db-precision'),
  0,
  'Db（精密）',
  'Db (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-db-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-db.mp3?v=202608011800',
  50.4, 50.4, 0, -5
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-db-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st1'),
  NULL,
  3,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-db-precision'),
  false, false,
  'Db（精密）',
  'Db (Precision)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-d-osmd'),
  'm251-s1-st1-d-osmd',
  'Short 1Bar Stage 1 D（バトル）',
  'Short 1Bar Stage 1 D (Battle)',
  'フレーズ 1〜5（全12キー・バトル / 精密）',
  'Phrases 1–5 (all 12 keys, battle / precision)',
  100, 2, 4, 4, 21, 4,
  0, 600, 100,
  124,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-d-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-d-osmd'),
  0,
  'D（バトル）',
  'D (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-d-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-d.mp3?v=202608011800',
  50.4, 50.4, 0, 2
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-d-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st1'),
  NULL,
  4,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-d-osmd'),
  false, false,
  'D（バトル）',
  'D (Battle)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-d-precision'),
  'm251-s1-st1-d-precision',
  'Short 1Bar Stage 1 D（精密）',
  'Short 1Bar Stage 1 D (Precision)',
  'フレーズ 1〜5（全12キー・バトル / 精密）',
  'Phrases 1–5 (all 12 keys, battle / precision)',
  100, 2, 4, 4, 21, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-d-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-d-precision'),
  0,
  'D（精密）',
  'D (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-d-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-d.mp3?v=202608011800',
  50.4, 50.4, 0, 2
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-d-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st1'),
  NULL,
  5,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-d-precision'),
  false, false,
  'D（精密）',
  'D (Precision)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-eb-osmd'),
  'm251-s1-st1-eb-osmd',
  'Short 1Bar Stage 1 Eb（バトル）',
  'Short 1Bar Stage 1 Eb (Battle)',
  'フレーズ 1〜5（全12キー・バトル / 精密）',
  'Phrases 1–5 (all 12 keys, battle / precision)',
  100, -3, 4, 4, 21, 4,
  0, 600, 100,
  124,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-eb-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-eb-osmd'),
  0,
  'Eb（バトル）',
  'Eb (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-eb-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-eb.mp3?v=202608011800',
  50.4, 50.4, 0, -3
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-eb-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st1'),
  NULL,
  6,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-eb-osmd'),
  false, false,
  'Eb（バトル）',
  'Eb (Battle)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-eb-precision'),
  'm251-s1-st1-eb-precision',
  'Short 1Bar Stage 1 Eb（精密）',
  'Short 1Bar Stage 1 Eb (Precision)',
  'フレーズ 1〜5（全12キー・バトル / 精密）',
  'Phrases 1–5 (all 12 keys, battle / precision)',
  100, -3, 4, 4, 21, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-eb-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-eb-precision'),
  0,
  'Eb（精密）',
  'Eb (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-eb-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-eb.mp3?v=202608011800',
  50.4, 50.4, 0, -3
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-eb-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st1'),
  NULL,
  7,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-eb-precision'),
  false, false,
  'Eb（精密）',
  'Eb (Precision)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-e-osmd'),
  'm251-s1-st1-e-osmd',
  'Short 1Bar Stage 1 E（バトル）',
  'Short 1Bar Stage 1 E (Battle)',
  'フレーズ 1〜5（全12キー・バトル / 精密）',
  'Phrases 1–5 (all 12 keys, battle / precision)',
  100, 4, 4, 4, 21, 4,
  0, 600, 100,
  124,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-e-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-e-osmd'),
  0,
  'E（バトル）',
  'E (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-e-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-e.mp3?v=202608011800',
  50.4, 50.4, 0, 4
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-e-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st1'),
  NULL,
  8,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-e-osmd'),
  false, false,
  'E（バトル）',
  'E (Battle)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-e-precision'),
  'm251-s1-st1-e-precision',
  'Short 1Bar Stage 1 E（精密）',
  'Short 1Bar Stage 1 E (Precision)',
  'フレーズ 1〜5（全12キー・バトル / 精密）',
  'Phrases 1–5 (all 12 keys, battle / precision)',
  100, 4, 4, 4, 21, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-e-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-e-precision'),
  0,
  'E（精密）',
  'E (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-e-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-e.mp3?v=202608011800',
  50.4, 50.4, 0, 4
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-e-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st1'),
  NULL,
  9,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-e-precision'),
  false, false,
  'E（精密）',
  'E (Precision)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-f-osmd'),
  'm251-s1-st1-f-osmd',
  'Short 1Bar Stage 1 F（バトル）',
  'Short 1Bar Stage 1 F (Battle)',
  'フレーズ 1〜5（全12キー・バトル / 精密）',
  'Phrases 1–5 (all 12 keys, battle / precision)',
  100, -1, 4, 4, 21, 4,
  0, 600, 100,
  124,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-f-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-f-osmd'),
  0,
  'F（バトル）',
  'F (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-f-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-f.mp3?v=202608011800',
  50.4, 50.4, 0, -1
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-f-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st1'),
  NULL,
  10,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-f-osmd'),
  false, false,
  'F（バトル）',
  'F (Battle)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-f-precision'),
  'm251-s1-st1-f-precision',
  'Short 1Bar Stage 1 F（精密）',
  'Short 1Bar Stage 1 F (Precision)',
  'フレーズ 1〜5（全12キー・バトル / 精密）',
  'Phrases 1–5 (all 12 keys, battle / precision)',
  100, -1, 4, 4, 21, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-f-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-f-precision'),
  0,
  'F（精密）',
  'F (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-f-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-f.mp3?v=202608011800',
  50.4, 50.4, 0, -1
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-f-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st1'),
  NULL,
  11,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-f-precision'),
  false, false,
  'F（精密）',
  'F (Precision)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-gb-osmd'),
  'm251-s1-st1-gb-osmd',
  'Short 1Bar Stage 1 Gb（バトル）',
  'Short 1Bar Stage 1 Gb (Battle)',
  'フレーズ 1〜5（全12キー・バトル / 精密）',
  'Phrases 1–5 (all 12 keys, battle / precision)',
  100, -6, 4, 4, 21, 4,
  0, 600, 100,
  124,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-gb-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-gb-osmd'),
  0,
  'Gb（バトル）',
  'Gb (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-gb-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-gb.mp3?v=202608011800',
  50.4, 50.4, 0, -6
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-gb-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st1'),
  NULL,
  12,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-gb-osmd'),
  false, false,
  'Gb（バトル）',
  'Gb (Battle)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-gb-precision'),
  'm251-s1-st1-gb-precision',
  'Short 1Bar Stage 1 Gb（精密）',
  'Short 1Bar Stage 1 Gb (Precision)',
  'フレーズ 1〜5（全12キー・バトル / 精密）',
  'Phrases 1–5 (all 12 keys, battle / precision)',
  100, -6, 4, 4, 21, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-gb-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-gb-precision'),
  0,
  'Gb（精密）',
  'Gb (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-gb-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-gb.mp3?v=202608011800',
  50.4, 50.4, 0, -6
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-gb-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st1'),
  NULL,
  13,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-gb-precision'),
  false, false,
  'Gb（精密）',
  'Gb (Precision)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-g-osmd'),
  'm251-s1-st1-g-osmd',
  'Short 1Bar Stage 1 G（バトル）',
  'Short 1Bar Stage 1 G (Battle)',
  'フレーズ 1〜5（全12キー・バトル / 精密）',
  'Phrases 1–5 (all 12 keys, battle / precision)',
  100, 1, 4, 4, 21, 4,
  0, 600, 100,
  124,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-g-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-g-osmd'),
  0,
  'G（バトル）',
  'G (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-g-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-g.mp3?v=202608011800',
  50.4, 50.4, 0, 1
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-g-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st1'),
  NULL,
  14,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-g-osmd'),
  false, false,
  'G（バトル）',
  'G (Battle)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-g-precision'),
  'm251-s1-st1-g-precision',
  'Short 1Bar Stage 1 G（精密）',
  'Short 1Bar Stage 1 G (Precision)',
  'フレーズ 1〜5（全12キー・バトル / 精密）',
  'Phrases 1–5 (all 12 keys, battle / precision)',
  100, 1, 4, 4, 21, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-g-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-g-precision'),
  0,
  'G（精密）',
  'G (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-g-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-g.mp3?v=202608011800',
  50.4, 50.4, 0, 1
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-g-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st1'),
  NULL,
  15,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-g-precision'),
  false, false,
  'G（精密）',
  'G (Precision)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-ab-osmd'),
  'm251-s1-st1-ab-osmd',
  'Short 1Bar Stage 1 Ab（バトル）',
  'Short 1Bar Stage 1 Ab (Battle)',
  'フレーズ 1〜5（全12キー・バトル / 精密）',
  'Phrases 1–5 (all 12 keys, battle / precision)',
  100, -4, 4, 4, 21, 4,
  0, 600, 100,
  124,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-ab-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-ab-osmd'),
  0,
  'Ab（バトル）',
  'Ab (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-ab-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-ab.mp3?v=202608011800',
  50.4, 50.4, 0, -4
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-ab-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st1'),
  NULL,
  16,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-ab-osmd'),
  false, false,
  'Ab（バトル）',
  'Ab (Battle)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-ab-precision'),
  'm251-s1-st1-ab-precision',
  'Short 1Bar Stage 1 Ab（精密）',
  'Short 1Bar Stage 1 Ab (Precision)',
  'フレーズ 1〜5（全12キー・バトル / 精密）',
  'Phrases 1–5 (all 12 keys, battle / precision)',
  100, -4, 4, 4, 21, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-ab-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-ab-precision'),
  0,
  'Ab（精密）',
  'Ab (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-ab-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-ab.mp3?v=202608011800',
  50.4, 50.4, 0, -4
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-ab-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st1'),
  NULL,
  17,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-ab-precision'),
  false, false,
  'Ab（精密）',
  'Ab (Precision)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-a-osmd'),
  'm251-s1-st1-a-osmd',
  'Short 1Bar Stage 1 A（バトル）',
  'Short 1Bar Stage 1 A (Battle)',
  'フレーズ 1〜5（全12キー・バトル / 精密）',
  'Phrases 1–5 (all 12 keys, battle / precision)',
  100, 3, 4, 4, 21, 4,
  0, 600, 100,
  124,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-a-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-a-osmd'),
  0,
  'A（バトル）',
  'A (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-a-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-a.mp3?v=202608011800',
  50.4, 50.4, 0, 3
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-a-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st1'),
  NULL,
  18,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-a-osmd'),
  false, false,
  'A（バトル）',
  'A (Battle)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-a-precision'),
  'm251-s1-st1-a-precision',
  'Short 1Bar Stage 1 A（精密）',
  'Short 1Bar Stage 1 A (Precision)',
  'フレーズ 1〜5（全12キー・バトル / 精密）',
  'Phrases 1–5 (all 12 keys, battle / precision)',
  100, 3, 4, 4, 21, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-a-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-a-precision'),
  0,
  'A（精密）',
  'A (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-a-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-a.mp3?v=202608011800',
  50.4, 50.4, 0, 3
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-a-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st1'),
  NULL,
  19,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-a-precision'),
  false, false,
  'A（精密）',
  'A (Precision)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-bb-osmd'),
  'm251-s1-st1-bb-osmd',
  'Short 1Bar Stage 1 Bb（バトル）',
  'Short 1Bar Stage 1 Bb (Battle)',
  'フレーズ 1〜5（全12キー・バトル / 精密）',
  'Phrases 1–5 (all 12 keys, battle / precision)',
  100, -2, 4, 4, 21, 4,
  0, 600, 100,
  124,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-bb-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-bb-osmd'),
  0,
  'Bb（バトル）',
  'Bb (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-bb-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-bb.mp3?v=202608011800',
  50.4, 50.4, 0, -2
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-bb-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st1'),
  NULL,
  20,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-bb-osmd'),
  false, false,
  'Bb（バトル）',
  'Bb (Battle)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-bb-precision'),
  'm251-s1-st1-bb-precision',
  'Short 1Bar Stage 1 Bb（精密）',
  'Short 1Bar Stage 1 Bb (Precision)',
  'フレーズ 1〜5（全12キー・バトル / 精密）',
  'Phrases 1–5 (all 12 keys, battle / precision)',
  100, -2, 4, 4, 21, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-bb-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-bb-precision'),
  0,
  'Bb（精密）',
  'Bb (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-bb-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-bb.mp3?v=202608011800',
  50.4, 50.4, 0, -2
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-bb-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st1'),
  NULL,
  21,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-bb-precision'),
  false, false,
  'Bb（精密）',
  'Bb (Precision)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-b-osmd'),
  'm251-s1-st1-b-osmd',
  'Short 1Bar Stage 1 B（バトル）',
  'Short 1Bar Stage 1 B (Battle)',
  'フレーズ 1〜5（全12キー・バトル / 精密）',
  'Phrases 1–5 (all 12 keys, battle / precision)',
  100, 5, 4, 4, 21, 4,
  0, 600, 100,
  124,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-b-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-b-osmd'),
  0,
  'B（バトル）',
  'B (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-b-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-b.mp3?v=202608011800',
  50.4, 50.4, 0, 5
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-b-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st1'),
  NULL,
  22,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-b-osmd'),
  false, false,
  'B（バトル）',
  'B (Battle)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-b-precision'),
  'm251-s1-st1-b-precision',
  'Short 1Bar Stage 1 B（精密）',
  'Short 1Bar Stage 1 B (Precision)',
  'フレーズ 1〜5（全12キー・バトル / 精密）',
  'Phrases 1–5 (all 12 keys, battle / precision)',
  100, 5, 4, 4, 21, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-b-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-b-precision'),
  0,
  'B（精密）',
  'B (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-b-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st1-b.mp3?v=202608011800',
  50.4, 50.4, 0, 5
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-b-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st1'),
  NULL,
  23,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st1-b-precision'),
  false, false,
  'B（精密）',
  'B (Precision)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, assignment_description_en
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-major-251-bebop-licks'),
  'Short 1Bar Stage 2',
  'Short 1Bar Stage 2',
  'フレーズ 6〜10（全12キー・バトル / 精密）',
  'Phrases 6–10 (all 12 keys, battle / precision)',
  1,
  1,
  'Short 1Bar',
  'Short 1Bar',
  true,
  'Cキーのバトルと精密モードをクリアしてください（他キーは任意）。',
  'Clear C-key battle and precision (other keys optional).'
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_number = EXCLUDED.block_number,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  assignment_description = EXCLUDED.assignment_description,
  assignment_description_en = EXCLUDED.assignment_description_en,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-c-osmd'),
  'm251-s1-st2-c-osmd',
  'Short 1Bar Stage 2 C（バトル）',
  'Short 1Bar Stage 2 C (Battle)',
  'フレーズ 6〜10（全12キー・バトル / 精密）',
  'Phrases 6–10 (all 12 keys, battle / precision)',
  100, 0, 4, 4, 21, 4,
  0, 600, 100,
  128,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-c-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-c-osmd'),
  0,
  'C（バトル）',
  'C (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-c-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-c.mp3?v=202608011800',
  50.4, 50.4, 0, 0
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-c-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st2'),
  NULL,
  0,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-c-osmd'),
  false, false,
  'C（バトル）',
  'C (Battle)',
  true
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-c-precision'),
  'm251-s1-st2-c-precision',
  'Short 1Bar Stage 2 C（精密）',
  'Short 1Bar Stage 2 C (Precision)',
  'フレーズ 6〜10（全12キー・バトル / 精密）',
  'Phrases 6–10 (all 12 keys, battle / precision)',
  100, 0, 4, 4, 21, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-c-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-c-precision'),
  0,
  'C（精密）',
  'C (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-c-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-c.mp3?v=202608011800',
  50.4, 50.4, 0, 0
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-c-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st2'),
  NULL,
  1,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-c-precision'),
  false, false,
  'C（精密）',
  'C (Precision)',
  true
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-db-osmd'),
  'm251-s1-st2-db-osmd',
  'Short 1Bar Stage 2 Db（バトル）',
  'Short 1Bar Stage 2 Db (Battle)',
  'フレーズ 6〜10（全12キー・バトル / 精密）',
  'Phrases 6–10 (all 12 keys, battle / precision)',
  100, -5, 4, 4, 21, 4,
  0, 600, 100,
  128,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-db-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-db-osmd'),
  0,
  'Db（バトル）',
  'Db (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-db-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-db.mp3?v=202608011800',
  50.4, 50.4, 0, -5
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-db-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st2'),
  NULL,
  2,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-db-osmd'),
  false, false,
  'Db（バトル）',
  'Db (Battle)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-db-precision'),
  'm251-s1-st2-db-precision',
  'Short 1Bar Stage 2 Db（精密）',
  'Short 1Bar Stage 2 Db (Precision)',
  'フレーズ 6〜10（全12キー・バトル / 精密）',
  'Phrases 6–10 (all 12 keys, battle / precision)',
  100, -5, 4, 4, 21, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-db-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-db-precision'),
  0,
  'Db（精密）',
  'Db (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-db-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-db.mp3?v=202608011800',
  50.4, 50.4, 0, -5
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-db-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st2'),
  NULL,
  3,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-db-precision'),
  false, false,
  'Db（精密）',
  'Db (Precision)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-d-osmd'),
  'm251-s1-st2-d-osmd',
  'Short 1Bar Stage 2 D（バトル）',
  'Short 1Bar Stage 2 D (Battle)',
  'フレーズ 6〜10（全12キー・バトル / 精密）',
  'Phrases 6–10 (all 12 keys, battle / precision)',
  100, 2, 4, 4, 21, 4,
  0, 600, 100,
  128,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-d-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-d-osmd'),
  0,
  'D（バトル）',
  'D (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-d-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-d.mp3?v=202608011800',
  50.4, 50.4, 0, 2
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-d-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st2'),
  NULL,
  4,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-d-osmd'),
  false, false,
  'D（バトル）',
  'D (Battle)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-d-precision'),
  'm251-s1-st2-d-precision',
  'Short 1Bar Stage 2 D（精密）',
  'Short 1Bar Stage 2 D (Precision)',
  'フレーズ 6〜10（全12キー・バトル / 精密）',
  'Phrases 6–10 (all 12 keys, battle / precision)',
  100, 2, 4, 4, 21, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-d-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-d-precision'),
  0,
  'D（精密）',
  'D (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-d-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-d.mp3?v=202608011800',
  50.4, 50.4, 0, 2
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-d-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st2'),
  NULL,
  5,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-d-precision'),
  false, false,
  'D（精密）',
  'D (Precision)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-eb-osmd'),
  'm251-s1-st2-eb-osmd',
  'Short 1Bar Stage 2 Eb（バトル）',
  'Short 1Bar Stage 2 Eb (Battle)',
  'フレーズ 6〜10（全12キー・バトル / 精密）',
  'Phrases 6–10 (all 12 keys, battle / precision)',
  100, -3, 4, 4, 21, 4,
  0, 600, 100,
  128,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-eb-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-eb-osmd'),
  0,
  'Eb（バトル）',
  'Eb (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-eb-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-eb.mp3?v=202608011800',
  50.4, 50.4, 0, -3
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-eb-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st2'),
  NULL,
  6,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-eb-osmd'),
  false, false,
  'Eb（バトル）',
  'Eb (Battle)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-eb-precision'),
  'm251-s1-st2-eb-precision',
  'Short 1Bar Stage 2 Eb（精密）',
  'Short 1Bar Stage 2 Eb (Precision)',
  'フレーズ 6〜10（全12キー・バトル / 精密）',
  'Phrases 6–10 (all 12 keys, battle / precision)',
  100, -3, 4, 4, 21, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-eb-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-eb-precision'),
  0,
  'Eb（精密）',
  'Eb (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-eb-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-eb.mp3?v=202608011800',
  50.4, 50.4, 0, -3
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-eb-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st2'),
  NULL,
  7,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-eb-precision'),
  false, false,
  'Eb（精密）',
  'Eb (Precision)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-e-osmd'),
  'm251-s1-st2-e-osmd',
  'Short 1Bar Stage 2 E（バトル）',
  'Short 1Bar Stage 2 E (Battle)',
  'フレーズ 6〜10（全12キー・バトル / 精密）',
  'Phrases 6–10 (all 12 keys, battle / precision)',
  100, 4, 4, 4, 21, 4,
  0, 600, 100,
  128,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-e-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-e-osmd'),
  0,
  'E（バトル）',
  'E (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-e-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-e.mp3?v=202608011800',
  50.4, 50.4, 0, 4
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-e-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st2'),
  NULL,
  8,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-e-osmd'),
  false, false,
  'E（バトル）',
  'E (Battle)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-e-precision'),
  'm251-s1-st2-e-precision',
  'Short 1Bar Stage 2 E（精密）',
  'Short 1Bar Stage 2 E (Precision)',
  'フレーズ 6〜10（全12キー・バトル / 精密）',
  'Phrases 6–10 (all 12 keys, battle / precision)',
  100, 4, 4, 4, 21, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-e-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-e-precision'),
  0,
  'E（精密）',
  'E (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-e-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-e.mp3?v=202608011800',
  50.4, 50.4, 0, 4
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-e-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st2'),
  NULL,
  9,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-e-precision'),
  false, false,
  'E（精密）',
  'E (Precision)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-f-osmd'),
  'm251-s1-st2-f-osmd',
  'Short 1Bar Stage 2 F（バトル）',
  'Short 1Bar Stage 2 F (Battle)',
  'フレーズ 6〜10（全12キー・バトル / 精密）',
  'Phrases 6–10 (all 12 keys, battle / precision)',
  100, -1, 4, 4, 21, 4,
  0, 600, 100,
  128,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-f-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-f-osmd'),
  0,
  'F（バトル）',
  'F (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-f-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-f.mp3?v=202608011800',
  50.4, 50.4, 0, -1
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-f-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st2'),
  NULL,
  10,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-f-osmd'),
  false, false,
  'F（バトル）',
  'F (Battle)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-f-precision'),
  'm251-s1-st2-f-precision',
  'Short 1Bar Stage 2 F（精密）',
  'Short 1Bar Stage 2 F (Precision)',
  'フレーズ 6〜10（全12キー・バトル / 精密）',
  'Phrases 6–10 (all 12 keys, battle / precision)',
  100, -1, 4, 4, 21, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-f-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-f-precision'),
  0,
  'F（精密）',
  'F (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-f-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-f.mp3?v=202608011800',
  50.4, 50.4, 0, -1
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-f-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st2'),
  NULL,
  11,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-f-precision'),
  false, false,
  'F（精密）',
  'F (Precision)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-gb-osmd'),
  'm251-s1-st2-gb-osmd',
  'Short 1Bar Stage 2 Gb（バトル）',
  'Short 1Bar Stage 2 Gb (Battle)',
  'フレーズ 6〜10（全12キー・バトル / 精密）',
  'Phrases 6–10 (all 12 keys, battle / precision)',
  100, -6, 4, 4, 21, 4,
  0, 600, 100,
  128,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-gb-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-gb-osmd'),
  0,
  'Gb（バトル）',
  'Gb (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-gb-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-gb.mp3?v=202608011800',
  50.4, 50.4, 0, -6
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-gb-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st2'),
  NULL,
  12,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-gb-osmd'),
  false, false,
  'Gb（バトル）',
  'Gb (Battle)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-gb-precision'),
  'm251-s1-st2-gb-precision',
  'Short 1Bar Stage 2 Gb（精密）',
  'Short 1Bar Stage 2 Gb (Precision)',
  'フレーズ 6〜10（全12キー・バトル / 精密）',
  'Phrases 6–10 (all 12 keys, battle / precision)',
  100, -6, 4, 4, 21, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-gb-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-gb-precision'),
  0,
  'Gb（精密）',
  'Gb (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-gb-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-gb.mp3?v=202608011800',
  50.4, 50.4, 0, -6
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-gb-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st2'),
  NULL,
  13,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-gb-precision'),
  false, false,
  'Gb（精密）',
  'Gb (Precision)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-g-osmd'),
  'm251-s1-st2-g-osmd',
  'Short 1Bar Stage 2 G（バトル）',
  'Short 1Bar Stage 2 G (Battle)',
  'フレーズ 6〜10（全12キー・バトル / 精密）',
  'Phrases 6–10 (all 12 keys, battle / precision)',
  100, 1, 4, 4, 21, 4,
  0, 600, 100,
  128,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-g-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-g-osmd'),
  0,
  'G（バトル）',
  'G (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-g-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-g.mp3?v=202608011800',
  50.4, 50.4, 0, 1
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-g-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st2'),
  NULL,
  14,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-g-osmd'),
  false, false,
  'G（バトル）',
  'G (Battle)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-g-precision'),
  'm251-s1-st2-g-precision',
  'Short 1Bar Stage 2 G（精密）',
  'Short 1Bar Stage 2 G (Precision)',
  'フレーズ 6〜10（全12キー・バトル / 精密）',
  'Phrases 6–10 (all 12 keys, battle / precision)',
  100, 1, 4, 4, 21, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-g-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-g-precision'),
  0,
  'G（精密）',
  'G (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-g-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-g.mp3?v=202608011800',
  50.4, 50.4, 0, 1
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-g-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st2'),
  NULL,
  15,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-g-precision'),
  false, false,
  'G（精密）',
  'G (Precision)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-ab-osmd'),
  'm251-s1-st2-ab-osmd',
  'Short 1Bar Stage 2 Ab（バトル）',
  'Short 1Bar Stage 2 Ab (Battle)',
  'フレーズ 6〜10（全12キー・バトル / 精密）',
  'Phrases 6–10 (all 12 keys, battle / precision)',
  100, -4, 4, 4, 21, 4,
  0, 600, 100,
  128,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-ab-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-ab-osmd'),
  0,
  'Ab（バトル）',
  'Ab (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-ab-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-ab.mp3?v=202608011800',
  50.4, 50.4, 0, -4
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-ab-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st2'),
  NULL,
  16,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-ab-osmd'),
  false, false,
  'Ab（バトル）',
  'Ab (Battle)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-ab-precision'),
  'm251-s1-st2-ab-precision',
  'Short 1Bar Stage 2 Ab（精密）',
  'Short 1Bar Stage 2 Ab (Precision)',
  'フレーズ 6〜10（全12キー・バトル / 精密）',
  'Phrases 6–10 (all 12 keys, battle / precision)',
  100, -4, 4, 4, 21, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-ab-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-ab-precision'),
  0,
  'Ab（精密）',
  'Ab (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-ab-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-ab.mp3?v=202608011800',
  50.4, 50.4, 0, -4
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-ab-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st2'),
  NULL,
  17,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-ab-precision'),
  false, false,
  'Ab（精密）',
  'Ab (Precision)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-a-osmd'),
  'm251-s1-st2-a-osmd',
  'Short 1Bar Stage 2 A（バトル）',
  'Short 1Bar Stage 2 A (Battle)',
  'フレーズ 6〜10（全12キー・バトル / 精密）',
  'Phrases 6–10 (all 12 keys, battle / precision)',
  100, 3, 4, 4, 21, 4,
  0, 600, 100,
  128,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-a-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-a-osmd'),
  0,
  'A（バトル）',
  'A (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-a-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-a.mp3?v=202608011800',
  50.4, 50.4, 0, 3
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-a-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st2'),
  NULL,
  18,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-a-osmd'),
  false, false,
  'A（バトル）',
  'A (Battle)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-a-precision'),
  'm251-s1-st2-a-precision',
  'Short 1Bar Stage 2 A（精密）',
  'Short 1Bar Stage 2 A (Precision)',
  'フレーズ 6〜10（全12キー・バトル / 精密）',
  'Phrases 6–10 (all 12 keys, battle / precision)',
  100, 3, 4, 4, 21, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-a-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-a-precision'),
  0,
  'A（精密）',
  'A (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-a-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-a.mp3?v=202608011800',
  50.4, 50.4, 0, 3
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-a-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st2'),
  NULL,
  19,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-a-precision'),
  false, false,
  'A（精密）',
  'A (Precision)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-bb-osmd'),
  'm251-s1-st2-bb-osmd',
  'Short 1Bar Stage 2 Bb（バトル）',
  'Short 1Bar Stage 2 Bb (Battle)',
  'フレーズ 6〜10（全12キー・バトル / 精密）',
  'Phrases 6–10 (all 12 keys, battle / precision)',
  100, -2, 4, 4, 21, 4,
  0, 600, 100,
  128,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-bb-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-bb-osmd'),
  0,
  'Bb（バトル）',
  'Bb (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-bb-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-bb.mp3?v=202608011800',
  50.4, 50.4, 0, -2
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-bb-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st2'),
  NULL,
  20,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-bb-osmd'),
  false, false,
  'Bb（バトル）',
  'Bb (Battle)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-bb-precision'),
  'm251-s1-st2-bb-precision',
  'Short 1Bar Stage 2 Bb（精密）',
  'Short 1Bar Stage 2 Bb (Precision)',
  'フレーズ 6〜10（全12キー・バトル / 精密）',
  'Phrases 6–10 (all 12 keys, battle / precision)',
  100, -2, 4, 4, 21, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-bb-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-bb-precision'),
  0,
  'Bb（精密）',
  'Bb (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-bb-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-bb.mp3?v=202608011800',
  50.4, 50.4, 0, -2
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-bb-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st2'),
  NULL,
  21,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-bb-precision'),
  false, false,
  'Bb（精密）',
  'Bb (Precision)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-b-osmd'),
  'm251-s1-st2-b-osmd',
  'Short 1Bar Stage 2 B（バトル）',
  'Short 1Bar Stage 2 B (Battle)',
  'フレーズ 6〜10（全12キー・バトル / 精密）',
  'Phrases 6–10 (all 12 keys, battle / precision)',
  100, 5, 4, 4, 21, 4,
  0, 600, 100,
  128,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-b-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-b-osmd'),
  0,
  'B（バトル）',
  'B (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-b-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-b.mp3?v=202608011800',
  50.4, 50.4, 0, 5
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-b-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st2'),
  NULL,
  22,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-b-osmd'),
  false, false,
  'B（バトル）',
  'B (Battle)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-b-precision'),
  'm251-s1-st2-b-precision',
  'Short 1Bar Stage 2 B（精密）',
  'Short 1Bar Stage 2 B (Precision)',
  'フレーズ 6〜10（全12キー・バトル / 精密）',
  'Phrases 6–10 (all 12 keys, battle / precision)',
  100, 5, 4, 4, 21, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-b-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-b-precision'),
  0,
  'B（精密）',
  'B (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-b-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st2-b.mp3?v=202608011800',
  50.4, 50.4, 0, 5
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-b-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st2'),
  NULL,
  23,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st2-b-precision'),
  false, false,
  'B（精密）',
  'B (Precision)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, assignment_description_en
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-major-251-bebop-licks'),
  'Short 1Bar Stage 3',
  'Short 1Bar Stage 3',
  'フレーズ 11〜16（全12キー・バトル / 精密）',
  'Phrases 11–16 (all 12 keys, battle / precision)',
  2,
  1,
  'Short 1Bar',
  'Short 1Bar',
  true,
  'Cキーのバトルと精密モードをクリアしてください（他キーは任意）。',
  'Clear C-key battle and precision (other keys optional).'
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_number = EXCLUDED.block_number,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  assignment_description = EXCLUDED.assignment_description,
  assignment_description_en = EXCLUDED.assignment_description_en,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-c-osmd'),
  'm251-s1-st3-c-osmd',
  'Short 1Bar Stage 3 C（バトル）',
  'Short 1Bar Stage 3 C (Battle)',
  'フレーズ 11〜16（全12キー・バトル / 精密）',
  'Phrases 11–16 (all 12 keys, battle / precision)',
  100, 0, 4, 4, 25, 4,
  0, 600, 100,
  144,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-c-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-c-osmd'),
  0,
  'C（バトル）',
  'C (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-c-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-c.mp3?v=202608011800',
  60, 60, 0, 0
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-c-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st3'),
  NULL,
  0,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-c-osmd'),
  false, false,
  'C（バトル）',
  'C (Battle)',
  true
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-c-precision'),
  'm251-s1-st3-c-precision',
  'Short 1Bar Stage 3 C（精密）',
  'Short 1Bar Stage 3 C (Precision)',
  'フレーズ 11〜16（全12キー・バトル / 精密）',
  'Phrases 11–16 (all 12 keys, battle / precision)',
  100, 0, 4, 4, 25, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-c-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-c-precision'),
  0,
  'C（精密）',
  'C (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-c-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-c.mp3?v=202608011800',
  60, 60, 0, 0
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-c-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st3'),
  NULL,
  1,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-c-precision'),
  false, false,
  'C（精密）',
  'C (Precision)',
  true
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-db-osmd'),
  'm251-s1-st3-db-osmd',
  'Short 1Bar Stage 3 Db（バトル）',
  'Short 1Bar Stage 3 Db (Battle)',
  'フレーズ 11〜16（全12キー・バトル / 精密）',
  'Phrases 11–16 (all 12 keys, battle / precision)',
  100, -5, 4, 4, 25, 4,
  0, 600, 100,
  144,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-db-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-db-osmd'),
  0,
  'Db（バトル）',
  'Db (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-db-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-db.mp3?v=202608011800',
  60, 60, 0, -5
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-db-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st3'),
  NULL,
  2,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-db-osmd'),
  false, false,
  'Db（バトル）',
  'Db (Battle)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-db-precision'),
  'm251-s1-st3-db-precision',
  'Short 1Bar Stage 3 Db（精密）',
  'Short 1Bar Stage 3 Db (Precision)',
  'フレーズ 11〜16（全12キー・バトル / 精密）',
  'Phrases 11–16 (all 12 keys, battle / precision)',
  100, -5, 4, 4, 25, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-db-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-db-precision'),
  0,
  'Db（精密）',
  'Db (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-db-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-db.mp3?v=202608011800',
  60, 60, 0, -5
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-db-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st3'),
  NULL,
  3,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-db-precision'),
  false, false,
  'Db（精密）',
  'Db (Precision)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-d-osmd'),
  'm251-s1-st3-d-osmd',
  'Short 1Bar Stage 3 D（バトル）',
  'Short 1Bar Stage 3 D (Battle)',
  'フレーズ 11〜16（全12キー・バトル / 精密）',
  'Phrases 11–16 (all 12 keys, battle / precision)',
  100, 2, 4, 4, 25, 4,
  0, 600, 100,
  144,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-d-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-d-osmd'),
  0,
  'D（バトル）',
  'D (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-d-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-d.mp3?v=202608011800',
  60, 60, 0, 2
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-d-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st3'),
  NULL,
  4,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-d-osmd'),
  false, false,
  'D（バトル）',
  'D (Battle)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-d-precision'),
  'm251-s1-st3-d-precision',
  'Short 1Bar Stage 3 D（精密）',
  'Short 1Bar Stage 3 D (Precision)',
  'フレーズ 11〜16（全12キー・バトル / 精密）',
  'Phrases 11–16 (all 12 keys, battle / precision)',
  100, 2, 4, 4, 25, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-d-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-d-precision'),
  0,
  'D（精密）',
  'D (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-d-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-d.mp3?v=202608011800',
  60, 60, 0, 2
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-d-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st3'),
  NULL,
  5,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-d-precision'),
  false, false,
  'D（精密）',
  'D (Precision)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-eb-osmd'),
  'm251-s1-st3-eb-osmd',
  'Short 1Bar Stage 3 Eb（バトル）',
  'Short 1Bar Stage 3 Eb (Battle)',
  'フレーズ 11〜16（全12キー・バトル / 精密）',
  'Phrases 11–16 (all 12 keys, battle / precision)',
  100, -3, 4, 4, 25, 4,
  0, 600, 100,
  144,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-eb-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-eb-osmd'),
  0,
  'Eb（バトル）',
  'Eb (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-eb-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-eb.mp3?v=202608011800',
  60, 60, 0, -3
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-eb-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st3'),
  NULL,
  6,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-eb-osmd'),
  false, false,
  'Eb（バトル）',
  'Eb (Battle)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-eb-precision'),
  'm251-s1-st3-eb-precision',
  'Short 1Bar Stage 3 Eb（精密）',
  'Short 1Bar Stage 3 Eb (Precision)',
  'フレーズ 11〜16（全12キー・バトル / 精密）',
  'Phrases 11–16 (all 12 keys, battle / precision)',
  100, -3, 4, 4, 25, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-eb-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-eb-precision'),
  0,
  'Eb（精密）',
  'Eb (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-eb-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-eb.mp3?v=202608011800',
  60, 60, 0, -3
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-eb-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st3'),
  NULL,
  7,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-eb-precision'),
  false, false,
  'Eb（精密）',
  'Eb (Precision)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-e-osmd'),
  'm251-s1-st3-e-osmd',
  'Short 1Bar Stage 3 E（バトル）',
  'Short 1Bar Stage 3 E (Battle)',
  'フレーズ 11〜16（全12キー・バトル / 精密）',
  'Phrases 11–16 (all 12 keys, battle / precision)',
  100, 4, 4, 4, 25, 4,
  0, 600, 100,
  144,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-e-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-e-osmd'),
  0,
  'E（バトル）',
  'E (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-e-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-e.mp3?v=202608011800',
  60, 60, 0, 4
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-e-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st3'),
  NULL,
  8,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-e-osmd'),
  false, false,
  'E（バトル）',
  'E (Battle)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-e-precision'),
  'm251-s1-st3-e-precision',
  'Short 1Bar Stage 3 E（精密）',
  'Short 1Bar Stage 3 E (Precision)',
  'フレーズ 11〜16（全12キー・バトル / 精密）',
  'Phrases 11–16 (all 12 keys, battle / precision)',
  100, 4, 4, 4, 25, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-e-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-e-precision'),
  0,
  'E（精密）',
  'E (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-e-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-e.mp3?v=202608011800',
  60, 60, 0, 4
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-e-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st3'),
  NULL,
  9,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-e-precision'),
  false, false,
  'E（精密）',
  'E (Precision)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-f-osmd'),
  'm251-s1-st3-f-osmd',
  'Short 1Bar Stage 3 F（バトル）',
  'Short 1Bar Stage 3 F (Battle)',
  'フレーズ 11〜16（全12キー・バトル / 精密）',
  'Phrases 11–16 (all 12 keys, battle / precision)',
  100, -1, 4, 4, 25, 4,
  0, 600, 100,
  144,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-f-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-f-osmd'),
  0,
  'F（バトル）',
  'F (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-f-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-f.mp3?v=202608011800',
  60, 60, 0, -1
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-f-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st3'),
  NULL,
  10,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-f-osmd'),
  false, false,
  'F（バトル）',
  'F (Battle)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-f-precision'),
  'm251-s1-st3-f-precision',
  'Short 1Bar Stage 3 F（精密）',
  'Short 1Bar Stage 3 F (Precision)',
  'フレーズ 11〜16（全12キー・バトル / 精密）',
  'Phrases 11–16 (all 12 keys, battle / precision)',
  100, -1, 4, 4, 25, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-f-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-f-precision'),
  0,
  'F（精密）',
  'F (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-f-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-f.mp3?v=202608011800',
  60, 60, 0, -1
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-f-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st3'),
  NULL,
  11,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-f-precision'),
  false, false,
  'F（精密）',
  'F (Precision)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-gb-osmd'),
  'm251-s1-st3-gb-osmd',
  'Short 1Bar Stage 3 Gb（バトル）',
  'Short 1Bar Stage 3 Gb (Battle)',
  'フレーズ 11〜16（全12キー・バトル / 精密）',
  'Phrases 11–16 (all 12 keys, battle / precision)',
  100, -6, 4, 4, 25, 4,
  0, 600, 100,
  144,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-gb-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-gb-osmd'),
  0,
  'Gb（バトル）',
  'Gb (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-gb-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-gb.mp3?v=202608011800',
  60, 60, 0, -6
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-gb-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st3'),
  NULL,
  12,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-gb-osmd'),
  false, false,
  'Gb（バトル）',
  'Gb (Battle)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-gb-precision'),
  'm251-s1-st3-gb-precision',
  'Short 1Bar Stage 3 Gb（精密）',
  'Short 1Bar Stage 3 Gb (Precision)',
  'フレーズ 11〜16（全12キー・バトル / 精密）',
  'Phrases 11–16 (all 12 keys, battle / precision)',
  100, -6, 4, 4, 25, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-gb-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-gb-precision'),
  0,
  'Gb（精密）',
  'Gb (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-gb-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-gb.mp3?v=202608011800',
  60, 60, 0, -6
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-gb-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st3'),
  NULL,
  13,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-gb-precision'),
  false, false,
  'Gb（精密）',
  'Gb (Precision)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-g-osmd'),
  'm251-s1-st3-g-osmd',
  'Short 1Bar Stage 3 G（バトル）',
  'Short 1Bar Stage 3 G (Battle)',
  'フレーズ 11〜16（全12キー・バトル / 精密）',
  'Phrases 11–16 (all 12 keys, battle / precision)',
  100, 1, 4, 4, 25, 4,
  0, 600, 100,
  144,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-g-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-g-osmd'),
  0,
  'G（バトル）',
  'G (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-g-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-g.mp3?v=202608011800',
  60, 60, 0, 1
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-g-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st3'),
  NULL,
  14,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-g-osmd'),
  false, false,
  'G（バトル）',
  'G (Battle)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-g-precision'),
  'm251-s1-st3-g-precision',
  'Short 1Bar Stage 3 G（精密）',
  'Short 1Bar Stage 3 G (Precision)',
  'フレーズ 11〜16（全12キー・バトル / 精密）',
  'Phrases 11–16 (all 12 keys, battle / precision)',
  100, 1, 4, 4, 25, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-g-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-g-precision'),
  0,
  'G（精密）',
  'G (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-g-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-g.mp3?v=202608011800',
  60, 60, 0, 1
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-g-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st3'),
  NULL,
  15,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-g-precision'),
  false, false,
  'G（精密）',
  'G (Precision)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-ab-osmd'),
  'm251-s1-st3-ab-osmd',
  'Short 1Bar Stage 3 Ab（バトル）',
  'Short 1Bar Stage 3 Ab (Battle)',
  'フレーズ 11〜16（全12キー・バトル / 精密）',
  'Phrases 11–16 (all 12 keys, battle / precision)',
  100, -4, 4, 4, 25, 4,
  0, 600, 100,
  144,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-ab-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-ab-osmd'),
  0,
  'Ab（バトル）',
  'Ab (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-ab-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-ab.mp3?v=202608011800',
  60, 60, 0, -4
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-ab-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st3'),
  NULL,
  16,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-ab-osmd'),
  false, false,
  'Ab（バトル）',
  'Ab (Battle)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-ab-precision'),
  'm251-s1-st3-ab-precision',
  'Short 1Bar Stage 3 Ab（精密）',
  'Short 1Bar Stage 3 Ab (Precision)',
  'フレーズ 11〜16（全12キー・バトル / 精密）',
  'Phrases 11–16 (all 12 keys, battle / precision)',
  100, -4, 4, 4, 25, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-ab-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-ab-precision'),
  0,
  'Ab（精密）',
  'Ab (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-ab-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-ab.mp3?v=202608011800',
  60, 60, 0, -4
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-ab-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st3'),
  NULL,
  17,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-ab-precision'),
  false, false,
  'Ab（精密）',
  'Ab (Precision)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-a-osmd'),
  'm251-s1-st3-a-osmd',
  'Short 1Bar Stage 3 A（バトル）',
  'Short 1Bar Stage 3 A (Battle)',
  'フレーズ 11〜16（全12キー・バトル / 精密）',
  'Phrases 11–16 (all 12 keys, battle / precision)',
  100, 3, 4, 4, 25, 4,
  0, 600, 100,
  144,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-a-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-a-osmd'),
  0,
  'A（バトル）',
  'A (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-a-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-a.mp3?v=202608011800',
  60, 60, 0, 3
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-a-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st3'),
  NULL,
  18,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-a-osmd'),
  false, false,
  'A（バトル）',
  'A (Battle)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-a-precision'),
  'm251-s1-st3-a-precision',
  'Short 1Bar Stage 3 A（精密）',
  'Short 1Bar Stage 3 A (Precision)',
  'フレーズ 11〜16（全12キー・バトル / 精密）',
  'Phrases 11–16 (all 12 keys, battle / precision)',
  100, 3, 4, 4, 25, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-a-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-a-precision'),
  0,
  'A（精密）',
  'A (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-a-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-a.mp3?v=202608011800',
  60, 60, 0, 3
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-a-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st3'),
  NULL,
  19,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-a-precision'),
  false, false,
  'A（精密）',
  'A (Precision)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-bb-osmd'),
  'm251-s1-st3-bb-osmd',
  'Short 1Bar Stage 3 Bb（バトル）',
  'Short 1Bar Stage 3 Bb (Battle)',
  'フレーズ 11〜16（全12キー・バトル / 精密）',
  'Phrases 11–16 (all 12 keys, battle / precision)',
  100, -2, 4, 4, 25, 4,
  0, 600, 100,
  144,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-bb-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-bb-osmd'),
  0,
  'Bb（バトル）',
  'Bb (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-bb-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-bb.mp3?v=202608011800',
  60, 60, 0, -2
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-bb-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st3'),
  NULL,
  20,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-bb-osmd'),
  false, false,
  'Bb（バトル）',
  'Bb (Battle)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-bb-precision'),
  'm251-s1-st3-bb-precision',
  'Short 1Bar Stage 3 Bb（精密）',
  'Short 1Bar Stage 3 Bb (Precision)',
  'フレーズ 11〜16（全12キー・バトル / 精密）',
  'Phrases 11–16 (all 12 keys, battle / precision)',
  100, -2, 4, 4, 25, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-bb-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-bb-precision'),
  0,
  'Bb（精密）',
  'Bb (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-bb-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-bb.mp3?v=202608011800',
  60, 60, 0, -2
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-bb-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st3'),
  NULL,
  21,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-bb-precision'),
  false, false,
  'Bb（精密）',
  'Bb (Precision)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-b-osmd'),
  'm251-s1-st3-b-osmd',
  'Short 1Bar Stage 3 B（バトル）',
  'Short 1Bar Stage 3 B (Battle)',
  'フレーズ 11〜16（全12キー・バトル / 精密）',
  'Phrases 11–16 (all 12 keys, battle / precision)',
  100, 5, 4, 4, 25, 4,
  0, 600, 100,
  144,
  1, 0, 0, 0,
  5, 0, 0, 2,
  'blue_club', true,
  'chord_osmd',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-b-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-b-osmd'),
  0,
  'B（バトル）',
  'B (Battle)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-b-osmd.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-b.mp3?v=202608011800',
  60, 60, 0, 5
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-b-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st3'),
  NULL,
  22,
  '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-b-osmd'),
  false, false,
  'B（バトル）',
  'B (Battle)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-b-precision'),
  'm251-s1-st3-b-precision',
  'Short 1Bar Stage 3 B（精密）',
  'Short 1Bar Stage 3 B (Precision)',
  'フレーズ 11〜16（全12キー・バトル / 精密）',
  'Phrases 11–16 (all 12 keys, battle / precision)',
  100, 5, 4, 4, 25, 4,
  0, 600, 100,
  1,
  0, 0, 0, 0,
  0, 0, 0, 2,
  'blue_club', true,
  'chord_precision',
  false, true, true,
  1, false
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-b-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-b-precision'),
  0,
  'B（精密）',
  'B (Precision)',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-b-precision.musicxml?v=202608011800',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st3-b.mp3?v=202608011800',
  60, 60, 0, 5
)
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-b-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-lesson-st3'),
  NULL,
  23,
  '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, false, NULL,
  false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'm251-s1-st3-b-precision'),
  false, false,
  'B（精密）',
  'B (Precision)',
  false
)
ON CONFLICT (id) DO UPDATE SET
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

COMMIT;
