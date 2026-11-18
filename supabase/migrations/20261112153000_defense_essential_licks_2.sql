-- 開発者用テストコース: essential licks 2
-- 1 レッスン / 2 ステージ（Essential 2-1, 2-2）
-- 1 フレーズ = 2 小節、3 回完成で次フレーズ、BPM 160、難易度 7、生存 120 秒
BEGIN;

INSERT INTO public.defense_stages (
  id, slug, stage_number, title, title_en, bpm, beats_per_bar, phrase_bars,
  progression_bars, audio_registration_mode, audio_url,
  staff_layout, attack_trigger, key_fifths, required_completion_count,
  difficulty_level, survive_seconds, player_hp,
  production_staff_hint_mode, production_keyboard_hint_mode,
  play_style, is_active, sort_order
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-1'),
  'defense-dev-essential-licks-2-1',
  919,
  'essential licks 2-1',
  'Essential Licks 2-1',
  160, 4, 2,
  NULL, 'single_source',
  'https://jazzify-cdn.com/sozai/essential-licks-2/essential-licks-2-1.mp3?v=202611121530',
  'treble', 'note', 0, 3,
  7, 120, 20,
  'always', 'always',
  'phrase', true, 919
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  stage_number = EXCLUDED.stage_number,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  bpm = EXCLUDED.bpm,
  beats_per_bar = EXCLUDED.beats_per_bar,
  phrase_bars = EXCLUDED.phrase_bars,
  audio_registration_mode = EXCLUDED.audio_registration_mode,
  audio_url = EXCLUDED.audio_url,
  staff_layout = EXCLUDED.staff_layout,
  attack_trigger = EXCLUDED.attack_trigger,
  key_fifths = EXCLUDED.key_fifths,
  required_completion_count = EXCLUDED.required_completion_count,
  difficulty_level = EXCLUDED.difficulty_level,
  survive_seconds = EXCLUDED.survive_seconds,
  player_hp = EXCLUDED.player_hp,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  play_style = EXCLUDED.play_style,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.defense_stages (
  id, slug, stage_number, title, title_en, bpm, beats_per_bar, phrase_bars,
  progression_bars, audio_registration_mode, audio_url,
  staff_layout, attack_trigger, key_fifths, required_completion_count,
  difficulty_level, survive_seconds, player_hp,
  production_staff_hint_mode, production_keyboard_hint_mode,
  play_style, is_active, sort_order
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-2'),
  'defense-dev-essential-licks-2-2',
  920,
  'essential licks 2-2',
  'Essential Licks 2-2',
  160, 4, 2,
  NULL, 'single_source',
  'https://jazzify-cdn.com/sozai/essential-licks-2/essential-licks-2-2.mp3?v=202611121530',
  'treble', 'note', 0, 3,
  7, 120, 20,
  'always', 'always',
  'phrase', true, 920
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  stage_number = EXCLUDED.stage_number,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  bpm = EXCLUDED.bpm,
  beats_per_bar = EXCLUDED.beats_per_bar,
  phrase_bars = EXCLUDED.phrase_bars,
  audio_registration_mode = EXCLUDED.audio_registration_mode,
  audio_url = EXCLUDED.audio_url,
  staff_layout = EXCLUDED.staff_layout,
  attack_trigger = EXCLUDED.attack_trigger,
  key_fifths = EXCLUDED.key_fifths,
  required_completion_count = EXCLUDED.required_completion_count,
  difficulty_level = EXCLUDED.difficulty_level,
  survive_seconds = EXCLUDED.survive_seconds,
  player_hp = EXCLUDED.player_hp,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  play_style = EXCLUDED.play_style,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

DELETE FROM public.defense_phrases
WHERE stage_id IN (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-2')
);

INSERT INTO public.defense_phrases (
  id, stage_id, order_index, title, audio_url,
  loop_start_measure, loop_end_measure, key_fifths, required_completion_count
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-1-phrase-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-1'),
  0, 'E7 | Am7', NULL, 1, 2, 0, NULL
), (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-2-phrase-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-2'),
  0, 'G7 | C6', NULL, 1, 2, 0, NULL
);

INSERT INTO public.defense_phrase_chords (id, phrase_id, order_index, chord_name, measure_number)
VALUES
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-1-chord-0'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-1-phrase-0'),
    0, 'E7', 1
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-1-chord-1'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-1-phrase-0'),
    1, 'Am7', 2
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-2-chord-0'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-2-phrase-0'),
    0, 'G7', 1
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-2-chord-1'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-2-phrase-0'),
    1, 'C6', 2
  );

INSERT INTO public.defense_phrase_chord_notes (
  chord_id, order_index, pitch_midi, pitch_class, note_name, staff, step_index
) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-1-chord-0'), 0, 64, 4, 'E4', 1, 0),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-1-chord-0'), 1, 65, 5, 'F4', 1, 1),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-1-chord-0'), 2, 67, 7, 'G4', 1, 2),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-1-chord-0'), 3, 68, 8, 'G#4', 1, 3),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-1-chord-0'), 4, 71, 11, 'B4', 1, 4),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-1-chord-0'), 5, 76, 4, 'E5', 1, 5),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-1-chord-0'), 6, 71, 11, 'B4', 1, 6),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-1-chord-1'), 0, 74, 2, 'D5', 1, 0),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-1-chord-1'), 1, 72, 0, 'C5', 1, 1),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-2-chord-0'), 0, 64, 4, 'E4', 1, 0),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-2-chord-0'), 1, 65, 5, 'F4', 1, 1),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-2-chord-0'), 2, 67, 7, 'G4', 1, 2),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-2-chord-0'), 3, 68, 8, 'Ab4', 1, 3),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-2-chord-0'), 4, 71, 11, 'B4', 1, 4),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-2-chord-0'), 5, 76, 4, 'E5', 1, 5),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-2-chord-0'), 6, 71, 11, 'B4', 1, 6),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-2-chord-1'), 0, 74, 2, 'D5', 1, 0),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-2-chord-1'), 1, 72, 0, 'C5', 1, 1);

DELETE FROM public.defense_stage_progression_chords
WHERE stage_id IN (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-2')
);

INSERT INTO public.defense_stage_progression_chords (
  stage_id, order_index, chord_name, measure_number, beat_offset, duration_beats
) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-1'), 0, 'E7', 1, 1, 4),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-1'), 1, 'Am7', 2, 1, 4),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-2'), 0, 'G7', 1, 1, 4),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-2'), 1, 'C6', 2, 1, 4);

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-essential-licks-2-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'essential licks 2',
  'Essential Licks 2',
  'フレーズディフェンス。1フレーズ2小節、3回正解で次のフレーズ。BPM 160、難易度7、生存2分。',
  'Phrase Defense. One phrase is 2 bars; 3 completions advance to the next phrase. BPM 160, difficulty 7, survive 2 minutes.',
  false,
  (SELECT COALESCE(MAX(order_index), 0) + 1 FROM public.lessons WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test')),
  1,
  'テスト',
  'Test',
  '["lesson"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  premium_only = EXCLUDED.premium_only,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en;

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, is_clear_required, clear_conditions,
  is_fantasy, is_survival, is_ear_training, is_balloon_rush,
  is_survival_tutorial, is_ear_training_tutorial, is_video_lesson, is_defense,
  defense_stage_id, title, title_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-essential-licks-2-lsong-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-essential-licks-2-lesson'),
  NULL, 0, true, '{"count": 1, "rank": "S"}'::jsonb,
  false, false, false, false, false, false, false, true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-1'),
  'essential licks 2-1',
  'Essential Licks 2-1'
), (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-essential-licks-2-lsong-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-essential-licks-2-lesson'),
  NULL, 1, true, '{"count": 1, "rank": "S"}'::jsonb,
  false, false, false, false, false, false, false, true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-essential-licks-2-2'),
  'essential licks 2-2',
  'Essential Licks 2-2'
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  order_index = EXCLUDED.order_index,
  is_defense = EXCLUDED.is_defense,
  defense_stage_id = EXCLUDED.defense_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
