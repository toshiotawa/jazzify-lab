-- Defense Basic stage 5: Now's The Time shared_progression_separate_tracks
BEGIN;

INSERT INTO public.defense_stages (
  id, slug, stage_number, title, title_en, bpm, beats_per_bar, phrase_bars,
  staff_layout, key_fifths, required_completion_count, difficulty_level,
  survive_seconds, player_hp, production_staff_hint_mode, production_keyboard_hint_mode,
  audio_registration_mode, progression_bars, audio_url, melody_audio_url,
  is_active, sort_order, attack_trigger
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-nows-the-time-separate-tracks'),
  'defense-basic-nows-the-time-separate-tracks',
  912,
  'Now''s The Time（別トラック）',
  'Now''s The Time (separate tracks)',
  160,
  4,
  2,
  'treble',
  -1,
  1,
  3,
  120,
  5,
  'fade_15s',
  'fade_15s',
  'shared_progression_separate_tracks',
  12,
  'https://jazzify-cdn.com/fantasy-bgm/defense-nows-the-time-separate-bgm.wav',
  'https://jazzify-cdn.com/fantasy-bgm/defense-nows-the-time-separate-melody.wav',
  true,
  912,
  'note'
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
  melody_audio_url = EXCLUDED.melody_audio_url,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order,
  attack_trigger = EXCLUDED.attack_trigger;

DELETE FROM public.defense_phrases
WHERE stage_id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'defense-basic-nows-the-time-separate-tracks'
);

INSERT INTO public.defense_phrases (
  id, stage_id, order_index, title, audio_url, key_fifths, required_completion_count,
  loop_start_measure, loop_end_measure
)
SELECT
  uuid_generate_v5(
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'defense-basic-nows-the-time-separate-tracks-phrase-' || p.order_index::text
  ),
  uuid_generate_v5(
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'defense-basic-nows-the-time-separate-tracks'
  ),
  p.order_index,
  p.title,
  NULL,
  p.key_fifths,
  p.required_completion_count,
  p.order_index * 2 + 1,
  p.order_index * 2 + 2
FROM public.defense_phrases p
WHERE p.stage_id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'defense-basic-nows-the-time-test'
);

INSERT INTO public.defense_phrase_chords (id, phrase_id, order_index, chord_name, measure_number)
SELECT
  uuid_generate_v5(
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'defense-basic-nows-the-time-separate-tracks-chord-' || c.id::text
  ),
  uuid_generate_v5(
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'defense-basic-nows-the-time-separate-tracks-phrase-' || p.order_index::text
  ),
  c.order_index,
  c.chord_name,
  c.measure_number
FROM public.defense_phrase_chords c
JOIN public.defense_phrases p ON p.id = c.phrase_id
WHERE p.stage_id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'defense-basic-nows-the-time-test'
);

INSERT INTO public.defense_phrase_chord_notes (
  chord_id, order_index, pitch_midi, pitch_class, note_name, staff, step_index, staff_chord_name
)
SELECT
  uuid_generate_v5(
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'defense-basic-nows-the-time-separate-tracks-chord-' || c.id::text
  ),
  n.order_index,
  n.pitch_midi,
  n.pitch_class,
  n.note_name,
  n.staff,
  n.step_index,
  n.staff_chord_name
FROM public.defense_phrase_chord_notes n
JOIN public.defense_phrase_chords c ON c.id = n.chord_id
JOIN public.defense_phrases p ON p.id = c.phrase_id
WHERE p.stage_id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'defense-basic-nows-the-time-test'
);

DELETE FROM public.defense_stage_progression_chords
WHERE stage_id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'defense-basic-nows-the-time-separate-tracks'
);

INSERT INTO public.defense_stage_progression_chords (
  stage_id, order_index, chord_name, measure_number, beat_offset, duration_beats
)
SELECT
  uuid_generate_v5(
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'defense-basic-nows-the-time-separate-tracks'
  ),
  c.order_index,
  c.chord_name,
  c.measure_number,
  c.beat_offset,
  c.duration_beats
FROM public.defense_stage_progression_chords c
WHERE c.stage_id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'defense-basic-nows-the-time-test'
);

INSERT INTO public.play_map_nodes (
  id, block_id, sort_order, node_kind, defense_stage_id, title, title_en,
  required_rank, difficulty_level, is_active
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'pd-node-basic-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'pd-basic-1'),
  4,
  'stage',
  uuid_generate_v5(
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'defense-basic-nows-the-time-separate-tracks'
  ),
  'Now''s The Time（別トラック）',
  'Now''s The Time (separate tracks)',
  'C',
  7,
  true
)
ON CONFLICT (id) DO UPDATE SET
  defense_stage_id = EXCLUDED.defense_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  sort_order = EXCLUDED.sort_order,
  difficulty_level = EXCLUDED.difficulty_level,
  is_active = true,
  updated_at = now();

COMMIT;
