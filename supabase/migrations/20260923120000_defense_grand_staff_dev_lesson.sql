-- 開発者テストコース: ディフェンス大譜表レイアウト確認用
-- staff_layout=grand、両手ヴォイシング（staff 1=ト音 / staff 2=ヘ音）を 2 小節×2 フレーズで配置
BEGIN;

INSERT INTO public.defense_stages (
  id, slug, stage_number, title, title_en, bpm, beats_per_bar, phrase_bars,
  staff_layout, attack_trigger, key_fifths, required_completion_count, difficulty_level,
  survive_seconds, player_hp, production_staff_hint_mode, production_keyboard_hint_mode,
  is_active, sort_order
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff'),
  'defense-dev-grand-staff',
  901,
  'ディフェンス（テスト / 大譜表）',
  'Defense (test / grand staff)',
  160,
  4,
  2,
  'grand',
  'note',
  0,
  2,
  3,
  120,
  5,
  'always',
  'always',
  true,
  901
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  stage_number = EXCLUDED.stage_number,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  bpm = EXCLUDED.bpm,
  beats_per_bar = EXCLUDED.beats_per_bar,
  phrase_bars = EXCLUDED.phrase_bars,
  staff_layout = EXCLUDED.staff_layout,
  attack_trigger = EXCLUDED.attack_trigger,
  key_fifths = EXCLUDED.key_fifths,
  required_completion_count = EXCLUDED.required_completion_count,
  difficulty_level = EXCLUDED.difficulty_level,
  survive_seconds = EXCLUDED.survive_seconds,
  player_hp = EXCLUDED.player_hp,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

DELETE FROM public.defense_phrases
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff');

-- Phrase 0: Dm7 | G7（両手同時押し）
INSERT INTO public.defense_phrases (id, stage_id, order_index, title, audio_url, key_fifths, required_completion_count)
VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff-phrase-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff'),
  0,
  'Dm7 | G7',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-dm7-1-5-stage-01.mp3',
  NULL,
  NULL
);

-- Phrase 1: CM7 | F6（両手同時押し）
INSERT INTO public.defense_phrases (id, stage_id, order_index, title, audio_url, key_fifths, required_completion_count)
VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff-phrase-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff'),
  1,
  'CM7 | F6',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-dm7-1-5-stage-02.mp3',
  NULL,
  NULL
);

INSERT INTO public.defense_phrase_chords (id, phrase_id, order_index, chord_name, measure_number)
VALUES
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff-chord-0-0'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff-phrase-0'),
    0, 'Dm7', 1
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff-chord-0-1'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff-phrase-0'),
    1, 'G7', 2
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff-chord-1-0'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff-phrase-1'),
    0, 'CM7', 1
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff-chord-1-1'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff-phrase-1'),
    1, 'F6', 2
  );

-- staff 1 = treble, staff 2 = bass. Same step_index = simultaneous two-hand voicing.
INSERT INTO public.defense_phrase_chord_notes (
  chord_id, order_index, pitch_midi, pitch_class, note_name, staff, step_index
) VALUES
  -- Dm7: LH D3 F3 A3 / RH C4 F4
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff-chord-0-0'), 0, 50, 2, 'D3', 2, 0),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff-chord-0-0'), 1, 53, 5, 'F3', 2, 0),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff-chord-0-0'), 2, 57, 9, 'A3', 2, 0),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff-chord-0-0'), 3, 60, 0, 'C4', 1, 0),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff-chord-0-0'), 4, 65, 5, 'F4', 1, 0),
  -- G7: LH G2 F3 B3 / RH D4 F4
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff-chord-0-1'), 0, 43, 7, 'G2', 2, 0),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff-chord-0-1'), 1, 53, 5, 'F3', 2, 0),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff-chord-0-1'), 2, 59, 11, 'B3', 2, 0),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff-chord-0-1'), 3, 62, 2, 'D4', 1, 0),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff-chord-0-1'), 4, 65, 5, 'F4', 1, 0),
  -- CM7: LH C3 G3 B3 / RH E4 G4
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff-chord-1-0'), 0, 48, 0, 'C3', 2, 0),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff-chord-1-0'), 1, 55, 7, 'G3', 2, 0),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff-chord-1-0'), 2, 59, 11, 'B3', 2, 0),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff-chord-1-0'), 3, 64, 4, 'E4', 1, 0),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff-chord-1-0'), 4, 67, 7, 'G4', 1, 0),
  -- F6: LH F2 C3 A3 / RH A4 C5
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff-chord-1-1'), 0, 41, 5, 'F2', 2, 0),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff-chord-1-1'), 1, 48, 0, 'C3', 2, 0),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff-chord-1-1'), 2, 57, 9, 'A3', 2, 0),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff-chord-1-1'), 3, 69, 9, 'A4', 1, 0),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff-chord-1-1'), 4, 72, 0, 'C5', 1, 0);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en, nav_links, assignment_description
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-defense-grand-staff-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'ディフェンス（テスト / 大譜表）',
  'Defense (test / grand staff)',
  '両手ヴォイシング（ト音+ヘ音）でディフェンスの大譜表レイアウトを確認する。ヒント常時表示。各フレーズ2回完成で切替。',
  'Grand-staff (treble+bass) two-hand voicings for Defense layout review. Hints always on. Switch after 2 completions per phrase.',
  false,
  (SELECT COALESCE(MAX(order_index), 0) + 1 FROM public.lessons WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test')),
  1,
  'テスト',
  'Test',
  '["lesson"]'::jsonb,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  premium_only = EXCLUDED.premium_only;

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, is_clear_required, clear_conditions,
  is_fantasy, is_survival, is_ear_training, is_balloon_rush,
  is_survival_tutorial, is_ear_training_tutorial, is_video_lesson, is_defense,
  defense_stage_id, title, title_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-defense-grand-staff-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-defense-grand-staff-lesson'),
  NULL,
  0,
  true,
  '{"count": 1, "rank": "S"}'::jsonb,
  false, false, false, false,
  false, false, false, true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-grand-staff'),
  'ディフェンス 大譜表',
  'Defense grand staff'
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_defense = EXCLUDED.is_defense,
  defense_stage_id = EXCLUDED.defense_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
