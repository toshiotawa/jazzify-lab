-- 目的別コース: Bluesy Licks（中級）
-- 11 フレーズ ×（Slow + 等速）= 11 クエスト、chord_osmd
BEGIN;

INSERT INTO public.courses (
  id, title, title_en, description, description_en,
  premium_only, order_index, audience, is_tutorial, is_visible,
  difficulty_tier, is_developer_only, is_main_course
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-bluesy-licks'),
  'Bluesy Licks',
  'Bluesy Licks',
  'F ブルースの定番リックを、スロー版と等倍版で耳コピバトル（OSMD）練習します。',
  'Practice classic F blues licks in slow and full tempo with OSMD ear-copy battles.',
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
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-bluesy-licks'),
  'フレーズ 1',
  'Phrase 1',
  'Slow BPM 120 → 等速 BPM 240・8小節×4ループの OSMD 耳コピバトル。',
  'OSMD ear-copy battle: slow 120 BPM → full 240 BPM, 8 bars × 4 loops.',
  true,
  0, 1, 'F Major', 'F Major',
  '[]'::jsonb,
  '敵HPを0にしてください。',
  'Reduce the enemy HP to 0.'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle, osmd_targets_from_score
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-1-slow'),
  'bl-stage-1-slow',
  'フレーズ 1（Slow）',
  'Phrase 1 (Slow)',
  'BPM 120・F メジャー・OSMD リズムバトル。',
  '120 BPM F major OSMD rhythm battle.',
  120, -1, 4, 4, 8, 4,
  0, 600,
  100, 76,
  1, 12, 21, 35,
  12, 30, 0, 2,
  'blue_club', true, 'chord_osmd', false, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  bpm = EXCLUDED.bpm,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  updated_at = now();

DELETE FROM public.ear_training_phrases WHERE stage_id = 
uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-1-slow');

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-1-slow-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-1-slow'),
  0,
  'フレーズ 1（Slow）',
  'Phrase 1 (Slow)',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-01-240_loop4_ci.musicxml',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-01-120_slow_loop4_ci.mp3',
  66, 66, 0, -1
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-1-slow-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-1'),
  NULL,
  0, '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL, false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-1-slow'),
  false, false,
  'Slow',
  'Slow',
  true
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required,
  order_index = EXCLUDED.order_index;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle, osmd_targets_from_score
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-1-normal'),
  'bl-stage-1-normal',
  'フレーズ 1',
  'Phrase 1',
  'BPM 240・F メジャー・OSMD リズムバトル。',
  '240 BPM F major OSMD rhythm battle.',
  240, -1, 4, 4, 8, 4,
  0, 600,
  100, 76,
  1, 12, 21, 35,
  12, 30, 0, 2,
  'blue_club', true, 'chord_osmd', false, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  bpm = EXCLUDED.bpm,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  updated_at = now();

DELETE FROM public.ear_training_phrases WHERE stage_id = 
uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-1-normal');

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-1-normal-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-1-normal'),
  0,
  'フレーズ 1',
  'Phrase 1',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-01-240_loop4_ci.musicxml',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-01-240_loop4_ci.mp3',
  33, 33, 0, -1
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-1-normal-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-1'),
  NULL,
  1, '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL, false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-1-normal'),
  false, false,
  '等速',
  'Full tempo',
  false
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required,
  order_index = EXCLUDED.order_index;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-bluesy-licks'),
  'フレーズ 2',
  'Phrase 2',
  'Slow BPM 80 → 等速 BPM 160・8小節×4ループの OSMD 耳コピバトル。',
  'OSMD ear-copy battle: slow 80 BPM → full 160 BPM, 8 bars × 4 loops.',
  true,
  1, 1, 'F Major', 'F Major',
  '[]'::jsonb,
  '敵HPを0にしてください。',
  'Reduce the enemy HP to 0.'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle, osmd_targets_from_score
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-2-slow'),
  'bl-stage-2-slow',
  'フレーズ 2（Slow）',
  'Phrase 2 (Slow)',
  'BPM 80・F メジャー・OSMD リズムバトル。',
  '80 BPM F major OSMD rhythm battle.',
  80, -1, 4, 4, 8, 4,
  0, 600,
  100, 103,
  1, 12, 21, 35,
  12, 30, 0, 2,
  'blue_club', true, 'chord_osmd', false, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  bpm = EXCLUDED.bpm,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  updated_at = now();

DELETE FROM public.ear_training_phrases WHERE stage_id = 
uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-2-slow');

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-2-slow-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-2-slow'),
  0,
  'フレーズ 2（Slow）',
  'Phrase 2 (Slow)',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-02-160_loop4_ci.musicxml',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-02-80_slow_loop4_ci.mp3',
  99, 99, 0, -1
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-2-slow-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-2'),
  NULL,
  0, '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL, false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-2-slow'),
  false, false,
  'Slow',
  'Slow',
  true
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required,
  order_index = EXCLUDED.order_index;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle, osmd_targets_from_score
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-2-normal'),
  'bl-stage-2-normal',
  'フレーズ 2',
  'Phrase 2',
  'BPM 160・F メジャー・OSMD リズムバトル。',
  '160 BPM F major OSMD rhythm battle.',
  160, -1, 4, 4, 8, 4,
  0, 600,
  100, 103,
  1, 12, 21, 35,
  12, 30, 0, 2,
  'blue_club', true, 'chord_osmd', false, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  bpm = EXCLUDED.bpm,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  updated_at = now();

DELETE FROM public.ear_training_phrases WHERE stage_id = 
uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-2-normal');

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-2-normal-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-2-normal'),
  0,
  'フレーズ 2',
  'Phrase 2',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-02-160_loop4_ci.musicxml',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-02-160_loop4_ci.mp3',
  49.5, 49.5, 0, -1
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-2-normal-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-2'),
  NULL,
  1, '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL, false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-2-normal'),
  false, false,
  '等速',
  'Full tempo',
  true
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required,
  order_index = EXCLUDED.order_index;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-bluesy-licks'),
  'フレーズ 3',
  'Phrase 3',
  'Slow BPM 80 → 等速 BPM 160・8小節×4ループの OSMD 耳コピバトル。',
  'OSMD ear-copy battle: slow 80 BPM → full 160 BPM, 8 bars × 4 loops.',
  true,
  2, 1, 'F Major', 'F Major',
  '[]'::jsonb,
  '敵HPを0にしてください。',
  'Reduce the enemy HP to 0.'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle, osmd_targets_from_score
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-3-slow'),
  'bl-stage-3-slow',
  'フレーズ 3（Slow）',
  'Phrase 3 (Slow)',
  'BPM 80・F メジャー・OSMD リズムバトル。',
  '80 BPM F major OSMD rhythm battle.',
  80, -1, 4, 4, 8, 4,
  0, 600,
  100, 86,
  1, 12, 21, 35,
  12, 30, 0, 2,
  'blue_club', true, 'chord_osmd', false, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  bpm = EXCLUDED.bpm,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  updated_at = now();

DELETE FROM public.ear_training_phrases WHERE stage_id = 
uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-3-slow');

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-3-slow-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-3-slow'),
  0,
  'フレーズ 3（Slow）',
  'Phrase 3 (Slow)',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-03-160_loop4_ci.musicxml',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-03-80_slow_loop4_ci.mp3',
  99, 99, 0, -1
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-3-slow-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-3'),
  NULL,
  0, '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL, false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-3-slow'),
  false, false,
  'Slow',
  'Slow',
  true
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required,
  order_index = EXCLUDED.order_index;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle, osmd_targets_from_score
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-3-normal'),
  'bl-stage-3-normal',
  'フレーズ 3',
  'Phrase 3',
  'BPM 160・F メジャー・OSMD リズムバトル。',
  '160 BPM F major OSMD rhythm battle.',
  160, -1, 4, 4, 8, 4,
  0, 600,
  100, 86,
  1, 12, 21, 35,
  12, 30, 0, 2,
  'blue_club', true, 'chord_osmd', false, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  bpm = EXCLUDED.bpm,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  updated_at = now();

DELETE FROM public.ear_training_phrases WHERE stage_id = 
uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-3-normal');

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-3-normal-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-3-normal'),
  0,
  'フレーズ 3',
  'Phrase 3',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-03-160_loop4_ci.musicxml',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-03-160_loop4_ci.mp3',
  49.5, 49.5, 0, -1
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-3-normal-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-3'),
  NULL,
  1, '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL, false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-3-normal'),
  false, false,
  '等速',
  'Full tempo',
  true
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required,
  order_index = EXCLUDED.order_index;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-bluesy-licks'),
  'フレーズ 4',
  'Phrase 4',
  'Slow BPM 100 → 等速 BPM 200・8小節×4ループの OSMD 耳コピバトル。',
  'OSMD ear-copy battle: slow 100 BPM → full 200 BPM, 8 bars × 4 loops.',
  true,
  3, 1, 'F Major', 'F Major',
  '[]'::jsonb,
  '敵HPを0にしてください。',
  'Reduce the enemy HP to 0.'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle, osmd_targets_from_score
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-4-slow'),
  'bl-stage-4-slow',
  'フレーズ 4（Slow）',
  'Phrase 4 (Slow)',
  'BPM 100・F メジャー・OSMD リズムバトル。',
  '100 BPM F major OSMD rhythm battle.',
  100, -1, 4, 4, 8, 4,
  0, 600,
  100, 77,
  1, 12, 21, 35,
  12, 30, 0, 2,
  'blue_club', true, 'chord_osmd', false, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  bpm = EXCLUDED.bpm,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  updated_at = now();

DELETE FROM public.ear_training_phrases WHERE stage_id = 
uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-4-slow');

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-4-slow-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-4-slow'),
  0,
  'フレーズ 4（Slow）',
  'Phrase 4 (Slow)',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-04-200_loop4_ci.musicxml',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-04-100_slow_loop4_ci.mp3',
  79.2, 79.2, 0, -1
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-4-slow-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-4'),
  NULL,
  0, '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL, false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-4-slow'),
  false, false,
  'Slow',
  'Slow',
  true
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required,
  order_index = EXCLUDED.order_index;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle, osmd_targets_from_score
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-4-normal'),
  'bl-stage-4-normal',
  'フレーズ 4',
  'Phrase 4',
  'BPM 200・F メジャー・OSMD リズムバトル。',
  '200 BPM F major OSMD rhythm battle.',
  200, -1, 4, 4, 8, 4,
  0, 600,
  100, 77,
  1, 12, 21, 35,
  12, 30, 0, 2,
  'blue_club', true, 'chord_osmd', false, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  bpm = EXCLUDED.bpm,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  updated_at = now();

DELETE FROM public.ear_training_phrases WHERE stage_id = 
uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-4-normal');

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-4-normal-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-4-normal'),
  0,
  'フレーズ 4',
  'Phrase 4',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-04-200_loop4_ci.musicxml',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-04-200_loop4_ci.mp3',
  39.6, 39.6, 0, -1
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-4-normal-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-4'),
  NULL,
  1, '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL, false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-4-normal'),
  false, false,
  '等速',
  'Full tempo',
  true
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required,
  order_index = EXCLUDED.order_index;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-bluesy-licks'),
  'フレーズ 5',
  'Phrase 5',
  'Slow BPM 120 → 等速 BPM 240・8小節×4ループの OSMD 耳コピバトル。',
  'OSMD ear-copy battle: slow 120 BPM → full 240 BPM, 8 bars × 4 loops.',
  true,
  4, 1, 'F Major', 'F Major',
  '[]'::jsonb,
  '敵HPを0にしてください。',
  'Reduce the enemy HP to 0.'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle, osmd_targets_from_score
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-5-slow'),
  'bl-stage-5-slow',
  'フレーズ 5（Slow）',
  'Phrase 5 (Slow)',
  'BPM 120・F メジャー・OSMD リズムバトル。',
  '120 BPM F major OSMD rhythm battle.',
  120, -1, 4, 4, 8, 4,
  0, 600,
  100, 82,
  1, 12, 21, 35,
  12, 30, 0, 2,
  'blue_club', true, 'chord_osmd', false, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  bpm = EXCLUDED.bpm,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  updated_at = now();

DELETE FROM public.ear_training_phrases WHERE stage_id = 
uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-5-slow');

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-5-slow-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-5-slow'),
  0,
  'フレーズ 5（Slow）',
  'Phrase 5 (Slow)',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-05-240_loop4_ci.musicxml',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-05-120_slow_loop4_ci.mp3',
  66, 66, 0, -1
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-5-slow-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-5'),
  NULL,
  0, '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL, false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-5-slow'),
  false, false,
  'Slow',
  'Slow',
  true
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required,
  order_index = EXCLUDED.order_index;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle, osmd_targets_from_score
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-5-normal'),
  'bl-stage-5-normal',
  'フレーズ 5',
  'Phrase 5',
  'BPM 240・F メジャー・OSMD リズムバトル。',
  '240 BPM F major OSMD rhythm battle.',
  240, -1, 4, 4, 8, 4,
  0, 600,
  100, 82,
  1, 12, 21, 35,
  12, 30, 0, 2,
  'blue_club', true, 'chord_osmd', false, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  bpm = EXCLUDED.bpm,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  updated_at = now();

DELETE FROM public.ear_training_phrases WHERE stage_id = 
uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-5-normal');

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-5-normal-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-5-normal'),
  0,
  'フレーズ 5',
  'Phrase 5',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-05-240_loop4_ci.musicxml',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-05-240_loop4_ci.mp3',
  33, 33, 0, -1
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-5-normal-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-5'),
  NULL,
  1, '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL, false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-5-normal'),
  false, false,
  '等速',
  'Full tempo',
  false
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required,
  order_index = EXCLUDED.order_index;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-bluesy-licks'),
  'フレーズ 6',
  'Phrase 6',
  'Slow BPM 80 → 等速 BPM 160・8小節×4ループの OSMD 耳コピバトル。',
  'OSMD ear-copy battle: slow 80 BPM → full 160 BPM, 8 bars × 4 loops.',
  true,
  5, 1, 'F Major', 'F Major',
  '[]'::jsonb,
  '敵HPを0にしてください。',
  'Reduce the enemy HP to 0.'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle, osmd_targets_from_score
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-6-slow'),
  'bl-stage-6-slow',
  'フレーズ 6（Slow）',
  'Phrase 6 (Slow)',
  'BPM 80・F メジャー・OSMD リズムバトル。',
  '80 BPM F major OSMD rhythm battle.',
  80, -1, 4, 4, 8, 4,
  0, 600,
  100, 91,
  1, 12, 21, 35,
  12, 30, 0, 2,
  'blue_club', true, 'chord_osmd', false, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  bpm = EXCLUDED.bpm,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  updated_at = now();

DELETE FROM public.ear_training_phrases WHERE stage_id = 
uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-6-slow');

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-6-slow-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-6-slow'),
  0,
  'フレーズ 6（Slow）',
  'Phrase 6 (Slow)',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-06-160_loop4_ci.musicxml',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-06-80_slow_loop4_ci.mp3',
  99, 99, 0, -1
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-6-slow-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-6'),
  NULL,
  0, '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL, false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-6-slow'),
  false, false,
  'Slow',
  'Slow',
  true
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required,
  order_index = EXCLUDED.order_index;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle, osmd_targets_from_score
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-6-normal'),
  'bl-stage-6-normal',
  'フレーズ 6',
  'Phrase 6',
  'BPM 160・F メジャー・OSMD リズムバトル。',
  '160 BPM F major OSMD rhythm battle.',
  160, -1, 4, 4, 8, 4,
  0, 600,
  100, 91,
  1, 12, 21, 35,
  12, 30, 0, 2,
  'blue_club', true, 'chord_osmd', false, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  bpm = EXCLUDED.bpm,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  updated_at = now();

DELETE FROM public.ear_training_phrases WHERE stage_id = 
uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-6-normal');

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-6-normal-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-6-normal'),
  0,
  'フレーズ 6',
  'Phrase 6',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-06-160_loop4_ci.musicxml',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-06-160_loop4_ci.mp3',
  49.5, 49.5, 0, -1
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-6-normal-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-6'),
  NULL,
  1, '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL, false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-6-normal'),
  false, false,
  '等速',
  'Full tempo',
  true
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required,
  order_index = EXCLUDED.order_index;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-bluesy-licks'),
  'フレーズ 7',
  'Phrase 7',
  'Slow BPM 120 → 等速 BPM 240・8小節×4ループの OSMD 耳コピバトル。',
  'OSMD ear-copy battle: slow 120 BPM → full 240 BPM, 8 bars × 4 loops.',
  true,
  6, 1, 'F Major', 'F Major',
  '[]'::jsonb,
  '敵HPを0にしてください。',
  'Reduce the enemy HP to 0.'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle, osmd_targets_from_score
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-7-slow'),
  'bl-stage-7-slow',
  'フレーズ 7（Slow）',
  'Phrase 7 (Slow)',
  'BPM 120・F メジャー・OSMD リズムバトル。',
  '120 BPM F major OSMD rhythm battle.',
  120, -1, 4, 4, 8, 4,
  0, 600,
  100, 84,
  1, 12, 21, 35,
  12, 30, 0, 2,
  'blue_club', true, 'chord_osmd', false, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  bpm = EXCLUDED.bpm,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  updated_at = now();

DELETE FROM public.ear_training_phrases WHERE stage_id = 
uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-7-slow');

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-7-slow-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-7-slow'),
  0,
  'フレーズ 7（Slow）',
  'Phrase 7 (Slow)',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-07-240_loop4_ci.musicxml',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-07-120_slow_loop4_ci.mp3',
  66, 66, 0, -1
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-7-slow-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-7'),
  NULL,
  0, '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL, false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-7-slow'),
  false, false,
  'Slow',
  'Slow',
  true
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required,
  order_index = EXCLUDED.order_index;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle, osmd_targets_from_score
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-7-normal'),
  'bl-stage-7-normal',
  'フレーズ 7',
  'Phrase 7',
  'BPM 240・F メジャー・OSMD リズムバトル。',
  '240 BPM F major OSMD rhythm battle.',
  240, -1, 4, 4, 8, 4,
  0, 600,
  100, 84,
  1, 12, 21, 35,
  12, 30, 0, 2,
  'blue_club', true, 'chord_osmd', false, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  bpm = EXCLUDED.bpm,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  updated_at = now();

DELETE FROM public.ear_training_phrases WHERE stage_id = 
uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-7-normal');

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-7-normal-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-7-normal'),
  0,
  'フレーズ 7',
  'Phrase 7',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-07-240_loop4_ci.musicxml',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-07-240_loop4_ci.mp3',
  33, 33, 0, -1
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-7-normal-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-7'),
  NULL,
  1, '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL, false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-7-normal'),
  false, false,
  '等速',
  'Full tempo',
  false
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required,
  order_index = EXCLUDED.order_index;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-bluesy-licks'),
  'フレーズ 8',
  'Phrase 8',
  'Slow BPM 150 → 等速 BPM 300・12小節×4ループの OSMD 耳コピバトル。',
  'OSMD ear-copy battle: slow 150 BPM → full 300 BPM, 12 bars × 4 loops.',
  true,
  7, 1, 'F Major', 'F Major',
  '[]'::jsonb,
  '敵HPを0にしてください。',
  'Reduce the enemy HP to 0.'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle, osmd_targets_from_score
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-8-slow'),
  'bl-stage-8-slow',
  'フレーズ 8（Slow）',
  'Phrase 8 (Slow)',
  'BPM 150・F メジャー・OSMD リズムバトル。',
  '150 BPM F major OSMD rhythm battle.',
  150, -1, 4, 4, 12, 4,
  0, 600,
  100, 109,
  1, 12, 21, 35,
  12, 30, 0, 2,
  'blue_club', true, 'chord_osmd', false, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  bpm = EXCLUDED.bpm,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  updated_at = now();

DELETE FROM public.ear_training_phrases WHERE stage_id = 
uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-8-slow');

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-8-slow-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-8-slow'),
  0,
  'フレーズ 8（Slow）',
  'Phrase 8 (Slow)',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-08-300_loop4_ci.musicxml',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-08-150_slow_loop4_ci.mp3',
  78.4, 78.4, 0, -1
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-8-slow-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-8'),
  NULL,
  0, '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL, false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-8-slow'),
  false, false,
  'Slow',
  'Slow',
  true
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required,
  order_index = EXCLUDED.order_index;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle, osmd_targets_from_score
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-8-normal'),
  'bl-stage-8-normal',
  'フレーズ 8',
  'Phrase 8',
  'BPM 300・F メジャー・OSMD リズムバトル。',
  '300 BPM F major OSMD rhythm battle.',
  300, -1, 4, 4, 12, 4,
  0, 600,
  100, 109,
  1, 12, 21, 35,
  12, 30, 0, 2,
  'blue_club', true, 'chord_osmd', false, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  bpm = EXCLUDED.bpm,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  updated_at = now();

DELETE FROM public.ear_training_phrases WHERE stage_id = 
uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-8-normal');

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-8-normal-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-8-normal'),
  0,
  'フレーズ 8',
  'Phrase 8',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-08-300_loop4_ci.musicxml',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-08-300_loop4_ci.mp3',
  39.2, 39.2, 0, -1
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-8-normal-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-8'),
  NULL,
  1, '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL, false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-8-normal'),
  false, false,
  '等速',
  'Full tempo',
  false
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required,
  order_index = EXCLUDED.order_index;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-bluesy-licks'),
  'フレーズ 9',
  'Phrase 9',
  'Slow BPM 120 → 等速 BPM 240・8小節×4ループの OSMD 耳コピバトル。',
  'OSMD ear-copy battle: slow 120 BPM → full 240 BPM, 8 bars × 4 loops.',
  true,
  8, 1, 'F Major', 'F Major',
  '[]'::jsonb,
  '敵HPを0にしてください。',
  'Reduce the enemy HP to 0.'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle, osmd_targets_from_score
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-9-slow'),
  'bl-stage-9-slow',
  'フレーズ 9（Slow）',
  'Phrase 9 (Slow)',
  'BPM 120・F メジャー・OSMD リズムバトル。',
  '120 BPM F major OSMD rhythm battle.',
  120, -1, 4, 4, 8, 4,
  0, 600,
  100, 85,
  1, 12, 21, 35,
  12, 30, 0, 2,
  'blue_club', true, 'chord_osmd', false, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  bpm = EXCLUDED.bpm,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  updated_at = now();

DELETE FROM public.ear_training_phrases WHERE stage_id = 
uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-9-slow');

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-9-slow-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-9-slow'),
  0,
  'フレーズ 9（Slow）',
  'Phrase 9 (Slow)',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-09-240_loop4_ci.musicxml',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-09-120_slow_loop4_ci.mp3',
  66, 66, 0, -1
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-9-slow-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-9'),
  NULL,
  0, '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL, false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-9-slow'),
  false, false,
  'Slow',
  'Slow',
  true
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required,
  order_index = EXCLUDED.order_index;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle, osmd_targets_from_score
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-9-normal'),
  'bl-stage-9-normal',
  'フレーズ 9',
  'Phrase 9',
  'BPM 240・F メジャー・OSMD リズムバトル。',
  '240 BPM F major OSMD rhythm battle.',
  240, -1, 4, 4, 8, 4,
  0, 600,
  100, 85,
  1, 12, 21, 35,
  12, 30, 0, 2,
  'blue_club', true, 'chord_osmd', false, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  bpm = EXCLUDED.bpm,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  updated_at = now();

DELETE FROM public.ear_training_phrases WHERE stage_id = 
uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-9-normal');

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-9-normal-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-9-normal'),
  0,
  'フレーズ 9',
  'Phrase 9',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-09-240_loop4_ci.musicxml',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-09-240_loop4_ci.mp3',
  33, 33, 0, -1
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-9-normal-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-9'),
  NULL,
  1, '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL, false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-9-normal'),
  false, false,
  '等速',
  'Full tempo',
  false
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required,
  order_index = EXCLUDED.order_index;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-bluesy-licks'),
  'フレーズ 10',
  'Phrase 10',
  'Slow BPM 80 → 等速 BPM 160・8小節×4ループの OSMD 耳コピバトル。',
  'OSMD ear-copy battle: slow 80 BPM → full 160 BPM, 8 bars × 4 loops.',
  true,
  9, 1, 'F Major', 'F Major',
  '[]'::jsonb,
  '敵HPを0にしてください。',
  'Reduce the enemy HP to 0.'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle, osmd_targets_from_score
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-10-slow'),
  'bl-stage-10-slow',
  'フレーズ 10（Slow）',
  'Phrase 10 (Slow)',
  'BPM 80・F メジャー・OSMD リズムバトル。',
  '80 BPM F major OSMD rhythm battle.',
  80, -1, 4, 4, 8, 4,
  0, 600,
  100, 115,
  1, 12, 21, 35,
  12, 30, 0, 2,
  'blue_club', true, 'chord_osmd', false, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  bpm = EXCLUDED.bpm,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  updated_at = now();

DELETE FROM public.ear_training_phrases WHERE stage_id = 
uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-10-slow');

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-10-slow-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-10-slow'),
  0,
  'フレーズ 10（Slow）',
  'Phrase 10 (Slow)',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-10-160_loop4_ci.musicxml',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-10-80_slow_loop4_ci.mp3',
  99, 99, 0, -1
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-10-slow-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-10'),
  NULL,
  0, '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL, false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-10-slow'),
  false, false,
  'Slow',
  'Slow',
  true
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required,
  order_index = EXCLUDED.order_index;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle, osmd_targets_from_score
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-10-normal'),
  'bl-stage-10-normal',
  'フレーズ 10',
  'Phrase 10',
  'BPM 160・F メジャー・OSMD リズムバトル。',
  '160 BPM F major OSMD rhythm battle.',
  160, -1, 4, 4, 8, 4,
  0, 600,
  100, 115,
  1, 12, 21, 35,
  12, 30, 0, 2,
  'blue_club', true, 'chord_osmd', false, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  bpm = EXCLUDED.bpm,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  updated_at = now();

DELETE FROM public.ear_training_phrases WHERE stage_id = 
uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-10-normal');

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-10-normal-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-10-normal'),
  0,
  'フレーズ 10',
  'Phrase 10',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-10-160_loop4_ci.musicxml',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-10-160_loop4_ci.mp3',
  49.5, 49.5, 0, -1
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-10-normal-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-10'),
  NULL,
  1, '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL, false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-10-normal'),
  false, false,
  '等速',
  'Full tempo',
  true
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required,
  order_index = EXCLUDED.order_index;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-bluesy-licks'),
  'フレーズ 11',
  'Phrase 11',
  'Slow BPM 150 → 等速 BPM 300・8小節×4ループの OSMD 耳コピバトル。',
  'OSMD ear-copy battle: slow 150 BPM → full 300 BPM, 8 bars × 4 loops.',
  true,
  10, 1, 'F Major', 'F Major',
  '[]'::jsonb,
  '敵HPを0にしてください。',
  'Reduce the enemy HP to 0.'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  updated_at = now();

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle, osmd_targets_from_score
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-11-slow'),
  'bl-stage-11-slow',
  'フレーズ 11（Slow）',
  'Phrase 11 (Slow)',
  'BPM 150・F メジャー・OSMD リズムバトル。',
  '150 BPM F major OSMD rhythm battle.',
  150, -1, 4, 4, 8, 4,
  0, 600,
  100, 92,
  1, 12, 21, 35,
  12, 30, 0, 2,
  'blue_club', true, 'chord_osmd', false, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  bpm = EXCLUDED.bpm,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  updated_at = now();

DELETE FROM public.ear_training_phrases WHERE stage_id = 
uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-11-slow');

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-11-slow-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-11-slow'),
  0,
  'フレーズ 11（Slow）',
  'Phrase 11 (Slow)',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-11-300_loop4_ci.musicxml',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-11-150_slow_loop4_ci.mp3',
  52.800000000000004, 52.800000000000004, 0, -1
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-11-slow-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-11'),
  NULL,
  0, '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL, false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-11-slow'),
  false, false,
  'Slow',
  'Slow',
  true
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required,
  order_index = EXCLUDED.order_index;

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode, show_keyboard_hints_in_battle, osmd_targets_from_score
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-11-normal'),
  'bl-stage-11-normal',
  'フレーズ 11',
  'Phrase 11',
  'BPM 300・F メジャー・OSMD リズムバトル。',
  '300 BPM F major OSMD rhythm battle.',
  300, -1, 4, 4, 8, 4,
  0, 600,
  100, 92,
  1, 12, 21, 35,
  12, 30, 0, 2,
  'blue_club', true, 'chord_osmd', false, true
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  bpm = EXCLUDED.bpm,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  updated_at = now();

DELETE FROM public.ear_training_phrases WHERE stage_id = 
uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-11-normal');

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-11-normal-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-11-normal'),
  0,
  'フレーズ 11',
  'Phrase 11',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-11-300_loop4_ci.musicxml',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-11-300_loop4_ci.mp3',
  26.400000000000002, 26.400000000000002, 0, -1
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-11-normal-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-11'),
  NULL,
  1, '{"count":1,"rank":"B"}'::jsonb,
  false, NULL, false, NULL, false, NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-stage-11-normal'),
  false, false,
  '等速',
  'Full tempo',
  false
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required,
  order_index = EXCLUDED.order_index;

COMMIT;
