-- II-V-I lesson course chunk 81-120 (generator: generate-ii-v-i-migration.mjs)
BEGIN;

-- st-e-1-5 (lesson #81)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-e-1-5'),
  NULL,
  'II-V-I フレーズ 1-5（E）',
  'II-V-I phrases 1-5 (E)',
  'フレーズ 1-5（E調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 1-5 in E. Play along with the backing track (160 BPM, five phrases × two passes each).',
  226,
  512,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  512,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-1-5-e.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-1-5-e.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-e-1-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 1-5（E）',
  'II-V-I phrases 1-5 (E)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  81,
  9,
  'キー: E',
  'Key: E',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-e-1-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-e-1-5'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-e-1-5'),
  'II-V-I フレーズ 1-5（E）'
);

-- st-e-6-10 (lesson #82)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-e-6-10'),
  NULL,
  'II-V-I フレーズ 6-10（E）',
  'II-V-I phrases 6-10 (E)',
  'フレーズ 6-10（E調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 6-10 in E. Play along with the backing track (160 BPM, five phrases × two passes each).',
  205,
  448,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  448,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-6-10-e.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-6-10-e.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-e-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 6-10（E）',
  'II-V-I phrases 6-10 (E)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  82,
  9,
  'キー: E',
  'Key: E',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-e-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-e-6-10'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-e-6-10'),
  'II-V-I フレーズ 6-10（E）'
);

-- st-e-11-15 (lesson #83)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-e-11-15'),
  NULL,
  'II-V-I フレーズ 11-15（E）',
  'II-V-I phrases 11-15 (E)',
  'フレーズ 11-15（E調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 11-15 in E. Play along with the backing track (160 BPM, five phrases × two passes each).',
  223,
  504,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  504,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-11-15-e.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-11-15-e.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-e-11-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 11-15（E）',
  'II-V-I phrases 11-15 (E)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  83,
  9,
  'キー: E',
  'Key: E',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-e-11-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-e-11-15'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-e-11-15'),
  'II-V-I フレーズ 11-15（E）'
);

-- st-e-16-20 (lesson #84)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-e-16-20'),
  NULL,
  'II-V-I フレーズ 16-20（E）',
  'II-V-I phrases 16-20 (E)',
  'フレーズ 16-20（E調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 16-20 in E. Play along with the backing track (160 BPM, five phrases × two passes each).',
  227,
  516,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  516,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-16-20-e.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-16-20-e.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-e-16-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 16-20（E）',
  'II-V-I phrases 16-20 (E)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  84,
  9,
  'キー: E',
  'Key: E',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-e-16-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-e-16-20'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-e-16-20'),
  'II-V-I フレーズ 16-20（E）'
);

-- st-e-21-25 (lesson #85)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-e-21-25'),
  NULL,
  'II-V-I フレーズ 21-25（E）',
  'II-V-I phrases 21-25 (E)',
  'フレーズ 21-25（E調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 21-25 in E. Play along with the backing track (160 BPM, five phrases × two passes each).',
  217,
  484,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  484,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-21-25-e.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-21-25-e.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-e-21-25'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 21-25（E）',
  'II-V-I phrases 21-25 (E)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  85,
  9,
  'キー: E',
  'Key: E',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-e-21-25'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-e-21-25'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-e-21-25'),
  'II-V-I フレーズ 21-25（E）'
);

-- st-e-26-30 (lesson #86)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-e-26-30'),
  NULL,
  'II-V-I フレーズ 26-30（E）',
  'II-V-I phrases 26-30 (E)',
  'フレーズ 26-30（E調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 26-30 in E. Play along with the backing track (160 BPM, five phrases × two passes each).',
  201,
  436,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  436,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-26-30-e.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-26-30-e.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-e-26-30'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 26-30（E）',
  'II-V-I phrases 26-30 (E)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  86,
  9,
  'キー: E',
  'Key: E',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-e-26-30'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-e-26-30'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-e-26-30'),
  'II-V-I フレーズ 26-30（E）'
);

-- st-e-31-35 (lesson #87)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-e-31-35'),
  NULL,
  'II-V-I フレーズ 31-35（E）',
  'II-V-I phrases 31-35 (E)',
  'フレーズ 31-35（E調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 31-35 in E. Play along with the backing track (160 BPM, five phrases × two passes each).',
  193,
  412,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  412,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-31-35-e.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-31-35-e.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-e-31-35'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 31-35（E）',
  'II-V-I phrases 31-35 (E)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  87,
  9,
  'キー: E',
  'Key: E',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-e-31-35'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-e-31-35'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-e-31-35'),
  'II-V-I フレーズ 31-35（E）'
);

-- st-e-36-40 (lesson #88)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-e-36-40'),
  NULL,
  'II-V-I フレーズ 36-40（E）',
  'II-V-I phrases 36-40 (E)',
  'フレーズ 36-40（E調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 36-40 in E. Play along with the backing track (160 BPM, five phrases × two passes each).',
  233,
  532,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  532,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-36-40-e.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-36-40-e.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-e-36-40'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 36-40（E）',
  'II-V-I phrases 36-40 (E)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  88,
  9,
  'キー: E',
  'Key: E',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-e-36-40'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-e-36-40'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-e-36-40'),
  'II-V-I フレーズ 36-40（E）'
);

-- st-e-41-45 (lesson #89)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-e-41-45'),
  NULL,
  'II-V-I フレーズ 41-45（E）',
  'II-V-I phrases 41-45 (E)',
  'フレーズ 41-45（E調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 41-45 in E. Play along with the backing track (160 BPM, five phrases × two passes each).',
  237,
  544,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  544,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-41-45-e.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-41-45-e.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-e-41-45'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 41-45（E）',
  'II-V-I phrases 41-45 (E)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  89,
  9,
  'キー: E',
  'Key: E',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-e-41-45'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-e-41-45'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-e-41-45'),
  'II-V-I フレーズ 41-45（E）'
);

-- st-e-46-50 (lesson #90)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-e-46-50'),
  NULL,
  'II-V-I フレーズ 46-50（E）',
  'II-V-I phrases 46-50 (E)',
  'フレーズ 46-50（E調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 46-50 in E. Play along with the backing track (160 BPM, five phrases × two passes each).',
  231,
  528,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  528,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-46-50-e.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-46-50-e.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-e-46-50'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 46-50（E）',
  'II-V-I phrases 46-50 (E)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  90,
  9,
  'キー: E',
  'Key: E',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-e-46-50'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-e-46-50'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-e-46-50'),
  'II-V-I フレーズ 46-50（E）'
);

-- st-a-1-5 (lesson #91)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-a-1-5'),
  NULL,
  'II-V-I フレーズ 1-5（A）',
  'II-V-I phrases 1-5 (A)',
  'フレーズ 1-5（A調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 1-5 in A. Play along with the backing track (160 BPM, five phrases × two passes each).',
  226,
  512,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  512,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-1-5-a.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-1-5-a.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-a-1-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 1-5（A）',
  'II-V-I phrases 1-5 (A)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  91,
  10,
  'キー: A',
  'Key: A',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-a-1-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-a-1-5'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-a-1-5'),
  'II-V-I フレーズ 1-5（A）'
);

-- st-a-6-10 (lesson #92)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-a-6-10'),
  NULL,
  'II-V-I フレーズ 6-10（A）',
  'II-V-I phrases 6-10 (A)',
  'フレーズ 6-10（A調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 6-10 in A. Play along with the backing track (160 BPM, five phrases × two passes each).',
  205,
  448,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  448,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-6-10-a.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-6-10-a.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-a-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 6-10（A）',
  'II-V-I phrases 6-10 (A)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  92,
  10,
  'キー: A',
  'Key: A',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-a-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-a-6-10'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-a-6-10'),
  'II-V-I フレーズ 6-10（A）'
);

-- st-a-11-15 (lesson #93)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-a-11-15'),
  NULL,
  'II-V-I フレーズ 11-15（A）',
  'II-V-I phrases 11-15 (A)',
  'フレーズ 11-15（A調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 11-15 in A. Play along with the backing track (160 BPM, five phrases × two passes each).',
  223,
  504,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  504,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-11-15-a.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-11-15-a.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-a-11-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 11-15（A）',
  'II-V-I phrases 11-15 (A)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  93,
  10,
  'キー: A',
  'Key: A',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-a-11-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-a-11-15'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-a-11-15'),
  'II-V-I フレーズ 11-15（A）'
);

-- st-a-16-20 (lesson #94)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-a-16-20'),
  NULL,
  'II-V-I フレーズ 16-20（A）',
  'II-V-I phrases 16-20 (A)',
  'フレーズ 16-20（A調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 16-20 in A. Play along with the backing track (160 BPM, five phrases × two passes each).',
  227,
  516,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  516,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-16-20-a.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-16-20-a.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-a-16-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 16-20（A）',
  'II-V-I phrases 16-20 (A)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  94,
  10,
  'キー: A',
  'Key: A',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-a-16-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-a-16-20'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-a-16-20'),
  'II-V-I フレーズ 16-20（A）'
);

-- st-a-21-25 (lesson #95)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-a-21-25'),
  NULL,
  'II-V-I フレーズ 21-25（A）',
  'II-V-I phrases 21-25 (A)',
  'フレーズ 21-25（A調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 21-25 in A. Play along with the backing track (160 BPM, five phrases × two passes each).',
  217,
  484,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  484,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-21-25-a.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-21-25-a.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-a-21-25'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 21-25（A）',
  'II-V-I phrases 21-25 (A)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  95,
  10,
  'キー: A',
  'Key: A',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-a-21-25'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-a-21-25'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-a-21-25'),
  'II-V-I フレーズ 21-25（A）'
);

-- st-a-26-30 (lesson #96)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-a-26-30'),
  NULL,
  'II-V-I フレーズ 26-30（A）',
  'II-V-I phrases 26-30 (A)',
  'フレーズ 26-30（A調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 26-30 in A. Play along with the backing track (160 BPM, five phrases × two passes each).',
  201,
  436,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  436,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-26-30-a.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-26-30-a.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-a-26-30'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 26-30（A）',
  'II-V-I phrases 26-30 (A)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  96,
  10,
  'キー: A',
  'Key: A',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-a-26-30'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-a-26-30'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-a-26-30'),
  'II-V-I フレーズ 26-30（A）'
);

-- st-a-31-35 (lesson #97)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-a-31-35'),
  NULL,
  'II-V-I フレーズ 31-35（A）',
  'II-V-I phrases 31-35 (A)',
  'フレーズ 31-35（A調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 31-35 in A. Play along with the backing track (160 BPM, five phrases × two passes each).',
  193,
  412,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  412,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-31-35-a.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-31-35-a.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-a-31-35'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 31-35（A）',
  'II-V-I phrases 31-35 (A)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  97,
  10,
  'キー: A',
  'Key: A',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-a-31-35'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-a-31-35'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-a-31-35'),
  'II-V-I フレーズ 31-35（A）'
);

-- st-a-36-40 (lesson #98)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-a-36-40'),
  NULL,
  'II-V-I フレーズ 36-40（A）',
  'II-V-I phrases 36-40 (A)',
  'フレーズ 36-40（A調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 36-40 in A. Play along with the backing track (160 BPM, five phrases × two passes each).',
  233,
  532,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  532,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-36-40-a.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-36-40-a.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-a-36-40'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 36-40（A）',
  'II-V-I phrases 36-40 (A)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  98,
  10,
  'キー: A',
  'Key: A',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-a-36-40'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-a-36-40'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-a-36-40'),
  'II-V-I フレーズ 36-40（A）'
);

-- st-a-41-45 (lesson #99)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-a-41-45'),
  NULL,
  'II-V-I フレーズ 41-45（A）',
  'II-V-I phrases 41-45 (A)',
  'フレーズ 41-45（A調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 41-45 in A. Play along with the backing track (160 BPM, five phrases × two passes each).',
  237,
  544,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  544,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-41-45-a.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-41-45-a.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-a-41-45'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 41-45（A）',
  'II-V-I phrases 41-45 (A)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  99,
  10,
  'キー: A',
  'Key: A',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-a-41-45'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-a-41-45'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-a-41-45'),
  'II-V-I フレーズ 41-45（A）'
);

-- st-a-46-50 (lesson #100)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-a-46-50'),
  NULL,
  'II-V-I フレーズ 46-50（A）',
  'II-V-I phrases 46-50 (A)',
  'フレーズ 46-50（A調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 46-50 in A. Play along with the backing track (160 BPM, five phrases × two passes each).',
  231,
  528,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  528,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-46-50-a.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-46-50-a.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-a-46-50'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 46-50（A）',
  'II-V-I phrases 46-50 (A)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  100,
  10,
  'キー: A',
  'Key: A',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-a-46-50'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-a-46-50'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-a-46-50'),
  'II-V-I フレーズ 46-50（A）'
);

-- st-d-1-5 (lesson #101)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-d-1-5'),
  NULL,
  'II-V-I フレーズ 1-5（D）',
  'II-V-I phrases 1-5 (D)',
  'フレーズ 1-5（D調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 1-5 in D. Play along with the backing track (160 BPM, five phrases × two passes each).',
  226,
  512,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  512,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-1-5-d.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-1-5-d.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-d-1-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 1-5（D）',
  'II-V-I phrases 1-5 (D)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  101,
  11,
  'キー: D',
  'Key: D',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-d-1-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-d-1-5'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-d-1-5'),
  'II-V-I フレーズ 1-5（D）'
);

-- st-d-6-10 (lesson #102)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-d-6-10'),
  NULL,
  'II-V-I フレーズ 6-10（D）',
  'II-V-I phrases 6-10 (D)',
  'フレーズ 6-10（D調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 6-10 in D. Play along with the backing track (160 BPM, five phrases × two passes each).',
  205,
  448,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  448,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-6-10-d.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-6-10-d.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-d-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 6-10（D）',
  'II-V-I phrases 6-10 (D)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  102,
  11,
  'キー: D',
  'Key: D',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-d-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-d-6-10'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-d-6-10'),
  'II-V-I フレーズ 6-10（D）'
);

-- st-d-11-15 (lesson #103)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-d-11-15'),
  NULL,
  'II-V-I フレーズ 11-15（D）',
  'II-V-I phrases 11-15 (D)',
  'フレーズ 11-15（D調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 11-15 in D. Play along with the backing track (160 BPM, five phrases × two passes each).',
  223,
  504,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  504,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-11-15-d.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-11-15-d.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-d-11-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 11-15（D）',
  'II-V-I phrases 11-15 (D)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  103,
  11,
  'キー: D',
  'Key: D',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-d-11-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-d-11-15'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-d-11-15'),
  'II-V-I フレーズ 11-15（D）'
);

-- st-d-16-20 (lesson #104)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-d-16-20'),
  NULL,
  'II-V-I フレーズ 16-20（D）',
  'II-V-I phrases 16-20 (D)',
  'フレーズ 16-20（D調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 16-20 in D. Play along with the backing track (160 BPM, five phrases × two passes each).',
  227,
  516,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  516,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-16-20-d.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-16-20-d.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-d-16-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 16-20（D）',
  'II-V-I phrases 16-20 (D)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  104,
  11,
  'キー: D',
  'Key: D',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-d-16-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-d-16-20'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-d-16-20'),
  'II-V-I フレーズ 16-20（D）'
);

-- st-d-21-25 (lesson #105)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-d-21-25'),
  NULL,
  'II-V-I フレーズ 21-25（D）',
  'II-V-I phrases 21-25 (D)',
  'フレーズ 21-25（D調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 21-25 in D. Play along with the backing track (160 BPM, five phrases × two passes each).',
  217,
  484,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  484,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-21-25-d.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-21-25-d.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-d-21-25'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 21-25（D）',
  'II-V-I phrases 21-25 (D)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  105,
  11,
  'キー: D',
  'Key: D',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-d-21-25'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-d-21-25'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-d-21-25'),
  'II-V-I フレーズ 21-25（D）'
);

-- st-d-26-30 (lesson #106)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-d-26-30'),
  NULL,
  'II-V-I フレーズ 26-30（D）',
  'II-V-I phrases 26-30 (D)',
  'フレーズ 26-30（D調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 26-30 in D. Play along with the backing track (160 BPM, five phrases × two passes each).',
  201,
  436,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  436,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-26-30-d.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-26-30-d.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-d-26-30'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 26-30（D）',
  'II-V-I phrases 26-30 (D)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  106,
  11,
  'キー: D',
  'Key: D',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-d-26-30'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-d-26-30'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-d-26-30'),
  'II-V-I フレーズ 26-30（D）'
);

-- st-d-31-35 (lesson #107)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-d-31-35'),
  NULL,
  'II-V-I フレーズ 31-35（D）',
  'II-V-I phrases 31-35 (D)',
  'フレーズ 31-35（D調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 31-35 in D. Play along with the backing track (160 BPM, five phrases × two passes each).',
  193,
  412,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  412,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-31-35-d.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-31-35-d.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-d-31-35'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 31-35（D）',
  'II-V-I phrases 31-35 (D)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  107,
  11,
  'キー: D',
  'Key: D',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-d-31-35'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-d-31-35'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-d-31-35'),
  'II-V-I フレーズ 31-35（D）'
);

-- st-d-36-40 (lesson #108)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-d-36-40'),
  NULL,
  'II-V-I フレーズ 36-40（D）',
  'II-V-I phrases 36-40 (D)',
  'フレーズ 36-40（D調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 36-40 in D. Play along with the backing track (160 BPM, five phrases × two passes each).',
  233,
  532,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  532,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-36-40-d.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-36-40-d.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-d-36-40'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 36-40（D）',
  'II-V-I phrases 36-40 (D)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  108,
  11,
  'キー: D',
  'Key: D',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-d-36-40'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-d-36-40'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-d-36-40'),
  'II-V-I フレーズ 36-40（D）'
);

-- st-d-41-45 (lesson #109)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-d-41-45'),
  NULL,
  'II-V-I フレーズ 41-45（D）',
  'II-V-I phrases 41-45 (D)',
  'フレーズ 41-45（D調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 41-45 in D. Play along with the backing track (160 BPM, five phrases × two passes each).',
  237,
  544,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  544,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-41-45-d.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-41-45-d.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-d-41-45'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 41-45（D）',
  'II-V-I phrases 41-45 (D)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  109,
  11,
  'キー: D',
  'Key: D',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-d-41-45'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-d-41-45'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-d-41-45'),
  'II-V-I フレーズ 41-45（D）'
);

-- st-d-46-50 (lesson #110)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-d-46-50'),
  NULL,
  'II-V-I フレーズ 46-50（D）',
  'II-V-I phrases 46-50 (D)',
  'フレーズ 46-50（D調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 46-50 in D. Play along with the backing track (160 BPM, five phrases × two passes each).',
  231,
  528,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  528,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-46-50-d.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-46-50-d.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-d-46-50'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 46-50（D）',
  'II-V-I phrases 46-50 (D)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  110,
  11,
  'キー: D',
  'Key: D',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-d-46-50'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-d-46-50'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-d-46-50'),
  'II-V-I フレーズ 46-50（D）'
);

-- st-g-1-5 (lesson #111)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-g-1-5'),
  NULL,
  'II-V-I フレーズ 1-5（G）',
  'II-V-I phrases 1-5 (G)',
  'フレーズ 1-5（G調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 1-5 in G. Play along with the backing track (160 BPM, five phrases × two passes each).',
  226,
  512,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  512,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-1-5-g.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-1-5-g.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-g-1-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 1-5（G）',
  'II-V-I phrases 1-5 (G)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  111,
  12,
  'キー: G',
  'Key: G',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-g-1-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-g-1-5'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-g-1-5'),
  'II-V-I フレーズ 1-5（G）'
);

-- st-g-6-10 (lesson #112)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-g-6-10'),
  NULL,
  'II-V-I フレーズ 6-10（G）',
  'II-V-I phrases 6-10 (G)',
  'フレーズ 6-10（G調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 6-10 in G. Play along with the backing track (160 BPM, five phrases × two passes each).',
  205,
  448,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  448,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-6-10-g.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-6-10-g.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-g-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 6-10（G）',
  'II-V-I phrases 6-10 (G)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  112,
  12,
  'キー: G',
  'Key: G',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-g-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-g-6-10'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-g-6-10'),
  'II-V-I フレーズ 6-10（G）'
);

-- st-g-11-15 (lesson #113)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-g-11-15'),
  NULL,
  'II-V-I フレーズ 11-15（G）',
  'II-V-I phrases 11-15 (G)',
  'フレーズ 11-15（G調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 11-15 in G. Play along with the backing track (160 BPM, five phrases × two passes each).',
  223,
  504,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  504,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-11-15-g.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-11-15-g.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-g-11-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 11-15（G）',
  'II-V-I phrases 11-15 (G)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  113,
  12,
  'キー: G',
  'Key: G',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-g-11-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-g-11-15'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-g-11-15'),
  'II-V-I フレーズ 11-15（G）'
);

-- st-g-16-20 (lesson #114)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-g-16-20'),
  NULL,
  'II-V-I フレーズ 16-20（G）',
  'II-V-I phrases 16-20 (G)',
  'フレーズ 16-20（G調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 16-20 in G. Play along with the backing track (160 BPM, five phrases × two passes each).',
  227,
  516,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  516,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-16-20-g.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-16-20-g.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-g-16-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 16-20（G）',
  'II-V-I phrases 16-20 (G)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  114,
  12,
  'キー: G',
  'Key: G',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-g-16-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-g-16-20'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-g-16-20'),
  'II-V-I フレーズ 16-20（G）'
);

-- st-g-21-25 (lesson #115)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-g-21-25'),
  NULL,
  'II-V-I フレーズ 21-25（G）',
  'II-V-I phrases 21-25 (G)',
  'フレーズ 21-25（G調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 21-25 in G. Play along with the backing track (160 BPM, five phrases × two passes each).',
  217,
  484,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  484,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-21-25-g.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-21-25-g.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-g-21-25'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 21-25（G）',
  'II-V-I phrases 21-25 (G)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  115,
  12,
  'キー: G',
  'Key: G',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-g-21-25'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-g-21-25'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-g-21-25'),
  'II-V-I フレーズ 21-25（G）'
);

-- st-g-26-30 (lesson #116)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-g-26-30'),
  NULL,
  'II-V-I フレーズ 26-30（G）',
  'II-V-I phrases 26-30 (G)',
  'フレーズ 26-30（G調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 26-30 in G. Play along with the backing track (160 BPM, five phrases × two passes each).',
  201,
  436,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  436,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-26-30-g.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-26-30-g.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-g-26-30'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 26-30（G）',
  'II-V-I phrases 26-30 (G)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  116,
  12,
  'キー: G',
  'Key: G',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-g-26-30'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-g-26-30'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-g-26-30'),
  'II-V-I フレーズ 26-30（G）'
);

-- st-g-31-35 (lesson #117)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-g-31-35'),
  NULL,
  'II-V-I フレーズ 31-35（G）',
  'II-V-I phrases 31-35 (G)',
  'フレーズ 31-35（G調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 31-35 in G. Play along with the backing track (160 BPM, five phrases × two passes each).',
  193,
  412,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  412,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-31-35-g.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-31-35-g.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-g-31-35'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 31-35（G）',
  'II-V-I phrases 31-35 (G)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  117,
  12,
  'キー: G',
  'Key: G',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-g-31-35'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-g-31-35'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-g-31-35'),
  'II-V-I フレーズ 31-35（G）'
);

-- st-g-36-40 (lesson #118)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-g-36-40'),
  NULL,
  'II-V-I フレーズ 36-40（G）',
  'II-V-I phrases 36-40 (G)',
  'フレーズ 36-40（G調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 36-40 in G. Play along with the backing track (160 BPM, five phrases × two passes each).',
  233,
  532,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  532,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-36-40-g.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-36-40-g.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-g-36-40'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 36-40（G）',
  'II-V-I phrases 36-40 (G)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  118,
  12,
  'キー: G',
  'Key: G',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-g-36-40'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-g-36-40'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-g-36-40'),
  'II-V-I フレーズ 36-40（G）'
);

-- st-g-41-45 (lesson #119)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-g-41-45'),
  NULL,
  'II-V-I フレーズ 41-45（G）',
  'II-V-I phrases 41-45 (G)',
  'フレーズ 41-45（G調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 41-45 in G. Play along with the backing track (160 BPM, five phrases × two passes each).',
  237,
  544,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  544,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-41-45-g.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-41-45-g.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-g-41-45'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 41-45（G）',
  'II-V-I phrases 41-45 (G)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  119,
  12,
  'キー: G',
  'Key: G',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-g-41-45'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-g-41-45'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-g-41-45'),
  'II-V-I フレーズ 41-45（G）'
);

-- st-g-46-50 (lesson #120)
INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  production_repeat_transposition_mode, production_start_key,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-g-46-50'),
  NULL,
  'II-V-I フレーズ 46-50（G）',
  'II-V-I phrases 46-50 (G)',
  'フレーズ 46-50（G調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 46-50 in G. Play along with the backing track (160 BPM, five phrases × two passes each).',
  231,
  528,
  4.0,
  'progression_timing',
  '[]'::jsonb,
  '[]'::jsonb,
  true,
  1,
  528,
  1,
  1,
  1,
  false,
  'phrases',
  160,
  4,
  40,
  1,
  'lesson',
  false,
  false,
  'off',
  0,
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-46-50-g.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-46-50-g.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-g-46-50'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 46-50（G）',
  'II-V-I phrases 46-50 (G)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  120,
  12,
  'キー: G',
  'Key: G',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-g-46-50'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-g-46-50'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-g-46-50'),
  'II-V-I フレーズ 46-50（G）'
);

COMMIT;
