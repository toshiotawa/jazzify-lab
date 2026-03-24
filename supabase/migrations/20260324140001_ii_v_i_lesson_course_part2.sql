-- II-V-I lesson course chunk 41-80 (generator: generate-ii-v-i-migration.mjs)
BEGIN;

-- st-ab-1-5 (lesson #41)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-ab-1-5'),
  NULL,
  'II-V-I フレーズ 1-5（A♭）',
  'II-V-I phrases 1-5 (Ab)',
  'フレーズ 1-5（A♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 1-5 in Ab. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-1-5-ab.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-1-5-ab.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-ab-1-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 1-5（A♭）',
  'II-V-I phrases 1-5 (Ab)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  41,
  5,
  'キー: A♭',
  'Key: Ab',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-ab-1-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-ab-1-5'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-ab-1-5'),
  'II-V-I フレーズ 1-5（A♭）'
);

-- st-ab-6-10 (lesson #42)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-ab-6-10'),
  NULL,
  'II-V-I フレーズ 6-10（A♭）',
  'II-V-I phrases 6-10 (Ab)',
  'フレーズ 6-10（A♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 6-10 in Ab. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-6-10-ab.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-6-10-ab.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-ab-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 6-10（A♭）',
  'II-V-I phrases 6-10 (Ab)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  42,
  5,
  'キー: A♭',
  'Key: Ab',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-ab-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-ab-6-10'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-ab-6-10'),
  'II-V-I フレーズ 6-10（A♭）'
);

-- st-ab-11-15 (lesson #43)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-ab-11-15'),
  NULL,
  'II-V-I フレーズ 11-15（A♭）',
  'II-V-I phrases 11-15 (Ab)',
  'フレーズ 11-15（A♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 11-15 in Ab. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-11-15-ab.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-11-15-ab.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-ab-11-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 11-15（A♭）',
  'II-V-I phrases 11-15 (Ab)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  43,
  5,
  'キー: A♭',
  'Key: Ab',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-ab-11-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-ab-11-15'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-ab-11-15'),
  'II-V-I フレーズ 11-15（A♭）'
);

-- st-ab-16-20 (lesson #44)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-ab-16-20'),
  NULL,
  'II-V-I フレーズ 16-20（A♭）',
  'II-V-I phrases 16-20 (Ab)',
  'フレーズ 16-20（A♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 16-20 in Ab. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-16-20-ab.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-16-20-ab.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-ab-16-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 16-20（A♭）',
  'II-V-I phrases 16-20 (Ab)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  44,
  5,
  'キー: A♭',
  'Key: Ab',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-ab-16-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-ab-16-20'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-ab-16-20'),
  'II-V-I フレーズ 16-20（A♭）'
);

-- st-ab-21-25 (lesson #45)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-ab-21-25'),
  NULL,
  'II-V-I フレーズ 21-25（A♭）',
  'II-V-I phrases 21-25 (Ab)',
  'フレーズ 21-25（A♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 21-25 in Ab. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-21-25-ab.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-21-25-ab.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-ab-21-25'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 21-25（A♭）',
  'II-V-I phrases 21-25 (Ab)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  45,
  5,
  'キー: A♭',
  'Key: Ab',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-ab-21-25'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-ab-21-25'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-ab-21-25'),
  'II-V-I フレーズ 21-25（A♭）'
);

-- st-ab-26-30 (lesson #46)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-ab-26-30'),
  NULL,
  'II-V-I フレーズ 26-30（A♭）',
  'II-V-I phrases 26-30 (Ab)',
  'フレーズ 26-30（A♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 26-30 in Ab. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-26-30-ab.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-26-30-ab.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-ab-26-30'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 26-30（A♭）',
  'II-V-I phrases 26-30 (Ab)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  46,
  5,
  'キー: A♭',
  'Key: Ab',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-ab-26-30'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-ab-26-30'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-ab-26-30'),
  'II-V-I フレーズ 26-30（A♭）'
);

-- st-ab-31-35 (lesson #47)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-ab-31-35'),
  NULL,
  'II-V-I フレーズ 31-35（A♭）',
  'II-V-I phrases 31-35 (Ab)',
  'フレーズ 31-35（A♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 31-35 in Ab. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-31-35-ab.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-31-35-ab.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-ab-31-35'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 31-35（A♭）',
  'II-V-I phrases 31-35 (Ab)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  47,
  5,
  'キー: A♭',
  'Key: Ab',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-ab-31-35'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-ab-31-35'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-ab-31-35'),
  'II-V-I フレーズ 31-35（A♭）'
);

-- st-ab-36-40 (lesson #48)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-ab-36-40'),
  NULL,
  'II-V-I フレーズ 36-40（A♭）',
  'II-V-I phrases 36-40 (Ab)',
  'フレーズ 36-40（A♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 36-40 in Ab. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-36-40-ab.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-36-40-ab.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-ab-36-40'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 36-40（A♭）',
  'II-V-I phrases 36-40 (Ab)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  48,
  5,
  'キー: A♭',
  'Key: Ab',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-ab-36-40'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-ab-36-40'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-ab-36-40'),
  'II-V-I フレーズ 36-40（A♭）'
);

-- st-ab-41-45 (lesson #49)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-ab-41-45'),
  NULL,
  'II-V-I フレーズ 41-45（A♭）',
  'II-V-I phrases 41-45 (Ab)',
  'フレーズ 41-45（A♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 41-45 in Ab. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-41-45-ab.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-41-45-ab.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-ab-41-45'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 41-45（A♭）',
  'II-V-I phrases 41-45 (Ab)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  49,
  5,
  'キー: A♭',
  'Key: Ab',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-ab-41-45'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-ab-41-45'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-ab-41-45'),
  'II-V-I フレーズ 41-45（A♭）'
);

-- st-ab-46-50 (lesson #50)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-ab-46-50'),
  NULL,
  'II-V-I フレーズ 46-50（A♭）',
  'II-V-I phrases 46-50 (Ab)',
  'フレーズ 46-50（A♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 46-50 in Ab. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-46-50-ab.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-46-50-ab.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-ab-46-50'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 46-50（A♭）',
  'II-V-I phrases 46-50 (Ab)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  50,
  5,
  'キー: A♭',
  'Key: Ab',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-ab-46-50'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-ab-46-50'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-ab-46-50'),
  'II-V-I フレーズ 46-50（A♭）'
);

-- st-db-1-5 (lesson #51)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-db-1-5'),
  NULL,
  'II-V-I フレーズ 1-5（D♭）',
  'II-V-I phrases 1-5 (Db)',
  'フレーズ 1-5（D♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 1-5 in Db. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-1-5-db.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-1-5-db.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-db-1-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 1-5（D♭）',
  'II-V-I phrases 1-5 (Db)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  51,
  6,
  'キー: D♭',
  'Key: Db',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-db-1-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-db-1-5'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-db-1-5'),
  'II-V-I フレーズ 1-5（D♭）'
);

-- st-db-6-10 (lesson #52)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-db-6-10'),
  NULL,
  'II-V-I フレーズ 6-10（D♭）',
  'II-V-I phrases 6-10 (Db)',
  'フレーズ 6-10（D♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 6-10 in Db. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-6-10-db.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-6-10-db.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-db-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 6-10（D♭）',
  'II-V-I phrases 6-10 (Db)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  52,
  6,
  'キー: D♭',
  'Key: Db',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-db-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-db-6-10'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-db-6-10'),
  'II-V-I フレーズ 6-10（D♭）'
);

-- st-db-11-15 (lesson #53)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-db-11-15'),
  NULL,
  'II-V-I フレーズ 11-15（D♭）',
  'II-V-I phrases 11-15 (Db)',
  'フレーズ 11-15（D♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 11-15 in Db. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-11-15-db.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-11-15-db.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-db-11-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 11-15（D♭）',
  'II-V-I phrases 11-15 (Db)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  53,
  6,
  'キー: D♭',
  'Key: Db',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-db-11-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-db-11-15'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-db-11-15'),
  'II-V-I フレーズ 11-15（D♭）'
);

-- st-db-16-20 (lesson #54)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-db-16-20'),
  NULL,
  'II-V-I フレーズ 16-20（D♭）',
  'II-V-I phrases 16-20 (Db)',
  'フレーズ 16-20（D♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 16-20 in Db. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-16-20-db.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-16-20-db.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-db-16-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 16-20（D♭）',
  'II-V-I phrases 16-20 (Db)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  54,
  6,
  'キー: D♭',
  'Key: Db',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-db-16-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-db-16-20'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-db-16-20'),
  'II-V-I フレーズ 16-20（D♭）'
);

-- st-db-21-25 (lesson #55)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-db-21-25'),
  NULL,
  'II-V-I フレーズ 21-25（D♭）',
  'II-V-I phrases 21-25 (Db)',
  'フレーズ 21-25（D♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 21-25 in Db. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-21-25-db.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-21-25-db.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-db-21-25'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 21-25（D♭）',
  'II-V-I phrases 21-25 (Db)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  55,
  6,
  'キー: D♭',
  'Key: Db',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-db-21-25'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-db-21-25'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-db-21-25'),
  'II-V-I フレーズ 21-25（D♭）'
);

-- st-db-26-30 (lesson #56)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-db-26-30'),
  NULL,
  'II-V-I フレーズ 26-30（D♭）',
  'II-V-I phrases 26-30 (Db)',
  'フレーズ 26-30（D♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 26-30 in Db. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-26-30-db.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-26-30-db.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-db-26-30'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 26-30（D♭）',
  'II-V-I phrases 26-30 (Db)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  56,
  6,
  'キー: D♭',
  'Key: Db',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-db-26-30'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-db-26-30'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-db-26-30'),
  'II-V-I フレーズ 26-30（D♭）'
);

-- st-db-31-35 (lesson #57)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-db-31-35'),
  NULL,
  'II-V-I フレーズ 31-35（D♭）',
  'II-V-I phrases 31-35 (Db)',
  'フレーズ 31-35（D♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 31-35 in Db. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-31-35-db.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-31-35-db.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-db-31-35'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 31-35（D♭）',
  'II-V-I phrases 31-35 (Db)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  57,
  6,
  'キー: D♭',
  'Key: Db',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-db-31-35'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-db-31-35'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-db-31-35'),
  'II-V-I フレーズ 31-35（D♭）'
);

-- st-db-36-40 (lesson #58)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-db-36-40'),
  NULL,
  'II-V-I フレーズ 36-40（D♭）',
  'II-V-I phrases 36-40 (Db)',
  'フレーズ 36-40（D♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 36-40 in Db. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-36-40-db.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-36-40-db.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-db-36-40'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 36-40（D♭）',
  'II-V-I phrases 36-40 (Db)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  58,
  6,
  'キー: D♭',
  'Key: Db',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-db-36-40'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-db-36-40'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-db-36-40'),
  'II-V-I フレーズ 36-40（D♭）'
);

-- st-db-41-45 (lesson #59)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-db-41-45'),
  NULL,
  'II-V-I フレーズ 41-45（D♭）',
  'II-V-I phrases 41-45 (Db)',
  'フレーズ 41-45（D♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 41-45 in Db. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-41-45-db.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-41-45-db.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-db-41-45'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 41-45（D♭）',
  'II-V-I phrases 41-45 (Db)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  59,
  6,
  'キー: D♭',
  'Key: Db',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-db-41-45'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-db-41-45'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-db-41-45'),
  'II-V-I フレーズ 41-45（D♭）'
);

-- st-db-46-50 (lesson #60)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-db-46-50'),
  NULL,
  'II-V-I フレーズ 46-50（D♭）',
  'II-V-I phrases 46-50 (Db)',
  'フレーズ 46-50（D♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 46-50 in Db. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-46-50-db.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-46-50-db.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-db-46-50'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 46-50（D♭）',
  'II-V-I phrases 46-50 (Db)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  60,
  6,
  'キー: D♭',
  'Key: Db',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-db-46-50'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-db-46-50'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-db-46-50'),
  'II-V-I フレーズ 46-50（D♭）'
);

-- st-gb-1-5 (lesson #61)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-gb-1-5'),
  NULL,
  'II-V-I フレーズ 1-5（G♭）',
  'II-V-I phrases 1-5 (Gb)',
  'フレーズ 1-5（G♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 1-5 in Gb. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-1-5-gb.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-1-5-gb.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-gb-1-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 1-5（G♭）',
  'II-V-I phrases 1-5 (Gb)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  61,
  7,
  'キー: G♭',
  'Key: Gb',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-gb-1-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-gb-1-5'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-gb-1-5'),
  'II-V-I フレーズ 1-5（G♭）'
);

-- st-gb-6-10 (lesson #62)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-gb-6-10'),
  NULL,
  'II-V-I フレーズ 6-10（G♭）',
  'II-V-I phrases 6-10 (Gb)',
  'フレーズ 6-10（G♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 6-10 in Gb. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-6-10-gb.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-6-10-gb.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-gb-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 6-10（G♭）',
  'II-V-I phrases 6-10 (Gb)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  62,
  7,
  'キー: G♭',
  'Key: Gb',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-gb-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-gb-6-10'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-gb-6-10'),
  'II-V-I フレーズ 6-10（G♭）'
);

-- st-gb-11-15 (lesson #63)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-gb-11-15'),
  NULL,
  'II-V-I フレーズ 11-15（G♭）',
  'II-V-I phrases 11-15 (Gb)',
  'フレーズ 11-15（G♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 11-15 in Gb. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-11-15-gb.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-11-15-gb.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-gb-11-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 11-15（G♭）',
  'II-V-I phrases 11-15 (Gb)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  63,
  7,
  'キー: G♭',
  'Key: Gb',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-gb-11-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-gb-11-15'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-gb-11-15'),
  'II-V-I フレーズ 11-15（G♭）'
);

-- st-gb-16-20 (lesson #64)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-gb-16-20'),
  NULL,
  'II-V-I フレーズ 16-20（G♭）',
  'II-V-I phrases 16-20 (Gb)',
  'フレーズ 16-20（G♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 16-20 in Gb. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-16-20-gb.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-16-20-gb.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-gb-16-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 16-20（G♭）',
  'II-V-I phrases 16-20 (Gb)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  64,
  7,
  'キー: G♭',
  'Key: Gb',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-gb-16-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-gb-16-20'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-gb-16-20'),
  'II-V-I フレーズ 16-20（G♭）'
);

-- st-gb-21-25 (lesson #65)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-gb-21-25'),
  NULL,
  'II-V-I フレーズ 21-25（G♭）',
  'II-V-I phrases 21-25 (Gb)',
  'フレーズ 21-25（G♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 21-25 in Gb. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-21-25-gb.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-21-25-gb.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-gb-21-25'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 21-25（G♭）',
  'II-V-I phrases 21-25 (Gb)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  65,
  7,
  'キー: G♭',
  'Key: Gb',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-gb-21-25'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-gb-21-25'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-gb-21-25'),
  'II-V-I フレーズ 21-25（G♭）'
);

-- st-gb-26-30 (lesson #66)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-gb-26-30'),
  NULL,
  'II-V-I フレーズ 26-30（G♭）',
  'II-V-I phrases 26-30 (Gb)',
  'フレーズ 26-30（G♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 26-30 in Gb. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-26-30-gb.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-26-30-gb.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-gb-26-30'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 26-30（G♭）',
  'II-V-I phrases 26-30 (Gb)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  66,
  7,
  'キー: G♭',
  'Key: Gb',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-gb-26-30'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-gb-26-30'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-gb-26-30'),
  'II-V-I フレーズ 26-30（G♭）'
);

-- st-gb-31-35 (lesson #67)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-gb-31-35'),
  NULL,
  'II-V-I フレーズ 31-35（G♭）',
  'II-V-I phrases 31-35 (Gb)',
  'フレーズ 31-35（G♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 31-35 in Gb. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-31-35-gb.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-31-35-gb.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-gb-31-35'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 31-35（G♭）',
  'II-V-I phrases 31-35 (Gb)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  67,
  7,
  'キー: G♭',
  'Key: Gb',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-gb-31-35'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-gb-31-35'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-gb-31-35'),
  'II-V-I フレーズ 31-35（G♭）'
);

-- st-gb-36-40 (lesson #68)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-gb-36-40'),
  NULL,
  'II-V-I フレーズ 36-40（G♭）',
  'II-V-I phrases 36-40 (Gb)',
  'フレーズ 36-40（G♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 36-40 in Gb. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-36-40-gb.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-36-40-gb.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-gb-36-40'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 36-40（G♭）',
  'II-V-I phrases 36-40 (Gb)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  68,
  7,
  'キー: G♭',
  'Key: Gb',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-gb-36-40'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-gb-36-40'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-gb-36-40'),
  'II-V-I フレーズ 36-40（G♭）'
);

-- st-gb-41-45 (lesson #69)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-gb-41-45'),
  NULL,
  'II-V-I フレーズ 41-45（G♭）',
  'II-V-I phrases 41-45 (Gb)',
  'フレーズ 41-45（G♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 41-45 in Gb. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-41-45-gb.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-41-45-gb.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-gb-41-45'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 41-45（G♭）',
  'II-V-I phrases 41-45 (Gb)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  69,
  7,
  'キー: G♭',
  'Key: Gb',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-gb-41-45'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-gb-41-45'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-gb-41-45'),
  'II-V-I フレーズ 41-45（G♭）'
);

-- st-gb-46-50 (lesson #70)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-gb-46-50'),
  NULL,
  'II-V-I フレーズ 46-50（G♭）',
  'II-V-I phrases 46-50 (Gb)',
  'フレーズ 46-50（G♭調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 46-50 in Gb. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-46-50-gb.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-46-50-gb.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-gb-46-50'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 46-50（G♭）',
  'II-V-I phrases 46-50 (Gb)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  70,
  7,
  'キー: G♭',
  'Key: Gb',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-gb-46-50'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-gb-46-50'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-gb-46-50'),
  'II-V-I フレーズ 46-50（G♭）'
);

-- st-b-1-5 (lesson #71)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-b-1-5'),
  NULL,
  'II-V-I フレーズ 1-5（B）',
  'II-V-I phrases 1-5 (B)',
  'フレーズ 1-5（B調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 1-5 in B. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-1-5-b.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-1-5-b.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-b-1-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 1-5（B）',
  'II-V-I phrases 1-5 (B)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  71,
  8,
  'キー: B',
  'Key: B',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-b-1-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-b-1-5'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-b-1-5'),
  'II-V-I フレーズ 1-5（B）'
);

-- st-b-6-10 (lesson #72)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-b-6-10'),
  NULL,
  'II-V-I フレーズ 6-10（B）',
  'II-V-I phrases 6-10 (B)',
  'フレーズ 6-10（B調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 6-10 in B. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-6-10-b.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-6-10-b.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-b-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 6-10（B）',
  'II-V-I phrases 6-10 (B)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  72,
  8,
  'キー: B',
  'Key: B',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-b-6-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-b-6-10'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-b-6-10'),
  'II-V-I フレーズ 6-10（B）'
);

-- st-b-11-15 (lesson #73)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-b-11-15'),
  NULL,
  'II-V-I フレーズ 11-15（B）',
  'II-V-I phrases 11-15 (B)',
  'フレーズ 11-15（B調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 11-15 in B. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-11-15-b.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-11-15-b.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-b-11-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 11-15（B）',
  'II-V-I phrases 11-15 (B)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  73,
  8,
  'キー: B',
  'Key: B',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-b-11-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-b-11-15'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-b-11-15'),
  'II-V-I フレーズ 11-15（B）'
);

-- st-b-16-20 (lesson #74)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-b-16-20'),
  NULL,
  'II-V-I フレーズ 16-20（B）',
  'II-V-I phrases 16-20 (B)',
  'フレーズ 16-20（B調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 16-20 in B. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-16-20-b.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-16-20-b.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-b-16-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 16-20（B）',
  'II-V-I phrases 16-20 (B)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  74,
  8,
  'キー: B',
  'Key: B',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-b-16-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-b-16-20'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-b-16-20'),
  'II-V-I フレーズ 16-20（B）'
);

-- st-b-21-25 (lesson #75)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-b-21-25'),
  NULL,
  'II-V-I フレーズ 21-25（B）',
  'II-V-I phrases 21-25 (B)',
  'フレーズ 21-25（B調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 21-25 in B. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-21-25-b.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-21-25-b.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-b-21-25'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 21-25（B）',
  'II-V-I phrases 21-25 (B)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  75,
  8,
  'キー: B',
  'Key: B',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-b-21-25'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-b-21-25'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-b-21-25'),
  'II-V-I フレーズ 21-25（B）'
);

-- st-b-26-30 (lesson #76)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-b-26-30'),
  NULL,
  'II-V-I フレーズ 26-30（B）',
  'II-V-I phrases 26-30 (B)',
  'フレーズ 26-30（B調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 26-30 in B. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-26-30-b.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-26-30-b.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-b-26-30'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 26-30（B）',
  'II-V-I phrases 26-30 (B)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  76,
  8,
  'キー: B',
  'Key: B',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-b-26-30'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-b-26-30'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-b-26-30'),
  'II-V-I フレーズ 26-30（B）'
);

-- st-b-31-35 (lesson #77)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-b-31-35'),
  NULL,
  'II-V-I フレーズ 31-35（B）',
  'II-V-I phrases 31-35 (B)',
  'フレーズ 31-35（B調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 31-35 in B. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-31-35-b.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-31-35-b.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-b-31-35'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 31-35（B）',
  'II-V-I phrases 31-35 (B)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  77,
  8,
  'キー: B',
  'Key: B',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-b-31-35'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-b-31-35'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-b-31-35'),
  'II-V-I フレーズ 31-35（B）'
);

-- st-b-36-40 (lesson #78)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-b-36-40'),
  NULL,
  'II-V-I フレーズ 36-40（B）',
  'II-V-I phrases 36-40 (B)',
  'フレーズ 36-40（B調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 36-40 in B. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-36-40-b.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-36-40-b.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-b-36-40'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 36-40（B）',
  'II-V-I phrases 36-40 (B)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  78,
  8,
  'キー: B',
  'Key: B',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-b-36-40'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-b-36-40'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-b-36-40'),
  'II-V-I フレーズ 36-40（B）'
);

-- st-b-41-45 (lesson #79)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-b-41-45'),
  NULL,
  'II-V-I フレーズ 41-45（B）',
  'II-V-I phrases 41-45 (B)',
  'フレーズ 41-45（B調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 41-45 in B. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-41-45-b.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-41-45-b.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-b-41-45'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 41-45（B）',
  'II-V-I phrases 41-45 (B)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  79,
  8,
  'キー: B',
  'Key: B',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-b-41-45'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-b-41-45'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-b-41-45'),
  'II-V-I フレーズ 41-45（B）'
);

-- st-b-46-50 (lesson #80)
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-b-46-50'),
  NULL,
  'II-V-I フレーズ 46-50（B）',
  'II-V-I phrases 46-50 (B)',
  'フレーズ 46-50（B調）。BPM 160、5フレーズ×各2回演奏のバッキングトラックに合わせて演奏します。',
  'Phrases 46-50 in B. Play along with the backing track (160 BPM, five phrases × two passes each).',
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
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-46-50-b.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/ii-v-i-46-50-b.mp3'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-b-46-50'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course'),
  'II-V-I フレーズ 46-50（B）',
  'II-V-I phrases 46-50 (B)',
  '実習: リンク先のファンタジーステージをクリア（ランクC以上・1回）してください。',
  'Practice: Clear the linked Fantasy stage once (rank C or better).',
  80,
  8,
  'キー: B',
  'Key: B',
  true,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-b-46-50'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-b-46-50'),
  NULL,
  0,
  '{"rank":"C","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'st-b-46-50'),
  'II-V-I フレーズ 46-50（B）'
);

COMMIT;
