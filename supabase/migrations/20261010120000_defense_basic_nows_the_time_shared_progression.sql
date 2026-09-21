-- Basic play-map stage 2: shared_progression test (Now's The Time, 12-bar F blues @ 160 BPM)
BEGIN;

INSERT INTO public.defense_stages (
  id, slug, stage_number, title, title_en, bpm, beats_per_bar, phrase_bars,
  staff_layout, key_fifths, required_completion_count, difficulty_level,
  survive_seconds, player_hp, production_staff_hint_mode, production_keyboard_hint_mode,
  audio_registration_mode, progression_bars, audio_url,
  is_active, sort_order
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test'),
  'defense-basic-nows-the-time-test',
  910,
  'Now''s The Time（進行共有テスト）',
  'Now''s The Time (shared progression test)',
  160,
  4,
  2,
  'treble',
  -1,
  2,
  3,
  120,
  20,
  'always',
  'always',
  'shared_progression',
  12,
  NULL,
  true,
  910
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
  key_fifths = EXCLUDED.key_fifths,
  required_completion_count = EXCLUDED.required_completion_count,
  difficulty_level = EXCLUDED.difficulty_level,
  survive_seconds = EXCLUDED.survive_seconds,
  player_hp = EXCLUDED.player_hp,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  audio_registration_mode = EXCLUDED.audio_registration_mode,
  progression_bars = EXCLUDED.progression_bars,
  audio_url = EXCLUDED.audio_url,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

DELETE FROM public.defense_phrases
WHERE stage_id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'defense-basic-nows-the-time-test'
);

INSERT INTO public.defense_phrases (
  id, stage_id, order_index, title, audio_url, key_fifths, required_completion_count
) VALUES
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test-phrase-0'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test'),
    0,
    'Phrase 1',
    'https://jazzify-cdn.com/fantasy-bgm/defense-nows-the-time-phrase-1.m4a',
    NULL,
    NULL
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test-phrase-1'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test'),
    1,
    'Phrase 2',
    'https://jazzify-cdn.com/fantasy-bgm/defense-nows-the-time-phrase-2.m4a',
    NULL,
    NULL
  );

INSERT INTO public.defense_phrase_chords (id, phrase_id, order_index, chord_name, measure_number)
VALUES
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test-chord-0-0'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test-phrase-0'),
    0, 'F Minor Pentatonic', 1
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test-chord-0-1'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test-phrase-0'),
    1, 'F Minor Pentatonic', 2
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test-chord-1-0'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test-phrase-1'),
    0, 'F Minor Pentatonic', 1
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test-chord-1-1'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test-phrase-1'),
    1, 'F Minor Pentatonic', 2
  );

INSERT INTO public.defense_phrase_chord_notes (
  chord_id, order_index, pitch_midi, pitch_class, note_name, staff, step_index
) VALUES
  -- Phrase 1 bar 1: F4 Ab4 Bb4 C5 Eb5
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test-chord-0-0'), 0, 65, 5, 'F4', 1, 0),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test-chord-0-0'), 1, 68, 8, 'Ab4', 1, 1),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test-chord-0-0'), 2, 70, 10, 'Bb4', 1, 2),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test-chord-0-0'), 3, 72, 0, 'C5', 1, 3),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test-chord-0-0'), 4, 75, 3, 'Eb5', 1, 4),
  -- Phrase 1 bar 2: same sequence
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test-chord-0-1'), 0, 65, 5, 'F4', 1, 0),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test-chord-0-1'), 1, 68, 8, 'Ab4', 1, 1),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test-chord-0-1'), 2, 70, 10, 'Bb4', 1, 2),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test-chord-0-1'), 3, 72, 0, 'C5', 1, 3),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test-chord-0-1'), 4, 75, 3, 'Eb5', 1, 4),
  -- Phrase 2 bar 1: F4 Ab4 C5 Bb4 Eb5 F5
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test-chord-1-0'), 0, 65, 5, 'F4', 1, 0),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test-chord-1-0'), 1, 68, 8, 'Ab4', 1, 1),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test-chord-1-0'), 2, 72, 0, 'C5', 1, 2),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test-chord-1-0'), 3, 70, 10, 'Bb4', 1, 3),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test-chord-1-0'), 4, 75, 3, 'Eb5', 1, 4),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test-chord-1-0'), 5, 77, 5, 'F5', 1, 5),
  -- Phrase 2 bar 2: same sequence
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test-chord-1-1'), 0, 65, 5, 'F4', 1, 0),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test-chord-1-1'), 1, 68, 8, 'Ab4', 1, 1),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test-chord-1-1'), 2, 72, 0, 'C5', 1, 2),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test-chord-1-1'), 3, 70, 10, 'Bb4', 1, 3),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test-chord-1-1'), 4, 75, 3, 'Eb5', 1, 4),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-test-chord-1-1'), 5, 77, 5, 'F5', 1, 5);

-- Basic map stage 2 only (pd-node-basic-1, sort_order 1)
UPDATE public.play_map_nodes
SET
  defense_stage_id = uuid_generate_v5(
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'defense-basic-nows-the-time-test'
  ),
  title = 'Now''s The Time',
  title_en = 'Now''s The Time',
  updated_at = now()
WHERE id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000002'::uuid,
  'pd-node-basic-1'
);

COMMIT;
