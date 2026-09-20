-- Defense: HUD progression chords, per-note staff labels, Basic stages 1–3 content
BEGIN;

CREATE TABLE IF NOT EXISTS public.defense_stage_progression_chords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL REFERENCES public.defense_stages(id) ON DELETE CASCADE,
  order_index smallint NOT NULL CHECK (order_index >= 0),
  chord_name text NOT NULL DEFAULT '',
  measure_number smallint NOT NULL CHECK (measure_number > 0),
  beat_offset smallint NOT NULL DEFAULT 1 CHECK (beat_offset >= 1),
  duration_beats smallint NOT NULL DEFAULT 4 CHECK (duration_beats > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stage_id, order_index)
);

COMMENT ON TABLE public.defense_stage_progression_chords IS
  'Defense HUD chord progression (quarter-note slots) synced to backing audio.';

ALTER TABLE public.defense_phrase_chord_notes
  ADD COLUMN IF NOT EXISTS staff_chord_name text;

COMMENT ON COLUMN public.defense_phrase_chord_notes.staff_chord_name IS
  'Optional chord label above this note step on the staff (overrides phrase chord_name).';

ALTER TABLE public.defense_stage_progression_chords ENABLE ROW LEVEL SECURITY;

CREATE POLICY defense_stage_progression_chords_select_all
  ON public.defense_stage_progression_chords FOR SELECT
  USING (true);

CREATE POLICY defense_stage_progression_chords_admin
  ON public.defense_stage_progression_chords FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

GRANT SELECT ON public.defense_stage_progression_chords TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Stage 1: Dm7 | G7 | Dm7 | G7 (4-bar loop per phrase)
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_stage_id uuid := uuid_generate_v5(
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'defense-dev-survival-phrases-1-4'
  );
BEGIN
  DELETE FROM public.defense_stage_progression_chords WHERE stage_id = v_stage_id;

  INSERT INTO public.defense_stage_progression_chords (
    stage_id, order_index, chord_name, measure_number, beat_offset, duration_beats
  ) VALUES
    (v_stage_id, 0, 'Dm7', 1, 1, 4),
    (v_stage_id, 1, 'G7',  2, 1, 4),
    (v_stage_id, 2, 'Dm7', 3, 1, 4),
    (v_stage_id, 3, 'G7',  4, 1, 4);
END $$;

-- ---------------------------------------------------------------------------
-- Stage 2: 12-bar F blues progression + F Minor Pentatonic Scale on staff
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_stage_id uuid := uuid_generate_v5(
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'defense-basic-nows-the-time-test'
  );
BEGIN
  DELETE FROM public.defense_stage_progression_chords WHERE stage_id = v_stage_id;

  INSERT INTO public.defense_stage_progression_chords (
    stage_id, order_index, chord_name, measure_number, beat_offset, duration_beats
  ) VALUES
    (v_stage_id,  0, 'F7',  1, 1, 4),
    (v_stage_id,  1, 'Bb7', 2, 1, 4),
    (v_stage_id,  2, 'F7',  3, 1, 4),
    (v_stage_id,  3, 'F7',  4, 1, 4),
    (v_stage_id,  4, 'Bb7', 5, 1, 4),
    (v_stage_id,  5, 'Bb7', 6, 1, 4),
    (v_stage_id,  6, 'F7',  7, 1, 4),
    (v_stage_id,  7, 'D7',  8, 1, 4),
    (v_stage_id,  8, 'Gm7', 9, 1, 4),
    (v_stage_id,  9, 'C7', 10, 1, 4),
    (v_stage_id, 10, 'F7', 11, 1, 2),
    (v_stage_id, 11, 'D7', 11, 3, 2),
    (v_stage_id, 12, 'Gm7', 12, 1, 2),
    (v_stage_id, 13, 'C7',  12, 3, 2);

  UPDATE public.defense_phrase_chords c
  SET chord_name = 'F Minor Pentatonic Scale'
  FROM public.defense_phrases p
  WHERE p.id = c.phrase_id
    AND p.stage_id = v_stage_id;
END $$;

-- ---------------------------------------------------------------------------
-- Stage 3: 2-beat Dm7 / G7 test (reuse stage 1 audio + notes)
-- ---------------------------------------------------------------------------
INSERT INTO public.defense_stages (
  id, slug, stage_number, title, title_en, bpm, beats_per_bar, phrase_bars,
  staff_layout, key_fifths, required_completion_count, difficulty_level,
  survive_seconds, player_hp, production_staff_hint_mode, production_keyboard_hint_mode,
  audio_registration_mode, progression_bars, audio_url,
  is_active, sort_order
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-two-beat-ii-v-test'),
  'defense-basic-two-beat-ii-v-test',
  911,
  '2拍 II-V テスト',
  '2-beat II-V test',
  160,
  4,
  1,
  'treble',
  0,
  1,
  3,
  120,
  5,
  'fade_15s',
  'fade_15s',
  'single_source',
  NULL,
  'https://jazzify-cdn.com/fantasy-bgm/defense-phrases-i-iv-concat-160bpm.mp3',
  true,
  911
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
  'defense-basic-two-beat-ii-v-test'
);

INSERT INTO public.defense_phrases (
  id, stage_id, order_index, title, audio_url, key_fifths, required_completion_count,
  loop_start_measure, loop_end_measure
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-two-beat-phrase-' || p.order_index::text),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-two-beat-ii-v-test'),
  p.order_index,
  p.title,
  NULL,
  p.key_fifths,
  p.required_completion_count,
  p.loop_start_measure,
  p.loop_end_measure
FROM public.defense_phrases p
WHERE p.stage_id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'defense-dev-survival-phrases-1-4'
);

INSERT INTO public.defense_phrase_chords (id, phrase_id, order_index, chord_name, measure_number)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-two-beat-chord-' || c.id::text),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-two-beat-phrase-' || p.order_index::text),
  c.order_index,
  c.chord_name,
  c.measure_number
FROM public.defense_phrase_chords c
JOIN public.defense_phrases p ON p.id = c.phrase_id
WHERE p.stage_id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'defense-dev-survival-phrases-1-4'
);

INSERT INTO public.defense_phrase_chord_notes (
  chord_id, order_index, pitch_midi, pitch_class, note_name, staff, step_index, staff_chord_name
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-two-beat-chord-' || c.id::text),
  n.order_index,
  n.pitch_midi,
  n.pitch_class,
  n.note_name,
  n.staff,
  n.step_index,
  CASE
    WHEN COALESCE(n.step_index, n.order_index) < 2 THEN 'Dm7'
    ELSE 'G7'
  END
FROM public.defense_phrase_chord_notes n
JOIN public.defense_phrase_chords c ON c.id = n.chord_id
JOIN public.defense_phrases p ON p.id = c.phrase_id
WHERE p.stage_id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'defense-dev-survival-phrases-1-4'
);

DELETE FROM public.defense_stage_progression_chords
WHERE stage_id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'defense-basic-two-beat-ii-v-test'
);

INSERT INTO public.defense_stage_progression_chords (
  stage_id, order_index, chord_name, measure_number, beat_offset, duration_beats
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-basic-two-beat-ii-v-test'),
  v.order_index,
  v.chord_name,
  v.measure_number,
  v.beat_offset,
  v.duration_beats
FROM (
  VALUES
    (0, 'Dm7', 1, 1, 2),
    (1, 'G7',  1, 3, 2),
    (2, 'Dm7', 2, 1, 2),
    (3, 'G7',  2, 3, 2),
    (4, 'Dm7', 3, 1, 2),
    (5, 'G7',  3, 3, 2),
    (6, 'Dm7', 4, 1, 2),
    (7, 'G7',  4, 3, 2)
) AS v(order_index, chord_name, measure_number, beat_offset, duration_beats);

UPDATE public.play_map_nodes
SET
  defense_stage_id = uuid_generate_v5(
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'defense-basic-two-beat-ii-v-test'
  ),
  title = '2拍 II-V テスト',
  title_en = '2-beat II-V test',
  updated_at = now()
WHERE id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000002'::uuid,
  'pd-node-basic-2'
);

COMMIT;
