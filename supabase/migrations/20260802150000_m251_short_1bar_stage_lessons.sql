-- II-V-I Short 1Bar: 3 stages, 1 stage = 1 block = 1 lesson (12 keys x battle/precision)
BEGIN;

-- Remove the previous phrase-based structure for this course
DELETE FROM public.lesson_songs ls
USING public.lessons l
WHERE ls.lesson_id = l.id
  AND l.course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-major-251-bebop-licks');

DELETE FROM public.ear_training_phrases etp
USING public.ear_training_stages ets
WHERE etp.stage_id = ets.id
  AND ets.slug LIKE 'm251-s1-%';

DELETE FROM public.ear_training_stages WHERE slug LIKE 'm251-s1-%';

DELETE FROM public.lessons WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-major-251-bebop-licks');

INSERT INTO public.courses (
  id, title, title_en, description, description_en,
  premium_only, order_index, audience, is_tutorial, is_visible,
  difficulty_tier, is_developer_only, is_main_course
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-major-251-bebop-licks'),
  'II-V-I Short 1Bar',
  'II-V-I Short 1Bar',
  'メジャー II-V-I の Short 1Bar ビバップリックを、全キー・バトルと精密モードで練習します。',
  'Practice major II-V-I Short 1Bar bebop licks in all keys with battle and precision modes.',
  true,
  COALESCE((SELECT MAX(c.order_index) FROM public.courses c
    WHERE COALESCE(c.is_developer_only, false) = false
      AND COALESCE(c.is_visible, true) = true
      AND c.id <> uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-major-251-bebop-licks')), 0) + 1,
  'both', false, true, 'intermediate', false, false
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  difficulty_tier = EXCLUDED.difficulty_tier,
  is_visible = EXCLUDED.is_visible,
  updated_at = now();

WITH ns AS (SELECT 'a0000000-0000-4000-8000-000000000001'::uuid AS id),
s(si, pf, pt, lm, tc, dur) AS (VALUES
  (1,1,5,21,62,50.4),(2,6,10,21,64,50.4),(3,11,16,25,72,60))
INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, assignment_description_en
)
SELECT
  uuid_generate_v5(ns.id, 'm251-s1-lesson-st' || s.si),
  uuid_generate_v5(ns.id, 'course-major-251-bebop-licks'),
  'Stage ' || s.si,
  'Stage ' || s.si,
  'フレーズ ' || s.pf || '〜' || s.pt || '（全12キー・バトル / 精密）',
  'Phrases ' || s.pf || '-' || s.pt || ' (all 12 keys, battle / precision)',
  s.si - 1,
  s.si,
  'Short 1Bar Stage ' || s.si,
  'Short 1Bar Stage ' || s.si,
  true,
  'Cキーのバトルと精密モードをクリアしてください（他キーは任意）。',
  'Clear C-key battle and precision (other keys optional).'
FROM ns, s
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

WITH ns AS (SELECT 'a0000000-0000-4000-8000-000000000001'::uuid AS id),
k(slug, kn, fifths, ord) AS (VALUES
  ('c','C',0,0),('db','Db',-5,1),('d','D',2,2),('eb','Eb',-3,3),
  ('e','E',4,4),('f','F',-1,5),('gb','Gb',-6,6),('g','G',1,7),
  ('ab','Ab',-4,8),('a','A',3,9),('bb','Bb',-2,10),('b','B',5,11)),
s(si, pf, pt, lm, tc, dur) AS (VALUES
  (1,1,5,21,62,50.4),(2,6,10,21,64,50.4),(3,11,16,25,72,60)),
m(ms, mja, men, dbm, rk, ord) AS (VALUES
  ('osmd','バトル','Battle','chord_osmd','B',0),
  ('precision','精密','Precision','chord_precision','C',1))
INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  show_keyboard_hints_in_battle, osmd_targets_from_score, is_swing,
  hammer_lead_measures, practice_transpose
)
SELECT
  uuid_generate_v5(ns.id, 'm251-s1-st' || s.si || '-' || k.slug || '-' || m.ms),
  'm251-s1-st' || s.si || '-' || k.slug || '-' || m.ms,
  'Short 1Bar Stage ' || s.si || ' ' || k.kn || '（' || m.mja || '）',
  'Short 1Bar Stage ' || s.si || ' ' || k.kn || ' (' || m.men || ')',
  'フレーズ ' || s.pf || '〜' || s.pt || '（全12キー・バトル / 精密）',
  'Phrases ' || s.pf || '-' || s.pt || ' (all 12 keys, battle / precision)',
  100, k.fifths, 4, 4, s.lm, 4,
  0, 600, 150,
  CASE WHEN m.ms = 'osmd' THEN s.tc * 100 ELSE 1 END,
  CASE WHEN m.ms = 'osmd' THEN 50 ELSE 0 END, 0, 0, 0,
  CASE WHEN m.ms = 'osmd' THEN 5 ELSE 0 END, 0, 0, 2,
  'blue_club', true, m.dbm,
  false, true, true,
  1, false
FROM ns, s, k, m
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
  player_hp = EXCLUDED.player_hp,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  miss_damage = EXCLUDED.miss_damage,
  mode = EXCLUDED.mode,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  hammer_lead_measures = EXCLUDED.hammer_lead_measures,
  practice_transpose = EXCLUDED.practice_transpose,
  updated_at = now();

WITH ns AS (SELECT 'a0000000-0000-4000-8000-000000000001'::uuid AS id),
k(slug, kn, fifths, ord) AS (VALUES
  ('c','C',0,0),('db','Db',-5,1),('d','D',2,2),('eb','Eb',-3,3),
  ('e','E',4,4),('f','F',-1,5),('gb','Gb',-6,6),('g','G',1,7),
  ('ab','Ab',-4,8),('a','A',3,9),('bb','Bb',-2,10),('b','B',5,11)),
s(si, pf, pt, lm, tc, dur) AS (VALUES
  (1,1,5,21,62,50.4),(2,6,10,21,64,50.4),(3,11,16,25,72,60)),
m(ms, mja, men, dbm, rk, ord) AS (VALUES
  ('osmd','バトル','Battle','chord_osmd','B',0),
  ('precision','精密','Precision','chord_precision','C',1))
INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
)
SELECT
  uuid_generate_v5(ns.id, 'm251-s1-st' || s.si || '-' || k.slug || '-' || m.ms || '-ph0'),
  uuid_generate_v5(ns.id, 'm251-s1-st' || s.si || '-' || k.slug || '-' || m.ms),
  0,
  k.kn || '（' || m.mja || '）',
  k.kn || ' (' || m.men || ')',
  'https://jazzify-cdn.com/sozai/major-251-licks/' || 'm251-s1-st' || s.si || '-' || k.slug || '-' || m.ms || '.musicxml?v=202608011920',
  'https://jazzify-cdn.com/sozai/major-251-licks/m251-s1-st' || s.si || '-' || k.slug || '.mp3?v=202608011800',
  s.dur, s.dur, 0, k.fifths
FROM ns, s, k, m
ON CONFLICT (id) DO UPDATE SET
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

WITH ns AS (SELECT 'a0000000-0000-4000-8000-000000000001'::uuid AS id),
k(slug, kn, fifths, ord) AS (VALUES
  ('c','C',0,0),('db','Db',-5,1),('d','D',2,2),('eb','Eb',-3,3),
  ('e','E',4,4),('f','F',-1,5),('gb','Gb',-6,6),('g','G',1,7),
  ('ab','Ab',-4,8),('a','A',3,9),('bb','Bb',-2,10),('b','B',5,11)),
s(si, pf, pt, lm, tc, dur) AS (VALUES
  (1,1,5,21,62,50.4),(2,6,10,21,64,50.4),(3,11,16,25,72,60)),
m(ms, mja, men, dbm, rk, ord) AS (VALUES
  ('osmd','バトル','Battle','chord_osmd','B',0),
  ('precision','精密','Precision','chord_precision','C',1))
INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  is_survival_tutorial, is_ear_training_tutorial,
  title, title_en, is_clear_required
)
SELECT
  uuid_generate_v5(ns.id, 'm251-s1-st' || s.si || '-' || k.slug || '-' || m.ms || '-lsong'),
  uuid_generate_v5(ns.id, 'm251-s1-lesson-st' || s.si),
  NULL::uuid,
  k.ord * 2 + m.ord,
  jsonb_build_object('count', 1, 'rank', m.rk),
  false, NULL::uuid, false, NULL::int,
  false, NULL::uuid,
  true,
  uuid_generate_v5(ns.id, 'm251-s1-st' || s.si || '-' || k.slug || '-' || m.ms),
  false, false,
  k.kn || '（' || m.mja || '）',
  k.kn || ' (' || m.men || ')',
  (k.slug = 'c')
FROM ns, s, k, m
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required;

COMMIT;
