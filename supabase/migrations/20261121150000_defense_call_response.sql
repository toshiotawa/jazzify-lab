-- Phrase Defense stage 1-1: call-and-response backing (8-bar loop, 1-bar call / 1-bar response).
BEGIN;

ALTER TABLE public.defense_stages
  ADD COLUMN IF NOT EXISTS audio_loop_bars smallint DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS call_response_bars smallint DEFAULT NULL;

ALTER TABLE public.defense_stages
  DROP CONSTRAINT IF EXISTS defense_stages_call_response_check;

ALTER TABLE public.defense_stages
  ADD CONSTRAINT defense_stages_call_response_check CHECK (
    (
      call_response_bars IS NULL
      AND (audio_loop_bars IS NULL OR audio_loop_bars > 0)
    )
    OR (
      call_response_bars IS NOT NULL
      AND call_response_bars >= 1
      AND audio_loop_bars IS NOT NULL
      AND audio_loop_bars >= call_response_bars * 2
      AND (audio_loop_bars % (call_response_bars * 2)) = 0
    )
  );

COMMENT ON COLUMN public.defense_stages.audio_loop_bars IS
  'Backing loop length in bars for call-and-response stages; NULL = phrase-derived loop length.';
COMMENT ON COLUMN public.defense_stages.call_response_bars IS
  'Call (listen) bar count per call/response cycle; NULL disables call-and-response mode.';

-- Stage 1-1 dedicated call-and-response stage (does not touch defense-dev-survival-phrases-1-4).
INSERT INTO public.defense_stages (
  id, slug, stage_number, title, title_en, bpm, beats_per_bar, phrase_bars,
  audio_loop_bars, call_response_bars,
  staff_layout, attack_trigger, key_fifths, required_completion_count,
  difficulty_level, survive_seconds, player_hp,
  production_staff_hint_mode, production_keyboard_hint_mode,
  audio_registration_mode, audio_url, melody_audio_url, progression_bars,
  play_style, play_root_on_chord_change, is_active, sort_order
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-call-response'),
  'defense-stage-1-1-call-response',
  101,
  'ステージ 1-1（コール＆レスポンス）',
  'Stage 1-1 (Call & Response)',
  120, 4, 1,
  8, 1,
  'treble', 'note', 0, 3,
  5, 96, 16,
  'always', 'always',
  'per_phrase', NULL, NULL, NULL,
  'phrase', false, true, 1
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  stage_number = EXCLUDED.stage_number,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  bpm = EXCLUDED.bpm,
  beats_per_bar = EXCLUDED.beats_per_bar,
  phrase_bars = EXCLUDED.phrase_bars,
  audio_loop_bars = EXCLUDED.audio_loop_bars,
  call_response_bars = EXCLUDED.call_response_bars,
  staff_layout = EXCLUDED.staff_layout,
  attack_trigger = EXCLUDED.attack_trigger,
  key_fifths = EXCLUDED.key_fifths,
  required_completion_count = EXCLUDED.required_completion_count,
  difficulty_level = EXCLUDED.difficulty_level,
  survive_seconds = EXCLUDED.survive_seconds,
  player_hp = EXCLUDED.player_hp,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  audio_registration_mode = EXCLUDED.audio_registration_mode,
  audio_url = EXCLUDED.audio_url,
  melody_audio_url = EXCLUDED.melody_audio_url,
  progression_bars = EXCLUDED.progression_bars,
  play_style = EXCLUDED.play_style,
  play_root_on_chord_change = EXCLUDED.play_root_on_chord_change,
  is_active = EXCLUDED.is_active,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.defense_phrases (
  id, stage_id, order_index, title, audio_url,
  loop_start_measure, loop_end_measure, key_fifths, required_completion_count
) VALUES
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-0'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-call-response'),
    0, 'Phrases I',
    'https://jazzify-cdn.com/sozai/defense-call-response/defense-stage-1-1-cr-phrase-1-bpm120.mp3',
    NULL, NULL, NULL, NULL
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-1'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-call-response'),
    1, 'Phrases II',
    'https://jazzify-cdn.com/sozai/defense-call-response/defense-stage-1-1-cr-phrase-2-bpm120.mp3',
    NULL, NULL, NULL, NULL
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-2'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-call-response'),
    2, 'Phrases III',
    'https://jazzify-cdn.com/sozai/defense-call-response/defense-stage-1-1-cr-phrase-3-bpm120.mp3',
    NULL, NULL, NULL, NULL
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-3'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-call-response'),
    3, 'Phrases IV',
    'https://jazzify-cdn.com/sozai/defense-call-response/defense-stage-1-1-cr-phrase-4-bpm120.mp3',
    NULL, NULL, NULL, NULL
  )
ON CONFLICT (id) DO UPDATE SET
  stage_id = EXCLUDED.stage_id,
  order_index = EXCLUDED.order_index,
  title = EXCLUDED.title,
  audio_url = EXCLUDED.audio_url,
  loop_start_measure = EXCLUDED.loop_start_measure,
  loop_end_measure = EXCLUDED.loop_end_measure,
  key_fifths = EXCLUDED.key_fifths,
  required_completion_count = EXCLUDED.required_completion_count;

INSERT INTO public.defense_phrase_chords (id, phrase_id, order_index, chord_name, measure_number)
VALUES
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-0-chord-0'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-0'),
    0, 'Dm7', 1
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-1-chord-0'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-1'),
    0, 'Dm7', 1
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-2-chord-0'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-2'),
    0, 'Dm7', 1
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-3-chord-0'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-3'),
    0, 'Dm7', 1
  )
ON CONFLICT (id) DO UPDATE SET
  phrase_id = EXCLUDED.phrase_id,
  order_index = EXCLUDED.order_index,
  chord_name = EXCLUDED.chord_name,
  measure_number = EXCLUDED.measure_number;

INSERT INTO public.defense_phrase_chord_notes (
  chord_id, order_index, pitch_midi, pitch_class, note_name, staff, step_index
) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-0-chord-0'), 0, 76, 4, 'E5', 1, 0),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-0-chord-0'), 1, 74, 2, 'D5', 1, 1),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-0-chord-0'), 2, 69, 9, 'A4', 1, 2),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-0-chord-0'), 3, 65, 5, 'F4', 1, 3),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-0-chord-0'), 4, 64, 4, 'E4', 1, 4),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-0-chord-0'), 5, 62, 2, 'D4', 1, 5),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-1-chord-0'), 0, 64, 4, 'E4', 1, 0),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-1-chord-0'), 1, 65, 5, 'F4', 1, 1),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-1-chord-0'), 2, 69, 9, 'A4', 1, 2),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-1-chord-0'), 3, 72, 0, 'C5', 1, 3),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-1-chord-0'), 4, 76, 4, 'E5', 1, 4),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-1-chord-0'), 5, 74, 2, 'D5', 1, 5),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-2-chord-0'), 0, 74, 2, 'D5', 1, 0),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-2-chord-0'), 1, 76, 4, 'E5', 1, 1),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-2-chord-0'), 2, 77, 5, 'F5', 1, 2),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-2-chord-0'), 3, 79, 7, 'G5', 1, 3),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-2-chord-0'), 4, 76, 4, 'E5', 1, 4),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-2-chord-0'), 5, 74, 2, 'D5', 1, 5),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-3-chord-0'), 0, 64, 4, 'E4', 1, 0),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-3-chord-0'), 1, 61, 1, 'C#4', 1, 1),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-3-chord-0'), 2, 62, 2, 'D4', 1, 2),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-3-chord-0'), 3, 64, 4, 'E4', 1, 3),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-3-chord-0'), 4, 65, 5, 'F4', 1, 4),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-cr-phrase-3-chord-0'), 5, 67, 7, 'G4', 1, 5)
ON CONFLICT (chord_id, order_index) DO UPDATE SET
  pitch_midi = EXCLUDED.pitch_midi,
  pitch_class = EXCLUDED.pitch_class,
  note_name = EXCLUDED.note_name,
  staff = EXCLUDED.staff,
  step_index = EXCLUDED.step_index;

UPDATE public.play_map_nodes
SET
  defense_stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-stage-1-1-call-response'),
  difficulty_level = 5,
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'pd-node-adv-0');

COMMIT;