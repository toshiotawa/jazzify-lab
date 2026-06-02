-- Phrase pair adlib mode: reusable pattern groups + timed chord steps.

ALTER TABLE public.ear_training_stages
  DROP CONSTRAINT IF EXISTS ear_training_stages_mode_check;

ALTER TABLE public.ear_training_stages
  ADD CONSTRAINT ear_training_stages_mode_check
  CHECK (mode IN (
    'phrase',
    'chord_voicing',
    'chord_quiz',
    'chord_osmd',
    'adlib',
    'phrase_pair_adlib'
  ));

COMMENT ON COLUMN public.ear_training_stages.mode IS
  'バトル種別: phrase / chord_voicing / chord_quiz / chord_osmd / adlib / phrase_pair_adlib';

CREATE TABLE IF NOT EXISTS public.ear_training_adlib_pattern_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  label text,
  key_fifths smallint NOT NULL DEFAULT 0 CHECK (key_fifths >= -7 AND key_fifths <= 7),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ear_training_adlib_pattern_groups IS
  'Reusable adlib phrase-pair pattern sets (e.g. CM7, Dm7).';

CREATE TABLE IF NOT EXISTS public.ear_training_adlib_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.ear_training_adlib_pattern_groups(id) ON DELETE CASCADE,
  label text NOT NULL,
  pcs smallint[] NOT NULL CHECK (array_length(pcs, 1) >= 1),
  family_id text NOT NULL,
  carry_tail_length smallint NOT NULL DEFAULT 0 CHECK (carry_tail_length >= 0),
  priority smallint NOT NULL DEFAULT 0,
  sort_order smallint NOT NULL DEFAULT 0 CHECK (sort_order >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, family_id, sort_order)
);

COMMENT ON TABLE public.ear_training_adlib_patterns IS
  'Pitch-class sequences for phrase-pair adlib matching within a group.';

CREATE TABLE IF NOT EXISTS public.ear_training_phrase_pair_adlib_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL UNIQUE REFERENCES public.ear_training_stages(id) ON DELETE CASCADE,
  bgm_url text NOT NULL,
  key_fifths smallint NOT NULL DEFAULT 0 CHECK (key_fifths >= -7 AND key_fifths <= 7),
  loop_duration_sec numeric NOT NULL DEFAULT 4 CHECK (loop_duration_sec > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ear_training_phrase_pair_adlib_config IS
  'Phrase-pair adlib stage: loop BGM and key signature.';

CREATE TABLE IF NOT EXISTS public.ear_training_phrase_pair_adlib_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id uuid NOT NULL REFERENCES public.ear_training_phrase_pair_adlib_config(id) ON DELETE CASCADE,
  order_index smallint NOT NULL CHECK (order_index >= 0),
  chord_name text NOT NULL,
  pattern_group_id uuid NOT NULL REFERENCES public.ear_training_adlib_pattern_groups(id) ON DELETE RESTRICT,
  measure_number integer CHECK (measure_number IS NULL OR measure_number >= 1),
  start_time_sec numeric NOT NULL DEFAULT 0 CHECK (start_time_sec >= 0),
  end_time_sec numeric NOT NULL CHECK (end_time_sec > start_time_sec),
  UNIQUE (config_id, order_index)
);

COMMENT ON TABLE public.ear_training_phrase_pair_adlib_steps IS
  'Timed chord steps; each step selects an adlib pattern group.';

CREATE OR REPLACE FUNCTION public.set_ear_training_phrase_pair_adlib_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ear_training_adlib_pattern_groups_updated_at
  ON public.ear_training_adlib_pattern_groups;
CREATE TRIGGER trg_ear_training_adlib_pattern_groups_updated_at
  BEFORE UPDATE ON public.ear_training_adlib_pattern_groups
  FOR EACH ROW EXECUTE FUNCTION public.set_ear_training_phrase_pair_adlib_updated_at();

DROP TRIGGER IF EXISTS trg_ear_training_phrase_pair_adlib_config_updated_at
  ON public.ear_training_phrase_pair_adlib_config;
CREATE TRIGGER trg_ear_training_phrase_pair_adlib_config_updated_at
  BEFORE UPDATE ON public.ear_training_phrase_pair_adlib_config
  FOR EACH ROW EXECUTE FUNCTION public.set_ear_training_phrase_pair_adlib_updated_at();

ALTER TABLE public.ear_training_adlib_pattern_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ear_training_adlib_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ear_training_phrase_pair_adlib_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ear_training_phrase_pair_adlib_steps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ear_training_adlib_pattern_groups_select_all ON public.ear_training_adlib_pattern_groups;
CREATE POLICY ear_training_adlib_pattern_groups_select_all
  ON public.ear_training_adlib_pattern_groups FOR SELECT USING (true);

DROP POLICY IF EXISTS ear_training_adlib_patterns_select_all ON public.ear_training_adlib_patterns;
CREATE POLICY ear_training_adlib_patterns_select_all
  ON public.ear_training_adlib_patterns FOR SELECT USING (true);

DROP POLICY IF EXISTS ear_training_phrase_pair_adlib_config_select_all ON public.ear_training_phrase_pair_adlib_config;
CREATE POLICY ear_training_phrase_pair_adlib_config_select_all
  ON public.ear_training_phrase_pair_adlib_config FOR SELECT USING (true);

DROP POLICY IF EXISTS ear_training_phrase_pair_adlib_steps_select_all ON public.ear_training_phrase_pair_adlib_steps;
CREATE POLICY ear_training_phrase_pair_adlib_steps_select_all
  ON public.ear_training_phrase_pair_adlib_steps FOR SELECT USING (true);

-- Admin write policies (mirror composite phrase migration)
DROP POLICY IF EXISTS ear_training_adlib_pattern_groups_insert_admin ON public.ear_training_adlib_pattern_groups;
CREATE POLICY ear_training_adlib_pattern_groups_insert_admin
  ON public.ear_training_adlib_pattern_groups FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

DROP POLICY IF EXISTS ear_training_adlib_pattern_groups_update_admin ON public.ear_training_adlib_pattern_groups;
CREATE POLICY ear_training_adlib_pattern_groups_update_admin
  ON public.ear_training_adlib_pattern_groups FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

DROP POLICY IF EXISTS ear_training_adlib_pattern_groups_delete_admin ON public.ear_training_adlib_pattern_groups;
CREATE POLICY ear_training_adlib_pattern_groups_delete_admin
  ON public.ear_training_adlib_pattern_groups FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

DROP POLICY IF EXISTS ear_training_adlib_patterns_insert_admin ON public.ear_training_adlib_patterns;
CREATE POLICY ear_training_adlib_patterns_insert_admin
  ON public.ear_training_adlib_patterns FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

DROP POLICY IF EXISTS ear_training_adlib_patterns_update_admin ON public.ear_training_adlib_patterns;
CREATE POLICY ear_training_adlib_patterns_update_admin
  ON public.ear_training_adlib_patterns FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

DROP POLICY IF EXISTS ear_training_adlib_patterns_delete_admin ON public.ear_training_adlib_patterns;
CREATE POLICY ear_training_adlib_patterns_delete_admin
  ON public.ear_training_adlib_patterns FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

DROP POLICY IF EXISTS ear_training_phrase_pair_adlib_config_insert_admin ON public.ear_training_phrase_pair_adlib_config;
CREATE POLICY ear_training_phrase_pair_adlib_config_insert_admin
  ON public.ear_training_phrase_pair_adlib_config FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

DROP POLICY IF EXISTS ear_training_phrase_pair_adlib_config_update_admin ON public.ear_training_phrase_pair_adlib_config;
CREATE POLICY ear_training_phrase_pair_adlib_config_update_admin
  ON public.ear_training_phrase_pair_adlib_config FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

DROP POLICY IF EXISTS ear_training_phrase_pair_adlib_config_delete_admin ON public.ear_training_phrase_pair_adlib_config;
CREATE POLICY ear_training_phrase_pair_adlib_config_delete_admin
  ON public.ear_training_phrase_pair_adlib_config FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

DROP POLICY IF EXISTS ear_training_phrase_pair_adlib_steps_insert_admin ON public.ear_training_phrase_pair_adlib_steps;
CREATE POLICY ear_training_phrase_pair_adlib_steps_insert_admin
  ON public.ear_training_phrase_pair_adlib_steps FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

DROP POLICY IF EXISTS ear_training_phrase_pair_adlib_steps_update_admin ON public.ear_training_phrase_pair_adlib_steps;
CREATE POLICY ear_training_phrase_pair_adlib_steps_update_admin
  ON public.ear_training_phrase_pair_adlib_steps FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

DROP POLICY IF EXISTS ear_training_phrase_pair_adlib_steps_delete_admin ON public.ear_training_phrase_pair_adlib_steps;
CREATE POLICY ear_training_phrase_pair_adlib_steps_delete_admin
  ON public.ear_training_phrase_pair_adlib_steps FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

GRANT SELECT ON public.ear_training_adlib_pattern_groups TO anon, authenticated;
GRANT SELECT ON public.ear_training_adlib_patterns TO anon, authenticated;
GRANT SELECT ON public.ear_training_phrase_pair_adlib_config TO anon, authenticated;
GRANT SELECT ON public.ear_training_phrase_pair_adlib_steps TO anon, authenticated;

-- Demo: CM7 pattern group + Dm7-G7-CM7-CM7 stage
DO $$
DECLARE
  v_ns uuid := 'a0000000-0000-4000-8000-000000000001'::uuid;
  v_group uuid := uuid_generate_v5(v_ns, 'dev-phrase-pair-cm7-group');
  v_stage uuid := uuid_generate_v5(v_ns, 'dev-phrase-pair-adlib-stage');
  v_cfg uuid;
  v_phrase uuid := uuid_generate_v5(v_ns, 'dev-phrase-pair-adlib-phrase');
BEGIN
  INSERT INTO public.ear_training_adlib_pattern_groups (id, name, label, key_fifths)
  VALUES (v_group, 'CM7', 'CM7 phrase pairs', 0)
  ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = now();

  DELETE FROM public.ear_training_adlib_patterns WHERE group_id = v_group;

  INSERT INTO public.ear_training_adlib_patterns (group_id, label, pcs, family_id, carry_tail_length, priority, sort_order) VALUES
    (v_group, 'A', ARRAY[0, 2]::smallint[], 'CM7-A', 0, 0, 0),
    (v_group, 'A', ARRAY[2, 0]::smallint[], 'CM7-A', 0, 0, 1),
    (v_group, 'B', ARRAY[4, 7]::smallint[], 'CM7-B', 0, 0, 2),
    (v_group, 'B', ARRAY[7, 4]::smallint[], 'CM7-B', 0, 0, 3),
    (v_group, 'C', ARRAY[9, 11]::smallint[], 'CM7-C', 0, 0, 4),
    (v_group, 'C', ARRAY[11, 9]::smallint[], 'CM7-C', 0, 0, 5),
    (v_group, 'D', ARRAY[11, 0]::smallint[], 'CM7-D', 1, 0, 6),
    (v_group, 'A''', ARRAY[2, 11, 0]::smallint[], 'CM7-Ap', 1, 0, 7),
    (v_group, 'A''', ARRAY[11, 2, 0]::smallint[], 'CM7-Ap', 1, 0, 8),
    (v_group, 'A''''', ARRAY[11, 2, 1, 11, 0]::smallint[], 'CM7-App', 1, 0, 9);

  INSERT INTO public.ear_training_stages (
    id, slug, title, title_en, description, description_en,
    bpm, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
    count_in_beats, time_limit_sec, player_hp, enemy_hp,
    per_correct_note_damage, good_completion_damage, great_completion_damage,
    perfect_completion_damage, miss_damage, fail_damage,
    perfect_max_misses, great_max_misses, background_theme,
    is_active, is_demo, mode
  ) VALUES (
    v_stage,
    'dev-phrase-pair-adlib-cm7',
    'フレーズペアアドリブ（CM7・開発）',
    'Phrase pair adlib CM7 (dev)',
    'CM7 ペアのみ。Dm7-G7-CM7-CM7 の1小節コード進行。',
    'CM7 pairs only. Dm7-G7-CM7-CM7 one bar each.',
    100, 4, 4, 4, 16, 0, 999, 100, 8000,
    50, 12, 18, 24, 8, 12, 4, 8, 'blue_club',
    true, true, 'phrase_pair_adlib'
  )
  ON CONFLICT (id) DO UPDATE SET mode = EXCLUDED.mode, is_demo = EXCLUDED.is_demo, updated_at = now();

  INSERT INTO public.ear_training_phrases (
    id, stage_id, order_index, title, title_en,
    music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
  ) VALUES (
    v_phrase, v_stage, 0,
    'ドラムループ', 'Drum loop',
    NULL, '', 4, 4, 0, 0
  )
  ON CONFLICT (id) DO UPDATE SET loop_duration_sec = EXCLUDED.loop_duration_sec;

  DELETE FROM public.ear_training_phrase_pair_adlib_steps WHERE config_id IN (
    SELECT id FROM public.ear_training_phrase_pair_adlib_config WHERE stage_id = v_stage
  );
  DELETE FROM public.ear_training_phrase_pair_adlib_config WHERE stage_id = v_stage;

  INSERT INTO public.ear_training_phrase_pair_adlib_config (
    stage_id, bgm_url, key_fifths, loop_duration_sec
  ) VALUES (
    v_stage,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    0,
    4
  )
  RETURNING id INTO v_cfg;

  INSERT INTO public.ear_training_phrase_pair_adlib_steps (
    config_id, order_index, chord_name, pattern_group_id,
    measure_number, start_time_sec, end_time_sec
  ) VALUES
    (v_cfg, 0, 'Dm7', v_group, 1, 0, 1),
    (v_cfg, 1, 'G7', v_group, 2, 1, 2),
    (v_cfg, 2, 'CM7', v_group, 3, 2, 3),
    (v_cfg, 3, 'CM7', v_group, 4, 3, 4);
END $$;
