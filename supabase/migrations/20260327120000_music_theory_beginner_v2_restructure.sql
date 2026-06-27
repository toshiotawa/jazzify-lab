-- 音楽理論初級コース v2: 専用ファンタジーステージとレッスンを再定義
-- BGM: https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3
BEGIN;

DELETE FROM public.lesson_songs
WHERE lesson_id IN (SELECT id FROM public.lessons WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'));

DELETE FROM public.lessons
WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner');

UPDATE public.courses
SET
  description = 'メジャー/マイナートライアドから度数・スケール・主要4和音まで、段階的に耳と指を鍛える初級コースです。',
  description_en = 'From triads and intervals through scales and core seventh chords, a step-by-step introductory theory course.',
  difficulty_tier = 'beginner'
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner');

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-01-01'),
  'MT-01-01',
  'メジャートライアド（CDE）その1',
  'Major triads (CDE) · Part 1',
  '',
  '',
  10,
  100,
  5,
  'single',
  '["C","D","E"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-01-02'),
  'MT-01-02',
  'メジャートライアド（CDE）その2',
  'Major triads (CDE) · Part 2',
  '',
  '',
  5,
  32,
  5,
  'progression_random',
  '["C","D","E"]'::jsonb,
  '[]'::jsonb,
  false,
  10,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  32,
  1,
  'lesson',
  false,
  false,
  4,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-01-03'),
  'MT-01-03',
  'メジャートライアド（FGAB）その1',
  'Major triads (FGAB) · Part 1',
  '',
  '',
  10,
  100,
  5,
  'single',
  '["F","G","A","B"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-01-04'),
  'MT-01-04',
  'メジャートライアド（FGAB）その2',
  'Major triads (FGAB) · Part 2',
  '',
  '',
  5,
  32,
  5,
  'progression_random',
  '["F","G","A","B"]'::jsonb,
  '[]'::jsonb,
  false,
  10,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  32,
  1,
  'lesson',
  false,
  false,
  4,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-01-05'),
  'MT-01-05',
  'メジャートライアド（黒鍵）その1',
  'Major triads (黒鍵) · Part 1',
  '',
  '',
  10,
  100,
  5,
  'single',
  '["Db","Eb","Gb","Ab","Bb"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-01-06'),
  'MT-01-06',
  'メジャートライアド（黒鍵）その2',
  'Major triads (黒鍵) · Part 2',
  '',
  '',
  5,
  32,
  5,
  'progression_random',
  '["Db","Eb","Gb","Ab","Bb"]'::jsonb,
  '[]'::jsonb,
  false,
  10,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  32,
  1,
  'lesson',
  false,
  false,
  4,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-01-07'),
  'MT-01-07',
  'メジャートライアド（全ルート）その1',
  'Major triads (全ルート) · Part 1',
  '',
  '',
  10,
  100,
  5,
  'single',
  '["C","D","E","F","G","A","B","Db","Eb","Gb","Ab","Bb"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-01-08'),
  'MT-01-08',
  'メジャートライアド（全ルート）その2',
  'Major triads (全ルート) · Part 2',
  '',
  '',
  5,
  32,
  5,
  'progression_random',
  '["C","D","E","F","G","A","B","Db","Eb","Gb","Ab","Bb"]'::jsonb,
  '[]'::jsonb,
  false,
  10,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  32,
  1,
  'lesson',
  false,
  false,
  4,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-02-01'),
  'MT-02-01',
  'マイナートライアド（CDE）その1',
  'Minor triads (CDE) · Part 1',
  '',
  '',
  10,
  100,
  5,
  'single',
  '["Cm","Dm","Em"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-02-02'),
  'MT-02-02',
  'マイナートライアド（CDE）その2',
  'Minor triads (CDE) · Part 2',
  '',
  '',
  5,
  32,
  5,
  'progression_random',
  '["Cm","Dm","Em"]'::jsonb,
  '[]'::jsonb,
  false,
  10,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  32,
  1,
  'lesson',
  false,
  false,
  4,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-02-03'),
  'MT-02-03',
  'マイナートライアド（FGAB）その1',
  'Minor triads (FGAB) · Part 1',
  '',
  '',
  10,
  100,
  5,
  'single',
  '["Fm","Gm","Am","Bm"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-02-04'),
  'MT-02-04',
  'マイナートライアド（FGAB）その2',
  'Minor triads (FGAB) · Part 2',
  '',
  '',
  5,
  32,
  5,
  'progression_random',
  '["Fm","Gm","Am","Bm"]'::jsonb,
  '[]'::jsonb,
  false,
  10,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  32,
  1,
  'lesson',
  false,
  false,
  4,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-02-05'),
  'MT-02-05',
  'マイナートライアド（C#–Eb–F#–Ab–Bb）その1',
  'Minor triads (C#–Eb–F#–Ab–Bb) · Part 1',
  '',
  '',
  10,
  100,
  5,
  'single',
  '["C#m","Ebm","F#m","Abm","Bbm"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-02-06'),
  'MT-02-06',
  'マイナートライアド（C#–Eb–F#–Ab–Bb）その2',
  'Minor triads (C#–Eb–F#–Ab–Bb) · Part 2',
  '',
  '',
  5,
  32,
  5,
  'progression_random',
  '["C#m","Ebm","F#m","Abm","Bbm"]'::jsonb,
  '[]'::jsonb,
  false,
  10,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  32,
  1,
  'lesson',
  false,
  false,
  4,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-02-07'),
  'MT-02-07',
  'マイナートライアド（全ルート）その1',
  'Minor triads (全ルート) · Part 1',
  '',
  '',
  10,
  100,
  5,
  'single',
  '["Cm","Dm","Em","Fm","Gm","Am","Bm","C#m","Ebm","F#m","Abm","Bbm"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-02-08'),
  'MT-02-08',
  'マイナートライアド（全ルート）その2',
  'Minor triads (全ルート) · Part 2',
  '',
  '',
  5,
  32,
  5,
  'progression_random',
  '["Cm","Dm","Em","Fm","Gm","Am","Bm","C#m","Ebm","F#m","Abm","Bbm"]'::jsonb,
  '[]'::jsonb,
  false,
  10,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  32,
  1,
  'lesson',
  false,
  false,
  4,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-03-01'),
  'MT-03-01',
  'メジャー/マイナー混合（CDE）その1',
  'Major/Minor mix (CDE) · Part 1',
  '',
  '',
  10,
  100,
  5,
  'single',
  '["C","D","E","Cm","Dm","Em"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-03-02'),
  'MT-03-02',
  'メジャー/マイナー混合（CDE）その2',
  'Major/Minor mix (CDE) · Part 2',
  '',
  '',
  5,
  32,
  5,
  'progression_random',
  '["C","D","E","Cm","Dm","Em"]'::jsonb,
  '[]'::jsonb,
  false,
  10,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  32,
  1,
  'lesson',
  false,
  false,
  4,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-03-03'),
  'MT-03-03',
  'メジャー/マイナー混合（FGAB）その1',
  'Major/Minor mix (FGAB) · Part 1',
  '',
  '',
  10,
  100,
  5,
  'single',
  '["F","G","A","B","Fm","Gm","Am","Bm"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-03-04'),
  'MT-03-04',
  'メジャー/マイナー混合（FGAB）その2',
  'Major/Minor mix (FGAB) · Part 2',
  '',
  '',
  5,
  32,
  5,
  'progression_random',
  '["F","G","A","B","Fm","Gm","Am","Bm"]'::jsonb,
  '[]'::jsonb,
  false,
  10,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  32,
  1,
  'lesson',
  false,
  false,
  4,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-03-05'),
  'MT-03-05',
  'メジャー/マイナー混合（黒鍵混合）その1',
  'Major/Minor mix (黒鍵混合) · Part 1',
  '',
  '',
  10,
  100,
  5,
  'single',
  '["Db","Eb","Gb","Ab","Bb","C#m","Ebm","F#m","Abm","Bbm"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-03-06'),
  'MT-03-06',
  'メジャー/マイナー混合（黒鍵混合）その2',
  'Major/Minor mix (黒鍵混合) · Part 2',
  '',
  '',
  5,
  32,
  5,
  'progression_random',
  '["Db","Eb","Gb","Ab","Bb","C#m","Ebm","F#m","Abm","Bbm"]'::jsonb,
  '[]'::jsonb,
  false,
  10,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  32,
  1,
  'lesson',
  false,
  false,
  4,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-03-07'),
  'MT-03-07',
  'メジャー/マイナー混合（全ルート）その1',
  'Major/Minor mix (全ルート) · Part 1',
  '',
  '',
  10,
  100,
  5,
  'single',
  '["C","D","E","F","G","A","B","Db","Eb","Gb","Ab","Bb","Cm","Dm","Em","Fm","Gm","Am","Bm","C#m","Ebm","F#m","Abm","Bbm"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-03-08'),
  'MT-03-08',
  'メジャー/マイナー混合（全ルート）その2',
  'Major/Minor mix (全ルート) · Part 2',
  '',
  '',
  5,
  32,
  5,
  'progression_random',
  '["C","D","E","F","G","A","B","Db","Eb","Gb","Ab","Bb","Cm","Dm","Em","Fm","Gm","Am","Bm","C#m","Ebm","F#m","Abm","Bbm"]'::jsonb,
  '[]'::jsonb,
  false,
  10,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  32,
  1,
  'lesson',
  false,
  false,
  4,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-01'),
  'MT-04-01',
  '長2度上（CDE）',
  'M2 up (CDE)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"C","interval":"M2","direction":"up"},{"type":"interval","chord":"D","interval":"M2","direction":"up"},{"type":"interval","chord":"E","interval":"M2","direction":"up"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-02'),
  'MT-04-02',
  '長2度上（FGAB）',
  'M2 up (FGAB)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"F","interval":"M2","direction":"up"},{"type":"interval","chord":"G","interval":"M2","direction":"up"},{"type":"interval","chord":"A","interval":"M2","direction":"up"},{"type":"interval","chord":"B","interval":"M2","direction":"up"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-03'),
  'MT-04-03',
  '長2度上（黒鍵）',
  'M2 up (黒鍵)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"Db","interval":"M2","direction":"up"},{"type":"interval","chord":"Eb","interval":"M2","direction":"up"},{"type":"interval","chord":"Gb","interval":"M2","direction":"up"},{"type":"interval","chord":"Ab","interval":"M2","direction":"up"},{"type":"interval","chord":"Bb","interval":"M2","direction":"up"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-04'),
  'MT-04-04',
  '長3度上（CDE）',
  'M3 up (CDE)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"C","interval":"M3","direction":"up"},{"type":"interval","chord":"D","interval":"M3","direction":"up"},{"type":"interval","chord":"E","interval":"M3","direction":"up"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-05'),
  'MT-04-05',
  '長3度上（FGAB）',
  'M3 up (FGAB)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"F","interval":"M3","direction":"up"},{"type":"interval","chord":"G","interval":"M3","direction":"up"},{"type":"interval","chord":"A","interval":"M3","direction":"up"},{"type":"interval","chord":"B","interval":"M3","direction":"up"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-06'),
  'MT-04-06',
  '長3度上（黒鍵）',
  'M3 up (黒鍵)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"Db","interval":"M3","direction":"up"},{"type":"interval","chord":"Eb","interval":"M3","direction":"up"},{"type":"interval","chord":"Gb","interval":"M3","direction":"up"},{"type":"interval","chord":"Ab","interval":"M3","direction":"up"},{"type":"interval","chord":"Bb","interval":"M3","direction":"up"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-07'),
  'MT-04-07',
  '完全4度上（CDE）',
  'P4 up (CDE)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"C","interval":"P4","direction":"up"},{"type":"interval","chord":"D","interval":"P4","direction":"up"},{"type":"interval","chord":"E","interval":"P4","direction":"up"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-08'),
  'MT-04-08',
  '完全4度上（FGAB）',
  'P4 up (FGAB)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"F","interval":"P4","direction":"up"},{"type":"interval","chord":"G","interval":"P4","direction":"up"},{"type":"interval","chord":"A","interval":"P4","direction":"up"},{"type":"interval","chord":"B","interval":"P4","direction":"up"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-09'),
  'MT-04-09',
  '完全4度上（黒鍵）',
  'P4 up (黒鍵)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"Db","interval":"P4","direction":"up"},{"type":"interval","chord":"Eb","interval":"P4","direction":"up"},{"type":"interval","chord":"Gb","interval":"P4","direction":"up"},{"type":"interval","chord":"Ab","interval":"P4","direction":"up"},{"type":"interval","chord":"Bb","interval":"P4","direction":"up"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-10'),
  'MT-04-10',
  '完全5度上（CDE）',
  'P5 up (CDE)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"C","interval":"P5","direction":"up"},{"type":"interval","chord":"D","interval":"P5","direction":"up"},{"type":"interval","chord":"E","interval":"P5","direction":"up"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-11'),
  'MT-04-11',
  '完全5度上（FGAB）',
  'P5 up (FGAB)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"F","interval":"P5","direction":"up"},{"type":"interval","chord":"G","interval":"P5","direction":"up"},{"type":"interval","chord":"A","interval":"P5","direction":"up"},{"type":"interval","chord":"B","interval":"P5","direction":"up"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-12'),
  'MT-04-12',
  '完全5度上（黒鍵）',
  'P5 up (黒鍵)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"Db","interval":"P5","direction":"up"},{"type":"interval","chord":"Eb","interval":"P5","direction":"up"},{"type":"interval","chord":"Gb","interval":"P5","direction":"up"},{"type":"interval","chord":"Ab","interval":"P5","direction":"up"},{"type":"interval","chord":"Bb","interval":"P5","direction":"up"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-13'),
  'MT-04-13',
  '長6度上（CDE）',
  'M6 up (CDE)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"C","interval":"M6","direction":"up"},{"type":"interval","chord":"D","interval":"M6","direction":"up"},{"type":"interval","chord":"E","interval":"M6","direction":"up"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-14'),
  'MT-04-14',
  '長6度上（FGAB）',
  'M6 up (FGAB)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"F","interval":"M6","direction":"up"},{"type":"interval","chord":"G","interval":"M6","direction":"up"},{"type":"interval","chord":"A","interval":"M6","direction":"up"},{"type":"interval","chord":"B","interval":"M6","direction":"up"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-15'),
  'MT-04-15',
  '長6度上（黒鍵）',
  'M6 up (黒鍵)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"Db","interval":"M6","direction":"up"},{"type":"interval","chord":"Eb","interval":"M6","direction":"up"},{"type":"interval","chord":"Gb","interval":"M6","direction":"up"},{"type":"interval","chord":"Ab","interval":"M6","direction":"up"},{"type":"interval","chord":"Bb","interval":"M6","direction":"up"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-16'),
  'MT-04-16',
  '長7度上（CDE）',
  'M7 up (CDE)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"C","interval":"M7","direction":"up"},{"type":"interval","chord":"D","interval":"M7","direction":"up"},{"type":"interval","chord":"E","interval":"M7","direction":"up"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-17'),
  'MT-04-17',
  '長7度上（FGAB）',
  'M7 up (FGAB)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"F","interval":"M7","direction":"up"},{"type":"interval","chord":"G","interval":"M7","direction":"up"},{"type":"interval","chord":"A","interval":"M7","direction":"up"},{"type":"interval","chord":"B","interval":"M7","direction":"up"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-18'),
  'MT-04-18',
  '長7度上（黒鍵）',
  'M7 up (黒鍵)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"Db","interval":"M7","direction":"up"},{"type":"interval","chord":"Eb","interval":"M7","direction":"up"},{"type":"interval","chord":"Gb","interval":"M7","direction":"up"},{"type":"interval","chord":"Ab","interval":"M7","direction":"up"},{"type":"interval","chord":"Bb","interval":"M7","direction":"up"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-01'),
  'MT-05-01',
  '長2度下（CDE）',
  'M2 down (CDE)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"C","interval":"M2","direction":"down"},{"type":"interval","chord":"D","interval":"M2","direction":"down"},{"type":"interval","chord":"E","interval":"M2","direction":"down"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-02'),
  'MT-05-02',
  '長2度下（FGAB）',
  'M2 down (FGAB)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"F","interval":"M2","direction":"down"},{"type":"interval","chord":"G","interval":"M2","direction":"down"},{"type":"interval","chord":"A","interval":"M2","direction":"down"},{"type":"interval","chord":"B","interval":"M2","direction":"down"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-03'),
  'MT-05-03',
  '長2度下（黒鍵）',
  'M2 down (黒鍵)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"Db","interval":"M2","direction":"down"},{"type":"interval","chord":"Eb","interval":"M2","direction":"down"},{"type":"interval","chord":"Gb","interval":"M2","direction":"down"},{"type":"interval","chord":"Ab","interval":"M2","direction":"down"},{"type":"interval","chord":"Bb","interval":"M2","direction":"down"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-04'),
  'MT-05-04',
  '長3度下（CDE）',
  'M3 down (CDE)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"C","interval":"M3","direction":"down"},{"type":"interval","chord":"D","interval":"M3","direction":"down"},{"type":"interval","chord":"E","interval":"M3","direction":"down"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-05'),
  'MT-05-05',
  '長3度下（FGAB）',
  'M3 down (FGAB)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"F","interval":"M3","direction":"down"},{"type":"interval","chord":"G","interval":"M3","direction":"down"},{"type":"interval","chord":"A","interval":"M3","direction":"down"},{"type":"interval","chord":"B","interval":"M3","direction":"down"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-06'),
  'MT-05-06',
  '長3度下（黒鍵）',
  'M3 down (黒鍵)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"Db","interval":"M3","direction":"down"},{"type":"interval","chord":"Eb","interval":"M3","direction":"down"},{"type":"interval","chord":"Gb","interval":"M3","direction":"down"},{"type":"interval","chord":"Ab","interval":"M3","direction":"down"},{"type":"interval","chord":"Bb","interval":"M3","direction":"down"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-07'),
  'MT-05-07',
  '完全4度下（CDE）',
  'P4 down (CDE)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"C","interval":"P4","direction":"down"},{"type":"interval","chord":"D","interval":"P4","direction":"down"},{"type":"interval","chord":"E","interval":"P4","direction":"down"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-08'),
  'MT-05-08',
  '完全4度下（FGAB）',
  'P4 down (FGAB)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"F","interval":"P4","direction":"down"},{"type":"interval","chord":"G","interval":"P4","direction":"down"},{"type":"interval","chord":"A","interval":"P4","direction":"down"},{"type":"interval","chord":"B","interval":"P4","direction":"down"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-09'),
  'MT-05-09',
  '完全4度下（黒鍵）',
  'P4 down (黒鍵)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"Db","interval":"P4","direction":"down"},{"type":"interval","chord":"Eb","interval":"P4","direction":"down"},{"type":"interval","chord":"Gb","interval":"P4","direction":"down"},{"type":"interval","chord":"Ab","interval":"P4","direction":"down"},{"type":"interval","chord":"Bb","interval":"P4","direction":"down"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-10'),
  'MT-05-10',
  '完全5度下（CDE）',
  'P5 down (CDE)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"C","interval":"P5","direction":"down"},{"type":"interval","chord":"D","interval":"P5","direction":"down"},{"type":"interval","chord":"E","interval":"P5","direction":"down"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-11'),
  'MT-05-11',
  '完全5度下（FGAB）',
  'P5 down (FGAB)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"F","interval":"P5","direction":"down"},{"type":"interval","chord":"G","interval":"P5","direction":"down"},{"type":"interval","chord":"A","interval":"P5","direction":"down"},{"type":"interval","chord":"B","interval":"P5","direction":"down"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-12'),
  'MT-05-12',
  '完全5度下（黒鍵）',
  'P5 down (黒鍵)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"Db","interval":"P5","direction":"down"},{"type":"interval","chord":"Eb","interval":"P5","direction":"down"},{"type":"interval","chord":"Gb","interval":"P5","direction":"down"},{"type":"interval","chord":"Ab","interval":"P5","direction":"down"},{"type":"interval","chord":"Bb","interval":"P5","direction":"down"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-13'),
  'MT-05-13',
  '長6度下（CDE）',
  'M6 down (CDE)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"C","interval":"M6","direction":"down"},{"type":"interval","chord":"D","interval":"M6","direction":"down"},{"type":"interval","chord":"E","interval":"M6","direction":"down"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-14'),
  'MT-05-14',
  '長6度下（FGAB）',
  'M6 down (FGAB)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"F","interval":"M6","direction":"down"},{"type":"interval","chord":"G","interval":"M6","direction":"down"},{"type":"interval","chord":"A","interval":"M6","direction":"down"},{"type":"interval","chord":"B","interval":"M6","direction":"down"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-15'),
  'MT-05-15',
  '長6度下（黒鍵）',
  'M6 down (黒鍵)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"Db","interval":"M6","direction":"down"},{"type":"interval","chord":"Eb","interval":"M6","direction":"down"},{"type":"interval","chord":"Gb","interval":"M6","direction":"down"},{"type":"interval","chord":"Ab","interval":"M6","direction":"down"},{"type":"interval","chord":"Bb","interval":"M6","direction":"down"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-16'),
  'MT-05-16',
  '長7度下（CDE）',
  'M7 down (CDE)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"C","interval":"M7","direction":"down"},{"type":"interval","chord":"D","interval":"M7","direction":"down"},{"type":"interval","chord":"E","interval":"M7","direction":"down"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-17'),
  'MT-05-17',
  '長7度下（FGAB）',
  'M7 down (FGAB)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"F","interval":"M7","direction":"down"},{"type":"interval","chord":"G","interval":"M7","direction":"down"},{"type":"interval","chord":"A","interval":"M7","direction":"down"},{"type":"interval","chord":"B","interval":"M7","direction":"down"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-18'),
  'MT-05-18',
  '長7度下（黒鍵）',
  'M7 down (黒鍵)',
  '',
  '',
  10,
  100,
  5,
  'single',
  '[{"type":"interval","chord":"Db","interval":"M7","direction":"down"},{"type":"interval","chord":"Eb","interval":"M7","direction":"down"},{"type":"interval","chord":"Gb","interval":"M7","direction":"down"},{"type":"interval","chord":"Ab","interval":"M7","direction":"down"},{"type":"interval","chord":"Bb","interval":"M7","direction":"down"}]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-06-01'),
  'MT-06-01',
  'メジャースケール（C–F–Bb）',
  'Major scale (C–F–Bb)',
  '',
  '',
  10,
  100,
  6,
  'single',
  '["C major","F major","Bb major"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-06-02'),
  'MT-06-02',
  'メジャースケール（D–G–A）',
  'Major scale (D–G–A)',
  '',
  '',
  10,
  100,
  6,
  'single',
  '["D major","G major","A major"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-06-03'),
  'MT-06-03',
  'メジャースケール（B–E–Gb）',
  'Major scale (B–E–Gb)',
  '',
  '',
  10,
  100,
  6,
  'single',
  '["B major","E major","Gb major"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-06-04'),
  'MT-06-04',
  'メジャースケール（Eb–Ab–Db）',
  'Major scale (Eb–Ab–Db)',
  '',
  '',
  10,
  100,
  6,
  'single',
  '["Eb major","Ab major","Db major"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-06-05'),
  'MT-06-05',
  'メジャースケール（12調すべて）',
  'Major scale (12調すべて)',
  '',
  '',
  10,
  100,
  6,
  'single',
  '["C major","Db major","D major","Eb major","E major","F major","Gb major","G major","Ab major","A major","Bb major","B major"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-07-01'),
  'MT-07-01',
  'ナチュラルマイナー（A–D–G）',
  'Natural minor (A–D–G)',
  '',
  '',
  10,
  100,
  6,
  'single',
  '["A natural_minor","D natural_minor","G natural_minor"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-07-02'),
  'MT-07-02',
  'ナチュラルマイナー（B–E–C#）',
  'Natural minor (B–E–C#)',
  '',
  '',
  10,
  100,
  6,
  'single',
  '["B natural_minor","E natural_minor","C# natural_minor"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-07-03'),
  'MT-07-03',
  'ナチュラルマイナー（G#–C#–Eb）',
  'Natural minor (G#–C#–Eb)',
  '',
  '',
  10,
  100,
  6,
  'single',
  '["G# natural_minor","C# natural_minor","Eb natural_minor"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-07-04'),
  'MT-07-04',
  'ナチュラルマイナー（C–F–Bb）',
  'Natural minor (C–F–Bb)',
  '',
  '',
  10,
  100,
  6,
  'single',
  '["C natural_minor","F natural_minor","Bb natural_minor"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-07-05'),
  'MT-07-05',
  'ナチュラルマイナー（12調すべて）',
  'Natural minor (12調すべて)',
  '',
  '',
  10,
  100,
  6,
  'single',
  '["C natural_minor","Db natural_minor","D natural_minor","Eb natural_minor","E natural_minor","F natural_minor","Gb natural_minor","G natural_minor","Ab natural_minor","A natural_minor","Bb natural_minor","B natural_minor"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-08-01'),
  'MT-08-01',
  'メジャーセブンス（CDE）その1',
  'Major 7th (CDE) · Part 1',
  '',
  '',
  10,
  100,
  5,
  'single',
  '["CM7","DM7","EM7"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-08-02'),
  'MT-08-02',
  'メジャーセブンス（CDE）その2',
  'Major 7th (CDE) · Part 2',
  '',
  '',
  5,
  32,
  5,
  'progression_random',
  '["CM7","DM7","EM7"]'::jsonb,
  '[]'::jsonb,
  false,
  10,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  32,
  1,
  'lesson',
  false,
  false,
  4,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-08-03'),
  'MT-08-03',
  'メジャーセブンス（FGAB）その1',
  'Major 7th (FGAB) · Part 1',
  '',
  '',
  10,
  100,
  5,
  'single',
  '["FM7","GM7","AM7","BM7"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-08-04'),
  'MT-08-04',
  'メジャーセブンス（FGAB）その2',
  'Major 7th (FGAB) · Part 2',
  '',
  '',
  5,
  32,
  5,
  'progression_random',
  '["FM7","GM7","AM7","BM7"]'::jsonb,
  '[]'::jsonb,
  false,
  10,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  32,
  1,
  'lesson',
  false,
  false,
  4,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-08-05'),
  'MT-08-05',
  'メジャーセブンス（黒鍵）その1',
  'Major 7th (黒鍵) · Part 1',
  '',
  '',
  10,
  100,
  5,
  'single',
  '["DbM7","EbM7","GbM7","AbM7","BbM7"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-08-06'),
  'MT-08-06',
  'メジャーセブンス（黒鍵）その2',
  'Major 7th (黒鍵) · Part 2',
  '',
  '',
  5,
  32,
  5,
  'progression_random',
  '["DbM7","EbM7","GbM7","AbM7","BbM7"]'::jsonb,
  '[]'::jsonb,
  false,
  10,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  32,
  1,
  'lesson',
  false,
  false,
  4,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-08-07'),
  'MT-08-07',
  'メジャーセブンス（全ルート）その1',
  'Major 7th (全ルート) · Part 1',
  '',
  '',
  10,
  100,
  5,
  'single',
  '["CM7","DM7","EM7","FM7","GM7","AM7","BM7","DbM7","EbM7","GbM7","AbM7","BbM7"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-08-08'),
  'MT-08-08',
  'メジャーセブンス（全ルート）その2',
  'Major 7th (全ルート) · Part 2',
  '',
  '',
  5,
  32,
  5,
  'progression_random',
  '["CM7","DM7","EM7","FM7","GM7","AM7","BM7","DbM7","EbM7","GbM7","AbM7","BbM7"]'::jsonb,
  '[]'::jsonb,
  false,
  10,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  32,
  1,
  'lesson',
  false,
  false,
  4,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-09-01'),
  'MT-09-01',
  'マイナーセブンス（CDE）その1',
  'Minor 7th (CDE) · Part 1',
  '',
  '',
  10,
  100,
  5,
  'single',
  '["Cm7","Dm7","Em7"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-09-02'),
  'MT-09-02',
  'マイナーセブンス（CDE）その2',
  'Minor 7th (CDE) · Part 2',
  '',
  '',
  5,
  32,
  5,
  'progression_random',
  '["Cm7","Dm7","Em7"]'::jsonb,
  '[]'::jsonb,
  false,
  10,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  32,
  1,
  'lesson',
  false,
  false,
  4,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-09-03'),
  'MT-09-03',
  'マイナーセブンス（FGAB）その1',
  'Minor 7th (FGAB) · Part 1',
  '',
  '',
  10,
  100,
  5,
  'single',
  '["Fm7","Gm7","Am7","Bm7"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-09-04'),
  'MT-09-04',
  'マイナーセブンス（FGAB）その2',
  'Minor 7th (FGAB) · Part 2',
  '',
  '',
  5,
  32,
  5,
  'progression_random',
  '["Fm7","Gm7","Am7","Bm7"]'::jsonb,
  '[]'::jsonb,
  false,
  10,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  32,
  1,
  'lesson',
  false,
  false,
  4,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-09-05'),
  'MT-09-05',
  'マイナーセブンス（C#–Eb–F#–Ab–Bb）その1',
  'Minor 7th (C#–Eb–F#–Ab–Bb) · Part 1',
  '',
  '',
  10,
  100,
  5,
  'single',
  '["C#m7","Ebm7","F#m7","Abm7","Bbm7"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-09-06'),
  'MT-09-06',
  'マイナーセブンス（C#–Eb–F#–Ab–Bb）その2',
  'Minor 7th (C#–Eb–F#–Ab–Bb) · Part 2',
  '',
  '',
  5,
  32,
  5,
  'progression_random',
  '["C#m7","Ebm7","F#m7","Abm7","Bbm7"]'::jsonb,
  '[]'::jsonb,
  false,
  10,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  32,
  1,
  'lesson',
  false,
  false,
  4,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-09-07'),
  'MT-09-07',
  'マイナーセブンス（全ルート）その1',
  'Minor 7th (全ルート) · Part 1',
  '',
  '',
  10,
  100,
  5,
  'single',
  '["Cm7","Dbm7","Dm7","Ebm7","Em7","Fm7","Gbm7","Gm7","Abm7","Am7","Bbm7","Bm7"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-09-08'),
  'MT-09-08',
  'マイナーセブンス（全ルート）その2',
  'Minor 7th (全ルート) · Part 2',
  '',
  '',
  5,
  32,
  5,
  'progression_random',
  '["Cm7","Dbm7","Dm7","Ebm7","Em7","Fm7","Gbm7","Gm7","Abm7","Am7","Bbm7","Bm7"]'::jsonb,
  '[]'::jsonb,
  false,
  10,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  32,
  1,
  'lesson',
  false,
  false,
  4,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-10-01'),
  'MT-10-01',
  'ドミナントセブンス（CDE）その1',
  'Dominant 7th (CDE) · Part 1',
  '',
  '',
  10,
  100,
  5,
  'single',
  '["C7","D7","E7"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-10-02'),
  'MT-10-02',
  'ドミナントセブンス（CDE）その2',
  'Dominant 7th (CDE) · Part 2',
  '',
  '',
  5,
  32,
  5,
  'progression_random',
  '["C7","D7","E7"]'::jsonb,
  '[]'::jsonb,
  false,
  10,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  32,
  1,
  'lesson',
  false,
  false,
  4,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-10-03'),
  'MT-10-03',
  'ドミナントセブンス（FGAB）その1',
  'Dominant 7th (FGAB) · Part 1',
  '',
  '',
  10,
  100,
  5,
  'single',
  '["F7","G7","A7","B7"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-10-04'),
  'MT-10-04',
  'ドミナントセブンス（FGAB）その2',
  'Dominant 7th (FGAB) · Part 2',
  '',
  '',
  5,
  32,
  5,
  'progression_random',
  '["F7","G7","A7","B7"]'::jsonb,
  '[]'::jsonb,
  false,
  10,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  32,
  1,
  'lesson',
  false,
  false,
  4,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-10-05'),
  'MT-10-05',
  'ドミナントセブンス（黒鍵）その1',
  'Dominant 7th (黒鍵) · Part 1',
  '',
  '',
  10,
  100,
  5,
  'single',
  '["Db7","Eb7","Gb7","Ab7","Bb7"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-10-06'),
  'MT-10-06',
  'ドミナントセブンス（黒鍵）その2',
  'Dominant 7th (黒鍵) · Part 2',
  '',
  '',
  5,
  32,
  5,
  'progression_random',
  '["Db7","Eb7","Gb7","Ab7","Bb7"]'::jsonb,
  '[]'::jsonb,
  false,
  10,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  32,
  1,
  'lesson',
  false,
  false,
  4,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-10-07'),
  'MT-10-07',
  'ドミナントセブンス（全ルート）その1',
  'Dominant 7th (全ルート) · Part 1',
  '',
  '',
  10,
  100,
  5,
  'single',
  '["C7","D7","E7","F7","G7","A7","B7","Db7","Eb7","Gb7","Ab7","Bb7"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-10-08'),
  'MT-10-08',
  'ドミナントセブンス（全ルート）その2',
  'Dominant 7th (全ルート) · Part 2',
  '',
  '',
  5,
  32,
  5,
  'progression_random',
  '["C7","D7","E7","F7","G7","A7","B7","Db7","Eb7","Gb7","Ab7","Bb7"]'::jsonb,
  '[]'::jsonb,
  false,
  10,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  32,
  1,
  'lesson',
  false,
  false,
  4,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-11-01'),
  'MT-11-01',
  'ハーフディミニッシュ（CDE）その1',
  'Half-diminished (CDE) · Part 1',
  '',
  '',
  10,
  100,
  5,
  'single',
  '["Cm7b5","Dm7b5","Em7b5"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-11-02'),
  'MT-11-02',
  'ハーフディミニッシュ（CDE）その2',
  'Half-diminished (CDE) · Part 2',
  '',
  '',
  5,
  32,
  5,
  'progression_random',
  '["Cm7b5","Dm7b5","Em7b5"]'::jsonb,
  '[]'::jsonb,
  false,
  10,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  32,
  1,
  'lesson',
  false,
  false,
  4,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-11-03'),
  'MT-11-03',
  'ハーフディミニッシュ（FGAB）その1',
  'Half-diminished (FGAB) · Part 1',
  '',
  '',
  10,
  100,
  5,
  'single',
  '["Fm7b5","Gm7b5","Am7b5","Bm7b5"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-11-04'),
  'MT-11-04',
  'ハーフディミニッシュ（FGAB）その2',
  'Half-diminished (FGAB) · Part 2',
  '',
  '',
  5,
  32,
  5,
  'progression_random',
  '["Fm7b5","Gm7b5","Am7b5","Bm7b5"]'::jsonb,
  '[]'::jsonb,
  false,
  10,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  32,
  1,
  'lesson',
  false,
  false,
  4,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-11-05'),
  'MT-11-05',
  'ハーフディミニッシュ（C#–Eb–F#–Ab–Bb）その1',
  'Half-diminished (C#–Eb–F#–Ab–Bb) · Part 1',
  '',
  '',
  10,
  100,
  5,
  'single',
  '["C#m7b5","Ebm7b5","F#m7b5","Abm7b5","Bbm7b5"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-11-06'),
  'MT-11-06',
  'ハーフディミニッシュ（C#–Eb–F#–Ab–Bb）その2',
  'Half-diminished (C#–Eb–F#–Ab–Bb) · Part 2',
  '',
  '',
  5,
  32,
  5,
  'progression_random',
  '["C#m7b5","Ebm7b5","F#m7b5","Abm7b5","Bbm7b5"]'::jsonb,
  '[]'::jsonb,
  false,
  10,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  32,
  1,
  'lesson',
  false,
  false,
  4,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-11-07'),
  'MT-11-07',
  'ハーフディミニッシュ（全ルート）その1',
  'Half-diminished (全ルート) · Part 1',
  '',
  '',
  10,
  100,
  5,
  'single',
  '["Cm7b5","Dbm7b5","Dm7b5","Ebm7b5","Em7b5","Fm7b5","Gbm7b5","Gm7b5","Abm7b5","Am7b5","Bbm7b5","Bm7b5"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-11-08'),
  'MT-11-08',
  'ハーフディミニッシュ（全ルート）その2',
  'Half-diminished (全ルート) · Part 2',
  '',
  '',
  5,
  32,
  5,
  'progression_random',
  '["Cm7b5","Dbm7b5","Dm7b5","Ebm7b5","Em7b5","Fm7b5","Gbm7b5","Gm7b5","Abm7b5","Am7b5","Bbm7b5","Bm7b5"]'::jsonb,
  '[]'::jsonb,
  false,
  10,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  32,
  1,
  'lesson',
  false,
  false,
  4,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-12-01'),
  'MT-12-01',
  '基本4和音まとめ（CDE）・シングル',
  'Four-part basics (CDE) · Single',
  '',
  '',
  10,
  100,
  5,
  'single',
  '["CM7","Cm7","C7","Cm7b5","DM7","Dm7","D7","Dm7b5","EM7","Em7","E7","Em7b5"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-12-02'),
  'MT-12-02',
  '基本4和音まとめ（CDE）その2',
  'Four-part basics (CDE) · Part 2',
  '',
  '',
  5,
  32,
  5,
  'progression_random',
  '["CM7","Cm7","C7","Cm7b5","DM7","Dm7","D7","Dm7b5","EM7","Em7","E7","Em7b5"]'::jsonb,
  '[]'::jsonb,
  false,
  10,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  32,
  1,
  'lesson',
  false,
  false,
  4,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-12-03'),
  'MT-12-03',
  '基本4和音まとめ（FGAB）・シングル',
  'Four-part basics (FGAB) · Single',
  '',
  '',
  10,
  100,
  5,
  'single',
  '["FM7","Fm7","F7","Fm7b5","GM7","Gm7","G7","Gm7b5","AM7","Am7","A7","Am7b5","BM7","Bm7","B7","Bm7b5"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-12-04'),
  'MT-12-04',
  '基本4和音まとめ（FGAB）その2',
  'Four-part basics (FGAB) · Part 2',
  '',
  '',
  5,
  32,
  5,
  'progression_random',
  '["FM7","Fm7","F7","Fm7b5","GM7","Gm7","G7","Gm7b5","AM7","Am7","A7","Am7b5","BM7","Bm7","B7","Bm7b5"]'::jsonb,
  '[]'::jsonb,
  false,
  10,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  32,
  1,
  'lesson',
  false,
  false,
  4,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-12-05'),
  'MT-12-05',
  '基本4和音まとめ（C#–Eb–F#–Ab–Bb）・シングル',
  'Four-part basics (C#–Eb–F#–Ab–Bb) · Single',
  '',
  '',
  10,
  100,
  5,
  'single',
  '["C#M7","C#m7","C#7","C#m7b5","EbM7","Ebm7","Eb7","Ebm7b5","F#M7","F#m7","F#7","F#m7b5","AbM7","Abm7","Ab7","Abm7b5","BbM7","Bbm7","Bb7","Bbm7b5"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-12-06'),
  'MT-12-06',
  '基本4和音まとめ（C#–Eb–F#–Ab–Bb）その2',
  'Four-part basics (C#–Eb–F#–Ab–Bb) · Part 2',
  '',
  '',
  5,
  32,
  5,
  'progression_random',
  '["C#M7","C#m7","C#7","C#m7b5","EbM7","Ebm7","Eb7","Ebm7b5","F#M7","F#m7","F#7","F#m7b5","AbM7","Abm7","Ab7","Abm7b5","BbM7","Bbm7","Bb7","Bbm7b5"]'::jsonb,
  '[]'::jsonb,
  false,
  10,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  32,
  1,
  'lesson',
  false,
  false,
  4,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-12-07'),
  'MT-12-07',
  '基本4和音まとめ（全ルート）・シングル',
  'Four-part basics (全ルート) · Single',
  '',
  '',
  10,
  100,
  5,
  'single',
  '["CM7","Cm7","C7","Cm7b5","DbM7","Dbm7","Db7","Dbm7b5","DM7","Dm7","D7","Dm7b5","EbM7","Ebm7","Eb7","Ebm7b5","EM7","Em7","E7","Em7b5","FM7","Fm7","F7","Fm7b5","GbM7","Gbm7","Gb7","Gbm7b5","GM7","Gm7","G7","Gm7b5","AbM7","Abm7","Ab7","Abm7b5","AM7","Am7","A7","Am7b5","BbM7","Bbm7","Bb7","Bbm7b5","BM7","Bm7","B7","Bm7b5"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-12-08'),
  'MT-12-08',
  '基本4和音まとめ（全ルート）その2',
  'Four-part basics (全ルート) · Part 2',
  '',
  '',
  5,
  32,
  5,
  'progression_random',
  '["CM7","Cm7","C7","Cm7b5","DbM7","Dbm7","Db7","Dbm7b5","DM7","Dm7","D7","Dm7b5","EbM7","Ebm7","Eb7","Ebm7b5","EM7","Em7","E7","Em7b5","FM7","Fm7","F7","Fm7b5","GbM7","Gbm7","Gb7","Gbm7b5","GM7","Gm7","G7","Gm7b5","AbM7","Abm7","Ab7","Abm7b5","AM7","Am7","A7","Am7b5","BbM7","Bbm7","Bb7","Bbm7b5","BM7","Bm7","B7","Bm7b5"]'::jsonb,
  '[]'::jsonb,
  false,
  10,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  32,
  1,
  'lesson',
  false,
  false,
  4,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-13-01'),
  'MT-13-01',
  'ハーモニックマイナー（A–D–G）',
  'Harmonic minor (A–D–G)',
  '',
  '',
  10,
  100,
  6,
  'single',
  '["A harmonic_minor","D harmonic_minor","G harmonic_minor"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-13-02'),
  'MT-13-02',
  'ハーモニックマイナー（B–E–C#）',
  'Harmonic minor (B–E–C#)',
  '',
  '',
  10,
  100,
  6,
  'single',
  '["B harmonic_minor","E harmonic_minor","C# harmonic_minor"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-13-03'),
  'MT-13-03',
  'ハーモニックマイナー（G#–C#–Eb）',
  'Harmonic minor (G#–C#–Eb)',
  '',
  '',
  10,
  100,
  6,
  'single',
  '["G# harmonic_minor","C# harmonic_minor","Eb harmonic_minor"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-13-04'),
  'MT-13-04',
  'ハーモニックマイナー（C–F–Bb）',
  'Harmonic minor (C–F–Bb)',
  '',
  '',
  10,
  100,
  6,
  'single',
  '["C harmonic_minor","F harmonic_minor","Bb harmonic_minor"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);

INSERT INTO public.fantasy_stages (
  id, stage_number, name, name_en, description, description_en,
  max_hp, question_count, enemy_gauge_seconds, mode,
  allowed_chords, chord_progression, show_guide,
  enemy_count, enemy_hp, min_damage, max_damage,
  simultaneous_monster_count, play_root_on_correct, stage_tier,
  bpm, time_signature, measure_count, count_in_measures,
  usage_type, is_sheet_music_mode, is_auftakt,
  note_interval_beats,
  bgm_url, mp3_url
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-13-05'),
  'MT-13-05',
  'ハーモニックマイナー（12調すべて）',
  'Harmonic minor (12調すべて)',
  '',
  '',
  10,
  100,
  6,
  'single',
  '["C harmonic_minor","Db harmonic_minor","D harmonic_minor","Eb harmonic_minor","E harmonic_minor","F harmonic_minor","Gb harmonic_minor","G harmonic_minor","Ab harmonic_minor","A harmonic_minor","Bb harmonic_minor","B harmonic_minor"]'::jsonb,
  '[]'::jsonb,
  false,
  30,
  100,
  25,
  40,
  1,
  true,
  'basic',
  108,
  4,
  8,
  0,
  'lesson',
  false,
  false,
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3',
  'https://jazzify-cdn.com/fantasy-bgm/7fd0cd0b-8bad-4807-b855-5930cbdcf934.mp3'
);


INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-000'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャートライアド（CDE）その1',
  'Major triads (CDE) · Part 1',
  '',
  '',
  0,
  1,
  'ブロック1',
  'Block 1',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-000'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-000'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-01-01'),
  'メジャートライアド（CDE）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-001'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャートライアド（CDE）その2',
  'Major triads (CDE) · Part 2',
  '',
  '',
  1,
  1,
  'ブロック1',
  'Block 1',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-001'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-001'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-01-02'),
  'メジャートライアド（CDE）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-002'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャートライアド（FGAB）その1',
  'Major triads (FGAB) · Part 1',
  '',
  '',
  2,
  1,
  'ブロック1',
  'Block 1',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-002'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-002'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-01-03'),
  'メジャートライアド（FGAB）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-003'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャートライアド（FGAB）その2',
  'Major triads (FGAB) · Part 2',
  '',
  '',
  3,
  1,
  'ブロック1',
  'Block 1',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-003'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-003'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-01-04'),
  'メジャートライアド（FGAB）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-004'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャートライアド（黒鍵）その1',
  'Major triads (黒鍵) · Part 1',
  '',
  '',
  4,
  1,
  'ブロック1',
  'Block 1',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-004'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-004'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-01-05'),
  'メジャートライアド（黒鍵）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-005'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャートライアド（黒鍵）その2',
  'Major triads (黒鍵) · Part 2',
  '',
  '',
  5,
  1,
  'ブロック1',
  'Block 1',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-005'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-005'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-01-06'),
  'メジャートライアド（黒鍵）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-006'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャートライアド（全ルート）その1',
  'Major triads (全ルート) · Part 1',
  '',
  '',
  6,
  1,
  'ブロック1',
  'Block 1',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-006'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-006'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-01-07'),
  'メジャートライアド（全ルート）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-007'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャートライアド（全ルート）その2',
  'Major triads (全ルート) · Part 2',
  '',
  '',
  7,
  1,
  'ブロック1',
  'Block 1',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-007'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-007'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-01-08'),
  'メジャートライアド（全ルート）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-008'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'マイナートライアド（CDE）その1',
  'Minor triads (CDE) · Part 1',
  '',
  '',
  8,
  2,
  'ブロック2',
  'Block 2',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-008'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-008'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-02-01'),
  'マイナートライアド（CDE）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-009'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'マイナートライアド（CDE）その2',
  'Minor triads (CDE) · Part 2',
  '',
  '',
  9,
  2,
  'ブロック2',
  'Block 2',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-009'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-009'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-02-02'),
  'マイナートライアド（CDE）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-010'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'マイナートライアド（FGAB）その1',
  'Minor triads (FGAB) · Part 1',
  '',
  '',
  10,
  2,
  'ブロック2',
  'Block 2',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-010'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-010'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-02-03'),
  'マイナートライアド（FGAB）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-011'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'マイナートライアド（FGAB）その2',
  'Minor triads (FGAB) · Part 2',
  '',
  '',
  11,
  2,
  'ブロック2',
  'Block 2',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-011'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-011'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-02-04'),
  'マイナートライアド（FGAB）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-012'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'マイナートライアド（C#–Eb–F#–Ab–Bb）その1',
  'Minor triads (C#–Eb–F#–Ab–Bb) · Part 1',
  '',
  '',
  12,
  2,
  'ブロック2',
  'Block 2',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-012'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-012'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-02-05'),
  'マイナートライアド（C#–Eb–F#–Ab–Bb）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-013'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'マイナートライアド（C#–Eb–F#–Ab–Bb）その2',
  'Minor triads (C#–Eb–F#–Ab–Bb) · Part 2',
  '',
  '',
  13,
  2,
  'ブロック2',
  'Block 2',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-013'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-013'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-02-06'),
  'マイナートライアド（C#–Eb–F#–Ab–Bb）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-014'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'マイナートライアド（全ルート）その1',
  'Minor triads (全ルート) · Part 1',
  '',
  '',
  14,
  2,
  'ブロック2',
  'Block 2',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-014'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-014'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-02-07'),
  'マイナートライアド（全ルート）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-015'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'マイナートライアド（全ルート）その2',
  'Minor triads (全ルート) · Part 2',
  '',
  '',
  15,
  2,
  'ブロック2',
  'Block 2',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-015'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-015'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-02-08'),
  'マイナートライアド（全ルート）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-016'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャー/マイナー混合（CDE）その1',
  'Major/Minor mix (CDE) · Part 1',
  '',
  '',
  16,
  3,
  'ブロック3',
  'Block 3',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-016'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-016'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-03-01'),
  'メジャー/マイナー混合（CDE）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-017'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャー/マイナー混合（CDE）その2',
  'Major/Minor mix (CDE) · Part 2',
  '',
  '',
  17,
  3,
  'ブロック3',
  'Block 3',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-017'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-017'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-03-02'),
  'メジャー/マイナー混合（CDE）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-018'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャー/マイナー混合（FGAB）その1',
  'Major/Minor mix (FGAB) · Part 1',
  '',
  '',
  18,
  3,
  'ブロック3',
  'Block 3',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-018'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-018'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-03-03'),
  'メジャー/マイナー混合（FGAB）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-019'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャー/マイナー混合（FGAB）その2',
  'Major/Minor mix (FGAB) · Part 2',
  '',
  '',
  19,
  3,
  'ブロック3',
  'Block 3',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-019'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-019'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-03-04'),
  'メジャー/マイナー混合（FGAB）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-020'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャー/マイナー混合（黒鍵混合）その1',
  'Major/Minor mix (黒鍵混合) · Part 1',
  '',
  '',
  20,
  3,
  'ブロック3',
  'Block 3',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-020'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-020'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-03-05'),
  'メジャー/マイナー混合（黒鍵混合）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-021'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャー/マイナー混合（黒鍵混合）その2',
  'Major/Minor mix (黒鍵混合) · Part 2',
  '',
  '',
  21,
  3,
  'ブロック3',
  'Block 3',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-021'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-021'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-03-06'),
  'メジャー/マイナー混合（黒鍵混合）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-022'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャー/マイナー混合（全ルート）その1',
  'Major/Minor mix (全ルート) · Part 1',
  '',
  '',
  22,
  3,
  'ブロック3',
  'Block 3',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-022'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-022'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-03-07'),
  'メジャー/マイナー混合（全ルート）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-023'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャー/マイナー混合（全ルート）その2',
  'Major/Minor mix (全ルート) · Part 2',
  '',
  '',
  23,
  3,
  'ブロック3',
  'Block 3',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-023'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-023'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-03-08'),
  'メジャー/マイナー混合（全ルート）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-024'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長2度上（CDE）',
  'M2 up (CDE)',
  '',
  '',
  24,
  4,
  'ブロック4',
  'Block 4',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-024'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-024'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-01'),
  '長2度上（CDE）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-025'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長2度上（FGAB）',
  'M2 up (FGAB)',
  '',
  '',
  25,
  4,
  'ブロック4',
  'Block 4',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-025'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-025'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-02'),
  '長2度上（FGAB）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-026'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長2度上（黒鍵）',
  'M2 up (黒鍵)',
  '',
  '',
  26,
  4,
  'ブロック4',
  'Block 4',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-026'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-026'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-03'),
  '長2度上（黒鍵）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-027'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長3度上（CDE）',
  'M3 up (CDE)',
  '',
  '',
  27,
  4,
  'ブロック4',
  'Block 4',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-027'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-027'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-04'),
  '長3度上（CDE）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-028'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長3度上（FGAB）',
  'M3 up (FGAB)',
  '',
  '',
  28,
  4,
  'ブロック4',
  'Block 4',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-028'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-028'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-05'),
  '長3度上（FGAB）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-029'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長3度上（黒鍵）',
  'M3 up (黒鍵)',
  '',
  '',
  29,
  4,
  'ブロック4',
  'Block 4',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-029'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-029'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-06'),
  '長3度上（黒鍵）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-030'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '完全4度上（CDE）',
  'P4 up (CDE)',
  '',
  '',
  30,
  4,
  'ブロック4',
  'Block 4',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-030'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-030'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-07'),
  '完全4度上（CDE）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-031'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '完全4度上（FGAB）',
  'P4 up (FGAB)',
  '',
  '',
  31,
  4,
  'ブロック4',
  'Block 4',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-031'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-031'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-08'),
  '完全4度上（FGAB）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-032'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '完全4度上（黒鍵）',
  'P4 up (黒鍵)',
  '',
  '',
  32,
  4,
  'ブロック4',
  'Block 4',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-032'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-032'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-09'),
  '完全4度上（黒鍵）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-033'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '完全5度上（CDE）',
  'P5 up (CDE)',
  '',
  '',
  33,
  4,
  'ブロック4',
  'Block 4',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-033'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-033'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-10'),
  '完全5度上（CDE）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-034'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '完全5度上（FGAB）',
  'P5 up (FGAB)',
  '',
  '',
  34,
  4,
  'ブロック4',
  'Block 4',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-034'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-034'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-11'),
  '完全5度上（FGAB）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-035'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '完全5度上（黒鍵）',
  'P5 up (黒鍵)',
  '',
  '',
  35,
  4,
  'ブロック4',
  'Block 4',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-035'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-035'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-12'),
  '完全5度上（黒鍵）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-036'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長6度上（CDE）',
  'M6 up (CDE)',
  '',
  '',
  36,
  4,
  'ブロック4',
  'Block 4',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-036'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-036'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-13'),
  '長6度上（CDE）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-037'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長6度上（FGAB）',
  'M6 up (FGAB)',
  '',
  '',
  37,
  4,
  'ブロック4',
  'Block 4',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-037'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-037'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-14'),
  '長6度上（FGAB）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-038'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長6度上（黒鍵）',
  'M6 up (黒鍵)',
  '',
  '',
  38,
  4,
  'ブロック4',
  'Block 4',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-038'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-038'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-15'),
  '長6度上（黒鍵）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-039'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長7度上（CDE）',
  'M7 up (CDE)',
  '',
  '',
  39,
  4,
  'ブロック4',
  'Block 4',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-039'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-039'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-16'),
  '長7度上（CDE）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-040'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長7度上（FGAB）',
  'M7 up (FGAB)',
  '',
  '',
  40,
  4,
  'ブロック4',
  'Block 4',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-040'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-040'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-17'),
  '長7度上（FGAB）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-041'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長7度上（黒鍵）',
  'M7 up (黒鍵)',
  '',
  '',
  41,
  4,
  'ブロック4',
  'Block 4',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-041'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-041'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-04-18'),
  '長7度上（黒鍵）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-042'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長2度下（CDE）',
  'M2 down (CDE)',
  '',
  '',
  42,
  5,
  'ブロック5',
  'Block 5',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-042'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-042'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-01'),
  '長2度下（CDE）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-043'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長2度下（FGAB）',
  'M2 down (FGAB)',
  '',
  '',
  43,
  5,
  'ブロック5',
  'Block 5',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-043'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-043'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-02'),
  '長2度下（FGAB）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-044'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長2度下（黒鍵）',
  'M2 down (黒鍵)',
  '',
  '',
  44,
  5,
  'ブロック5',
  'Block 5',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-044'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-044'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-03'),
  '長2度下（黒鍵）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-045'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長3度下（CDE）',
  'M3 down (CDE)',
  '',
  '',
  45,
  5,
  'ブロック5',
  'Block 5',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-045'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-045'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-04'),
  '長3度下（CDE）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-046'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長3度下（FGAB）',
  'M3 down (FGAB)',
  '',
  '',
  46,
  5,
  'ブロック5',
  'Block 5',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-046'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-046'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-05'),
  '長3度下（FGAB）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-047'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長3度下（黒鍵）',
  'M3 down (黒鍵)',
  '',
  '',
  47,
  5,
  'ブロック5',
  'Block 5',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-047'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-047'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-06'),
  '長3度下（黒鍵）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-048'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '完全4度下（CDE）',
  'P4 down (CDE)',
  '',
  '',
  48,
  5,
  'ブロック5',
  'Block 5',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-048'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-048'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-07'),
  '完全4度下（CDE）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-049'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '完全4度下（FGAB）',
  'P4 down (FGAB)',
  '',
  '',
  49,
  5,
  'ブロック5',
  'Block 5',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-049'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-049'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-08'),
  '完全4度下（FGAB）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-050'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '完全4度下（黒鍵）',
  'P4 down (黒鍵)',
  '',
  '',
  50,
  5,
  'ブロック5',
  'Block 5',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-050'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-050'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-09'),
  '完全4度下（黒鍵）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-051'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '完全5度下（CDE）',
  'P5 down (CDE)',
  '',
  '',
  51,
  5,
  'ブロック5',
  'Block 5',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-051'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-051'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-10'),
  '完全5度下（CDE）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-052'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '完全5度下（FGAB）',
  'P5 down (FGAB)',
  '',
  '',
  52,
  5,
  'ブロック5',
  'Block 5',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-052'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-052'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-11'),
  '完全5度下（FGAB）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-053'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '完全5度下（黒鍵）',
  'P5 down (黒鍵)',
  '',
  '',
  53,
  5,
  'ブロック5',
  'Block 5',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-053'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-053'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-12'),
  '完全5度下（黒鍵）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-054'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長6度下（CDE）',
  'M6 down (CDE)',
  '',
  '',
  54,
  5,
  'ブロック5',
  'Block 5',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-054'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-054'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-13'),
  '長6度下（CDE）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-055'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長6度下（FGAB）',
  'M6 down (FGAB)',
  '',
  '',
  55,
  5,
  'ブロック5',
  'Block 5',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-055'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-055'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-14'),
  '長6度下（FGAB）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-056'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長6度下（黒鍵）',
  'M6 down (黒鍵)',
  '',
  '',
  56,
  5,
  'ブロック5',
  'Block 5',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-056'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-056'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-15'),
  '長6度下（黒鍵）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-057'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長7度下（CDE）',
  'M7 down (CDE)',
  '',
  '',
  57,
  5,
  'ブロック5',
  'Block 5',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-057'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-057'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-16'),
  '長7度下（CDE）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-058'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長7度下（FGAB）',
  'M7 down (FGAB)',
  '',
  '',
  58,
  5,
  'ブロック5',
  'Block 5',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-058'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-058'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-17'),
  '長7度下（FGAB）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-059'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '長7度下（黒鍵）',
  'M7 down (黒鍵)',
  '',
  '',
  59,
  5,
  'ブロック5',
  'Block 5',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-059'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-059'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-05-18'),
  '長7度下（黒鍵）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-060'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャースケール（C–F–Bb）',
  'Major scale (C–F–Bb)',
  '',
  '',
  60,
  6,
  'ブロック6',
  'Block 6',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-060'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-060'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-06-01'),
  'メジャースケール（C–F–Bb）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-061'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャースケール（D–G–A）',
  'Major scale (D–G–A)',
  '',
  '',
  61,
  6,
  'ブロック6',
  'Block 6',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-061'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-061'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-06-02'),
  'メジャースケール（D–G–A）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-062'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャースケール（B–E–Gb）',
  'Major scale (B–E–Gb)',
  '',
  '',
  62,
  6,
  'ブロック6',
  'Block 6',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-062'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-062'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-06-03'),
  'メジャースケール（B–E–Gb）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-063'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャースケール（Eb–Ab–Db）',
  'Major scale (Eb–Ab–Db)',
  '',
  '',
  63,
  6,
  'ブロック6',
  'Block 6',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-063'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-063'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-06-04'),
  'メジャースケール（Eb–Ab–Db）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-064'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャースケール（12調すべて）',
  'Major scale (12調すべて)',
  '',
  '',
  64,
  6,
  'ブロック6',
  'Block 6',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-064'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-064'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-06-05'),
  'メジャースケール（12調すべて）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-065'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ナチュラルマイナー（A–D–G）',
  'Natural minor (A–D–G)',
  '',
  '',
  65,
  7,
  'ブロック7',
  'Block 7',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-065'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-065'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-07-01'),
  'ナチュラルマイナー（A–D–G）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-066'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ナチュラルマイナー（B–E–C#）',
  'Natural minor (B–E–C#)',
  '',
  '',
  66,
  7,
  'ブロック7',
  'Block 7',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-066'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-066'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-07-02'),
  'ナチュラルマイナー（B–E–C#）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-067'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ナチュラルマイナー（G#–C#–Eb）',
  'Natural minor (G#–C#–Eb)',
  '',
  '',
  67,
  7,
  'ブロック7',
  'Block 7',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-067'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-067'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-07-03'),
  'ナチュラルマイナー（G#–C#–Eb）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-068'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ナチュラルマイナー（C–F–Bb）',
  'Natural minor (C–F–Bb)',
  '',
  '',
  68,
  7,
  'ブロック7',
  'Block 7',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-068'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-068'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-07-04'),
  'ナチュラルマイナー（C–F–Bb）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-069'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ナチュラルマイナー（12調すべて）',
  'Natural minor (12調すべて)',
  '',
  '',
  69,
  7,
  'ブロック7',
  'Block 7',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-069'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-069'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-07-05'),
  'ナチュラルマイナー（12調すべて）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-070'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャーセブンス（CDE）その1',
  'Major 7th (CDE) · Part 1',
  '',
  '',
  70,
  8,
  'ブロック8',
  'Block 8',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-070'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-070'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-08-01'),
  'メジャーセブンス（CDE）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-071'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャーセブンス（CDE）その2',
  'Major 7th (CDE) · Part 2',
  '',
  '',
  71,
  8,
  'ブロック8',
  'Block 8',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-071'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-071'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-08-02'),
  'メジャーセブンス（CDE）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-072'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャーセブンス（FGAB）その1',
  'Major 7th (FGAB) · Part 1',
  '',
  '',
  72,
  8,
  'ブロック8',
  'Block 8',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-072'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-072'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-08-03'),
  'メジャーセブンス（FGAB）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-073'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャーセブンス（FGAB）その2',
  'Major 7th (FGAB) · Part 2',
  '',
  '',
  73,
  8,
  'ブロック8',
  'Block 8',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-073'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-073'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-08-04'),
  'メジャーセブンス（FGAB）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-074'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャーセブンス（黒鍵）その1',
  'Major 7th (黒鍵) · Part 1',
  '',
  '',
  74,
  8,
  'ブロック8',
  'Block 8',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-074'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-074'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-08-05'),
  'メジャーセブンス（黒鍵）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-075'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャーセブンス（黒鍵）その2',
  'Major 7th (黒鍵) · Part 2',
  '',
  '',
  75,
  8,
  'ブロック8',
  'Block 8',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-075'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-075'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-08-06'),
  'メジャーセブンス（黒鍵）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-076'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャーセブンス（全ルート）その1',
  'Major 7th (全ルート) · Part 1',
  '',
  '',
  76,
  8,
  'ブロック8',
  'Block 8',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-076'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-076'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-08-07'),
  'メジャーセブンス（全ルート）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-077'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'メジャーセブンス（全ルート）その2',
  'Major 7th (全ルート) · Part 2',
  '',
  '',
  77,
  8,
  'ブロック8',
  'Block 8',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-077'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-077'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-08-08'),
  'メジャーセブンス（全ルート）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-078'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'マイナーセブンス（CDE）その1',
  'Minor 7th (CDE) · Part 1',
  '',
  '',
  78,
  9,
  'ブロック9',
  'Block 9',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-078'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-078'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-09-01'),
  'マイナーセブンス（CDE）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-079'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'マイナーセブンス（CDE）その2',
  'Minor 7th (CDE) · Part 2',
  '',
  '',
  79,
  9,
  'ブロック9',
  'Block 9',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-079'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-079'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-09-02'),
  'マイナーセブンス（CDE）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-080'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'マイナーセブンス（FGAB）その1',
  'Minor 7th (FGAB) · Part 1',
  '',
  '',
  80,
  9,
  'ブロック9',
  'Block 9',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-080'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-080'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-09-03'),
  'マイナーセブンス（FGAB）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-081'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'マイナーセブンス（FGAB）その2',
  'Minor 7th (FGAB) · Part 2',
  '',
  '',
  81,
  9,
  'ブロック9',
  'Block 9',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-081'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-081'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-09-04'),
  'マイナーセブンス（FGAB）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-082'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'マイナーセブンス（C#–Eb–F#–Ab–Bb）その1',
  'Minor 7th (C#–Eb–F#–Ab–Bb) · Part 1',
  '',
  '',
  82,
  9,
  'ブロック9',
  'Block 9',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-082'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-082'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-09-05'),
  'マイナーセブンス（C#–Eb–F#–Ab–Bb）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-083'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'マイナーセブンス（C#–Eb–F#–Ab–Bb）その2',
  'Minor 7th (C#–Eb–F#–Ab–Bb) · Part 2',
  '',
  '',
  83,
  9,
  'ブロック9',
  'Block 9',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-083'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-083'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-09-06'),
  'マイナーセブンス（C#–Eb–F#–Ab–Bb）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-084'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'マイナーセブンス（全ルート）その1',
  'Minor 7th (全ルート) · Part 1',
  '',
  '',
  84,
  9,
  'ブロック9',
  'Block 9',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-084'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-084'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-09-07'),
  'マイナーセブンス（全ルート）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-085'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'マイナーセブンス（全ルート）その2',
  'Minor 7th (全ルート) · Part 2',
  '',
  '',
  85,
  9,
  'ブロック9',
  'Block 9',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-085'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-085'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-09-08'),
  'マイナーセブンス（全ルート）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-086'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ドミナントセブンス（CDE）その1',
  'Dominant 7th (CDE) · Part 1',
  '',
  '',
  86,
  10,
  'ブロック10',
  'Block 10',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-086'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-086'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-10-01'),
  'ドミナントセブンス（CDE）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-087'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ドミナントセブンス（CDE）その2',
  'Dominant 7th (CDE) · Part 2',
  '',
  '',
  87,
  10,
  'ブロック10',
  'Block 10',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-087'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-087'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-10-02'),
  'ドミナントセブンス（CDE）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-088'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ドミナントセブンス（FGAB）その1',
  'Dominant 7th (FGAB) · Part 1',
  '',
  '',
  88,
  10,
  'ブロック10',
  'Block 10',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-088'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-088'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-10-03'),
  'ドミナントセブンス（FGAB）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-089'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ドミナントセブンス（FGAB）その2',
  'Dominant 7th (FGAB) · Part 2',
  '',
  '',
  89,
  10,
  'ブロック10',
  'Block 10',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-089'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-089'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-10-04'),
  'ドミナントセブンス（FGAB）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-090'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ドミナントセブンス（黒鍵）その1',
  'Dominant 7th (黒鍵) · Part 1',
  '',
  '',
  90,
  10,
  'ブロック10',
  'Block 10',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-090'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-090'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-10-05'),
  'ドミナントセブンス（黒鍵）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-091'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ドミナントセブンス（黒鍵）その2',
  'Dominant 7th (黒鍵) · Part 2',
  '',
  '',
  91,
  10,
  'ブロック10',
  'Block 10',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-091'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-091'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-10-06'),
  'ドミナントセブンス（黒鍵）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-092'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ドミナントセブンス（全ルート）その1',
  'Dominant 7th (全ルート) · Part 1',
  '',
  '',
  92,
  10,
  'ブロック10',
  'Block 10',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-092'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-092'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-10-07'),
  'ドミナントセブンス（全ルート）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-093'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ドミナントセブンス（全ルート）その2',
  'Dominant 7th (全ルート) · Part 2',
  '',
  '',
  93,
  10,
  'ブロック10',
  'Block 10',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-093'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-093'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-10-08'),
  'ドミナントセブンス（全ルート）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-094'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ハーフディミニッシュ（CDE）その1',
  'Half-diminished (CDE) · Part 1',
  '',
  '',
  94,
  11,
  'ブロック11',
  'Block 11',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-094'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-094'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-11-01'),
  'ハーフディミニッシュ（CDE）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-095'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ハーフディミニッシュ（CDE）その2',
  'Half-diminished (CDE) · Part 2',
  '',
  '',
  95,
  11,
  'ブロック11',
  'Block 11',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-095'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-095'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-11-02'),
  'ハーフディミニッシュ（CDE）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-096'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ハーフディミニッシュ（FGAB）その1',
  'Half-diminished (FGAB) · Part 1',
  '',
  '',
  96,
  11,
  'ブロック11',
  'Block 11',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-096'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-096'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-11-03'),
  'ハーフディミニッシュ（FGAB）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-097'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ハーフディミニッシュ（FGAB）その2',
  'Half-diminished (FGAB) · Part 2',
  '',
  '',
  97,
  11,
  'ブロック11',
  'Block 11',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-097'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-097'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-11-04'),
  'ハーフディミニッシュ（FGAB）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-098'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ハーフディミニッシュ（C#–Eb–F#–Ab–Bb）その1',
  'Half-diminished (C#–Eb–F#–Ab–Bb) · Part 1',
  '',
  '',
  98,
  11,
  'ブロック11',
  'Block 11',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-098'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-098'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-11-05'),
  'ハーフディミニッシュ（C#–Eb–F#–Ab–Bb）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-099'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ハーフディミニッシュ（C#–Eb–F#–Ab–Bb）その2',
  'Half-diminished (C#–Eb–F#–Ab–Bb) · Part 2',
  '',
  '',
  99,
  11,
  'ブロック11',
  'Block 11',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-099'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-099'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-11-06'),
  'ハーフディミニッシュ（C#–Eb–F#–Ab–Bb）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-100'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ハーフディミニッシュ（全ルート）その1',
  'Half-diminished (全ルート) · Part 1',
  '',
  '',
  100,
  11,
  'ブロック11',
  'Block 11',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-100'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-100'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-11-07'),
  'ハーフディミニッシュ（全ルート）その1'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-101'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ハーフディミニッシュ（全ルート）その2',
  'Half-diminished (全ルート) · Part 2',
  '',
  '',
  101,
  11,
  'ブロック11',
  'Block 11',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-101'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-101'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-11-08'),
  'ハーフディミニッシュ（全ルート）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-102'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '基本4和音まとめ（CDE）・シングル',
  'Four-part basics (CDE) · Single',
  '',
  '',
  102,
  12,
  'ブロック12',
  'Block 12',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-102'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-102'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-12-01'),
  '基本4和音まとめ（CDE）・シングル'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-103'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '基本4和音まとめ（CDE）その2',
  'Four-part basics (CDE) · Part 2',
  '',
  '',
  103,
  12,
  'ブロック12',
  'Block 12',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-103'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-103'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-12-02'),
  '基本4和音まとめ（CDE）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-104'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '基本4和音まとめ（FGAB）・シングル',
  'Four-part basics (FGAB) · Single',
  '',
  '',
  104,
  12,
  'ブロック12',
  'Block 12',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-104'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-104'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-12-03'),
  '基本4和音まとめ（FGAB）・シングル'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-105'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '基本4和音まとめ（FGAB）その2',
  'Four-part basics (FGAB) · Part 2',
  '',
  '',
  105,
  12,
  'ブロック12',
  'Block 12',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-105'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-105'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-12-04'),
  '基本4和音まとめ（FGAB）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-106'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '基本4和音まとめ（C#–Eb–F#–Ab–Bb）・シングル',
  'Four-part basics (C#–Eb–F#–Ab–Bb) · Single',
  '',
  '',
  106,
  12,
  'ブロック12',
  'Block 12',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-106'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-106'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-12-05'),
  '基本4和音まとめ（C#–Eb–F#–Ab–Bb）・シングル'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-107'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '基本4和音まとめ（C#–Eb–F#–Ab–Bb）その2',
  'Four-part basics (C#–Eb–F#–Ab–Bb) · Part 2',
  '',
  '',
  107,
  12,
  'ブロック12',
  'Block 12',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-107'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-107'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-12-06'),
  '基本4和音まとめ（C#–Eb–F#–Ab–Bb）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-108'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '基本4和音まとめ（全ルート）・シングル',
  'Four-part basics (全ルート) · Single',
  '',
  '',
  108,
  12,
  'ブロック12',
  'Block 12',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-108'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-108'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-12-07'),
  '基本4和音まとめ（全ルート）・シングル'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-109'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '基本4和音まとめ（全ルート）その2',
  'Four-part basics (全ルート) · Part 2',
  '',
  '',
  109,
  12,
  'ブロック12',
  'Block 12',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-109'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-109'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-12-08'),
  '基本4和音まとめ（全ルート）その2'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-110'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ハーモニックマイナー（A–D–G）',
  'Harmonic minor (A–D–G)',
  '',
  '',
  110,
  13,
  'ブロック13',
  'Block 13',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-110'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-110'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-13-01'),
  'ハーモニックマイナー（A–D–G）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-111'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ハーモニックマイナー（B–E–C#）',
  'Harmonic minor (B–E–C#)',
  '',
  '',
  111,
  13,
  'ブロック13',
  'Block 13',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-111'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-111'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-13-02'),
  'ハーモニックマイナー（B–E–C#）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-112'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ハーモニックマイナー（G#–C#–Eb）',
  'Harmonic minor (G#–C#–Eb)',
  '',
  '',
  112,
  13,
  'ブロック13',
  'Block 13',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-112'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-112'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-13-03'),
  'ハーモニックマイナー（G#–C#–Eb）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-113'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ハーモニックマイナー（C–F–Bb）',
  'Harmonic minor (C–F–Bb)',
  '',
  '',
  113,
  13,
  'ブロック13',
  'Block 13',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-113'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-113'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-13-04'),
  'ハーモニックマイナー（C–F–Bb）'
);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-114'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  'ハーモニックマイナー（12調すべて）',
  'Harmonic minor (12調すべて)',
  '',
  '',
  114,
  13,
  'ブロック13',
  'Block 13',
  false,
  NULL,
  '[]'::jsonb
);

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lsg-114'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-lesson-114'),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-v2-stage-MT-13-05'),
  'ハーモニックマイナー（12調すべて）'
);

COMMIT;
