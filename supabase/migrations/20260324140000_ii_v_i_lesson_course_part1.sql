-- II-V-I lesson course chunk 1-40 (generator: generate-ii-v-i-migration.mjs)
BEGIN;

INSERT INTO public.courses (
  id, title, title_en, description, description_en,
  premium_only, order_index, audience, is_tutorial
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-Iフレーズ基礎',
  'II-V-I Phrase Basics',
  '定番のII–V–I進行を、短いフレーズ単位で12調×50種に練習するコースです。各レッスンは5フレーズを1本の音源で（各フレーズ2回ずつ）演奏します。BPM 160。ファンタジーモードのリズム・カスタム（楽譜＋タイミング判定）で、クリア（Cランク以上）を目指してください。',
  'Practice essential II–V–I lines across 12 keys and 50 short phrases. Each lesson uses one backing track covering five phrases (each phrase played twice) at 160 BPM. Clear the Fantasy rhythm/custom stage (sheet + timing) with any successful clear rank (C or better).',
  true,
  22,
  'both',
  false
);

-- st-c-1-5 (lesson #1)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-c-1-5'),
  NULL,
  'II-V-I フレーズ 1-5（C）',
  'II-V-I phrases 1-5 (C)',
  'フレーズ 1-5（C調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 1-5 in C. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-1-5-c.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-1-5-c.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-c-1-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 1-5（C）',
  'II-V-I phrases 1-5 (C)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  1,
  1,
  'キー: C',
  'Key: C',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-c-1-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-c-1-5'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-c-1-5'),
  'II-V-I フレーズ 1-5（C）'
);

-- st-c-6-10 (lesson #2)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-c-6-10'),
  NULL,
  'II-V-I フレーズ 6-10（C）',
  'II-V-I phrases 6-10 (C)',
  'フレーズ 6-10（C調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 6-10 in C. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-6-10-c.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-6-10-c.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-c-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 6-10（C）',
  'II-V-I phrases 6-10 (C)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  2,
  1,
  'キー: C',
  'Key: C',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-c-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-c-6-10'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-c-6-10'),
  'II-V-I フレーズ 6-10（C）'
);

-- st-c-11-15 (lesson #3)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-c-11-15'),
  NULL,
  'II-V-I フレーズ 11-15（C）',
  'II-V-I phrases 11-15 (C)',
  'フレーズ 11-15（C調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 11-15 in C. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-11-15-c.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-11-15-c.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-c-11-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 11-15（C）',
  'II-V-I phrases 11-15 (C)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  3,
  1,
  'キー: C',
  'Key: C',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-c-11-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-c-11-15'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-c-11-15'),
  'II-V-I フレーズ 11-15（C）'
);

-- st-c-16-20 (lesson #4)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-c-16-20'),
  NULL,
  'II-V-I フレーズ 16-20（C）',
  'II-V-I phrases 16-20 (C)',
  'フレーズ 16-20（C調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 16-20 in C. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-16-20-c.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-16-20-c.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-c-16-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 16-20（C）',
  'II-V-I phrases 16-20 (C)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  4,
  1,
  'キー: C',
  'Key: C',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-c-16-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-c-16-20'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-c-16-20'),
  'II-V-I フレーズ 16-20（C）'
);

-- st-c-21-25 (lesson #5)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-c-21-25'),
  NULL,
  'II-V-I フレーズ 21-25（C）',
  'II-V-I phrases 21-25 (C)',
  'フレーズ 21-25（C調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 21-25 in C. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-21-25-c.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-21-25-c.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-c-21-25'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 21-25（C）',
  'II-V-I phrases 21-25 (C)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  5,
  1,
  'キー: C',
  'Key: C',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-c-21-25'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-c-21-25'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-c-21-25'),
  'II-V-I フレーズ 21-25（C）'
);

-- st-c-26-30 (lesson #6)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-c-26-30'),
  NULL,
  'II-V-I フレーズ 26-30（C）',
  'II-V-I phrases 26-30 (C)',
  'フレーズ 26-30（C調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 26-30 in C. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-26-30-c.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-26-30-c.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-c-26-30'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 26-30（C）',
  'II-V-I phrases 26-30 (C)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  6,
  1,
  'キー: C',
  'Key: C',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-c-26-30'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-c-26-30'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-c-26-30'),
  'II-V-I フレーズ 26-30（C）'
);

-- st-c-31-35 (lesson #7)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-c-31-35'),
  NULL,
  'II-V-I フレーズ 31-35（C）',
  'II-V-I phrases 31-35 (C)',
  'フレーズ 31-35（C調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 31-35 in C. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-31-35-c.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-31-35-c.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-c-31-35'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 31-35（C）',
  'II-V-I phrases 31-35 (C)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  7,
  1,
  'キー: C',
  'Key: C',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-c-31-35'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-c-31-35'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-c-31-35'),
  'II-V-I フレーズ 31-35（C）'
);

-- st-c-36-40 (lesson #8)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-c-36-40'),
  NULL,
  'II-V-I フレーズ 36-40（C）',
  'II-V-I phrases 36-40 (C)',
  'フレーズ 36-40（C調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 36-40 in C. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-36-40-c.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-36-40-c.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-c-36-40'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 36-40（C）',
  'II-V-I phrases 36-40 (C)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  8,
  1,
  'キー: C',
  'Key: C',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-c-36-40'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-c-36-40'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-c-36-40'),
  'II-V-I フレーズ 36-40（C）'
);

-- st-c-41-45 (lesson #9)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-c-41-45'),
  NULL,
  'II-V-I フレーズ 41-45（C）',
  'II-V-I phrases 41-45 (C)',
  'フレーズ 41-45（C調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 41-45 in C. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-41-45-c.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-41-45-c.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-c-41-45'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 41-45（C）',
  'II-V-I phrases 41-45 (C)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  9,
  1,
  'キー: C',
  'Key: C',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-c-41-45'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-c-41-45'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-c-41-45'),
  'II-V-I フレーズ 41-45（C）'
);

-- st-c-46-50 (lesson #10)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-c-46-50'),
  NULL,
  'II-V-I フレーズ 46-50（C）',
  'II-V-I phrases 46-50 (C)',
  'フレーズ 46-50（C調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 46-50 in C. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-46-50-c.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-46-50-c.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-c-46-50'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 46-50（C）',
  'II-V-I phrases 46-50 (C)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  10,
  1,
  'キー: C',
  'Key: C',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-c-46-50'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-c-46-50'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-c-46-50'),
  'II-V-I フレーズ 46-50（C）'
);

-- st-f-1-5 (lesson #11)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-f-1-5'),
  NULL,
  'II-V-I フレーズ 1-5（F）',
  'II-V-I phrases 1-5 (F)',
  'フレーズ 1-5（F調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 1-5 in F. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-1-5-f.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-1-5-f.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-f-1-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 1-5（F）',
  'II-V-I phrases 1-5 (F)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  11,
  2,
  'キー: F',
  'Key: F',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-f-1-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-f-1-5'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-f-1-5'),
  'II-V-I フレーズ 1-5（F）'
);

-- st-f-6-10 (lesson #12)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-f-6-10'),
  NULL,
  'II-V-I フレーズ 6-10（F）',
  'II-V-I phrases 6-10 (F)',
  'フレーズ 6-10（F調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 6-10 in F. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-6-10-f.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-6-10-f.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-f-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 6-10（F）',
  'II-V-I phrases 6-10 (F)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  12,
  2,
  'キー: F',
  'Key: F',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-f-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-f-6-10'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-f-6-10'),
  'II-V-I フレーズ 6-10（F）'
);

-- st-f-11-15 (lesson #13)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-f-11-15'),
  NULL,
  'II-V-I フレーズ 11-15（F）',
  'II-V-I phrases 11-15 (F)',
  'フレーズ 11-15（F調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 11-15 in F. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-11-15-f.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-11-15-f.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-f-11-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 11-15（F）',
  'II-V-I phrases 11-15 (F)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  13,
  2,
  'キー: F',
  'Key: F',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-f-11-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-f-11-15'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-f-11-15'),
  'II-V-I フレーズ 11-15（F）'
);

-- st-f-16-20 (lesson #14)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-f-16-20'),
  NULL,
  'II-V-I フレーズ 16-20（F）',
  'II-V-I phrases 16-20 (F)',
  'フレーズ 16-20（F調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 16-20 in F. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-16-20-f.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-16-20-f.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-f-16-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 16-20（F）',
  'II-V-I phrases 16-20 (F)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  14,
  2,
  'キー: F',
  'Key: F',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-f-16-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-f-16-20'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-f-16-20'),
  'II-V-I フレーズ 16-20（F）'
);

-- st-f-21-25 (lesson #15)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-f-21-25'),
  NULL,
  'II-V-I フレーズ 21-25（F）',
  'II-V-I phrases 21-25 (F)',
  'フレーズ 21-25（F調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 21-25 in F. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-21-25-f.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-21-25-f.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-f-21-25'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 21-25（F）',
  'II-V-I phrases 21-25 (F)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  15,
  2,
  'キー: F',
  'Key: F',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-f-21-25'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-f-21-25'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-f-21-25'),
  'II-V-I フレーズ 21-25（F）'
);

-- st-f-26-30 (lesson #16)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-f-26-30'),
  NULL,
  'II-V-I フレーズ 26-30（F）',
  'II-V-I phrases 26-30 (F)',
  'フレーズ 26-30（F調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 26-30 in F. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-26-30-f.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-26-30-f.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-f-26-30'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 26-30（F）',
  'II-V-I phrases 26-30 (F)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  16,
  2,
  'キー: F',
  'Key: F',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-f-26-30'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-f-26-30'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-f-26-30'),
  'II-V-I フレーズ 26-30（F）'
);

-- st-f-31-35 (lesson #17)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-f-31-35'),
  NULL,
  'II-V-I フレーズ 31-35（F）',
  'II-V-I phrases 31-35 (F)',
  'フレーズ 31-35（F調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 31-35 in F. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-31-35-f.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-31-35-f.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-f-31-35'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 31-35（F）',
  'II-V-I phrases 31-35 (F)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  17,
  2,
  'キー: F',
  'Key: F',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-f-31-35'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-f-31-35'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-f-31-35'),
  'II-V-I フレーズ 31-35（F）'
);

-- st-f-36-40 (lesson #18)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-f-36-40'),
  NULL,
  'II-V-I フレーズ 36-40（F）',
  'II-V-I phrases 36-40 (F)',
  'フレーズ 36-40（F調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 36-40 in F. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-36-40-f.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-36-40-f.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-f-36-40'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 36-40（F）',
  'II-V-I phrases 36-40 (F)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  18,
  2,
  'キー: F',
  'Key: F',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-f-36-40'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-f-36-40'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-f-36-40'),
  'II-V-I フレーズ 36-40（F）'
);

-- st-f-41-45 (lesson #19)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-f-41-45'),
  NULL,
  'II-V-I フレーズ 41-45（F）',
  'II-V-I phrases 41-45 (F)',
  'フレーズ 41-45（F調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 41-45 in F. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-41-45-f.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-41-45-f.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-f-41-45'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 41-45（F）',
  'II-V-I phrases 41-45 (F)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  19,
  2,
  'キー: F',
  'Key: F',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-f-41-45'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-f-41-45'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-f-41-45'),
  'II-V-I フレーズ 41-45（F）'
);

-- st-f-46-50 (lesson #20)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-f-46-50'),
  NULL,
  'II-V-I フレーズ 46-50（F）',
  'II-V-I phrases 46-50 (F)',
  'フレーズ 46-50（F調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 46-50 in F. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-46-50-f.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-46-50-f.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-f-46-50'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 46-50（F）',
  'II-V-I phrases 46-50 (F)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  20,
  2,
  'キー: F',
  'Key: F',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-f-46-50'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-f-46-50'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-f-46-50'),
  'II-V-I フレーズ 46-50（F）'
);

-- st-bb-1-5 (lesson #21)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-bb-1-5'),
  NULL,
  'II-V-I フレーズ 1-5（B♭）',
  'II-V-I phrases 1-5 (Bb)',
  'フレーズ 1-5（B♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 1-5 in Bb. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-1-5-bb.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-1-5-bb.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-bb-1-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 1-5（B♭）',
  'II-V-I phrases 1-5 (Bb)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  21,
  3,
  'キー: B♭',
  'Key: Bb',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-bb-1-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-bb-1-5'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-bb-1-5'),
  'II-V-I フレーズ 1-5（B♭）'
);

-- st-bb-6-10 (lesson #22)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-bb-6-10'),
  NULL,
  'II-V-I フレーズ 6-10（B♭）',
  'II-V-I phrases 6-10 (Bb)',
  'フレーズ 6-10（B♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 6-10 in Bb. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-6-10-bb.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-6-10-bb.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-bb-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 6-10（B♭）',
  'II-V-I phrases 6-10 (Bb)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  22,
  3,
  'キー: B♭',
  'Key: Bb',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-bb-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-bb-6-10'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-bb-6-10'),
  'II-V-I フレーズ 6-10（B♭）'
);

-- st-bb-11-15 (lesson #23)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-bb-11-15'),
  NULL,
  'II-V-I フレーズ 11-15（B♭）',
  'II-V-I phrases 11-15 (Bb)',
  'フレーズ 11-15（B♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 11-15 in Bb. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-11-15-bb.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-11-15-bb.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-bb-11-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 11-15（B♭）',
  'II-V-I phrases 11-15 (Bb)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  23,
  3,
  'キー: B♭',
  'Key: Bb',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-bb-11-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-bb-11-15'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-bb-11-15'),
  'II-V-I フレーズ 11-15（B♭）'
);

-- st-bb-16-20 (lesson #24)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-bb-16-20'),
  NULL,
  'II-V-I フレーズ 16-20（B♭）',
  'II-V-I phrases 16-20 (Bb)',
  'フレーズ 16-20（B♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 16-20 in Bb. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-16-20-bb.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-16-20-bb.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-bb-16-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 16-20（B♭）',
  'II-V-I phrases 16-20 (Bb)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  24,
  3,
  'キー: B♭',
  'Key: Bb',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-bb-16-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-bb-16-20'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-bb-16-20'),
  'II-V-I フレーズ 16-20（B♭）'
);

-- st-bb-21-25 (lesson #25)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-bb-21-25'),
  NULL,
  'II-V-I フレーズ 21-25（B♭）',
  'II-V-I phrases 21-25 (Bb)',
  'フレーズ 21-25（B♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 21-25 in Bb. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-21-25-bb.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-21-25-bb.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-bb-21-25'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 21-25（B♭）',
  'II-V-I phrases 21-25 (Bb)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  25,
  3,
  'キー: B♭',
  'Key: Bb',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-bb-21-25'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-bb-21-25'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-bb-21-25'),
  'II-V-I フレーズ 21-25（B♭）'
);

-- st-bb-26-30 (lesson #26)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-bb-26-30'),
  NULL,
  'II-V-I フレーズ 26-30（B♭）',
  'II-V-I phrases 26-30 (Bb)',
  'フレーズ 26-30（B♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 26-30 in Bb. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-26-30-bb.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-26-30-bb.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-bb-26-30'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 26-30（B♭）',
  'II-V-I phrases 26-30 (Bb)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  26,
  3,
  'キー: B♭',
  'Key: Bb',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-bb-26-30'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-bb-26-30'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-bb-26-30'),
  'II-V-I フレーズ 26-30（B♭）'
);

-- st-bb-31-35 (lesson #27)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-bb-31-35'),
  NULL,
  'II-V-I フレーズ 31-35（B♭）',
  'II-V-I phrases 31-35 (Bb)',
  'フレーズ 31-35（B♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 31-35 in Bb. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-31-35-bb.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-31-35-bb.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-bb-31-35'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 31-35（B♭）',
  'II-V-I phrases 31-35 (Bb)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  27,
  3,
  'キー: B♭',
  'Key: Bb',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-bb-31-35'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-bb-31-35'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-bb-31-35'),
  'II-V-I フレーズ 31-35（B♭）'
);

-- st-bb-36-40 (lesson #28)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-bb-36-40'),
  NULL,
  'II-V-I フレーズ 36-40（B♭）',
  'II-V-I phrases 36-40 (Bb)',
  'フレーズ 36-40（B♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 36-40 in Bb. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-36-40-bb.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-36-40-bb.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-bb-36-40'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 36-40（B♭）',
  'II-V-I phrases 36-40 (Bb)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  28,
  3,
  'キー: B♭',
  'Key: Bb',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-bb-36-40'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-bb-36-40'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-bb-36-40'),
  'II-V-I フレーズ 36-40（B♭）'
);

-- st-bb-41-45 (lesson #29)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-bb-41-45'),
  NULL,
  'II-V-I フレーズ 41-45（B♭）',
  'II-V-I phrases 41-45 (Bb)',
  'フレーズ 41-45（B♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 41-45 in Bb. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-41-45-bb.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-41-45-bb.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-bb-41-45'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 41-45（B♭）',
  'II-V-I phrases 41-45 (Bb)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  29,
  3,
  'キー: B♭',
  'Key: Bb',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-bb-41-45'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-bb-41-45'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-bb-41-45'),
  'II-V-I フレーズ 41-45（B♭）'
);

-- st-bb-46-50 (lesson #30)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-bb-46-50'),
  NULL,
  'II-V-I フレーズ 46-50（B♭）',
  'II-V-I phrases 46-50 (Bb)',
  'フレーズ 46-50（B♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 46-50 in Bb. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-46-50-bb.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-46-50-bb.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-bb-46-50'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 46-50（B♭）',
  'II-V-I phrases 46-50 (Bb)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  30,
  3,
  'キー: B♭',
  'Key: Bb',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-bb-46-50'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-bb-46-50'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-bb-46-50'),
  'II-V-I フレーズ 46-50（B♭）'
);

-- st-eb-1-5 (lesson #31)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-eb-1-5'),
  NULL,
  'II-V-I フレーズ 1-5（E♭）',
  'II-V-I phrases 1-5 (Eb)',
  'フレーズ 1-5（E♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 1-5 in Eb. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-1-5-eb.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-1-5-eb.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-eb-1-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 1-5（E♭）',
  'II-V-I phrases 1-5 (Eb)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  31,
  4,
  'キー: E♭',
  'Key: Eb',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-eb-1-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-eb-1-5'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-eb-1-5'),
  'II-V-I フレーズ 1-5（E♭）'
);

-- st-eb-6-10 (lesson #32)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-eb-6-10'),
  NULL,
  'II-V-I フレーズ 6-10（E♭）',
  'II-V-I phrases 6-10 (Eb)',
  'フレーズ 6-10（E♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 6-10 in Eb. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-6-10-eb.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-6-10-eb.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-eb-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 6-10（E♭）',
  'II-V-I phrases 6-10 (Eb)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  32,
  4,
  'キー: E♭',
  'Key: Eb',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-eb-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-eb-6-10'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-eb-6-10'),
  'II-V-I フレーズ 6-10（E♭）'
);

-- st-eb-11-15 (lesson #33)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-eb-11-15'),
  NULL,
  'II-V-I フレーズ 11-15（E♭）',
  'II-V-I phrases 11-15 (Eb)',
  'フレーズ 11-15（E♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 11-15 in Eb. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-11-15-eb.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-11-15-eb.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-eb-11-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 11-15（E♭）',
  'II-V-I phrases 11-15 (Eb)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  33,
  4,
  'キー: E♭',
  'Key: Eb',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-eb-11-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-eb-11-15'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-eb-11-15'),
  'II-V-I フレーズ 11-15（E♭）'
);

-- st-eb-16-20 (lesson #34)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-eb-16-20'),
  NULL,
  'II-V-I フレーズ 16-20（E♭）',
  'II-V-I phrases 16-20 (Eb)',
  'フレーズ 16-20（E♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 16-20 in Eb. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-16-20-eb.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-16-20-eb.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-eb-16-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 16-20（E♭）',
  'II-V-I phrases 16-20 (Eb)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  34,
  4,
  'キー: E♭',
  'Key: Eb',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-eb-16-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-eb-16-20'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-eb-16-20'),
  'II-V-I フレーズ 16-20（E♭）'
);

-- st-eb-21-25 (lesson #35)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-eb-21-25'),
  NULL,
  'II-V-I フレーズ 21-25（E♭）',
  'II-V-I phrases 21-25 (Eb)',
  'フレーズ 21-25（E♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 21-25 in Eb. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-21-25-eb.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-21-25-eb.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-eb-21-25'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 21-25（E♭）',
  'II-V-I phrases 21-25 (Eb)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  35,
  4,
  'キー: E♭',
  'Key: Eb',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-eb-21-25'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-eb-21-25'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-eb-21-25'),
  'II-V-I フレーズ 21-25（E♭）'
);

-- st-eb-26-30 (lesson #36)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-eb-26-30'),
  NULL,
  'II-V-I フレーズ 26-30（E♭）',
  'II-V-I phrases 26-30 (Eb)',
  'フレーズ 26-30（E♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 26-30 in Eb. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-26-30-eb.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-26-30-eb.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-eb-26-30'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 26-30（E♭）',
  'II-V-I phrases 26-30 (Eb)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  36,
  4,
  'キー: E♭',
  'Key: Eb',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-eb-26-30'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-eb-26-30'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-eb-26-30'),
  'II-V-I フレーズ 26-30（E♭）'
);

-- st-eb-31-35 (lesson #37)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-eb-31-35'),
  NULL,
  'II-V-I フレーズ 31-35（E♭）',
  'II-V-I phrases 31-35 (Eb)',
  'フレーズ 31-35（E♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 31-35 in Eb. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-31-35-eb.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-31-35-eb.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-eb-31-35'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 31-35（E♭）',
  'II-V-I phrases 31-35 (Eb)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  37,
  4,
  'キー: E♭',
  'Key: Eb',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-eb-31-35'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-eb-31-35'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-eb-31-35'),
  'II-V-I フレーズ 31-35（E♭）'
);

-- st-eb-36-40 (lesson #38)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-eb-36-40'),
  NULL,
  'II-V-I フレーズ 36-40（E♭）',
  'II-V-I phrases 36-40 (Eb)',
  'フレーズ 36-40（E♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 36-40 in Eb. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-36-40-eb.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-36-40-eb.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-eb-36-40'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 36-40（E♭）',
  'II-V-I phrases 36-40 (Eb)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  38,
  4,
  'キー: E♭',
  'Key: Eb',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-eb-36-40'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-eb-36-40'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-eb-36-40'),
  'II-V-I フレーズ 36-40（E♭）'
);

-- st-eb-41-45 (lesson #39)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-eb-41-45'),
  NULL,
  'II-V-I フレーズ 41-45（E♭）',
  'II-V-I phrases 41-45 (Eb)',
  'フレーズ 41-45（E♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 41-45 in Eb. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-41-45-eb.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-41-45-eb.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-eb-41-45'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 41-45（E♭）',
  'II-V-I phrases 41-45 (Eb)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  39,
  4,
  'キー: E♭',
  'Key: Eb',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-eb-41-45'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-eb-41-45'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-eb-41-45'),
  'II-V-I フレーズ 41-45（E♭）'
);

-- st-eb-46-50 (lesson #40)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-eb-46-50'),
  NULL,
  'II-V-I フレーズ 46-50（E♭）',
  'II-V-I phrases 46-50 (Eb)',
  'フレーズ 46-50（E♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 46-50 in Eb. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  true,
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-46-50-eb.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-46-50-eb.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-eb-46-50'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 46-50（E♭）',
  'II-V-I phrases 46-50 (Eb)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  40,
  4,
  'キー: E♭',
  'Key: Eb',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-eb-46-50'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-eb-46-50'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-eb-46-50'),
  'II-V-I フレーズ 46-50（E♭）'
);

COMMIT;
